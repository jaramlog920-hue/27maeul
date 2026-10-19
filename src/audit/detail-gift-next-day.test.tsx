import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { advance, MINUTE_CAP } from '../engine/clock'
import { dailyHeartGain, goToSleep, heartUp } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { isBirthday } from '../engine/notebook'
import { deserialize, saveGame, serialize, setActiveSlot } from '../engine/save'
import { Review } from '../features/review/Review'
import { TalkBox } from '../features/talk/TalkBox'
import { useGame } from '../store/game-store'

function seed(day = 20, grapes = 3) {
  const base = legacyGame(CONTENT)
  expect(isBirthday('baker', day)).toBe(false)
  expect(isBirthday('baker', day + 1)).toBe(false)
  const game = heartUp({ ...base, clock: { day, minute: 22 * 60 }, hearts: { ...base.hearts, baker: 26 }, inv: { grapes }, scenes: [], gifted: [] }, 'baker', 3)
  useGame.getState().load(game)
  useGame.setState({ toast: null, modal: null, piecePopups: [], copyResult: null })
  useGame.getState().gift('baker', 'grapes')
  const given = useGame.getState().game
  expect(given.hearts.baker).toBe(32)
  expect(dailyHeartGain(given, 'baker')).toBe(6)
  expect(given.inv.basket).toBe(1)
  return given
}
const reload = (game: ReturnType<typeof seed>) => deserialize(serialize(game), CONTENT)!
const talk = { kind: 'talk', neighborId: 'baker', line: '검사용 대화' } as const
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('006 선물 제한의 밤 넘김과 다음 날 초기화', () => {
  it('자정과 02:00 제한까지 깨어 있으면 같은 게임 날짜이며 선물 제한도 유지한다', () => {
    const before = seed()
    const awake = reload({ ...before, clock: advance(before.clock, 10_000) })
    expect(awake.clock).toEqual({ day: 20, minute: MINUTE_CAP })
    expect(awake.gifted).toEqual(['baker'])
    useGame.getState().load(awake)
    render(<TalkBox modal={talk} />)
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'true')
    useGame.getState().gift('baker', 'grapes')
    expect(useGame.getState().game).toBe(awake)
  })

  it.each([1379, 1380, MINUTE_CAP])('%i분 잠들기는 다음 날 한 번만 풀리고 이전 일일 관계 상한은 적용되지 않는다', minute => {
    const before = seed()
    const morning = reload(goToSleep(reload({ ...before, clock: { ...before.clock, minute } }), CONTENT))
    expect(morning.clock).toEqual({ day: 21, minute: minute >= 1380 ? 480 : 360 })
    expect(morning.gifted).toEqual([])
    expect(dailyHeartGain(morning, 'baker')).toBe(0)
    expect(morning.inv.grapes).toBe(2)
    expect(morning.inv.basket).toBe(1)
    useGame.getState().load(morning)
    useGame.getState().gift('baker', 'grapes')
    const twice = useGame.getState().game
    expect(twice.hearts.baker).toBe(35)
    expect(twice.inv.grapes).toBe(1)
    expect(twice.inv.basket).toBe(1)
    expect(twice.gifted).toEqual(['baker'])
    expect(dailyHeartGain(twice, 'baker')).toBe(3)
    expect(twice.scenes.filter(id => id === 'gift:baker:3')).toHaveLength(1)
  })

  it('잠자기 취소는 제한을 유지하며 실제 잠들기 뒤 버튼이 다시 활성화된다', () => {
    const before = seed()
    useGame.setState({ modal: { kind: 'review', pieceId: null } })
    const view = render(<Review pieceId={null} />)
    fireEvent.click(screen.getByRole('button', { name: T.ui.stayUp }))
    expect(useGame.getState().game).toBe(before)
    useGame.getState().sleep()
    expect(useGame.getState().game).toBe(before)
    useGame.setState({ modal: { kind: 'review', pieceId: null } })
    fireEvent.click(screen.getByRole('button', { name: T.ui.sleep }))
    const morning = useGame.getState().game
    expect(morning.clock.day).toBe(21)
    expect(morning.gifted).toEqual([])
    useGame.getState().sleep()
    expect(useGame.getState().game).toBe(morning)
    view.rerender(<TalkBox modal={talk} />)
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'false')
    act(() => useGame.getState().gift('baker', 'grapes'))
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'true')
  })

  it('다음 날 제한이 풀려도 물건이 없으면 비활성, 재획득하면 활성화된다', () => {
    const morning = reload(goToSleep(seed(20, 1), CONTENT))
    expect(morning.gifted).toEqual([])
    expect(morning.inv.grapes ?? 0).toBe(0)
    useGame.getState().load({ ...morning, inv: { basket: 1 } })
    render(<TalkBox modal={talk} />)
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'true')
    act(() => useGame.setState({ game: { ...useGame.getState().game, inv: { basket: 1, grapes: 1 } } }))
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'false')
  })

  it('계절 마지막 날을 저장 복원한 뒤 자도 다음 날의 제한과 보상이 일치한다', () => {
    const before = seed(40)
    saveGame(before)
    const morning = reload(goToSleep(reload(before), CONTENT))
    expect(morning.clock.day).toBe(41)
    expect(morning.gifted).toEqual([])
    useGame.getState().load(morning)
    useGame.getState().gift('baker', 'grapes')
    const after = reload(useGame.getState().game)
    expect(after.gifted).toEqual(['baker'])
    expect(after.inv.grapes).toBe(1)
    expect(after.inv.basket).toBe(1)
    expect(after.hearts.baker).toBe(35)
  })

  it('배고픔 한도로 아픈 아침 10시에 깨는 분기도 다음 날 기회를 정상적으로 연다', () => {
    const before = seed()
    const morning = reload(goToSleep({ ...before, needs: { ...before.needs, hunger: 100 } }, CONTENT))
    expect(morning.clock).toEqual({ day: 21, minute: 600 })
    expect(morning.scenes).toContain('sick')
    expect(morning.gifted).toEqual([])
    expect(dailyHeartGain(morning, 'baker')).toBe(0)
    useGame.getState().load(morning)
    useGame.getState().gift('baker', 'grapes')
    expect(useGame.getState().game.hearts.baker).toBe(35)
    expect(useGame.getState().game.inv.basket).toBe(1)
    expect(useGame.getState().game.inv.grapes).toBe(1)
  })
})
