import {drawWindowPrecipitation} from './event-precipitation'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'
export type HallPixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** Hall wall boards, cushions and lamps reuse the room's existing native furniture. */
export function hallFurniture(p:HallPixel,id:string,x:number,y:number,scale=2){
 const art=FURNITURE_ART[id];art?.rows.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c!=='.'&&FURNI_PALETTE[c])p(x+xx*scale,y+yy*scale,FURNI_PALETTE[c],scale,scale)}))
}
export function drawHallRoomBackground(p:HallPixel,w:number,h:number,f:number,rain=false,night=false,t=0){
 const cx=Math.round(w/2),edge=f-(night?50:18),wy=f-(night?93:87)
 p(0,0,night?'#b7a286':'#d1c0a6',w,h);p(0,edge,'#b09572',w,h-edge)
 for(let y=edge+1;y<h;y+=18)p(0,y,'#9c7b58',w,1)
 p(0,edge-2,'#947450',w,3)
 p(cx-138,wy,'#a78a60',43,42);p(cx-135,wy+3,night?'#596675':rain?'#9aafb0':'#bbd8c8',37,36)
 p(cx-118,wy+3,'#a78a60',3,36);p(cx-135,wy+20,'#a78a60',37,3)
 if(rain)drawWindowPrecipitation(p,cx-135,wy+3,37,36,t,(x,y)=>!(x>=cx-118&&x<cx-115)&&!(y>=wy+20&&y<wy+23))
 hallFurniture(p,'lampStand',cx+112,f-48)
 hallFurniture(p,'mat',cx-139,f+18)
}
