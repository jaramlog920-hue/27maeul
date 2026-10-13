import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {BABY,SMALL_PALETTE,PALETTE,spriteRows,writerPalette} from './sprites'

export type TripChild=FinalePerson&{baby?:boolean}
export function drawFamilyTrip(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,child:TripChild,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h*(h<=170?.65:.52))
 const childAt=(x:number,foot:number,facing:'left'|'right',walk:boolean,point=false)=>{
  if(child.baby){BABY.baby.forEach((r,y)=>[...r].forEach((c,xx)=>{if(c!=='.'&&SMALL_PALETTE[c])p(x+xx*2,foot-20+y*2,SMALL_PALETTE[c],2,2)}));return}
  const av=child.avatar?withLookDefaults(child.avatar):undefined,pal=child.who==='writer'?writerPalette('spring',av):PALETTE
  const rows=spriteRows(child.who,facing,{avatar:av,look:av?.look,short:child.short,frame:walk?(Math.floor(t*3)%2?1:2):0,blink:false,pose:point?'handUp':'stand'})
  rows.forEach((r,y)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,foot-rows.length*2+y*2,pal[c],2,2)}))
 }
 if(beat===0){
  p(0,0,'#d4d9c3',w,h);p(0,floor-10,'#b8c399',w,h-floor+10);p(0,floor+7,'#c8b58f',w,h-floor-7)
  // 낯선 마을의 낮은 집들과 돌길. 캐릭터는 원래 키로 나란히 걷는다.
  for(const [dx,wall,roof] of [[-124,'#d9c7a5','#b27e68'],[-34,'#d8c3a1','#9f947b'],[58,'#dfcca8','#a47b68']] as const){
   const x=cx+dx,y=floor-65
   p(x,y,wall,68,65);p(x-4,y-18,roof,76,20);p(x-4,y+1,'#907059',76,3)
   for(let ry=y-14;ry<y;ry+=5)p(x-1,ry,'#bc9577',70,1)
   p(x+27,floor-33,'#907458',17,33);p(x+29,floor-31,'#705d48',13,31)
   p(x+8,floor-44,'#af936f',13,17);p(x+10,floor-42,'#d4dcc1',9,13)
   p(x+51,floor-44,'#af936f',11,17);p(x+53,floor-42,'#c8d0af',7,13)
  }
  for(let i=0;i<12;i++){const x=12+i*27,y=floor+11+(i%2)*11;p(x,y,'#b7a787',17,5);p(x+1,y,'#d0c1a0',15,1)}
  p(cx+114,floor-9,'#b58c67',13,10);p(cx+116,floor-11,'#c7a179',9,3)
  const move=Math.min(1,t/4)*18,foot=floor+26,playerX=cx-28+move
  person(p,playerX,foot,avatar,'right','writer',false,t<4,t)
  childAt(child.baby?playerX+10:cx+5+move,foot,'right',t<4)
  p(cx-108,floor-5,'#9b895f',13,7);p(cx-107,floor-3,'#c0ae80',11,5)
 }else{
  p(0,0,'#d9c9b1',w,h);p(0,floor-53,'#adbbad',w,25);p(0,floor-28,'#8ea9a4',w,h-floor+28)
  for(let i=0;i<28;i++){const x=(i*43+Math.floor(t*3))%w,y=floor-22+(i*17)%Math.max(15,h-floor+20);p(x,y,i%2?'#b1c0b4':'#77948e',13,1)}
  // 멀어진 육지의 지붕과 나루: 돌아오는 배임을 구분한다.
  for(let i=0;i<5;i++){const x=12+i*25;p(x,floor-51-i%2*3,'#a09d83',19,12);p(x-2,floor-55-i%2*3,'#aa846e',23,4)}
  p(12,floor-34,'#8d795e',100,3);for(let x=21;x<111;x+=25)p(x,floor-34,'#8d795e',2,14)
  const deck=floor+15
  p(cx-116,deck-5,'#b29870',232,43);p(cx-108,deck,'#d0b38b',216,33)
  for(let y=deck+5;y<deck+31;y+=7)p(cx-108,y,'#b2946b',216,1)
  p(cx-57,deck-60,'#8d7352',4,61);p(cx-53,deck-55,'#d9ccb0',48,39)
  for(let y=0;y<37;y++)p(cx-53,deck-55+y,'#e5d9bd',Math.max(3,47-y),1)
  p(cx-72,deck+1,'#ab8e63',24,11);p(cx-72,deck+4,'#7c6549',24,1)
  const foot=deck+24
  person(p,cx-13,foot,avatar,'right')
  childAt(child.baby?cx-3:cx+20,foot,'left',false,true)
  // 난간은 몸 뒤쪽과 발 아래에만 둔다. 엉덩이와 발을 가로질러 가리지 않는다.
  p(cx-116,deck-8,'#947953',232,3)
  for(const x of [cx-115,cx+110]){p(x,deck-7,'#947953',5,42);p(x-2,deck-11,'#bd9e75',9,4)}
  p(cx-116,deck+34,'#947953',232,5);p(cx-116,deck+33,'#c5a77c',232,2)
 }
}
