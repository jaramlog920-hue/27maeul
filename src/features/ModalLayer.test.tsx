import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, JOURNEY, pieceById, PIECES, piecesOf, versesOf } from '../content/catalog'
import type { Piece } from '../engine/types'
import { dexView } from './word/Word'
import { pickableBooks } from '../engine/books'
import { chaptersOf, emptyProgress } from '../engine/books'
import { chooseBook, newGame, playerTile, type GameState } from '../engine/game'
import { mulberry32 } from '../engine/offers'
import { isWet, weatherOf } from '../engine/calendar'
import { onceKey } from '../engine/stories'
import { ACTS_ROOM, HEB_JUD_ROOM, HOME_FRONT, key, LETTERS_ROOM, LOCKED_DOORS, HOME_RECT, PLACES, roomAt, ROOMS, WARPS } from '../engine/world'
import { ITEM_TEXT, SCENES, T } from '../content/text'
import { STRAY_SPOTS } from '../engine/companion'
import { useGame } from '../store/game-store'
import { saveGame } from '../engine/save'
import { ModalLayer } from './ModalLayer'
import { NextEventBar, useEventAlerts } from './play/EventSchedule'
import { Hud } from './play/Hud'
import { DecorateBar } from './play/DecorateBar'
import { journalLine } from './journal/Journal'

/** 예전 지도 위 집의 칸 → 지금 집 안 방의 같은 칸 */
const h = (x: number, y: number) => ({ x: x + HOME_RECT.x0 - 2, y: y + HOME_RECT.y0 - 2 })
/** 기록자를 집 문 앞(마을)에 세운다 — 새 게임은 집 안(지도 아래 따로 된 방)에서 시작한다 */
function goOutside() {
  useGame.setState((s) => ({ game: { ...s.game, player: { ...s.game.player, ...HOME_FRONT, path: [] } } }))
}

function reset(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, decorSel: null, toast: null })
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

  it('비슷한 이야기 도장에는 따로 단서 문구를 붙이지 않는다', () => {
    useGame.setState({ modal: { kind: 'passage', pieceId: 'lk-015-001', askLine: false } })
    render(<ModalLayer />)
    expect(screen.getByText(/비슷한 이야기 · 마 18:12-14/)).not.toHaveTextContent('같은 일인지는')
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
    goOutside()
    act(() => useGame.setState((s) => ({ game: chooseBook(s.game, 'lk', CONTENT) })))
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().frame(0.01))
    // 오늘 특별한 대화로 말씀 조각을 건넬 이웃 (드물게 오므로 보이는 이웃 하나에 직접 배정 — 계획 14 작업 5)
    const vis = useGame.getState().game
    const teller = CONTENT.neighbors.find((n) => !n.romanceable && n.id !== 'postman' && vis.npcs[n.id]?.visible)!.id
    act(() => useGame.setState((s) => ({ game: { ...s.game, offers: { [teller]: 'lk-001-001' } } })))
    const g0 = useGame.getState().game
    const who = Object.keys(g0.offers).find((id) => g0.npcs[id]?.visible)!
    const npc = g0.npcs[who]
    act(() => useGame.getState().tap({ x: Math.round(npc.x), y: Math.round(npc.y) }))
    walk()
    const role = CONTENT.neighbors.find((n) => n.id === who)!.role
    // 걸어가 곁에 서기만 해서는 창이 뜨지 않는다 — '대화하기' 단추로 말을 건다
    expect(screen.queryByRole('dialog', { name: role })).toBeNull()
    // 받기 단추 없이, 말을 걸면 그 자리에서 조각을 건네고 그 이웃의 말과 함께 본문이 열린다
    act(() => useGame.getState().talkTo(who))
    expect(screen.queryByRole('button', { name: '말씀 조각 받기' })).toBeNull()
    expect(useGame.getState().game.hearts[who]).toBe(2)
    const got = useGame.getState().game.collected.at(-1)!
    expect(got.startsWith('lk-001-')).toBe(true)
    expect(useGame.getState().game.offers[who]).toBeUndefined()
    expect(screen.getByRole('dialog', { name: CONTENT.pieces.find((p) => p.id === got)!.title })).toHaveTextContent(role)
    expect(useGame.getState().toast?.text).toContain('말씀 탭에 담겼어요')
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

  it('집 책상은 필사 책상: 27권 모두 고르고, 재료 없이 한 절씩 따라 적는다 (계획 14)', async () => {
    reset({ inv: {}, collected: [] })
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
    walk()
    // 처음 책상을 열면 책 고르기 — 서고 방이 닫혀 있어도 사도행전·요한계시록까지 모두
    expect(screen.getByRole('dialog', { name: '필사' })).toHaveTextContent('어느 책을 필사할까요?')
    expect(screen.getByRole('button', { name: /사도행전 · 0\/28장/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /요한계시록 · 0\/22장/ })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /누가복음 · 0\/24장/ }))
    expect(useGame.getState().game.copy.book).toBe('lk')
    const verses = versesOf('눅 1:1-80')
    expect(screen.getByRole('heading')).toHaveTextContent(`누가복음 1장 · 1/${verses.length}절`)
    expect(screen.getByLabelText('본문 누가복음 1:1')).toHaveTextContent(verses[0].text)
    // 붙여넣기는 받지 않는다
    const box = screen.getByLabelText('따라 적기')
    box.focus()
    await user.paste(verses[0].text)
    expect(useGame.getState().game.copyStats.verses).toBe(0)
    // 한 글자씩 따라 적으면 절이 기록되고 다음 절이 올라온다 (재료 없이)
    await user.type(box, verses[0].text)
    expect(screen.getByRole('status')).toHaveTextContent('✓ 누가복음 1:1 기록')
    expect(screen.getByRole('heading')).toHaveTextContent(`누가복음 1장 · 2/${verses.length}절`)
    expect(useGame.getState().game.copyStats.verses).toBe(1)
    expect(useGame.getState().game.inv).toEqual({})
  })

  it('예전 엮기 창(테스트로만 열림)도 재료 없이 장을 마무리한다', async () => {
    reset({ collected: chapter1, inv: {}, ...lkDesk({ 1: [...chapter1] }) })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'desk', result: null, dark: false } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '이어 붙이기' }))
    expect(screen.getByRole('dialog', { name: '기록하기 전에' })).toBeInTheDocument()
    solveQuiz()
    await user.click(screen.getByRole('button', { name: '두루마리에 기록하기' }))
    expect(screen.getByRole('status')).toHaveTextContent('1장까지 차례대로 이어 붙였습니다.')
    expect(useGame.getState().game.scenes).toContain('firstChapter')
    expect(useGame.getState().game.inv).toEqual({})
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

  it('밤에 기름이 없어도 필사 책상은 쓸 수 있다 (재료 없음) — 앉기만 해서는 기름을 쓰지 않는다', async () => {
    reset({ ...at(20 * 60), inv: {}, copy: { book: 'lk', at: {}, legacy: {} } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
    walk()
    // 쓰던 책이 있으면 책상 메뉴: [이어서 필사] [다른 책 선택]
    expect(screen.getByRole('heading')).toHaveTextContent('필사 책상')
    await user.click(screen.getByRole('button', { name: '이어서 필사' }))
    expect(screen.getByRole('heading')).toHaveTextContent('누가복음 1장 · 1/')
    expect(screen.getByLabelText('따라 적기')).toBeEnabled()
  })

  it('밤에 한 절을 적으면 등잔을 켜고 기름은 소비하지 않는다', async () => {
    reset({ ...at(20 * 60), inv: { oil: 1 }, copy: { book: 'lk', at: {}, legacy: {} } })
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.desk.tiles[0]))
    walk()
    expect(useGame.getState().game.inv.oil).toBe(1)
    act(() => useGame.getState().copyView('write'))
    act(() => void useGame.getState().copyType(versesOf('눅 1:1')[0].text))
    expect(useGame.getState().game.copyStats.verses).toBe(1)
    expect(useGame.getState().game.inv.oil ?? 0).toBe(1)
    expect(useGame.getState().game.lampLitDay).toBe(1)
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
    // 재료는 들지 않는다 (계획 14)
    expect(useGame.getState().game.inv).toEqual({ papyrus: 1, ink: 1 })
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
  it('서고: 제본한 마가복음을 "퀴즈 풀고 금박 책등"으로 꽂으면 퀴즈가 열리고, 마치면 책등이 붙는다', async () => {
    const user = userEvent.setup()
    const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    useGame.setState({
      game: { ...base, bound: { mk: { day: 1 } }, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } } },
      modal: { kind: 'library' },
      rng: mulberry32(5),
    })
    const { container } = render(<ModalLayer />)
    // 복음서 방 선반에는 네 복음서만 (사도행전은 자기 방 — 계획 5 작업 5)
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(4)
    expect(container.querySelector('.library-shelf')!.textContent).not.toContain('사도행전')
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
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
      // 세 권을 먼저 꽂아 두면 네 번째(마가복음)에 나루가 열린다 (4권 나루)
      game: { ...base, shelved: { mt: 1, lk: 1, jn: 1 }, bound: { mk: { day: 1 } }, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } } },
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
  it('서고: 꽂은 알림의 조사가 책 이름 받침에 맞는다 (마가복음을 / 빌레몬서를)', () => {
    const cases = [
      ['mk', '마가복음을 서고에 꽂았습니다.'],
      ['phm', '빌레몬서를 서고에 꽂았습니다.'],
    ] as const
    for (const [book, text] of cases) {
      const open = { ...newGame(CONTENT).flags, gospelFeast: 2, 'room:romPhm': 1 }
      const base = chooseBook({ ...newGame(CONTENT), flags: open }, book, CONTENT)
      useGame.setState({
        game: { ...base, scenes: [], bound: { [book]: { day: 1 } }, collected: piecesOf(book).map((p) => p.id), progress: { ...base.progress, [book]: { completed: chaptersOf(book, CONTENT), arrangement: {} } } },
        modal: null,
        toast: null,
        rng: mulberry32(5),
      })
      useGame.getState().startShelve(book)
      for (let i = 0; i < 5; i++) {
        const m = useGame.getState().modal
        if (m?.kind !== 'quiz') throw new Error('quiz expected')
        useGame.getState().answerQuiz(m.questions[m.index].answer as string | string[])
        useGame.getState().nextQuiz()
      }
      expect(useGame.getState().toast?.text).toMatch(new RegExp(`^${text}`))
    }
  })
})

describe('나의 한 줄 (책)', () => {
  /** 마가복음을 다 엮은 상태에서 서고 퀴즈를 모두 맞힌다 */
  function shelveMk() {
    const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    localStorage.clear()
    useGame.setState({
      game: { ...base, scenes: [], bound: { mk: { day: 1 } }, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } }, inv: { goldLeaf: 1, oil: 1 } },
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
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
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

  it('"나중에 적기"로 넘기면 아무것도 남기지 않고, 📖 말씀 › 서고에서 나중에 적는다', async () => {
    shelveMk()
    const user = userEvent.setup()
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
    answerAll(true) // 하나 틀려 금박이 아니다 → 다시 도전할 수 있다
    await user.click(screen.getByRole('button', { name: '나중에 적기' }))
    expect(useGame.getState().game.myLines).toEqual({})
    expect(screen.getByRole('dialog', { name: '마을 서고' })).toBeInTheDocument()
    // 다시 도전으로 등급이 바뀌어도 다시 묻지 않는다
    await user.click(screen.getByRole('button', { name: '다시 도전' }))
    answerAll()
    expect(useGame.getState().modal?.kind).toBe('library')
    // 📖 말씀 › 서고의 책 줄에서 적는다
    act(() => useGame.getState().open({ kind: 'word', tab: 'library' }))
    const row = document.querySelector('.word-lib-row[data-book="mk"]') as HTMLElement
    expect(row).toHaveTextContent('아직 적지 않았어요.')
    await user.click(within(row).getByRole('button', { name: '적기' }))
    expect(useGame.getState().modal).toEqual({ kind: 'myLine', lineKey: 'book:mk', back: 'word' })
    await user.type(screen.getByRole('textbox', { name: '나의 말로 한 줄' }), '서둘러 가는 책')
    await user.click(screen.getByRole('button', { name: '남기기' }))
    // 말씀 › 서고로 돌아와 그 책 줄에 보인다
    expect(useGame.getState().modal).toEqual({ kind: 'word', tab: 'library' })
    expect(screen.getByRole('tab', { name: '서고' })).toHaveAttribute('aria-selected', 'true')
    const again = document.querySelector('.word-lib-row[data-book="mk"]') as HTMLElement
    expect(again).toHaveTextContent('서둘러 가는 책')
    await user.click(within(again).getByRole('button', { name: '고치기' }))
    expect(screen.getByRole('textbox', { name: '나의 말로 한 줄' })).toHaveValue('서둘러 가는 책')
  })

  it('나의 한 줄: 책 한 줄은 말씀 › 서고의 책 옆에, 조각 한 줄은 말씀 › 말씀 조각의 그 조각 옆에', async () => {
    reset({ shelved: { mk: 1 }, collected: ['lk-015-008'], myLines: { 'lk-015-008': '등불을 켜고', 'book:mk': '마가에 대한 말' } })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'word', tab: 'library' } })
    render(<ModalLayer />)
    expect(document.querySelector('.word-lib-row[data-book="mk"]')).toHaveTextContent('마가에 대한 말')
    expect(within(document.querySelector('.word-lib-row[data-book="mk"]') as HTMLElement).getByRole('button', { name: '고치기' })).toBeInTheDocument()
    // 꽂지도 않고 한 줄도 없는 책에는 한 줄 칸이 없다
    expect(document.querySelector('.word-lib-row[data-book="mt"] .word-lib-line')).toBeNull()
    await user.click(screen.getByRole('tab', { name: '말씀 조각' }))
    const piece = screen.getByText(/잃은 드라크마/).closest('li')!
    expect(piece).toHaveTextContent('나의 한 줄')
    expect(piece).toHaveTextContent('등불을 켜고')
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
    expect(screen.getByText(/1일째\. 맑음\. 사본을 보고 베꼈다\(눅 15:8-10\)\./)).toBeInTheDocument()
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
    goOutside()
    const user = userEvent.setup()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(STRAY_SPOTS.cat))
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
    goOutside()
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

describe('곁에서 누르면 그 자리에서 바로 열린다', () => {
  it('작업대 대각선 곁에서 누르면 정해진 자리로 걸어가지 않고 연다', () => {
    reset({})
    const g = useGame.getState().game
    const t = PLACES.workbench.tiles[0]
    const at = { x: t.x - 1, y: t.y - 1 }
    useGame.setState({ modal: null, game: { ...g, player: { ...g.player, x: at.x, y: at.y, path: [] } } })
    act(() => useGame.getState().tap(t))
    expect(useGame.getState().game.player.path).toEqual([])
    act(() => useGame.getState().frame(0.05))
    expect(useGame.getState().modal).toEqual({ kind: 'menu', place: 'workbench' })
    expect(playerTile(useGame.getState().game)).toEqual(at)
  })
})

describe('자리마다 제 창이 열린다', () => {
  // 집 앞 벤치(homeBench)를 더하면서 화덕·작업대·기름틀·언덕이 모두 "장터 벤치" 창을 열던 일 (2026-10-01)
  it.each([
    ['hearth', 'hearth'],
    ['workbench', 'workbench'],
    ['press', 'press'],
    ['hill', 'hill'],
    ['bench', 'bench'],
    ['homeBench', 'homeBench'],
  ] as const)('%s를 누르면 %s 창', (id, menu) => {
    reset({})
    const g = useGame.getState().game
    const tile = PLACES[id].tiles[0]
    useGame.setState({ modal: null, game: { ...g, player: { ...g.player, x: tile.x, y: tile.y + 1, path: [] } } })
    act(() => useGame.getState().tap(tile))
    act(() => {
      for (let i = 0; i < 400 && useGame.getState().modal === null; i++) useGame.getState().frame(0.05)
    })
    expect(useGame.getState().modal).toEqual({ kind: 'menu', place: menu })
  })
})

describe('언덕 별 보기 (계획 9 작업 2)', () => {
  const clearDay = [...Array(60).keys()].map((d) => d + 1).find((d) => !isWet(weatherOf(d)) && weatherOf(d) !== 'fog')!
  const wetDay = [...Array(60).keys()].map((d) => d + 1).find((d) => isWet(weatherOf(d)))!
  /** 새 게임 + 요한계시록을 고른 상태 (고른 책과 상관없이 별 편지함은 같다) */
  function revChosen(day: number, minute: number) {
    const s = newGame(CONTENT)
    const open = { ...s, clock: { day, minute }, flags: { ...s.flags } }
    reset(chooseBook(open, 'rev', CONTENT))
  }

  it('언덕에만 "별 보기" — 저녁 여덟 시 전에는 흐리게, 안내 한 줄', () => {
    reset(at(12 * 60))
    useGame.setState({ modal: { kind: 'menu', place: 'hill' } })
    const { unmount } = render(<ModalLayer />)
    expect(screen.getByRole('button', { name: '별 보기' })).toBeDisabled()
    expect(screen.getByText('별은 저녁 여덟 시가 지나야 보여요.')).toBeInTheDocument()
    // 별 보기는 성경구절 읽기 위
    const names = screen.getAllByRole('button').map((b) => b.textContent)
    expect(names.indexOf('별 보기')).toBeLessThan(names.indexOf('성경구절 읽기'))
    unmount()
    useGame.setState({ modal: { kind: 'menu', place: 'bench' }, game: { ...useGame.getState().game, clock: { day: 1, minute: 22 * 60 } } })
    render(<ModalLayer />)
    expect(screen.queryByRole('button', { name: '별 보기' })).not.toBeInTheDocument()
  })

  it('맑은 밤: 별 장면을 먼저 보이고, 닫으면 편지함에서 꺼낸 말씀 조각 하나 알림', async () => {
    revChosen(clearDay, 22 * 60)
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'menu', place: 'hill' } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '별 보기' }))
    expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'stars' })
    const got = useGame.getState().game.collected
    expect(got).toHaveLength(1)
    expect(useGame.getState().toast).toBeNull()
    act(() => useGame.getState().nextScene())
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().toast?.text).toBe(`벤치 곁 편지함에서 말씀 조각 하나를 꺼냈어요 · ${pieceById(got[0]).title} — 말씀 탭에 담겼어요`)
  })

  it('맑은 밤 별 장면을 별 보기로 바로 열어도 풍경 앨범 사진을 남긴다', () => {
    revChosen(clearDay, 22 * 60)
    useGame.setState({ capture: () => 'data:image/png;base64,stars' })
    act(() => useGame.getState().sitHill())
    expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'stars' })
    expect(localStorage.getItem('twenty-seven/album/stars')).toBe('data:image/png;base64,stars')
    useGame.setState({ capture: null })
  })

  it('장면을 이미 본 밤에는 바로 알림', () => {
    revChosen(clearDay, 22 * 60)
    const g = useGame.getState().game
    useGame.setState({ game: { ...g, flags: { ...g.flags, [onceKey('stars', clearDay)]: 1 } } })
    act(() => useGame.getState().sitHill())
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().toast?.text).toMatch(/^벤치 곁 편지함에서/)
  })

  it('궂은 밤: 편지는 없고 흐림 알림', () => {
    revChosen(wetDay, 22 * 60)
    act(() => useGame.getState().sitHill())
    expect(useGame.getState().game.collected).toEqual([])
    expect(useGame.getState().toast?.text).toBe('오늘 밤은 하늘이 흐려 별이 잘 보이지 않아요.')
  })

  it('낮에 편지 나르는 이웃: 편지 받기 단추도, 언덕 편지함 안내 줄도 없다', () => {
    revChosen(clearDay, 10 * 60)
    useGame.setState({ modal: { kind: 'talk', neighborId: 'postman', line: '안녕하세요.' } })
    render(<ModalLayer />)
    expect(screen.queryByText(/언덕 편지함/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '편지 받기' })).not.toBeInTheDocument()
  })
})

// 2026-10-04: 선반 창은 없어졌다 — 도감은 말씀 › 말씀 조각, 한 줄은 말씀, 앨범·받은 선물·업적은 일지, 요리법·물건 도감은 가방
describe('선반을 나눠 합친 뒤', () => {
  it('집 선반을 누르면 📖 말씀 › 서고가 열린다', () => {
    reset()
    render(<ModalLayer />)
    act(() => useGame.getState().tap(PLACES.shelf.tiles[0]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'word', tab: 'library' })
    expect(screen.getByRole('tab', { name: '서고' })).toHaveAttribute('aria-selected', 'true')
  })

  it('조각 창의 [뒤로](back)는 말씀 › 말씀 조각으로', async () => {
    reset({ collected: ['lk-015-008'] })
    useGame.setState({ modal: { kind: 'passage', pieceId: 'lk-015-008', askLine: false, back: true } })
    render(<ModalLayer />)
    await userEvent.setup().click(screen.getByRole('button', { name: '뒤로' }))
    expect(useGame.getState().modal).toEqual({ kind: 'word', tab: 'pieces' })
    expect(screen.getByRole('tab', { name: '말씀 조각' })).toHaveAttribute('aria-selected', 'true')
  })

  it('말씀 조각 거르기: 받은 조각이 있는 책만 고를 수 있고, "한 복음서에만"(✦)에는 사도행전 조각이 들지 않는다', () => {
    const ac: Piece[] = piecesOf('ac')
    expect(ac.length).toBeGreaterThan(0)
    const lk = piecesOf('lk')
    const got = [ac[0].id, lk[0].id, 'lk-015-008']
    const v = dexView(got, 'all', false)
    expect(v.books).toEqual(['lk', 'ac'])
    expect(v.list.map((p) => p.id).sort()).toEqual([...new Set(got)].sort())
    // 받은 조각이 없는 책을 기억해 두었어도 전체로 보인다
    expect(dexView(got, 'mk', false).list).toHaveLength(v.list.length)
    expect(dexView(got, 'ac', false).list.map((p) => p.id)).toEqual([ac[0].id])
    expect(dexView(got, 'all', true).list.some((p) => p.book === 'ac')).toBe(false)
    // 서고 방은 처음부터 모두 열려 있다 — 책상 고르기도 방 표식과 상관없이 같다
    const withContent = PIECES.map((p) => p.book)
    expect(pickableBooks({ gospelFeast: 1 }, withContent)).toEqual(pickableBooks({}, withContent))
    expect(pickableBooks({}, withContent).slice(0, 5)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
  })

  it('말씀 조각: 책 거르기·한 복음서에만·도장, 본문을 보고 와도 고른 책이 남는다', async () => {
    reset({ collected: ['lk-015-008', 'lk-015-001', 'mk-001-001'] })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'word', tab: 'pieces' } })
    render(<ModalLayer />)
    const books = screen.getByRole('group', { name: '책 고르기' })
    expect(within(books).getAllByRole('button').map((b) => b.textContent)).toEqual(['전체', '마가복음', '누가복음'])
    expect(within(books).getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(T.ui.stampNote)).toBeInTheDocument()
    await user.click(within(books).getByRole('button', { name: '누가복음' }))
    expect(screen.queryByText(pieceById('mk-001-001').title)).toBeNull()
    expect(screen.getByText(pieceById('lk-015-008').title)).toBeInTheDocument()
    // 한 복음서에만: 도장이 없는 복음서 조각만
    await user.click(screen.getByRole('button', { name: /한 복음서에만/ }))
    for (const id of ['lk-015-008', 'lk-015-001']) {
      const p = pieceById(id)
      if (p.stamps.length === 0) expect(screen.getByText(p.title).closest('li')).toHaveClass('only')
      else expect(screen.queryByText(p.title)).toBeNull()
    }
    await user.click(screen.getByRole('button', { name: '모두' }))
    // 도장이 있는 조각은 견준 복음서 표시가 붙는다
    for (const id of ['lk-015-008', 'lk-015-001']) {
      const p = pieceById(id)
      if (p.stamps.length) expect(screen.getByText(p.title).closest('li')!.querySelectorAll('.mini-stamp')).toHaveLength(p.stamps.length)
    }
    await user.click(screen.getByRole('button', { name: `본문에서 보기 · ${pieceById('lk-015-008').ref}` }))
    await user.click(screen.getByRole('button', { name: '뒤로' }))
    const back = screen.getByRole('group', { name: '책 고르기' })
    expect(within(back).getByRole('button', { name: '누가복음' })).toHaveAttribute('aria-pressed', 'true')
    // 다음 시험을 위해 되돌린다
    await user.click(within(back).getByRole('button', { name: '전체' }))
  })

  it('가족 창의 [가족 앨범]은 일지 › 앨범을 연다', async () => {
    reset({ album: [{ id: 'gospelFeast', day: 3 }] })
    useGame.setState({ modal: { kind: 'family' } })
    render(<ModalLayer />)
    await userEvent.setup().click(screen.getByRole('button', { name: '가족 앨범' }))
    expect(useGame.getState().modal).toEqual({ kind: 'journal', tab: 'album' })
    expect(screen.getByRole('tab', { name: '앨범' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(new RegExp(SCENES.gospelFeast.album!))).toBeInTheDocument()
  })

  it('일지: 하루 기록 · 이웃 수첩 · 앨범 · 업적 — 업적은 마지막 칸', async () => {
    reset()
    useGame.setState({ modal: { kind: 'journal' } })
    render(<ModalLayer />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['하루 기록', '이웃 수첩', '앨범', '업적'])
    await userEvent.setup().click(screen.getByRole('tab', { name: '업적' }))
    expect(screen.getByText(/이룬 업적 0 \//)).toBeInTheDocument()
  })

  it('이웃 수첩: 받은 선물은 그 이웃의 쪽에, 누구에게 받았는지 모르는 선물은 맨 아래 "받은 선물"에', async () => {
    const baker = CONTENT.neighbors.find((d) => d.id === 'baker')!
    const nb = newGame(CONTENT).notebook
    reset({ giftsGot: ['bread', 'wool'], notebook: { ...nb, met: ['baker'], got: { baker: ['bread'] } } })
    useGame.setState({ modal: { kind: 'journal', tab: 'neighbors' } })
    render(<ModalLayer />)
    const user = userEvent.setup()
    const rest = screen.getByRole('region', { name: '받은 선물' })
    expect(rest).toHaveTextContent(ITEM_TEXT.wool.name)
    expect(rest).not.toHaveTextContent(ITEM_TEXT.bread.name)
    await user.click(screen.getByRole('button', { name: new RegExp(baker.role) }))
    const page = document.querySelector('.nb-page') as HTMLElement
    expect(page).toHaveTextContent('받은 선물')
    expect(page).toHaveTextContent(ITEM_TEXT.bread.name)
  })

  it('가방: 물건 · 만들기 · 물건 도감', async () => {
    reset({ recipesKnown: newGame(CONTENT).recipesKnown.length ? newGame(CONTENT).recipesKnown : ['papyrus'], found: ['bread'] })
    useGame.setState({ modal: { kind: 'bag' } })
    render(<ModalLayer />)
    const user = userEvent.setup()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['물건', '만들기', '물건 도감'])
    expect(screen.getByRole('tab', { name: '물건' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: '만들기' }))
    const r = useGame.getState().game.recipesKnown[0]
    expect(screen.getByText((T.recipes as Record<string, string>)[r])).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '물건 도감' }))
    expect(screen.getByText(`모은 물건 1 / ${Object.keys(ITEM_TEXT).length}`)).toBeInTheDocument()
    expect(screen.getByText(ITEM_TEXT.bread.desc)).toBeInTheDocument()
  })

  it('집 꾸미기: 깔개를 놓고 다시 거둔다', async () => {
    reset({ room: [], inv: { rug: 1 } })
    const user = userEvent.setup()
    render(<Hud />)
    await user.click(screen.getByRole('button', { name: '집 꾸미기' }))
    expect(useGame.getState().decorating).toBe('pick')
    act(() => useGame.getState().startDecorate('rug'))
    act(() => useGame.getState().tap(h(5, 5)))
    expect(useGame.getState().game.room).toEqual([{ item: 'rug', ...h(5, 5) }])
    act(() => useGame.getState().tap(h(5, 5)))
    expect(useGame.getState().game.room).toEqual([])
    expect(useGame.getState().game.inv.rug).toBe(1)
  })

  it('집 꾸미기: 놓을 가구가 없으면 한 줄로 알려 주고, 집 밖에서는 단추가 없다', async () => {
    reset({ room: [] })
    render(<Hud />)
    await userEvent.setup().click(screen.getByRole('button', { name: '집 꾸미기' }))
    expect(useGame.getState().decorating).toBeNull()
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateNone)
    // 위 줄 메뉴에 선반 단추는 없다
    expect(screen.queryByRole('button', { name: /선반/ })).toBeNull()
    act(() => goOutside())
    expect(screen.queryByRole('button', { name: '집 꾸미기' })).toBeNull()
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
  it('사도행전 방 문은 잔치 전에도 잠겨 있지 않아, 서고 안에서 누르면 걸어 들어간다 (2026-10-06)', () => {
    const lib = ROOMS.find((r) => r.owner === 'library')!
    const inLib = WARPS.get(key(lib.door))!
    reset({ flags: { heartPoints: 1 }, player: { ...newGame(CONTENT).player, x: inLib.x, y: inLib.y, path: [] } })
    act(() => useGame.getState().tap(LOCKED_DOORS[0]))
    expect(useGame.getState().toast).toBeNull()
    act(() => {
      for (let i = 0; i < 400 && roomAt(playerTile(useGame.getState().game)) !== ACTS_ROOM; i++) useGame.getState().frame(0.05)
    })
    expect(roomAt(playerTile(useGame.getState().game))).toBe(ACTS_ROOM)
    expect(useGame.getState().toast?.text).toBe('사도행전 방')
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

describe('로마서–빌레몬서 방 (계획 7 작업 7)', () => {
  const lib = () => ROOMS.find((r) => r.owner === 'library')!
  const inLib = () => WARPS.get(key(lib().door))!
  const opened = { heartPoints: 1, gospelFeast: 2, 'room:romPhm': 1 }
  const shelvedAll = { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } as const

  it('둘째 문은 방 표식이 없어도 열려 있어 걸어 들어가 방 이름을 알린다', () => {
    reset({ flags: { heartPoints: 1 }, shelved: shelvedAll, player: { ...newGame(CONTENT).player, ...inLib(), path: [] } })
    act(() => useGame.getState().tap(LOCKED_DOORS[1]))
    expect(useGame.getState().toast).toBeNull()
    act(() => {
      for (let i = 0; i < 400 && roomAt(playerTile(useGame.getState().game)) !== LETTERS_ROOM; i++) useGame.getState().frame(0.05)
    })
    expect(roomAt(playerTile(useGame.getState().game))).toBe(LETTERS_ROOM)
    expect(useGame.getState().toast?.text).toBe('로마서–빌레몬서 방')
  })
  it('편지 선반: 열세 권, 다 적은 책은 꽂기 → 편지 서고 퀴즈 → 이 선반으로 돌아온다', async () => {
    const phm = chaptersOf('phm', CONTENT)
    reset({ flags: opened, shelved: shelvedAll, bound: { phm: { day: 1 } }, progress: { ...emptyProgress(), phm: { completed: phm, arrangement: {} } } })
    useGame.setState({ modal: { kind: 'roomShelf', room: 'romPhm' }, rng: mulberry32(3) })
    const user = userEvent.setup()
    const { container } = render(<ModalLayer />)
    const dialog = screen.getByRole('dialog', { name: '편지 선반' })
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(13)
    expect(dialog.textContent).toContain('로마서')
    expect(dialog.textContent).toContain('빌레몬서')
    expect(screen.getAllByRole('button', { name: '퀴즈 풀고 금박 책등' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
    const m = useGame.getState().modal
    if (m?.kind !== 'quiz') throw new Error('quiz expected')
    expect(m.mode).toEqual({ kind: 'library', book: 'phm', retry: false })
    solveQuiz()
    act(() => useGame.getState().nextQuiz())
    expect(useGame.getState().game.shelved.phm).toBeDefined()
    expect(useGame.getState().modal).toEqual({ kind: 'myLine', lineKey: 'book:phm', back: 'room:romPhm' })
    act(() => useGame.getState().skipMyLine())
    expect(useGame.getState().modal).toEqual({ kind: 'roomShelf', room: 'romPhm' })
  })

  it('사도행전 방 선반도 같은 선반 — 꽂으면 사도행전 방 선반으로 돌아온다', async () => {
    const ac = chaptersOf('ac', CONTENT)
    reset({ flags: { heartPoints: 1, gospelFeast: 2 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0 }, bound: { ac: { day: 1 } }, progress: { ...emptyProgress(), ac: { completed: ac, arrangement: {} } } })
    useGame.setState({ modal: { kind: 'roomShelf', room: 'acts' }, rng: mulberry32(3) })
    const user = userEvent.setup()
    const { container } = render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '사도행전 선반' })).toBeInTheDocument()
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
    solveQuiz()
    act(() => useGame.getState().nextQuiz())
    expect(useGame.getState().modal).toEqual({ kind: 'myLine', lineKey: 'book:ac', back: 'room:acts' })
    act(() => useGame.getState().skipMyLine())
    expect(useGame.getState().modal).toEqual({ kind: 'roomShelf', room: 'acts' })
  })

  it('서고 안 방 목록: 네 방 모두 "열려 있어요" (새 게임에서도)', () => {
    reset({ flags: { heartPoints: 1 } })
    useGame.setState({ modal: { kind: 'library' } })
    const { container } = render(<ModalLayer />)
    const items = [...container.querySelectorAll('.library-locked li')].map((li) => li.textContent)
    expect(items).toEqual(['사도행전 방', '로마서–빌레몬서 방', '히브리서–유다서 방', '요한계시록 방'].map((r) => `${r} · 열려 있어요`))
  })
  it('방이 열린 아침 장면: 성경 본문 없이, 닫으면 앨범에 한 장', async () => {
    reset({ scenes: ['roomOpen:romPhm'], flags: opened, shelved: shelvedAll })
    const user = userEvent.setup()
    render(<ModalLayer />)
    walk()
    const dialog = screen.getByRole('dialog', { name: SCENES['roomOpen:romPhm'].title })
    expect(dialog).toHaveTextContent('서고 왼쪽 아래 문')
    expect(screen.queryByLabelText(/성경 본문/)).toBeNull()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().game.album.filter((a) => a.id === 'roomOpen:romPhm')).toHaveLength(1)
  })

  it('방 안 읽는 탁자: 모은 이야기가 있으면 골라 읽기', () => {
    reset({ flags: opened, shelved: shelvedAll, collected: ['lk-015-008'], player: { ...newGame(CONTENT).player, ...PLACES.lettersTable.stand!, path: [] } })
    act(() => useGame.getState().tap(PLACES.lettersTable.tiles[0]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'readPick' })
  })
})

describe('히브리서–유다서 방 (계획 8 작업 5)', () => {
  const lib = () => ROOMS.find((r) => r.owner === 'library')!
  const inLib = () => WARPS.get(key(lib().door))!
  const romPhmAll = Object.fromEntries(
    ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm'].map((b) => [b, 1 as const]),
  )
  const shelvedAll: GameState['shelved'] = { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1, ...romPhmAll }
  const before = { heartPoints: 1, gospelFeast: 2, 'room:romPhm': 1 }
  const opened = { ...before, 'room:hebJud': 1 }

  it('셋째 문도 방 표식이 없어도 열려 있어 걸어 들어가 방 이름을 알린다', () => {
    reset({ flags: { heartPoints: 1 }, shelved: shelvedAll, player: { ...newGame(CONTENT).player, ...inLib(), path: [] } })
    act(() => useGame.getState().tap(LOCKED_DOORS[2]))
    expect(useGame.getState().toast).toBeNull()
    act(() => {
      for (let i = 0; i < 400 && roomAt(playerTile(useGame.getState().game)) !== HEB_JUD_ROOM; i++) useGame.getState().frame(0.05)
    })
    expect(roomAt(playerTile(useGame.getState().game))).toBe(HEB_JUD_ROOM)
    expect(useGame.getState().toast?.text).toBe('히브리서–유다서 방')
  })
  it('편지 선반: 여덟 권, 다 적은 책은 꽂기 → 편지 서고 퀴즈 → 이 선반으로 돌아온다', async () => {
    const jn2 = chaptersOf('2jn', CONTENT)
    reset({ flags: opened, shelved: shelvedAll, bound: { '2jn': { day: 1 } }, progress: { ...emptyProgress(), '2jn': { completed: jn2, arrangement: {} } } })
    useGame.setState({ modal: { kind: 'roomShelf', room: 'hebJud' }, rng: mulberry32(3) })
    const user = userEvent.setup()
    const { container } = render(<ModalLayer />)
    const dialog = screen.getByRole('dialog', { name: '편지 선반' })
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(8)
    expect(dialog.textContent).toContain('히브리서')
    expect(dialog.textContent).toContain('유다서')
    expect(screen.getAllByRole('button', { name: '퀴즈 풀고 금박 책등' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '퀴즈 풀고 금박 책등' }))
    const m = useGame.getState().modal
    if (m?.kind !== 'quiz') throw new Error('quiz expected')
    expect(m.mode).toEqual({ kind: 'library', book: '2jn', retry: false })
    solveQuiz()
    act(() => useGame.getState().nextQuiz())
    expect(useGame.getState().game.shelved['2jn']).toBeDefined()
    expect(useGame.getState().modal).toEqual({ kind: 'myLine', lineKey: 'book:2jn', back: 'room:hebJud' })
    act(() => useGame.getState().skipMyLine())
    expect(useGame.getState().modal).toEqual({ kind: 'roomShelf', room: 'hebJud' })
  })

  it('방 안 선반·읽는 탁자를 누르면 그 창이 열린다', () => {
    reset({ flags: opened, shelved: shelvedAll, collected: ['lk-015-008'], player: { ...newGame(CONTENT).player, ...PLACES.hebJudTable.stand!, path: [] } })
    act(() => useGame.getState().tap(PLACES.hebJudTable.tiles[0]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'readPick' })
    reset({ flags: opened, shelved: shelvedAll, player: { ...newGame(CONTENT).player, ...PLACES.hebJudShelf.stand!, path: [] } })
    act(() => useGame.getState().tap(PLACES.hebJudShelf.tiles[1]))
    walk()
    expect(useGame.getState().modal).toEqual({ kind: 'roomShelf', room: 'hebJud' })
  })
})

describe('방 꾸미기 누르기 (QA)', () => {
  it('물건을 들고 협탁을 누르면 그 위에 올린다', () => {
    reset({ room: [{ item: 'nightstand', ...h(3, 4) }], inv: { vase: 1 } })
    useGame.setState({ decorating: 'vase' })
    useGame.getState().tap(h(3, 4))
    const g = useGame.getState().game
    expect(g.room).toEqual([{ item: 'nightstand', ...h(3, 4) }, { item: 'vase', ...h(3, 4), on: true }])
  })
  it('치우기에서는 깔개가 차지한 어느 칸을 눌러도 고르고, 한 번 더 누르면 치운다', () => {
    reset({ room: [{ item: 'rug', ...h(3, 5) }], inv: {} })
    useGame.setState({ decorating: 'pick' })
    useGame.getState().tap(h(5, 6))
    expect(useGame.getState().decorSel).toEqual({ item: 'rug', ...h(3, 5), on: undefined })
    expect(useGame.getState().game.room).toHaveLength(1)
    useGame.getState().tap(h(4, 5))
    expect(useGame.getState().game.room).toEqual([])
    expect(useGame.getState().game.inv.rug).toBe(1)
  })
  it('고른 가구는 돌리기 단추로 돌리고, 치우기 단추로 가방에 넣는다 (계획 17 작업 2)', async () => {
    reset({ room: [{ item: 'table', ...h(5, 5) }], inv: {} })
    useGame.setState({ decorating: 'pick' })
    render(<DecorateBar />)
    expect(screen.queryByRole('button', { name: T.ui.decorateTurn })).toBeNull()
    act(() => useGame.getState().tap(h(6, 5)))
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: T.ui.decorateTurn }))
    expect(useGame.getState().game.room).toEqual([{ item: 'table', ...h(5, 5), facing: 'right' }])
    await user.click(screen.getByRole('button', { name: T.ui.decorateTake }))
    expect(useGame.getState().game.room).toEqual([])
    expect(useGame.getState().game.inv.table).toBe(1)
  })
  it('못 돌리는 자리면 한 줄로 알리고 그대로 둔다', () => {
    reset({ room: [{ item: 'table', ...h(7, 3) }], inv: {} })
    useGame.setState({ decorating: 'pick' })
    useGame.getState().tap(h(7, 3))
    useGame.getState().turnSelected()
    expect(useGame.getState().game.room).toEqual([{ item: 'table', ...h(7, 3) }])
    expect(useGame.getState().toast?.text).toBe(T.ui.decorateTurnBlocked)
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
