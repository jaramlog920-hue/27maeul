import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CONTENT, contextOf, GOD_KEYWORDS, GOD_RECORDS, NAMES, pieceById, versesOf } from '../../content/catalog'
import { T } from '../../content/text'
import { newGame, type GameState } from '../../engine/game'
import { BOOKS } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { Hud } from '../play/Hud'
import { godByKeyword, piecesByBook } from './Word'

function reset(game: Partial<GameState> = {}) {
  localStorage.clear()
  useGame.setState({ game: { ...newGame(CONTENT), scenes: [], ...game }, modal: null, rng: () => 0, decorating: null, toast: null })
}
function openWord(game: Partial<GameState> = {}) {
  reset(game)
  render(<ModalLayer />)
  act(() => useGame.getState().open({ kind: 'word' }))
}
const tab = (name: string) => screen.getByRole('tab', { name })

describe('📖 말씀 탭', () => {
  it('위 줄의 📖 말씀 단추로 열리고, 네 칸(필사본·말씀 조각·하나님 기록·서고)이 있다', async () => {
    reset()
    render(
      <>
        <Hud />
        <ModalLayer />
      </>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: T.word.open }))
    expect(useGame.getState().modal).toEqual({ kind: 'word' })
    for (const n of ['필사본', '말씀 조각', '하나님 기록', '연결', '서고']) expect(tab(n)).toBeInTheDocument()
    expect(tab('필사본')).toHaveAttribute('aria-selected', 'true')
  })

  it('가장 큰 단추: 고른 책이 없으면 [필사 시작하기] → 책 고르기, 쓰던 책이 있으면 [이어서 필사하기] → 그 절부터', async () => {
    openWord()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '필사 시작하기' }))
    expect(useGame.getState().modal).toEqual({ kind: 'copy', view: 'pick' })
    act(() => useGame.getState().open({ kind: 'word' }))
    act(() => useGame.setState({ game: { ...useGame.getState().game, copy: { book: 'lk', at: { lk: { chapter: 3, verse: 5 } }, legacy: {} } } }))
    await user.click(screen.getByRole('button', { name: '이어서 필사하기' }))
    expect(useGame.getState().modal).toEqual({ kind: 'copy', view: 'write', last: null, resume: true })
    expect(screen.getByText('누가복음 3장 5절부터 이어집니다.')).toBeInTheDocument()
  })

  it('필사본: 지금 위치, 장·권 진행, 나의 필사 기록(절·글자·장·권·처음 기록한 날)', () => {
    const progress = { ...newGame(CONTENT).progress, phm: { completed: [1], arrangement: {} }, lk: { completed: [1, 2], arrangement: {} } }
    openWord({
      progress,
      copy: { book: 'lk', at: { lk: { chapter: 3, verse: 5 } }, legacy: {} },
      copyStats: { verses: 1234, chars: 45678, chapters: 3, books: 1, firstDay: 3 },
    })
    expect(screen.getByText('지금 쓰는 곳 · 누가복음 3장 5절')).toBeInTheDocument()
    expect(screen.getByText('누가복음 · 2/24장')).toBeInTheDocument()
    expect(screen.getByText('신약 3/260장 · 다 쓴 책 1/27권')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '나의 필사 기록' })).toBeInTheDocument()
    const stats = screen.getByText('기록한 절').closest('dl')!
    expect(stats).toHaveTextContent('1,234')
    expect(stats).toHaveTextContent('45,678')
    expect(stats).toHaveTextContent('1년째 봄 3일')
  })

  it('필사본: 아직 아무것도 쓰지 않았으면 처음 기록한 날은 "아직 없음", 예전에 엮은 장은 따로 한 줄', () => {
    const progress = { ...newGame(CONTENT).progress, mk: { completed: [1, 2], arrangement: {} } }
    openWord({ progress, copy: { book: null, at: {}, legacy: { mk: [1, 2] } } })
    expect(screen.getByText(T.word.nowNone)).toBeInTheDocument()
    expect(screen.getByText('기록한 절').closest('dl')).toHaveTextContent('아직 없음')
    expect(screen.getByText('예전에 엮은 장 2장은 마친 장으로 함께 셉니다.')).toBeInTheDocument()
  })

  it('말씀 조각: 받은 조각이 성경 순서로 저절로 담기고, 받은 기록("3년째 봄 · 빵 굽는 이웃에게 받은 조각")이 붙는다 — 옛 조각은 기록 없음', async () => {
    openWord({ collected: ['mk-002-001', 'mt-001-001'], pieceLog: { 'mk-002-001': { day: 330, from: 'npc:baker' } } })
    await userEvent.setup().click(tab('말씀 조각'))
    expect(screen.getByText(`모은 말씀 조각 2 / ${CONTENT.pieces.length}`)).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent(pieceById('mt-001-001').title)
    expect(items[0]).toHaveTextContent('언제 받았는지 남아 있지 않은 조각')
    expect(items[1]).toHaveTextContent(pieceById('mk-002-001').title)
    expect(items[1]).toHaveTextContent('3년째 봄 · 헤이즐에게 받은 조각')
  })

  it('말씀 조각: 아직 없으면 언제 받게 되는지 한 줄', async () => {
    openWord()
    await userEvent.setup().click(tab('말씀 조각'))
    expect(screen.getByText(T.word.piecesEmpty)).toBeInTheDocument()
  })

  it('[본문에서 보기]: 조각 구간은 진하게, 앞뒤 문맥과 함께 — 뒤로 가면 목록', async () => {
    const p = pieceById('mk-002-001')
    openWord({ collected: [p.id], pieceLog: { [p.id]: { day: 2, from: 'letter' } } })
    const user = userEvent.setup()
    await user.click(tab('말씀 조각'))
    expect(screen.getByText('1년째 봄 · 편지로 받은 조각')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: `본문에서 보기 · ${p.ref}` }))
    const ctx = contextOf(p.ref)
    const view = screen.getByRole('region', { name: `본문에서 보기 ${p.ref}` })
    const inner = versesOf(p.ref)
    expect(within(view).getByText(inner[0].text).closest('p')).toHaveClass('in-piece')
    const after = ctx[ctx.length - 1]
    expect(after.inPiece).toBe(false)
    expect(within(view).getByText(after.text).closest('p')).toHaveClass('around')
    await user.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.getByText(p.title)).toBeInTheDocument()
  })

  it('하나님 기록: 키워드별로 구절이 쌓이고, 키워드를 누르면 구절 본문', async () => {
    const [a, b] = GOD_RECORDS.filter((r) => r.keyword === GOD_RECORDS[0].keyword).slice(0, 2)
    const finds = [a, b].filter(Boolean).map((r) => ({ ...r, day: 4 }))
    openWord({ godRecords: finds })
    const user = userEvent.setup()
    await user.click(tab('하나님 기록'))
    const key = screen.getByRole('button', { name: new RegExp(GOD_KEYWORDS[a.keyword].name) })
    expect(key).toHaveTextContent(`구절 ${finds.length}`)
    expect(key).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(versesOf(a.ref)[0].text)).toBeNull()
    await user.click(key)
    expect(key).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(versesOf(a.ref).map((v) => v.text).join(' '))).toBeInTheDocument()
  })

  it('연결: 아직 두 곳 이상 필사한 이름이 없으면 한 줄', async () => {
    const progress = { ...newGame(CONTENT).progress, '3jn': { completed: [1], arrangement: {} } }
    openWord({ progress })
    await userEvent.setup().click(tab('연결'))
    expect(screen.getByText(T.word.linksEmpty)).toBeInTheDocument()
  })

  it('연결: 필사한 곳에서 다시 만난 이름 — 필사한 곳 수와 책 차례, 누르면 구절 본문 (지금 쓰는 장은 쓴 절까지만)', async () => {
    const progress = { ...newGame(CONTENT).progress, mt: { completed: [4], arrangement: {} }, ac: { completed: [1], arrangement: {} } }
    // 요한복음 1장은 41절까지 썼다 (42절 "게바라 하리라"는 아직)
    openWord({ progress, copy: { book: 'jn', at: { jn: { chapter: 1, verse: 42 } }, legacy: {} } })
    const user = userEvent.setup()
    await user.click(tab('연결'))
    expect(screen.getByText(T.word.linksNote)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: T.word.linksPeople })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: T.word.linksPlaces })).toBeInTheDocument()
    const peter = NAMES.find((n) => n.name === '베드로')!
    const mine = peter.places.filter((p) => (p.book === 'mt' && p.chapter === 4) || (p.book === 'ac' && p.chapter === 1) || (p.book === 'jn' && p.chapter === 1 && p.verse < 42))
    expect(mine.map((p) => p.ref)).toContain('요 1:40')
    expect(mine.map((p) => p.ref)).not.toContain('요 1:42')
    const key = screen.getByRole('button', { name: /^베드로/ })
    expect(key).toHaveTextContent(`필사한 곳 ${mine.length}`)
    expect(key).toHaveTextContent('마태복음 → 요한복음 → 사도행전')
    expect(key).toHaveAttribute('aria-expanded', 'false')
    await user.click(key)
    expect(key).toHaveAttribute('aria-expanded', 'true')
    const list = key.parentElement!.querySelector('.word-god-verses')!
    expect(within(list as HTMLElement).getAllByRole('listitem').map((li) => li.querySelector('.copy-god-key')!.textContent)).toEqual(mine.map((p) => p.ref))
    expect(screen.getByText(versesOf('마 4:18')[0].text)).toBeInTheDocument()
    expect(screen.queryByText(versesOf('요 1:42')[0].text)).toBeNull()
    // 곳: 갈릴리 (마태 4장에 여러 번)
    expect(screen.getByRole('button', { name: /^갈릴리/ })).toHaveTextContent('마태복음')
  })

  it('하나님 기록: 아직 없으면 장을 마치면 쌓인다는 한 줄', async () => {
    openWord()
    await userEvent.setup().click(tab('하나님 기록'))
    expect(screen.getByText(T.word.godEmpty)).toBeInTheDocument()
  })

  it('서고: 27권 현황 — 마친 장·제본(그대로/특별)·꽂힘(책등 등급)·책등', async () => {
    const progress = { ...newGame(CONTENT).progress, phm: { completed: [1], arrangement: {} }, jud: { completed: [1], arrangement: {} } }
    openWord({
      progress,
      bound: { phm: { day: 3 }, jud: { day: 4, special: { color: 'sky', pattern: 'dots', deco: 'navy' } } },
      shelved: { phm: 2 },
    })
    await userEvent.setup().click(tab('서고'))
    const rows = document.querySelectorAll('.word-lib-row')
    expect(rows).toHaveLength(BOOKS.length)
    const phm = document.querySelector('.word-lib-row[data-book="phm"]')!
    expect(phm).toHaveTextContent('1/1장')
    expect(phm).toHaveTextContent('제본')
    expect(phm).toHaveTextContent(`꽂힘 · ${(T.library.grades as string[])[2]}`)
    expect(phm.querySelector('.spine-art')).not.toBeNull()
    const jud = document.querySelector('.word-lib-row[data-book="jud"]')!
    expect(jud).toHaveTextContent('특별 제본')
    expect(jud).toHaveTextContent('꽂기 전')
    const mt = document.querySelector('.word-lib-row[data-book="mt"]')!
    expect(mt).toHaveTextContent('0/28장')
    expect(mt).toHaveTextContent('제본 전')
    expect(mt.querySelector('.spine-slot')).not.toBeNull()
    expect(screen.getByText('신약 1/27 꽂힘')).toBeInTheDocument()
  })
})

describe('말씀 탭 계산', () => {
  it('piecesByBook: 성경 순서(책 → 장 → 본문 순서), 받은 것만', () => {
    const g = piecesByBook(['rom-002', 'mk-002-001', 'mk-001-001', 'mt-001-001'])
    expect(g.map((x) => x.book)).toEqual(['mt', 'mk', 'rom'])
    expect(g[1].pieces.map((p) => p.id)).toEqual(['mk-001-001', 'mk-002-001'])
  })
  it('godByKeyword: 키워드 목록 순서, 같은 키워드는 쌓인다', () => {
    const [k1, k2] = Object.keys(GOD_KEYWORDS)
    const r1 = GOD_RECORDS.find((r) => r.keyword === k1)!
    const r2 = GOD_RECORDS.find((r) => r.keyword === k2)!
    const g = godByKeyword([{ ...r2, day: 1 }, { ...r1, day: 2 }])
    expect(g.map((x) => x.keyword)).toEqual([k1, k2])
  })
  it('contextOf: 조각 앞뒤 세 절씩 (장 안에서), 장 통째 조각은 그 장 그대로', () => {
    const p = pieceById('mk-002-001')
    const inner = versesOf(p.ref)
    const ctx = contextOf(p.ref)
    expect(ctx.filter((v) => v.inPiece).map((v) => v.verse)).toEqual(inner.map((v) => v.verse))
    expect(ctx.filter((v) => !v.inPiece).length).toBeGreaterThan(0)
    expect(ctx.length).toBeLessThanOrEqual(inner.length + 6)
    const whole = contextOf(pieceById('phm-001').ref)
    expect(whole.every((v) => v.inPiece)).toBe(true)
    expect(whole).toHaveLength(versesOf(pieceById('phm-001').ref).length)
  })
})
