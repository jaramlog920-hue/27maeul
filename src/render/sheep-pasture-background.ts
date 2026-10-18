import {drawPastureGround} from './pasture-ground'
import {SHEEP,SMALL_PALETTE} from './sprites'
export function drawSheepPastureBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,floor:number,livestock=true){
 const cx=Math.round(w/2)
 const stamp=(rows:readonly string[],palette:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&palette[c])p(x+xx*scale,y+yy*scale,palette[c],scale,scale)}))
 drawPastureGround(p,w,h,floor)
 // 양은 기존 마을의 작은 양 도트를 그대로 사용한다.
 if(livestock)stamp(SHEEP,SMALL_PALETTE,cx-101,floor-28,2)
 if(livestock)stamp(SHEEP,SMALL_PALETTE,cx-72,floor-42,2)
 const post=(x:number)=>{p(x,floor-26,'#a38760',4,35);p(x+1,floor-26,'#c0a67c',2,4)}
 p(0,floor-17,'#b69a70',cx-51,3);p(0,floor-5,'#a68b62',cx-51,3)
 for(let x=14;x<cx-42;x+=31)post(x)
 p(cx+89,floor-16,'#a18660',w-cx-89,3);post(cx+95);post(cx+125)
}
