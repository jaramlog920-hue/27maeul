import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {Facing} from '../engine/types'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {spriteRows,writerPalette,PALETTE,type Pose} from './sprites'
import {drawMarketSquareBackground} from './market-square-background'
import {drawHomeYardBackground} from './home-yard-background'
import {drawBakeryFrontBackground} from './bakery-front-background'
import {meetingEmoteRows,MEETING_PALETTE} from './village-followup-art'

export const SQUARE_REMAINDER_IDS=['village:1','village:2','saw:bread:swap','village:4'] as const
export const isSquareRemainder=(id:string)=>(SQUARE_REMAINDER_IDS as readonly string[]).includes(id)
export function squareRemainderPeople(id:string):string[]{
 if(id==='village:1')return []
 if(id==='saw:bread:swap')return ['poppy','wendell']
 return id==='village:2'?['baker','child','postman']:['baker','grandpa','child']
}

export function drawSquareRemainder(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8
 g.imageSmoothingEnabled=false
 const actor=(a:FinalePerson|null,x:number,face:Facing='down',pose:Pose='stand',walk=false)=>{
  const av0=a?a.avatar:av,full=av0?withLookDefaults(av0):undefined,who=a?a.who:'writer'
  const rows=spriteRows(who,face,{avatar:full,pose,frame:walk?(Math.floor(t*3)%2?1:2):0,blink:false,growth:1,short:a?.short})
  const pal=who==='writer'?writerPalette('spring',full):PALETTE
  rows.forEach((r,y)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,ground-rows.length*2+y*2,pal[c],2,2)}))
  return {rows,top:ground-rows.length*2,pal}
 }
 const flowers=(x:number,y:number,seed:number)=>{
  // Same three two-pixel blossoms and palette as decor.ts's actual north-road flowers.
  const colors=['#f59eaf','#eed584','#ffffff','#bd94e9']
  for(let i=0;i<3;i++)p(x+2+(seed*7+i*5)%11,y+3+(seed*3+i*4)%10,colors[(seed+i)%4],2,2)
 }
 if(id==='village:1'){
  drawHomeYardBackground(p,w,h,f-15)
  // Two grassy verges beside the north road, never flowers across the walking lane or garden.
  p(cx-22,ground-27,'#b6c591',154,15);p(cx-17,ground+13,'#b6c591',154,17)
  for(let i=0;i<8;i++){flowers(cx-17+i*18,ground-28,i);flowers(cx-12+i*18,ground+13,i+3)}
  person(p,cx-52,ground,av,beat?'down':'right','writer',false,beat===0,t)
  return
 }
 if(id==='village:2'){
  drawBakeryFrontBackground(p,w,h,f-3,true)
  // A visit at a real neighbor's door; the knock does not accept a dinner invitation.
  actor(null,cx-49,beat?'down':'right')
  if(beat===0){const skin=writerPalette('spring',av?withLookDefaults(av):undefined).s;p(cx-31+(Math.floor(t*4)%2),ground-14,skin,2,2)}
  actor(npc,cx+14,'down',beat?'wave':'stand')
  if(others[0])actor(others[0],cx+67,'down',beat?'wave':'stand')
  if(others[1])actor(others[1],cx-113,beat?'down':'right',beat?'wave':'stand',beat===0)
  return
 }
 if(id==='village:4'){
  drawMarketSquareBackground(p,w,h,f-15,false,false,false)
  actor(null,cx-38,beat?'down':'right')
  const cast=[npc,...others],xs=[cx-106,cx+16,cx+64]
  cast.forEach((a,i)=>{
   const info=actor(a,xs[i],'down',beat===0||i===1?'wave':'stand')
   if(beat===0)meetingEmoteRows('talk').forEach((r,y)=>[...r].forEach((c,x)=>{if(MEETING_PALETTE[c])p(xs[i]+3+x,info.top-17+y,MEETING_PALETTE[c])}))
  })
  return
 }
 drawMarketSquareBackground(p,w,h,f-15,true,false,false)
 const table=(x:number)=>{p(x,ground-5,'#b49469',25,4);p(x+2,ground-1,'#745638',3,9);p(x+20,ground-1,'#745638',3,9)}
 table(cx-89);table(cx+78)
 const loaf=(x:number,y:number,bitten=false)=>{p(x,y,'#b28754',9,5);p(x+1,y-2,'#dab581',7,5);p(x+3,y-1,'#eee0b6',1,2);p(x+6,y-1,'#eee0b6',1,2);if(bitten){p(x+7,y-2,'#e8d3a6',1,3);p(x+8,y-2,'#c6b28a',1,3)}}
 const cookie=(x:number,y:number,bitten=false)=>{p(x+1,y,'#bd9562',5,5);p(x,y+1,'#bd9562',7,3);p(x+2,y+1,'#8d6847',1,1);p(x+4,y+3,'#8d6847',1,1);if(bitten)p(x+5,y,'#e7c897',2,2)}
 // IDs follow the original cast: poppy is Wendell, wendell is Poppy in the game's current names.
 const poppy=npc,wendell=others[0]
 const px=beat===0?cx-112:beat===1?cx+56:cx+92,wx=beat===0?cx-63:beat===1?cx+102:cx-110
 actor(null,cx-5,'down')
 const hat=(a:FinalePerson,x:number,face:Facing)=>{
  const info=actor(a,x,face),first=info.rows.findIndex(r=>/[^.]/.test(r)),y=info.top+Math.max(0,first)*2
  // Cap rests above the original hair silhouette; no face/hair pixels are painted over.
  p(x+3,y-6,'#987754',13,4);p(x,y-2,'#b59770',20,2)
 }
 hat(poppy,px,beat===0?'right':beat===1?'right':'down')
 if(wendell)hat(wendell,wx,beat===0?'left':beat===1?'left':'down')
 if(beat===0){
  loaf(wx-9,ground-13);cookie(cx+86,ground-10)
  p(cx-86,ground-8,'#cfb16f',3,2)
 }else if(beat===1){
  cookie(px+18,ground-13)
  p(wx+20,ground-3,'#a58258',13,2);p(wx+21,ground-1,'#76583e',2,2);p(wx+30,ground-1,'#76583e',2,2)
  loaf(wx+21,ground-8)
  p(cx+95,ground-8,'#cfb16f',3,2)
 }else{
  // Both bought goods now have a bite; kept below the faces in their short native hands.
  loaf(wx-9,ground-13,true);cookie(px+20,ground-13,true)
 }
}
