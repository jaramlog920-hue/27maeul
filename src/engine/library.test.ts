import { CONTENT, piecesOf } from '../content/catalog'
import { chooseBook, newGame, readScripture, type GameState } from './game'
import { canRetry, canShelve, gradeOf, payRetry, poolFor, readOff, RETRY_COST, shelve } from './library'

function withMarkDone(): GameState {
  const s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
  const ids = piecesOf('mk').map((p) => p.id)
  return { ...s, collected: ids, progress: { ...s.progress, mk: { completed: [1, 2, 3], arrangement: {} } } }
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

  it('다 엮은 책만, 한 번만 꽂는다', () => {
    const s0 = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    expect(canShelve(s0, 'mk', CONTENT)).toBe('notDone')
    const s = withMarkDone()
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
