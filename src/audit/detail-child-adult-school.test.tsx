import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { newChild, childStage } from '../engine/child'
import { canKidAct } from '../engine/family'
import { canShow } from '../engine/family-memory'
import { canSchool, childAtSchool, childTile, goToSleep, SCHOOL_SEAT, sendToSchool, type GameState } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { SchoolView } from '../features/child/SchoolView'
import { PLACES } from '../engine/world'
import { useGame } from '../store/game-store'

function enrolled() {
  const base = legacyGame(CONTENT)
  const ready: GameState = { ...base, homeLevel: 2, clock: { day: 93, minute: 600 }, coins: 100, scenes: [],
    child: { ...newChild(10, base.stats, 'hand'), name: '루시', inherited: 30, mode: 'home' },
    flags: { ...base.flags, childWalked: 1, childHelping: 1 },
    player: { ...base.player, ...PLACES.learnTable.stand!, path: [] } }
  const sent = sendToSchool(ready, 'wit')!
  expect(sent).not.toBeNull()
  return sent
}
const reload = (game: GameState) => deserialize(serialize(game), CONTENT)!
const morning = () => reload(goToSleep({ ...reload(enrolled()), clock: { day: 93, minute: 1320 } }, CONTENT))
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('012 성인 성장 전날 배움터 상태와 지연 입력', () => {
  it('전날 배움터 상태는 저장 복원해도 그날 18시까지만 유효하다', () => {
    const before = reload(enrolled())
    expect(childStage(before.child!, 93)).toBe('helper')
    expect(childAtSchool(before)).toBe(true)
    expect(childTile(before)).toEqual(SCHOOL_SEAT)
    expect(canKidAct(before, 'read')).toBe('school')
    expect(childAtSchool({ ...before, clock: { day: 93, minute: 1080 } })).toBe(false)
  })

  it('성인 아침에는 전날 표식이 남아 있어도 배움터 위치·막힘·중복 비용은 이어지지 않는다', () => {
    const next = morning()
    expect(childStage(next.child!, 94)).toBe('adult')
    expect(next.flags.schoolDay).toBe(93)
    expect(childAtSchool(next)).toBe(false)
    expect(childTile(next)).not.toEqual(SCHOOL_SEAT)
    expect(next.coins).toBe(85)
    expect(next.child!.stats.wit).toEqual(enrolled().child!.stats.wit)
    expect(next.child!.jobConfirmed).toBe(false)
  })

  it.each(['read', 'story', 'make'] as const)('성장 뒤 늦게 도착한 %s 입력은 보상·물건·시간·저장을 바꾸지 않는다', action => {
    const next = morning()
    useGame.getState().load(next)
    expect(canKidAct(next, action)).toBe('grown')
    useGame.getState().kidAct(action)
    expect(useGame.getState().game).toBe(next)
  })

  it('이미 알려진 성인 배움터 동작을 새 발견으로 세지 않고 실제 버튼·차감·제한을 대조한다', () => {
    const next = morning()
    useGame.getState().load(next)
    useGame.setState({ modal: { kind: 'school' }, toast: null })
    expect(canSchool(next)).toBeNull()
    render(<SchoolView />)
    expect(screen.getAllByRole('button', { name: '맡기기' })).toHaveLength(5)
    fireEvent.click(screen.getAllByRole('button', { name: '맡기기' })[0])
    const after = useGame.getState().game
    expect(after.coins).toBe(70)
    expect(childAtSchool(after)).toBe(true)
    expect(childTile(after)).toEqual(SCHOOL_SEAT)
    expect(after.child!.job).toBe(next.child!.job)
    useGame.getState().goSchool('wit')
    expect(useGame.getState().game).toBe(after)
    const restored = reload(after)
    expect(restored.flags.schoolDay).toBe(94)
    expect(restored.coins).toBe(70)
  })

  it('성인 배움터 창을 취소하거나 예전 발표 입력을 보내도 추가 경험치·기록을 만들지 않는다', () => {
    const next = morning()
    useGame.getState().load(next)
    useGame.setState({ modal: { kind: 'school' } })
    render(<SchoolView />)
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().game).toBe(next)
    expect(canShow(next, 'watch')).toBe('stage')
    useGame.getState().showAtSchool('watch')
    expect(useGame.getState().game).toBe(next)
  })
})
