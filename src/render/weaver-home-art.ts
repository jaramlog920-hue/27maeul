import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawWeaverFacade} from './weaver-front-background'
export const WEAVER_HOME_IDS=['ev:penelope:home:2','ev:penelope:home:1'] as const
export const isWeaverHome=(id:string)=>(WEAVER_HOME_IDS as readonly string[]).includes(id)
/** 집에 쓸 천을 집 앞에서 보여 준다. 발판 계획과 이미 짠 탁자 천을 구분한다. */
export function drawWeaverHome(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.56:h<=170?h*.69:h*.6),f=foot-28,chosen=choice!=null,cloth=id==='ev:penelope:home:2',touch=cloth&&choice===1&&beat>=2
 g.imageSmoothingEnabled=false
 p(0,0,'#d6debf',w,h);p(0,f-25,'#9bab7e',w,h-f+25);p(0,f+3,'#c6b28a',w,h-f-3);drawWeaverFacade(p,cx,f)
 person(p,cx-85,foot+8,avatar,'right','writer',false,false,t);person(p,cx+55,foot+8,npc.avatar,'left',npc.who,false,false,t)
 p(cx-35,foot+5,'#a9845f',84,4);p(cx-31,foot+9,'#795b41',3,14);p(cx+42,foot+9,'#795b41',3,14)
 if(!cloth){
  // A paper doormat plan, not an installed or already woven mat.
  p(cx-25,foot-12,'#efe0ba',51,17);p(cx-20,foot-8,'#b4a28a',38,1);p(cx-20,foot-8,'#b4a28a',1,10);p(cx+17,foot-8,'#b4a28a',1,10);p(cx-20,foot+1,'#b4a28a',38,1)
  if(chosen&&choice===0)for(let i=0;i<7;i++)p(cx-16+i*5,foot-6,'#8d9eab',2,6)
  p(cx+28,foot+2,'#927052',8,1)
 }else{
  // The wrong strand stays in both replies. Only the second answer touches the cloth.
  const x=touch?cx-4:cx-27,y=foot-8
  p(x,y,'#bdc4a8',60,12);for(let yy=y+2;yy<y+11;yy+=3)p(x+1,yy,'#a3b7ad',58,1)
  for(let xx=x+3;xx<x+57;xx+=8)p(xx,y+1,'#8fa8b2',1,10)
  p(x+31,y+1,'#a87e8c',1,7);p(x+32,y+6,'#a87e8c',3,1)
  p(x-1,y+1,'#a4b292',3,10);p(x-2,y+3,'#d3d7b8',2,6)
  for(let xx=x+3;xx<x+58;xx+=5)p(xx,y+12,'#bdc4a8',1,2)
 }
}
