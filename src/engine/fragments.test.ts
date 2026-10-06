// 말씀 조각은 드물게 (계획 14 작업 5): 편지나 특별한 대화로 일주일에 몇 번, 날 씨앗으로 정해진다
import { CONTENT, PIECES } from '../content/catalog'
import {
  FRAGMENTS_PER_WEEK,
  SHELF_FILL_SLOTS,
  shelfFillSteps,
  drawFragment,
  fragmentSeed,
  fragmentWayOf,
  fragmentsForDay,
  pickFragment,
  pieceFrom,
  sanitizePieceLog,
  talkGiftOf,
  TALK_GIFT_HEARTS,
  whenOf,
  WEEK_DAYS,
} from './fragments'
import { POSTMAN } from './post'
import { VISIT_GIFTS } from './bonds'

describe('조각이 오는 날', () => {
  it('한 주(7일)에 조각 오는 날은 딱 FRAGMENTS_PER_WEEK번 — 편지 한 번·특별한 대화 한 번은 꼭 있다', () => {
    expect(FRAGMENTS_PER_WEEK).toBeGreaterThanOrEqual(2)
    expect(FRAGMENTS_PER_WEEK).toBeLessThanOrEqual(4)
    for (let week = 0; week < 30; week++) {
      const ways = Array.from({ length: WEEK_DAYS }, (_, i) => fragmentWayOf(week * WEEK_DAYS + i + 1))
      expect(ways.filter((w) => w !== null)).toHaveLength(FRAGMENTS_PER_WEEK)
      expect(ways).toContain('letter')
      expect(ways).toContain('talk')
    }
  })
  it('같은 날은 늘 같다 (날 씨앗), 주마다 요일이 바뀐다', () => {
    for (let d = 1; d < 60; d++) expect(fragmentWayOf(d)).toBe(fragmentWayOf(d))
    const pattern = (week: number) => Array.from({ length: WEEK_DAYS }, (_, i) => fragmentWayOf(week * WEEK_DAYS + i + 1) !== null).join()
    expect(new Set(Array.from({ length: 10 }, (_, w) => pattern(w))).size).toBeGreaterThan(1)
  })
})

describe('어떤 조각이 오나', () => {
  it('아직 받지 않은 조각 중 하나 — 날 씨앗으로, 다 받았으면 없음', () => {
    const id = pickFragment(PIECES, [], 5)!
    expect(PIECES.some((p) => p.id === id)).toBe(true)
    expect(pickFragment(PIECES, [], 5)).toBe(id)
    expect(pickFragment(PIECES, [id], 5)).not.toBe(id)
    expect(pickFragment(PIECES.slice(0, 2), PIECES.slice(0, 2).map((p) => p.id), 5)).toBeNull()
  })
  it('27권 어느 책에서든 온다 (직업·필사하는 책과 묶지 않는다)', () => {
    const books = new Set<string>()
    for (let d = 1; d <= 400; d++) books.add(PIECES.find((p) => p.id === pickFragment(PIECES, [], d))!.book)
    expect(books.size).toBeGreaterThan(15)
    // 400일을 고르느라 5초 안팎이 걸린다 — 전체 테스트가 몰릴 때 기본 시간(5초)에 걸리지 않게
  }, 20_000)
})

describe('한 번에 정확히 한 조각 — 27권 전체의 아직 없는 조각 무작위 (2026-10-06)', () => {
  it('drawFragment: 아직 없는 조각만, 씨앗이 같으면 같고 다르면 흩어지며, 다 모았으면 null', () => {
    const got = PIECES.slice(0, 100).map((p) => p.id)
    const seen = new Set<string>()
    for (let seed = 1; seed <= 300; seed++) {
      const id = drawFragment(PIECES, got, seed)!
      expect(got).not.toContain(id)
      expect(drawFragment(PIECES, got, seed)).toBe(id)
      seen.add(id)
    }
    expect(seen.size).toBeGreaterThan(100)
    expect(drawFragment(PIECES, PIECES.map((p) => p.id), 1)).toBeNull()
    expect(drawFragment([], [], 1)).toBeNull()
  })
  it('책 제한도 장 순서도 없다 — 복음서·사도행전·편지·요한계시록 조각이 모두 나온다 (장 번호가 뒤죽박죽)', () => {
    const picked = Array.from({ length: 600 }, (_, i) => PIECES.find((p) => p.id === drawFragment(PIECES, [], fragmentSeed(i + 1, 'night')))!)
    const books = new Set(picked.map((p) => p.book))
    for (const b of ['mt', 'ac', 'rom', 'heb', 'rev'] as const) expect(books.has(b), b).toBe(true)
    // 첫 장부터 차례로가 아니다
    expect(picked.slice(0, 20).every((p, i, a) => i === 0 || p.chapter >= a[i - 1].chapter)).toBe(false)
  })
  it('길(source)마다 씨앗이 달라 같은 날 다른 길은 보통 다른 조각이고, 오늘의 조각 씨앗은 예전 그대로', () => {
    expect(fragmentSeed(9, 'day')).toBe(9 * 4441 + 17)
    const same = ['night', 'library', 'scroll', 'stars', 'child', 'trip:harbor'].map((s) => drawFragment(PIECES, [], fragmentSeed(12, s)))
    expect(new Set(same).size).toBeGreaterThan(3)
  })
  it('오늘의 조각(fragmentsForDay)은 하루에 한 조각 — 편지 post도 대화 offers도 하나뿐이다', () => {
    for (let d = 1; d <= 140; d++) {
      const r = fragmentsForDay({ day: d, pieces: CONTENT.pieces, collected: [], present: ['baker', 'smith'] })
      expect(r.post.length + Object.keys(r.offers).length).toBe(fragmentWayOf(d) ? 1 : 0)
    }
  })
  it('다 모았으면 오늘의 조각도 없다 (오류 없음)', () => {
    const all = CONTENT.pieces.map((p) => p.id)
    for (let d = 1; d <= 30; d++) expect(fragmentsForDay({ day: d, pieces: CONTENT.pieces, collected: all, present: ['baker'] })).toEqual({ offers: {}, post: [] })
  })
})
describe('오늘의 조각 (편지 또는 특별한 대화)', () => {
  const day = (way: 'letter' | 'talk') => {
    for (let d = 1; d < 100; d++) if (fragmentWayOf(d) === way) return d
    throw new Error('no day')
  }
  const neighbors = ['baker', 'smith', 'shepherd', POSTMAN]
  it('편지 날: 편지(post) 하나, 이웃은 건네지 않는다', () => {
    const r = fragmentsForDay({ day: day('letter'), pieces: CONTENT.pieces, collected: [], present: neighbors })
    expect(r.post).toHaveLength(1)
    expect(r.offers).toEqual({})
  })
  it('특별한 대화 날: 오늘 나온 이웃 한 명이 조각 하나 (편지 나르는 이웃은 아니다)', () => {
    const r = fragmentsForDay({ day: day('talk'), pieces: CONTENT.pieces, collected: [], present: neighbors })
    expect(r.post).toEqual([])
    const ids = Object.keys(r.offers)
    expect(ids).toHaveLength(1)
    expect(neighbors).toContain(ids[0])
    expect(ids[0]).not.toBe(POSTMAN)
  })
  it('대화 날인데 나온 이웃이 없으면 편지로 온다', () => {
    const r = fragmentsForDay({ day: day('talk'), pieces: CONTENT.pieces, collected: [], present: [POSTMAN] })
    expect(r.offers).toEqual({})
    expect(r.post).toHaveLength(1)
  })
  it('조각 없는 날은 아무것도 없다', () => {
    let d = 1
    while (fragmentWayOf(d) !== null) d++
    expect(fragmentsForDay({ day: d, pieces: CONTENT.pieces, collected: [], present: neighbors })).toEqual({ offers: {}, post: [] })
  })
  it('같은 이웃이 늘 주지 않는다 — 여러 주에 걸쳐 여러 이웃 (특정 구절을 특정 직업에 묶지 않는다)', () => {
    const tellers = new Set<string>()
    for (let d = 1; d <= 200; d++) for (const id of Object.keys(fragmentsForDay({ day: d, pieces: CONTENT.pieces, collected: [], present: neighbors }).offers)) tellers.add(id)
    expect(tellers.size).toBeGreaterThanOrEqual(3)
  })
})

describe('받은 기록', () => {
  it('pieceFrom: 이웃·편지·여행 등 어디서 왔는지', () => {
    expect(pieceFrom('npc:baker')).toEqual({ kind: 'npc', who: 'baker' })
    expect(pieceFrom('letter')).toEqual({ kind: 'letter' })
    expect(pieceFrom('trip:harbor')).toEqual({ kind: 'trip', who: 'harbor' })
    expect(pieceFrom(undefined)).toEqual({ kind: 'unknown' })
    expect(pieceFrom('???')).toEqual({ kind: 'unknown' })
  })
  it('whenOf: 3년째 봄 — 한 해 160일, 한 계절 40일', () => {
    expect(whenOf(1)).toEqual({ year: 1, season: 'spring', d: 1 })
    expect(whenOf(41)).toEqual({ year: 1, season: 'summer', d: 1 })
    expect(whenOf(161)).toEqual({ year: 2, season: 'spring', d: 1 })
    expect(whenOf(2 * 160 + 15)).toEqual({ year: 3, season: 'spring', d: 15 })
  })
  it('저장 정리: 받은 조각의 모양 맞는 기록만, 옛 저장은 빈 기록', () => {
    expect(sanitizePieceLog(undefined, ['a'])).toEqual({})
    expect(sanitizePieceLog({ a: { day: 3, from: 'letter' }, b: { day: 2, from: 'letter' }, c: { day: 'x', from: 'letter' } }, ['a', 'c'])).toEqual({ a: { day: 3, from: 'letter' } })
  })
})

describe('평소 대화의 직업 선물', () => {
  it('마음이 조금 열린 이웃은 가끔 말을 걸면 자기 일에서 난 것을 챙겨 준다 (날마다는 아니다)', () => {
    const hearts = { baker: 100 }
    const days = Array.from({ length: 60 }, (_, i) => i + 1)
    const gave = days.filter((d) => talkGiftOf('baker', d, hearts, {}) !== null)
    expect(gave.length).toBeGreaterThan(5)
    expect(gave.length).toBeLessThan(40)
    for (const d of gave) expect(talkGiftOf('baker', d, hearts, {})).toEqual(VISIT_GIFTS.baker)
  })
  it('처음 보는 사이·오늘 이미 받은 날·직업 선물이 없는 이웃은 없음', () => {
    const d = Array.from({ length: 60 }, (_, i) => i + 1).find((x) => talkGiftOf('baker', x, { baker: 100 }, {}) !== null)!
    expect(talkGiftOf('baker', d, { baker: 0 }, {})).toBeNull()
    expect(TALK_GIFT_HEARTS).toBeGreaterThan(0)
    expect(talkGiftOf('baker', d, { baker: 100 }, { 'talkGift:baker': d })).toBeNull()
    expect(talkGiftOf('wendell', d, { wendell: 100 }, {})).toBeNull()
  })
})

describe('서고 작은 책장 채움', () => {
  it('조각 0개는 빈 선반, 다 모으면 가득, 일부는 그 사이', () => {
    expect(shelfFillSteps(0, 200)).toBe(0)
    expect(shelfFillSteps(1, 2000)).toBe(1)
    expect(shelfFillSteps(100, 200)).toBe(SHELF_FILL_SLOTS / 2)
    expect(shelfFillSteps(199, 200)).toBeLessThan(SHELF_FILL_SLOTS)
    expect(shelfFillSteps(200, 200)).toBe(SHELF_FILL_SLOTS)
    expect(shelfFillSteps(5, 0)).toBe(0)
  })
  it('모을수록 줄지 않는다', () => {
    let prev = 0
    for (let n = 0; n <= 300; n++) {
      const s = shelfFillSteps(n, 300)
      expect(s).toBeGreaterThanOrEqual(prev)
      prev = s
    }
  })
})
