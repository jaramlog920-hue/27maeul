// 구약 마을 자산의 호환 내보내기. 옛 공통 집 외관은 삭제하고 현재 그림만 생성한다.
import type { FurnitureArt } from './furniture-art'
import type { Facing } from '../engine/types'
import { BUILDING_LABELS, OLD_VILLAGE_PALETTE as SHARED_PALETTE } from './village-shared-art'
import { BUILDING_ART_PALETTE, BUILDING_FACINGS, completeBuildingArt, constructionBuildingArt } from './newland-building-art'
export { OLD_PROPS, OLD_PROP_LABELS, OLD_JOB_SIGNS, OLD_TERRAIN, OLD_INTERIORS, OLD_INTERIOR_SHELL, BUILDING_LABELS } from './village-shared-art'
// 생활 소품의 기존 색 키를 덮어쓰지 않는다. 건물의 추가 색은 별도 키로 옮긴다.
export const OLD_VILLAGE_PALETTE: Record<string,string> = {...SHARED_PALETTE}
const colorKeys = new Map(Object.entries(OLD_VILLAGE_PALETTE).map(([key,color])=>[color,key]))
function buildingRows(rows:string[]):string[] {
 return rows.map(row=>[...row].map(ch=>{
  if(ch==='.')return ch
  const color=BUILDING_ART_PALETTE[ch]
  let key=colorKeys.get(color)
  if(!key){key=String.fromCharCode(0x400+colorKeys.size);colorKeys.set(color,key);OLD_VILLAGE_PALETTE[key]=color}
  return key
 }).join(''))
}
export const OLD_BUILDINGS: Record<string, Record<Facing, FurnitureArt>> = {}
export const OLD_CONSTRUCTION: typeof OLD_BUILDINGS = {}
for (const id of Object.keys(BUILDING_LABELS)) {
 OLD_BUILDINGS[id] = Object.fromEntries(BUILDING_FACINGS.map(d => [d, {rows:buildingRows(completeBuildingArt(id,d).rows),w:4,h:4}])) as Record<Facing,FurnitureArt>
 OLD_CONSTRUCTION[id] = Object.fromEntries(BUILDING_FACINGS.map(d => [d, {rows:buildingRows(constructionBuildingArt(id,d,'frame').rows),w:4,h:4}])) as Record<Facing,FurnitureArt>
}
