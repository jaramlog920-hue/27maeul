import {drawEventPrecipitation} from './event-precipitation'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {ICONS,ICON_PALETTE,spriteRows} from './sprites'
import type {Facing} from '../engine/types'

/** 정수 좌표·원본 끈·날씨만 공유한다. 장소와 사건 동작은 개별 장면에서 그린다. */
export function proposalDrawing(g:CanvasRenderingContext2D,w:number,h:number,t:number,context:ProposalArtContext){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52)),foot=f+14,night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 g.imageSmoothingEnabled=false
 const cord=(x:number,y:number)=>ICONS.promiseCord.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&ICON_PALETTE[c])p(x+xx,y+yy,ICON_PALETTE[c])}))
 const knot=(npc:FinalePerson,x:number,facing:Facing)=>{
  const rows=spriteRows(npc.who,facing,{frame:0,blink:false,avatar:npc.avatar?withLookDefaults(npc.avatar):undefined})
  const row=rows.findIndex((r,i)=>i>=9&&r.includes('s')),col=row<0?3:rows[row].indexOf('s'),hx=x+col*2,hy=foot-rows.length*2+(row<0?10:row)*2
  p(hx,hy,ICON_PALETTE.r,2,1);p(hx,hy+1,ICON_PALETTE.N,2,1);p(hx-1,hy+1,ICON_PALETTE.r);p(hx+2,hy+1,ICON_PALETTE.r);p(hx,hy+2,ICON_PALETTE.r,1,2)
 }
 const weather=()=>{if(!context.indoors){if(context.snow)p(0,f+3,'#d9dccb',w,3);if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)}}
 return {p,cx,f,foot,night,evening,cord,knot,weather}
}
