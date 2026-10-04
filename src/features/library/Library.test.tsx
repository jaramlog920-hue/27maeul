// 계획 14 작업 4: 서고의 시각적 성장(신약 n/27, 빈 칸, 책마다 다른 책등), 제본 창(그대로·특별하게), 가방의 완성본,
// 꽂을 때 [바로 꽂기] [퀴즈 풀고 금박 책등], 스물일곱 번째 책을 꽂은 날
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT } from '../../content/catalog'
import { chaptersOf } from '../../engine/books'
import { bindBook, newGame, type GameState } from '../../engine/game'
import { mulberry32 } from '../../engine/offers'
import { BOOKS, type Book } from '../../engine/types'
import { useGame, type Modal } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function base(): GameState {
  return { ...newGame(CONTENT), scenes: [] }
}
function done(s: GameState, ...books: Book[]): GameState {
  const progress = { ...s.progress }
  for (const b of books) progress[b] = { completed: chaptersOf(b, CONTENT), arrangement: {} }
  return { ...s, progress }
}
function reset(game: GameState, modal: Modal | null = null) {
  localStorage.clear()
  useGame.setState({ game, modal, rng: mulberry32(5), toast: null, decorating: null })
}

describe('서고의 시각적 성장', () => {
  it('처음 서고는 휑하다 — 신약 0/27, 스물일곱 칸 모두 빈 칸', () => {
    reset(base(), { kind: 'library' })
    const { container } = render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '마을 서고' })).toHaveTextContent('신약 0/27')
    const pic = screen.getByRole('figure', { name: '서고 선반 · 신약 0/27' })
    expect(pic.querySelectorAll('.spine-slot')).toHaveLength(27)
    expect(pic.querySelectorAll('.spine-art')).toHaveLength(0)
    expect(within(pic).getByRole('img', { name: '마태복음 · 빈 칸' })).toBeInTheDocument()
    expect(container.querySelectorAll('.library-shelf .spine')).toHaveLength(4)
  })

  it('꽂을수록 책등이 채워지고, 책마다 책등 무늬가 다르다', () => {
    const shelved = { mt: 2, mk: 0, ac: 1 } as const
    reset({ ...done(base(), 'mt', 'mk', 'ac'), shelved }, { kind: 'library' })
    render(<ModalLayer />)
    const pic = screen.getByRole('figure', { name: '서고 선반 · 신약 3/27' })
    const spines = [...pic.querySelectorAll<HTMLElement>('.spine-art')]
    expect(spines.map((s) => s.dataset.book)).toEqual(['mt', 'mk', 'ac'])
    expect(pic.querySelectorAll('.spine-slot')).toHaveLength(24)
    const looks = spines.map((s) => `${s.style.getPropertyValue('--spine')}|${s.className}`)
    expect(new Set(looks).size).toBe(3)
    expect(spines[0].className).toContain('spine-grade-2')
  })
})

describe('제본 → 완성본 → 서고에 꽂기', () => {
  it('필사를 마친 장 완료 화면에서 [제본하기] → 그대로 제본하기(무료) → 가방에 완성본', async () => {
    const user = userEvent.setup()
    const g = { ...done(base(), 'phm'), inv: {}, copy: { ...base().copy, book: 'phm' as Book } }
    reset(g, { kind: 'copy', view: 'done', last: { kind: 'chapter', chapter: 1, verse: 25, verses: 25, chars: 600, gains: { wit: 0, hand: 0 }, bookDone: true, next: null, finds: [] } })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '제본하기' }))
    const dialog = screen.getByRole('dialog', { name: '제본' })
    expect(dialog).toHaveTextContent('📖 빌레몬서 필사를 마쳤습니다.')
    expect(dialog).toHaveTextContent('크림색 종이 ×3 · 푸른 염료 ×1 · 좋은 실 ×2 → 표지 꾸미기')
    await user.click(screen.getByRole('button', { name: '그대로 제본하기' }))
    expect(useGame.getState().game.bound.phm).toBeDefined()
    expect(screen.getByRole('status')).toHaveTextContent('빌레몬서 완성본이 생겼습니다.')
    expect(screen.getByRole('img', { name: '빌레몬서 표지' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().modal).toBeNull()
    act(() => useGame.getState().open({ kind: 'bag' }))
    const copies = screen.getByRole('region', { name: '완성본' })
    expect(within(copies).getByRole('img', { name: '빌레몬서 표지' })).toBeInTheDocument()
  })

  it('특별하게 제본하기: 표지 색·무늬·책등 장식을 고르고, 재료가 모자라면 단추가 잠긴다', async () => {
    const user = userEvent.setup()
    reset({ ...done(base(), 'mk'), inv: { creamPaper: 3, blueDye: 1, fineThread: 1 } })
    act(() => useGame.getState().openBind('mk', 'library'))
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '특별하게 제본하기' }))
    expect(screen.getByRole('dialog', { name: '마가복음 표지 꾸미기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이대로 제본하기' })).toBeDisabled()
    expect(screen.getByText(/재료가 모자라요/)).toBeInTheDocument()
    act(() => useGame.setState((s) => ({ game: { ...s.game, inv: { creamPaper: 3, blueDye: 1, fineThread: 2 } } })))
    await user.click(screen.getByRole('button', { name: '연보라' }))
    await user.click(screen.getByRole('button', { name: '마름모무늬' }))
    await user.click(screen.getByRole('button', { name: '청동빛 장식' }))
    await user.click(screen.getByRole('button', { name: '이대로 제본하기' }))
    expect(useGame.getState().game.bound.mk?.special).toEqual({ color: 'lavender', pattern: 'diamonds', deco: 'bronze' })
    expect(useGame.getState().game.inv).toEqual({})
    // 닫으면 연 곳(서고)으로
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(useGame.getState().modal).toEqual({ kind: 'library' })
  })

  it('서고 선반: 제본 전엔 [제본하기], 완성본은 [바로 꽂기] [퀴즈 풀고 금박 책등]', async () => {
    const user = userEvent.setup()
    reset(done(base(), 'mk'), { kind: 'library' })
    render(<ModalLayer />)
    const row = () => screen.getByText('마가복음', { selector: '.spine-name' }).closest('li')!
    expect(row()).toHaveTextContent('제본을 기다려요')
    expect(within(row()).queryByRole('button', { name: '바로 꽂기' })).toBeNull()
    await user.click(within(row()).getByRole('button', { name: '제본하기' }))
    await user.click(screen.getByRole('button', { name: '그대로 제본하기' }))
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(row()).toHaveTextContent('완성본 · 꽂을 수 있어요')
    expect(within(row()).getByRole('button', { name: '퀴즈 풀고 금박 책등' })).toBeInTheDocument()
    await user.click(within(row()).getByRole('button', { name: '바로 꽂기' }))
    // 퀴즈 없이 맨 책으로 — 불이익 없음, 처음 꽂은 책이면 나의 한 줄
    expect(useGame.getState().game.shelved.mk).toBe(0)
    expect(useGame.getState().game.rereads).toEqual([])
    expect(useGame.getState().toast?.text).toMatch(/^마가복음을 서고에 꽂았습니다\. 책등: 맨 책/)
    expect(useGame.getState().modal).toEqual({ kind: 'myLine', lineKey: 'book:mk', back: 'library' })
    act(() => useGame.getState().skipMyLine())
    expect(screen.getByRole('figure', { name: '서고 선반 · 신약 1/27' })).toBeInTheDocument()
    // 꽂은 뒤에도 표지를 다시 꾸밀 수 있다
    expect(within(row()).getByRole('button', { name: '표지 꾸미기' })).toBeInTheDocument()
  })

  it('퀴즈 풀고 금박 책등: 퀴즈를 다 맞히면 금박으로 꽂힌다', () => {
    reset(bindBook(done(base(), 'mk'), 'mk', CONTENT))
    act(() => useGame.getState().startShelve('mk'))
    for (let i = 0; i < 5; i++) {
      const m = useGame.getState().modal
      if (m?.kind !== 'quiz') throw new Error('quiz expected')
      act(() => useGame.getState().answerQuiz(m.questions[m.index].answer as string | string[]))
      act(() => useGame.getState().nextQuiz())
    }
    expect(useGame.getState().game.shelved.mk).toBe(2)
  })

  it('제본하지 않은 책은 퀴즈로도 바로도 꽂지 않는다', () => {
    reset(done(base(), 'mk'))
    act(() => useGame.getState().startShelve('mk'))
    act(() => useGame.getState().shelveNow('mk'))
    expect(useGame.getState().game.shelved.mk).toBeUndefined()
    expect(useGame.getState().modal).toBeNull()
  })

  it('예전에 꽂은 책(제본 기록 없음)도 등급 그대로 책등이 보이고 꾸미기 창은 표지 꾸미기부터', async () => {
    const user = userEvent.setup()
    reset({ ...done(base(), 'lk'), shelved: { lk: 1 } }, { kind: 'library' })
    render(<ModalLayer />)
    const row = screen.getByText('누가복음', { selector: '.spine-name' }).closest('li')!
    expect(row).toHaveTextContent('은박')
    expect(row.querySelector('.spine-art')).not.toBeNull()
    await user.click(within(row).getByRole('button', { name: '표지 꾸미기' }))
    expect(screen.getByRole('dialog', { name: '누가복음 표지 꾸미기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이대로 꾸미기' })).toBeDisabled()
  })
})

describe('스물일곱 번째 책', () => {
  it('마지막 책을 꽂으면 처음의 빈 서고와 지금을 나란히, 기록 수와 가족을 보이고 마을로', async () => {
    const user = userEvent.setup()
    const all = Object.fromEntries(BOOKS.filter((b) => b !== 'rev').map((b) => [b, 1])) as GameState['shelved']
    const g = bindBook(
      {
        ...done(base(), ...BOOKS),
        shelved: all,
        flags: { ...base().flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1, 'room:rev': 1 },
        collected: ['mk-001-001', 'mk-001-009'],
        godRecords: [{ keyword: 'love', ref: '요일 4:8', book: '1jn', chapter: 4, day: 3 }],
        companion: { kind: 'cat', name: '보리', x: 0, y: 0, path: [], facing: 'down', walkTime: 0, since: 1, stay: true },
      },
      'rev',
      CONTENT,
    )
    reset(g, { kind: 'roomShelf', room: 'rev' })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '바로 꽂기' }))
    const dialog = screen.getByRole('dialog', { name: '스물일곱 권의 서고' })
    const [then, now] = within(dialog).getAllByRole('figure')
    expect(then.querySelectorAll('.spine-slot')).toHaveLength(27)
    expect(now.querySelectorAll('.spine-art')).toHaveLength(27)
    expect(dialog).toHaveTextContent('하나님에 대한 기록 1')
    expect(dialog).toHaveTextContent('말씀 조각 2')
    expect(dialog).toHaveTextContent('함께 사는 가족 · 보리')
    await user.click(screen.getByRole('button', { name: '마을로' }))
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.shelved.rev).toBe(0)
  })
})
