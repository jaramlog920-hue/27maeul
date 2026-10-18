import {drawSheepPastureBackground} from './sheep-pasture-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

export function drawLightShoes(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,shepherd:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h*(h<=170?.65:.52))
 const stamp=(rows:readonly string[],palette:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((row,yy)=>[...row].forEach((c,xx)=>{if(c!=='.'&&palette[c])p(x+xx*scale,y+yy*scale,palette[c],scale,scale)}))
 drawSheepPastureBackground(p,w,h,floor)
 // 울타리 옆의 낮은 돌: 신을 바닥 가까이 놓고 살펴볼 자리.
 p(cx+33,floor+16,'#9e9d87',29,7);p(cx+36,floor+13,'#bab69d',23,5)
 p(cx+40,floor+12,'#c8c1a7',15,2)
 person(p,cx-32,floor+26,shepherd.avatar,'right',shepherd.who)
 person(p,cx+(beat>=2?18:11),floor+26,avatar,beat>=2?'right':'left','writer',beat>=2)
 // 품에서 꺼낼 작은 가죽 주머니는 허리 높이에 둔다.
 if(beat===0){p(cx-20,floor+13,'#927452',7,6);p(cx-21,floor+12,'#c2a47b',9,2)}
 else if(beat===1){
  p(cx-14,floor+9,'#bca178',2,5);p(cx-13,floor+12,'#bca178',4,1);p(cx-10,floor+13,'#bca178',1,3)
  stamp(ICONS.lightShoes,ICON_PALETTE,cx-18,floor+10)
  stamp(ICONS.lightShoes.map(row=>[...row].reverse().join('')),ICON_PALETTE,cx-10,floor+13)
 }else{
  // 같은 가방 아이콘의 가죽끈·밑창. 받는 대사까지 넘어가야 돌 위에 놓인다.
  stamp(ICONS.lightShoes,ICON_PALETTE,cx+37,floor+5)
  stamp(ICONS.lightShoes.map(row=>[...row].reverse().join('')),ICON_PALETTE,cx+48,floor+5)
  // 끈의 매듭을 잠깐 강조하며 실제 팔과 다리는 기존 앉은 자세를 유지한다.
  if(Math.floor(t*2)%2===0){p(cx+41,floor+8,'#f0e2bf',1,2);p(cx+51,floor+8,'#f0e2bf',1,2)}
 }
 // 신을 벗거나 새로 받는 게임 보상은 여기서 발생시키지 않는다.
 for(let i=0;i<7;i++)p(16+i*43,floor+35+(i*7)%20,'#b7a17c',2,1)
}
