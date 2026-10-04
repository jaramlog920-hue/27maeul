// 계획 14 작업 8: 완성본을 누르면 [펼쳐 보기] [이 책에서 발견한 하나님 기록] + 첫 쪽의 나의 필사 기록, 집 책장
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT } from '../../content/catalog'
import { chaptersOf } from '../../engine/books'
import { copyVerses } from '../../engine/copying'
import { newGame, type GameState } from '../../engine/game'
import { mulberry32 } from '../../engine/offers'
import type { Book } from '../../engine/types'
import { useGame, type Modal } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'

function base(): GameState {
  return { ...newGame(CONTENT), scenes: [] }
}
function reset(game: GameState, modal: Modal | null = null) {
  localStorage.clear()
  useGame.setState({ game, modal, rng: mulberry32(5), toast: null, decorating: null })
}
/** 필사로 마친 빌레몬서 (2일에 시작, 4일에 마침, 5일에 제본) */
function copiedPhm(): GameState {
  const g = base()
  return {
    ...g,
    progress: { ...g.progress, phm: { completed: [1], arrangement: {} } },
    copy: { ...g.copy, days: { phm: { start: 2, end: 4 } }, copied: { phm: [1] } },
    bound: { phm: { day: 5 } },
  }
}

describe('완성본 펼쳐 보기', () => {
  it('첫 쪽: 나의 필사 기록 — 시작한 날·마친 날·절·글자', () => {
    reset(copiedPhm(), { kind: 'bookView', book: 'phm' })
    render(<ModalLayer />)
    const d = screen.getByRole('dialog', { name: '완성본 빌레몬서' })
    expect(d).toHaveTextContent('나의 필사 기록')
    expect(d).toHaveTextContent('쓰기 시작한 날')
    expect(d).toHaveTextContent('마친 날')
    const vs = copyVerses('phm', 1, CONTENT)
    expect(d).toHaveTextContent(`절${vs.length}`)
    expect(d).toHaveTextContent(`글자${vs.reduce((n, v) => n + v.chars, 0).toLocaleString('ko-KR')}`)
    expect(within(d).getByRole('button', { name: '펼쳐 보기' })).toBeEnabled()
    expect(within(d).getByRole('button', { name: /이 책에서 발견한 하나님 기록/ })).toBeInTheDocument()
  })

  it('[펼쳐 보기] → 내가 필사한 본문 (개역한글 그대로), 첫 쪽으로 돌아오기', async () => {
    const user = userEvent.setup()
    reset(copiedPhm(), { kind: 'bookView', book: 'phm' })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: '펼쳐 보기' }))
    const page = screen.getByRole('region', { name: '빌레몬서 1장' })
    expect(page).toHaveTextContent(copyVerses('phm', 1, CONTENT)[0].text)
    await user.click(screen.getByRole('button', { name: '첫 쪽으로' }))
    expect(screen.getByRole('dialog', { name: '완성본 빌레몬서' })).toHaveTextContent('나의 필사 기록')
  })

  it('[이 책에서 발견한 하나님 기록]: 이 책의 기록만, 누르면 구절 본문', async () => {
    const user = userEvent.setup()
    const rec = CONTENT.godRecords!.find((r) => r.book === 'mt')!
    const g = {
      ...base(),
      shelved: { mt: 0 as const },
      godRecords: [{ keyword: rec.keyword, ref: rec.ref, book: 'mt' as Book, chapter: rec.chapter, day: 3 }],
    }
    reset(g, { kind: 'bookView', book: 'mt' })
    render(<ModalLayer />)
    await user.click(screen.getByRole('button', { name: /이 책에서 발견한 하나님 기록/ }))
    const key = screen.getByRole('button', { name: new RegExp(rec.ref) })
    await user.click(key)
    expect(key).toHaveAttribute('aria-expanded', 'true')
  })

  it('예전에 엮은 책: 숫자 없이 "예전에 엮은 책" 한 줄, 본문은 펼쳐 볼 수 있다', async () => {
    const user = userEvent.setup()
    const g0 = base()
    const all = chaptersOf('jud', CONTENT)
    const g = { ...g0, progress: { ...g0.progress, jud: { completed: all, arrangement: {} } }, copy: { ...g0.copy, legacy: { jud: all } }, shelved: { jud: 1 as const } }
    reset(g, { kind: 'bookView', book: 'jud' })
    render(<ModalLayer />)
    const d = screen.getByRole('dialog', { name: '완성본 유다서' })
    expect(d).toHaveTextContent('예전에 엮은 책이라 필사 기록은 남아 있지 않아요.')
    expect(d).not.toHaveTextContent('쓰기 시작한 날')
    expect(d).not.toHaveTextContent('글자')
    await user.click(screen.getByRole('button', { name: '펼쳐 보기' }))
    expect(screen.getByRole('region', { name: '유다서 1장' })).toBeInTheDocument()
    expect(screen.getByText(/예전에 엮은 장/)).toBeInTheDocument()
  })

  it('다 쓰지 않은 책은 열지 않는다', () => {
    reset(base())
    useGame.getState().openBook('mt')
    expect(useGame.getState().modal).toBeNull()
    reset(copiedPhm())
    useGame.getState().openBook('phm', 'library')
    expect(useGame.getState().modal).toEqual({ kind: 'bookView', book: 'phm', back: 'library' })
  })
})

describe('집 책장', () => {
  it('다 쓴 책을 꽂아 두고, 꽂은 책을 누르면 펼쳐 보기 → 책 덮기로 집 책장에', async () => {
    const user = userEvent.setup()
    reset(copiedPhm(), { kind: 'homeShelf' })
    render(<ModalLayer />)
    const d = screen.getByRole('dialog', { name: '집 책장' })
    expect(d).toHaveTextContent('책장 0/3')
    expect(within(d).getAllByRole('img', { name: '빈 자리' })).toHaveLength(3)
    await user.click(within(d).getByRole('button', { name: '빌레몬서 · 책장에 두기' }))
    expect(useGame.getState().game.homeShelf).toEqual(['phm'])
    expect(d).toHaveTextContent('책장 1/3')
    expect(within(d).getAllByRole('img', { name: '빈 자리' })).toHaveLength(2)
    await user.click(within(d).getAllByRole('button', { name: '빌레몬서 · 펼쳐 보기' })[0])
    expect(screen.getByRole('dialog', { name: '완성본 빌레몬서' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '책 덮기' }))
    expect(screen.getByRole('dialog', { name: '집 책장' })).toBeInTheDocument()
  })

  it('다 쓴 책이 없으면 조용한 안내만', () => {
    reset(base(), { kind: 'homeShelf' })
    render(<ModalLayer />)
    expect(screen.getByRole('dialog', { name: '집 책장' })).toHaveTextContent('아직 다 쓴 책이 없어요.')
  })
})
