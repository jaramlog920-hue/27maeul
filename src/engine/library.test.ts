import { CONTENT, piecesOf } from '../content/catalog'
import { chaptersOf } from './books'
import { bindBook, chooseBook, newGame, readScripture, type GameState } from './game'
import { canRetry, canShelve, gradeOf, payRetry, poolFor, readOff, RETRY_COST, shelve, sideShelfSpines, SIDE_SHELF, SPINES_PER_BOOK, type Grade } from './library'
import { BOOKS, type Book } from './types'

function withMarkDone(): GameState {
  const s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
  const ids = piecesOf('mk').map((p) => p.id)
  return { ...s, collected: ids, progress: { ...s.progress, mk: { completed: chaptersOf('mk', CONTENT), arrangement: {} } } }
}

describe('마을 서고', () => {
  it('책등 등급: 0~2 맨 책, 3~4 은박, 5 금박', () => {
    expect([0, 1, 2, 3, 4, 5].map(gradeOf)).toEqual([0, 0, 0, 1, 1, 2])
  })

  it('출제 범위는 서고의 책 + 지금 책 (오늘 성경의 순서)', () => {
    expect(poolFor({}, 'lk')).toEqual(['lk'])
    expect(poolFor({ lk: 1 }, 'mk')).toEqual(['mk', 'lk'])
    expect(poolFor({ mk: 2, lk: 0 }, 'lk')).toEqual(['mk', 'lk'])
  })

  it('다 필사해 제본한 책만, 한 번만 꽂는다', () => {
    const s0 = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    expect(canShelve(s0, 'mk', CONTENT)).toBe('notDone')
    expect(canShelve(withMarkDone(), 'mk', CONTENT)).toBe('notBound')
    const s = bindBook(withMarkDone(), 'mk', CONTENT)
    expect(canShelve(s, 'mk', CONTENT)).toBeNull()
    const t = shelve(s, 'mk', 4, ['mk-001-009'])
    expect(t.shelved.mk).toBe(1)
    expect(t.rereads).toEqual(['mk-001-009'])
    expect(t.scenes).toContain('firstShelved')
    expect(canShelve(t, 'mk', CONTENT)).toBe('already')
  })

  it('틀려도 꽂히고, 등급은 내려가지 않는다', () => {
    let s = shelve(withMarkDone(), 'mk', 0, [])
    expect(s.shelved.mk).toBe(0)
    s = shelve(s, 'mk', 5, [])
    expect(s.shelved.mk).toBe(2)
    s = shelve(s, 'mk', 1, [])
    expect(s.shelved.mk).toBe(2)
  })

  it('재도전은 꽂힌 책·금박 아닌 책만, 금박 재료와 기름이 든다', () => {
    const s = withMarkDone()
    expect(canRetry(s, 'mk')).toBe('notShelved')
    const t = shelve(s, 'mk', 3, [])
    expect(canRetry(t, 'mk')).toBe('needs')
    const rich = { ...t, inv: { ...t.inv, goldLeaf: 1, oil: 2 } }
    expect(canRetry(rich, 'mk')).toBeNull()
    const paid = payRetry(rich, 'mk')!
    expect(paid.inv.goldLeaf ?? 0).toBe(0)
    expect(paid.inv.oil).toBe(1)
    expect(RETRY_COST).toEqual({ goldLeaf: 1, oil: 1 })
    expect(canRetry(shelve(rich, 'mk', 5, []), 'mk')).toBe('gold')
  })

  it('다시 읽을 구절은 읽으면 목록에서 빠진다', () => {
    const s = shelve(withMarkDone(), 'mk', 3, ['mk-001-009', 'mk-002-001'])
    expect(readOff(s, 'mk-001-009').rereads).toEqual(['mk-002-001'])
    const r = readScripture(s, 'mk-002-001')!
    expect(r.state.rereads).toEqual(['mk-001-009'])
  })
})

describe('서고 양옆 책장: 복음서 다음에 꽂은 책마다 책등 둘씩, 왼쪽·오른쪽 번갈아', () => {
  it('복음서만 꽂았으면 비어 있다', () => {
    expect(sideShelfSpines({ mt: 2, mk: 1, lk: 0, jn: 2 })).toEqual([])
  })
  it('사도행전 한 권이면 왼쪽·오른쪽 첫 자리에 하나씩, 등급 그대로', () => {
    expect(sideShelfSpines({ mt: 2, mk: 1, lk: 0, jn: 2, ac: 1 })).toEqual([
      { book: 'ac', grade: 1, side: 'left', tile: 0, row: 0, col: 0 },
      { book: 'ac', grade: 1, side: 'right', tile: 0, row: 0, col: 0 },
    ])
  })
  it('스물세 권을 다 꽂으면 46자리 — 자리가 겹치지 않고 두 단 모두 찬다', () => {
    const all = Object.fromEntries(BOOKS.map((b) => [b, 2])) as Partial<Record<Book, Grade>>
    const spines = sideShelfSpines(all)
    expect(spines).toHaveLength((BOOKS.length - 4) * SPINES_PER_BOOK)
    const keys = spines.map((s) => `${s.side}${s.tile}${s.row}${s.col}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(spines.every((s) => s.tile < SIDE_SHELF.tiles && s.row < SIDE_SHELF.rows && s.col < SIDE_SHELF.perRow)).toBe(true)
    expect(spines.some((s) => s.row === 1)).toBe(true)
    expect(spines.at(-1)!.book).toBe('rev')
  })
})
