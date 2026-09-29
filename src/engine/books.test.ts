import { CONTENT, piecesOf } from '../content/catalog'
import { bookDone, chaptersOf, emptyProgress, totalChapters } from './books'
import { chooseBook, goToSleep, listen, newGame, setArrangement, submitChapter } from './game'

describe('책별 진행', () => {
  it('빈 진행과 장 수 세기', () => {
    const p = emptyProgress()
    expect(Object.keys(p)).toEqual(['mt', 'mk', 'lk', 'jn', 'ac'])
    expect(totalChapters({ progress: p })).toBe(0)
    // 마가 전체 16장
    expect(chaptersOf('mk', CONTENT)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
    expect(chaptersOf('lk', CONTENT)).toHaveLength(24)
    expect(bookDone({ progress: p }, 'mk', CONTENT)).toBe(false)
    // 네 권 모두 조각이 있다 — 아무 장도 끝내지 않았으면 어느 책도 끝난 것이 아니다
    expect(bookDone({ progress: p }, 'mt', CONTENT)).toBe(false)
  })

  it('처음에는 고른 책이 없고 이웃도 조각을 건네지 않는다', () => {
    const s = newGame(CONTENT)
    expect(s.activeBook).toBeNull()
    expect(s.offers).toEqual({})
    expect(s.collected).toEqual([])
  })

  it('책을 고르면 그 책 1장의 조각이 이웃에게 배정된다', () => {
    const s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    const ids = Object.values(s.offers)
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) expect(id.startsWith('mk-001-')).toBe(true)
  })

  it('눅 1:1-4도 이웃이 건넨다 (주인공은 누가복음을 쓴 사람이 아니다)', () => {
    let s = chooseBook(newGame(CONTENT), 'lk', CONTENT)
    const got = new Set<string>()
    for (let d = 0; d < 12; d++) {
      for (const n of Object.keys(s.offers)) {
        const r = listen(s, n, CONTENT)
        s = r.state
        if (r.pieceId) got.add(r.pieceId)
      }
      s = goToSleep(s, CONTENT)
    }
    expect(got.has('lk-001-001')).toBe(true)
  })

  it('같은 날 이미 건넨 이웃은 책을 바꿔도 또 건네지 않는다', () => {
    let s = chooseBook(newGame(CONTENT), 'lk', CONTENT)
    const n = Object.keys(s.offers)[0]
    s = listen(s, n, CONTENT).state
    s = chooseBook(s, 'mk', CONTENT)
    expect(s.offers[n]).toBeUndefined()
    for (const id of Object.values(s.offers)) expect(id.startsWith('mk-')).toBe(true)
  })

  it('장을 마치면 그 책의 진행에만 쌓이고, 마지막 장이면 한 권 완성 장면', () => {
    let s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    for (const ch of chaptersOf('mk', CONTENT)) {
      const ids = piecesOf('mk').filter((p) => p.chapter === ch).map((p) => p.id)
      s = { ...s, collected: [...s.collected, ...ids], inv: { ...s.inv, papyrus: 1, ink: 1 }, needs: { ...s.needs, fatigue: 0 } }
      s = setArrangement(s, 'mk', ch, ids)
      const r = submitChapter(s, 'mk', ch, CONTENT)
      expect(r.result.kind).toBe('done')
      s = r.state
    }
    expect(s.progress.mk.completed).toEqual(chaptersOf('mk', CONTENT))
    expect(s.progress.lk.completed).toEqual([])
    expect(totalChapters(s)).toBe(16)
    expect(bookDone(s, 'mk', CONTENT)).toBe(true)
    expect(s.scenes).toContain('firstChapter')
    expect(s.scenes).toContain('bookBound')
  })
})
