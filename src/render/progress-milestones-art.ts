import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {ProgressKind} from '../engine/scenic-kinds'
import {person} from './milestone-moments-art'
import {drawScenicBench} from './stargazing-art'
import {spriteRows,writerPalette} from './sprites'

export interface ProgressDetails {
  bookColor:string
  childAvatar:Avatar|null
  parentAvatar:Avatar|null
  heirAvatar:Avatar|null
}
type Px=(x:number,y:number,c:string,w?:number,h?:number)=>void
const ease=(n:number)=>{const k=Math.max(0,Math.min(1,n));return k*k*(3-2*k)}
export const PROGRESS_PHOTO_TIME=8
export function drawProgressMilestone(g:CanvasRenderingContext2D,kind:ProgressKind,w:number,h:number,t:number,avatar:Avatar|null,details:ProgressDetails) {
  g.imageSmoothingEnabled=false
  const p:Px=(x,y,c,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
  const cx=Math.round(w/2),floor=Math.round(h*.68)
  const indoor=kind!=='childLeaves'
  p(0,0,indoor?'#cdbda4':'#d1d9b7',w,h)
  p(0,floor,indoor?'#ae906c':'#a4bb85',w,h-floor)
  if(indoor)for(let y=floor+7;y<h;y+=9)p(0,y,'#967655',w)
  const window=(x:number,y:number,sunset=false)=>{
    p(x-3,y-3,'#9b7c55',46,47);p(x,y,sunset?'#c9a1a0':'#dbe1c8',40,41)
    p(x,y+20,sunset?'#e1b08b':'#a8bd94',40,21)
    if(sunset){p(x+26,y+9,'#f1d6a2',7,7);for(let i=0;i<3;i++)p(x+5+i*9,y+30-i*2,'#ab9e83',12,11+i*2)}
    p(x+19,y,'#af8f65',2,41);p(x,y+19,'#af8f65',40,2)
  }
  const book=(x:number,y:number,color=details.bookColor)=>{p(x,y,'#735b41',8,14);p(x+1,y,color,6,13);p(x+2,y+3,'#eddfba',4,1);p(x+2,y+10,'#eddfba',4,1)}
  if(kind==='firstOtBook'){
    const sx=cx-83,sy=floor-79
    p(sx-5,sy-5,'#78684d',176,85);p(sx,sy,'#554d3e',166,77)
    for(let i=0;i<3;i++){p(sx-3,sy+23+i*25,'#b19c79',172,3);for(let col=0;col<13;col++)p(sx+7+col*12,sy+20+i*25,'#8a795b',6,1)}
    const a=ease(t/2),x=cx-112+40*a
    person(p,x,floor+12,avatar,a<1?'right':'up','writer',false,a<1,t)
    if(t>=2)book(sx+8,floor-19,'#c9d8c5')
    p(w-49,floor-67,'#9b927c',29,42);p(w-46,floor-64,'#d9dfcc',23,36);p(w-35,floor-64,'#ada18a',1,36)
  }else if(kind==='psalmRest'){
    window(cx+38,floor-73,true)
    p(cx-85,floor-10,'#b49b77',58,7);p(cx-82,floor-3,'#745a41',3,11);p(cx-34,floor-3,'#745a41',3,11)
    p(cx-68,floor-15,'#80694d',20,5);p(cx-66,floor-15,'#c7b18b',16,2)
    drawScenicBench(g,cx+13,floor+8,avatar,null,true)
    p(cx-9,floor+8,'#947b5b',45,3)
  }else if(kind==='firstHomeBook'){
    window(cx-113,floor-68)
    const sx=cx+37,sy=floor-62
    p(sx-4,sy-5,'#826348',52,71);p(sx,sy,'#5e4c39',44,64)
    for(let i=0;i<3;i++)p(sx-2,sy+18+i*20,'#b29166',48,3)
    if(t>=2)book(sx+5,sy+43)
    const a=ease(t/2)
    if(t<4)person(p,cx+9-12*(1-a),floor+12,avatar,'right','writer',false,a<1,t)
    else{
      p(cx-16,floor-5,'#c3ab7e',37,10);p(cx-12,floor+5,'#866749',3,5);p(cx+13,floor+5,'#866749',3,5)
      person(p,cx-7,floor+9,avatar,'down','writer',true)
      p(cx-4,floor-1,'#82694a',16,6);p(cx-3,floor-2,'#e8d9b5',6,5);p(cx+5,floor-2,'#e8d9b5',6,5);p(cx+4,floor-2,'#a7926b',1,5)
    }
  }else if(kind==='childLeaves'){
    p(cx-111,floor-64,'#f4e0c0',100,65);p(cx-114,floor-91,'#c07058',106,28)
    for(let y=floor-84;y<floor-66;y+=6)p(cx-113,y,'#b46850',104,2)
    p(cx-114,floor-91,'#cc8468',106,2);p(cx-114,floor-66,'#a86048',106,3)
    p(cx-65,floor-97,'#e0a974',7,13);p(cx-67,floor-99,'#9a6e45',11,2)
    p(cx-99,floor-48,'#c59a61',23,25);p(cx-97,floor-46,'#ffca70',19,21)
    p(cx-88,floor-46,'#c59a61',2,21);p(cx-97,floor-37,'#c59a61',19,2)
    p(cx-111,floor-5,'#f0d8b0',100,6)
    p(cx-44,floor-38,'#876b4a',21,39);p(cx-41,floor-35,'#614f3b',15,36)
    p(0,floor+5,'#c0b18d',w,15);p(cx-90,floor+20,'#c0b18d',80,h-floor-20)
    for(let i=0;i<24;i++){const x=(i*37+19)%w,y=floor+27+(i*11)%Math.max(1,h-floor-30);if(x<cx-90||x>cx-10)p(x,y,'#92ad74',2,1)}
    person(p,cx-41,floor+22,avatar,'right')
    const a=ease((t-1)/5),x=cx-10+80*a
    if(t<6)person(p,x,floor+22,details.childAvatar,'right','writer',false,true,t)
    else {
      const av=details.childAvatar?withLookDefaults(details.childAvatar):undefined,pal=writerPalette('spring',av)
      spriteRows('writer','left',{frame:0,blink:false,avatar:av,pose:'wave'}).forEach((row,y)=>[...row].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,floor-6+y*2,pal[c],2,2)}))
    }
    const bag=t>=6?x+17:x-3;p(bag,floor+7,'#998461',7,10);p(bag+1,floor+8,'#baa478',4,7)
    for(const x of [cx-127,cx+118]){p(x,floor-3,'#819c64',15,9);p(x+4,floor-6,'#d0ac99',4,3)}
  }else if(kind==='childStays'){
    window(cx-104,floor-68)
    p(cx+21,floor-3,'#b69870',63,6);p(cx+25,floor+3,'#75583e',3,10);p(cx+76,floor+3,'#75583e',3,10)
    p(cx+40,floor-6,'#e0d2b4',17,3);p(cx+62,floor-7,'#937651',4,4)
    person(p,cx-43,floor+13,avatar,'right')
    const a=ease(t/3),x=cx-6+38*a
    person(p,x,floor+12,details.childAvatar,a<1?'right':'up','writer',false,a<1,t)
  }else{
    window(cx-116,floor-70)
    p(cx-28,floor-3,'#b4956d',104,6);p(cx-28,floor+3,'#775b40',104,2)
    p(cx-21,floor+5,'#775b40',3,8);p(cx+67,floor+5,'#775b40',3,8)
    p(cx+7,floor-6,'#dfccaa',30,3);p(cx+38,floor-11,'#8e7656',9,8);p(cx+39,floor-13,'#c8b08c',7,2)
    const a=ease(t/4)
    const px=cx+3-67*a,hx=cx+79-58*a
    person(p,hx,floor+13,details.heirAvatar,a<1?'left':'up','writer',false,a<1,t)
    if(a<1)person(p,px,floor+13,details.parentAvatar,'left','writer',false,true,t)
    else{p(cx-69,floor+3,'#b6a17a',27,4);p(cx-66,floor+7,'#816547',3,7);p(cx-48,floor+7,'#816547',3,7);person(p,cx-65,floor+12,details.parentAvatar,'right','writer',true)}
    person(p,cx-104,floor+20,avatar,'right')
  }
}
