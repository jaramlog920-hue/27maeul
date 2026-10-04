import { CONTENT, piecesOf } from '../content/catalog'
import { bookDone, chaptersOf, emptyProgress, totalChapters } from './books'
import { chooseBook, goToSleep, listen, newGame, setArrangement, submitChapter, type GameState } from './game'

describe('책별 진행', () => {
  it('빈 진행과 장 수 세기', () => {
    const p = emptyProgress()
    expect(Object.keys(p)).toEqual([
      'mt', 'mk', 'lk', 'jn', 'ac', 'rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm',
      'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
    ])
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

  it('책을 골라도 그 책의 조각이 이웃에게 배정되지 않는다 — 말씀 조각은 고른 책과 묶지 않는다 (계획 14 작업 5)', () => {
    const s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    expect(s.offers).toEqual({})
    // 며칠 지나면 드물게 오는 조각은 고른 책이 아닌 책의 것일 수도 있다
    let d = s
    const books = new Set<string>()
    for (let i = 0; i < 40; i++) {
      d = goToSleep(d, CONTENT)
      for (const id of [...Object.values(d.offers), ...d.post]) books.add(id.split('-')[0])
    }
    expect([...books].some((b) => b !== 'mk')).toBe(true)
  })

  it('같은 날 이미 건넨 이웃은 책을 바꿔도 또 건네지 않는다', () => {
    let s: GameState = { ...chooseBook(newGame(CONTENT), 'lk', CONTENT), offers: { baker: 'lk-001-001' } }
    s = listen(s, 'baker', CONTENT).state
    s = chooseBook(s, 'mk', CONTENT)
    expect(s.offers.baker).toBeUndefined()
    expect(listen(s, 'baker', CONTENT).pieceId).toBeNull()
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
