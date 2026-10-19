// 처음 하는 사람으로 1~7일째 플레이 점검(docs/detail-audit/first-week-playtest-20261019.md)에서 고친 것
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { newGame, type GameState } from '../engine/game'
import { legacyGame } from '../engine/growth-test-support'
import { BindView } from '../features/library/BindView'
import { Library } from '../features/library/Library'
import { Hud } from '../features/play/Hud'
import { ControlDeck } from '../features/play/ControlDeck'
import { TradeBoard } from '../features/talk/TradeBoard'
import { useGame } from '../store/game-store'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useGame.setState({ toast: null, piecePopups: [], copyResult: null, modal: null })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('P1 조작판 메뉴에 지도가 있다', () => {
  useGame.setState({ game: newGame(CONTENT), deck: true })
  render(<ControlDeck />)
  fireEvent.click(screen.getByRole('button', { name: /메뉴/ }))
  fireEvent.click(screen.getByRole('menuitem', { name: T.ui.map }))
  expect(useGame.getState().modal).toEqual({ kind: 'villageMap' })
})

it('P2·P3 서고 창은 들고 온 완성본을 어느 방 어느 문에 꽂는지 알린다', () => {
  const s = legacyGame(CONTENT)
  useGame.setState({ game: { ...s, bound: { phm: { day: 1 } } } as GameState, modal: { kind: 'library' } })
  render(<Library />)
  expect(screen.getByText(/빌레몬서 완성본을 들고 있어요 — 로마서–빌레몬서 방\(왼쪽 아래 문\)/)).toBeInTheDocument()
})

it('P5·P13 다 쓴 책이면 다음 책 고르기, 장날에는 장날이 한 번만', () => {
  const s = newGame(CONTENT)
  const game = { ...s, clock: { day: 7, minute: 360 }, copy: { ...s.copy, book: 'phm' as const }, progress: { ...s.progress, phm: { completed: [1], arrangement: {} } } }
  useGame.setState({ game })
  const view = render(<Hud />)
  expect(view.container.textContent).toContain(T.ui.hudCopyNext)
  expect(view.container.textContent?.match(new RegExp(T.ui.market, 'g'))).toHaveLength(1)
})

it('P9 특별 제본: 재료가 모자라다는 줄과, 누르면 뜨는 재료 구하는 곳', () => {
  useGame.setState({ game: legacyGame(CONTENT), modal: { kind: 'bind', book: 'phm', step: 'choose' } })
  render(<BindView modal={{ kind: 'bind', book: 'phm', step: 'choose' }} />)
  expect(screen.getByText(T.binding.shortInline)).toBeInTheDocument()
  expect(screen.queryByRole('dialog', { name: T.binding.whereTitle })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: T.binding.whereButton }))
  const box = screen.getByRole('dialog', { name: T.binding.whereTitle })
  expect(within(box).getByText(/크림색 종이/)).toBeInTheDocument()
})

describe('P20~22 장터', () => {
  const market = () => {
    const s = legacyGame(CONTENT)
    useGame.setState({ game: { ...s, clock: { day: 7, minute: 600 }, coins: 100 } })
    return render(<TradeBoard />)
  }
  it('칸 아래에 이름이 보이고, 흐린 칸을 누르면 못 사는 까닭이 나온다', () => {
    const view = market()
    expect(view.container.querySelectorAll('.bag-name').length).toBeGreaterThan(10)
    fireEvent.click(screen.getByRole('button', { name: '구약 서고 열쇠' }))
    expect(screen.getByText(/닢이 7900 모자라요/)).toBeInTheDocument()
  })
  it('새 터가 열리기 전에 열쇠를 사려 하면 쓸 수 없다는 창이 먼저 뜬다', () => {
    const s = legacyGame(CONTENT)
    useGame.setState({ game: { ...s, clock: { day: 7, minute: 600 }, coins: 9000 } })
    render(<TradeBoard />)
    fireEvent.click(screen.getByRole('button', { name: '구약 서고 열쇠' }))
    fireEvent.click(within(document.querySelector('.bag-detail') as HTMLElement).getByRole('button', { name: T.ui.tradeBuy }))
    expect(screen.getByRole('alertdialog', { name: T.ui.keyEarlyTitle })).toBeInTheDocument()
    expect(useGame.getState().game.inv.homeKey ?? 0).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: T.ui.keyEarlyBuy }))
    expect(useGame.getState().game.inv.homeKey).toBe(1)
  })
})

it('P4 집 안에서 아래만 눌러도 한 칸 비켜 있는 문으로 나간다', () => {
  const s = newGame(CONTENT)
  useGame.getState().load({ ...s, scenes: [], player: { ...s.player, x: 19, y: 114, path: [] } })
  useGame.setState({ modal: null })
  useGame.getState().walk(0, 1)
  const p = useGame.getState().game.player
  expect(p.path.length).toBeGreaterThan(0)
  expect(p.path[0]).toEqual({ x: 20, y: 114 })
})

it('P10 장면을 닫으면 이어 기다리던 \'새로 열림\' 장면은 창 대신 알림으로', async () => {
  const s = legacyGame(CONTENT)
  useGame.getState().load({ ...s, scenes: ['firstChapter', 'growth:decorate'] })
  useGame.setState({ modal: { kind: 'scene', id: 'firstChapter' } })
  useGame.getState().nextScene()
  expect(useGame.getState().game.scenes).toEqual([])
  await new Promise((r) => setTimeout(r, 0))
  expect(useGame.getState().toast?.text).toContain('의자')
})
