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
import { dexView } from '../shelf/Shelf'

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
  it('방 표 순서로 묶고, 빈 방은 뺀다', () => {
    const books = pickableBooks(OPEN, CONTENT.pieces.map((p) => p.book))
    const g = groupByRoom(books)
    expect(g.map((x) => x.room.id)).toEqual(['gospels', 'acts', 'romPhm'])
    expect(g[2].books).toEqual([...ROM_PHM])
    expect(groupByRoom(pickableBooks({}, books)).map((x) => x.room.id)).toEqual(['gospels'])
    // 히브리서–유다서 방이 열리면 여덟 권이 넷째 묶음으로
    const all = groupByRoom(pickableBooks({ ...OPEN, 'room:hebJud': 1 }, CONTENT.pieces.map((p) => p.book)))
    expect(all.map((x) => x.room.id)).toEqual(['gospels', 'acts', 'romPhm', 'hebJud'])
    expect(all[3].books).toEqual([...HEB_JUD])
  })

  it('도감: 방이 닫히면 편지가 없고, 열리면 그 방의 책이 보인다', () => {
    expect(dexView(PIECES, { gospelFeast: 2 }, 'all', false).books.some((b) => LETTERS.includes(b as never))).toBe(false)
    expect(dexView(PIECES, OPEN, 'all', false).books.slice(5)).toEqual([...ROM_PHM])
    expect(dexView(PIECES, { ...OPEN, 'room:hebJud': 1 }, 'all', false).books.slice(5)).toEqual([...LETTERS])
  })
})

describe('책 고르기', () => {
  it('방이 닫혀 있으면 편지가 없다 (자리 표시도 없다)', () => {
    reset({ flags: { gospelFeast: 2 } })
    openDesk()
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '어느 책을 엮을까요?' })).toBeInTheDocument()
    expect(room('복음서 방')).toBeInTheDocument()
    expect(room('사도행전 방')).toBeInTheDocument()
    expect(screen.queryByText('로마서–빌레몬서 방')).toBeNull()
    for (const n of LETTER_NAMES) expect(screen.queryByRole('button', { name: new RegExp(`^${n} ·`) })).toBeNull()
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
    act(() => useGame.getState().listenTo(POSTMAN))
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
    expect(g.inv.papyrus).toBe(2)
    expect(screen.getByRole('status')).toHaveTextContent('로마서 1장을 옮겨 적었습니다.')
    expect(screen.getByRole('heading', { name: '로마서 2장 옮겨 적기' })).toBeInTheDocument()
    // 다음 장은 새 빈칸 (고른 답은 창 상태로만 — 게임 상태에 남지 않는다)
    expect(screen.getByRole('button', { name: '빈칸 1' })).toBeInTheDocument()
  })

  it('재료가 없으면 조각 책상과 같은 안내, 기록되지 않는다', async () => {
    reset({ flags: OPEN, inv: {} })
    const user = userEvent.setup()
    openDesk()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '로마서 · 0/16장' }))
    act(() => useGame.getState().listenTo(POSTMAN))
    openDesk()
    for (let i = 0; i < blanks.length; i++) {
      await user.click(screen.getByRole('button', { name: `빈칸 ${i + 1}` }))
      await user.click(within(screen.getByRole('group', { name: `빈칸 ${i + 1} 보기` })).getByRole('button', { name: blanks[i].answer }))
    }
    await user.click(screen.getByRole('button', { name: '옮겨 적기' }))
    expect(screen.getByRole('status')).toHaveTextContent('파피루스와 잉크가 하나씩')
    expect(useGame.getState().game.progress.rom.completed).toEqual([])
    // 채운 칸은 그대로 남아 있다
    expect(screen.getByLabelText(`빈칸 1: ${blanks[0].answer}`)).toBeInTheDocument()
  })

  it('밤에 기름이 없으면 어둡다', async () => {
    reset({ flags: OPEN, activeBook: 'rom', collected: ['rom-001'], inv: { papyrus: 3, ink: 3 } })
    openDesk(true)
    render(<ModalLayer />)
    expect(screen.getByText(/등잔 기름이 없어 어둡습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '빈칸 1' })).toBeNull()
  })
})
