import { act, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { cookOf } from '../../engine/cooking'
import { newGame, syncHome } from '../../engine/game'
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

describe('요리하기 화면', () => {
  it('화덕 메뉴에서 요리하기가 열리고 기존 빵 굽기도 그대로 있다', () => {
    useGame.setState({ game: start({ barley: 1, water: 1 }), modal: { kind: 'menu', place: 'hearth' } })
    const { getByText } = render(<PlaceMenu place="hearth" />)
    expect(getByText(T.ui.hearthBake)).toBeTruthy()
    act(() => fireEvent.click(getByText(C.open)))
    expect(useGame.getState().modal).toEqual({ kind: 'cooking' })
  })
  it('모르는 요리는 가르쳐 줄 이웃을 안내하고 빈 메뉴로 보이지 않는다', () => {
    useGame.setState({ game: start({}), modal: { kind: 'cooking' } })
    const { container } = render(<CookingView />)
    expect(container.textContent).toContain(C.unknownTitle)
    expect(container.textContent).toContain(C.dishes.honeyBread.name)
    expect(container.textContent).toContain(C.learnHint)
    expect(container.textContent).toContain(C.noFood)
  })
  it('콩 요리를 골라 시작하면 재료가 한 번 빠지고 손 동작 화면이 나온다', () => {
    useGame.setState({ game: start({ bean: 1, water: 1 }), modal: { kind: 'cooking' } })
    const { getByText, container } = render(<CookingView />)
    act(() => fireEvent.click(getByText(C.dishes.beanDish.name)))
    expect(container.textContent).toContain(C.startNote)
    act(() => fireEvent.click(getByText(C.start)))
    const g = useGame.getState().game
    expect(cookOf(g).run?.dish).toBe('beanDish')
    expect(count(g.inv, 'bean')).toBe(0)
    expect(container.textContent).toContain(C.dishes.beanDish.hands[0])
    expect(container.textContent).toContain(C.later)
  })
  it('재료가 모자라면 모자란 것과 얻는 방법을 보이고 시작 단추가 막힌다', () => {
    useGame.setState({ game: start({ bean: 1 }), modal: { kind: 'cooking' } })
    const { getByText, container } = render(<CookingView />)
    act(() => fireEvent.click(getByText(C.dishes.beanDish.name)))
    expect(container.textContent).toContain(C.how.water)
    expect((getByText(C.start) as HTMLButtonElement).disabled).toBe(true)
  })
  it('가방의 음식은 혼자 먹을 수 있고, 식탁은 자리가 없으면 안내한다', () => {
    useGame.setState({ game: start({ honeyBread: 1 }), modal: { kind: 'cooking' } })
    const { getByText, container } = render(<CookingView />)
    act(() => fireEvent.click(getByText(new RegExp(`${C.alone}`))))
    expect(count(useGame.getState().game.inv, 'honeyBread')).toBe(0)
    expect(container.textContent).toContain('먹었어요')
    act(() => fireEvent.click(getByText(C.toTable)))
    expect(container.textContent).toContain(C.tableNoSpace)
  })
  it('식탁이 있으면 차리고 혼자 앉아 먹고 치울 수 있다', () => {
    const s0 = start({ figPlate: 2 })
    syncHome(s0)
    let room: Furniture[] = [...s0.room]
    for (const [item, x, y, f] of [['table', 19, 112], ['chair', 19, 113, 'up'], ['chair', 20, 113, 'up']] as const) {
      room = [...room, placement(room, item, { x, y }, f as 'up' | undefined)!]
      syncHome({ ...s0, room })
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
