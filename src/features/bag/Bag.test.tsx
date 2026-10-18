import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT } from '../../content/catalog'
import { ITEM_TEXT, T } from '../../content/text'
import { RECIPES, type RecipeId } from '../../engine/items'
import { ICONS } from '../../render/sprites'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { Bag } from './Bag'

describe('가방: 아이콘 칸', () => {
  beforeEach(() => useGame.setState({ game: { ...newGame(CONTENT), inv: { bread: 2, ink: 1 } }, modal: { kind: 'bag' } }))
  it('아이콘만 칸에 늘어놓고, 누르면 이름·개수·설명', () => {
    const { container } = render(<Bag />)
    expect(container.querySelectorAll('.bag-slot:not(.empty)')).toHaveLength(2)
    expect(container.querySelectorAll('.bag-slot').length).toBe(12)
    expect(container.textContent).not.toContain(ITEM_TEXT.bread.desc)
    act(() => fireEvent.click(container.querySelector('[aria-label="빵 2"]')!))
    expect(container.querySelector('.bag-detail')!.textContent).toContain(ITEM_TEXT.bread.desc)
  })
  it('몸 상태·능력치 줄을 누르면 설명', () => {
    const { container } = render(<Bag />)
    act(() => fireEvent.click(container.querySelector('.need-tap')!))
    expect(container.querySelector('.needs .tap-explain')!.textContent).toContain('배고픔')
    act(() => fireEvent.click(container.querySelector('[data-stat="hand"]')!))
    expect(container.querySelector('.stats .tap-explain')).not.toBeNull()
  })
})

describe('가방: 만들 줄 아는 것', () => {
  beforeEach(() => useGame.setState({ game: { ...newGame(CONTENT), recipesKnown: ['bread', 'papyrus'] }, modal: { kind: 'bag' } }))
  it('가방과 같은 아이콘 칸에서 선택한 제작법의 재료만 보여 준다', async () => {
    const before = useGame.getState().game
    const { container } = render(<Bag tab="make" />)
    expect(container.querySelectorAll('.bag-slot')).toHaveLength(12)
    expect(container.querySelectorAll('.bag-slot:not(.empty)')).toHaveLength(2)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '빵' }))
    expect(screen.getByRole('button', { name: '빵' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('status')).getByText('보리 1')).toBeInTheDocument()
    expect(within(screen.getByRole('status')).getByText('물 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '파피루스' }))
    expect(within(screen.getByRole('status')).getByText('갈대 1')).toBeInTheDocument()
    expect(within(screen.getByRole('status')).queryByText('보리 1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '빵' })).toHaveAttribute('aria-pressed', 'false')
    expect(useGame.getState().game).toBe(before)
  })
  it('키보드로도 제작법을 고를 수 있고 배우지 않은 제작법은 숨긴다', async () => {
    render(<Bag tab="make" />)
    expect(screen.queryByRole('button', { name: '아기 침대' })).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: '빵' })
    button.focus()
    await userEvent.setup().keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent(T.ui.recipeNeeds)
  })
  it('배운 아기 침대는 갈대 3과 담요 1을 안내한다', async () => {
    useGame.setState({ game: { ...useGame.getState().game, recipesKnown: ['homeCradle'] } })
    render(<Bag tab="make" />)
    await userEvent.setup().click(screen.getByRole('button', { name: '아기 침대' }))
    expect(within(screen.getByRole('status')).getByText('갈대 3')).toBeInTheDocument()
    expect(within(screen.getByRole('status')).getByText('담요 1')).toBeInTheDocument()
  })
  it('모든 제작 결과에 기존 도트 아이콘이 있다', () => {
    for (const id of Object.keys(RECIPES) as RecipeId[]) {
      const output = Object.keys(RECIPES[id].gives)[0]
      expect(ICONS[output], id).toBeDefined()
    }
  })
  it('아직 배운 제작법이 없으면 빈 안내를 보여 준다', () => {
    useGame.setState({ game: { ...useGame.getState().game, recipesKnown: [] } })
    const { container } = render(<Bag tab="make" />)
    expect(screen.getByText(T.ui.recipesEmpty)).toBeInTheDocument()
    expect(container.querySelector('.bag-grid')).toBeNull()
  })
})


it('매력 11점은 1단계이고 점수별 단계 기준을 설명한다', () => {
  const game = newGame(CONTENT)
  useGame.setState({ game: { ...game, stats: { ...game.stats, charm: { level: 2, xp: 4, born: 0 } } }, modal: { kind: 'bag' } })
  const { container } = render(<Bag />)
  const charm = container.querySelector('[data-stat="charm"]')!
  expect(charm.querySelector('.stat-level')).toHaveTextContent('11/100')
  fireEvent.click(charm)
  expect(charm).toHaveTextContent('1단계 · 11/100점')
  expect(charm).toHaveTextContent('3단계 41~60점')
  expect(charm).not.toHaveTextContent('누적 경험치')
})
