import type { GameState, GuestKind } from '../engine/game'
import type { GenPerson } from '../engine/gen'
import { ROOMS, villageTileAt, sameTile, type Room } from '../engine/world'
import { footprint } from '../engine/room'
import type { Tile } from '../engine/types'
import type { VisitorAction } from './village-followup-art'

/** 문·앉는 자리·붙박이·큰 가구와 겹치지 않는 벽 옆 바닥부터 고른다. */
function cradleSpots(room: Room): Tile[] {
  const occupied = new Set(room.decor.flatMap(([dx, dy, item]) => {
    return footprint({ item, x: room.x0 + dx, y: room.y0 + dy }).map(t => `${t.x},${t.y}`)
  }))
  const out: Tile[] = []
  for (let y = room.y0 + 2; y < room.y0 + room.h - 1; y++) for (let x = room.x0 + 1; x < room.x0 + room.w - 1; x++) {
    const t = { x, y }
    if (villageTileAt(x, y) !== 'f' || occupied.has(`${x},${y}`) || sameTile(t, room.sit) || Math.abs(x - room.entry.x) + Math.abs(y - room.entry.y) <= 1) continue
    out.push(t)
  }
  return out.sort((a, b) => Math.min(a.x - room.x0, room.x0 + room.w - 1 - a.x) - Math.min(b.x - room.x0, room.x0 + room.w - 1 - b.x))
}
export function householdBabies(game: Pick<GameState, 'gen' | 'clock'>, room: Room | null): { baby: GenPerson; at: Tile; sleeping: boolean }[] {
  if (!game.gen || !room) return []
  const babies = Object.values(game.gen.households).filter(h => h.home === room.owner).flatMap(h => h.children.map(id => game.gen!.persons[id]).filter((p): p is GenPerson => !!p && p.stage === 'baby' && p.origin === 'born' && p.household === h.id && p.born !== null && p.born <= game.clock.day))
  const spots = cradleSpots(room)
  return babies.slice(0, spots.length).map((baby, i) => ({ baby, at: spots[i], sleeping: game.clock.minute >= 19 * 60 || game.clock.minute < 7 * 60 }))
}
/**
 * 오늘 방명록의 손님만 09–17시. 방문 기록과 별도의 NPC·보상을 만들지 않는다.
 * 드나드는 동선 (2026-10-07 사용자): 09:00–09:20 길에서 문 앞까지 걸어오고, 10:00–10:15 안에서 문깔개→자리,
 * 16:00–16:15 자리→문깔개, 16:40–17:00 문 앞에서 길로 걸어 나간다. 걷는 동안 moving (그림만 — 통행에 끼어들지 않는다)
 */
export function libraryVisitor(game: Pick<GameState, 'guestbook' | 'clock'>): { kind: GuestKind; at: Tile; action: VisitorAction; moving?: boolean } | null {
  const entry = game.guestbook?.find(g => g.day === game.clock.day)
  const m = game.clock.minute, room = ROOMS.find(r => r.owner === 'library')!
  if (!entry || m < 9 * 60 || m >= 17 * 60) return null
  const front = { x: room.door.x + 1, y: room.door.y + 1 }
  const away = { x: front.x, y: front.y + 3 }
  const seat = { x: room.x0 + 8, y: room.y0 + 5 }
  const lerp = (a: Tile, b: Tile, k: number): Tile => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })
  const walk = (from: Tile, to: Tile, start: number, len: number) => ({ kind: entry.kind, at: lerp(from, to, Math.min(1, (m - start) / len)), action: 'stand' as const, moving: true })
  if (m < 9 * 60 + 20) return walk(away, front, 9 * 60, 20)
  if (m < 10 * 60) return { kind: entry.kind, at: front, action: 'stand' }
  if (m < 10 * 60 + 15) return walk(room.entry, seat, 10 * 60, 15)
  if (m >= 16 * 60 + 40) return walk(front, away, 16 * 60 + 40, 20)
  if (m >= 16 * 60 + 15) return { kind: entry.kind, at: front, action: 'stand' }
  if (m >= 16 * 60) return walk(seat, room.entry, 16 * 60, 15)
  const writing = m < 10 * 60 + 30 || (entry.kind === 'scribe' && m >= 14 * 60 && m < 15 * 60)
  return { kind: entry.kind, at: seat, action: writing ? 'write' : 'read' }
}
