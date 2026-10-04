import { CONTENT, GOD_KEYWORDS, GOD_RECORDS, versesOf } from '../content/catalog'
import { copyChapters } from './copying'
import { backfillGodRecords, chapterFinds, sanitizeGodRecords, type GodFind } from './god-records'
import { BOOKS, type Book } from './types'
import { newGame } from './game'
import { deserialize, serialize } from './save'

describe('하나님 기록 — 장을 마쳤을 때 새로 발견하는 줄', () => {
  const defs = [
    { keyword: 'give', ref: '마 5:45', book: 'mt' as const, chapter: 5 },
    { keyword: 'perfect', ref: '마 5:48', book: 'mt' as const, chapter: 5 },
    { keyword: 'knows', ref: '마 6:8', book: 'mt' as const, chapter: 6 },
  ]
  it('그 장의 줄만, 데이터 순서대로, 발견한 날과 함께', () => {
    expect(chapterFinds(defs, [], 'mt', 5, 12)).toEqual([
      { keyword: 'give', ref: '마 5:45', book: 'mt', chapter: 5, day: 12 },
      { keyword: 'perfect', ref: '마 5:48', book: 'mt', chapter: 5, day: 12 },
    ])
    expect(chapterFinds(defs, [], 'mk', 5, 12)).toEqual([])
  })
  it('이미 발견한 줄은 다시 나오지 않는다', () => {
    const known: GodFind[] = [{ keyword: 'give', ref: '마 5:45', book: 'mt', chapter: 5, day: 3 }]
    expect(chapterFinds(defs, known, 'mt', 5, 12).map((f) => f.ref)).toEqual(['마 5:48'])
  })
  it('저장 정리: 모양이 맞는 줄만, 같은 줄은 한 번만, 옛 저장은 빈 목록', () => {
    expect(sanitizeGodRecords(undefined)).toEqual([])
    expect(sanitizeGodRecords('x')).toEqual([])
    const good = { keyword: 'give', ref: '마 5:45', book: 'mt', chapter: 5, day: 3 }
    expect(
      sanitizeGodRecords([good, good, { ...good, book: 'xx' }, { ...good, chapter: 0 }, { ...good, day: -1 }, { ...good, keyword: '' }, null]),
    ).toEqual([good])
  })
  it('저장했다 불러와도 남고, 칸이 없던 옛 저장은 빈 목록으로 불러온다', () => {
    const s = { ...newGame(CONTENT), godRecords: [{ keyword: 'give', ref: '마 5:45', book: 'mt' as const, chapter: 5, day: 3 }] }
    expect(deserialize(serialize(s), CONTENT)!.godRecords).toEqual(s.godRecords)
    const old = JSON.parse(serialize(newGame(CONTENT)))
    delete old.godRecords
    expect(deserialize(JSON.stringify(old), CONTENT)!.godRecords).toEqual([])
  })
  it('예전에 엮은 장 채우기: 마친 장마다 아직 없는 줄만 그날 날짜로, 몇 번 해도 같다', () => {
    const known: GodFind[] = [{ keyword: 'give', ref: '마 5:45', book: 'mt', chapter: 5, day: 3 }]
    const completed = { ...(Object.fromEntries(BOOKS.map((b) => [b, [] as number[]])) as Record<Book, number[]>), mt: [6, 5] }
    const once = backfillGodRecords(defs, known, completed, 20)
    expect(once).toEqual([
      known[0],
      { keyword: 'perfect', ref: '마 5:48', book: 'mt', chapter: 5, day: 20 },
      { keyword: 'knows', ref: '마 6:8', book: 'mt', chapter: 6, day: 20 },
    ])
    expect(backfillGodRecords(defs, once, completed, 30)).toEqual(once)
  })
  it('필사 전에 마친 장은 불러올 때 하나님 기록이 채워진다 (지금 날짜로, 다시 불러와도 그대로)', () => {
    const fresh = newGame(CONTENT)
    const kept = { keyword: 'x-kept', ref: '마 1:1', book: 'mt' as const, chapter: 1, day: 2 }
    const s = {
      ...fresh,
      clock: { ...fresh.clock, day: 20 },
      progress: { ...fresh.progress, mt: { ...fresh.progress.mt, completed: [5] } },
      godRecords: [kept],
    }
    const loaded = deserialize(serialize(s), CONTENT)!
    const mt5 = GOD_RECORDS.filter((r) => r.book === 'mt' && r.chapter === 5)
    expect(mt5.length).toBeGreaterThan(0)
    expect(loaded.progress.mt.completed).toEqual([5])
    expect(loaded.godRecords).toEqual([kept, ...mt5.map((r) => ({ keyword: r.keyword, ref: r.ref, book: 'mt', chapter: 5, day: 20 }))])
    // 다음 날 다시 불러와도 날짜가 바뀌거나 겹치지 않는다
    const again = deserialize(serialize({ ...loaded, clock: { ...loaded.clock, day: 21 } }), CONTENT)!
    expect(again.godRecords).toEqual(loaded.godRecords)
  })
})

describe('하나님 기록 데이터를 게임이 읽는 모양', () => {
  it('모든 줄의 책은 게임 책 id, 장은 필사하는 장, 구절은 본문이 있는 한 절, 키워드는 이름이 있다', () => {
    expect(GOD_RECORDS.length).toBeGreaterThan(100)
    for (const r of GOD_RECORDS) {
      expect(copyChapters(r.book, CONTENT), r.ref).toContain(r.chapter)
      const vs = versesOf(r.ref)
      expect(vs, r.ref).toHaveLength(1)
      expect(vs[0].chapter, r.ref).toBe(r.chapter)
      expect(GOD_KEYWORDS[r.keyword]?.name, r.ref).toBeTruthy()
    }
    expect(CONTENT.godRecords).toBe(GOD_RECORDS)
  })
  it('복음서·사도행전 줄은 본문 책 id(mat·act)가 아니라 게임 책 id(mt·ac)로 읽힌다', () => {
    expect(GOD_RECORDS.find((r) => r.ref === '마 5:45')?.book).toBe('mt')
    expect(GOD_RECORDS.some((r) => r.book === 'ac')).toBe(true)
  })
})
