import {drawRiverRestBackground} from './river-rest-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawScenicBench} from './stargazing-art'

/** 마을에 생긴 벤치 둘. 저녁에 이웃들이 물소리를 들으러 오는 같은 물가. */
export function drawRiverRest(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,elder:FinalePerson,fisher:FinalePerson,baker:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),horizon=Math.round(h*.27),shore=Math.round(h*.47),ground=shore+34,evening=beat>=1
 drawRiverRestBackground(p,w,h,t,horizon,shore,evening)
 const bench=(x:number)=>{
  p(x-21,ground,'#a39e7d',43,3)
  p(x-17,ground-9,'#8d5829',4,10);p(x+13,ground-9,'#8d5829',4,10)
  p(x-22,ground-9,'#b17640',44,3);p(x-21,ground-9,'#c79256',42,1)
 }
 bench(cx-43);bench(cx+31)
 if(evening){
  // 기존 앉은 자세의 머리 비율과 짧은 다리를 쓰고, 실제 벤치처럼 등받이는 두지 않는다.
  drawScenicBench(g,cx-43,ground,elder.avatar,null,false,elder.who)
  drawScenicBench(g,cx+31,ground,fisher.avatar,null,false,fisher.who)
  person(p,cx-103,ground+10,baker.avatar,'right',baker.who)
 }
 person(p,cx+88,ground+11,avatar,'up','writer')
 // 물가의 갈대. 잔물결과 작은 잎의 흔들림이 천천히 움직인다.
 const sway=Math.round(Math.sin(t*1.5))
 for(let i=0;i<5;i++){const x=cx-117+i*5;p(x,shore+2,'#788960',1,10+i%2*4);p(x+sway,shore-2-i%2*4,'#b8b27b',2,5)}
}


