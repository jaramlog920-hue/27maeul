import {drawEventPrecipitation} from './event-precipitation'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE,SHEEP,SMALL_PALETTE,PALETTE,writerPalette} from './sprites'
import {withLookDefaults} from '../engine/avatar'

export type ProposalArtContext={minute:number;indoors:boolean;wet:boolean;snow?:boolean;at?:{x:number;y:number}}
/** 덱스터가 끈을 받아 양을 지키듯 곁을 지키겠다고 약속한다. */
export function drawDexterProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const portrait=h>w,cx=Math.round(w/2),floor=Math.round(h*(portrait?.62:.52)),night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020
 g.imageSmoothingEnabled=false
 if(context.indoors){
  p(0,0,night?'#7d786b':'#c5b89d',w,h);p(0,floor-20,night?'#82735e':'#ac8f67',w,h-floor+20)
  for(let y=floor-12;y<h;y+=9)p(0,y,night?'#776953':'#a1835d',w,1)
  p(cx-106,floor-81,'#8c785a',46,43);p(cx-102,floor-77,night?'#4c5a68':'#b6cdb8',38,35)
  p(cx-85,floor-77,'#8c785a',3,35);p(cx-102,floor-60,'#8c785a',38,2)
  // 집 안에서는 양을 넣지 않고 접힌 담요와 양털 바구니만 남긴다.
  p(cx+68,floor-10,'#987957',30,13);p(cx+70,floor-14,'#d4c9ae',26,7)
  for(let x=cx+74;x<cx+97;x+=6)p(x,floor-8,'#b19770',2,9)
  p(cx+73,floor-13,'#b6b59b',20,2)
 }else{
  const sky=night?'#424e64':evening?'#cdb8aa':context.wet?'#b1bfba':'#d5dfc8'
  p(0,0,sky,w,h)
  for(let x=0;x<w;x+=4){const ridge=floor-46+Math.round(Math.sin(x/w*6)*9);p(x,ridge,night?'#64765c':'#a5b78a',4,h-ridge);p(x,ridge+13,night?'#586b54':'#91a675',4,h-ridge)}
  p(0,floor-7,night?'#8a9270':'#b5bd8b',w,h-floor+7);p(0,floor+17,night?'#9c9479':'#c5b28d',w,h-floor-17)
  for(let i=0;i<22;i++)p((i*59+11)%w,floor-33+(i*13)%36,night?'#768c68':'#78975f',2,2)
  for(let x=5;x<cx-48;x+=30){p(x,floor-25,'#ad926b',3,39);p(x+1,floor-25,'#cfb48a',1,4)}
  p(0,floor-16,'#b2986e',cx-48,3);p(0,floor-4,'#a48b63',cx-48,3)
  stamp(SHEEP,SMALL_PALETTE,cx-113,floor-26,2);stamp(SHEEP,SMALL_PALETTE,cx-78,floor-38,2)
  if(context.snow)p(0,floor+17,'#d4d8ca',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
 const foot=floor+14
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,npc.avatar,'left',npc.who)
 // 원래 약속의 끈. 건넨 뒤에는 상대 손 곁에 남기고 같은 끈을 두 개로 늘리지 않는다.
 stamp(ICONS.promiseCord,ICON_PALETTE,cx+(beat>=1?5:-4),foot-13)
 const receiver=npc.who==='writer'?writerPalette('spring',npc.avatar?withLookDefaults(npc.avatar):undefined):PALETTE
 if(beat>=1)p(cx+8,foot-8,receiver.s,2,2)
}
