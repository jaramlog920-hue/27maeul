// 계획 9 작업 4: 요한계시록 방 — 서고 오른쪽 아래 문, 한 권 선반, 일곱 교회 카드 판 창 (여정 판 창을 판 id로)
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CHURCHES, CONTENT, versesOf } from '../../content/catalog'
import { chaptersOf, emptyProgress } from '../../engine/books'
import { blanksFor } from '../../engine/copy'
import { newGame, playerTile, type GameState } from '../../engine/game'
import { mulberry32 } from '../../engine/offers'
import { shelfRoom } from '../../engine/shelf-rooms'
import { key, LOCKED_DOORS, PLACES, REV_ROOM, roomAt, ROOMS, WARPS } from '../../engine/world'
import { copySourceFor } from '../../content/catalog'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function reset(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
}

/** 퀴즈의 마지막 문제까지 정답으로 (마지막은 넘기지 않는다) */
function solveQuiz() {
  const m = useGame.getState().modal
  if (m?.kind !== 'quiz') throw new Error('no quiz')
  for (let i = 0; i < m.questions.length; i++) {
    const q = (useGame.getState().modal as Extract<typeof m, { kind: 'quiz' }>).questions[i]
    act(() => useGame.getState().answerQuiz(q.answer))
    if (i < m.questions.length - 1) act(() => useGame.getState().nextQuiz())
  }
}

/** 창이 열릴 때까지 프레임을 돌린다 */
function walk() {
  act(() => {
    for (let i = 0; i < 2400 && !useGame.getState().modal; i++) useGame.getState().frame(0.05)
  })
}

const lib = () => ROOMS.find((r) => r.owner === 'library')!
const inLib = () => WARPS.get(key(lib().door))!
const allBooks = [...shelfRoom('romPhm').books, ...shelfRoom('hebJud').books]
const shelvedAll: GameState['shelved'] = { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1, ...Object.fromEntries(allBooks.map((b) => [b, 1 as const])) }
const before = { heartPoints: 1, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 }
const opened = { ...before, 'room:rev': 1 }
const player = (t: { x: number; y: number }) => ({ ...newGame(CONTENT).player, ...t, path: [] })

describe('요한계시록 방 문과 방 안 (계획 9 작업 4)', () => {
  it('넷째 문도 방 표식이 없어도 열려 있어 걸어 들어가 방 이름을 알린다', () => {
    reset({ flags: { heartPoints: 1 }, shelved: shelvedAll, player: player(inLib()) })
    act(() => useGame.getState().tap(LOCKED_DOORS[3]))
    expect(useGame.getState().toast).toBeNull()
    act(() => {
      for (let i = 0; i < 400 && roomAt(playerTile(useGame.getState().game)) !== REV_ROOM; i++) useGame.getState().frame(0.05)
    })
    expect(roomAt(playerTile(useGame.getState().game))).toBe(REV_ROOM)
    expect(useGame.getState().toast?.text).toBe('요한계시록 방')
  })
  it('카드 판·선반·읽는 탁자를 누르면 그 창이 열린다', () => {
    reset({ flags: opened, shelved: shelvedAll, player: player(PLACES.churchBoard.stand!) })
    act(() => useGame.getState().tap(PLACES.churchBoard.tiles[1]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'journey', board: 'churches' })
    reset({ flags: opened, shelved: shelvedAll, player: player(PLACES.revShelf.stand!) })
    act(() => useGame.getState().tap(PLACES.revShelf.tiles[1]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'roomShelf', room: 'rev' })
    reset({ flags: opened, shelved: shelvedAll, collected: ['lk-015-008'], player: player(PLACES.revTable.stand!) })
    act(() => useGame.getState().tap(PLACES.revTable.tiles[0]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'readPick' })
    // 사도행전 방 여정 판은 그대로
    reset({ flags: opened, shelved: shelvedAll, player: player(PLACES.journeyBoard.stand!) })
    act(() => useGame.getState().tap(PLACES.journeyBoard.tiles[1]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'journey' })
  })

  it('한 권 선반: 제본한 요한계시록은 퀴즈 풀고 금박 책등 → 편지식 서고 퀴즈 → 이 선반으로 돌아온다', async () => {
    reset({ flags: opened, shelved: shelvedAll, bound: { rev: { day: 1 } }, progress: { ...emptyProgress(), rev: { completed: chaptersOf('rev', CONTENT), arrangement: {} } } })
    useGame.setState({ modal: { kind: 'roomShelf', room: 'rev' }, rng: mulberry32(3) })
    const user = userEvent.setup()
    const { container } = render(<ModalLayer />)
    const dialog = screen.getByRole('dialog', { name: '요한계시록 선반' })
    expect(dialog).toHaveTextContent('다 옮겨 적은 요한계시록은 이 방 선반에 꽂습니다.')
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
    const m = useGame.getState().modal
    if (m?.kind !== 'quiz') throw new Error('quiz expected')
    expect(m.mode).toEqual({ kind: 'library', book: 'rev', retry: false })
    solveQuiz()
    act(() => useGame.getState().nextQuiz())
    expect(useGame.getState().game.shelved.rev).toBeDefined()
    // 앞의 스물여섯 권이 다 꽂혀 있었으니 스물일곱 번째 — 처음과 지금을 나란히 보이는 창 (계획 14 작업 4), 한 줄은 선반에서 나중에
    expect(useGame.getState().modal).toEqual({ kind: 'shelfDone' })
    act(() => useGame.getState().open({ kind: 'roomShelf', room: 'rev' }))
    // 꽂힌 뒤: 등급 (다 맞혔으니 금박, 다시 도전 없음)
    expect(screen.getByRole('dialog', { name: '요한계시록 선반' })).toHaveTextContent('금박')
    expect(screen.queryByRole('button', { name: '바로 꽂기' })).toBeNull()
    expect(screen.queryByRole('button', { name: '다시 도전' })).toBeNull()
  })

  it('아직 다 적지 않았으면 "아직 옮겨 적는 중"', () => {
    reset({ flags: opened, shelved: shelvedAll })
    useGame.setState({ modal: { kind: 'roomShelf', room: 'rev' } })
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '요한계시록 선반' })).toHaveTextContent('아직 옮겨 적는 중')
    expect(screen.queryByRole('button', { name: '바로 꽂기' })).toBeNull()
  })
})

describe('일곱 교회 카드 판 창 (계획 9 작업 4)', () => {
  const orders = CHURCHES.map((c) => c.order)

  it('빈 판: 제목·안내·개수·빈 판 문구', () => {
    reset({ flags: opened })
    useGame.setState({ modal: { kind: 'journey', board: 'churches' } })
    render(<ModalLayer />)
    const dialog = screen.getByRole('dialog', { name: '일곱 교회 카드' })
    expect(dialog).toHaveTextContent('요한계시록을 옮겨 적으며 얻은 교회 이름 카드를 본문에 나오는 순서대로 놓아 보세요.')
    expect(dialog).toHaveTextContent('카드 0 / 7장')
    expect(dialog).toHaveTextContent('아직 카드가 없어요. 요한계시록 2장과 3장을 옮겨 적으면 카드가 생겨요.')
    expect(screen.queryByRole('button', { name: '차례 확인' })).toBeNull()
  })

  it('카드를 누르면 그 이름이 나오는 한 절(개역한글)만 — 풀이 없이', async () => {
    reset({ flags: opened, progress: { ...emptyProgress(), rev: { completed: [1, 2], arrangement: {} } }, churches: [2, 3, 1, 4] })
    useGame.setState({ modal: { kind: 'journey', board: 'churches' } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '일곱 교회 카드' })).toHaveTextContent('카드 4 / 7장')
    await user.click(screen.getByRole('button', { name: '에베소 카드 구절 보기' }))
    const dialog = screen.getByRole('dialog', { name: '에베소 카드' })
    const passage = screen.getByLabelText('성경 본문 계 2:1')
    expect(versesOf('계 2:1')).toHaveLength(1)
    expect(passage).toHaveTextContent(versesOf('계 2:1')[0].text)
    expect(passage.textContent).toContain('에베소 교회의 사자에게')
    // 본문 한 절과 돌아가기 단추 말고는 없다
    expect(dialog.querySelectorAll('button')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '판으로 돌아가기' }))
    expect(screen.getByRole('dialog', { name: '일곱 교회 카드' })).toBeInTheDocument()
  })

  it('차례 확인과 ▲▼로 본문 순서를 맞추면 완성 (churchesDone) — 사도행전 판은 그대로', async () => {
    const swapped = [...orders.slice(0, -2), orders.at(-1)!, orders.at(-2)!]
    reset({ flags: opened, progress: { ...emptyProgress(), rev: { completed: [1, 2, 3], arrangement: {} } }, churches: swapped })
    useGame.setState({ modal: { kind: 'journey', board: 'churches' } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '차례 확인' }))
    expect(screen.getByRole('status')).toHaveTextContent('차례가 어긋난 카드가 있어요.')
    await user.click(screen.getByRole('button', { name: '에베소 아래로' }))
    await user.click(screen.getByRole('button', { name: '차례 확인' }))
    expect(screen.getByRole('status')).toHaveTextContent('차례가 어긋난 카드가 있어요.')
    await user.click(screen.getByRole('button', { name: '에베소 위로' }))
    // 끝에서 둘째로 놓인 라오디게아를 한 칸 아래로
    await user.click(screen.getByRole('button', { name: '라오디게아 아래로' }))
    expect(useGame.getState().game.churches).toEqual(orders)
    expect(useGame.getState().game.flags.churchesDone).toBe(1)
    expect(useGame.getState().game.flags.actsShip).toBeUndefined()
    expect(useGame.getState().game.journey).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('일곱 교회 카드를 본문 순서대로 다 놓았어요.')
    expect(useGame.getState().toast?.text).toBe('일곱 교회 카드를 본문 순서대로 다 놓았어요.')
    // 다 놓은 판은 더 옮기지 않는다
    expect(screen.queryByRole('button', { name: '라오디게아 위로' })).toBeNull()
  })

  it('맞게 놓였으면 "지금 놓인 카드는 본문 순서대로예요."', async () => {
    reset({ flags: opened, progress: { ...emptyProgress(), rev: { completed: [1, 2], arrangement: {} } }, churches: [1, 2, 3, 4] })
    useGame.setState({ modal: { kind: 'journey', board: 'churches' } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '차례 확인' }))
    expect(screen.getByRole('status')).toHaveTextContent('지금 놓인 카드는 본문 순서대로예요.')
  })

  it('요한계시록 2장을 옮겨 적으면 "일곱 교회 카드 4장이 생겼어요."', () => {
    const blanks = blanksFor('rev', 2, copySourceFor('rev'))
    reset({
      flags: opened,
      shelved: shelvedAll,
      activeBook: 'rev',
      collected: ['rev-001', 'rev-002'],
      progress: { ...emptyProgress(), rev: { completed: [1], arrangement: {} } },
      inv: { papyrus: 3, ink: 3 },
    })
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    blanks.forEach((b, i) => act(() => useGame.getState().copyPick(i, b.answer)))
    act(() => useGame.getState().submitCopy())
    expect(useGame.getState().game.progress.rev.completed).toEqual([1, 2])
    expect(useGame.getState().game.churches).toHaveLength(4)
    expect(useGame.getState().toast?.text).toBe('일곱 교회 카드 4장이 생겼어요.')
  })
})
