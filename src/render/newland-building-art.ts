// 구약맵 현재 건물 그림. 지도·아이콘·이벤트·공사 미리보기가 같은 원본을 사용한다.
import type { Facing } from '../engine/types'
import { OLD_PROPS,OLD_VILLAGE_PALETTE,BUILDING_LABELS } from './village-shared-art'
import { drawNewlandHouse } from './newland-house-art'
import { drawLibraryExterior } from './house-exterior-art'
import { OT_LIBRARY_ROOF } from './library-roof-palette'
import type { FurnitureArt } from './furniture-art'
import { settlementBuildingDetails } from './settlement-building-details'

export const PROFESSION_BUILDINGS=['cook','painter','weaver','gardener','potter','instrumentMaker','carpenter','baker','scribe','scholar','woodworker','shipwright','teaKeeper','merchant','fisher','sailor','herbalist','traveler'] as const
export type ProfessionBuilding=typeof PROFESSION_BUILDINGS[number]
export const BUILDING_FACINGS=['down','up','left','right'] as const
export const CONSTRUCTION_STAGES=['foundation','frame','roof'] as const
export type ConstructionStage=typeof CONSTRUCTION_STAGES[number]
export const BUILDING_ART_PALETTE:Record<string,string>={...OLD_VILLAGE_PALETTE,J:'#6f5140',P:'#ead7b2',q:'#bda367',n:'#79989b',N:'#4f6b75',v:'#b292a2',V:'#856f89'}
/** 직업별 별도 지붕·벽 외관은 폐기했다. 신약 마을 주택과 같은 원본만 사용한다. */
export const PROFESSION_STYLES=Object.fromEntries(PROFESSION_BUILDINGS.map(job=>[job,{note:BUILDING_LABELS[job]+' · 신약 마을 주택 외관'}])) as Record<ProfessionBuilding,{note:string}>
function grid(w=64,h=64){
 const p=Array.from({length:h},()=>Array<string>(w).fill('.'))
 const dot=(x:number,y:number,c:string)=>{if(p[y]?.[x]!==undefined)p[y][x]=c}
 const rect=(x:number,y:number,ww:number,hh:number,c:string)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)dot(xx,yy,c)}
 const line=(x0:number,y0:number,x1:number,y1:number,c:string)=>{const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;for(;;){dot(x0,y0,c);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}}
 const paste=(rows:readonly string[],x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.')dot(x+xx,y+yy,c)}))
 return {p,dot,rect,line,paste,rows:()=>p.map(r=>r.join(''))}
}
export function buildingEntry(d:Facing){return d==='up'?null:{x:d==='left'?15:d==='right'?47:32,y:60}}
function layers(rows:string[],d:Facing){return {rows,back:rows.map((r,y)=>y<55?r:'.'.repeat(64)),front:rows.map((r,y)=>y>=55?r:'.'.repeat(64)),width:64,height:64,palette:BUILDING_ART_PALETTE,anchor:{x:32,y:60},entry:buildingEntry(d),footprint:{w:4,h:3,dy:1}}}

/** 건물과 별도로 놓을 수 있는 16×16 야외 작업 소품. */
export function professionWorkPropRows(job:ProfessionBuilding){
 const b=grid(16,16),r=b.rect
 const table=()=>{r(1,10,14,3,'w');r(2,13,2,3,'W');r(12,13,2,3,'W');r(1,10,14,1,'l')}
 switch(job){
  case 'cook':table();r(3,5,8,5,'J');r(4,4,6,1,'S');r(2,6,1,2,'S');r(11,6,1,2,'S');r(5,3,4,1,'l');r(12,7,3,3,'g');b.dot(13,6,'G');break
  case 'painter':r(3,1,10,10,'W');r(4,2,8,8,'P');r(5,6,3,3,'g');r(8,4,3,4,'v');r(6,3,2,2,'p');b.line(5,11,2,15,'W');b.line(10,11,13,15,'W');r(2,11,12,1,'l');break
  case 'weaver':r(1,1,2,15,'W');r(13,1,2,15,'W');r(2,2,12,2,'l');r(3,5,10,8,'b');for(let x=4;x<13;x+=2)r(x,5,1,8,'B');for(const y of [7,10])r(3,y,10,1,'p');r(2,13,12,2,'W');break
  case 'gardener':r(1,10,14,5,'w');r(2,11,12,2,'I');for(const [x,c]of [[3,'p'],[7,'y'],[11,'v']] as const){r(x,5,1,6,'g');r(x-1,4,3,2,c);b.dot(x,4,'c');b.dot(x+1,7,'G')}break
  case 'potter':table();r(3,3,4,2,'R');r(2,5,6,5,'r');r(3,6,1,3,'p');r(10,6,3,1,'R');r(9,7,5,3,'r');r(10,8,1,1,'p');break
  case 'instrumentMaker':r(2,1,12,2,'W');r(3,3,2,10,'w');r(11,3,2,10,'w');r(4,12,8,2,'W');for(const x of [6,8,10])r(x,3,1,9,'q');r(2,14,12,1,'l');break
  case 'carpenter':table();r(1,7,14,3,'l');r(2,8,12,1,'w');r(9,3,2,5,'J');r(5,4,6,2,'S');for(const x of [5,7,9])b.dot(x,6,'s');break
  case 'baker':r(1,5,14,10,'I');r(2,3,12,2,'H');r(4,1,8,2,'H');r(4,7,8,6,'J');r(5,7,6,2,'W');r(5,11,6,2,'C');r(6,10,4,1,'l');for(const x of [2,7,12])r(x,5,1,2,'h');break
  case 'scribe':table();r(3,5,9,4,'P');r(2,5,2,4,'C');r(11,5,2,4,'C');r(4,6,6,1,'q');r(13,6,2,3,'J');b.line(13,6,15,2,'W');break
  case 'scholar':r(1,1,14,14,'W');r(2,2,12,12,'w');for(const [i,c]of ['C','n','v','p'].entries()){r(3+i*3,3,2,4,c);r(3+i*3,10,2,3,c)}r(2,8,12,1,'l');break
  case 'woodworker':for(const [x,y,h]of [[2,1,12],[5,3,10],[8,2,11]]){r(x,y,2,h,'w');r(x,y,1,h,'l')}for(const y of [12,14])r(1,y,14,2,'W');r(2,13,12,1,'l');break
  case 'shipwright':r(0,7,16,2,'W');r(1,9,14,2,'w');r(3,11,10,2,'l');r(5,13,6,1,'W');r(3,14,2,2,'W');r(11,14,2,2,'W');for(const x of [3,7,11])r(x,5,1,5,'I');break
  case 'teaKeeper':table();r(4,4,7,6,'C');r(5,3,5,1,'W');r(11,5,2,3,'w');b.dot(12,6,'C');r(1,6,3,2,'C');r(12,8,3,2,'P');break
  case 'merchant':table();for(const [x,y,c]of [[2,6,'v'],[6,4,'b'],[10,6,'p']] as const){r(x,y,4,10-y,'W');r(x+1,y+1,2,8-y,c)}break
  case 'fisher':r(1,1,2,15,'W');r(13,1,2,15,'W');r(2,2,12,2,'l');for(const x of [4,7,10])r(x,4,1,8,'S');for(const y of [5,8,11])r(3,y,10,1,'S');r(7,7,4,2,'a');b.dot(6,7,'A');break
  case 'sailor':table();r(2,3,7,7,'q');r(3,4,5,5,'P');r(4,5,3,3,'q');b.dot(5,6,'P');r(11,1,2,8,'S');r(9,7,6,2,'S');r(10,9,4,1,'S');break
  case 'herbalist':r(1,2,14,2,'W');r(2,4,1,12,'W');r(13,4,1,12,'W');for(const x of [5,10]){r(x,4,1,7,'q');r(x-1,6,3,4,'g');b.dot(x,10,'G');b.dot(x-1,7,'G')}break
  case 'traveler':table();r(4,2,8,2,'w');r(3,4,10,6,'W');r(4,5,8,4,'P');r(6,6,4,3,'w');r(1,1,1,12,'J');r(1,1,3,1,'J');break
 }
 return b.rows()
}
/** 직업 표시는 메뉴에서만 한다. 외관에는 별도 소품을 붙이지 않는다. */
export function professionBuildingArt(job:ProfessionBuilding,d:Facing){
 return {...layers(nativeBuildingRows('home',d),d),job,integratedWorkProp:false,style:PROFESSION_STYLES[job]}
}

/** 승인된 주택·서고의 색을 정수 좌표 도트로 변환한다. DOM/canvas가 없어도 같은 원본이다. */
function nativeBuildingRows(id:string,d:Facing){
 const b=grid(), colors=new Map(Object.entries(BUILDING_ART_PALETTE).map(([key,color])=>[color,key]))
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){
  let key=colors.get(this.fillStyle)
  if(!key){key=String.fromCharCode(0x100+colors.size);colors.set(this.fillStyle,key);BUILDING_ART_PALETTE[key]=this.fillStyle}
  b.rect(x,y,w,h,key)
 }} as CanvasRenderingContext2D
 if(id==='archive')drawLibraryExterior(g,{x0:0,y0:0,x1:3,y1:3,doorX:2},OT_LIBRARY_ROOF)
 else drawNewlandHouse(g,id==='guest'?'guest':id==='gallery'?'gallery':'home',d)
 return b.rows()
}
/** 이전 공통 벽돌집/삼각지붕 생성기는 제거했다. 옛 저장도 현재 외관을 사용한다. */
export function completeBuildingArt(id:string,d:Facing):FurnitureArt {
 if((PROFESSION_BUILDINGS as readonly string[]).includes(id)){const a=professionBuildingArt(id as ProfessionBuilding,d);return {w:4,h:4,rows:a.rows}}
 if(id==='courtyard'||id==='garden'){
  const b=grid();b.rect(3,35,58,26,'U');b.rect(5,37,54,22,'u');b.rect(3,51,58,3,'w')
  for(const x of [4,58])b.rect(x,37,2,24,'W')
  for(const x of [7,46])b.rect(x,30,12,10,'g')
  for(const x of [9,50])b.rect(x,32,3,2,'p')
  b.paste((id==='garden'?OLD_PROPS.memoryMarker:OLD_PROPS.courtyardBench).rows,id==='garden'?25:16,40)
  return settlementBuildingDetails({w:4,h:4,rows:b.rows()},id,d)
 }
 if(!BUILDING_LABELS[id])throw new Error(`없는 건물: ${id}`)
 return {w:4,h:4,rows:nativeBuildingRows(id,d)}
}

/** 완공 전 3단계. 문 좌표는 계획만 반환하며 공사 그림은 출입구로 연결하지 않는다. */
export function constructionBuildingArt(id:string,d:Facing,stage:ConstructionStage){
 if(!BUILDING_LABELS[id])throw new Error(`없는 건물: ${id}`)
 const b=grid(),r=b.rect,open=id==='garden'||id==='courtyard'
 r(5,59,54,3,'z');r(7,53,50,7,'U');r(9,54,46,4,'I');r(9,54,46,1,'u')
 for(const x of [8,53]){r(x,47,2,12,'W');r(x,47,1,9,'l')}
 if(stage==='foundation'){
  for(let x=12;x<52;x+=9){r(x,50,7,3,'s');r(x,50,6,1,'u')}
  r(18,43,11,5,'s');r(19,43,9,1,'u');r(35,46,12,3,'w');r(35,46,12,1,'l')
 }else if(open){
  r(5,37,2,22,'W');r(57,37,2,22,'W');r(5,38,54,2,'w');r(5,49,54,2,'w')
  if(stage==='roof'){r(8,41,48,17,'u');for(let x=10;x<56;x+=8)r(x,42,1,15,'I');r(8,50,48,1,'I');r(11,32,10,8,'g');r(43,33,10,8,'g');r(13,34,2,2,'p');r(47,35,2,2,'p')}
 }else{
  for(const x of [10,30,52]){r(x,24,2,35,'W');r(x,24,1,30,'l')}
  r(10,23,44,3,'w');r(10,36,44,2,'w');b.line(12,28,28,44,'l');b.line(50,28,34,44,'l')
  const dx=d==='left'?10:d==='right'?42:27
  if(d!=='up'){r(dx,39,2,20,'W');r(dx+8,39,2,20,'W');r(dx,38,10,2,'w')}
  if(stage==='roof'){
   r(8,44,48,10,'I');for(const y of [46,50]){r(9,y,46,1,'i');for(let x=14;x<54;x+=10)r(x,y+1,1,3,'i')}
   const rows=completeBuildingArt(id,d).rows;for(let y=0;y<29;y++)for(let x=0;x<64;x++)b.dot(x,y,rows[y][x])
   // 지붕 한쪽은 아직 덮지 않은 서까래로 남긴다.
   r(21,18,9,7,'W');for(const x of [22,25,28])r(x,18,1,7,'l')
   if(d!=='up'){r(dx+2,41,6,17,'J');r(dx,39,10,2,'W')}
  }
 }
 r(18,55,11,3,'w');r(19,55,9,1,'l');r(36,53,12,5,'s');r(37,53,10,1,'u')
 const a=layers(b.rows(),d)
 return {...a,entry:null,plannedEntry:open?null:buildingEntry(d),footprint:open?{w:4,h:4,dy:0}:a.footprint,id,stage,label:stage==='foundation'?'기초 놓기':stage==='frame'?'기둥·들보 세우기':open?'바닥·울타리 마감':'지붕 얹기',complete:false}
}
export const CONSTRUCTION_BUILDINGS=Object.keys(BUILDING_LABELS)
