import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {shoreFrame,shoreActor,bench} from './shore-kit'
export const SHORE_STONES_IDS=['ev:tilly:quarrel','ev:tilly:small:skimStones','ev:tilly:love:1','ev:tilly:dateLake'] as const
export function drawShoreStones(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number,choice?:number|null){
 const {p,cx,foot:f,ground}=shoreFrame(g,w,h,t,'evening'),selected=choice!=null,counting=id==='ev:tilly:love:1',quarrel=id==='ev:tilly:quarrel',date=id==='ev:tilly:dateLake',skim=id.includes('skimStones')
 const sit=quarrel&&!(choice===1),playerSit=quarrel&&choice===2
 if(sit)bench(p,cx+55,f);if(playerSit)bench(p,cx-85,f)
 shoreActor(p,cx-85,ground,null,av,'right',playerSit);shoreActor(p,cx+55,ground,npc,av,'left',sit)
 if(counting)return
 let bounces=0
 if(quarrel)bounces=choice===1?3:1
 if(date)bounces=selected?(choice===0?5:6):beat>=1?4:0
 if(skim)bounces=selected?(choice===0?4:choice===1?3:0):0
 if(!bounces){p(cx+49,f-5,'#8b9588',6,2);p(cx+50,f-6,'#adb4a3',4,1)}
 else{
  const progress=Math.min(1,(t%4)/2),x=cx-25+progress*85,y=f-32-Math.sin(progress*Math.PI)*11
  if(progress<1)p(x,y,'#8b9588',4,2)
  for(let i=0;i<bounces;i++){const rx=cx-24+i*17,ry=f-33+(i%2);p(rx,ry,'#d7d7b7',9,1);p(rx-1,ry+1,'#b4c6b7',1,2);p(rx+9,ry+1,'#b4c6b7',1,2)}
 }
 // The next loose stone/hand-off stays below both faces and never changes character scale.
 if(date&&choice===0)p(cx-63,f-5,'#adb4a3',6,2)
}
