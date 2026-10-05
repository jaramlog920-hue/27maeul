// 계획 18·19용 코드 원본. 16px 타일, 투명 배경, 정수 좌표. 게임 연결은 별도.
import { pixels } from './home-space-art'
import type { FurnitureArt } from './furniture-art'
import { FURNI_PALETTE } from './furniture-art'
import type { Facing } from '../engine/types'
export const OLD_VILLAGE_PALETTE = { ...FURNI_PALETTE, z:'#756653', H:'#bd8069', h:'#98644f', I:'#d5ab82', i:'#b18a64', a:'#99aaa5', A:'#6b8581', u:'#ebe0c5', U:'#cbbda1' }
type Rect = readonly [string,number,number,number,number]
const tile = (r:readonly Rect[]) => pixels(1,1,r)
export const OLD_PROPS:Record<string,FurnitureArt> = {
  archiveSign:tile([['W',3,11,2,5],['W',11,11,2,5],['w',1,3,14,9],['l',2,4,12,7],['C',5,5,6,4],['W',7,5,1,4],['c',6,6,1,2],['c',9,6,1,2]]),
  scrollCabinet:tile([['W',1,1,14,15],['l',2,2,12,1],['w',2,4,12,10],['C',3,5,2,4],['c',7,5,2,4],['C',11,5,2,4],['l',2,9,12,2],['C',4,11,3,3],['c',9,11,3,3]]),
  recordStand:tile([['W',3,10,2,6],['W',11,10,2,6],['w',2,4,12,7],['l',3,4,10,2],['C',4,5,8,4],['W',7,5,1,4],['w',5,6,1,2],['w',10,6,1,2]]),
  keywordBoard:tile([['W',1,1,14,13],['l',2,2,12,11],['C',3,3,4,4],['b',9,3,3,2],['g',4,9,2,2],['p',9,8,3,3],['w',2,14,2,2],['w',12,14,2,2]]),
  personalNote:tile([['W',2,4,12,10],['C',3,4,10,8],['c',4,5,8,5],['w',5,6,5,1],['w',5,8,3,1],['r',10,4,1,9]]),
  memoryMarker:tile([['W',6,11,3,5],['w',2,2,12,10],['l',3,3,10,8],['C',4,4,8,6],['g',7,5,2,4],['p',6,5,4,2]]),
  plotPeg:tile([['W',6,5,3,10],['l',6,5,1,8],['r',8,3,6,4],['p',9,3,3,1]]),
  buildStack:tile([['W',1,11,14,4],['w',2,10,12,2],['l',1,7,14,3],['w',2,7,12,1],['C',4,3,7,4],['w',7,3,1,9]]),
  welcomeKey:tile([['S',4,3,5,2],['S',3,5,2,4],['S',8,5,2,4],['S',4,9,5,2],['s',4,4,3,1],['S',8,9,5,2],['S',11,10,2,3]]),
  homePlaque:tile([['W',2,3,12,9],['l',3,4,10,7],['w',5,5,6,1],['C',5,7,2,2],['g',9,7,2,2]]),
  growthMeasure:tile([['W',5,0,6,16],['l',6,1,4,15],['w',6,3,3,1],['w',6,6,2,1],['w',6,9,3,1],['w',6,12,2,1],['r',8,8,2,1]]),
  familyAlbum:tile([['W',2,3,12,11],['p',3,3,10,10],['C',5,5,6,5],['w',6,6,1,2],['w',9,6,1,2],['g',7,9,2,1]]),
  babyWrap:tile([['C',4,3,8,10],['c',5,4,6,8],['p',6,5,4,2],['C',3,8,10,3],['b',5,10,6,2]]),
  feedingBowl:tile([['W',2,9,12,4],['C',3,8,10,3],['c',4,9,8,1],['y',5,9,6,1],['w',11,3,2,7]]),
  childShoes:tile([['W',2,8,5,5],['l',3,8,3,2],['w',1,11,6,2],['W',9,8,5,5],['l',10,8,3,2],['w',8,11,6,2]]),
  schoolSatchel:tile([['W',5,1,6,4],['.',6,2,4,2],['w',2,5,12,9],['l',3,5,10,3],['C',6,9,4,3],['S',7,7,2,2]]),
  apprenticeBadge:tile([['b',5,1,3,7],['B',8,1,3,7],['S',4,7,8,7],['s',5,8,6,5],['W',7,9,2,3]]),
  departureChest:tile([['W',1,5,14,10],['w',2,6,12,8],['l',2,6,12,3],['C',4,2,8,4],['b',5,2,6,1],['S',7,9,2,3]]),
  familyLetter:tile([['W',2,5,12,8],['C',3,4,10,8],['c',4,5,8,6],['w',4,5,2,1],['w',10,5,2,1],['r',7,7,2,2]]),
  guestRegister:tile([['W',1,3,14,11],['C',2,3,6,9],['c',8,3,6,9],['w',7,3,1,10],['b',3,5,3,1],['w',9,5,3,1],['w',3,8,3,1],['g',9,8,2,2]]),
  sharedMeal:tile([['W',1,6,14,8],['l',2,6,12,5],['C',3,7,4,3],['C',9,7,4,3],['y',4,8,2,1],['g',10,8,2,1],['w',2,13,2,3],['w',12,13,2,3]]),
  gardenGate:tile([['W',1,2,3,14],['W',12,2,3,14],['w',4,5,8,8],['l',5,5,1,7],['l',8,5,1,7],['l',11,5,1,7],['g',0,1,5,3],['g',11,1,5,3],['p',2,1,2,2]]),
  readingCushions:pixels(2,1,[['B',1,6,12,8],['b',2,7,10,5],['p',18,6,12,8],['C',19,7,10,5],['w',14,3,3,11],['C',13,4,5,4]]),
  courtyardBench:pixels(2,1,[['W',2,3,3,12],['W',27,3,3,12],['l',5,4,22,4],['w',3,9,26,3],['W',5,12,3,4],['W',24,12,3,4]]),
}
export const OLD_PROP_LABELS:Record<string,string> = Object.fromEntries(['서고 표지','작은 두루마리 책장','기록 전시대','키워드 전시판','개인 기록 공책','기억 정원 표식','부지 말뚝','건축 재료 묶음','입주 열쇠','가족 문패','성장 눈금판','가족 앨범','아기 포대기','돌봄 그릇','아이 신발','배움 가방','견습 표식','독립 짐 상자','가족 편지','손님 명부','함께 먹는 작은 상','정원 문','함께 읽는 방석','마당 긴 벤치'].map((label,i)=>[Object.keys(OLD_PROPS)[i],label]))

export const BUILDING_LABELS:Record<string,string>={archive:'작은 구약 서고',home:'입주 주택',guest:'손님집',family:'가족 주택',gallery:'주민의 꿈 미술관',courtyard:'공동 마당',garden:'기억 정원',cook:'요리사의 집 겸 일터',painter:'화가의 집 겸 일터',weaver:'직조인의 집 겸 일터',gardener:'정원사의 집 겸 일터',potter:'도예가의 집 겸 일터',instrumentMaker:'악기 제작자의 집 겸 일터',carpenter:'목수의 집 겸 일터',baker:'빵 굽는 집 겸 일터'}
Object.assign(BUILDING_LABELS,{scribe:'필사가의 기록집',scholar:'학자의 공부집',woodworker:'나무 작업자의 일터',shipwright:'배 제작자의 작업집',teaKeeper:'차지기의 쉼집',merchant:'상인의 귀가집',fisher:'어부의 집',sailor:'선원의 귀가집',herbalist:'약초 연구자의 집',traveler:'여행자의 귀가집'})
const JOB_SIGNS:Record<string,FurnitureArt>={
  scribe:OLD_PROPS.personalNote,scholar:OLD_PROPS.scrollCabinet,
  woodworker:OLD_PROPS.buildStack,
  shipwright:tile([['W',1,8,14,2],['w',3,10,10,3],['W',5,13,6,1],['W',7,1,1,8],['C',8,2,5,5],['b',1,15,14,1]]),
  teaKeeper:tile([['W',3,7,8,6],['C',4,6,6,5],['w',11,7,3,4],['.',12,8,1,2],['C',5,3,1,2],['C',8,2,1,3]]),
  merchant:OLD_PROPS.departureChest,
  fisher:tile([['W',2,1,1,13],['w',3,2,8,1],['C',10,3,1,6],['S',9,9,3,3],['b',5,11,7,3],['B',7,12,3,1],['S',4,12,1,2]]),
  sailor:tile([['S',7,2,2,10],['S',5,1,6,2],['S',3,10,2,3],['S',11,10,2,3],['S',5,13,6,2],['b',2,15,12,1]]),
  herbalist:tile([['W',3,9,10,5],['l',4,9,8,1],['g',7,4,2,5],['G',4,3,4,3],['g',8,2,4,3],['p',9,3,2,1]]),
  traveler:tile([['W',4,3,9,11],['l',5,4,7,8],['b',6,5,4,3],['w',2,2,1,14],['C',2,1,2,2]]),
}
export const OLD_JOB_SIGNS=JOB_SIGNS
export const OLD_TERRAIN:Record<string,FurnitureArt>={
  grass:tile([['G',0,0,16,16],['g',2,3,2,1],['g',11,10,2,1],['Y',7,6,1,1]]),
  earth:tile([['I',0,0,16,16],['i',3,4,2,1],['U',10,8,2,1],['i',8,13,1,1]]),
  path:tile([['U',0,0,16,16],['u',0,2,16,12],['I',2,5,3,1],['I',9,10,2,1]]),
  paving:tile([['U',0,0,16,16],['u',1,1,6,6],['u',9,1,6,6],['u',1,9,6,6],['u',9,9,6,6]]),
  water:tile([['a',0,0,16,16],['b',2,4,5,1],['b',9,10,5,1],['A',0,15,16,1]]),
  plantingBed:tile([['W',0,0,16,16],['i',2,2,12,12],['I',2,5,12,1],['I',2,9,12,1],['g',4,4,2,2],['g',10,8,2,2]]),
  mapWaySign:tile([['W',7,7,2,9],['w',1,2,13,7],['l',2,3,10,4],['C',8,4,4,1],['C',10,3,1,3]]),
  newLandSeal:tile([['W',2,2,12,12],['C',3,3,10,10],['g',5,5,6,1],['g',7,4,2,4],['w',5,10,6,1]]),
  youngTree:pixels(1,2,[['W',7,12,3,18],['l',7,14,1,14],['g',3,4,11,12],['G',2,6,12,6],['g',5,1,7,6],['Y',5,4,3,2],['U',5,30,7,2]]),
  flowerBush:tile([['g',2,5,12,9],['G',3,4,10,6],['p',4,5,3,2],['Y',5,6,1,1],['p',10,8,3,2],['Y',11,9,1,1]]),
}
function sign(id:string):FurnitureArt {
  if(JOB_SIGNS[id])return JOB_SIGNS[id]
  if(id==='archive'||id==='gallery')return OLD_PROPS.recordStand
  if(id==='guest')return OLD_PROPS.guestRegister
  if(id==='family')return OLD_PROPS.familyAlbum
  if(id==='garden'||id==='gardener')return OLD_PROPS.gardenGate
  if(id==='cook'||id==='baker')return OLD_PROPS.feedingBowl
  if(id==='painter')return OLD_PROPS.keywordBoard
  if(id==='weaver')return OLD_PROPS.babyWrap
  if(id==='potter')return tile([['W',4,3,8,2],['r',3,5,10,8],['p',4,5,8,2],['W',4,13,8,2]])
  if(id==='instrumentMaker')return tile([['w',7,1,2,8],['W',4,8,8,7],['l',5,9,6,5],['W',7,10,2,2]])
  return OLD_PROPS.homePlaque
}
function put(base:FurnitureArt,a:FurnitureArt,x:number,y:number) {const r=base.rows.map(row=>[...row]);a.rows.forEach((row,dy)=>[...row].forEach((c,dx)=>{if(c!=='.'&&r[y+dy]?.[x+dx]!==undefined)r[y+dy][x+dx]=c}));return {...base,rows:r.map(row=>row.join(''))}}
/** 앞·뒤·옆은 출입구와 지붕을 별도로 그린다. 이미지를 회전하거나 늘리지 않는다. */
function building(id:string,facing:Facing,construction=false):FurnitureArt {
  const side=facing==='left'||facing==='right',back=facing==='up'
  const r:Rect[]=[['z',5,59,54,3],['W',7,25,50,35],['u',9,27,46,31],['U',9,53,46,5]]
  for(let y=32;y<53;y+=7){r.push(['I',9,y,46,1]);for(let x=12+(y%2?0:5);x<55;x+=13)r.push(['I',x,y-5,1,5])}
  if(side){r.push(['h',5,22,54,5],['H',7,12,50,10],['I',10,9,44,3]);for(let x=12;x<54;x+=8)r.push(['h',x,12,1,10])}
  else {for(let y=4;y<25;y++){const inset=Math.floor((25-y)/2);r.push([y%5===0?'h':'H',4+inset,y,56-inset*2,1])}r.push(['h',3,25,58,3])}
  const doorX=side?facing==='left'?10:42:27
  if(!back)r.push(['W',doorX,39,10,21],['w',doorX+2,41,6,17],['l',doorX+2,42,1,15],['S',doorX+6,49,1,2],['I',doorX-2,59,14,2])
  for(const x of side?[27]:[14,43]){r.push(['W',x,33,8,11],['a',x+1,34,6,8],['A',x+4,34,2,8],['l',x+1,38,6,1],['I',x-1,44,10,2])}
  if(id==='archive'||id==='gallery')r.push(['W',29,13,6,9],['a',30,14,4,7],['C',31,14,1,6])
  if(id==='guest'||id==='cook'||id==='baker')r.push(['W',45,3,6,13],['I',44,2,8,3])
  let a=pixels(4,4,r)
  if(!back)a=put(a,sign(id),side?25:4,46)
  if(id==='courtyard'||id==='garden'){
    a=pixels(4,4,[['U',3,35,58,26],['u',5,37,54,22],['w',3,51,58,3],['W',4,37,2,24],['W',58,37,2,24],['g',7,30,12,10],['g',46,30,12,10],['p',9,32,3,2],['p',50,32,3,2]])
    a=put(a,id==='garden'?OLD_PROPS.memoryMarker:OLD_PROPS.courtyardBench,id==='garden'?25:16,40)
  }
  if(construction){a=pixels(4,4,[['U',6,55,52,6],['W',9,18,3,40],['W',52,18,3,40],['w',9,20,46,3],['w',10,38,44,3],['l',15,16,3,43],['l',45,16,3,43],['w',9,54,46,3],['C',19,24,25,11],['w',18,24,1,17]]);a=put(a,OLD_PROPS.buildStack,24,45)}
  return a
}
export const OLD_BUILDINGS:Record<string,Record<Facing,FurnitureArt>>={}
export const OLD_CONSTRUCTION:typeof OLD_BUILDINGS={}
for(const id of Object.keys(BUILDING_LABELS)) {
  OLD_BUILDINGS[id]=Object.fromEntries((['down','up','left','right'] as Facing[]).map(f=>[f,building(id,f)])) as Record<Facing,FurnitureArt>
  OLD_CONSTRUCTION[id]=Object.fromEntries((['down','up','left','right'] as Facing[]).map(f=>[f,building(id,f,true)])) as Record<Facing,FurnitureArt>
}
export const OLD_INTERIORS:Record<string,FurnitureArt>={}
for(const id of Object.keys(BUILDING_LABELS).filter(id=>!['courtyard','garden'].includes(id))) {
  const r:Rect[]=[['W',0,0,128,96],['u',2,2,124,20],['I',2,22,124,72],['w',2,23,124,1],['U',2,24,3,70],['U',123,24,3,70],['W',55,92,18,4],['u',57,92,14,4],['W',88,5,20,13],['a',90,6,16,10],['l',97,6,1,10]]
  for(let y=30;y<91;y+=12){r.push(['i',5,y,118,1]);for(let x=10+(y%24?0:12);x<120;x+=24)r.push(['i',x,y-5,1,5])}
  let a=pixels(8,6,r)
  a=put(a,sign(id),12,30);a=put(a,id==='archive'?OLD_PROPS.scrollCabinet:OLD_PROPS.departureChest,100,30)
  a=put(a,id==='archive'?OLD_PROPS.readingCushions:OLD_PROPS.sharedMeal,48,50)
  if(id==='family')a=put(a,OLD_PROPS.growthMeasure,26,30)
  if(id==='guest')a=put(a,OLD_PROPS.guestRegister,80,50)
  if(id==='gallery')a=put(a,OLD_PROPS.memoryMarker,78,30)
  OLD_INTERIORS[id]=a
}
