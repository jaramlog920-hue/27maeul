import type { Book } from '../engine/types'
import type { Binding } from '../engine/binding'
import type { Grade } from '../engine/library'
import { libraryBookRows } from './library-art'

export const BOOK_REOPEN_STAGES = ['책장에 꽂힌 책','책 꺼내기','꾸민 표지 보기','표지 감상','표지 반쯤 열기','표지 옆면','표지 펼치기','성경 펼쳐 보기','한 장 넘기기','다시 읽기'] as const
export const BOOK_REOPEN_DURATIONS = [500,280,500,1000,300,240,300,650,300,1400] as const
export const BOOK_REOPEN_SIZE = { width:64, height:48 }

/** A revisit, not a new binding. The closed cover is the exact saved design.
 * The cover rotates around the left binding, then reveals the pages inside.
 * All coordinates are native integer pixels; no character sleeves are added.
 */
export function bookReopenRows(book:Book,frame:number,binding?:Binding,grade?:Grade,sealed=false):string[] {
  const f=Math.max(0,Math.min(9,Math.trunc(frame)))
  const p=Array.from({length:48},()=>Array<string>(64).fill('.'))
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{
    for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)if(p[y+dy]?.[x+dx]!==undefined)p[y+dy][x+dx]=c
  }
  const paste=(rows:string[],ox:number,oy:number)=>rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')rect(ox+x,oy+y,1,1,c)}))
  if(f<=1) {
    // Bookcase posts and neighboring books stay behind the selected volume.
    rect(7,6,50,3,'W');rect(7,36,50,3,'W');rect(7,9,3,27,'w');rect(54,9,3,27,'w')
    for(const[x,h,c]of [[13,21,'d'],[20,24,'p'],[39,22,'d'],[46,20,'c']] as const){rect(x,36-h,5,h,'k');rect(x+1,37-h,3,h-1,c)}
    paste(libraryBookRows(book,binding,grade,sealed),28,f===0?16:20)
    // A small fingertip under the spine, without an arm growing out of it.
    if(f===1){rect(27,39,3,2,'s');rect(35,39,3,2,'s')}
    return p.map(r=>r.join(''))
  }
  const cover=libraryBookRows(book,binding,grade,sealed,true)
  if(f<=3){paste(cover,30,8);return p.map(r=>r.join(''))}
  // The right page block is exposed as the front cover moves to the left.
  rect(32,9,23,31,'k');rect(33,10,21,28,'p');rect(34,10,19,27,'h');rect(34,39,21,2,'d')
  const text=(x:number,y:number,w:number)=>{
    // Abstract ink lines never claim to be scripture text.
    rect(x,y,w,1,'S');rect(x,y+3,w-2,1,'S');rect(x,y+6,w,1,'S');rect(x,y+9,w-3,1,'S');rect(x,y+12,w-1,1,'S')
  }
  text(37,16,13)
  if(f<=6) {
    const width=f===4?14:f===5?3:14,ox=f===6?18:32
    // Project the existing decorative face, preserving its selected palette.
    for(let y=1;y<31;y++)for(let x=0;x<width;x++){
      const sx=f===6?Math.min(21,2+Math.floor((width-1-x)*20/width)):Math.min(21,2+Math.floor(x*20/width))
      const c=cover[y][sx];if(c!=='.')rect(ox+x,8+y,1,1,c)
    }
    rect(32,9,1,31,'d')
    return p.map(r=>r.join(''))
  }
  // Full spread: decorated cover edges and its colored ribbon remain visible.
  rect(8,9,24,32,'k');rect(9,10,22,30,'c');rect(10,11,21,28,'p');rect(11,11,19,27,'h')
  rect(9,39,23,2,'d');rect(31,10,2,29,'d');rect(32,11,1,26,'W')
  text(14,16,13)
  rect(32,32,2,11,'d');rect(31,42,1,2,'d');rect(34,42,1,2,'d')
  if(f===8){
    // A thin curled sheet moves over the gutter while the cover stays open.
    rect(29,11,7,27,'p');rect(30,11,4,25,'h');rect(34,13,1,23,'S');rect(31,15,1,17,'p')
  }
  return p.map(r=>r.join(''))
}
