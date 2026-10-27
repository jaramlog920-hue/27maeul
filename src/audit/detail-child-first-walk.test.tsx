import { act, fireEvent, render, screen } from '@testing-library/react'
import { kidPersona, likedActs } from '../engine/persona'
import { LIKED_CLOSE_BONUS } from '../engine/family'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { childMode, childStage, CRADLE_SPOT, newChild } from '../engine/child'
import { careBaby, childTile, goToSleep, syncHome } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { canKidAct } from '../engine/family'
import { placement } from '../engine/room'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { FollowMenu } from '../features/companion/FollowMenu'
import { KidTime } from '../features/family/KidTime'
import { Review } from '../features/review/Review'
import { useGame } from '../store/game-store'

function seed() {
  const base = legacyGame(CONTENT)
  const stats = { ...base.stats, wit: { level: 3, xp: 10, born: 0 } }
  const game = { ...base, stats, homeLevel: 2 as const, clock: { day: 23, minute: 1320 }, scenes: [],
    child: { ...newChild(10, stats, 'hand'), name: '루시', close: 10 },
    romance: { ...base.romance, stage: 'married' as const, partner: 'poppy', marriedDay: 1 } }
  syncHome(game)
  const crib = placement(game.room, 'homeCradle', CRADLE_SPOT)!
  expect(crib).not.toBeNull()
  const ready = { ...game, room: [...game.room, crib], player: { ...game.player, x: crib.x + 1, y: crib.y, path: [] } }
  useGame.getState().load(ready)
  useGame.setState({ modal: { kind: 'follow', who: 'child' }, toast: null, piecePopups: [], copyResult: null })
  return ready
}
const reload = (g: ReturnType<typeof seed>) => deserialize(serialize(g), CONTENT)!
function Flow() {
  const m = useGame(s => s.modal)
  return m?.kind === 'follow' ? <FollowMenu who="child" /> : m?.kind === 'review' ? <Review pieceId={null} />
    : m?.kind === 'kidTime' ? <KidTime done={m.done} spouse={m.spouse} /> : null
}
const openChild = () => act(() => useGame.getState().open({ kind: 'follow', who: 'child' }))
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('007 아기에서 걷는 아이가 되는 아침', () => {
  it('밤의 요람 메뉴는 잠 취소 후 유지되고 실제 성장 아침에만 동행 메뉴로 바뀐다', () => {
    const before = seed()
    render(<Flow />)
    expect(screen.getByText('요람에서 새근새근 자고 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '안아 주기' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '데리고 다니기' })).not.toBeInTheDocument()
    act(() => useGame.getState().open({ kind: 'review', pieceId: null }))
    fireEvent.click(screen.getByRole('button', { name: T.ui.stayUp }))
    expect(useGame.getState().game).toBe(before)
    openChild()
    expect(screen.getByRole('button', { name: '안아 주기' })).toBeEnabled()
    act(() => useGame.getState().open({ kind: 'review', pieceId: null }))
    fireEvent.click(screen.getByRole('button', { name: T.ui.sleep }))
    const morning = useGame.getState().game
    expect(morning.clock.day).toBe(24)
    expect(childStage(morning.child!, 24)).toBe('toddler')
    expect(morning.scenes.filter(id => id === 'childWalks')).toHaveLength(1)
    openChild()
    expect(screen.queryByRole('button', { name: '안아 주기' })).not.toBeInTheDocument()
    expect(screen.getByText('지금은 곁을 따라다녀요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '데리고 다니기' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '집에 두기' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '혼자 다니게 두기' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: T.family.time.open })).toBeEnabled()
  })

  it('성장 전 돌보기 성공 뒤 성장 후 지연 돌보기는 가까움·돌본 날·동작을 바꾸지 않는다', () => {
    const before = seed()
    // 밤의 아기는 자고 있어 맞는 돌보기는 이불 덮기 (2026-10-27 아기 상태)
    const cared = careBaby(before, 'tuck')!
    expect(cared.child!.close).toBe(12)
    expect(cared.child!.cared).toBe(1)
    const morning = goToSleep(cared, CONTENT)
    useGame.getState().load(morning)
    for (const action of ['hold', 'soothe', 'lay', 'tuck'] as const) {
      expect(careBaby(morning, action)).toBeNull()
      useGame.getState().careBaby(action)
      expect(useGame.getState().game).toBe(morning)
    }
  })

  it('성장 아침의 물려받기와 첫걸음은 복원과 다음 아침에서 중복되지 않는다', () => {
    const morning = goToSleep(reload(seed()), CONTENT)
    expect(morning.child!.inherited).toBeGreaterThanOrEqual(20)
    expect(morning.child!.inherited).toBeLessThanOrEqual(50)
    const restored = deserialize(serialize(morning), CONTENT)!
    expect(restored.child).toEqual(morning.child)
    expect(restored.scenes.filter(id => id === 'childWalks')).toHaveLength(1)
    const later = goToSleep(restored, CONTENT)
    expect(later.child!.inherited).toBe(morning.child!.inherited)
    expect(later.child!.stats).toEqual(morning.child!.stats)
    expect(later.scenes.filter(id => id === 'childWalks')).toHaveLength(1)
  })

  it('성장 아침에 집에 두기·다시 데리고 다니기를 하면 안내와 위치가 복원 후에도 일치한다', () => {
    const morning = goToSleep(seed(), CONTENT)
    useGame.getState().load(morning)
    openChild()
    render(<Flow />)
    fireEvent.click(screen.getByRole('button', { name: '집에 두기' }))
    const home = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(childMode(home.child!, home.clock.day)).toBe('home')
    act(() => useGame.getState().load(home))
    openChild()
    expect(screen.getByText('지금은 집에서 기다려요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '집에 두기' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '데리고 다니기' }))
    const follow = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(childMode(follow.child!, follow.clock.day)).toBe('follow')
    const at = childTile(follow)!
    expect(Math.abs(at.x - follow.player.x) + Math.abs(at.y - follow.player.y)).toBe(1)
  })

  it('첫 함께하기는 성장 후에 열리며 메뉴 취소는 가까움·수량·경험치를 바꾸지 않는다', () => {
    const before = seed()
    expect(canKidAct(before, 'read')).toBe('baby')
    const morning = goToSleep(before, CONTENT)
    expect(canKidAct(morning, 'read')).toBeNull()
    useGame.getState().load(morning)
    openChild()
    render(<Flow />)
    fireEvent.click(screen.getByRole('button', { name: T.family.time.open }))
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().game).toBe(morning)
    act(() => useGame.getState().kidAct('read'))
    const after = useGame.getState().game
    expect(after.child!.close).toBe((morning.child!.close ?? 0) + 1 + (likedActs(kidPersona(morning.child!, morning.clock.day)).has('read') ? LIKED_CLOSE_BONUS : 0))
    expect(after.flags.kidActs).toBe(1)
    expect(after.child!.stats.wit).not.toEqual(morning.child!.stats.wit)
    expect(useGame.getState().modal).toMatchObject({ kind: 'kidTime', done: { act: 'read' } })
  })
})
