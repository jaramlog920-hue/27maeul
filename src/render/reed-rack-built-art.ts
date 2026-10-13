import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {HOME_ADDITION_PALETTE as home} from './expanded-home-art'

/** 설치가 끝난 아침. 다음 날 어부가 가져오는 종이와 보상을 미리 그리지 않는다. */
export function drawReedRackBuilt(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,carpenter:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h<=170?.58:.51)),wall=cx-146
 p(0,0,'#d7dfbe',w,h);p(0,f-12,'#b6c591',w,h-f+12)
 p(0,f+6,'#c7c693',w,h-f-6)
 // 기존 집의 크림 벽과 붉은 기와가 왼쪽에서 끝나고 오른쪽은 볕 드는 풀밭이다.
 p(wall,f-71,home.W,109,76);p(wall+3,f-68,home.w,103,71)
 p(wall-5,f-93,home.R,119,23);p(wall-2,f-90,home.r,113,16)
 for(let y=f-87;y<f-73;y+=5)p(wall-2,y,home.h,113,1)
 p(wall-5,f-74,home.R,119,5)
 p(wall+74,f-43,home.f,20,24);p(wall+77,f-40,'#e9d8a7',14,18)
 p(wall+82,f-40,home.f,3,18);p(wall+77,f-32,home.f,14,2)
 p(wall+101,f-69,'#d7c098',4,71);p(wall,f+3,'#d5bd93',109,4)
 p(wall+7,f+7,'#acb784',110,5)
 // 뒤쪽에는 생울타리, 앞쪽에는 집에서 떨어진 바람 잘 통하는 자리.
 for(let i=0;i<7;i++){p(cx-19+i*20,f-24-i%2*3,'#94aa7e',20,10);p(cx-17+i*20,f-17,'#a5b78b',16,7)}
 for(let i=0;i<36;i++){const x=(i*53+13)%w,y=f+13+(i*19)%Math.max(18,h-f-18);p(x,y,i%3?'#b8bc86':'#d7d0a2',2,1)}
 // 실제 틀의 목재 색과 부재 배치를 유지하고, 세 다발의 아래만 바람에 흔든다.
 const rx=cx+8,ry=f+1
 p(rx+3,ry+42,'#a6b180',43,4)
 p(rx+6,ry+6,'#8d5829',6,39);p(rx+36,ry+6,'#8d5829',6,39)
 p(rx+3,ry+6,'#b17640',42,6);p(rx+6,ry+30,'#b17640',36,6)
 p(rx+6,ry+7,'#c39157',36,1)
 const sway=beat>=1?Math.round(Math.sin(t*2)*1.5):0
 for(const [dx,len,c] of [[12,21,'#ddd188'],[21,24,'#bfb964'],[30,21,'#ddd188']] as const){
  p(rx+dx,ry+12,c,6,7)
  for(let j=0;j<3;j++){
   const end=len-7-(j===1?0:2)
   p(rx+dx+j*2+sway,ry+19,c,1,end)
   p(rx+dx+j*2+sway,ry+20,'#e4d99c',1,Math.max(1,end-4))
  }
  p(rx+dx,ry+14,'#9c8753',6,2)
 }
 // 두 인물의 발은 같은 마당 바닥에 놓고, 얼굴과 틀이 겹치지 않도록 둔다.
 person(p,cx-24,f+45,carpenter.avatar,'right',carpenter.who)
 person(p,cx+66,f+45,avatar,'left','writer')
 // 옆에 정리해 둔 도구 가방. 설치가 끝난 안내 장면이다.
 p(wall+88,f+12,'#a78659',15,9);p(wall+90,f+10,'#7b6748',11,3)
 p(wall+92,f+12,'#cfb389',2,6);p(wall+100,f+7,'#88724e',2,9)
 p(wall+98,f+5,'#aeb7a4',6,3)
 if(beat>=1){
  const drift=Math.floor(t*5)%48
  p(cx+63+drift,f+10,'#dce0b6',7,1);p(cx+85+drift,f+15,'#dce0b6',4,1)
 }
}


