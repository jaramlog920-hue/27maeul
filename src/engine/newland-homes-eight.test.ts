// 2026-10-21 사용자: 새 터 입주 주택 두 채 → 여덟 채
import { INTERIOR, MAX_HOMES, NEWLAND_H, NEWLAND_VISIBLE_H, NEWLAND_W, ROOM_SLOTS } from './newland-config'
import { MAX_BUILDS } from './newland-build'

describe('입주 주택 안 방 칸', () => {
  it('여덟 칸이고, 처음 두 칸은 옛 저장 좌표 그대로', () => {
    expect(MAX_HOMES).toBe(8)
    expect(MAX_BUILDS).toBeGreaterThanOrEqual(MAX_HOMES + 8)
    expect([ROOM_SLOTS[0].x0, ROOM_SLOTS[0].y0]).toEqual([2, 32])
    expect([ROOM_SLOTS[1].x0, ROOM_SLOTS[1].y0]).toEqual([29, 32])
  })
  it('모두 숨은 줄 안에 있고, 서로·서고 안 방과 겹치지 않는다', () => {
    const cells = new Set<string>()
    const inInterior = (x: number, y: number) => x >= INTERIOR.x0 && x < INTERIOR.x0 + INTERIOR.w && y >= INTERIOR.y0 && y < INTERIOR.y0 + INTERIOR.h
    for (const r of ROOM_SLOTS) {
      expect(r.y0).toBeGreaterThanOrEqual(NEWLAND_VISIBLE_H)
      expect(r.y0 + r.h).toBeLessThanOrEqual(NEWLAND_H)
      expect(r.x0 + r.w).toBeLessThanOrEqual(NEWLAND_W)
      for (let y = r.y0; y < r.y0 + r.h; y++) for (let x = r.x0; x < r.x0 + r.w; x++) {
        expect(inInterior(x, y)).toBe(false)
        expect(cells.has(`${x},${y}`)).toBe(false)
        cells.add(`${x},${y}`)
      }
    }
  })
  it('방끼리 바닥이 맞닿지 않는다 (걸어서 옆 방으로 넘어가지 않게)', () => {
    const floor = (r: (typeof ROOM_SLOTS)[number]) => { const out: string[] = []; for (let y = r.y0 + 2; y < r.y0 + r.h; y++) for (let x = r.x0; x < r.x0 + r.w; x++) out.push(`${x},${y}`); return out }
    ROOM_SLOTS.forEach((a, i) => ROOM_SLOTS.forEach((b, j) => {
      if (i >= j) return
      const fb = new Set(floor(b))
      for (const c of floor(a)) { const [x, y] = c.split(',').map(Number); for (const n of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) expect(fb.has(n)).toBe(false) }
    }))
  })
})

describe('꿈터 간판 (2026-10-21 사용자: 원할 때만)', () => {
  it('기본은 안 달고, 다 지은 꿈터만 달고 뗄 수 있으며 저장에 남는다', async () => {
    const { toggleBuildSign, sanitizeNewlandBuild } = await import('./newland-build')
    const { signFor } = await import('../render/newland-house-art')
    const b = { id: 'b1', kind: 'weaver', x: 5, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
    const s = { newland: { builds: [b], tiles: {}, nextId: 2, settledDay: 0 } } as never
    expect(signFor('weaver', undefined, null)).toBeUndefined()
    const on = toggleBuildSign(s, 'b1') as unknown as { newland: { builds: { look?: { sign?: number } }[] } }
    expect(on.newland.builds[0].look?.sign).toBe(1)
    expect(signFor('weaver', on.newland.builds[0].look as never, null)).toBe('weaver')
    const off = toggleBuildSign(on as never, 'b1') as unknown as typeof on
    expect(off.newland.builds[0].look?.sign).toBeUndefined()
    expect(toggleBuildSign({ newland: { ...((s as { newland: object }).newland), builds: [{ ...b, kind: 'home' }] } } as never, 'b1')).toBeNull()
    void sanitizeNewlandBuild
  })
})
