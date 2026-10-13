import type {Avatar} from '../engine/avatar'
import {person} from './milestone-moments-art'

/** 「한 권 더」: 서고의 낮은 빈 칸에 완성본 한 권을 꽂는다. */
export function drawOneMoreBook(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
 const cx=Math.round(w/2),floor=Math.round(h<=170?h*.71:Math.min(h*.54,h-90)),sx=cx-82
 p(0,0,'#c9b6a0',w,h);p(0,floor,'#a48567',w,h-floor)
 for(let y=floor+7;y<h;y+=9)p(0,y,'#927457',w,1)
 p(0,floor-2,'#8d7257',w,3)
 // 서고 창가의 빛과 두 층짜리 낮은 선반. 새 책 칸은 손 높이에 있다.
 p(cx+61,floor-89,'#846b54',42,56);p(cx+64,floor-86,'#c4d5ca',36,50)
 p(cx+81,floor-86,'#a38968',2,50);p(cx+64,floor-63,'#a38968',36,2)
 p(cx+57,floor-34,'#b69671',50,3)
 p(sx-4,floor-71,'#6a5341',126,73);p(sx,floor-67,'#493e36',118,67)
 for(const y of [floor-36,floor-9])p(sx-4,y,'#b0916e',126,4)
 p(sx-4,floor-71,'#b0916e',126,4)
 for(let i=0;i<8;i++){
  const x=sx+7+i*12,y=floor-61
  p(x,y,['#8e6955','#7b947a','#c7ad7a','#8e829c'][i%4],7,24)
  p(x+1,y+4,'#d7c7a7',5,1);p(x+1,y+20,'#d7c7a7',5,1)
 }
 for(let i=0;i<4;i++){const x=sx+7+i*12;p(x,floor-31,'#8e6955',7,21);p(x+1,floor-27,'#d7c7a7',5,1)}
 // 移動は整数ドットのみ。腕を伸ばさず、体のすぐ脇から一冊だけ置く。
 const travel=Math.min(8,Math.floor(Math.max(0,t)*4)),bx=sx+62-8+travel,by=floor-21
 p(bx,by,'#7b947a',8,12);p(bx+1,by+2,'#a5b39a',5,8)
 p(bx+1,by+5,'#e0cda6',5,2);p(bx+1,by+10,'#e0cda6',5,1)
 // 人物は最後に描き、顔と短い手を本棚の前に保つ。
 person(p,sx+35,floor+2,avatar,'right')
 p(cx+115,floor+5,'#927556',23,4);p(cx+118,floor+9,'#795d45',3,12);p(cx+131,floor+9,'#795d45',3,12)
}
