import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT, PEOPLE } from '../content/catalog'
import { moveFurniture, syncHome } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { deserialize, serialize, setActiveSlot } from '../engine/save'
import { DecorateBar } from '../features/play/DecorateBar'
import { useGame } from '../store/game-store'

const at = { x: 20, y: 112 }
const to = { x: 22, y: 113 }
function earned() {
  const base = legacyGame(CONTENT)
  const game = { ...base, clock: { day: 20, minute: 600 }, hearts: { ...base.hearts, smith: 89 }, inv: { bread: 1, vase: 1 }, gifted: [], scenes: [],
    life: { ...base.life, seen: [...base.life.seen, ...(PEOPLE.people.smith.events?.map(e => e.id) ?? [])] },
    player: { ...base.player, x: 20, y: 114, path: [] } }
  syncHome(game)
  useGame.getState().load(game)
  useGame.setState({ toast: null, modal: null, piecePopups: [], copyResult: null })
  useGame.getState().gift('smith', 'bread')
  return useGame.getState().game
}
function used() {
  earned()
  useGame.getState().startDecorate('nightstand')
  useGame.getState().tap(at)
  useGame.getState().startDecorate('vase')
  useGame.getState().tap(at)
  return useGame.getState().game
}
beforeEach(() => { localStorage.clear(); setActiveSlot('1'); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) })
afterEach(() => vi.restoreAllMocks())

describe('008 대장장이 보상 협탁의 실제 상판 사용', () => {
  it('실제 대장장이 관계 보상은 설치 가능한 협탁 한 개를 주고 설치 후에만 가방에서 빠진다', () => {
    const got = earned()
    expect(got.hearts.smith).toBe(92)
    expect(got.inv.nightstand).toBe(1)
    expect(got.giftsGot).toContain('nightstand')
    expect(got.scenes).toContain('gift:smith:9')
    useGame.getState().startDecorate('nightstand')
    render(<DecorateBar />)
    expect(screen.getByRole('button', { name: '협탁' })).toHaveAttribute('aria-pressed', 'true')
    useGame.getState().tap(at)
    const placed = useGame.getState().game
    expect(placed.inv.nightstand ?? 0).toBe(0)
    expect(placed.room.filter(f => f.item === 'nightstand')).toEqual([expect.objectContaining(at)])
  })

  it('꽃병을 협탁 위에 실제 놓으면 on 표식과 수량이 복원 뒤에도 보존된다', () => {
    const placed = used()
    expect(placed.inv.vase ?? 0).toBe(0)
    expect(placed.room.find(f => f.item === 'vase')).toMatchObject({ ...at, on: true })
    const restored = deserialize(serialize(placed), CONTENT)!
    expect(restored.room.filter(f => ['vase', 'nightstand'].includes(f.item))).toEqual(placed.room.filter(f => ['vase', 'nightstand'].includes(f.item)))
    expect(restored.inv).toEqual(placed.inv)
    expect(restored.giftsGot).toContain('nightstand')
  })

  it('물건을 올린 한 칸 협탁을 탭하면 위 꽃병만 선택되어 옮기기는 꽃병만 대상으로 한다', () => {
    used()
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(at)
    expect(useGame.getState().decorSel).toMatchObject({ item: 'vase', on: true })
    render(<DecorateBar />)
    expect(document.querySelector('.decorate-sel-name')).toHaveTextContent('꽃병')
    fireEvent.click(screen.getByRole('button', { name: '옮기기' }))
    useGame.getState().tap(to)
    const moved = useGame.getState().game
    expect(moved.room.find(f => f.item === 'nightstand')).toMatchObject(at)
    expect(moved.room.find(f => f.item === 'vase')).toMatchObject(to)
    expect(moved.room.find(f => f.item === 'vase')?.on).toBeUndefined()
  })

  it('엔진은 협탁과 위 물건을 한 번에 옮길 수 있지만 현재 탭 선택과는 다르다', () => {
    const placed = used()
    const stand = placed.room.find(f => f.item === 'nightstand')!
    const moved = moveFurniture(placed, stand, to)!
    expect(moved).not.toBeNull()
    expect(moved.room.find(f => f.item === 'nightstand')).toMatchObject(to)
    expect(moved.room.find(f => f.item === 'vase')).toMatchObject({ ...to, on: true })
    expect(moved.inv).toEqual(placed.inv)
  })

  it('꽃병을 먼저 회수하면 협탁도 회수할 수 있고 저장 후 다시 둘 다 사용할 수 있다', () => {
    used()
    useGame.getState().startDecorate('pick')
    useGame.getState().tap(at)
    useGame.getState().removeSelected()
    expect(useGame.getState().game.inv.vase).toBe(1)
    useGame.getState().tap(at)
    expect(useGame.getState().decorSel?.item).toBe('nightstand')
    useGame.getState().removeSelected()
    const back = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(back.inv.nightstand).toBe(1)
    expect(back.inv.vase).toBe(1)
    useGame.getState().load(back)
    useGame.getState().startDecorate('nightstand')
    useGame.getState().tap(to)
    useGame.getState().startDecorate('vase')
    useGame.getState().tap(to)
    const again = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(again.room.filter(f => f.item === 'nightstand')).toHaveLength(1)
    expect(again.room.filter(f => f.item === 'vase')).toEqual([expect.objectContaining({ ...to, on: true })])
    expect(again.inv.nightstand ?? 0).toBe(0)
    expect(again.inv.vase ?? 0).toBe(0)
  })
})
