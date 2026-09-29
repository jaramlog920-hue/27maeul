// 계획 5 작업 4: 사도행전 여정 카드 — 곳 이름은 본문 그대로, 본문 순서, 장을 엮으면 카드를 얻는다
import { CONTENT, JOURNEY, piecesOf, versesOf } from '../content/catalog'
import { chaptersOf } from './books'
import { cardsForChapters, journeyChapters, type JourneyCard } from './journey'

const verseNo = (ref: string) => ref.match(/^행 (\d+):(\d+)$/)!.slice(1).map(Number) as [number, number]

describe('여정 카드 데이터', () => {
  it('카드는 30–45장, 1장 예루살렘에서 28장 로마까지', () => {
    expect(JOURNEY.length).toBeGreaterThanOrEqual(30)
    expect(JOURNEY.length).toBeLessThanOrEqual(45)
    expect(JOURNEY[0]).toMatchObject({ place: '예루살렘', chapter: 1 })
    expect(JOURNEY.at(-1)).toMatchObject({ place: '로마', chapter: 28 })
  })

  it('곳 이름은 그 구절 본문에 글자 그대로 있다 (본문 없는 절이 아니다)', () => {
    for (const c of JOURNEY) {
      const vs = versesOf(c.ref)
      expect(vs, c.ref).toHaveLength(1)
      expect(vs[0].text, `${c.order} ${c.place}`).toContain(c.place)
      expect(vs[0].chapter).toBe(c.chapter)
    }
  })

  it('순서 번호는 1..N, 구절은 앞 카드보다 뒤 (한 구절에 한 장)', () => {
    JOURNEY.forEach((c, i) => {
      expect(c.order).toBe(i + 1)
      if (i === 0) return
      const [pc, pv] = verseNo(JOURNEY[i - 1].ref)
      const [cc, cv] = verseNo(c.ref)
      expect(cc > pc || (cc === pc && cv > pv), `${JOURNEY[i - 1].ref} → ${c.ref}`).toBe(true)
    })
  })

  it('같은 곳을 다시 가면 카드가 또 있다 (안디옥·예루살렘), 본문에 없는 구분 이름은 없다', () => {
    expect(JOURNEY.filter((c) => c.place === '안디옥').length).toBeGreaterThanOrEqual(2)
    expect(JOURNEY.filter((c) => c.place === '예루살렘').length).toBeGreaterThanOrEqual(2)
    for (const c of JOURNEY) expect(c.place).not.toMatch(/여행|차$|선교/)
  })

  it('카드가 있는 장은 모두 사도행전 조각이 있는 장이다 (엮을 수 있다)', () => {
    const chapters = new Set(chaptersOf('ac', CONTENT))
    expect(piecesOf('ac').length).toBeGreaterThan(0)
    for (const ch of journeyChapters(JOURNEY)) expect(chapters.has(ch), `${ch}장`).toBe(true)
  })
})

describe('장을 엮으면 카드를 얻는다', () => {
  const sample: JourneyCard[] = [
    { order: 1, place: 'ㄱ', ref: '행 1:12', chapter: 1 },
    { order: 2, place: 'ㄴ', ref: '행 9:8', chapter: 9 },
    { order: 3, place: 'ㄷ', ref: '행 9:26', chapter: 9 },
    { order: 4, place: 'ㄹ', ref: '행 28:16', chapter: 28 },
  ]

  it('엮은 장이 없으면 카드도 없다', () => {
    expect(cardsForChapters(sample, [])).toEqual([])
  })

  it('그 구절이 든 장을 엮은 카드만, 본문 순서대로', () => {
    expect(cardsForChapters(sample, new Set([28, 9])).map((c) => c.order)).toEqual([2, 3, 4])
    expect(cardsForChapters(sample, [1]).map((c) => c.place)).toEqual(['ㄱ'])
    expect(cardsForChapters(sample, [2, 3])).toEqual([])
  })

  it('실제 카드: 28장을 다 엮으면 전부, 1장만 엮으면 첫 카드(예루살렘)만', () => {
    const all = Array.from({ length: 28 }, (_, i) => i + 1)
    expect(cardsForChapters(JOURNEY, all)).toEqual(JOURNEY)
    expect(cardsForChapters(JOURNEY, [1]).map((c) => c.place)).toEqual(['예루살렘'])
  })
})
