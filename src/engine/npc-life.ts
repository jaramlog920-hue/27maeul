// 주민의 짧은 산책: 시간표·일터는 중심으로 남기고, 주변을 살피다 돌아온다.
import { genRng } from './gen'
import { key, PLACES, roomAt, isHome, isWalkable, WARPS } from './world'
import type { Tile } from './types'

export const WANDER_SLOT = 16
const DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
const RESERVED = new Set(Object.values(PLACES).flatMap(p => p.stand ? [key(p.stand)] : []))

/**
 * 방 안에서 이 칸에 서 있으면 방의 다른 바닥이 문으로 나갈 길을 잃는가 (외길 통로).
 * 찻집 탁자 사이 한 칸에 주인이 서서 쉬면 안의 이웃이 30분 넘게 갇혔다 (2026-10-13 자동 점검). 이웃 방은 바뀌지 않으므로 칸마다 한 번만 따진다
 */
const chokeMemo = new Map<string, boolean>()
function blocksRoomExit(at: Tile): boolean {
  const room = roomAt(at)
  if (!room || isHome(at)) return false
  const k = key(at)
  const hit = chokeMemo.get(k)
  if (hit !== undefined) return hit
  const floor: Tile[] = [], doors: Tile[] = []
  for (let y = room.y0; y < room.y0 + room.h; y++) for (let x = room.x0; x < room.x0 + room.w; x++) {
    const t = { x, y }
    if (!isWalkable(t) || key(t) === k) continue
    if (WARPS.has(key(t))) doors.push(t)
    else floor.push(t)
  }
  const seen = new Set(doors.map(key)), queue = [...doors]
  for (let i = 0; i < queue.length; i++) for (const d of DIRS) {
    const to = { x: queue[i].x + d.x, y: queue[i].y + d.y }, tk = key(to)
    if (seen.has(tk) || tk === k || !isWalkable(to) || roomAt(to) !== room) continue
    seen.add(tk)
    queue.push(to)
  }
  const cut = doors.length > 0 && floor.some((t) => !seen.has(key(t)))
  chokeMemo.set(k, cut)
  return cut
}

/** 두 칸 안의 연결된 바닥만 고른다. 문·다른 방·플레이어 작업 칸·이미 점유한 칸·방의 외길 통로는 피한다. */
export function wanderGoal(npc: string, anchor: Tile, seed: number, day: number, minute: number, blocked: ReadonlySet<string>, occupied: ReadonlySet<string>): Tile {
  const phase = genRng(seed, 'wanderPhase', [npc], day)()
  const slot = Math.floor((minute + phase * WANDER_SLOT) / WANDER_SLOT)
  const hereRoom = roomAt(anchor), home = isHome(anchor)
  const seen = new Set([key(anchor)]), queue = [{ at: anchor, depth: 0 }]
  const choices: Tile[] = []
  for (let i = 0; i < queue.length; i++) {
    const { at, depth } = queue[i]
    if (depth > 0 && !RESERVED.has(key(at)) && !blocksRoomExit(at)) choices.push(at)
    if (depth >= 2) continue
    for (const d of DIRS) {
      const to = { x: at.x + d.x, y: at.y + d.y }, k = key(to)
      if (seen.has(k) || WARPS.has(k) || !isWalkable(to, blocked) || roomAt(to) !== hereRoom || isHome(to) !== home) continue
      seen.add(k)
      queue.push({ at: to, depth: depth + 1 })
    }
  }
  // 매 세 번 중 한 번은 일터로 돌아와 머문다. 나머지는 주민마다 다른 주변 자리.
  if (slot % 3 === 0 && !RESERVED.has(key(anchor)) && !occupied.has(key(anchor))) return anchor
  if (!choices.length) return anchor
  const start = Math.floor(genRng(seed, 'wander', [npc], day * 1000 + slot)() * choices.length)
  for (let i = 0; i < choices.length; i++) {
    const candidate = choices[(start + i) % choices.length]
    if (!occupied.has(key(candidate))) return candidate
  }
  return anchor
}
