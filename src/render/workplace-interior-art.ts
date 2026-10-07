// 27마을 일터 실내 자산. 16px 타일, 기존 128×96 방과 문턱 유지. 게임 연결은 별도.
import type { FurnitureArt } from './furniture-art'
import { pixels, HOME_SPACE_ART } from './home-space-art'
import { OLD_INTERIOR_SHELL, OLD_VILLAGE_PALETTE, OLD_PROPS } from './old-village-art'
import { REMAINING_FURNITURE_ART } from './remaining-furniture-art'

export const WORKPLACE_PALETTE = { ...OLD_VILLAGE_PALETTE }
export const WORKPLACE_IDS = ['scribe','scholar','woodworker','shipwright','teaKeeper','merchant','fisher','sailor','herbalist','traveler','cook','painter','weaver','gardener','potter','instrumentMaker','carpenter','baker'] as const
export type WorkplaceId = typeof WORKPLACE_IDS[number]
export const WORKPLACE_LABELS: Record<WorkplaceId,string> = {
  scribe:'필사가의 기록방',scholar:'학자의 공부방',woodworker:'나무 작업자의 일터',shipwright:'배 제작자의 작업방',
  teaKeeper:'차지기의 찻방',merchant:'상인의 물품방',fisher:'어부의 그물방',sailor:'선원의 귀가방',
  herbalist:'약초 연구자의 작업방',traveler:'여행자의 귀가방',cook:'요리사의 부엌',painter:'화가의 그림방',
  weaver:'직조인의 공방',gardener:'정원사의 준비방',potter:'도예가의 공방',instrumentMaker:'악기 제작자의 공방',
  carpenter:'목수의 가구 공방',baker:'빵 굽는 방',
}
type Rect = readonly [string,number,number,number,number]
const art = (w:number,h:number,r:readonly Rect[]) => pixels(w,h,r)
const small = (r:readonly Rect[]) => art(1,1,r)
function table(content:readonly Rect[]):FurnitureArt {
  return art(2,1,[['z',1,14,30,2],['W',3,10,3,5],['W',26,10,3,5],['k',1,3,30,9],['l',2,4,28,6],['w',2,10,28,2],...content])
}
function rack(contents:readonly Rect[]):FurnitureArt {
  return art(2,2,[['z',1,30,30,2],['W',1,1,3,30],['W',28,1,3,30],['w',4,3,24,26],['l',3,1,26,2],...contents,
    ['l',3,14,26,2],['W',3,16,26,1],['l',3,28,26,2]])
}
const bundles:Rect[]=[]
for(let x=5;x<26;x+=7)bundles.push(['C',x,5,5,8],['c',x+1,6,1,6],['w',x,8,5,1],['C',x,20,5,7],['r',x,23,5,1])
const jars:Rect[]=[]
for(let x=5;x<26;x+=7)jars.push(['W',x+1,4,3,2],['b',x,6,5,7],['c',x+1,7,1,4],['C',x,9,5,2],['R',x,21,5,6],['r',x+1,22,2,3])
const tools:Rect[]=[]
for(let x=5;x<28;x+=6)tools.push(['s',x,6,5,2],['W',x+2,8,1,6],['l',x+2,9,1,4],['W',x,20,2,7],['s',x+1,20,4,2])
const breads:Rect[]=[]
for(let x=5;x<26;x+=7)breads.push(['W',x,9,5,4],['y',x,7,5,5],['Y',x+1,7,3,1],['l',x+2,8,1,3],['y',x,22,5,5],['Y',x+1,22,3,1])
export const WORKPLACE_PROPS:Record<string,FurnitureArt> = {
  stool:HOME_SPACE_ART.stool,chair:HOME_SPACE_ART.chair,daybed:HOME_SPACE_ART.daybed,
  chest:HOME_SPACE_ART.chest,basket:HOME_SPACE_ART.basket,teapot:HOME_SPACE_ART.teapot,
  cushion:HOME_SPACE_ART.cushion,bench:HOME_SPACE_ART.longBench,
  ink:REMAINING_FURNITURE_ART.inkpot,scrolls:REMAINING_FURNITURE_ART.scrolls,
  plant:REMAINING_FURNITURE_ART.bigPlant,barrel:REMAINING_FURNITURE_ART.barrel,
  jar:REMAINING_FURNITURE_ART.jar,flowers:REMAINING_FURNITURE_ART.dryFlowers,
  scrollRack:rack(bundles),bottleRack:rack(jars),toolRack:rack(tools),breadRack:rack(breads),
  writingDesk:table([['c',4,5,16,4],['C',4,9,16,1],['w',6,6,9,1],['w',6,8,6,1],['W',22,6,4,4],['s',24,3,1,5],['r',4,8,2,1]]),
  studyDesk:table([['c',4,4,19,6],['C',14,4,9,6],['W',13,4,1,6],['w',6,5,5,1],['w',16,6,5,1],['S',26,4,2,5],['y',25,2,4,2]]),
  woodBench:table([['W',4,5,16,4],['l',5,5,14,2],['s',22,5,6,2],['W',24,7,2,3],['C',4,9,2,1],['l',17,9,2,1]]),
  carvingBench:table([['W',4,5,12,4],['l',5,5,10,2],['W',7,6,1,3],['s',20,4,8,1],['W',24,4,2,5],['c',17,8,2,1],['C',19,9,2,1]]),
  teaTable:table([['C',5,6,5,3],['c',6,5,3,1],['b',6,7,3,1],['C',20,6,5,3],['b',21,7,3,1],['c',12,4,6,5],['W',14,3,2,1],['c',18,5,3,2]]),
  marketCounter:table([['W',4,5,5,5],['y',5,6,3,2],['W',14,3,2,7],['s',10,3,10,1],['S',10,5,1,3],['S',19,5,1,3],['s',9,8,4,1],['s',18,8,4,1],['C',24,4,4,6]]),
  netBench:table([['b',4,4,16,6],['B',5,5,14,1],['W',22,4,1,6],['C',23,6,4,1],['c',8,4,1,6],['c',13,4,1,6],['c',18,4,1,6],['c',4,7,16,1]]),
  chartDesk:table([['c',4,4,20,6],['b',6,5,5,3],['B',9,7,4,2],['w',14,5,6,1],['r',17,4,1,5],['S',26,4,2,2],['y',26,5,1,1]]),
  herbBench:table([['C',4,5,11,4],['g',5,5,4,2],['G',10,6,3,2],['S',18,7,7,3],['s',19,6,5,2],['W',22,3,1,5],['b',27,5,2,4]]),
  prepTable:table([['C',4,4,13,6],['g',5,5,5,2],['r',11,6,3,3],['s',18,5,6,1],['W',24,5,3,1],['c',21,8,6,2]]),
  paintTable:table([['c',4,5,11,4],['b',5,6,2,2],['r',9,6,2,2],['y',12,6,2,2],['W',20,6,5,4],['s',21,2,1,5],['s',24,3,1,4],['p',27,8,2,1]]),
  clayBench:table([['R',5,8,10,2],['r',6,6,8,3],['p',7,5,5,2],['W',20,4,2,6],['s',20,3,6,1],['C',26,6,3,3]]),
  instrumentBench:table([['W',7,3,2,5],['l',5,6,8,4],['W',8,7,2,2],['c',7,3,1,7],['s',19,5,7,1],['W',24,6,2,3],['l',16,9,2,1]]),
  pottingBench:table([['R',4,6,7,4],['r',5,6,5,1],['g',7,3,1,4],['G',5,3,4,2],['C',17,5,7,5],['g',18,6,5,2],['s',27,4,2,5]]),
  doughBench:table([['c',4,4,17,6],['C',5,5,15,4],['y',9,5,7,3],['Y',10,5,5,1],['W',22,4,2,6],['l',21,5,4,3]]),
  woodStack:art(2,1,[['z',1,14,30,2],['W',2,8,28,6],['l',3,8,26,2],['w',2,11,28,1],['W',5,3,23,5],['l',6,3,21,2],['C',5,4,1,3],['W',13,3,1,5],['W',21,8,1,6]]),
  boatFrame:art(3,2,[['z',1,27,46,3],['W',2,14,4,8],['W',6,22,36,4],['W',42,14,4,8],['l',6,14,36,3],['w',6,17,36,5],['l',8,22,32,2],['W',9,8,2,17],['W',19,5,2,19],['W',29,5,2,19],['W',39,8,2,17],['l',10,9,1,12],['l',20,6,1,15],['l',30,6,1,15],['l',40,9,1,12]]),
  oven:art(2,2,[['z',1,30,30,2],['S',3,10,26,21],['s',4,11,24,18],['S',7,5,18,6],['s',8,5,16,5],['S',11,2,10,4],['s',12,2,8,3],['W',8,17,16,10],['W',10,15,12,2],['r',10,25,12,2],['y',12,23,3,3],['p',18,22,2,4],['S',3,28,26,3],['C',5,14,3,1],['C',22,10,3,1]]),
  stove:art(2,2,[['z',1,30,30,2],['S',3,14,26,17],['s',4,15,24,13],['S',6,7,20,10],['s',7,8,18,7],['W',10,23,12,5],['r',12,26,8,2],['y',15,24,3,3],['S',8,6,16,7],['s',10,6,12,2],['W',11,6,10,1],['g',13,6,3,1],['S',5,10,4,2],['S',24,10,4,2],['s',5,28,22,2]]),
  loom:art(2,2,[['z',1,30,30,2],['W',2,2,4,29],['W',26,2,4,29],['l',3,3,2,25],['l',27,3,2,25],['W',4,2,24,3],['l',4,2,24,1],['c',7,6,18,19],['b',8,15,16,9],['B',8,19,16,2],['p',12,15,3,9],['C',19,15,2,9],['W',5,25,22,3],['l',5,25,22,1],['w',8,28,16,2],['W',13,28,2,3],['W',20,28,2,3],['w',8,7,1,8],['w',12,7,1,8],['w',16,7,1,8],['w',20,7,1,8],['w',24,7,1,8]]),
  yarnRack:rack([['b',5,7,6,6],['B',6,8,1,4],['p',14,7,6,6],['r',15,8,1,4],['C',22,7,5,6],['w',23,8,1,4],['b',5,21,8,6],['p',15,21,11,6],['c',6,21,6,1],['C',16,21,9,1]]),
  potteryRack:rack([['R',5,7,7,6],['r',6,8,5,4],['R',6,5,5,2],['c',18,7,8,6],['C',19,8,6,3],['b',20,10,4,1],['r',5,21,9,6],['R',6,20,7,2],['C',19,23,7,4],['c',20,22,5,1]]),
  wheel:art(2,2,[['z',3,29,26,3],['W',7,23,3,7],['W',23,23,3,7],['w',5,22,22,4],['W',9,16,15,2],['l',6,12,23,4],['W',4,14,27,3],['s',8,13,19,2],['R',13,7,10,6],['r',14,7,8,4],['p',15,8,2,3],['R',14,5,8,2],['C',15,6,6,1],['W',15,19,3,5],['l',13,24,7,1]]),
  easel:art(2,2,[['z',3,30,25,2],['W',6,11,2,20],['W',25,11,2,20],['W',15,1,2,31],['l',16,1,1,27],['w',5,25,23,2],['W',5,3,23,22],['c',6,4,21,20],['b',7,5,19,8],['G',7,13,19,5],['g',7,18,19,5],['y',22,7,3,3],['W',12,11,2,10],['G',9,9,8,6],['g',11,10,4,2],['C',6,23,21,1]]),
  lute:art(1,2,[['z',3,30,10,2],['W',7,2,3,13],['l',8,3,1,12],['W',6,1,5,3],['W',3,16,10,11],['l',4,16,8,10],['W',6,18,4,4],['w',5,26,6,2],['c',7,4,1,22],['C',9,4,1,22]]),
  harp:art(2,2,[['z',1,30,30,2],['W',2,3,3,28],['l',3,4,1,25],['W',4,3,24,3],['l',5,3,22,1],['W',27,5,3,25],['w',5,27,23,3],['W',23,20,5,7],['w',19,16,4,4],['w',14,12,5,4],['w',9,8,5,4],['c',7,6,1,22],['c',11,6,1,22],['c',15,6,1,22],['c',19,6,1,22],['c',23,6,1,22]]),
  seedRack:rack([['C',5,6,8,7],['g',7,8,4,3],['c',17,6,9,7],['p',19,8,4,3],['R',6,22,7,5],['g',9,18,1,5],['G',7,17,5,3],['r',19,22,7,5],['g',22,18,1,5],['G',20,17,5,3]]),
  dryingRack:art(2,2,[['W',2,3,2,28],['W',28,3,2,28],['w',3,3,26,2],['W',3,29,26,2],['g',7,7,5,15],['G',8,8,2,11],['g',15,7,5,16],['G',16,8,2,12],['g',23,7,3,13],['C',7,7,5,2],['C',15,7,5,2],['C',23,7,3,2],['w',8,5,1,2],['w',16,5,1,2],['w',24,5,1,2]]),
  fishingRack:art(2,2,[['W',2,2,2,29],['W',28,2,2,29],['w',3,3,26,2],['w',3,28,26,2],['C',7,6,1,16],['C',14,6,1,16],['C',21,6,1,16],['c',6,9,17,1],['c',6,14,17,1],['c',6,19,17,1],['b',7,10,1,4],['b',14,15,1,4],['W',25,6,1,21],['C',26,7,1,9],['s',25,16,3,2]]),
  rope:small([['W',3,5,10,8],['l',4,4,8,2],['l',2,6,3,6],['l',11,6,3,6],['l',4,11,8,2],['w',5,7,6,3],['W',6,7,4,2],['l',5,13,2,2]]),
  fishTub:small([['W',1,7,14,8],['l',2,8,12,2],['b',3,6,10,3],['s',4,7,7,1],['S',9,6,3,3],['w',2,11,12,1],['S',2,13,12,1]]),
  pack:small([['W',4,1,8,4],['w',2,4,12,11],['l',3,5,10,2],['C',4,8,8,4],['r',7,7,2,7],['b',4,1,7,3],['B',5,1,1,3]]),
  map:art(2,1,[['W',1,1,30,14],['C',2,2,28,12],['c',3,3,26,10],['b',4,5,9,2],['B',9,7,7,2],['g',19,4,4,3],['g',25,8,3,3],['r',15,4,1,7],['r',15,10,8,1],['W',21,9,3,3],['l',22,10,1,1]]),
  painting:art(2,1,[['W',1,1,30,14],['l',2,2,28,12],['b',3,3,26,10],['G',3,8,26,5],['g',3,11,26,2],['y',22,4,3,3],['c',7,5,5,1],['p',8,9,2,2]]),
  toolBoard:art(2,1,[['W',1,1,30,14],['l',2,2,28,12],['w',4,4,24,1],['W',6,6,1,7],['s',4,5,5,2],['S',14,5,1,7],['s',12,5,5,2],['W',23,6,2,6],['s',20,5,8,2],['C',20,11,2,1]]),
  plateShelf:art(2,1,[['W',2,13,28,2],['l',2,12,28,1],['C',4,5,6,7],['c',5,6,4,5],['C',12,4,7,8],['c',13,5,5,6],['r',22,6,6,6],['p',23,7,3,3]]),
  clock:OLD_PROPS.guestRegister,
}

export interface WorkplacePlacement { id:string; prop:string; x:number; y:number; depth:number; wall:boolean }
export interface WorkplaceRoom {
  id:WorkplaceId; label:string; width:128; height:96; rows:string[];
  floor:string[]; walls:string[]; furniture:string[]; placements:WorkplacePlacement[];
  entry:{x:number;y:number}; clearPath:{x:number;y:number;width:number;height:number};
}
const place = (prop:string,x:number,y:number,wall=false):WorkplacePlacement => ({id:`${prop}-${x}-${y}`,prop,x,y,depth:y+(WORKPLACE_PROPS[prop]?.h??1)*16,wall})
const p=place
// 中央 16px 幅は出入口から奥まで空ける。各仕事の大型家具は左右に寄せる。
const LAYOUTS:Record<WorkplaceId,WorkplacePlacement[]> = {
  scribe:[p('scrollRack',8,24),p('writingDesk',16,58),p('stool',24,76),p('scrolls',80,28),p('ink',104,28),p('daybed',84,72),p('chest',104,50)],
  scholar:[p('map',12,3,true),p('scrollRack',80,24),p('studyDesk',12,40),p('chair',20,58),p('scrolls',40,28),p('daybed',84,72),p('cushion',20,76)],
  woodworker:[p('toolBoard',12,3,true),p('woodStack',8,28),p('woodBench',12,52),p('stool',24,72),p('toolRack',84,24),p('woodStack',84,64),p('chest',104,80)],
  shipwright:[p('toolBoard',12,3,true),p('boatFrame',6,26),p('woodBench',12,64),p('woodStack',80,28),p('rope',104,48),p('barrel',80,52),p('map',84,3,true),p('chest',104,76)],
  teaKeeper:[p('plateShelf',12,3,true),p('bottleRack',8,24),p('teaTable',12,62),p('cushion',8,80),p('cushion',36,80),p('teaTable',84,40),p('stool',92,60),p('plant',104,72)],
  merchant:[p('marketCounter',12,38),p('stool',20,58),p('bottleRack',84,24),p('chest',8,72),p('basket',28,72),p('pack',44,68),p('barrel',80,64),p('scrolls',104,72),p('map',12,3,true)],
  fisher:[p('fishingRack',8,24),p('netBench',12,60),p('stool',24,78),p('fishTub',80,32),p('fishTub',104,32),p('rope',80,56),p('barrel',104,56),p('daybed',84,76)],
  sailor:[p('map',12,3,true),p('chartDesk',12,36),p('stool',24,56),p('rope',8,76),p('pack',36,72),p('barrel',84,28),p('chest',104,28),p('daybed',84,72),p('cushion',104,52)],
  herbalist:[p('dryingRack',8,24),p('herbBench',12,62),p('stool',24,80),p('bottleRack',84,24),p('basket',80,72),p('plant',104,64),p('flowers',80,52)],
  traveler:[p('map',12,3,true),p('chartDesk',12,32),p('stool',24,50),p('pack',8,72),p('pack',28,72),p('chest',40,56),p('daybed',84,72),p('scrollRack',84,24)],
  cook:[p('plateShelf',12,3,true),p('stove',8,24),p('prepTable',12,64),p('basket',36,80),p('bottleRack',84,24),p('teaTable',84,68),p('stool',92,84),p('jar',104,52)],
  painter:[p('painting',12,3,true),p('easel',8,28),p('paintTable',12,64),p('stool',24,80),p('painting',84,26),p('painting',80,48),p('chest',104,66),p('flowers',80,72)],
  weaver:[p('loom',8,26),p('yarnRack',84,24),p('stool',20,60),p('basket',8,78),p('cushion',36,74),p('woodBench',84,66),p('basket',104,82)],
  gardener:[p('seedRack',8,24),p('pottingBench',12,62),p('basket',32,80),p('plant',80,26),p('plant',104,28),p('seedRack',84,52),p('jar',80,80)],
  potter:[p('potteryRack',8,24),p('wheel',12,62),p('clayBench',84,30),p('stool',92,50),p('oven',84,62),p('jar',40,62),p('plateShelf',12,3,true)],
  instrumentMaker:[p('toolBoard',12,3,true),p('instrumentBench',12,34),p('stool',24,54),p('lute',8,62),p('woodStack',24,78),p('harp',84,26),p('toolRack',84,62)],
  carpenter:[p('toolBoard',12,3,true),p('toolRack',8,24),p('carvingBench',12,64),p('woodStack',80,28),p('chair',80,52),p('chair',104,52),p('bench',84,76)],
  baker:[p('plateShelf',12,3,true),p('oven',8,24),p('doughBench',12,64),p('basket',32,80),p('breadRack',84,24),p('barrel',80,68),p('basket',104,68),p('stool',104,84)],
}
function merge(...layers:readonly string[][]):string[] {
  const result=Array.from({length:96},()=>Array<string>(128).fill('.'))
  for(const rows of layers)for(let y=0;y<96;y++)for(let x=0;x<128;x++)if(rows[y][x]!=='.')result[y][x]=rows[y][x]
  return result.map(row=>row.join(''))
}
export const WORKPLACE_INTERIORS:Record<WorkplaceId,WorkplaceRoom> = Object.fromEntries(WORKPLACE_IDS.map(id=>{
  const floor=OLD_INTERIOR_SHELL.rows.map((r,y)=>y>=24?r:'.'.repeat(128))
  const walls=OLD_INTERIOR_SHELL.rows.map((r,y)=>y<24?r:'.'.repeat(128)).map(r=>[...r])
  const furniture=Array.from({length:96},()=>Array<string>(128).fill('.'))
  const placements=LAYOUTS[id]
  for(const item of placements){
    const a=WORKPLACE_PROPS[item.prop]
    if(!a)throw Error(`일터 소품 없음: ${item.prop}`)
    const target=item.wall?walls:furniture
    if(item.x<0||item.y<0||item.x+a.w*16>128||item.y+a.h*16>96)throw Error(`일터 소품 범위: ${id}/${item.prop}`)
    a.rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')target[item.y+y][item.x+x]=c}))
  }
  const wallRows=walls.map(r=>r.join('')),furnitureRows=furniture.map(r=>r.join(''))
  return [id,{id,label:WORKPLACE_LABELS[id],width:128,height:96,floor,walls:wallRows,furniture:furnitureRows,
    rows:merge(floor,wallRows,furnitureRows),placements,entry:{x:64,y:94},clearPath:{x:60,y:24,width:16,height:72}}]
})) as Record<WorkplaceId,WorkplaceRoom>
