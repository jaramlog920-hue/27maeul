import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,raisedFinger,letter,net,bench,boat} from './shore-kit'
export const SHORE_PERSONAL_IDS=['ev:cosmo:weather','ev:cosmo:short:spouseHabit','ev:cosmo:story:1','ev:cosmo:short:quietJoke','ev:cosmo:fogWalk','saw:cosmo:froze','ev:cosmo:home:1','ev:cosmo:love:1','ev:cosmo:love:2','ev:cosmo:jealous'] as const
export function personalPeople(id:string){return id==='ev:cosmo:weather'?['cosmo','fisher']:['cosmo']}
export function drawShorePersonal(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const fog=id.includes('fogWalk')||id==='saw:cosmo:froze',wind=id==='ev:cosmo:weather'||id==='ev:cosmo:short:spouseHabit',rest=id==='ev:cosmo:story:1',quiet=id.includes('quietJoke'),selected=choice!=null
 const {p,cx,foot:f,ground}=shoreFrame(g,w,h,t,fog?'fog':rest||id==='ev:cosmo:jealous'||id==='ev:cosmo:home:1'||id.includes('spouseHabit')?'evening':'day')
 const nx=id==='saw:cosmo:froze'&&beat===1?cx+53:cx+55,seat=rest&&(beat>=2||selected),walk=id==='ev:cosmo:home:1'&&choice===1
 if(rest){bench(p,nx,f);if(selected&&choice===0)bench(p,cx-85,f)}
 shoreActor(p,cx-85,ground,null,av,'right',rest&&selected&&choice===0,walk,t)
 shoreActor(p,nx,ground,npc,av,id==='ev:cosmo:fogWalk'?'left':'left',seat,walk,t)
 if(wind){
  const lowered=id.includes('spouseHabit')&&choice===2
  if(!lowered&&(id.includes('spouseHabit')?choice===0:beat>=1))raisedFinger(p,npc,av,nx,ground)
  if(selected&&choice===(id.includes('spouseHabit')?0:1))raisedFinger(p,null,av,cx-85,ground)
  if(id.includes('spouseHabit')&&choice===1){letter(p,cx-20,f+7,true,true);p(cx+3,f+10,'#927052',8,1)}
  if(id==='ev:cosmo:weather'&&choice===1&&others[0])shoreActor(p,cx+92,ground,others[0],av,'left')
 }else if(rest||fog){
  boat(p,cx-19,ground+13,46)
  p(cx+30,f-14,'#80664c',4,30);p(cx+29,f-15,'#c2a577',6,3)
  const grip=id==='saw:cosmo:froze'&&beat<3
  p(cx+5,f+9,'#d1bd97',28,1)
  if(grip){p(cx+33,f-4,'#d1bd97',21,1);p(cx+51+Math.floor(t*3)%2,f-5,'#d1bd97',3,1)}
 }else if(quiet){
  net(p,cx+25,f-5,27,14)
  if(beat>=0)for(let i=0;i<5;i++){p(cx-42+i*18,f-57-(i%2)*4,'#7e8b81',4,1);p(cx-44+i*18,f-59-(i%2)*4,'#7e8b81',2,2);p(cx-38+i*18,f-59-(i%2)*4,'#7e8b81',2,2)}
 }else if(id==='ev:cosmo:home:1'){
  net(p,cx-19,f-8,31,16);p(cx-19,f-9,'#d1bd97',31,1)
  if(walk){p(cx+3,f+12,'#8d9990',4,3);p(cx+18,f+11,'#e2d3ad',1,6)}
 }else if(id==='ev:cosmo:love:1'){
  const pocket=selected&&choice===0
  if(!pocket){for(const x of [cx-11,cx+8]){p(x,f-4,'#8d9990',7,4);p(x+1,f-5,'#aab3a4',5,1);p(x+2,f-3,'#d0d2be',3,1)}}
 }else{
  const stored=id==='ev:cosmo:jealous'&&choice===1&&beat>=3
  p(cx-23,f+5,'#97754e',47,13);p(cx-21,f+6,'#b99b71',43,9)
  if(stored){letter(p,cx-13,f+7,false);net(p,cx-20,f+5,39,10)}
  else letter(p,cx-11,f-9,!(id==='ev:cosmo:jealous'&&selected),id==='ev:cosmo:love:2'&&selected)
  if(id==='ev:cosmo:love:2'){p(cx+12,f-4,'#927052',9,1);p(cx+19,f-5,'#3e4340',2,1)}
 }
}
