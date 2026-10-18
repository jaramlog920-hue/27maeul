import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { childMode, childStage, newChild, type ChildMode } from '../engine/child'
import { chestOf, goToSleep } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { FollowMenu } from '../features/companion/FollowMenu'
import { Review } from '../features/review/Review'
import { useGame } from '../store/game-store'

function seed(mode?: ChildMode, water = 0, chestWater?: number) {
  const base = legacyGame(CONTENT)
  const game = { ...base, homeLevel: 2 as const, clock: { day: 51, minute: 1320 }, inv: water ? { water } : {}, scenes: [],
    child: { ...newChild(10, base.stats, 'strength'), name: '루시', inherited: 30, ...(mode ? { mode } : {}) },
    flags: { ...base.flags, childWalked: 1, ...(chestWater !== undefined ? { 'unlock:supplyChest': 1 } : {}) },
    chest: chestWater !== undefined ? { water: chestWater } : {} }
  useGame.getState().load(game)
  useGame.setState({ modal: { kind: 'review', pieceId: null }, toast: null, piecePopups: [], copyResult: null })
  return game
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('010 걷는 아이에서 돕는 아이가 되는 첫 아침', () => {
  it.each([undefined, 'home', 'follow'] as const)('기존 모드 %s는 새 단계의 기본값/선택을 지키고 첫 도움과 메뉴가 일치한다', mode => {
    const before = seed(mode)
    expect(childStage(before.child, 51)).toBe('toddler')
    const morning = deserialize(serialize(goToSleep(before, CONTENT)), CONTENT)!
    expect(childStage(morning.child!, 52)).toBe('helper')
    expect(childMode(morning.child!, 52)).toBe(mode ?? 'roam')
    expect(morning.scenes.filter(s => s === 'childHelps')).toHaveLength(1)
    expect(morning.flags.childHelpDay).toBe(52)
    expect(morning.inv.water).toBe(1)
    // 배우자에게서 받은 born 1은 경험치에 25%를 더한다.
    expect(morning.child!.stats.strength.xp).toBe(12.5)
    useGame.getState().load(morning)
    render(<FollowMenu who="child" />)
    expect(screen.getByRole('button', { name: '혼자 다니게 두기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: mode === 'home' ? '집에 두기' : mode === 'follow' ? '데리고 다니기' : '혼자 다니게 두기' })).toBeDisabled()
  })

  it('성장 전 잠자기 취소는 첫 도움·수량·단계·모드를 바꾸지 않는다', () => {
    const before = seed('home', 98)
    render(<Review pieceId={null} />)
    fireEvent.click(screen.getByRole('button', { name: T.ui.stayUp }))
    useGame.getState().sleep()
    expect(useGame.getState().game).toBe(before)
    expect(before.inv.water).toBe(98)
    expect(childStage(before.child, 51)).toBe('toddler')
  })

  it.each([98, 99])('가방 물 %i에서 첫 도움: 한도 초과 때도 성공 알림과 기록은 동일하게 생성된다', water => {
    seed('home', water)
    useGame.getState().sleep()
    const morning = useGame.getState().game
    expect(morning.inv.water).toBe(Math.min(99, water + 1))
    expect(morning.flags.childHelpKind).toBe(3)
    expect(morning.flags.childFirstHelpPending).toBe(52)
    expect(morning.todayNotes).toContain('childHelp:strength')
    expect(useGame.getState().toast?.text).toBe('루시: 물이나 갈대를 날라 왔어요')
    expect(chestOf(morning)).toBeNull()
    const restored = deserialize(serialize(morning), CONTENT)!
    expect(restored.inv.water).toBe(morning.inv.water)
    expect(restored.flags.childHelpDay).toBe(52)
  })

  it('가방이 찼어도 궤짝에 한 칸의 여유가 있으면 도움 물건을 실제로 받는다', () => {
    const morning = goToSleep(seed('follow', 99, 29), CONTENT)
    expect(morning.inv.water).toBe(99)
    expect(morning.chest?.water).toBe(30)
    expect(morning.flags.childHelpKind).toBe(3)
  })

  it('가방과 궤짝이 모두 차면 물건은 늘지 않지만 첫 도움 성공 표식은 저장된다', () => {
    const morning = deserialize(serialize(goToSleep(seed('home', 99, 30), CONTENT)), CONTENT)!
    expect(morning.inv.water).toBe(99)
    expect(morning.chest?.water).toBe(30)
    expect(morning.todayNotes).toContain('childHelp:strength')
    expect(morning.flags.childHelpKind).toBe(3)
  })
})
