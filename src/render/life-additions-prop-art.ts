// 자산 원안만 내보낸다. 가구 ID·제본 선택지·가격·게임 화면은 변경하지 않는다.
import { pixels } from './home-space-art'
import { FURNI_PALETTE } from './furniture-art'
import { libraryBookRows, libraryPalette } from './library-art'
import type { Binding, CoverColor } from '../engine/binding'

export const MEMORY_KINDS=['wedding','birth','independence','wreath','flowerPot','ribbonPost'] as const
export type MemoryKind=typeof MEMORY_KINDS[number]
export const MEMORY_LABELS:Record<MemoryKind,string>={wedding:'결혼 기념 표식',birth:'출생 기념 표식',independence:'독립 기념 표식',wreath:'기념 꽃고리',flowerPot:'기념 꽃 화분',ribbonPost:'기념 리본 말뚝'}
export const MEMORY_PALETTE={...FURNI_PALETTE,V:'#d3c3a0',v:'#aa997b',H:'#f2dbb9',h:'#bf9b70'}
export function memoryMarkerRows(kind:MemoryKind,frame=0){
 const p=pixels(1,1,[]).rows.map(r=>[...r]),f=((frame%4)+4)%4
 const rect=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c}
 if(['wedding','birth','independence'].includes(kind)){
  rect(3,3,10,10,'v');rect(4,3,8,9,'V');rect(2,13,12,2,'v');rect(3,13,10,1,'V')
  if(kind==='wedding'){
   for(const x of [5,8]){rect(x,5,3,1,'h');rect(x,8,3,1,'h');rect(x,6,1,2,'h');rect(x+2,6,1,2,'h')}
   rect(5,10,5,1,'H')
  } else if(kind==='birth'){
   rect(5,7,6,2,'h');rect(4,6,1,4,'h');rect(11,6,1,4,'h');rect(5,10,1,1,'h');rect(10,10,1,1,'h');rect(7,6,2,1,'H');rect(6,7,4,1,'H')
  } else {
   rect(6,5,4,1,'h');rect(5,6,1,2,'h');rect(10,6,1,2,'h');rect(6,8,6,1,'h');rect(10,9,1,1,'h');rect(8,9,1,1,'h');rect(6,6,4,1,'H')
  }
  // 꽃은 살짝만 흔들리고 날짜/이름을 꾸며 쓰지 않는다.
  rect(1,10,2,2,'g');rect(12,10,2,2,'g');rect(1+f%2,9,1,1,'p');rect(12-f%2,9,1,1,'p')
 } else if(kind==='wreath'){
  for(const [x,y]of [[5,2],[9,2],[3,4],[11,4],[2,7],[12,7],[3,10],[11,10],[5,12],[9,12]]){rect(x,y,2,2,'g');rect(x+f%2,y,1,1,'p')}
  rect(7,12,2,3,'b');rect(5,14,2,1,'B');rect(9,14,2,1,'B')
 } else if(kind==='flowerPot'){
  rect(4,10,8,1,'W');rect(5,11,6,4,'r');rect(6,12,4,1,'l');rect(7,5,2,5,'g');rect(4,7,4,2,'G');rect(9,6,3,2,'G')
  for(const [x,y]of [[4,4],[9,2],[7,6]]){rect(x+(f%2),y,3,2,'p');rect(x+1+(f%2),y,1,1,'Y')}
 } else {
  rect(7,3,2,12,'W');rect(7,3,1,10,'l');rect(4,4,7,2,'b');rect(3,3,3,3,'B');rect(10,3,3,3,'B');rect(5+f%2,6,2,4,'b');rect(9,6,2,3+f%2,'b')
 }
 return p.map(r=>r.join(''))
}

export const BOOK_DETAILS=['metalCorners','ribbonBookmark','embossed','worn'] as const
export type BookDetail=typeof BOOK_DETAILS[number]
export const BOOK_DETAIL_LABELS:Record<BookDetail,string>={metalCorners:'모서리 금속',ribbonBookmark:'천 책갈피',embossed:'눌러 찍은 무늬',worn:'손때 묻은 표지'}
export const DETAIL_COLORS=['cream','sky','sage','lavender','sand','slate'] as const satisfies readonly CoverColor[]
function binding(color:CoverColor):Binding{return {day:0,special:{color,pattern:'plain',deco:'leather'}}}
export function bookDetailPalette(color:CoverColor){return {...libraryPalette('mt',binding(color)),M:'#b99760',m:'#eed2a0',T:'#8c666b',t:'#d4a2a4',E:'#6f5947',e:'#d9c5a3'}}
export function decoratedBookRows(detail:BookDetail,color:CoverColor,cover=false){
 const p=libraryBookRows('mt',binding(color),undefined,false,cover).map(r=>[...r]),w=p[0].length,h=p.length
 const rect=(x:number,y:number,ww:number,hh:number,c:string)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c}
 if(detail==='metalCorners')for(const x of cover?[5,w-5]:[1,w-3])for(const y of [2,h-4]){rect(x,y,3,1,'M');rect(x,y,1,3,'M');rect(x,y,1,1,'m')}
 if(detail==='ribbonBookmark'){const x=cover?17:4;rect(x,2,2,h-4,'T');rect(x,3,1,h-5,'t');rect(x,h-3,1,2,'T')}
 if(detail==='embossed'){
  const cx=cover?15:4,cy=Math.floor(h/2)
  for(const [dx,dy]of [[0,-3],[-1,-2],[1,-2],[-2,-1],[2,-1],[-3,0],[3,0],[-2,1],[2,1],[-1,2],[1,2],[0,3]])rect(cx+dx,cy+dy,1,1,'E')
  rect(cx-1,cy-2,1,1,'e');rect(cx-2,cy-1,1,1,'e')
 }
 if(detail==='worn'){
  for(let y=3;y<h-3;y+=4){rect(cover?5:1,y,1,2,'e');rect(w-3,y+1,1,1,'E')}
  rect(cover?6:2,h-4,3,1,'e');rect(w-5,3,2,1,'e')
 }
 return p.map(r=>r.join(''))
}
/** 네 단계 작업대 원안. 마지막 프레임만 완성 표지를 남긴다. */
export function bookDetailWorkRows(detail:BookDetail,color:CoverColor,frame:number){
 const p=Array.from({length:40},()=>Array<string>(40).fill('.')),f=((frame%4)+4)%4
 const rect=(x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c}
 const rows=f===3?decoratedBookRows(detail,color,true):libraryBookRows('mt',binding(color),undefined,false,true)
 rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')p[y+1][x+8]=c}))
 rect(2,34,36,3,'w');rect(4,37,3,3,'W');rect(33,37,3,3,'W')
 if(f<3){
  const x=detail==='ribbonBookmark'?25:detail==='worn'?27-f*3:detail==='metalCorners'?13+f*6:22,y=detail==='embossed'?[8,14,16][f]:8+f*7
  rect(x,y,2,5,detail==='ribbonBookmark'?'T':'W');rect(x-1,y+4,4,2,detail==='metalCorners'?'M':detail==='worn'?'e':'m');rect(x+2,y+1,3,2,'s');rect(x+2,y+3,3,2,'S')
 }
 return p.map(r=>r.join(''))
}
