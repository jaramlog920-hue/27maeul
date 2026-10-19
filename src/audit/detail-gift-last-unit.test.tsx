import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { legacyGame } from '../engine/growth-test-support'
import { isBirthday } from '../engine/notebook'
import { deserialize, saveGame, serialize, setActiveSlot, slotKey } from '../engine/save'
import { GiftPicker } from '../features/talk/GiftPicker'
import { TalkBox } from '../features/talk/TalkBox'
import { useGame } from '../store/game-store'

function seed(grapes = 1) {
  const base = legacyGame(CONTENT)
  const game = { ...base, inv: { grapes, bread: 2 }, hearts: { ...base.hearts, baker: 29 }, gifted: [], scenes: [], clock: { day: 7, minute: 600 } }
  expect(isBirthday('baker', game.clock.day)).toBe(false)
  useGame.getState().load(game)
  useGame.setState({ toast: null, modal: { kind: 'gift', neighborId: 'baker' } })
  saveGame(game)
  return game
}
function GiftFlow() {
  const modal = useGame(s => s.modal)
  return modal?.kind === 'gift' ? <GiftPicker neighborId={modal.neighborId} />
    : modal?.kind === 'talk' ? <TalkBox modal={modal} /> : null
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('005 마지막 선물·같은 날 재시도·관계 보상', () => {
  it('마지막 포도 클릭으로 선물 창이 답례로 전환되고 남은 빵이 있어도 재선물은 비활성화된다', () => {
    const before = seed()
    render(<GiftFlow />)
    fireEvent.click(screen.getByRole('button', { name: /포도.* 1$/ }))
    const after = useGame.getState().game
    expect(after.inv.grapes ?? 0).toBe(0)
    expect(after.inv.bread).toBe(2)
    expect(after.gifted).toEqual(['baker'])
    expect(after.hearts.baker).toBe(32)
    expect(after.stats.charm.xp).toBe(before.stats.charm.xp + 2)
    expect(after.inv.basket).toBe(1)
    expect(after.scenes.filter(s => s === 'gift:baker:3')).toHaveLength(1)
    expect(screen.queryByRole('dialog', { name: T.ui.giftPick })).not.toBeInTheDocument()
    expect(screen.getByText(T.giftReplies.liked)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'true')
  })

  it('연속 호출·다른 물건 재시도는 수량·관계·경험치·보상·저장을 전부 보존한다', () => {
    seed()
    useGame.getState().gift('baker', 'grapes')
    const once = useGame.getState()
    const stored = localStorage.getItem(slotKey('1'))
    for (const item of ['grapes', 'bread', 'bread'] as const) useGame.getState().gift('baker', item)
    expect(useGame.getState().game).toBe(once.game)
    expect(useGame.getState().modal).toBe(once.modal)
    expect(localStorage.getItem(slotKey('1'))).toBe(stored)
  })

  it('물건이 먼저 없어졌다면 실패가 하루 기회를 쓰지 않으며 다른 유효 선물은 가능하다', () => {
    const before = seed(0)
    const stored = localStorage.getItem(slotKey('1'))
    useGame.getState().gift('baker', 'grapes')
    expect(useGame.getState().game).toBe(before)
    expect(useGame.getState().modal).toEqual({ kind: 'gift', neighborId: 'baker' })
    expect(localStorage.getItem(slotKey('1'))).toBe(stored)
    useGame.getState().gift('baker', 'bread')
    expect(useGame.getState().game.gifted).toEqual(['baker'])
    expect(useGame.getState().game.inv.bread).toBe(1)
  })

  it('선물 선택 취소는 수량·하루 기회·저장을 바꾸지 않는다', () => {
    const before = seed()
    const stored = localStorage.getItem(slotKey('1'))
    render(<GiftFlow />)
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game).toBe(before)
    expect(localStorage.getItem(slotKey('1'))).toBe(stored)
  })

  it('복원 뒤 포도를 다시 얻어도 같은 날 재선물·보상 중복이 막히며 UI도 같다', () => {
    seed()
    useGame.getState().gift('baker', 'grapes')
    const once = useGame.getState().game
    const restored = deserialize(serialize(once), CONTENT)!
    expect(restored.gifted).toEqual(['baker'])
    expect(restored.inv).toEqual(once.inv)
    expect(restored.giftsGot).toEqual(once.giftsGot)
    expect(restored.hearts).toEqual(once.hearts)
    expect(restored.stats).toEqual(once.stats)
    expect(restored.scenes.filter(s => s === 'gift:baker:3')).toHaveLength(1)
    const restocked = { ...restored, inv: { ...restored.inv, grapes: 1 } }
    useGame.getState().load(restocked)
    useGame.setState({ modal: { kind: 'talk', neighborId: 'baker', line: T.giftReplies.liked } })
    render(<GiftFlow />)
    expect(screen.getByRole('button', { name: T.ui.talkGift })).toHaveAttribute('aria-disabled', 'true')
    useGame.getState().gift('baker', 'grapes')
    expect(useGame.getState().game).toBe(restocked)
  })

  it('다른 이웃에게 없는 마지막 물건을 주려는 실패는 그 이웃의 하루 기회를 쓰지 않는다', () => {
    seed()
    useGame.getState().gift('baker', 'grapes')
    const once = useGame.getState().game
    useGame.getState().gift('smith', 'grapes')
    expect(useGame.getState().game).toBe(once)
    useGame.getState().gift('smith', 'bread')
    expect(useGame.getState().game.gifted).toEqual(['baker', 'smith'])
    expect(useGame.getState().game.inv.bread).toBe(1)
    expect(useGame.getState().game.inv.basket).toBe(1)
  })
})
