import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 친구 대사의 표지 천 제안. 준비된 천을 보여 줄 뿐 책에 입히거나 건네지 않는다. */
export function drawPenelopeCoverOffer(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,penelope:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.67:Math.min(h*.52,h-100)),wall=f-21
 g.imageSmoothingEnabled=false
 p(0,0,'#d8c2a6',w,h);p(0,wall,'#ba9b76',w,h-wall);p(0,wall-3,'#987752',w,3)
 for(let y=wall+8;y<h;y+=10)p(0,y,'#a98a65',w,1)
 // 세로로 내린 표지 천 견본과 말아 둔 천. 첫 천의 구멍이나 두 사람의 낮은 자리와 다른 작업 구역.
 p(cx-124,f-78,'#806244',4,81);p(cx-58,f-78,'#806244',4,81);p(cx-129,f-78,'#a5825b',80,4)
 for(let i=0;i<3;i++){
  const x=cx-115+i*19,c=['#94aaa4','#baa196','#b6b58d'][i]
  p(x,f-72,c,14,47);p(x+1,f-70,'#d7cbb0',12,2);p(x+1,f-29,'#d7cbb0',12,2)
  p(x+2,f-73,'#87684a',10,2)
  for(let k=0;k<4;k++)p(x+1+k*4,f-25,c,1,3)
 }
 p(cx-129,f+3,'#72553d',12,3);p(cx-60,f+3,'#72553d',12,3)
 // 벽 쪽의 얕은 시렁에는 완성 천만 접어 둔다. 만들어진 책은 놓지 않는다.
 p(cx+75,f-70,'#a27c56',51,4);p(cx+79,f-66,'#856343',3,18);p(cx+117,f-66,'#856343',3,18)
 for(let i=0;i<3;i++){
  p(cx+80+i*14,f-76,['#9cafa5','#b89a92','#c0b58e'][i],12,6)
  p(cx+81+i*14,f-73,'#dcd0b0',10,1)
 }
 p(cx+90,f-28,'#a8875f',33,5);p(cx+93,f-23,'#75573e',3,29);p(cx+117,f-23,'#75573e',3,29)
 p(cx+94,f-39,'#b6a37e',10,11);p(cx+95,f-41,'#83684b',8,2)
 p(cx+109,f-36,'#b8a17f',10,8);p(cx+110,f-35,'#d4c3a1',8,6);p(cx+108,f-38,'#83684b',12,2)
 // 현재 한 올과 엮은 천을 작은 허리 높이 작업대에 나란히 놓는다.
 p(cx-10,f+16,'#a57d53',58,5);p(cx-6,f+21,'#78583d',3,10);p(cx+40,f+21,'#78583d',3,10)
 p(cx-5,f+13,'#e5d3ad',7,1);p(cx-5,f+14,'#e5d3ad',1,2)
 if(beat===0){
  p(cx+5,f+8,'#8da49c',20,8)
  for(let y=f+9;y<f+16;y+=2)p(cx+6,y,'#bac4aa',18,1)
  for(let x=cx+7;x<cx+23;x+=4)p(x,f+8,'#d3d8b8',1,8)
 }
 person(p,cx-38,f+32,avatar,'right')
 person(p,cx+26,f+30,penelope.avatar,'left',penelope.who)
 if(beat>=1){
  // 기존 견본을 손에 들어 설명한다. 상대에게 넘기지 않아 제안 대사를 미래의 약속으로 남긴다.
  const x=cx+10,y=f+16
  p(x,y,'#7e9d94',21,8);p(x+1,y+1,'#aabfb0',19,5);p(x+1,y+6,'#d2d9b9',19,1)
  for(let i=0;i<5;i++)p(x+2+i*4,y+8,'#aabfb0',1,2)
  const pal=penelope.who==='writer'?writerPalette('spring',penelope.avatar?withLookDefaults(penelope.avatar):undefined):PALETTE
  p(cx+29,f+17,pal.s,3,2)
 }
 // 뒤쪽에 정리된 천 끝만 약하게 움직인다. 인물과 소품 배율은 고정한다.
 p(cx-96,f-23+Math.floor(t/3)%2,'#baa196',1,2)
}
