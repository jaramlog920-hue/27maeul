// 계획 21 R1: 필사 방식 — 확률표·결정성·조각/빈칸이 본문 그대로
import { CONTENT } from '../content/catalog'
import { copyVerses } from './copying'
import { blanksForVerse, copyLevel, joinTiles, tilesFor, wayFor, wayOdds } from './copy-ways'
import { freshStats } from './stats'

describe('필사 방식 뽑기', () => {
  it('처음(실력 2)은 늘 직접 쓰기, 실력이 오를수록 퍼즐이 섞인다', () => {
    expect(copyLevel(freshStats())).toBe(2)
    expect(wayOdds(2)).toEqual([100, 0, 0])
    expect(wayOdds(10)).toEqual([25, 30, 45])
    for (let v = 1; v <= 50; v++) expect(wayFor(7, 'lk', 1, v, 2)).toBe('write')
    const ways = Array.from({ length: 400 }, (_, v) => wayFor(7, 'lk', 3, v, 10))
    const share = (w: string) => ways.filter((x) => x === w).length / ways.length
    expect(share('write')).toBeGreaterThan(0.15)
    expect(share('blank')).toBeGreaterThan(0.3)
  })
  it('같은 씨앗·절이면 같은 방식, 항상 직접 쓰기 설정이면 직접', () => {
    expect(wayFor(5, 'mt', 5, 3, 8)).toBe(wayFor(5, 'mt', 5, 3, 8))
    for (let v = 1; v <= 30; v++) expect(wayFor(5, 'mt', 5, v, 10, true)).toBe('write')
  })
})

describe('낱말 조각과 빈칸은 본문 그대로', () => {
  const verses = copyVerses('lk', 15, CONTENT)
  const texts = verses.map((v) => v.text)
  it('조각을 이으면 본문의 어절 그대로 (긴 구절은 앞부분을 놓아 둔다)', () => {
    for (const lv of [3, 6, 10])
      for (const v of verses) {
        const t = tilesFor(v.text, lv, 9, 'lk', 15, v.verse)
        if (!t) continue
        expect(joinTiles(t)).toBe(v.text.split(/\s+/).filter(Boolean).join(' '))
        expect(t.pieces.length).toBeLessThanOrEqual(8)
        expect([...t.order].sort((a, b) => a - b)).toEqual(t.pieces.map((_, i) => i))
      }
  })
  it('빈칸에 답을 넣으면 원문, 틀린 보기로 채운 절은 그 장의 다른 절이 아니다', () => {
    let made = 0
    for (const v of verses) {
      const bs = blanksForVerse(v.text, texts, 10, 9, 'lk', 15, v.verse)
      if (!bs) continue
      made++
      const words = v.text.split(/\s+/).filter(Boolean)
      for (const b of bs) {
        expect(words[b.index]).toBe(b.answer)
        expect(b.options).toContain(b.answer)
        expect(new Set(b.options).size).toBe(b.options.length)
        for (const o of b.options.filter((x) => x !== b.answer)) {
          const filled = words.map((w, i) => (i === b.index ? o : w)).join(' ')
          expect(texts.map((t) => t.split(/\s+/).join(' '))).not.toContain(filled)
        }
      }
      expect(bs.length).toBeLessThanOrEqual(3)
    }
    expect(made).toBeGreaterThan(10)
  })
})
