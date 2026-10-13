import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 저녁 언덕, 공책 사이에 일주일 동안 넣어 두었던 꽃 그림 한 장. */
export function drawShownToOne(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,host:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.67:Math.min(h*.56,h-95)),open=beat>=3,study=choice===1
 p(0,0,'#c6aaa0',w,h);p(0,f-61,'#a1ae8a',w,h-f+61)
 p(0,f-38,'#829671',w,h-f+38);p(0,f-13,'#739065',w,h-f+13)
 // 언덕 너머 노을과 멀리 있는 마을 지붕, 가까운 풀 둔덕.
 p(cx-107,f-74,'#ebc496',16,12);p(cx-105,f-76,'#ebc496',12,16)
 for(let i=0;i<4;i++){const x=cx+55+i*14,y=f-54-i%2*4;p(x,y,'#8f8c74',12,8);p(x-1,y-4,'#846e60',14,5)}
 for(let i=0;i<36;i++){const x=(i*53+11)%w,y=f+8+(i*17)%Math.max(13,h-f-15);p(x,y,'#8b9d73',3,1);p(x+1,y-2,'#8b9d73',1,2)}
 p(cx-42,f-2,'#849970',80,8)
 // 주니퍼는 잔디에 앉고 기록자도 무릎을 낮춰 같은 그림을 본다.
 person(p,cx+7,f,host.avatar,'left',host.who,true)
 person(p,cx-30+(study?3:0),f,avatar,'right','writer',true)
 const bx=cx-10,by=f-7
 if(!open){
  p(cx+4,by,'#8a7761',21,7);p(cx+5,by+1,'#ad9d78',19,5)
  p(cx+4,by+6,'#d8c6a2',21,1)
  // 종이 귀퉁이와 노란 꽃 한 조각만 보인다.
  p(cx+1,by-3,'#e7dbb9',6,4);p(cx+2,by-2,'#d1ac62',3,2)
 }else{
  p(cx+15,by+6,'#8a7761',18,3)
  const paper=(x:number,y:number,c:string,a=1,b=1)=>p(bx+x,by+y+(study?Math.floor(x/11)-1:0),c,a,b)
  paper(0,0,'#ad997a',37,16);paper(1,0,'#eee0bc',35,14)
  // 노란 꽃 12송이. 흰 꽃은 세 송이지만 마지막 송이의 한 꽃잎이 덜 그려졌다.
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
   const x=3+col*6,y=2+row*4
   paper(x,y,'#d9b05f',3,3);paper(x+1,y+1,'#9c7843',1,1)
  }
  for(let i=0;i<3;i++){const x=28,y=2+i*4;paper(x,y,'#f9f0d8',i===2?2:3,3);paper(x+1,y+1,'#c4a56c')}
  // 귀퉁이에 벌 한 마리, 공책에 그린 그림이므로 실제 날아다니지 않는다.
  paper(32,11,'#665c48',3,1);paper(33,10,'#dbc579',1,3);paper(32,9,'#bfc5b4',1,1);paper(34,9,'#bfc5b4',1,1)
  // 손은 종이 아래 가장자리에. 얼굴과 기본 팔을 가리지 않는다.
  const pal=host.who==='writer'?writerPalette('spring',host.avatar?withLookDefaults(host.avatar):undefined):PALETTE
  p(cx+21,by+11,pal.s,2,2)
  if(choice===0&&beat>=7)p(cx+23,by+1-Math.floor(t)%2,pal.s,2,2)
 }
 // 주변 풀꽃은 그림의 12+3 계수와 혼동되지 않도록 장면 가장자리에만 둔다.
 for(const x of [cx-101,cx+99]){p(x,f-3,'#536d51',1,8);p(x-2,f-4,'#c7a5a0',5,3)}
}
