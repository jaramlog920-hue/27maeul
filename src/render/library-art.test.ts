import { describe, expect, it } from 'vitest'
import { COVER_COLORS, COVER_PATTERNS, SPINE_DECOS } from '../engine/binding'
import { BOOKS } from '../engine/types'
import { LIBRARY_ACTIONS, libraryBookRows, libraryPalette, libraryWorkRows } from './library-art'

describe('서고 도트', () => {
  it('꾸미기 96조합이 책등·표지에 모두 구별되고 팔레트와 크기가 유효하다', () => {
    const designs = new Set<string>()
    for (const color of COVER_COLORS) for (const pattern of COVER_PATTERNS) for (const deco of SPINE_DECOS) {
      const binding = { day: 1, special: { color, pattern, deco } }, pal = libraryPalette('mt', binding, 2)
      const spine = libraryBookRows('mt', binding, 2), cover = libraryBookRows('mt', binding, undefined, false, true)
      designs.add(JSON.stringify([spine, pal.c, pal.d]))
      for (const [rows, width, height] of [[spine, 8, 20], [cover, 24, 32]] as const) {
        expect(rows.length).toBe(height)
        expect(rows.every(row => row.length === width && [...row].every(c => c === '.' || pal[c as keyof typeof pal]))).toBe(true)
      }
    }
    expect(designs.size).toBe(96)
  })
  it('27권의 기본 책등을 구별하고 봉인·금박이 무늬 위에 남는다', () => {
    expect(new Set(BOOKS.map(book => JSON.stringify([libraryBookRows(book), libraryPalette(book)]))).size).toBe(27)
    const rows = libraryBookRows('mt', undefined, 2, true)
    expect(rows[1]).toContain('g')
    expect(rows[14]).toContain('r')
  })
  it('각 작업에 실제 네 박자 변화가 있고 끝 프레임은 완료 상태다', () => {
    for (const action of LIBRARY_ACTIONS) {
      const frames = [0, 1, 2, 3].map(f => libraryWorkRows('mt', action, f))
      expect(new Set(frames.map(r => r.join('\n'))).size).toBeGreaterThan(2)
      expect(frames.every(rows => rows.length === 32 && rows.every(r => r.length === 32))).toBe(true)
      expect(libraryWorkRows('mt', action, 10)).toEqual(frames[3])
      const pal = libraryPalette('mt')
      expect(frames.every(rows => rows.every(row => [...row].every(c => c === '.' || pal[c as keyof typeof pal])))).toBe(true)
    }
  })
})
