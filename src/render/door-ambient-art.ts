// 건물/생활 소품 모션 원안. 기존 OLD_BUILDINGS·decor는 수정하지 않는다.
import { OLD_BUILDINGS,OLD_VILLAGE_PALETTE } from './old-village-art'
import type { Facing } from '../engine/types'
import { FURNI_PALETTE } from './furniture-art'
export const DOOR_BUILDINGS=['home','guest','weaver','archive','family'] as const
export const DOOR_FACINGS=['down','left','right'] as const
export const DOOR_ACTIONS=['open','close'] as const
export const DOOR_PALETTE={...OLD_VILLAGE_PALETTE,'@':'#604b3d'}
export function buildingDoorFrame(id:typeof DOOR_BUILDINGS[number],facing:Exclude<Facing,'up'>,action:typeof DOOR_ACTIONS[number],frame:number){
 const f=((frame%4)+4)%4,phase=action==='open'?f:3-f,base=OLD_BUILDINGS[id][facing]
 const back=base.rows.map(r=>[...r]),front=Array.from({length:64},()=>Array<string>(64).fill('.')),dx=facing==='left'?10:facing==='right'?42:27
 for(let y=41;y<58;y++)for(let x=dx+2;x<dx+8;x++)back[y][x]='@'
 const width=[6,4,2,1][phase],rightHinge=facing==='right',x0=rightHinge?dx+8-width:dx+2
 for(let y=41;y<58;y++)for(let x=x0;x<x0+width;x++)front[y][x]=x===x0?'l':'w'
 if(phase===0){front[49][dx+6]='S';front[50][dx+6]='S'}
 const rows=back.map((r,y)=>r.map((c,x)=>front[y][x]==='.'?c:front[y][x]).join(''))
 // 닫힌 끝 상태는 원본과 정확히 같다.
 if(phase===0)for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(back[y][x]==='@')front[y][x]=base.rows[y][x]
 return {rows:phase===0?base.rows:rows,back:back.map(r=>r.join('')),front:front.map(r=>r.join('')),anchor:{x:32,y:64},entry:{x:facing==='left'?15:facing==='right'?47:32,y:60},duration:180,loop:false}
}
export const AMBIENT_ACTIONS=['lampFlame','reedSway'] as const
export const AMBIENT_LABELS={lampFlame:'등잔 불꽃',reedSway:'갈대 말리는 틀 흔들림'}
export const AMBIENT_PALETTE={...FURNI_PALETTE,a:'#ddd188',A:'#bfb964',t:'#ae8060',T:'#816044'}
export function ambientDetailRows(action:typeof AMBIENT_ACTIONS[number],frame:number){
 const p=Array.from({length:16},()=>Array<string>(16).fill('.')),f=((frame%4)+4)%4
 const rect=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c}
 if(action==='lampFlame'){
  rect(3,11,10,2,'r');rect(4,13,8,1,'R');rect(4,10,8,1,'l');rect(7,8,2,3,'W')
  const x=7+[0,1,0,-1][f];rect(x,3+f%2,2,5-f%2,'y');rect(x,5,1,3,'Y');rect(x-1,6,4,2,'y');rect(x,6,2,2,'Y')
 }else{
  rect(2,2,2,13,'T');rect(12,2,2,13,'T');rect(1,2,14,2,'t');rect(2,10,12,2,'t')
  for(const [x,len,c]of [[4,7,'a'],[7,8,'A'],[10,7,'a']] as const){rect(x,4,2,3,c);const offset=[0,1,0,-1][f];rect(x+offset,7,2,len-3,c);rect(x+offset,7,1,len-3,'a')}
 }
 return p.map(r=>r.join(''))
}
