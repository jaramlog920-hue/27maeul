import type { GameState } from './game'
import type { Furniture, RoomCtx } from './room'
import { FURNITURE_DEFS, isFacing, solidTiles } from './room'
import type { ItemId } from './types'
import { isHome, sameTile } from './world'
import { inOutdoorBounds, outdoorGround, OUTDOOR_ENTRY, PERMANENT_GARDEN, isPermanentGarden } from './outdoor-layout'
import { YARD_ITEMS, yardPlaced, yardSpot } from './yard'

export interface OutdoorPiece extends Furniture { id:string }
export interface OutdoorState { version:1; nextId:number; placements:OutdoorPiece[] }
export const OUTDOOR_KEY = 'outdoor:home'
export const OUTDOOR_ITEMS: readonly ItemId[] = ['stool','chair','longBench','table','nightstand','cushion','mat','rug','roundRug','pot','bigPlant','vase','basket','jar','candle','lantern','lampStand','bowl','bird','shell','teapot','fruitBowl','dryFlowers']
export const isOutdoorItem = (item:ItemId) => OUTDOOR_ITEMS.includes(item)
type Where = Pick<GameState,'player'> & Partial<Pick<GameState,'map'|'outdoor'|'garden'|'flags'|'yard'|'npcs'>>
export const isOutdoorEditing = (s:Where) => s.map!=='newland'&&!isHome(s.player)&&inOutdoorBounds({x:Math.round(s.player.x),y:Math.round(s.player.y)})
export const outdoorFurniture = (s:Partial<Pick<GameState,'outdoor'>>):readonly OutdoorPiece[] => s.outdoor?.placements??[]
export const outdoorBlockers = (s:Partial<Pick<GameState,'outdoor'>>) => solidTiles(outdoorFurniture(s))
export const outdoorInUse = (s:Partial<Pick<GameState,'furnitureAuto'>>,f:Furniture) => Object.values(s.furnitureAuto??{}).some(a=>a.phase!=='cooldown'&&a.furniture.item===f.item&&sameTile(a.furniture,f))

export function outdoorContext(s:Where):RoomCtx {
 const tools = YARD_ITEMS.filter(i=>yardPlaced(s.flags??{},i)).map(i=>yardSpot(s,i))
 const crops = Object.keys(s.garden??{}).map(k=>{const [x,y]=k.split(',').map(Number);return {x,y}})
 const clear=[OUTDOOR_ENTRY,{x:6,y:8},...PERMANENT_GARDEN,...crops]
 const here={x:Math.round(s.player.x),y:Math.round(s.player.y)}
 const actors=Object.values(s.npcs??{}).filter(n=>n.visible&&inOutdoorBounds(n)).map(n=>({x:Math.round(n.x),y:Math.round(n.y)}))
 return {
  isFloor:t=>outdoorGround(t)&&!isPermanentGarden(t)&&!crops.some(p=>sameTile(p,t))&&!tools.some(p=>sameTile(p,t)),
  inside:outdoorGround,
  keepClear:()=>[...clear,here,...actors], entry:OUTDOOR_ENTRY,
  reach:[...clear,here,...actors].filter(outdoorGround), hangingWall:()=>false,
 }
}
export function withOutdoor<T extends Partial<Pick<GameState,'outdoor'|'furnitureAuto'|'act'|'npcs'|'player'|'target'>>>(s:T,room:readonly Furniture[]):T {
 let nextId=s.outdoor?.nextId??1
 const placements=room.map(f=>({...f,id:'id' in f&&typeof f.id==='string'?f.id:`yard-${nextId++}`}))
 // 고친 가구는 다른 사람이 쓰기 전에 쓰던 사람·자리 예약을 먼저 비운다
 const npcs=s.npcs&&Object.fromEntries(Object.entries(s.npcs).map(([id,n])=>[id,{...n,path:[]}]))
 return {...s,outdoor:{version:1,nextId,placements},furnitureAuto:{},act:undefined,target:null,
  ...(s.player?{player:{...s.player,path:[]}}:{}),...(npcs?{npcs}:{})}
}
export function sanitizeOutdoor(raw:unknown):OutdoorState|undefined {
 if(!raw||typeof raw!=='object')return undefined
 const r=raw as Partial<OutdoorState>
 if(r.version!==1||!Array.isArray(r.placements))return undefined
 const used=new Set<string>(), placements:OutdoorPiece[]=[]
 let nextId=Number.isInteger(r.nextId)&&r.nextId!>0?r.nextId!:1
 for(const f of r.placements){
  if(!f||!isOutdoorItem(f.item)||!FURNITURE_DEFS[f.item]||!Number.isInteger(f.x)||!Number.isInteger(f.y))continue
  const p:OutdoorPiece={item:f.item,x:f.x,y:f.y,id:typeof f.id==='string'&&/^yard-\d+$/.test(f.id)?f.id:`yard-${nextId++}`,
   ...(isFacing(f.facing)?{facing:f.facing}:{}),...(f.on?{on:true}:{}),...(typeof f.finish==='string'?{finish:f.finish}:{})}
  if(used.has(p.id))p.id=`yard-${nextId++}`
  used.add(p.id);nextId=Math.max(nextId,Number(p.id.slice(5))+1)
  placements.push(p)
 }
 return {version:1,nextId,placements}
}
