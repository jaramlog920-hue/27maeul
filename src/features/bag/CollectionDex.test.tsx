import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { ITEM_TEXT } from '../../content/text'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { Bag } from './Bag'

describe('도감 탭', () => {
  let colors: string[]
  beforeEach(() => {
    colors = []
    const context = { clearRect: vi.fn(), fillRect: vi.fn(), set fillStyle(color: string) { colors.push(color) } }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as unknown as CanvasRenderingContext2D)
    useGame.setState({ game: { ...newGame(CONTENT), found: ['bread'] }, modal: { kind: 'bag' } })
  })
  afterEach(() => vi.restoreAllMocks())

  it('물건 도감을 도감으로 바꾸고 네 분류와 획득 수를 보여 준다', () => {
    render(<Bag tab="dex" />)
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['물건', '만들기', '도감'])
    for (const name of ['가구', '책 디자인', '레시피', '생활 물건']) expect(screen.getByRole('region', { name })).toBeInTheDocument()
    expect(screen.getByText(/^모은 것 \d+ \/ \d+$/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '책 디자인' }))
    expect(screen.queryByRole('region', { name: '가구' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-entry^="design:"]')).toHaveLength(45)
    const spines = screen.getByRole('region', { name: '책등 장식' })
    expect(spines.querySelectorAll('.dex-card')).toHaveLength(4)
    expect(spines.querySelector('canvas')).toHaveAttribute('width', '8')
    expect(spines.querySelector('canvas')).toHaveAttribute('height', '20')
    expect(screen.getByRole('region', { name: '기본 표지·책등' }).querySelectorAll('.dex-card')).toHaveLength(27)
  })

  it('미획득 물건은 실제 그림의 단색 실루엣이고 이름은 가려진다', () => {
    const { container } = render(<Bag tab="dex" />)
    fireEvent.click(screen.getByRole('button', { name: '생활 물건' }))
    const card = container.querySelector('[data-entry="item:goldLeaf"]') as HTMLElement
    expect(card).toHaveClass('unknown')
    expect(card).toHaveTextContent('???')
    expect(card).not.toHaveTextContent(ITEM_TEXT.goldLeaf.name)
    expect(card.querySelector('canvas')).toBeInTheDocument()
    colors.length = 0
    act(() => useGame.setState(s => ({ game: { ...s.game, found: [...s.game.found, 'goldLeaf'] } })))
    expect(card).toHaveClass('known')
    expect(card).toHaveTextContent(ITEM_TEXT.goldLeaf.name)
    expect(colors.some(color => color !== '#8b8376')).toBe(true)
    fireEvent.click(card)
    expect(screen.getByRole('status')).toHaveTextContent(ITEM_TEXT.goldLeaf.desc)
  })

  it('획득한 것만 보기와 실루엣 항목의 얻는 방법을 보여 준다', () => {
    render(<Bag tab="dex" />)
    colors.length = 0
    fireEvent.click(screen.getByRole('button', { name: '책 디자인' }))
    fireEvent.click(document.querySelector('[data-entry="design:color:sky"]')!)
    expect(colors.length).toBeGreaterThan(0)
    expect(new Set(colors)).toEqual(new Set(['#8b8376']))
    expect(screen.getByRole('status')).toHaveTextContent('아직 모으지 않은 것')
    expect(screen.getByRole('status')).toHaveTextContent('특별하게 제본')
    expect(within(screen.getByRole('status')).queryByText('하늘색')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: '획득한 것만 보기' }))
    expect(document.querySelectorAll('.dex-card')).toHaveLength(0)
    expect(screen.getByText('이 분류에서 아직 모은 것이 없어요.')).toBeInTheDocument()
  })
})
