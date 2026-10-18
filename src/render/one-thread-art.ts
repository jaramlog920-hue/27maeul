import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 베 짜는 집 앞. 풀린 천을 되살리지 않고 풀린 실 한 타래만 감는다. */
export function drawOneThread(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,host:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.61:Math.min(h*.51,h-98)),help=choice===1
 const progress=help?(beat>=3?1:Math.min(1,Math.max(0,t)/3)):0
 p(0,0,'#c3d0b5',w,h);p(0,f-15,'#98ab7f',w,h-f+15);p(0,f+5,'#c9b58b',w,h-f-5)
 // 실제 마을 직조집의 붉은 기와, 크림 벽, 둥근 창과 갈색 문.
 p(cx-124,f-66,'#f4e0c0',107,70);p(cx-124,f-11,'#f0d8b0',107,15)
 p(cx-128,f-80,'#a45a44',115,17);p(cx-125,f-77,'#bc6c54',109,11)
 for(let y=f-75;y<f-65;y+=4){p(cx-124,y,'#cc8068',107,1);for(let x=cx-119;x<cx-19;x+=12)p(x,y-3,'#a45a44',1,3)}
 p(cx-112,f-53,'#ac7444',35,31);p(cx-108,f-61,'#ac7444',27,8);p(cx-104,f-64,'#ac7444',19,4)
 p(cx-109,f-51,'#d1dabc',29,27);p(cx-106,f-58,'#d1dabc',23,7);p(cx-103,f-61,'#d1dabc',17,4)
 p(cx-96,f-60,'#b3946c',2,36);p(cx-109,f-40,'#b3946c',29,2);p(cx-114,f-22,'#ac7444',39,3)
 p(cx-61,f-49,'#906040',28,53);p(cx-58,f-46,'#795438',22,50);p(cx-43,f-23,'#d8b47c',2,3)
 // 바깥 건조대의 완성 천은 풀린 천과 구분한다.
 p(cx+82,f-47,'#947351',3,53);p(cx+115,f-47,'#947351',3,53);p(cx+80,f-47,'#ac8c60',40,3)
 p(cx+88,f-43,'#b7a4b4',23,28);for(let x=cx+91;x<cx+109;x+=5)p(x,f-43,'#938695',2,28)
 for(let i=0;i<18;i++)p((i*61+3)%w,f+26+(i*13)%Math.max(14,h-f-30),'#bca97f',2,1)
 // 발 옆에 둥글게 쌓인 풀린 실. 감은 양만큼 같은 실이 줄어든다.
 const loops=Math.ceil((1-progress)*7),px=cx+37,py=f+17
 for(let i=0;i<loops;i++){
  const y=py+i%3*2,x=px-i%2*3,span=16+i*2
  p(x,y,'#8baabd',span,1);p(x-2,y+1,'#8baabd',2,3);p(x+span,y+1,'#8baabd',2,3);p(x,y+4,'#8baabd',span,1)
  p(x+4,y+2,'#a6bdc5',Math.max(3,span-8),1)
 }
 if(help&&progress<1){p(cx+19,f+11,'#8baabd',12,1);p(cx+30,f+12,'#8baabd',1,4);p(cx+30,f+16,'#8baabd',7,1)}
 person(p,help?cx-10:cx-28,help?f+12:f+8,avatar,'right','writer',help)
 person(p,help?cx+10:cx+16,help?f+12:f+8,host.avatar,'left',host.who,help)
 if(help){
  // 둥근 타래를 두 사람의 가까운 손 사이에 둔다. 얼굴 아래, 발 위다.
  const bx=cx+6,by=f+10,rad=2+Math.floor(progress*2)
  p(bx-rad+2,by-rad,'#8baabd',rad*2-3,rad*2+1);p(bx-rad,by-rad+2,'#8baabd',rad*2+1,rad*2-3)
  for(let i=0;i<rad;i++)p(bx-rad+2,by-rad+2+i*2,'#bed0d0',rad*2-3,1)
  const ap=writerPalette('spring',avatar?withLookDefaults(avatar):undefined),hp=host.who==='writer'?writerPalette('spring',host.avatar?withLookDefaults(host.avatar):undefined):PALETTE
  const turn=progress<1?Math.floor(t*4)%2:0
  p(bx-rad-1,by+turn,ap.s,2,2);p(bx+rad,by-turn,hp.s,2,2)
 }
}
