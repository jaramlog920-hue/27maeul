import type { GameState, GuestKind } from './game'
import type { Tile } from './types'
import { ROOMS } from './world'

type VisitorGame = Pick<GameState, 'guestbook' | 'clock'> & Partial<Pick<GameState, 'map'>>
export interface LibraryVisitor {
  kind: GuestKind
  at: Tile
  action: 'stand' | 'read' | 'write'
  moving?: boolean
}

/** 그림과 상호작용이 같은 방문 시간·동선을 사용한다. */
export function libraryVisitor(game: VisitorGame): LibraryVisitor | null {
  const entry = game.guestbook?.find(g => g.day === game.clock.day)
  const m = game.clock.minute, room = ROOMS.find(r => r.owner === 'library')!
  if (!entry || m < 9 * 60 || m >= 17 * 60) return null
  const front = { x: room.door.x + 1, y: room.door.y + 1 }
  const away = { x: front.x, y: front.y + 3 }
  const seat = { x: room.x0 + 8, y: room.y0 + 5 }
  const lerp = (a: Tile, b: Tile, k: number): Tile => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })
  const walk = (from: Tile, to: Tile, start: number, len: number): LibraryVisitor => ({ kind: entry.kind, at: lerp(from, to, Math.min(1, (m - start) / len)), action: 'stand', moving: true })
  if (m < 9 * 60 + 20) return walk(away, front, 9 * 60, 20)
  if (m < 10 * 60) return { kind: entry.kind, at: front, action: 'stand' }
  if (m < 10 * 60 + 15) return walk(room.entry, seat, 10 * 60, 15)
  if (m >= 16 * 60 + 40) return walk(front, away, 16 * 60 + 40, 20)
  if (m >= 16 * 60 + 15) return { kind: entry.kind, at: front, action: 'stand' }
  if (m >= 16 * 60) return walk(seat, room.entry, 16 * 60, 15)
  const writing = m < 10 * 60 + 30 || (entry.kind === 'scribe' && m >= 14 * 60 && m < 15 * 60)
  return { kind: entry.kind, at: seat, action: writing ? 'write' : 'read' }
}

export function libraryVisitorTile(game: VisitorGame): Tile | null {
  if (game.map === 'newland') return null
  const v = libraryVisitor(game)
  return v ? { x: Math.round(v.at.x), y: Math.round(v.at.y) } : null
}

export function visitorBeside(game: GameState): boolean {
  const at = libraryVisitorTile(game)
  return !!at && !game.player.path.length &&
    Math.abs(Math.round(game.player.x) - at.x) + Math.abs(Math.round(game.player.y) - at.y) <= 1
}
