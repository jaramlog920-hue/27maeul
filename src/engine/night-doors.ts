import { notYet, type GameState } from './game'
import { sharedHomeOf } from './gen-homes'
import { LODGING_SEATS } from './lodging'
import { buildsOf, doorOf } from './newland-build'
import type { GameContent, Tile } from './types'
import { ROOMS, roomAt, sameTile } from './world'

/** 밤에 주민이 모두 귀가한 집의 입구를 잠근다. 방 안에서 나오는 문은 잠그지 않는다. */
export function nightDoorLocked(s: GameState, door: Tile, content: Pick<GameContent, 'neighbors'>): boolean {
  const m = s.clock.minute
  if (m >= 6 * 60 && m < 21 * 60) return false
  if (s.map === 'newland') {
    const home = buildsOf(s).find(b => b.kind === 'home' && b.state === 'done' && sameTile(doorOf(b.kind, b.x, b.y, b.facing)?.door ?? { x: -1, y: -1 }, door))
    if (!home) return false
    const no = Number(home.id.slice(1))
    return Object.entries(s.flags).some(([key, value]) => (key.startsWith('settled:') || key.startsWith('familyHome:')) && value === no)
  }
  const room = ROOMS.find(r => sameTile(r.door, door))
  if (!room) return false
  const hasRoom = (id: string) => !!LODGING_SEATS[id] || ROOMS.some(r => r.owner === id)
  const residents = content.neighbors.filter(d => {
    if (notYet(d, s.flags.villageLevel ?? 0, s.flags)) return false
    if (s.romance?.stage === 'married' && s.romance.partner === d.id) return false
    const owner = sharedHomeOf(s.gen, d.id, hasRoom) ?? d.id
    return (LODGING_SEATS[owner] ? 'lodging' : owner) === (room.owner === 'lodgingUpper' ? 'lodging' : room.owner)
  })
  return residents.length > 0 && residents.every(d => {
    const npc = s.npcs[d.id]
    if (!npc) return false
    if (!npc.visible) return true
    const at = roomAt({ x: Math.round(npc.x), y: Math.round(npc.y) })
    return !!at && (at.owner === room.owner || ((room.owner === 'lodging' || room.owner === 'lodgingUpper') && at.owner.startsWith('lodging')))
  })
}

export function nightDoorKeys(s: GameState, content: Pick<GameContent, 'neighbors'>): string[] {
  const doors = s.map === 'newland' ? buildsOf(s).flatMap(b => { const d = doorOf(b.kind, b.x, b.y, b.facing); return d ? [d.door] : [] }) : ROOMS.map(r => r.door)
  return doors.filter(d => nightDoorLocked(s, d, content)).map(d => `${d.x},${d.y}`)
}
