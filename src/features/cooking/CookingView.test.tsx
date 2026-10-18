import { establishedGame as newGame } from "../../engine/growth-test-support"
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T, itemName } from '../../content/text'
import { cookOf } from '../../engine/cooking'
import { syncHome } from '../../engine/game'
import { count } from '../../engine/items'
import { placement, type Furniture } from '../../engine/room'
import { setSpace } from '../../engine/space-life'
import { useGame } from '../../store/game-store'
import { PlaceMenu } from '../menus/PlaceMenu'
import { CookingView } from './CookingView'

const C = T.cooking
function start(inv: Record<string, number>) {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], inv: inv as never, clock: { day: 3, minute: 15 * 60 }, needs: { ...s.needs, hunger: 60, fatigue: 0 } }
}

// 요리 목록은 아이콘 칸 — 요리 칸을 고르고 "만들러 가기" (2026-10-12)
function pickDish(name: string) {
  act(() => fireEvent.click(screen.getByRole('button', { name })))
  act(() => fireEvent.click(screen.getByRole('button', { name: '만들기' })))
}

describe('요리하기 화면', () => {
  it('화덕 메뉴는 세 가지 행동만 보여주고 요리 화면에서 빵을 만든다', () => {
    useGame.setState({ game: start({ barley: 1, water: 1 }), modal: { kind: 'menu', place: 'hearth' } })
    const { getByText } = render(<PlaceMenu place="hearth" />)
    // 줄 모양: 이름(빵 굽기)과 아래 작은 재료 줄로 나뉜다
    expect(screen.queryByText(T.ui.hearthBake.split(' (')[0])).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(4)
    act(() => fireEvent.click(getByText(C.open)))
    expect(useGame.getState().modal).toEqual({ kind: 'cooking' })
  })
  it('모르는 요리는 가르쳐 줄 이웃 이름만 짧게, 설명 문장·빈 가방 칸은 없다', () => {
    useGame.setState({ game: start({}), modal: { kind: 'cooking' } })
    const { container } = render(<CookingView />)
    expect(container.textContent).toContain(C.unknownTitle)
    // 요리 목록은 아이콘 칸 (2026-10-12) — 이름은 칸의 이름으로
    expect(container.querySelector(`[aria-label="${C.dishes.honeyBread.name}"]`)).not.toBeNull()
    expect(container.textContent).not.toContain(C.learnHint)
    expect(container.textContent).not.toContain(C.noFood)
    expect(container.textContent).not.toContain(C.lead)
  })
  it('콩 요리를 골라 시작하면 재료가 한 번 빠지고 손 동작 화면이 나온다', () => {
    useGame.setState({ game: start({ bean: 1, water: 1 }), modal: { kind: 'cooking' } })
    const { getByText, container } = render(<CookingView />)
    pickDish(C.dishes.beanDish.name)
    act(() => fireEvent.click(getByText(C.start)))
    const g = useGame.getState().game
    expect(cookOf(g).run?.dish).toBe('beanDish')
    expect(count(g.inv, 'bean')).toBe(0)
    expect(container.textContent).toContain(C.dishes.beanDish.hands[0])
    expect(container.textContent).toContain(C.later)
  })
  it('재료가 모자라면 필요한 수를 보이고 만들기 단추를 막는다', () => {
    useGame.setState({ game: start({ bean: 1 }), modal: { kind: 'cooking' } })
    const { container } = render(<CookingView />)
    fireEvent.click(screen.getByRole('button', { name: C.dishes.beanDish.name }))
    const before = useGame.getState().game
    const button = screen.getByRole('button', { name: '재료 부족' })
    expect(button).toBeDisabled()
    expect(container.textContent).toContain('0/1')
    fireEvent.click(button)
    expect(useGame.getState().game).toBe(before)
    expect(cookOf(before).run).toBeUndefined()
  })
  it('가방의 음식은 혼자 먹을 수 있고, 식탁은 자리가 없으면 안내한다', () => {
    useGame.setState({ game: start({ honeyBread: 1 }), modal: { kind: 'cooking' } })
    const { getByText, container } = render(<CookingView />)
    // 가방 음식 칸을 고르고 '먹기'
    act(() => fireEvent.click(screen.getAllByRole('button', { name: itemName('honeyBread') }).at(-1)!)) // 맨 아래 가방 음식 칸
    act(() => fireEvent.click(screen.getByRole('button', { name: '먹기' })))
    expect(count(useGame.getState().game.inv, 'honeyBread')).toBe(0)
    expect(container.textContent).toContain('먹었어요')
    act(() => fireEvent.click(getByText(C.toTable)))
    expect(container.textContent).toContain(C.tableNoSpace)
  })
  it('식탁이 있으면 차리고 혼자 앉아 먹고 치울 수 있다', () => {
    const s0 = { ...start({ figPlate: 2 }), homeLevel: 3 as const } // 넓힌 집 (작업실만으로는 식탁·의자 자리가 모자라다)
    syncHome(s0)
    // 집 붙박이가 옮겨져도 되게: 식탁과 그 아래 의자 둘이 함께 놓이는 첫 자리를 찾는다 (2026-10-12)
    let room: Furniture[] = []
    for (let y = 104; y < 118 && !room.length; y++) search: for (let x = 6; x < 31; x++) {
      syncHome(s0)
      let r: Furniture[] = [...s0.room]
      for (const [item, dx, dy, f] of [['table', 0, 0], ['chair', 0, 1, 'up'], ['chair', 1, 1, 'up']] as const) {
        const p = placement(r, item, { x: x + dx, y: y + dy }, f as 'up' | undefined)
        if (!p) continue search
        r = [...r, p]
        syncHome({ ...s0, room: r })
      }
      room = r
      break
    }
    const g = setSpace({ ...s0, room }, room.find((f) => f.item === 'table')!, 'tea')!
    useGame.setState({ game: g, modal: { kind: 'cooking' } })
    const { getByText, container } = render(<CookingView />)
    act(() => fireEvent.click(getByText(C.toTable)))
    act(() => fireEvent.click(getByText(/접시 차리기/)))
    expect(cookOf(useGame.getState().game).table?.left).toBe(1)
    act(() => fireEvent.click(getByText(C.sitAlone)))
    expect(container.textContent).toContain(C.sat)
    expect(cookOf(useGame.getState().game).table).toBeUndefined()
  })
})
