import type { Tile } from './types'
import { HOUSE_RECT, HOME_EXTERIOR_ADDITIONS, HOME_FRONT, baseVillageTileAt } from './world'

export const PERMANENT_GARDEN: readonly Tile[] = [{x:11,y:4},{x:12,y:4},{x:11,y:5},{x:12,y:5}]
export const LEGACY_GARDEN: readonly Tile[] = [4,5,6].flatMap(y=>[11,12,13,14].map(x=>({x,y})))
export const isPermanentGarden = (t:Tile) => PERMANENT_GARDEN.some(p=>p.x===t.x&&p.y===t.y)
export const inOutdoorBounds = (t:Tile) => Number.isInteger(t.x)&&Number.isInteger(t.y)&&t.x>=1&&t.x<=17&&t.y>=1&&t.y<=8
export function outdoorGround(t:Tile):boolean {
 if(!inOutdoorBounds(t))return false
 if([HOUSE_RECT,...HOME_EXTERIOR_ADDITIONS].some(r=>t.x>=r.x0&&t.x<=r.x1&&t.y>=r.y0&&t.y<=r.y1))return false
 return ['.','*',',','l'].includes(baseVillageTileAt(t.x,t.y))
}
export const OUTDOOR_ENTRY = HOME_FRONT
