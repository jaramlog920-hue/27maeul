import { footprint, facingOf, solidTiles, type Furniture } from './room'
import { findPath } from './movement'
import { ATTIC, HOME_ENTRY, SIDE_ROOM, inAttic, isHome, isWalkable, key, sameTile } from './world'
import type { Tile } from './types'

export type SpaceUse = 'tea' | 'craft' | 'family' | 'pet' | 'read'
export interface HomeSpace { id: string; use: SpaceUse; furniture: string[]; at: Tile; name?: string }
export const SPACES_PER_ROOM = 3
export const SPACE_USES: readonly SpaceUse[] = ['tea', 'craft', 'family', 'pet', 'read']
export const furnitureId = (f: Furniture) => `${f.item}:${f.x}:${f.y}`
const section = (t: Tile) => inAttic(t) ? 'attic' : t.x >= SIDE_ROOM.x0 ? 'side' : 'main'
const seating = (f: Furniture) => ['chair', 'stool', 'longBench', 'daybed', 'cushion', 'pillows', 'mat'].includes(f.item)
const table = (f: Furniture) => ['table', 'nightstand'].includes(f.item)
const nearFurniture = (a: Furniture, b: Furniture) => footprint(a).some(t => footprint(b).some(p => Math.abs(t.x-p.x)+Math.abs(t.y-p.y) <= 2))

/** 현재 가구로 가능한 쓰임만 제안한다. */
export function usesFor(room: readonly Furniture[], anchor: Furniture): SpaceUse[] {
  if (!room.some(f => furnitureId(f) === furnitureId(anchor)) || !isHome(anchor)) return []
  const nearby = room.filter(f => nearFurniture(anchor, f))
  const chair = nearby.find(seating), surface = nearby.find(table)
  return [
    ...(chair && surface ? ['tea' as const, 'craft' as const] : []),
    ...(chair ? ['family' as const, 'read' as const] : []),
    ...(nearby.some(f => ['cushion','pillows','mat','rug','roundRug'].includes(f.item)) ? ['pet' as const] : []),
  ]
}
export function spaceFurniture(room: readonly Furniture[], s: HomeSpace): Furniture[] {
  return s.furniture.flatMap(id => { const f=room.find(f => furnitureId(f)===id); return f ? [f] : [] })
}
export function spaceReady(room: readonly Furniture[], s: HomeSpace): boolean {
  const fs=spaceFurniture(room,s)
  if (fs.length!==s.furniture.length || !fs.length || !isHome(s.at)) return false
  const anchor=fs.find(f=>sameTile(f,s.at))
  if (!anchor || !usesFor(fs,anchor).includes(s.use)) return false
  const blocked=solidTiles(room)
  return fs.filter(seating).some(f=>seatStand(f,blocked)!==null) || s.use==='pet' && isWalkable(s.at,blocked)
}
/** 앉을 곳까지 걸어갈 수 있는 바닥. 가구 앞쪽을 먼저 고른다. */
export function seatStand(f: Furniture, blocked: ReadonlySet<string>): Tile | null {
  const dirs = { down: [0,1], up:[0,-1], left:[-1,0], right:[1,0] }
  const [dx,dy]=dirs[facingOf(f)]
  const choices=[{x:f.x+dx,y:f.y+dy}, ...footprint(f).flatMap(t=>[{x:t.x-1,y:t.y},{x:t.x+1,y:t.y},{x:t.x,y:t.y-1},{x:t.x,y:t.y+1}])]
  return choices.find(t=>isHome(t) && isWalkable(t,blocked) && findPath(inAttic(t)?ATTIC.entry:HOME_ENTRY,t,blocked)) ?? null
}
export function designateSpace(room: readonly Furniture[], spaces: readonly HomeSpace[], anchor: Furniture, use: SpaceUse): HomeSpace[] | null {
  if (!usesFor(room,anchor).includes(use)) return null
  const fs=room.filter(f=>nearFurniture(anchor,f))
  const id=`space:${furnitureId(anchor)}`
  if (spaces.filter(s=>s.id!==id && section(s.at)===section(anchor)).length>=SPACES_PER_ROOM) return null
  const s:HomeSpace={id,use,at:{x:anchor.x,y:anchor.y},furniture:fs.map(furnitureId)}
  if (!spaceReady(room,s)) return null
  return [...spaces.filter(s=>s.id!==id),s]
}
export function sanitizeSpaces(raw: unknown, room: readonly Furniture[]): HomeSpace[] {
  if (!Array.isArray(raw)) return []
  const out:HomeSpace[]=[]
  for (const s of raw) {
    if (!s || typeof s.id!=='string' || !SPACE_USES.includes(s.use) || !s.at || !Number.isInteger(s.at.x) || !Number.isInteger(s.at.y) || !Array.isArray(s.furniture) || s.furniture.some((v:unknown)=>typeof v!=='string')) continue
    const space:HomeSpace={id:s.id,use:s.use,at:{x:s.at.x,y:s.at.y},furniture:[...new Set<string>(s.furniture)],...(typeof s.name==='string'?{name:s.name.slice(0,20)}:{})}
    if (!out.some(p=>p.id===space.id) && out.filter(p=>section(p.at)===section(space.at)).length<SPACES_PER_ROOM && spaceReady(room,space)) out.push(space)
  }
  return out
}
/** 이용자 자리는 그때 계산한다. 저장하지 않는다. */
export function reserveSeats(room:readonly Furniture[], s:HomeSpace, users:readonly string[], occupied:ReadonlySet<string>=new Set()): Record<string,{at:Tile;stand:Tile}> {
  if (!spaceReady(room,s)) return {}
  const seats=spaceFurniture(room,s).filter(seating), taken=new Set(occupied), out:Record<string,{at:Tile;stand:Tile}>={}
  for (const who of [...new Set(users)]) {
    for (const seat of seats) {
      const stand=seatStand(seat,new Set([...solidTiles(room),...taken]))
      if (!stand || taken.has(key(seat))) continue
      out[who]={at:{x:seat.x,y:seat.y},stand}; taken.add(key(seat)); taken.add(key(stand)); break
    }
  }
  return out
}
