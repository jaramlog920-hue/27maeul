import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { childStage, newChild } from '../engine/child'
import { goToSleep, type GameState } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { Family } from '../features/family/Family'
import { useGame } from '../store/game-store'

function morning() {
  const base = legacyGame(CONTENT)
  const older = { ...newChild(10, base.stats, 'hand'), name: '큰아이', inherited: 30, job: 'cook' as const, jobConfirmed: false, left: false,
    mode: 'home' as const }
  const younger = { ...newChild(52, base.stats, 'hand'), name: '작은아이', inherited: 30, mode: 'home' as const,
    kidFlags: { childWalked: 1, childHelping: 1 } }
  const before: GameState = { ...base, homeLevel: 2, clock: { day: 135, minute: 1320 }, child: older, siblings: [younger], scenes: [],
    flags: { ...base.flags, childWalked: 1, childHelping: 1 } }
  expect(childStage(younger, before.clock.day)).toBe('helper')
  const next = goToSleep(before, CONTENT)
  useGame.getState().load(next)
  useGame.setState({ modal: { kind: 'family' }, toast: null, piecePopups: [], copyResult: null })
  return next
}
function Flow() {
  const modal = useGame(s => s.modal)
  return modal?.kind === 'family' ? <Family /> : null
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('011 성인 첫 아침 진로 선택 중 다른 아이로 전환', () => {
  it('새로 어른이 된 아이의 추천만 표시하고, 확정 전에는 거주 이동 단추를 열지 않는다', () => {
    const next = morning()
    expect(next.clock.day).toBe(136)
    expect(next.child).toMatchObject({ born: 52, job: 'woodworker', jobConfirmed: false })
    render(<Flow />)
    expect(screen.getByRole('combobox', { name: '진로' })).toHaveValue('woodworker')
    expect(screen.queryByRole('button', { name: '공동 주택에서 살기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: T.family.time.open })).not.toBeInTheDocument()
    const before = useGame.getState().game
    useGame.getState().setChildResidence('lodging')
    useGame.getState().kidAct('read')
    expect(useGame.getState().game).toBe(before)
  })

  // 고쳐짐 (2026-10-18 감사 L-39 / 세부 검사 D008): 고른 진로는 그 아이에게만 남는다
  it('작은아이의 미확정 선택은 큰아이로 넘어가지 않고, 큰아이는 제 진로로 확정·저장된다', () => {
    morning()
    render(<Flow />)
    fireEvent.change(screen.getByRole('combobox', { name: '진로' }), { target: { value: 'sailor' } })
    expect(useGame.getState().game.child).toMatchObject({ name: '작은아이', job: 'woodworker', jobConfirmed: false })
    fireEvent.click(screen.getByRole('button', { name: /큰아이 어른/ }))
    expect(useGame.getState().game.child).toMatchObject({ name: '큰아이', job: 'cook', jobConfirmed: false })
    expect(screen.getByText('큰아이가 요리사 일을 하고 싶어해요. 함께 진로를 정해요.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '진로' })).toHaveValue('cook')
    fireEvent.click(screen.getByRole('button', { name: '이 진로로 함께 결정하기' }))
    const restored = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(restored.child).toMatchObject({ name: '큰아이', job: 'cook', jobConfirmed: true })
    expect(restored.siblings?.find(c => c.name === '작은아이')).toMatchObject({ job: 'woodworker', jobConfirmed: false })
    useGame.getState().chooseChildCareer('sailor')
    expect(useGame.getState().game.child?.job).toBe('cook')
  })

  it('대조: 확정 없이 창을 닫았다 다시 열면 추천 진로로 돌아가며 저장 데이터는 바뀌지 않는다', () => {
    morning()
    render(<Flow />)
    fireEvent.change(screen.getByRole('combobox', { name: '진로' }), { target: { value: 'sailor' } })
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    act(() => useGame.getState().open({ kind: 'family' }))
    expect(screen.getByRole('combobox', { name: '진로' })).toHaveValue('woodworker')
    expect(useGame.getState().game.child?.jobConfirmed).toBe(false)
    expect(useGame.getState().game.child?.job).toBe('woodworker')
  })
})
