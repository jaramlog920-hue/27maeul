import type {GameState} from '../engine/game'
import type {Animal} from '../engine/companion'
import {STRAY_SPOTS} from '../engine/companion'
import {HOME_DOOR,HOME_FRONT} from '../engine/world'
import {yardSpot,yardPlaced} from '../engine/yard'
import type {Tile} from '../engine/types'

/** Read-only scene data. A preview never adopts a pet, places a rack or changes mail. */
export type HomeYardEventContext={
 mode:'preview'|'game'
 companion:{kind:Animal;name:string}|null
 childPet:Animal|null
 reedRack:Tile
 rackPlaced:boolean
 door:Tile
 front:Tile
 strays:Record<Animal,Tile>
}
type YardState=Pick<GameState,'flags'|'yard'>&{companion:Pick<NonNullable<GameState['companion']>,'kind'|'name'>|null}
export function homeYardEventContext(state?:YardState):HomeYardEventContext{
 const companion=state?state.companion?{kind:state.companion.kind,name:state.companion.name}:null:{kind:'cat' as const,name:'고양이'}
 return {
  mode:state?'game':'preview',companion,
  childPet:state?state.flags.childPet===1?'cat':state.flags.childPet===2?'dog':null:'dog',
  reedRack:{...yardSpot(state??{},'reedRack')},rackPlaced:state?yardPlaced(state.flags,'reedRack'):true,
  door:{...HOME_DOOR},front:{...HOME_FRONT},
  strays:{cat:{...STRAY_SPOTS.cat},dog:{...STRAY_SPOTS.dog}},
 }
}
