// 계획 20 작업 5: 첫 방문 카드의 불러오기 실패 처리, 작은 책장
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { ensureOtBook } from '../../content/ot-catalog'
import { T } from '../../content/text'
import { newGame, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { FirstLight } from './FirstLight'
import { OtShelf } from './OtShelf'

// 불러오기는 그대로 부르되, 실패하는 경우를 시험에서 한 번씩 끼워 넣는다
vi.mock('../../content/ot-catalog', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../content/ot-catalog')>()
  return { ...m, ensureOtBook: vi.fn(m.ensureOtBook) }
})

function reset(extra: Partial<GameState> = {}) {
  const g = newGame(CONTENT)
  useGame.setState({ game: { ...g, scenes: [], flags: { ...g.flags, newlandGift: 1 }, ...extra }, modal: { kind: 'firstLight' }, rng: () => 0, decorating: null, toast: null })
}
const skipLight = () => fireEvent.pointerDown(document.querySelector('.first-light-veil')!)

describe('첫 방문 카드 — 불러오기', () => {
  it('못 불러오면 "책을 펼치는 중" 줄을 지우고 단추만 남긴다 (오류 문구 없음)', async () => {
    reset()
    vi.mocked(ensureOtBook).mockRejectedValueOnce(new Error('network'))
    render(<FirstLight />)
    skipLight()
    await waitFor(() => expect(screen.queryByText(T.newland.opening)).toBeNull())
    expect(screen.queryByText(/오류|실패|network/)).toBeNull()
    expect(screen.getByRole('button', { name: T.newland.firstWrite })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: T.newland.later })).toBeInTheDocument()
  })

  it('불러오는 동안은 줄이 보이고, 불러온 뒤 창 1:3 본문 카드가 보인다. [첫 장을 써 본다]는 창세기 첫 장 쓰기 화면', async () => {
    reset()
    render(<FirstLight />)
    skipLight()
    expect(screen.getByText(T.newland.opening)).toBeInTheDocument()
    expect(await screen.findByText(/빛이 있으라/)).toBeInTheDocument()
    expect(screen.queryByText(T.newland.opening)).toBeNull()
    act(() => void fireEvent.click(screen.getByRole('button', { name: T.newland.firstWrite })))
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'write' })
    expect(useGame.getState().game.copy.book).toBe('gen')
  })

  it('이미 구약 책을 골라 둔 적이 있으면 [첫 장을 써 본다]는 그 책의 메뉴 (구약 칸)', async () => {
    reset()
    useGame.setState({ game: { ...useGame.getState().game, copy: { ...useGame.getState().game.copy, book: 'exo' } } })
    render(<FirstLight />)
    skipLight()
    await screen.findByText(/빛이 있으라/)
    act(() => void fireEvent.click(screen.getByRole('button', { name: T.newland.firstWrite })))
    expect(useGame.getState().modal).toEqual({ kind: 'copy', view: 'menu', tab: 'ot' })
  })
})

describe('작은 책장', () => {
  beforeEach(() => useGame.setState({ modal: { kind: 'otShelf' } }))

  it('필사를 마친 책이 없으면 한 줄만, 책등도 단추도 효과도 없다 (닫기만)', () => {
    reset()
    render(<OtShelf />)
    expect(screen.getByRole('dialog', { name: T.ot.shelfTitle })).toBeInTheDocument()
    expect(screen.getByText(T.ot.shelfEmpty)).toBeInTheDocument()
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('필사를 끝낸 구약 책의 책등만 보인다 (성경 순서) — 등급·제본·퀴즈 말이 없다', () => {
    reset({
      otProgress: {
        oba: { completed: [1], arrangement: {} },
        rut: { completed: [1, 2, 3, 4], arrangement: {} },
        gen: { completed: [1, 2, 3], arrangement: {} },
      },
    })
    render(<OtShelf />)
    const spines = screen.getAllByRole('img')
    expect(spines.map((s) => s.getAttribute('aria-label'))).toEqual(['룻기 책등', '오바댜 책등'])
    expect(screen.queryByText(/등급|제본|퀴즈|금박/)).toBeNull()
    expect(screen.queryByText(T.ot.shelfEmpty)).toBeNull()
    // 닫으면 창이 닫힌다 — 아무것도 바뀌지 않는다
    const before = useGame.getState().game
    fireEvent.click(screen.getByRole('button', { name: T.ui.close }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game).toBe(before)
  })
})
