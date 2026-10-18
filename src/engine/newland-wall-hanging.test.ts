// 새 터 서고·입주 주택 방에도 벽걸이를 건다 (2026-10-18 감사 M-23 — 첫 마을 집 기준으로만 판단해 모두 거절됐다)
import { CONTENT } from '../content/catalog'
import { NEWLAND_MAP } from './newland'
import { ARCHIVE_CTX, slotCtx } from './newland-rooms'
import { ROOM_SLOTS } from './newland-config'
import { placement, type RoomCtx } from './room'
import type { ItemId, Tile } from './types'

void CONTENT
const WALL_ITEMS: ItemId[] = ['copyClothesNiche', 'copySpringFlowers', 'copySummerShells', 'copyAutumnLeaves'] as ItemId[]

/** 이 방의 '바로 아래가 바닥인 벽' 칸들 */
function hangable(ctx: RoomCtx): Tile[] {
  const out: Tile[] = []
  for (let y = 0; y < NEWLAND_MAP.length; y++)
    for (let x = 0; x < NEWLAND_MAP[y].length; x++) if (NEWLAND_MAP[y][x] === '#' && ctx.isFloor({ x, y: y + 1 })) out.push({ x, y })
  return out
}

describe('새 터 방 벽걸이', () => {
  const rooms: [string, RoomCtx][] = [['서고', ARCHIVE_CTX], ...ROOM_SLOTS.map((s, i): [string, RoomCtx] => [`주택 방 ${i + 1}`, slotCtx(s)])]
  for (const [name, ctx] of rooms)
    it(`${name}: 벽걸이 네 가지를 벽에 걸 수 있고, 바닥에는 걸 수 없다`, () => {
      const walls = hangable(ctx)
      expect(walls.length).toBeGreaterThan(0)
      for (const item of WALL_ITEMS) {
        expect(walls.some((t) => placement([], item, t, undefined, ctx)), item).toBe(true)
        expect(placement([], item, { x: walls[0].x, y: walls[0].y + 1 }, undefined, ctx), item).toBeNull()
      }
    })
})
