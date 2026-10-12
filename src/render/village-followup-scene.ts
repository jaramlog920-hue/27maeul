import type { GameState } from '../engine/game'
import { bakerBabyAt, BAKER_BABY_ID, type GenPerson } from '../engine/gen'
import { villageTileAt, sameTile, type Room } from '../engine/world'
import { footprint } from '../engine/room'
import type { Tile } from '../engine/types'
export { libraryVisitor } from '../engine/library-visitor'

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
type NurseryGame = Pick<GameState, 'gen' | 'clock'> & Partial<Pick<GameState, 'flags'>>
export function householdCradles(game: NurseryGame, room: Room | null): { baby: GenPerson | null; at: Tile; sleeping: boolean }[] {
  if (!room) return []
  const babies = Object.values(game.gen?.households ?? {}).filter(h => h.home === room.owner).flatMap(h => h.children.map(id => game.gen!.persons[id]).filter((p): p is GenPerson => !!p && p.stage === 'baby' && p.origin === 'born' && p.household === h.id && p.born !== null && p.born <= game.clock.day))
  const bakerBaby = room.owner === 'baker' && game.flags?.bakerCribGiven ? bakerBabyAt(game.clock.day, game.gen?.persons[BAKER_BABY_ID]) : null
  const spots = cradleSpots(room)
  const occupants: (GenPerson | null)[] = room.owner === 'baker' && game.flags?.bakerCribGiven ? [bakerBaby?.stage === 'baby' ? bakerBaby : null, ...babies] : babies
  return occupants.slice(0, spots.length).map((baby, i) => ({ baby, at: spots[i], sleeping: game.clock.minute >= 19 * 60 || game.clock.minute < 7 * 60 }))
}
export function householdBabies(game: NurseryGame, room: Room | null): { baby: GenPerson; at: Tile; sleeping: boolean }[] {
  return householdCradles(game, room).filter((c): c is typeof c & { baby: GenPerson } => c.baby !== null)
}
/** 침대를 받기 전에도 아기는 부모를 따라다니지 않고 집 안의 한 자리에 머문다. */
export function bakerInfantAtHome(game: NurseryGame, room: Room | null): { baby: GenPerson; at: Tile } | null {
  if (room?.owner !== 'baker' || game.flags?.bakerCribGiven) return null
  const baby = bakerBabyAt(game.clock.day, game.gen?.persons[BAKER_BABY_ID])
  const at = cradleSpots(room)[0]
  return baby?.stage === 'baby' && at ? { baby, at } : null
}
