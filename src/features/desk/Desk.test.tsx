// 계획 7 작업 4: 책상 — 방별 책 고르기와 편지 빈칸 옮겨 적기
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, copySourceFor, PIECES } from '../../content/catalog'
import { blanksFor } from '../../engine/copy'
import { groupByRoom, pickableBooks } from '../../engine/books'
import { newGame, type GameState } from '../../engine/game'
import { POSTMAN } from '../../engine/post'
import { shelfRoom } from '../../engine/shelf-rooms'
import { LETTERS } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

const OPEN = { gospelFeast: 2, 'room:romPhm': 1 }
const ROM_PHM = shelfRoom('romPhm').books
const HEB_JUD = shelfRoom('hebJud').books
const LETTER_NAMES = ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서']

function reset(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
}
const openDesk = (dark = false) => act(() => useGame.setState({ modal: { kind: 'desk', result: null, dark } }))
const room = (title: string) => screen.getByText(title, { selector: 'summary' }).closest('details')!

describe('groupByRoom', () => {
  it('방 표 순서로 묶고, 책이 없는 방은 뺀다 (방은 모두 열려 있다)', () => {
    const books = pickableBooks({}, CONTENT.pieces.map((p) => p.book))
    const g = groupByRoom(books)
    expect(g.map((x) => x.room.id)).toEqual(['gospels', 'acts', 'romPhm', 'hebJud', 'rev'])
    expect(g[2].books).toEqual([...ROM_PHM])
    expect(g[3].books).toEqual([...HEB_JUD])
    // 책이 없는 방은 빠진다 (복음서만 있으면 복음서 방 하나)
    expect(groupByRoom(pickableBooks({}, ['mt', 'mk', 'lk', 'jn'])).map((x) => x.room.id)).toEqual(['gospels'])
    // 방 표식은 아무 영향이 없다
    expect(groupByRoom(pickableBooks(OPEN, books))).toEqual(g)
  })

  // 예전 선반 도감 시험 (2026-10-04 도감은 말씀 › 말씀 조각으로 옮겼고, 방 거르기는 책상 고르기에 남았다)
  it('고를 수 있는 책: 방 표식이 없어도 편지까지 모두 보인다', () => {
    const withContent = PIECES.map((p) => p.book)
    expect(pickableBooks({}, withContent).slice(5, 5 + LETTERS.length)).toEqual([...LETTERS])
    expect(pickableBooks({}, withContent)).toEqual(pickableBooks(OPEN, withContent))
  })
})
describe('책 고르기', () => {
  it('새 게임에서도 모든 방과 편지가 책상에 보인다', () => {
    reset({ flags: {} })
    openDesk()
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '어느 책을 엮을까요?' })).toBeInTheDocument()
    expect(room('복음서 방')).toBeInTheDocument()
    expect(room('사도행전 방')).toBeInTheDocument()
    expect(room('로마서–빌레몬서 방')).toBeInTheDocument()
    expect(room('히브리서–유다서 방')).toBeInTheDocument()
    expect(room('요한계시록 방')).toBeInTheDocument()
    for (const n of LETTER_NAMES) expect(screen.getByRole('button', { name: new RegExp(`^${n} ·`) })).toBeEnabled()
  })
  it('방이 열리면 "로마서–빌레몬서 방" 묶음에 열세 권, 지금 책의 방만 펼쳐 둔다', () => {
    reset({ flags: OPEN, activeBook: 'lk', shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } as GameState['shelved'] })
    act(() => useGame.setState({ modal: { kind: 'desk', result: null, dark: false } }))
    render(<ModalLayer />)
    // 지금 책이 있으면 책상이 먼저 — 다른 책 고르기
    act(() => screen.getByRole('button', { name: '다른 책 고르기' }).click())
    const letters = room('로마서–빌레몬서 방')
    const buttons = within(letters).getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label')!.split(' · ')[0])).toEqual(LETTER_NAMES)
    expect(within(letters).getByRole('button', { name: '로마서 · 0/16장' })).toBeEnabled()
    expect(within(letters).getByRole('button', { name: '빌레몬서 · 0/1장' })).toBeEnabled()
    // 서고에 꽂힌 책은 책등 등급
    expect(within(room('복음서 방')).getByRole('button', { name: '마태복음 · 금박' })).toBeInTheDocument()
    expect(within(room('사도행전 방')).getByRole('button', { name: '사도행전 · 은박' })).toBeInTheDocument()
    // 지금 책(누가복음)의 방은 펼치고 다른 방은 접는다
    expect(room('복음서 방')).toHaveAttribute('open')
    expect(letters).not.toHaveAttribute('open')
  })

  it('다 적은 책은 "다 엮음"', () => {
    reset({ flags: OPEN, progress: { ...newGame(CONTENT).progress, phm: { completed: [1], arrangement: {} } } })
    openDesk()
    render(<ModalLayer />)
    expect(screen.getByRole('button', { name: '빌레몬서 · 다 엮음' })).toBeInTheDocument()
  })
})

/** 편지 나르는 이웃이 로마서 1·2장 편지를 건넨다 (계획 14 작업 5부터 편지는 드물게 오므로 오늘 편지를 직접 넣는다) */
function giveLetter() {
  useGame.setState({ game: { ...useGame.getState().game, post: ['rom-001', 'rom-002'] } })
  useGame.getState().listenTo(POSTMAN)
}

describe('옮겨 적기', () => {
  const blanks = blanksFor('rom', 1, copySourceFor('rom'))

  it('받지 않은 장이면 편지 나르는 이웃을 찾아가라고 한다', async () => {
    reset({ flags: OPEN, inv: { papyrus: 3, ink: 3 } })
    const user = userEvent.setup()
    openDesk()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '로마서 · 0/16장' }))
    expect(screen.getByRole('heading', { name: '로마서 1장 옮겨 적기' })).toBeInTheDocument()
    expect(screen.getByText('아직 이 장 편지가 오지 않았어요. 편지 나르는 이웃을 찾아가 보세요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '옮겨 적기' })).toBeNull()
  })

  it('틀린 보기는 흐려지고 기록되지 않는다, 세 칸을 맞히면 기록되고 다음 장으로', async () => {
    reset({ flags: OPEN, inv: { papyrus: 3, ink: 3 } })
    const user = userEvent.setup()
    openDesk()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '로마서 · 0/16장' }))
    act(() => giveLetter())
    expect(useGame.getState().game.collected).toContain('rom-001')
    openDesk()

    // 장 본문(개역한글)과 절 번호
    const body = screen.getByLabelText('성경 본문 롬 1:1-32')
    expect(body).toHaveTextContent('개역한글')
    expect(body).toHaveTextContent('예수 그리스도의 종 바울은')
    // 옮겨 적기 버튼은 세 칸을 채운 뒤에만
    expect(screen.queryByRole('button', { name: '옮겨 적기' })).toBeNull()

    // 첫 칸: 틀린 보기
    await user.click(screen.getByRole('button', { name: '빈칸 1' }))
    const opts = () => within(screen.getByRole('group', { name: '빈칸 1 보기' }))
    expect(opts().getAllByRole('button')).toHaveLength(4)
    const wrong = blanks[0].options.find((o) => o !== blanks[0].answer)!
    await user.click(opts().getByRole('button', { name: wrong }))
    expect(opts().getByRole('button', { name: wrong })).toBeDisabled()
    expect(opts().getByRole('button', { name: wrong })).toHaveClass('dim')
    expect(screen.getByRole('status')).toHaveTextContent('다시 골라 보세요')
    expect(useGame.getState().game.progress.rom.completed).toEqual([])
    expect(useGame.getState().game.inv).toEqual({ papyrus: 3, ink: 3 })

    // 세 칸 모두 맞힌다
    for (let i = 0; i < blanks.length; i++) {
      if (i > 0) await user.click(screen.getByRole('button', { name: `빈칸 ${i + 1}` }))
      await user.click(within(screen.getByRole('group', { name: `빈칸 ${i + 1} 보기` })).getByRole('button', { name: blanks[i].answer }))
      expect(screen.getByLabelText(`빈칸 ${i + 1}: ${blanks[i].answer}`)).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: '옮겨 적기' }))
    const g = useGame.getState().game
    expect(g.progress.rom.completed).toEqual([1])
    expect(g.inv.papyrus).toBe(3) // 재료는 들지 않는다 (계획 14)
    expect(screen.getByRole('status')).toHaveTextContent('로마서 1장을 옮겨 적었습니다.')
    expect(screen.getByRole('heading', { name: '로마서 2장 옮겨 적기' })).toBeInTheDocument()
    // 다음 장은 새 빈칸 (고른 답은 창 상태로만 — 게임 상태에 남지 않는다)
    expect(screen.getByRole('button', { name: '빈칸 1' })).toBeInTheDocument()
  })

  it('재료가 없어도 기록된다 (계획 14)', async () => {
    reset({ flags: OPEN, inv: {} })
    const user = userEvent.setup()
    openDesk()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '로마서 · 0/16장' }))
    act(() => giveLetter())
    openDesk()
    for (let i = 0; i < blanks.length; i++) {
      await user.click(screen.getByRole('button', { name: `빈칸 ${i + 1}` }))
      await user.click(within(screen.getByRole('group', { name: `빈칸 ${i + 1} 보기` })).getByRole('button', { name: blanks[i].answer }))
    }
    await user.click(screen.getByRole('button', { name: '옮겨 적기' }))
    expect(useGame.getState().game.progress.rom.completed).toEqual([1])
    expect(useGame.getState().game.inv).toEqual({})
  })

  it('옛 어둠 표식이 있어도 기름 없이 필사할 수 있다', async () => {
    reset({ flags: OPEN, activeBook: 'rom', collected: ['rom-001'], inv: { papyrus: 3, ink: 3 } })
    openDesk(true)
    render(<ModalLayer />)
    expect(screen.queryByText(/등잔 기름이 없어/)).toBeNull()
    expect(screen.getByRole('button', { name: '빈칸 1' })).toBeEnabled()
  })
})
