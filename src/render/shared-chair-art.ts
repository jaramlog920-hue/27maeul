import {drawCarpenterRoomBackground} from './carpenter-room-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'

/** 목수·루디·대장장이가 각자 만든 부품을 기존 마을 의자로 조립하는 저녁. */
export function drawSharedChair(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,carpenter:FinalePerson,rudy:FinalePerson,smith:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h*(h<=170?.53:.43))
 drawCarpenterRoomBackground(p,w,h,floor)
 // 이미 식은 쇠 부품은 작업대 위. 불이나 뜨거운 빛을 넣지 않는다.
 person(p,cx-94,floor+8,smith.avatar,'right',smith.who)
 p(cx-109,floor+1,'#b49469',43,5);p(cx-104,floor+6,'#745638',3,13);p(cx-73,floor+6,'#745638',3,13)
 for(let i=0;i<2;i++){p(cx-101+i*17,floor-5,'#67736e',11,6);p(cx-100+i*17,floor-5,'#acb6aa',9,2);p(cx-97+i*17,floor-2,'#454f49',2,2)}
 p(cx-105,floor+26,'#c1a675',19,2);p(cx-89,floor+23,'#a08559',5,3)
 // 받침을 지지하는 루디와 이음새를 보는 목수. 기본 키와 팔 길이를 유지한다.
 person(p,cx-28,floor+40,rudy.avatar,'right',rudy.who)
 const legShift=beat>=2?Math.round(8*(1-Math.min(1,t/2))):8
 person(p,cx+20+legShift,floor+40,carpenter.avatar,'left',carpenter.who,beat>=2)
 const rows=FURNITURE_ART.chair.rows,chairX=cx-13,chairY=floor+12
 rows.forEach((row,y)=>[...row].forEach((c,x)=>{
  if(c==='.'||!FURNI_PALETTE[c])return
  // 오른쪽 다리는 두 번째 대사까지 분리되어 있다가 세 번째 대사에서 끼워진다.
  const leg=y>=10&&y<=12&&x>=12
  const shift=leg?legShift:0
  p(chairX+x*2+shift,chairY+y*2,FURNI_PALETTE[c],2,2)
 }))
 if(beat>=2){p(cx+14,floor+29,'#7e8a7e',4,4);p(cx+15,floor+30,'#c4cab8',2,1);p(cx+16,floor+32,'#475749',1,1)}
 // 기록자는 작업 통로 바깥에서 지켜본다. 선택 뒤 손일은 기존 hold 놀이가 맡는다.
 person(p,cx+92,floor+40,avatar,'left')
 p(cx+52,floor+27,'#8b7251',24,4);p(cx+53,floor+31,'#b49668',22,2)
 p(cx+51,floor+24,'#7b6445',14,2);p(cx+61,floor+22,'#a0a797',5,5)
 for(let i=0;i<7;i++)p(cx-51+i*13,floor+48+i%2*4,'#c3a77b',3,1)
}
