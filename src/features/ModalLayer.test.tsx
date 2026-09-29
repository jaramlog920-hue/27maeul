import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, JOURNEY, PIECES, piecesOf, versesOf } from '../content/catalog'
import type { Piece } from '../engine/types'
import { dexView } from './shelf/Shelf'
import { chaptersOf, emptyProgress } from '../engine/books'
import { chooseBook, newGame, playerTile, type GameState } from '../engine/game'
import { mulberry32 } from '../engine/offers'
import { ACTS_ROOM, key, LOCKED_DOORS, PLACES, roomAt, ROOMS, WARPS } from '../engine/world'
import { useGame } from '../store/game-store'
import { saveGame } from '../engine/save'
import { ModalLayer } from './ModalLayer'
import { NextEventBar, useEventAlerts } from './play/EventSchedule'
import { journalLine } from './journal/Journal'

function reset(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
}

/** 퀴즈의 마지막 문제 직전까지 정답으로 넘긴다 */
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
const at = (minute: number, day = 1) => ({ clock: { day, minute } })
/** 누가복음을 고르고 책상 위 순서를 놓아 둔 상태 */
const lkDesk = (arrangement: Record<number, string[]>, completed: number[] = []): Partial<GameState> => ({
  activeBook: 'lk',
  progress: { ...emptyProgress(), lk: { completed, arrangement } },
})
const lkChapter1 = piecesOf('lk').filter((p) => p.chapter === 1).map((p) => p.id)

describe('본문 창', () => {
  beforeEach(() => reset())

  it('개역한글 원문과 출처, "누가에만" 도장을 보인다', () => {
    useGame.setState({ modal: { kind: 'passage', pieceId: 'lk-015-008', askLine: false } })
    render(<ModalLayer />)
    expect(screen.getByRole('heading', { name: '잃은 드라크마' })).toBeInTheDocument()
    expect(screen.getByLabelText('성경 본문 눅 15:8-10')).toHaveTextContent('어느 여자가 열 드라크마가 있는데 하나를 잃으면 등불을 켜고 집을 쓸며 찾도록 부지런히 찾지 아니하겠느냐')
    expect(screen.getByText('개역한글')).toBeInTheDocument()
    expect(screen.getByText(/네 복음서 중 누가복음에만 있는 이야기/)).toBeInTheDocument()
    expect(screen.getByText(/네 복음서를 서로 견주어 붙인 표시입니다/)).toBeInTheDocument()
  })

  it('비슷한 이야기 도장에는 단서를 붙인다', () => {
    useGame.setState({ modal: { kind: 'passage', pieceId: 'lk-015-001', askLine: false } })
    render(<ModalLayer />)
    expect(screen.getByText(/비슷한 이야기 · 마 18:12-14/)).toHaveTextContent('같은 일인지는 본문이 말하지 않습니다')
  })

  it('도장을 누르면 그 복음서의 구절이 펼쳐지고, 다시 누르면 접힌다', async () => {
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'passage', pieceId: 'lk-015-001', askLine: false } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: /비슷한 이야기 · 마 18:12-14/ }))
    expect(screen.getByLabelText('성경 본문 마 18:12-14')).toHaveTextContent('양 일백 마리가 있는데')
    await user.click(screen.getByRole('button', { name: /비슷한 이야기 · 마 18:12-14/ }))
    expect(screen.queryByLabelText('성경 본문 마 18:12-14')).toBeNull()
  })

  it('두 아들은 22절 모두 보인다 (발췌하지 않는다)', () => {
    useGame.setState({ modal: { kind: 'passage', pieceId: 'lk-015-011', askLine: false } })
    const { container } = render(<ModalLayer />)
    expect(container.querySelectorAll('.passage-body p')).toHaveLength(22)
  })
})

describe('이웃', () => {
  it('걸어가 말 걸기 → 이야기 듣기 → 본문 → 나의 한 줄', async () => {
    reset(at(8 * 60))
    act(() => useGame.setState((s) => ({ game: chooseBook(s.game, 'lk', CONTENT) })))
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().frame(0.01))
    // 오늘 이야기를 가진 이웃 가운데 보이는 이웃에게
    const g0 = useGame.getState().game
    const who = Object.keys(g0.offers).find((id) => g0.npcs[id]?.visible)!
    const npc = g0.npcs[who]
    act(() => useGame.getState().tap({ x: Math.round(npc.x), y: Math.round(npc.y) }))
    walk()
    const role = CONTENT.neighbors.find((n) => n.id === who)!.role
    expect(screen.getByRole('dialog', { name: role })).toBeInTheDocument()
    expect(useGame.getState().game.hearts[who]).toBe(2)
    await user.click(screen.getByRole('button', { name: '이야기 듣기' }))
    const got = useGame.getState().game.collected.at(-1)!
    expect(got.startsWith('lk-001-')).toBe(true)
    // 1장 조각은 모두 누가에만 → 나의 한 줄을 물어본다
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.type(screen.getByRole('textbox', { name: '나의 말로 한 줄' }), '차례대로')
    await user.click(screen.getByRole('button', { name: '남기기' }))
    expect(useGame.getState().game.myLines[got]).toBe('차례대로')
    expect(localStorage.getItem('twenty-seven/save')).toContain('차례대로')
  })

  it('돕기: 활동을 끝내면 보상', async () => {
    reset(at(8 * 60))
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'talk', neighborId: 'baker', line: '…' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '반죽 치대기 돕기' }))
    expect(screen.getByRole('dialog', { name: /빵 굽는 이웃 · 반죽 치대기 돕기/ })).toBeInTheDocument()
    for (let i = 0; i < 9; i++) act(() => useGame.getState().miniTap())
    expect(screen.getByText('다 했어요!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().game.inv.bread).toBe(4)
    expect(useGame.getState().game.helped).toContain('baker')
    expect(useGame.getState().toast?.text).toContain('빵 가져가세요')
  })

  it('선물: 좋아하는 것을 주면 반가워한다', async () => {
    reset({ inv: { grapes: 1 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'talk', neighborId: 'baker', line: '…' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '선물하기' }))
    await user.click(screen.getByRole('button', { name: /포도 1/ }))
    expect(screen.getByText('어머, 제가 좋아하는 거예요!')).toBeInTheDocument()
    expect(useGame.getState().game.hearts.baker).toBe(5)
    expect(screen.getByRole('button', { name: '선물하기' })).toBeDisabled()
  })

  it('장날에만 상인과 바꾸기', async () => {
    reset({ ...at(10 * 60, 7), inv: { grapes: 2 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'talk', neighborId: 'merchant', line: '…' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '바꾸기' }))
    const row = screen.getByText('파피루스 두 장').closest('li')!
    await user.click(row.querySelector('button')!)
    expect(useGame.getState().game.inv.papyrus).toBe(2)
  })
})

describe('책상', () => {
  it('이야기 본문을 읽고 기존 순서 그대로 이어붙이기로 돌아온다', async () => {
    const ids = [...lkChapter1].reverse()
    reset({ collected: ids, ...lkDesk({ 1: ids }) })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    render(<ModalLayer />)
    const before = [...useGame.getState().game.progress.lk.arrangement[1]]
    await user.click(screen.getByRole('button', { name: '데오빌로 각하에게 본문 보기' }))
    expect(screen.getByLabelText('성경 본문 눅 1:1-4')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '이어붙이기로 돌아가기' }))
    expect(screen.getByRole('button', { name: '데오빌로 각하에게 본문 보기' })).toBeInTheDocument()
    expect(useGame.getState().game.progress.lk.arrangement[1]).toEqual(before)
  })
  const chapter1 = lkChapter1

  it('재료가 없으면 알려 주고, 있으면 장을 마무리한다', async () => {
    // 아직 책을 고르지 않았다 — 처음 책상을 열면 책 고르기
    reset({ collected: chapter1, progress: { ...emptyProgress(), lk: { completed: [], arrangement: { 1: [...chapter1] } } } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
    walk()
    expect(screen.getByRole('dialog', { name: '어느 책을 엮을까요?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(`마태복음 · 0/${chaptersOf('mt', CONTENT).length}장`) })).toBeEnabled()
    expect(screen.getByRole('button', { name: new RegExp(`요한복음 · 0/${chaptersOf('jn', CONTENT).length}장`) })).toBeEnabled()
    expect(chaptersOf('jn', CONTENT)).toHaveLength(21) // 요 1–21장 전부 (작업 7·8)
    // 사도행전은 서고의 사도행전 방이 열리기 전에는 책 고르기에 없다 (계획 5)
    expect(screen.queryByRole('button', { name: /사도행전/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: /누가복음 · 0\/24장/ }))
    expect(useGame.getState().game.activeBook).toBe('lk')
    expect(screen.getByRole('dialog', { name: '책상' })).toHaveTextContent('1장')
    await user.click(screen.getByRole('button', { name: '이어 붙이기' }))
    expect(screen.getByRole('status')).toHaveTextContent('파피루스와 잉크가 하나씩')
    act(() => useGame.setState((s) => ({ game: { ...s.game, inv: { papyrus: 1, ink: 1 } } })))
    await user.click(screen.getByRole('button', { name: '이어 붙이기' }))
    // 준비되면 기록하기 전에 다섯 문제 — 재료는 아직 그대로
    expect(screen.getByRole('dialog', { name: '기록하기 전에' })).toBeInTheDocument()
    expect(useGame.getState().game.inv).toEqual({ papyrus: 1, ink: 1 })
    solveQuiz()
    await user.click(screen.getByRole('button', { name: '두루마리에 기록하기' }))
    expect(screen.getByRole('status')).toHaveTextContent('1장까지 차례대로 이어 붙였습니다.')
    expect(useGame.getState().game.scenes).toContain('firstChapter')
  })

  it('순서 바로잡기', async () => {
    reset({ collected: chapter1, ...lkDesk({ 1: [...chapter1].reverse() }), inv: { papyrus: 1, ink: 1 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '이어 붙이기' }))
    expect(screen.getByRole('status')).toHaveTextContent('순서를 다시 살펴보세요.')
    act(() => useGame.setState((s) => ({ game: { ...s.game, ...lkDesk({ 1: [chapter1[1], chapter1[0], ...chapter1.slice(2)] }) } })))
    await user.click(screen.getByRole('button', { name: '데오빌로 각하에게 위로' }))
    expect(useGame.getState().game.progress.lk.arrangement[1]).toEqual(chapter1)
  })

  it('밤에 기름이 없으면 어둡다 (책을 골라도)', async () => {
    reset({ ...at(20 * 60), collected: chapter1, progress: { ...emptyProgress(), lk: { completed: [], arrangement: { 1: [...chapter1] } } } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
    walk()
    await user.click(screen.getByRole('button', { name: /누가복음 · 0\/24장/ }))
    expect(screen.getByText(/등잔 기름이 없어 어둡습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이어 붙이기' })).toBeNull()
  })
})

describe('기록 퀴즈 화면', () => {
  const chapter1 = lkChapter1
  it('틀리면 다시 고르고, 다섯 문제를 모두 맞히면 기록된다', async () => {
    reset({ collected: chapter1, ...lkDesk({ 1: [...chapter1] }), inv: { papyrus: 1, ink: 1 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '이어 붙이기' }))
    const m = useGame.getState().modal
    if (m?.kind !== 'quiz') throw new Error('no quiz')
    expect(m.questions).toHaveLength(5)
    // 첫 문제에 일부러 틀린 답
    act(() => useGame.getState().answerQuiz('__틀린답__'))
    expect(screen.getByRole('status')).toHaveTextContent('다시 골라 보세요.')
    expect(useGame.getState().game.progress.lk.completed).toEqual([])
    solveQuiz()
    await user.click(screen.getByRole('button', { name: '두루마리에 기록하기' }))
    expect(useGame.getState().game.progress.lk.completed).toEqual([1])
    expect(useGame.getState().game.inv).toEqual({})
  })

  it('말씀 조각 맞추기: 낱말을 차례대로 눌러 맞힌다', async () => {
    const user = userEvent.setup()
    reset()
    const q = { kind: 'puzzle' as const, ref: '눅 15:8', words: ['나', '가', '다'], answer: ['가', '나', '다'] }
    useGame.setState({ modal: { kind: 'quiz', mode: { kind: 'chapter', book: 'lk', chapter: 15 }, questions: [q], index: 0, wrong: [], solved: false, misses: 0, missed: [] } })
    render(<ModalLayer />)
    // 고르는 중에는 본문 창을 쓰지 않는다
    expect(screen.queryByLabelText('성경 본문 눅 15:8')).toBeNull()
    await user.click(screen.getByRole('button', { name: '가' }))
    await user.click(screen.getByRole('button', { name: '나' }))
    await user.click(screen.getByRole('button', { name: '다' }))
    await user.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.getByRole('status')).toHaveTextContent('맞았어요!')
    expect(screen.getByLabelText('성경 본문 눅 15:8')).toHaveTextContent('가 나 다')
  })

  it('나중에 하기: 재료를 쓰지 않고 닫는다', async () => {
    reset({ collected: chapter1, ...lkDesk({ 1: [...chapter1] }), inv: { papyrus: 1, ink: 1 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '이어 붙이기' }))
    await user.click(screen.getByRole('button', { name: '나중에 하기' }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.inv).toEqual({ papyrus: 1, ink: 1 })
  })
})

describe('마을 서고', () => {
  it('서고: 다 엮은 마가복음을 꽂으면 퀴즈가 열리고, 마치면 책등이 붙는다', async () => {
    const user = userEvent.setup()
    const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    useGame.setState({
      game: { ...base, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } } },
      modal: { kind: 'library' },
      rng: mulberry32(5),
    })
    const { container } = render(<ModalLayer />)
    // 복음서 방 선반에는 네 복음서만 (사도행전은 자기 방 — 계획 5 작업 5)
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(4)
    expect(container.querySelector('.library-shelf')!.textContent).not.toContain('사도행전')
    await user.click(screen.getByRole('button', { name: '꽂기' }))
    expect(screen.getByRole('dialog', { name: '기록하기 전에' }).textContent).toContain('서고에 꽂기 전에')
    // 모든 문제를 정답으로 푼다
    for (let i = 0; i < 5; i++) {
      const m = useGame.getState().modal
      if (m?.kind !== 'quiz') throw new Error('quiz expected')
      const q = m.questions[m.index]
      useGame.getState().answerQuiz(q.answer as string | string[])
      useGame.getState().nextQuiz()
    }
    expect(useGame.getState().game.shelved.mk).toBe(2)
    // 처음 꽂은 직후에는 이 책에 대한 나의 한 줄을 물어본다
    expect(useGame.getState().modal).toEqual({ kind: 'myLine', lineKey: 'book:mk', back: 'library' })
  })
  it('서고: 책등 알림이 먼저, 길 열림 알림은 뒤에', async () => {
    vi.useFakeTimers()
    const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    useGame.setState({
      game: { ...base, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } } },
      modal: null,
      rng: mulberry32(5),
    })
    useGame.getState().startShelve('mk')
    for (let i = 0; i < 5; i++) {
      const m = useGame.getState().modal
      if (m?.kind !== 'quiz') throw new Error('quiz expected')
      useGame.getState().answerQuiz(m.questions[m.index].answer as string | string[])
      useGame.getState().nextQuiz()
    }
    expect(useGame.getState().toast?.text).toContain('책등')
    vi.advanceTimersByTime(4300)
    expect(useGame.getState().toast?.text).toContain('길이 열렸어요')
    vi.useRealTimers()
  })
})

describe('나의 한 줄 (책)', () => {
  /** 마가복음을 다 엮은 상태에서 서고 퀴즈를 모두 맞힌다 */
  function shelveMk() {
    const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    localStorage.clear()
    useGame.setState({
      game: { ...base, scenes: [], collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } }, inv: { goldLeaf: 1, oil: 1 } },
      modal: { kind: 'library' },
      rng: mulberry32(5),
    })
  }
  function answerAll(wrongFirst = false) {
    for (let i = 0; i < 5; i++) {
      const m = useGame.getState().modal
      if (m?.kind !== 'quiz') throw new Error('quiz expected')
      if (wrongFirst && i === 0) act(() => useGame.getState().answerQuiz('__틀린답__'))
      act(() => useGame.getState().answerQuiz(m.questions[m.index].answer as string | string[]))
      act(() => useGame.getState().nextQuiz())
    }
  }

  it('처음 꽂은 직후 한 줄을 적으면 책 키로 저장되고 서고로 돌아온다', async () => {
    shelveMk()
    const user = userEvent.setup()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '꽂기' }))
    answerAll()
    const dialog = screen.getByRole('dialog', { name: '나의 한 줄' })
    expect(dialog).toHaveTextContent('마가복음')
    expect(dialog).toHaveTextContent('이 책에 대한 나의 한 줄을 남길까요? (나중에 적어도 돼요)')
    await user.type(screen.getByRole('textbox', { name: '나의 말로 한 줄' }), '곧 이어지는 이야기들')
    await user.click(screen.getByRole('button', { name: '남기기' }))
    expect(useGame.getState().game.myLines['book:mk']).toBe('곧 이어지는 이야기들')
    expect(localStorage.getItem('twenty-seven/save')).toContain('book:mk')
    expect(screen.getByRole('dialog', { name: '마을 서고' })).toBeInTheDocument()
  })

  it('"나중에 적기"로 넘기면 아무것도 남기지 않고, 선반에서 나중에 적는다', async () => {
    shelveMk()
    const user = userEvent.setup()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '꽂기' }))
    answerAll(true) // 하나 틀려 금박이 아니다 → 다시 도전할 수 있다
    await user.click(screen.getByRole('button', { name: '나중에 적기' }))
    expect(useGame.getState().game.myLines).toEqual({})
    expect(screen.getByRole('dialog', { name: '마을 서고' })).toBeInTheDocument()
    // 다시 도전으로 등급이 바뀌어도 다시 묻지 않는다
    await user.click(screen.getByRole('button', { name: '다시 도전' }))
    answerAll()
    expect(useGame.getState().modal?.kind).toBe('library')
    // 선반의 "내가 남긴 한 줄"에서 적는다
    act(() => useGame.getState().open({ kind: 'shelf' }))
    await user.click(screen.getByRole('tab', { name: '내가 남긴 한 줄' }))
    const row = screen.getByText('마가복음').closest('li')!
    await user.click(within(row).getByRole('button', { name: '적기' }))
    await user.type(screen.getByRole('textbox', { name: '나의 말로 한 줄' }), '서둘러 가는 책')
    await user.click(screen.getByRole('button', { name: '남기기' }))
    // 선반의 같은 칸으로 돌아와 책 이름과 함께 보인다
    expect(screen.getByRole('tab', { name: '내가 남긴 한 줄' })).toHaveAttribute('aria-selected', 'true')
    const again = screen.getByText('마가복음').closest('li')!
    expect(again).toHaveTextContent('서둘러 가는 책')
    await user.click(within(again).getByRole('button', { name: '고치기' }))
    expect(screen.getByRole('textbox', { name: '나의 말로 한 줄' })).toHaveValue('서둘러 가는 책')
  })

  it('선반: 책 한 줄과 옛 조각 한 줄이 함께 보인다', async () => {
    reset({ shelved: { mk: 1 }, myLines: { 'lk-015-008': '등불을 켜고', 'book:mk': '마가에 대한 말' } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'shelf' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('tab', { name: '내가 남긴 한 줄' }))
    expect(screen.getByText('마가복음').closest('li')).toHaveTextContent('마가에 대한 말')
    expect(screen.getByText(/잃은 드라크마/).closest('li')).toHaveTextContent('등불을 켜고')
  })
})

describe('벤치', () => {
  it('벤치 읽기: 다시 읽을 구절이 맨 위에 따로 나온다', () => {
    const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    useGame.setState({ game: { ...base, collected: ['mk-001-001', 'mk-001-009'], rereads: ['mk-001-009'] }, modal: { kind: 'readPick' } })
    render(<ModalLayer />)
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    expect(items[0]).toContain('다시 읽을 구절')
    expect(items[0]).toContain('비둘기 같이')
  })
})

describe('하루', () => {
  it('침대 → 되새김 → 잠 → 일지', async () => {
    reset({ collected: ['lk-015-008'], todayHeard: ['lk-015-008'] })
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.bed.tiles[0]))
    walk()
    expect(screen.getByRole('dialog', { name: '잠들기 전에' })).toBeInTheDocument()
    expect(screen.getByLabelText('성경 본문 눅 15:8-10')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '잠자리에 들기' }))
    expect(useGame.getState().game.clock.day).toBe(2)
    walk() // 둘째 날 아침의 장면(작은 손님)
    expect(screen.getByRole('dialog', { name: '작은 손님' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    act(() => useGame.getState().open({ kind: 'journal' }))
    expect(screen.getByText(/1일째\. 맑음\. 이야기를 들었다\(눅 15:8-10\)\./)).toBeInTheDocument()
  })

  it('일지 문장', () => {
    expect(journalLine({ day: 1, heard: [] })).toBe('1일째. 맑음. 조용한 하루였다.')
    expect(journalLine({ day: 2, heard: [], notes: ['strays'] })).toBe('2일째. 맑음. 마당에 작은 손님들이 왔다.')
  })

  it('첫 장면은 환영, 본 뒤에는 다시 뜨지 않는다', async () => {
    reset({ scenes: ['welcome'] })
    const user = userEvent.setup()
    render(<ModalLayer />)
    walk()
    expect(screen.getByRole('dialog', { name: '이름 없는 작은 마을' })).toHaveTextContent('마을 서고를 맡게 된 견습 필사가입니다')
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().game.scenes).toEqual([])
    act(() => useGame.getState().frame(0.05))
    expect(useGame.getState().modal).toBeNull()
  })

  it('떠돌이 새끼에게 밥을 주고 이름을 짓는다', async () => {
    reset(at(9 * 60, 2))
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap({ x: 5, y: 9 }))
    walk()
    await user.type(screen.getByRole('textbox'), '보리')
    await user.click(screen.getByRole('button', { name: '밥 주기' }))
    expect(useGame.getState().game.companion).toMatchObject({ kind: 'cat', name: '보리' })
  })

  it('배고플 때 기록자를 누르면 돌보기', async () => {
    reset({ needs: { hunger: 80, fatigue: 0, cold: 0, heat: 0 } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    const p = useGame.getState().game.player
    act(() => useGame.getState().tap({ x: p.x, y: p.y }))
    expect(screen.getByRole('dialog', { name: '돌보기' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '먹이기' }))
    expect(useGame.getState().game.needs.hunger).toBe(30)
  })
})

describe('리뷰 지적 회귀 (화면)', () => {
  it('m1: 손일은 끝내기 전에 그만둘 수 있고, 아무것도 쓰지 않는다', async () => {
    reset()
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'talk', neighborId: 'baker', line: '…' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '반죽 치대기 돕기' }))
    await user.click(screen.getByRole('button', { name: '그만두기' }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.inv).toEqual({ water: 1, bread: 2 })
    expect(useGame.getState().game.helped).toEqual([])
  })
  it('M4: 책상 순서를 바꾸면 바로 저장된다', async () => {
    const chapter1 = lkChapter1
    reset({ collected: chapter1, ...lkDesk({ 1: [...chapter1] }) })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '데오빌로 각하에게 아래로' }))
    expect(JSON.parse(localStorage.getItem('twenty-seven/save')!).progress.lk.arrangement[1][1]).toBe('lk-001-001')
  })
  it('N1: 도착하며 띄운 알림이 같은 프레임에 지워지지 않는다', () => {
    reset({ inv: { water: 9, bread: 2 } })
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.well.tiles[0]))
    act(() => {
      for (let i = 0; i < 400 && !useGame.getState().toast; i++) useGame.getState().frame(0.05)
    })
    expect(useGame.getState().toast?.text).toBe('더 담을 수 없습니다.')
    act(() => useGame.getState().frame(0.05))
    expect(useGame.getState().toast?.text).toBe('더 담을 수 없습니다.')
    // 2.6초 뒤에는 사라진다
    act(() => {
      for (let i = 0; i < 60; i++) useGame.getState().frame(0.05)
    })
    expect(useGame.getState().toast).toBeNull()
  })
})

describe('벤치', () => {
  it.each(['bench', 'hill'] as const)('%s → 성경구절 고르기 → 본문 창, 피로가 풀린다', async (place) => {
    // 눅 1:1-4는 이제 처음부터 가진 조각이 아니다 — 들은 것으로 둔다
    reset({ collected: ['lk-001-001'], needs: { hunger: 0, fatigue: 70, cold: 0, heat: 0 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'menu', place } })
    render(<ModalLayer />)
    expect(screen.queryByRole('button', { name: '잠시 앉아 쉬기' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '성경구절 읽기' }))
    await user.click(screen.getByRole('button', { name: /데오빌로 각하에게/ }))
    expect(screen.getByLabelText('성경 본문 눅 1:1-4')).toBeInTheDocument()
    expect(useGame.getState().game.needs.fatigue).toBeLessThan(45)
    expect(useGame.getState().toast?.text).toContain('피로가 조금 풀렸다')
  })
})

describe('선반', () => {
  it('도감: 사도행전 조각과 거르기 버튼은 사도행전 방이 열린 뒤에만', () => {
    // 사도행전 조각 (계획 5 작업 2·3에서 1–28장을 넣었다)
    const ac: Piece[] = piecesOf('ac')
    expect(ac.length).toBeGreaterThan(0)
    const pieces = PIECES
    for (const flags of [{}, { gospelFeast: 1 }]) {
      const closed = dexView(pieces, flags, 'all', false)
      expect(closed.books).toEqual(['mt', 'mk', 'lk', 'jn'])
      expect(closed.list.some((p) => p.book === 'ac')).toBe(false)
      // 기억해 둔 거르기가 사도행전이어도 방이 닫혀 있으면 비어 있다
      expect(dexView(pieces, flags, 'ac', false).list).toEqual([])
    }
    const open = dexView(pieces, { gospelFeast: 2 }, 'all', false)
    expect(open.books).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(open.list.filter((p) => p.book === 'ac')).toEqual(ac)
    // "한 복음서에만"(✦)에는 사도행전 조각이 들지 않는다
    expect(dexView(pieces, { gospelFeast: 2 }, 'all', true).list.some((p) => p.book === 'ac')).toBe(false)
  })

  it('도감: 누가에만 거르기와 들은 이야기 열기', async () => {
    reset({ collected: ['lk-015-008', 'lk-015-001'] })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'shelf' } })
    render(<ModalLayer />)
    // 도감에 보이는 책(방이 열리기 전에는 네 복음서)의 조각 중 2개를 들었다
    const shown = dexView(PIECES, useGame.getState().game.flags, 'all', false)
    expect(shown.books).toEqual(['mt', 'mk', 'lk', 'jn'])
    expect(shown.list.length).toBe(piecesOf('mt').length + piecesOf('mk').length + piecesOf('lk').length + piecesOf('jn').length)
    expect(screen.getAllByText('아직 듣지 못한 이야기').length).toBe(shown.list.length - 2)
    // 사도행전 거르기 버튼은 방이 열리기 전에는 없다
    expect(screen.queryByRole('button', { name: '사도행전' })).toBeNull()
    // 책마다 장을 따로 묶고, 장은 처음에 접혀 있다
    expect(screen.getByText('마가복음 1장').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText('누가복음 1장')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /한 복음서에만/ }))
    expect(screen.queryByText('잃은 양')).toBeNull()
    await user.click(screen.getByText('누가복음 15장'))
    expect(screen.getByText('누가복음 15장').closest('details')).toHaveAttribute('open')
    await user.click(screen.getByRole('button', { name: /잃은 드라크마/ }))
    expect(screen.getByLabelText('성경 본문 눅 15:8-10')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.getByRole('dialog', { name: '선반' })).toBeInTheDocument()
    // 본문을 보고 돌아와도 펼친 장은 펼친 채로
    expect(screen.getByText('누가복음 15장').closest('details')).toHaveAttribute('open')
  })

  it('도감: 책을 고르면 그 책의 장만 보이고, 본문을 보고 와도 고른 책이 남는다', async () => {
    reset({ collected: ['lk-015-008', 'mk-001-001'] })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'shelf' } })
    render(<ModalLayer />)
    // 앞 시험에서 켠 "한 복음서에만"은 기억되어 있다 — 끈다
    await user.click(screen.getByRole('button', { name: '모두' }))
    const books = screen.getByRole('group', { name: '책 고르기' })
    expect(within(books).getAllByRole('button').map((b) => b.textContent)).toEqual(['전체', '마태복음', '마가복음', '누가복음', '요한복음'])
    expect(within(books).getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(books).getByRole('button', { name: '누가복음' }))
    expect(screen.queryByText('마가복음 1장')).toBeNull()
    expect(screen.queryByText('마태복음 1장')).toBeNull()
    expect(screen.getByText('누가복음 1장').closest('details')).not.toHaveAttribute('open')
    expect(screen.getAllByText('아직 듣지 못한 이야기')).toHaveLength(piecesOf('lk').length - 1)
    // 한 복음서에만 거르기와 함께 쓴다
    await user.click(screen.getByRole('button', { name: /한 복음서에만/ }))
    expect(screen.getAllByText('아직 듣지 못한 이야기')).toHaveLength(piecesOf('lk').filter((p) => p.stamps.length === 0).length - 1)
    await user.click(screen.getByText('누가복음 15장'))
    await user.click(screen.getByRole('button', { name: /잃은 드라크마/ }))
    await user.click(screen.getByRole('button', { name: '뒤로' }))
    const back = screen.getByRole('group', { name: '책 고르기' })
    expect(within(back).getByRole('button', { name: '누가복음' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('마가복음 1장')).toBeNull()
    // 다음 시험을 위해 되돌린다
    await user.click(within(back).getByRole('button', { name: '전체' }))
    await user.click(screen.getByRole('button', { name: '모두' }))
  })

  it('방 꾸미기: 깔개를 놓고 다시 거둔다', async () => {
    reset({ inv: { rug: 1 } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'shelf' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '방 꾸미기' }))
    act(() => useGame.getState().startDecorate('rug'))
    act(() => useGame.getState().tap({ x: 5, y: 5 }))
    expect(useGame.getState().game.room).toEqual([{ item: 'rug', x: 5, y: 5 }])
    act(() => useGame.getState().tap({ x: 5, y: 5 }))
    expect(useGame.getState().game.room).toEqual([])
    expect(useGame.getState().game.inv.rug).toBe(1)
  })
})

describe('복음서 방 잔치와 사도행전 방 예고', () => {
  it('잔치 아침 장면: 성경 본문 없이 이웃 몇 마디, 닫으면 앨범에 한 장 남고 하루가 이어진다', async () => {
    reset({ scenes: ['gospelFeast'], flags: { heartPoints: 1, gospelFeast: 1 }, shelved: { mt: 0, mk: 0, lk: 0, jn: 0 } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    walk()
    const dialog = screen.getByRole('dialog', { name: '복음서 방이 다 찼다' })
    expect(dialog).toHaveTextContent('광장')
    expect(screen.queryByLabelText(/성경 본문/)).toBeNull()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.album.filter((a) => a.id === 'gospelFeast')).toHaveLength(1)
    // 결말 창 없이 시계가 계속 흐른다
    const before = useGame.getState().game.clock.minute
    act(() => useGame.getState().frame(1))
    expect(useGame.getState().game.clock.minute).toBeGreaterThan(before)
  })
  it('잔치 날에는 사도행전 방이 잠겨 있고, 다음 날부터 문을 밟고 들어간다 (계획 5 작업 5)', () => {
    reset({ flags: { heartPoints: 1, gospelFeast: 1 } })
    act(() => useGame.getState().tap(LOCKED_DOORS[0]))
    expect(useGame.getState().toast?.text).toBe('사도행전 방은 아직 잠겨 있어요.')
    // 잔치 다음 날: 서고 안에서 문을 누르면 잠겼다는 말 없이 걸어 들어간다
    const lib = ROOMS.find((r) => r.owner === 'library')!
    const inLib = WARPS.get(key(lib.door))!
    reset({ flags: { heartPoints: 1, gospelFeast: 2 }, player: { ...newGame(CONTENT).player, x: inLib.x, y: inLib.y, path: [] } })
    act(() => useGame.getState().tap(LOCKED_DOORS[0]))
    expect(useGame.getState().toast).toBeNull()
    act(() => {
      for (let i = 0; i < 400 && roomAt(playerTile(useGame.getState().game)) !== ACTS_ROOM; i++) useGame.getState().frame(0.05)
    })
    expect(roomAt(playerTile(useGame.getState().game))).toBe(ACTS_ROOM)
    expect(useGame.getState().toast?.text).toBe('사도행전 방')
    // 다른 잠긴 방은 그대로
    act(() => useGame.getState().tap(LOCKED_DOORS[1]))
    expect(useGame.getState().toast?.text).toContain('아직 잠겨 있어요')
  })
})

describe('사도행전 방의 여정 판 (계획 5 작업 5)', () => {
  const allCh = Array.from({ length: 28 }, (_, i) => i + 1)
  it('카드를 누르면 그 곳이 나오는 구절(개역한글)을 보여 주고, ▲▼로 본문 순서를 맞추면 완성', async () => {
    // 1장만 엮은 판: 예루살렘 카드 한 장
    reset({ flags: { heartPoints: 1, gospelFeast: 2 }, progress: { ...emptyProgress(), ac: { completed: [1], arrangement: {} } }, journey: [1] })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'journey' } })
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '여정 판' })).toHaveTextContent(`카드 1 / ${JOURNEY.length}장`)
    await user.click(screen.getByRole('button', { name: '예루살렘 카드 구절 보기' }))
    const passage = screen.getByLabelText(`성경 본문 ${JOURNEY[0].ref}`)
    expect(passage).toHaveTextContent(versesOf(JOURNEY[0].ref)[0].text)
    await user.click(screen.getByRole('button', { name: '판으로 돌아가기' }))
    // 모든 장을 엮고 마지막 두 장만 바뀐 판 → ▲ 한 번으로 완성
    const orders = JOURNEY.map((c) => c.order)
    const swapped = [...orders.slice(0, -2), orders.at(-1)!, orders.at(-2)!]
    act(() => useGame.setState((st) => ({ game: { ...st.game, progress: { ...st.game.progress, ac: { completed: allCh, arrangement: {} } }, journey: swapped } })))
    await user.click(screen.getByRole('button', { name: '차례 확인' }))
    expect(screen.getByRole('status')).toHaveTextContent('차례가 어긋난 카드가 있어요.')
    // 맨 끝에 놓인 카드(끝에서 둘째 카드)를 한 칸 위로
    const last = JOURNEY.at(-2)!.place
    await user.click(screen.getAllByRole('button', { name: `${last} 위로` }).at(-1)!)
    expect(useGame.getState().game.journey).toEqual(orders)
    expect(useGame.getState().game.flags.actsShip).toBe(1)
    expect(screen.getByRole('status')).toHaveTextContent('여정을 끝까지 이었어요.')
    // 다 이은 판은 더 옮기지 않는다
    expect(screen.queryByRole('button', { name: `${last} 위로` })).toBeNull()
  })

  it('다음 날 아침 나루에 배 장면 — 닫으면 앨범에 한 장', async () => {
    reset({ scenes: ['actsShip'], flags: { heartPoints: 1, gospelFeast: 2, actsShip: 2 } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    walk()
    const dialog = screen.getByRole('dialog', { name: '나루에 배가 들어왔다' })
    expect(screen.queryByLabelText(/성경 본문/)).toBeNull()
    expect(dialog).toHaveTextContent('나루')
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().game.album.filter((a) => a.id === 'actsShip')).toHaveLength(1)
  })
})

describe('방 꾸미기 누르기 (QA)', () => {
  it('물건을 들고 협탁을 누르면 그 위에 올린다', () => {
    reset({ room: [{ item: 'nightstand', x: 3, y: 4 }], inv: { vase: 1 } })
    useGame.setState({ decorating: 'vase' })
    useGame.getState().tap({ x: 3, y: 4 })
    const g = useGame.getState().game
    expect(g.room).toEqual([{ item: 'nightstand', x: 3, y: 4 }, { item: 'vase', x: 3, y: 4, on: true }])
  })
  it('치우기에서는 깔개가 차지한 어느 칸을 눌러도 치운다', () => {
    reset({ room: [{ item: 'rug', x: 3, y: 6 }], inv: {} })
    useGame.setState({ decorating: 'pick' })
    useGame.getState().tap({ x: 5, y: 7 })
    expect(useGame.getState().game.room).toEqual([])
    expect(useGame.getState().game.inv.rug).toBe(1)
  })
})

describe('다음 일정 (상단 한 줄)', () => {
  it('누르면 전체 일정 창이 열린다', async () => {
    reset()
    const user = userEvent.setup()
    render(<><NextEventBar /><ModalLayer /></>)
    const bar = screen.getByRole('button', { name: /다음 일정/ })
    expect(bar).toHaveTextContent('장날')
    await user.click(bar)
    expect(screen.getByRole('dialog', { name: '일정' })).toBeInTheDocument()
  })
  it('시작 30분 전에 알림이 뜬다', () => {
    reset()
    const { unmount } = renderHook(() => useEventAlerts())
    const g = useGame.getState().game
    // 7일째 장날 상인은 07:30부터 — 06:59 → 07:00
    act(() => useGame.setState({ game: { ...g, clock: { day: 7, minute: 419 } } }))
    act(() => useGame.setState({ game: { ...g, clock: { day: 7, minute: 420 } } }))
    expect(useGame.getState().toast?.text).toMatch(/^30분 뒤 장날/)
    unmount()
  })
})

describe('화면 크기 (설정)', () => {
  it('100~200% 다섯 단계에서 고르고, 저장된다', async () => {
    reset()
    useGame.setState({ zoom: 1 })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'settings' } })
    render(<ModalLayer />)
    const group = screen.getByRole('group', { name: '화면 확대' })
    expect(group).toHaveTextContent('100%125%150%175%200%')
    await user.click(screen.getByRole('button', { name: '150%' }))
    expect(useGame.getState().zoom).toBe(1.5)
    expect(localStorage.getItem('twenty-seven-zoom')).toBe('1.5')
    expect(screen.getByRole('button', { name: '150%' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('기록 초기화 (설정)', () => {
  it('한 번 더 묻고, 취소하면 그대로 두고, 확인하면 저장과 일지 그림만 지운다', async () => {
    localStorage.clear()
    localStorage.setItem('twenty-seven/save', '{"version":1}')
    localStorage.setItem('twenty-seven/album/x', 'data')
    localStorage.setItem('twenty-seven-zoom', '1.5')
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'settings' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '처음부터' }))
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(localStorage.getItem('twenty-seven/save')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: '처음부터' }))
    await user.click(screen.getByRole('button', { name: '모두 지우기' }))
    expect(localStorage.getItem('twenty-seven/save')).toBeNull()
    expect(localStorage.getItem('twenty-seven/album/x')).toBeNull()
    expect(localStorage.getItem('twenty-seven-zoom')).toBe('1.5')
    // 새로고침 직전 창 닫힘 저장이 와도 옛 기록이 되살아나지 않는다
    saveGame(useGame.getState().game)
    expect(localStorage.getItem('twenty-seven/save')).toBeNull()
  })
})
