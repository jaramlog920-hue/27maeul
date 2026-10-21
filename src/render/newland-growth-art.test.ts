// 2026-10-21 사용자: 새 터 겉모습 시안 1(서고 앞 소품)·2(길가 꽃·나무)·3(저녁 등불)
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from '../engine/game'
import type { Build } from '../engine/newland-build'
import { BUILD_KEEP_ROAD_ROWS, NEWLAND_W } from '../engine/newland-config'
import { NEWLAND_MAP } from '../engine/newland'
import { OT_ROOMS, otRow } from '../engine/ot-books'
import { FLAG_ROWS, LAMP_LIT_ROWS, LAMP_ROWS, newlandGrowthProps, otAllDone, POTS_ROWS, ROADSIDE_MAX, WELL_ROWS } from './newland-growth-art'

const work = (id: string, x: number, y: number): Build => ({ id, kind: 'kidWork', x, y, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, owner: 'npc:ray' } as Build)
const land = (builds: Build[] = [], flags: Record<string, number> = {}, tiles: Record<string, string> = {}): GameState => {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, ...flags }, newland: { builds, tiles, nextId: builds.length + 1, settledDay: 0 } } as GameState
}
const rooms = (n: number) => Object.fromEntries(OT_ROOMS.slice(0, n).map((r) => [`otRoomScene:${r.id}`, 1]))
const kinds = (s: GameState, night = false) => newlandGrowthProps(s, night).map((p) => p.kind)

describe('새 터 겉모습', () => {
  it('그림은 모두 16칸 폭 이하이고 줄 길이가 고르다', () => {
    for (const rows of [WELL_ROWS, LAMP_LIT_ROWS, LAMP_ROWS, POTS_ROWS, FLAG_ROWS]) {
      expect(new Set(rows.map((r) => r.length)).size).toBe(1)
      expect(rows[0].length).toBeLessThanOrEqual(16)
    }
  })
  it('서고 방을 채울수록 우물 → 등불 기둥 → 화분 → 깃발', () => {
    expect(kinds(land())).toEqual([])
    expect(kinds(land([], rooms(1)))).toEqual(['well'])
    expect(kinds(land([], rooms(2)))).toEqual(['well', 'lamp', 'lamp'])
    expect(kinds(land([], rooms(3)))).toEqual(['well', 'lamp', 'lamp', 'pots'])
    expect(kinds(land([], rooms(4))).filter((k) => k === 'flag')).toHaveLength(2)
    expect(kinds(land([], rooms(4))).filter((k) => k === 'lamp')).toHaveLength(4)
  })
  it('표식 없는 옛 저장도 실제로 다 읽은 방이면 소품이 선다', () => {
    const s = land()
    const otProgress = Object.fromEntries(OT_ROOMS[0].books.map((b) => [b, { completed: Array.from({ length: otRow(b).chapters }, (_, i) => i + 1) }]))
    expect(kinds({ ...s, otProgress } as GameState)).toEqual(['well'])
  })
  it('등불은 구약을 다 마친 밤에만 켜진다', () => {
    const half = land([], rooms(2))
    expect(newlandGrowthProps(half, true).some((p) => p.lit)).toBe(false)
    const all = land([], rooms(4))
    expect(otAllDone(all)).toBe(true)
    expect(newlandGrowthProps(all, false).some((p) => p.lit)).toBe(false)
    expect(newlandGrowthProps(all, true).filter((p) => p.lit)).toHaveLength(4)
  })
  it('서고 앞 소품은 걸을 수 있는 풀밭 칸에 선다 (길을 막지 않는다)', () => {
    for (const p of newlandGrowthProps(land([], rooms(4)), true)) {
      if (p.kind === 'flag') continue
      expect('.,*').toContain(NEWLAND_MAP[p.at.y][p.at.x])
    }
  })
  it('사는 사람이 늘수록 길가 꽃·나무가 는다 — 겹치지 않고 큰길 위아래 줄에만, 많아야 정한 수', () => {
    const roadside = (s: GameState) => newlandGrowthProps(s, false).filter((p) => p.kind === 'flower' || p.kind === 'tree')
    expect(roadside(land())).toHaveLength(0)
    const three = land([work('b1', 4, 14), work('b2', 10, 14), work('b3', 16, 14)])
    expect(roadside(three)).toHaveLength(3)
    const many = land(Array.from({ length: 30 }, (_, i) => work(`b${i}`, (i % 8) * 4 + 2, 14 + Math.floor(i / 8) * 4)))
    const items = roadside(many)
    expect(items).toHaveLength(ROADSIDE_MAX)
    const keys = items.map((p) => `${p.at.x},${p.at.y}`)
    expect(new Set(keys).size).toBe(keys.length)
    const above = BUILD_KEEP_ROAD_ROWS[0] - 1, below = BUILD_KEEP_ROAD_ROWS[BUILD_KEEP_ROAD_ROWS.length - 1] + 1
    for (const p of items) {
      expect([above, below]).toContain(p.at.y)
      expect(p.at.x).toBeGreaterThan(0)
      expect(p.at.x).toBeLessThan(NEWLAND_W - 1)
    }
  })
  it('지은 칸·깐 칸에는 꽃을 두지 않는다', () => {
    const base = land([work('b1', 4, 14)])
    const first = newlandGrowthProps(base, false).find((p) => p.kind === 'flower')!
    const covered = land([work('b1', 4, 14)], {}, { [`${first.at.x},${first.at.y}`]: 'path' })
    const again = newlandGrowthProps(covered, false).filter((p) => p.kind === 'flower')
    expect(again).toHaveLength(1)
    expect(again[0].at).not.toEqual(first.at)
  })
})
