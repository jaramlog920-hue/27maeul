import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {writerPalette,PALETTE} from './sprites'
import {drawHallRoomBackground,hallFurniture} from './hall-room-background'
export const HALL_EVENT_IDS=['growth:board','ev:juniper:rainDraw','ev:cosmo:nets','ev:cosmo:small:rainCraft','ev:tilly:small:rainFile','ev:tilly:file','hallNight','ev:juniper:small:newCover','growth:board:full','growth:community','growth:community:full'] as const
export const isHallEvent=(id:string)=>(HALL_EVENT_IDS as readonly string[]).includes(id)
export function hallEventPeople(id:string):string[]{return id==='hallNight'?['baker','grandpa','fisher']:id.startsWith('ev:')?[id.split(':')[1]]:[]}
/** Each prop follows the original dialogue; future proposals never become finished buildings. */
export function drawHallEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25
 const night=id==='hallNight',board=id.startsWith('growth:'),juniper=id.includes('juniper'),cosmo=id.includes('cosmo'),sit=!board
 g.imageSmoothingEnabled=false;drawHallRoomBackground(p,w,h,f,!board&&!night,night,t)
 const paper=(x:number,y:number,a=24,b=16)=>{p(x,y,'#f4e8ca',a,b);p(x+2,y+2,'#c6b18c',a-4,1)}
 const table=(x:number,y:number,a:number)=>{p(x,y,'#ba9a70',a,4);p(x+2,y+4,'#7e5e42',3,13);p(x+a-5,y+4,'#7e5e42',3,13)}
 const skin=(actor:FinalePerson|null)=>{const v=actor?actor.avatar:av;return actor&&actor.who!=='writer'?PALETTE.s:writerPalette('spring',v?withLookDefaults(v):undefined).s}
 const hand=(x:number,y:number,actor:FinalePerson|null)=>p(x,y,skin(actor),2,2)
 const bee=(x:number,y:number,legs:number)=>{p(x+2,y,'#d4b66c',8,4);p(x+5,y,'#6d6653',1,4);p(x+9,y+1,'#6d6653',3,2);p(x+3,y-2,'#bbcfcd',3,2);p(x+6,y-2,'#bbcfcd',3,2);for(let i=0;i<legs/2;i++){p(x+2+i*2,y+4,'#6d6653',1,2);p(x+2+i*2,y-3,'#6d6653',1,1)}}
 if(board){
  const x=cx-26,y=f-87,a=104
  p(x,y,'#a5713d',a,64);p(x+3,y+3,'#ce9759',a-6,58)
  const full=id.endsWith(':full'),community=id.includes('community'),count=community?(full?3:1):full?5:1
  for(let i=0;i<count;i++){const xx=x+9+(i%3)*29,yy=y+9+Math.floor(i/3)*27;paper(xx,yy,23,22);p(xx+11,yy,'#e35427',2,2)
   if(community){
    if(i===0){p(xx+3,yy+7,'#80999b',17,2);p(xx+3,yy+12,'#80999b',17,2);p(xx+5,yy+8,'#80999b',1,10);p(xx+17,yy+8,'#80999b',1,10)}
    else if(i===1){p(xx+3,yy+15,'#80999b',17,3);for(let k=0;k<3;k++){p(xx+6+k*5,yy+8,'#80999b',1,7);p(xx+4+k*5,yy+7,'#b59888',5,3)}}
    else{p(xx+3,yy+9,'#80999b',17,2);p(xx+5,yy+10,'#80999b',1,8);p(xx+17,yy+10,'#80999b',1,8);p(xx+6,yy+6,'#80999b',11,2)}
   }
   else if(i===0){p(xx+5,yy+8,'#c59561',13,7);p(xx+7,yy+7,'#d7ae76',9,2);for(let j=0;j<3;j++)p(xx+7+j*3,yy+9,'#f1ce96',1,3)}
   else for(let j=0;j<3;j++)p(xx+4,yy+7+j*4,'#aa9876',14-j*2,1)
  }
  // One sheet is still an invitation to browse, not a completed project or claimed reward.
  person(p,cx-70,ground,av,'right','writer');return
 }
 if(night){
  table(cx-136,f-24,273);hallFurniture(p,'teapot',cx-12,f-39,1);hallFurniture(p,'fruitBowl',cx+22,f-39,1)
  if(beat>=1){paper(cx-29,f-36,20,12);p(cx-20,f-32,'#8e785d',3,4)}
  const cast=[{avatar:av,who:'writer' as const},npc,...others]
  cast.forEach((a,i)=>{const columns=Math.ceil(cast.length/2),x=cx-(columns-1)*25-10+Math.floor(i/2)*50,y=ground-i%2*36;hallFurniture(p,'pillows',x-5,y-20,2);person(p,x,y,a.avatar,i%2?'left':'right',a.who,true)})
  if(beat>=2){p(cx+70,f-56,'#b59b6d',3,1);p(cx+74,f-60,'#b59b6d',1,2)}
  return
 }
 hallFurniture(p,'pillows',px-5,ground-20);hallFurniture(p,'pillows',nx-5,ground-20)
 table(cx-25,f+7,48)
 person(p,px,ground,av,'right','writer',sit);person(p,nx,ground,npc.avatar,'left',npc.who,sit)
 const x=nx-26,y=ground-12
 if(juniper){
  const cover=id.endsWith('newCover');paper(x,y,24,15)
  if(cover){p(x,y,'#7b9d93',2,15);if(beat===0&&Math.floor(t*2)%2===0){p(x+7,y+6,'#b2a58a',8,1);p(x+10,y+2,'#dfd8c4',5,3)}else bee(x+5,y+6,6)
   if(choice===1){p(x+7,y+12,'#759264',8,2);p(x+10,y+9,'#759264',2,5)}
  }else{bee(x+4,y+6,8);if(choice===0){paper(px+22,y,24,15);bee(px+24,y+6,10);hand(px+20,y+3,null)}
   if(choice===1&&beat>=2){for(let i=0;i<4;i++)p(x+4+i*3,y+12,'#9a8568',2,1)}
  }
  p(x+19,y-2,'#826d51',2,8);hand(nx-2,y+2,npc)
 }else if(cosmo){
  p(x,y+2,'#b9aa8a',24,11)
  if(id.endsWith(':nets')){for(let i=0;i<7;i++){p(x+i*3,y+2,'#807963',1,12);p(x,y+2+i*2,'#807963',24,1)}p(x+17,y-2,'#c2c7ba',1,9)
   if(choice===0){p(px+22,y+7,'#807963',30,1);hand(px+20,y+7,null)}
   if(choice===1){for(let i=0;i<3;i++){p(nx-4-i*3,y+4,'#b77f65',1,1);p(px+19-i*3,y+4,'#b77f65',1,1)}}
  }else{for(let i=0;i<4;i++){p(x+3+i*5,y+1,'#dcc7a0',1,12);p(x+2+i*5,y+5,'#8d7758',3,2);p(x+2+i*5,y+10,'#eee0bf',3,3)}
   if(choice===0){p(px+22,y+7,'#dcc7a0',30,1);hand(px+20,y+7,null)}
   if(choice===1){p(x+3,y-1,'#dcc7a0',16,1)}
  }
  hand(nx-2,y+2,npc)
 }else{
  const leaf=id==='ev:tilly:file',hidden=leaf&&choice==null
  if(hidden){if(beat>=2)p(nx+21,ground-14,'#a6aba0',3,2)}
  else if(leaf){const lx=choice===2&&beat>=4?cx-7:nx-5,ly=choice===2&&beat>=4?f+3:ground-11
   p(lx,ly,'#929e91',6,3);p(lx+2,ly-1,'#b5c0af',3,1);p(lx+1,ly+1,'#d3d6bf',4,1)
   if(choice!==2||beat<4)hand(nx-2,ground-8,npc)
  }else{p(x,y+2,'#d3c4a5',24,11);p(x+12,y+5,'#939b91',7,1);p(x+12,y+8,'#939b91',7,1);p(x+11,y+6,'#939b91',1,2);p(x+19,y+6,'#939b91',1,2);p(x+7,y+4,'#c0c6ba',12,2);p(x+4,y+4,'#806448',3,2);hand(nx-2,y+2,npc)
   if(choice===1&&beat>=2){p(x+13,y+6,'#d4d7c4',4,1);hand(nx-2,y+4,npc)}
  }
 }
}
