import { COPY_FURNITURE, isCopyFurniture } from '../engine/copy-furniture'
import { childMode, childStage } from '../engine/child'
import { childTile, type GameState } from '../engine/game'
import { isGrown } from '../engine/companion'
import type { Tile } from '../engine/types'
import { sizeOf } from '../engine/room'
import type { Facing } from '../engine/types'
import { playerChildAvatar } from './player-child-look'
import type { CopyFurnitureCast } from './copy-furniture-motion'
import { copyFurnitureChildStage } from '../engine/copy-furniture-views'

/** Participants come from this save and this place, never from preview examples. */
export function copyFurnitureCast(game: GameState, spot: Tile & {item:string;facing?:Facing}): CopyFurnitureCast {
  if (!isCopyFurniture(spot.item)) return {}
  const category = COPY_FURNITURE.find(item=>item.id===spot.item)!.category
  const result:CopyFurnitureCast={}
  const size=sizeOf(spot.item,spot.facing)
  const relative=(t:Tile)=>({x:Math.round((t.x-spot.x)*16+8-size.w*8),y:Math.round((t.y+1-spot.y-size.h)*16)})
  const at=childTile(game),c=game.child
  if(c&&at&&!game.child?.left&&Math.abs(at.x-spot.x)+Math.abs(at.y-spot.y)<=1){
    const stage=childStage(c,game.clock.day),mode=childMode(c,game.clock.day)
    const infant=category==='infant'&&stage===copyFurnitureChildStage(spot.item)
    const child=category==='child'&&(stage==='toddler'||stage==='helper')
    if((infant||child)&&mode!=='away'){result.child={avatar:playerChildAvatar(game),stage,dressed:!!game.looks?.child};if(stage!=='baby')result.childFeet=relative(at)}
  }
  const pet=game.companion
  if(category==='pet'&&pet&&!pet.path.length&&Math.abs(pet.x-spot.x)+Math.abs(pet.y-spot.y)<=1&&(pet.map??'village')===(game.map??'village')){result.pet={kind:pet.kind,baby:!isGrown(pet,game.clock.day)};result.petFeet=relative(pet)}
  return result
}
