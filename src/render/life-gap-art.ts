import { COOKING_PROPS } from './cooking-art'
import { EXPANSION_PROPS, EXPANSION_VIEWS } from './expansion-prop-art'
import type { FurnitureArt } from './furniture-art'
import type { Facing } from '../engine/types'
import { petMotionRows } from './expansion-life-motion'

export const LIFE_GAP_PROPS: Record<string, FurnitureArt> = {}
export const LIFE_GAP_LABELS: Record<string, string> = {}
type Rect = [string,number,number,number,number]
function add(id:string,label:string,base:FurnitureArt,rects:Rect[]) {
  const rows=base.rows.map(r=>[...r])
  for(const [c,x,y,w,h] of rects)for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)if(rows[y+dy]?.[x+dx]!==undefined)rows[y+dy][x+dx]=c
  LIFE_GAP_PROPS[id]={...base,rows:rows.map(r=>r.join(''))}; LIFE_GAP_LABELS[id]=label
}
const blank: FurnitureArt={w:1,h:1,rows:Array<string>(16).fill('.'.repeat(16))}
add('seatReserved','늦는 사람의 찻잔 자리',COOKING_PROPS.cupEmpty,[['w',2,13,12,2],['C',3,13,10,1]])
add('seatCleared','불참 뒤 치운 자리',COOKING_PROPS.plateEmpty,[['.',0,0,16,16],['C',2,6,12,6],['c',3,7,10,4],['w',4,10,8,1]])
add('meetingRainCover','비 오는 모임 덮개',blank,[['B',1,3,14,2],['b',2,2,12,1],['W',2,5,1,9],['W',13,5,1,9],['c',4,6,8,6],['B',5,9,2,2],['B',9,9,2,2]])
add('meetingRescheduled','옮긴 모임 일정표',EXPANSION_PROPS.schedule,[['C',4,6,8,6],['W',5,7,4,1],['r',5,9,3,1],['g',8,10,3,1]])
add('eventPreparing','행사 준비 바구니',EXPANSION_PROPS.basketEmpty,[['b',4,7,5,3],['c',8,6,4,4],['r',10,7,2,2]])
add('eventWelcome','집들이 환영 표지',EXPANSION_PROPS.nameSign,[['g',3,5,2,2],['r',11,6,2,2],['c',6,7,4,1]])
add('artCovered','발표 전 덮인 작품',EXPANSION_PROPS.drawingBoard,[['B',3,2,10,11],['b',4,3,8,9],['c',11,3,1,8]])
add('artPresented','작품 발표 받침',EXPANSION_PROPS.flowerDrawing,[['W',3,13,10,2],['l',4,12,8,1]])
add('eventCleanup','행사 뒤 정리 상자',EXPANSION_PROPS.wrappedGoods,[['b',4,3,4,3],['c',8,4,4,2],['r',9,5,2,1]])
add('loomInProgress','직조 중인 천',EXPANSION_PROPS.clothPattern,[['.',9,9,5,4],['w',9,8,1,5],['c',11,8,1,4],['b',13,8,1,3]])
add('ringInProgress','장식 고리 작업 중',EXPANSION_PROPS.ringRound,[['.',9,8,5,6],['S',9,7,3,2]])
add('netInProgress','그물 수선 중',EXPANSION_PROPS.netTorn,[['c',5,7,5,1],['S',9,4,1,6],['c',8,8,3,1]])
add('woolUnsorted','분류 전 양털',EXPANSION_PROPS.woolSorted,[['C',5,6,5,5],['c',6,5,3,4]])
add('woolInProgress','분류 중 양털',EXPANSION_PROPS.woolSorted,[['C',7,9,2,2],['w',7,11,2,1]])
add('grapeBasketHalf','포도 수확 중',EXPANSION_PROPS.basketEmpty,[['v',4,8,3,3],['V',7,8,3,2]])
add('oilFilling','기름 담는 중',EXPANSION_PROPS.oilEmpty,[['y',5,10,6,3],['y',7,6,1,4]])
add('herbJarLabel','약방 생활 용기 표지',COOKING_PROPS.honeyJar,[['g',5,7,6,5],['C',5,8,6,3],['g',7,8,2,2]])
add('seedBoxSorted','분류한 씨앗 상자',EXPANSION_PROPS.displayEmpty,[['C',3,7,3,5],['g',4,8,1,2],['C',7,7,3,5],['r',8,8,1,2],['C',11,7,2,5]])
add('familyPotFirst','처음 함께 심은 화분',EXPANSION_PROPS.potGrowing,[['C',6,10,5,2],['r',8,10,1,1]])
add('childFirstDrawing','아이 첫 그림',EXPANSION_PROPS.flowerDrawing,[['y',9,4,3,3],['g',4,9,7,1],['b',4,5,2,2]])
add('childPatternCloth','아이가 고른 천 무늬',EXPANSION_PROPS.clothPattern,[['y',4,6,2,2],['r',9,8,2,2],['G',6,10,2,2]])
add('petWindowMat','반려동물 창가 자리',EXPANSION_PROPS.petBlanket,[['W',2,2,12,2],['b',3,4,10,3],['c',7,4,1,3]])
add('newBreadDisplay','새 빵 진열',EXPANSION_PROPS.breadTray,[['y',4,6,3,3],['l',9,7,3,3],['C',5,7,1,1]])
add('lunchPlate','주민 점심 접시',COOKING_PROPS.beanBowl,[['l',3,5,3,2],['g',10,6,2,1]])
add('displayCandle','좌판 향초 진열',EXPANSION_PROPS.candleDecor,[['W',1,14,14,1]])
add('displayTextile','좌판 직물 진열',EXPANSION_PROPS.clothPattern,[['W',1,14,14,1]])
add('displayRing','좌판 고리 진열',EXPANSION_PROPS.ringRound,[['W',1,14,14,1]])
add('displayToy','좌판 장난감 진열',EXPANSION_PROPS.toyBoat,[['W',1,14,14,1]])
add('marketNameTag','좌판 작은 간판',EXPANSION_PROPS.namePlate,[['c',4,6,8,2]])

export const LIFE_GAP_STRUCTURES: Record<string, Record<Facing,FurnitureArt>> = {}
for(const [id,baseId]of [['marketFolded','marketClosed'],['marketClosing','marketOpen'],['benchBuilding','constructionFrame'],['flowerBorderBuilding','constructionFrame']] as const){
  const original=EXPANSION_VIEWS[baseId]
  if(!original)throw Error(`Missing structure ${baseId}`)
  const views={} as Record<Facing,FurnitureArt>
  for(const facing of ['down','up','left','right'] as const){
    const base=original[facing],rows=base.rows.map(r=>[...r]),w=base.w*16,h=base.h*16
    if(id==='marketFolded')for(let y=0;y<h-9;y++)rows[y].fill('.')
    if(id==='marketClosing')for(let y=Math.max(0,h-13);y<h-8;y++)for(let x=3;x<w-3;x++)rows[y][x]=(x%4===0?'w':'C')
    if(id==='benchBuilding')for(let y=h-10;y<h-7;y++)for(let x=2;x<w-2;x++)rows[y][x]=y===h-10?'l':'W'
    if(id==='flowerBorderBuilding')for(let x=3;x<w-3;x+=5){rows[h-7][x]='g';rows[h-8][x]='G'}
    views[facing]={...base,rows:rows.map(r=>r.join(''))}
  }
  LIFE_GAP_STRUCTURES[id]=views
}
export const PET_PERSONALITIES=['shy','curious','playful','calm','turnHead','nuzzle'] as const
export function petPersonalityFrame(kind:'cat'|'dog',facing:Facing,action:typeof PET_PERSONALITIES[number],frame:number,baby=false){
  const f=((frame%4)+4)%4
  const source=petMotionRows(kind,facing,action==='playful'?'play':action==='curious'?'sniff':action==='nuzzle'?'wag':'wait',f,baby)
  const p=source.map(r=>[...r])
  if(action==='shy')for(let y=14;y>0;y--)for(let x=0;x<16;x++)if(p[y-1][x]!=='.'){p[y][x]=p[y-1][x];p[y-1][x]='.'}
  if(action==='calm'&&f===2)for(const row of p)for(let x=0;x<16;x++)if(row[x]==='e')row[x]='A'
  if(action==='turnHead'&&(f===1||f===2))for(let y=3;y<8;y++)for(let x=0;x<16;x++)if(p[y][x]==='e'||p[y][x]==='n'){const c=p[y][x];p[y][x]='A';p[y][Math.min(15,x+1)]=c;x++}
  if(action==='nuzzle'&&f%2===1){for(let y=2;y<13;y++){const row=[...p[y]];for(let x=0;x<16;x++)p[y][x]=row[Math.max(0,x-1)]}}
  return p.map(r=>r.join(''))
}
