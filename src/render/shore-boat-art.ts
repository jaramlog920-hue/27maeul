import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,boat,rack,workBoard} from './shore-kit'
export const SHORE_BOAT_IDS=['ev:cosmo:boat','ev:cosmo:rowTogether','ev:cosmo:boatName','ev:cosmo:story:2','saw:boat:launch','actsShip'] as const
export function boatPeople(id:string){return id==='actsShip'?['fisher','child','grandpa']:id==='saw:boat:launch'||id==='ev:cosmo:story:2'?['cosmo','rudy']:['cosmo']}
export function drawShoreBoat(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const launch=id==='saw:boat:launch',rowing=id==='ev:cosmo:rowTogether',ship=id==='actsShip',broken=id==='ev:cosmo:boat',building=id==='ev:cosmo:story:2',selected=choice!=null,afloat=ship||rowing||launch
 const {p,cx,foot:f,ground}=shoreFrame(g,w,h,t,ship?'day':building?'evening':'day',afloat)
 const dock=(x:number,width:number)=>{p(x,f-19,'#a58c67',width,42);for(let y=f-16;y<f+23;y+=6)p(x,y,'#846b4d',width,1);p(x+3,f+23,'#72573f',3,13);p(x+width-6,f+23,'#72573f',3,13)}
 if(ship){
  boat(p,cx-10,f-36,128,false,true);p(cx+27,f-34,'#947454',3,25);p(cx+30,f-33,'#bda67e',1,25)
  dock(cx-145,169);p(cx-11,f-27,'#d1bd97',1,15)
  shoreActor(p,cx-135,ground,null,av,'right');shoreActor(p,cx-95,ground,npc,av,'right')
  others.forEach((a,i)=>shoreActor(p,cx-55+i*40,ground,a,av,'right'))
  // Anchored ship and original observers; it never departs during this scene.
  return
 }
 if(building){
  const complete=selected&&choice===0&&beat>=5,low=selected&&choice===1&&beat>=7
  rack(p,cx-19,low?f+4:f,complete,false)
  for(let i=0;i<3;i++)p(cx-33+i*12,f+16,'#ac8961',27,3)
  shoreActor(p,complete?cx-42:cx-115,ground,null,av,'right');shoreActor(p,cx+44,ground,npc,av,'left');if(others[0])shoreActor(p,cx-82,ground,others[0],av,'right')
  p(cx-63,f-5,'#87958a',9,2);p(cx-66,f-4,'#805c3f',5,2)
  p(cx+84,f-2,'#c4b28c',12,8);p(cx+101,f-1,'#c4b28c',8,7)
  if(selected&&choice===2){p(cx+84,f-2,'#a67e50',10,5);p(cx+94,f,'#a67e50',4,2);p(cx+89,f-6,'#d1bd97',1,4);rack(p,cx-19,f,false,true)}
  return
 }
 if(launch||rowing){
  if(launch){dock(cx-140,60);dock(cx+37,52)}
  const drift=rowing&&selected&&choice===0?Math.round(Math.sin(t)*3):0,x=cx-37+drift
  boat(p,x,ground+1,76)
  if(launch)p(cx+36,ground-4,'#d5b887',4,7)
  p(x+62,ground+4,'#d5b887',5,2)
  shoreActor(p,launch?cx-112:cx-27+drift,ground,null,av,'right',rowing)
  shoreActor(p,cx+4+drift,ground,npc,av,'left',true)
  if(launch&&others[0])shoreActor(p,beat>=2?cx-26:cx+38,ground,others[0],av,'left',beat>=2)
  const ox=rowing&&selected&&choice===0?cx-20+drift:cx+21+drift
  for(let i=0;i<24;i++)p(ox-i,ground-6+i/3,'#9c784c',2,1);p(ox-25,ground+1,'#b48a57',6,4)
  return
 }
 boat(p,cx-35,ground+9,74,broken)
 const gather=broken&&selected&&choice===1
 shoreActor(p,cx-85,ground,null,av,'right',gather);shoreActor(p,cx+55,ground,npc,av,'left',gather)
 if(broken){
  for(let i=0;i<5;i++)p(cx-27+i*13,f+27+i%2*3,'#b48a57',9,3)
  if(gather){workBoard(p,cx,f);p(cx-14,f-3,'#c6a16a',25,5);p(cx-9,f-2,'#805c3f',3,2);p(cx-3,f-2,'#805c3f',4,1)}
 }else{
  // The player's name is an engraving; reversed last mark remains reversed.
  for(let i=0;i<4;i++){p(cx+16+i*4,ground+12,'#e3c38e',1,4);p(cx+(i===3?14:16)+i*4,ground+12,'#e3c38e',3,1)}
  if(selected&&choice===1)p(cx+37,ground+8,'#d5b887',3,1)
 }
}
