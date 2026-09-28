import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, piecesOf } from '../content/catalog'
import { emptyProgress } from '../engine/books'
import { chooseBook, newGame, type GameState } from '../engine/game'
import { mulberry32 } from '../engine/offers'
import { PLACES } from '../engine/world'
import { useGame } from '../store/game-store'
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
    expect(screen.getByRole('button', { name: /마태복음 · 시험판에는 아직 없어요/ })).toBeDisabled()
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
      game: { ...base, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: [1, 2, 3], arrangement: {} } } },
      modal: { kind: 'library' },
      rng: mulberry32(5),
    })
    render(<ModalLayer />)
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
    expect(useGame.getState().modal?.kind).toBe('library')
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
    act(() => useGame.getState().tap({ x: 7, y: 8 }))
    walk()
    await user.type(screen.getByRole('textbox'), '보리')
    await user.click(screen.getByRole('button', { name: '밥 주기' }))
    expect(useGame.getState().game.companion).toMatchObject({ kind: 'cat', name: '보리' })
  })

  it('배고플 때 기록자를 누르면 돌보기', async () => {
    reset({ needs: { hunger: 80, fatigue: 0, cold: 0 } })
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
    reset({ collected: ['lk-001-001'], needs: { hunger: 0, fatigue: 70, cold: 0 } })
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
  it('도감: 누가에만 거르기와 들은 이야기 열기', async () => {
    reset({ collected: ['lk-015-008', 'lk-015-001'] })
    const user = userEvent.setup()
    useGame.setState({ modal: { kind: 'shelf' } })
    render(<ModalLayer />)
    // 마가 22 + 누가 156 = 178 조각 중 2개를 들었다
    expect(screen.getAllByText('아직 듣지 못한 이야기').length).toBe(176)
    // 책마다 장을 따로 묶는다
    expect(screen.getByRole('heading', { name: '마가복음 1장' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '누가복음 1장' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /한 복음서에만/ }))
    expect(screen.queryByText('잃은 양')).toBeNull()
    await user.click(screen.getByRole('button', { name: /잃은 드라크마/ }))
    expect(screen.getByLabelText('성경 본문 눅 15:8-10')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.getByRole('dialog', { name: '선반' })).toBeInTheDocument()
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

describe('다 쓴 날', () => {
  it('잔치 → 첫머리 → 함께한 날 → 앨범 → 한 줄 → 또 다른 이야기(행 1:1)', async () => {
    reset({ scenes: ['ending'], flags: { ending: 2, childLetters: 5 } })
    const user = userEvent.setup()
    render(<ModalLayer />)
    walk()
    expect(screen.getByRole('dialog', { name: '다 쓴 날' })).toHaveTextContent('이웃들이 마당에 모여들었다')
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByText('제가 첫머리를 읽어 볼게요!')).toBeInTheDocument()
    expect(screen.getByLabelText('성경 본문 눅 1:1-4')).toBeInTheDocument()
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByLabelText('성경 본문 행 1:1')).toHaveTextContent('데오빌로여 내가 먼저 쓴 글에는')
    await user.click(screen.getByRole('button', { name: '마을로 돌아가기' }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.album.map((a) => a.id)).toContain('ending')
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
