import type { Tile } from './types'
import type { GameState } from './game'

export const LODGING_DOOR:Tile={x:43,y:24}
/** 외관 그림 위 두 줄은 투명한 잔디 여백이다. 지붕 충돌은 실제 처마가 시작되는 19줄부터. */
export const LODGING_ROOF_TOP = 19
export const LODGING_STAIRS:Tile={x:26,y:129}
export const LODGING_DOWNSTAIRS:Tile={x:26,y:130}
export const LODGING_SEATS:Record<string,Tile>={smith:{x:5,y:144},tilly:{x:8,y:144},shepherd:{x:13,y:144},dexter:{x:16,y:144},presser:{x:21,y:144}}
export const LODGING_CHILD_SEATS:readonly Tile[]=[{x:5,y:150},{x:11,y:150},{x:17,y:150},{x:23,y:150}]
export const LODGING_ANVIL:Tile={x:7,y:125}
export const LODGING_PRESS:Tile={x:25,y:124}
/** 작업대의 플레이어 자리·방문 주민 자리를 따로 둔다. */
export const LODGING_WORK_SPOTS: Record<string, Tile> = {
 smith: { x: 6, y: 125 }, presser: { x: 23, y: 126 },
 rudy: { x: 21, y: 126 }, carpenter: { x: 22, y: 126 },
 basil: { x: 21, y: 127 }, grandpa: { x: 22, y: 127 },
}
/** 공동주택으로 옮긴 옛 작업장 좌표만 보완한다. 행사·다른 장소는 그대로다. */
export function lodgingNpcSpot(npc: string, at: Tile): Tile {
 if(npc==='tilly'&&((at.x===8&&at.y===126)||(at.x===12&&at.y===127)))return {x:8,y:125}
 if(npc==='penelope'&&at.x===40&&at.y===22)return {x:9,y:125}
 if((npc==='smith'||npc==='presser')&&at.x>=41&&at.x<=46&&at.y>=19&&at.y<=24)return LODGING_WORK_SPOTS[npc]
 if(npc==='smith'&&((at.x===7&&at.y===126)||(at.x===42&&at.y===22)))return LODGING_WORK_SPOTS.smith
 if(at.x===22&&at.y===125&&LODGING_WORK_SPOTS[npc])return LODGING_WORK_SPOTS[npc]
 return at
}
export function lodgingChildren(s:Pick<GameState,'gen'|'flags'|'child'>):{id:string;name:string;seat:Tile}[]{
 const list:{id:string;name:string;seat:Tile}[]=[]
 if(s.child?.left&&s.flags['lodging:playerChild'])list.push({id:'playerChild',name:s.child.name,seat:LODGING_CHILD_SEATS[0]})
 for(const p of Object.values(s.gen?.persons??{}).filter(p=>p.origin==='born'&&(p.stage==='adult'||p.stage==='elder')).sort((a,b)=>(a.born??0)-(b.born??0)||a.id.localeCompare(b.id))){
  if(Object.values(s.gen?.retired??{}).some(r=>r.heir===p.id&&r.moved!=null))continue
  const h=p.household?s.gen?.households[p.household]:undefined
  const no=Number(/^h-(\d+)$/.exec(h?.id??'')?.[1]??0)
  if(no&&s.flags[`familyHome:${no}`])continue
  // A married child with an established home keeps that home.
  if(p.spouse&&h&&h.home!==p.id&&!LODGING_SEATS[h.home])continue
  if(list.length===LODGING_CHILD_SEATS.length)break
  list.push({id:p.id,name:p.name??'독립한 자녀',seat:LODGING_CHILD_SEATS[list.length]})
 }
 return list
}
