// 계획 14 작업 8: 완성된 책을 물건으로 — 펼쳐 보기, 첫 쪽의 나의 필사 기록, 이 책에서 발견한 하나님 기록, 집 책장
import { CONTENT } from '../content/catalog'
import { chaptersOf, emptyProgress } from './books'
import { copySpot, copyVerses, sanitizeBookDays } from './copying'
import { bookGodFinds, bookRecord, finishedBooks, HOME_SHELF_MAX, isFinished, readChapters, sanitizeHomeShelf, toggleHomeBook } from './finished-books'
import { bookcaseAt, newGame, playerTile, startCopy, tapTile, writeVerse, type GameState } from './game'
import { deserialize, serialize } from './save'
import { placeAt } from './world'
import type { Book } from './types'

const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), scenes: [], ...patch })

function writeChapter(s: GameState, book: Book) {
  let r = writeVerse(s, book, copySpot(s, book, CONTENT)!.verse.text, CONTENT)
  while (r.result.kind === 'verse') r = writeVerse(r.state, book, copySpot(r.state, book, CONTENT)!.verse.text, CONTENT)
  return r
}

describe('책을 쓴 날 — 쓰기 시작한 날·마친 날', () => {
  it('처음 한 절을 적은 날이 시작한 날, 마지막 장을 마친 날이 마친 날', () => {
    const s = startCopy(fresh(), 'phm', CONTENT)
    const day = s.clock.day
    const one = writeVerse(s, 'phm', copySpot(s, 'phm', CONTENT)!.verse.text, CONTENT).state
    expect(one.copy.days?.phm).toEqual({ start: day })
    const done = writeChapter(one, 'phm').state
    expect(done.copy.days?.phm).toEqual({ start: day, end: done.clock.day })
  })

  it('시작한 날은 다시 적어도 바뀌지 않는다', () => {
    const s = fresh({ copy: { book: 'mt', at: {}, legacy: {}, days: { mt: { start: 3 } } } })
    const r = writeVerse(s, 'mt', copySpot(s, 'mt', CONTENT)!.verse.text, CONTENT)
    expect(r.state.copy.days?.mt).toEqual({ start: 3 })
  })

  it('저장·불러오기에 남고, 이상한 값은 버린다', () => {
    const done = writeChapter(startCopy(fresh(), 'phm', CONTENT), 'phm').state
    const back = deserialize(serialize(done), CONTENT)!
    expect(back.copy.days).toEqual(done.copy.days)
    expect(sanitizeBookDays({ mt: { start: 5, end: 3 }, mk: { start: -1 }, zz: { start: 1 }, lk: { start: 2, end: 9 }, jn: 7 })).toEqual({
      mt: { start: 5 },
      lk: { start: 2, end: 9 },
    })
  })

  it('옛 저장(이 칸이 없던 때)도 그대로 불러온다 — 날짜는 없음', () => {
    const back = deserialize(serialize(fresh()), CONTENT)!
    expect(back.copy.days).toBeUndefined()
  })
})

describe('나의 필사 기록 (완성본 첫 쪽)', () => {
  it('필사로 마친 책: 날짜·절 수·글자 수 (본문 없는 절은 빼고)', () => {
    const done = writeChapter(startCopy(fresh(), 'phm', CONTENT), 'phm').state
    const vs = copyVerses('phm', 1, CONTENT)
    const rec = bookRecord(done, 'phm', CONTENT)
    expect(rec).toMatchObject({ verses: vs.length, chars: vs.reduce((n, v) => n + v.chars, 0), copied: 1, legacy: 0, bound: null })
    expect(rec.start).toBe(done.copy.days!.phm!.start)
    expect(rec.end).toBe(done.copy.days!.phm!.end)
    // 쓴 양은 필사 통계와 같다
    expect(rec.chars).toBe(done.copyStats.chars)
    expect(rec.verses).toBe(done.copyStats.verses)
  })

  it('예전에 엮은 책(필사가 생기기 전에 마친 책): 숫자 없이 — 절·글자 0, 날짜 없음, 예전 장 수만', () => {
    const all = chaptersOf('mk', CONTENT)
    const o = JSON.parse(serialize(fresh({ progress: { ...emptyProgress(), mk: { completed: all, arrangement: {} } }, shelved: { mk: 1 } })))
    delete o.copy
    delete o.copyStats
    const back = deserialize(JSON.stringify(o), CONTENT)!
    expect(isFinished(back, 'mk')).toBe(true)
    expect(bookRecord(back, 'mk', CONTENT)).toEqual({ start: null, end: null, verses: 0, chars: 0, copied: 0, legacy: all.length, bound: null })
    // 펼쳐 보기는 예전에 엮은 장도 본문 그대로 보여 준다
    const read = readChapters(back, 'mk', CONTENT)
    expect(read.map((c) => c.chapter)).toEqual(all)
    expect(read.every((c) => c.legacy)).toBe(true)
  })

  it('예전 장과 필사한 장이 섞인 책: 필사한 장만 센다', () => {
    const all = chaptersOf('mk', CONTENT)
    const s = fresh({ progress: { ...emptyProgress(), mk: { completed: all.slice(0, -1), arrangement: {} } }, copy: { book: 'mk', at: {}, legacy: { mk: all.slice(0, -1) } } })
    const done = writeChapter(s, 'mk').state
    const last = copyVerses('mk', 16, CONTENT)
    expect(bookRecord(done, 'mk', CONTENT)).toMatchObject({ copied: 1, legacy: 15, verses: last.length, chars: last.reduce((n, v) => n + v.chars, 0) })
  })
})

describe('펼쳐 보기·이 책에서 발견한 기록', () => {
  it('마친 장을 장 순서대로, 필사할 때와 같은 절 (본문 없는 절 빠짐)', () => {
    const s = fresh({ progress: { ...emptyProgress(), mt: { completed: [17, 1], arrangement: {} } } })
    const read = readChapters(s, 'mt', CONTENT)
    expect(read.map((c) => c.chapter)).toEqual([1, 17])
    expect(read[1].verses.map((v) => v.verse)).not.toContain(21)
    expect(read[1].verses).toEqual(copyVerses('mt', 17, CONTENT))
  })

  it('이 책의 기록만 키워드 목록 순서로 묶는다', () => {
    const finds = [
      { keyword: 'b', ref: '마 5:1', book: 'mt' as Book, chapter: 5, day: 1 },
      { keyword: 'a', ref: '마 3:1', book: 'mt' as Book, chapter: 3, day: 1 },
      { keyword: 'b', ref: '마 2:1', book: 'mt' as Book, chapter: 2, day: 1 },
      { keyword: 'a', ref: '막 1:1', book: 'mk' as Book, chapter: 1, day: 1 },
    ]
    const g = bookGodFinds(finds, 'mt', ['a', 'b'])
    expect(g.map((x) => x.keyword)).toEqual(['a', 'b'])
    expect(g[1].finds.map((f) => f.ref)).toEqual(['마 2:1', '마 5:1'])
    expect(bookGodFinds(finds, 'lk', ['a', 'b'])).toEqual([])
  })
})

describe('집 책장', () => {
  const finished = (books: Book[]) => fresh({ bound: Object.fromEntries(books.map((b) => [b, { day: 1 }])) })

  it('다 쓴 책(제본했거나 꽂은 책)만, 성경 순서', () => {
    const s = fresh({ bound: { phm: { day: 2 } }, shelved: { mt: 0 } })
    expect(finishedBooks(s)).toEqual(['mt', 'phm'])
    expect(isFinished(s, 'mk')).toBe(false)
  })

  it(`두기·내려놓기 — 다 쓴 책만, ${HOME_SHELF_MAX}권까지 (서고는 그대로)`, () => {
    let s = finished(['mt', 'mk', 'lk', 'jn'])
    expect(toggleHomeBook(s, 'ac')).toBe(s)
    s = toggleHomeBook(toggleHomeBook(toggleHomeBook(s, 'mt'), 'mk'), 'lk')
    expect(s.homeShelf).toEqual(['mt', 'mk', 'lk'])
    expect(toggleHomeBook(s, 'jn')).toBe(s)
    s = toggleHomeBook(s, 'mk')
    expect(s.homeShelf).toEqual(['mt', 'lk'])
    expect(s.shelved).toEqual({})
  })

  it('저장 정리: 옛 저장은 빈 책장, 다 쓴 책만·한 번씩·몇 권까지', () => {
    expect(sanitizeHomeShelf(undefined, () => true)).toEqual([])
    expect(sanitizeHomeShelf(['mt', 'mt', 'zz', 'mk', 'lk', 'jn'], (b) => b !== 'mk')).toEqual(['mt', 'lk', 'jn'])
    // 저장 정리는 마친 책의 제본만 남기므로 마태복음을 다 마친 상태로
    const mt = { ...finished(['mt']), progress: { ...emptyProgress(), mt: { completed: chaptersOf('mt', CONTENT), arrangement: {} } } }
    const o = JSON.parse(serialize(mt))
    delete o.homeShelf
    expect(deserialize(JSON.stringify(o), CONTENT)!.homeShelf).toEqual([])
    const kept = deserialize(serialize({ ...mt, homeShelf: ['mt', 'mk'] }), CONTENT)!
    expect(kept.homeShelf).toEqual(['mt'])
  })

  it('집에 놓은 책장을 누르면 집 책장 (곁에 서 있으면 그 자리에서)', () => {
    const s = fresh()
    const from = playerTile(s)
    const spot = [{ x: from.x + 1, y: from.y }, { x: from.x - 1, y: from.y }, { x: from.x, y: from.y + 1 }, { x: from.x, y: from.y - 1 }].find((t) => !placeAt(t))!
    const g = { ...s, room: [{ item: 'bookcase' as const, x: spot.x, y: spot.y }] }
    expect(bookcaseAt(g, spot)).toBe(true)
    expect(bookcaseAt({ room: [{ item: 'bookcase', x: spot.x, y: spot.y, on: true }] }, spot)).toBe(false)
    const tapped = tapTile(g, spot)
    expect(tapped.target).toEqual({ kind: 'bookcase', tile: spot })
  })
})
