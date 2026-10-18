import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawTeaRoomBackground} from './tea-room-background'
import {drawTeaFrontBackground} from './tea-front-background'
import {drawBakeryFrontBackground} from './bakery-front-background'
import {writerPalette,PALETTE} from './sprites'
export const SHOP_REMAINDER_IDS=['teaFirst','date:tea:2','ev:tilly:bread','ev:penelope:teaOrder','ev:poppy:love:2','ev:poppy:sister','date:tea:0','date:tea:1'] as const
export const isShopRemainder=(id:string)=>(SHOP_REMAINDER_IDS as readonly string[]).includes(id)
export const isShopDate=(id:string)=>id==='date:tea:0'||id==='date:tea:1'||id==='date:tea:2'
export function shopRemainderPeople(id:string){return id==='teaFirst'?[]:id==='ev:tilly:bread'?['tilly','wendell']:id==='ev:penelope:teaOrder'?['penelope','poppy']:isShopDate(id)?['wendell']:['poppy']}
export function drawShopRemainder(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=f+8,px=cx-55,nx=cx+25,x=cx-3,bread=id==='ev:tilly:bread',out=id==='ev:poppy:love:2'||id==='ev:poppy:sister',date=isShopDate(id),split=bread&&choice===2&&beat>=5
 g.imageSmoothingEnabled=false
 if(bread)drawBakeryFrontBackground(p,w,h,f-18,true)
 else if(out)drawTeaFrontBackground(p,w,h,f-18)
 else drawTeaRoomBackground(p,w,h,f-22)
 if(id==='teaFirst'){
  // The first tea is alone at the existing window; no invented host or partner.
  p(cx-39,ground+3,'#b6986b',38,4);p(cx-36,ground+7,'#876a4b',3,12);p(cx-6,ground+7,'#876a4b',3,12)
  person(p,px,ground,av,'right','writer',true)
  const held=beat>=1,xx=held?px+14:cx-30,yy=held?ground-9:ground-3
  p(xx,yy,'#ddd7ba',7,6);p(xx+1,yy+1,'#ab8b60',5,2);p(xx+7,yy+1,'#c5ba9a',2,3)
  p(xx+3,yy-6-Math.round(Math.sin(t*2)),'#e7dfc6',1,4)
  p(cx-8,ground-2,'#a98668',7,5);p(cx-7,ground-5,'#b6a177',5,3)
  return
 }
 const cup=(xx:number,yy:number,flower=false)=>{p(xx,yy,'#ddd7ba',7,6);p(xx+1,yy+1,flower?'#c6a183':'#ab8b60',5,2);p(xx+7,yy+1,'#c5ba9a',2,3)}
 const paper=(xx:number,yy:number,a=25,b=15)=>{p(xx,yy,'#eee0bf',a,b);for(let i=0;i<3;i++)p(xx+3,yy+3+i*4,'#b39e7c',a-7-i%2*5,1)}
 const hand=(xx:number,yy:number,a:FinalePerson|null)=>{const v=a?a.avatar:av,pal=a&&a.who!=='writer'?PALETTE:writerPalette('spring',v?withLookDefaults(v):undefined);p(xx,yy,pal.s,2,2)}
 // Place service tables between people and below the hands, never across torsos.
 if(bread||date||id==='ev:penelope:teaOrder'){p(x-6,ground+7,'#b6986b',47,4);p(x-3,ground+11,'#876a4b',3,12);p(x+35,ground+11,'#876a4b',3,12)}
 const tap=bread&&choice===1&&beat>=4,ox=tap?cx+52:cx+70
 person(p,px,ground,av,'right','writer',date)
 person(p,nx,ground,npc.avatar,'left',npc.who,date)
 others.forEach((a,i)=>person(p,ox+i*30,ground,a.avatar,'left',a.who))
 if(bread){
  if(!split){p(x,ground-2,'#bc985e',25,10);p(x+2,ground-4,'#d4b478',21,4);for(let i=0;i<4;i++)p(x+4+i*5,ground,'#76815c',3,3)}
  else {for(const [dx,width] of [[0,14],[19,10]]){p(x+dx,ground-1,'#bc985e',width,9);p(x+dx+2,ground-3,'#d4b478',width-3,3);p(x+dx+width-2,ground,'#ead3a0',2,6);p(x+dx+3,ground,'#76815c',3,3)}hand(nx-2,ground-8,npc)}
  if(tap){hand(nx+23,ground-15,npc);hand(ox-2,ground-14,others[0])}
 }else if(id==='ev:penelope:teaOrder'){
  // Menu stays on the low service board. The choice determines the actual two cups.
  paper(x,ground-9,23,15)
  if(choice===0||choice===1&&beat>=3){p(x,ground-9,'#b49b78',23,15);cup(x+1,ground-1,choice===1);cup(x+19,ground-1,choice===1)}
  if(choice===1&&beat===2){p(x+4,ground-5,'#c9ab89',14,1)}
 }else if(date){
  const clink=id==='date:tea:2'&&beat>=1?Math.round(Math.sin(t*5)):0
  cup(x,ground-1);cup(x+22+clink,ground-1)
  for(let i=0;i<2;i++){p(x+3+i*22,ground-7-Math.round(Math.sin(t*2+i)),'#e7dfc6',1,4)}
  if(id==='date:tea:1'){
   if(beat===0){p(x+10,ground+1,'#c5a16a',9,5);p(x+12,ground,'#e0c08a',5,2)}
   else {p(x+9,ground+1,'#c5a16a',4,5);p(x+21,ground-10,'#c5a16a',4,5);p(x+12,ground+1,'#e7cf9d',1,4);p(x+21,ground-10,'#e7cf9d',1,4);hand(nx-2,ground-8,npc)}
  }
 }else if(id==='ev:poppy:love:2'){
  paper(x,ground-8,24,17);p(x+3,ground-3,'#a8b491',7,4);p(x+13,ground-3,'#a8b491',7,4);p(x+5,ground+4,'#9b896e',14,1)
  if(choice===1){p(x+3,ground+5,'#b89f79',4,1);p(x+2,ground+6,'#b89f79',2,1)}
 }else{
  const last=beat>=3,behind=choice===1&&last,hug=choice===0&&last
  // Hug against the lower side of the chest; never lift the envelope into the face.
  const lx=behind?nx+24:hug?nx+17:x,ly=hug?ground-12:ground-8
  paper(lx,ly,behind||hug?9:24,behind||hug?8:15)
  if(hug||behind)hand(nx+20,ground-10,npc)
 }
}
