// 구약맵 도트 자산. 기존 건물·공사 판정·일과·저장 상태는 연결하지 않는다.
import type { Facing } from '../engine/types'
import { OLD_BUILDINGS,OLD_VILLAGE_PALETTE,BUILDING_LABELS } from './old-village-art'

export const PROFESSION_BUILDINGS=['cook','painter','weaver','gardener','potter','instrumentMaker','carpenter','baker','scribe','scholar','woodworker','shipwright','teaKeeper','merchant','fisher','sailor','herbalist','traveler'] as const
export type ProfessionBuilding=typeof PROFESSION_BUILDINGS[number]
export const BUILDING_FACINGS=['down','up','left','right'] as const
export const CONSTRUCTION_STAGES=['foundation','frame','roof'] as const
export type ConstructionStage=typeof CONSTRUCTION_STAGES[number]
export const BUILDING_ART_PALETTE={...OLD_VILLAGE_PALETTE,J:'#6f5140',P:'#ead7b2',q:'#bda367',n:'#79989b',N:'#4f6b75',v:'#b292a2',V:'#856f89'}
type Roof='gable'|'hip'|'shed'|'flat'|'stepped'|'round'
type Window='square'|'arch'|'tall'|'round'|'wide'
interface Style {roof:Roof;window:Window;roofColor:string;roofShade:string;wall:string;timber?:boolean;awning?:string;chimney?:boolean;note:string}
export const PROFESSION_STYLES:Record<ProfessionBuilding,Style>={
 cook:{roof:'hip',window:'arch',roofColor:'H',roofShade:'h',wall:'u',chimney:true,note:'살구빛 사면 지붕·작은 굴뚝·문 옆 요리 솥'},
 painter:{roof:'gable',window:'wide',roofColor:'v',roofShade:'V',wall:'u',note:'높은 박공·큰 채광창·야외 이젤'},
 weaver:{roof:'hip',window:'square',roofColor:'a',roofShade:'A',wall:'u',awning:'b',note:'하나로 이어진 청록 지붕·밝은 창틀·작게 걸어 둔 천'},
 gardener:{roof:'shed',window:'square',roofColor:'G',roofShade:'g',wall:'u',note:'완만한 잎빛 비탈 지붕·꽃 화분'},
 potter:{roof:'flat',window:'arch',roofColor:'H',roofShade:'h',wall:'I',chimney:true,note:'낮은 벽돌 지붕·굴뚝·항아리 건조 선반'},
 instrumentMaker:{roof:'gable',window:'round',roofColor:'I',roofShade:'i',wall:'u',note:'모래빛 박공·둥근 창·작은 현악기'},
 carpenter:{roof:'gable',window:'wide',roofColor:'w',roofShade:'W',wall:'C',timber:true,note:'단일 나무 박공·모서리 기둥·작은 목공 받침'},
 baker:{roof:'round',window:'arch',roofColor:'H',roofShade:'h',wall:'u',chimney:true,note:'부드러운 둥근 지붕·작은 굴뚝·빵 바구니'},
 scribe:{roof:'gable',window:'tall',roofColor:'I',roofShade:'i',wall:'u',note:'단정한 박공·좁고 높은 창·두루마리 책상'},
 scholar:{roof:'hip',window:'wide',roofColor:'a',roofShade:'A',wall:'C',note:'넓은 사면 지붕·독서 창·기록 책장'},
 woodworker:{roof:'shed',window:'wide',roofColor:'w',roofShade:'W',wall:'I',note:'낮은 나무 지붕·문 옆 통나무 더미'},
 shipwright:{roof:'shed',window:'tall',roofColor:'a',roofShade:'A',wall:'u',note:'차분한 물빛 비탈 지붕·작은 목선'},
 teaKeeper:{roof:'hip',window:'round',roofColor:'G',roofShade:'g',wall:'u',awning:'P',note:'잎빛 사면 지붕·둥근 창·작은 찻잔 받침'},
 merchant:{roof:'flat',window:'wide',roofColor:'I',roofShade:'i',wall:'C',awning:'b',note:'낮은 평지붕·문 위 작은 차양·상품 바구니'},
 fisher:{roof:'gable',window:'square',roofColor:'n',roofShade:'N',wall:'u',note:'물빛 박공·문 옆 어구 꾸러미'},
 sailor:{roof:'gable',window:'round',roofColor:'n',roofShade:'N',wall:'I',note:'물빛 박공·둥근 창·작은 밧줄과 닻'},
 herbalist:{roof:'gable',window:'tall',roofColor:'G',roofShade:'g',wall:'C',note:'잎빛 박공·밝은 세로 창·약초 화분'},
 traveler:{roof:'hip',window:'arch',roofColor:'v',roofShade:'V',wall:'u',note:'보랏빛 사면 지붕·작은 여행 가방'},
}
function grid(w=64,h=64){
 const p=Array.from({length:h},()=>Array<string>(w).fill('.'))
 const dot=(x:number,y:number,c:string)=>{if(p[y]?.[x]!==undefined)p[y][x]=c}
 const rect=(x:number,y:number,ww:number,hh:number,c:string)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)dot(xx,yy,c)}
 const line=(x0:number,y0:number,x1:number,y1:number,c:string)=>{const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;for(;;){dot(x0,y0,c);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}}
 const paste=(rows:readonly string[],x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.')dot(x+xx,y+yy,c)}))
 return {p,dot,rect,line,paste,rows:()=>p.map(r=>r.join(''))}
}
type Grid=ReturnType<typeof grid>
function roof(b:Grid,s:Style,d:Facing){
 const r=b.rect,side=d==='left'||d==='right',color=s.roofColor,shade=s.roofShade
 if(s.roof==='flat'){r(5,20,54,8,color);r(4,18,56,2,shade);r(7,19,50,1,color);r(6,24,52,1,shade)}
 else if(s.roof==='stepped'){
  // 예전의 두 겹 지붕 대신 낮은 단일 평지붕으로 처리한다.
  r(5,20,54,8,color);r(4,18,56,2,shade);r(7,19,50,1,color);r(6,24,52,1,shade)
 }else if(s.roof==='shed'){
  for(let x=5;x<59;x++){const xx=d==='left'?63-x:x,top=14+Math.floor((xx-5)/7);r(x,top,1,28-top,color);b.dot(x,top,shade)}
  r(6,24,52,1,shade)
 }else if(s.roof==='round'){
  for(let y=12;y<27;y++){const w=Math.max(8,Math.round(54*Math.sqrt(1-((27-y)/16)**2))),x=Math.floor((64-w)/2);r(x,y,w,1,y===20||y===25?shade:color);b.dot(x,y,shade);b.dot(x+w-1,y,shade)}
 }else if(s.roof==='hip'||side){
  for(let y=12;y<27;y++){const inset=Math.max(0,Math.floor((25-y)/2));r(5+inset,y,54-inset*2,1,y===20||y===25?shade:color)}
  r(13,11,38,1,shade);b.line(13,12,6,25,shade);b.line(50,12,57,25,shade)
 }else{
  for(let y=7;y<27;y++){const inset=Math.max(0,Math.floor((26-y)*1.25));r(5+inset,y,54-inset*2,1,y===19||y===25?shade:color);b.dot(5+inset,y,shade);b.dot(58-inset,y,shade)}
  r(29,6,6,1,shade)
 }
 r(3,27,58,2,shade);r(6,26,52,1,color)
 if(s.chimney){const x=d==='left'?11:46;r(x,9,5,14,'i');r(x+1,9,3,13,'I');r(x-1,8,7,2,'i');r(x,8,5,1,'U')}
}
function window(b:Grid,x:number,kind:Window,wall:string){
 const r=b.rect,w=kind==='wide'?12:kind==='tall'?8:kind==='round'?9:10,h=kind==='tall'?12:kind==='round'?9:10,y=kind==='tall'?33:35
 r(x,y,w,h,'I');r(x+1,y+1,w-2,h-2,'a');r(x+1,y+1,1,h-3,'C');r(x+2,y+h-2,w-3,1,'A')
 r(x+Math.floor(w/2),y+1,1,h-2,'C')
 if(kind==='arch'||kind==='round'){
  b.dot(x,y,wall);b.dot(x+w-1,y,wall);b.dot(x+1,y,'I');b.dot(x+w-2,y,'I')
  if(kind==='round'){for(const [dx,dy]of [[0,1],[w-1,1],[0,h-1],[w-1,h-1]])b.dot(x+dx,y+dy,wall)}
 }
 r(x-1,y+h,w+2,1,'w');r(x,y+h+1,w,1,'I')
}
function door(b:Grid,d:Facing){
 if(d==='up')return
 const x=d==='left'?10:d==='right'?42:27,r=b.rect
 r(x+2,39,6,1,'W');r(x+1,40,8,1,'W');r(x,41,10,18,'W');r(x+2,40,6,1,'l');r(x+1,41,8,17,'w')
 r(x+2,43,1,12,'l');r(x+3,43,4,4,'A');r(x+3,43,3,3,'a');b.dot(x+7,51,'S')
 r(x-1,59,12,1,'u');r(x-2,60,14,1,'I')
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
/** 건물 외관에는 큰 작업대 대신 작은 소품 하나만 붙인다. */
export function professionExteriorDetailRows(job:ProfessionBuilding){
 const b=grid(12,10),r=b.rect
 switch(job){
  case 'cook':r(3,4,7,5,'J');r(2,4,9,1,'S');r(4,5,1,3,'I');r(5,2,4,2,'s');break
  case 'painter':r(3,0,7,7,'w');r(4,1,5,5,'P');r(5,3,2,2,'v');r(7,2,1,3,'g');r(4,7,1,3,'W');r(8,7,1,3,'W');break
  case 'weaver':r(2,0,8,1,'w');r(3,1,6,7,'b');r(4,2,1,5,'B');r(7,2,1,5,'C');for(const x of [3,5,7])r(x,8,1,1,'b');break
  case 'gardener':r(2,6,8,3,'w');r(3,7,6,2,'I');for(const x of [4,7]){r(x,2,1,4,'g');r(x-1,1,3,2,x===4?'p':'v');b.dot(x,1,'C')}break
  case 'potter':r(2,3,4,1,'h');r(1,4,6,4,'H');r(2,5,1,2,'I');r(8,5,3,1,'h');r(7,6,5,3,'H');break
  case 'instrumentMaker':r(3,1,2,6,'w');r(8,1,2,6,'w');r(4,7,5,2,'W');for(const x of [5,7])r(x,1,1,6,'q');break
  case 'carpenter':r(1,5,10,2,'w');r(2,7,2,3,'W');r(8,7,2,3,'W');r(5,2,5,1,'S');r(8,0,1,4,'J');break
  case 'baker':r(1,6,10,3,'w');r(2,5,8,2,'q');for(const x of [2,6]){r(x,3,4,3,'I');r(x+1,2,2,1,'P');b.dot(x+1,4,'P')}break
  case 'scribe':r(2,3,8,5,'P');r(1,3,2,5,'C');r(9,3,2,5,'C');r(4,5,4,1,'q');break
  case 'scholar':for(const [y,c]of [[2,'v'],[5,'n'],[8,'I']] as const){r(2,y,8,2,c);r(3,y,6,1,'P')}break
  case 'woodworker':for(const y of [3,6,9]){r(1,y-1,10,2,'W');r(2,y-1,8,1,'w');b.dot(2,y-1,'l')}break
  case 'shipwright':r(0,4,12,2,'W');r(1,6,10,2,'w');r(3,8,6,1,'I');for(const x of [2,5,8])r(x,3,1,4,'I');break
  case 'teaKeeper':r(1,7,10,2,'w');r(3,3,5,4,'C');r(4,2,3,1,'W');r(8,4,2,2,'I');r(1,5,2,2,'P');break
  case 'merchant':r(1,5,10,4,'w');r(2,5,8,1,'l');r(3,3,3,2,'p');r(6,2,3,3,'g');break
  case 'fisher':r(2,3,5,4,'s');r(3,4,3,2,'S');r(7,7,4,2,'a');b.dot(6,7,'A');b.dot(10,7,'S');break
  case 'sailor':r(1,3,5,5,'q');r(2,4,3,3,'P');b.dot(3,5,'q');r(8,1,1,6,'S');r(6,6,5,1,'S');r(7,7,3,1,'S');break
  case 'herbalist':r(2,6,8,3,'I');r(3,7,6,2,'w');for(const x of [4,7]){r(x,1,1,5,'g');r(x-1,3,3,2,'g');b.dot(x+1,2,'G')}break
  case 'traveler':r(3,3,7,6,'W');r(4,4,5,4,'I');r(5,1,3,2,'w');r(1,0,1,9,'J');r(1,0,2,1,'J');break
 }
 return b.rows()
}
export function professionBuildingArt(job:ProfessionBuilding,d:Facing){
 const b=grid(),r=b.rect,s=PROFESSION_STYLES[job],side=d==='left'||d==='right'
 r(5,59,54,3,'z');r(7,28,50,32,'I');r(9,29,46,29,s.wall);r(9,29,46,3,'U')
 r(9,54,46,4,'U');r(9,54,46,1,'I');r(9,58,46,1,'i');r(54,31,1,22,'U')
 for(const x of [12,42,49])r(x,51,4,1,'I')
 if(s.timber){r(8,31,2,23,'w');r(54,31,2,23,'w')}
 roof(b,s,d)
 const xs=side?[26]:[s.window==='wide'?11:13,s.window==='wide'?42:43]
 for(const x of xs)window(b,x,s.window,s.wall)
 if(s.awning&&d!=='up'){
  const x=d==='left'?8:d==='right'?40:25
  r(x,35,14,1,'I');r(x,36,14,3,s.awning);r(x+1,36,12,1,'C');r(x,39,14,1,'U')
 }
 const slot={x:d==='up'?43:d==='left'?42:8,y:49}
 b.paste(professionExteriorDetailRows(job),slot.x,slot.y)
 door(b,d)
 return {...layers(b.rows(),d),job,exteriorDetailSlot:slot,integratedWorkProp:false,style:s}
}

/** 완공 전 3단계. 문 좌표는 계획만 반환하며 공사 그림은 출입구로 연결하지 않는다. */
export function constructionBuildingArt(id:string,d:Facing,stage:ConstructionStage){
 if(!OLD_BUILDINGS[id])throw new Error(`없는 건물: ${id}`)
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
   const s=PROFESSION_STYLES[id as ProfessionBuilding]
   if(s)roof(b,s,d);else for(let y=0;y<29;y++)for(let x=0;x<64;x++)b.dot(x,y,OLD_BUILDINGS[id][d].rows[y][x])
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
