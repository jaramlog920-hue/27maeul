import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

/** 언덕길에서 새 판자에 우물과 언덕을 새기는 루디와 편지 배달원. */
export function drawForkSign(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,rudy:FinalePerson,postman:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h<=170?.52:.45)),help=beat>=2&&choice===0,quiet=beat>=2&&choice===1
 const finished=help&&t>=4,a=help?1:0
 p(0,0,'#d8dfc0',w,h);p(0,f-31,'#b3c19a',w,h-f+31)
 for(let i=0;i<10;i++){p(i*w/10,f-37-(i%4)*3,'#a5b78d',w/10+1,10);p(i*w/10,f-20+(i%3)*2,'#b9c69a',w/10+1,12)}
 p(0,f+5,'#b4bf8c',w,h-f-5)
 // 우물 쪽 마을과 언덕으로 갈라지는 길. 새 표지의 그림과 이어지는 장소다.
 for(let y=f-23;y<h;y++){
  const depth=y-f,spread=Math.max(0,30-depth*.7),width=18+Math.max(0,depth)*.22
  p(cx-36-spread,y,'#c7b993',width,1);p(cx-4+spread,y,'#c7b993',width,1)
 }
 p(cx-67,f-18,'#bcae88',31,2);p(cx+22,f-18,'#bcae88',37,2)
 for(let i=0;i<32;i++){const x=(i*59+7)%w,y=f-5+(i*23)%Math.max(20,h-f);p(x,y,i%2?'#ccd0a0':'#a3b27c',2,1)}
 // 길 가장자리의 풀과 돌. 먼 나무는 인물의 얼굴을 가리지 않는다.
 for(const x of [cx-120,cx+111]){p(x,f-29,'#8f7957',4,36);p(x-11,f-52,'#899d70',28,11);p(x-17,f-42,'#748d62',40,15);p(x-9,f-27,'#748d62',25,8)}
 p(cx+89,f+24,'#a2aa8c',15,5);p(cx+92,f+21,'#bec4a7',10,4)
 const sx=cx-30,sy=f-18
 p(sx+1,f+38,'#9faa79',29,4);p(sx+4,sy-7,'#876442',5,65);p(sx+5,sy-5,'#ab8254',2,62)
 const old=(x:number,y:number)=>{
  p(x,y,'#957c57',41,11);p(x+2,y+2,'#ae9970',37,7)
  p(x,y+9,'#7f6c4b',41,2);p(x+38,y+2,'#b4bf8c',3,2)
  for(let i=0;i<4;i++){p(x+7+i*7,y+4,'#c4b68c',3,1);if(i%2===0)p(x+8+i*7,y+6,'#c4b68c',1,2)}
  p(x+15,y+1,'#957c57',2,3);p(x+29,y+7,'#957c57',5,1)
 }
 const mark=(x:number,y:number)=>{
  // 우물은 동그라미 하나, 언덕은 선 둘. 작은 도트에서도 식별되는 간단한 새김.
  p(x+5,y+3,'#785b3e',5,1);p(x+4,y+4,'#785b3e',1,3);p(x+10,y+4,'#785b3e',1,3);p(x+5,y+7,'#785b3e',5,1)
  for(let j=0;j<4;j++){p(x+24+j,y+6-j,'#785b3e',1,1);p(x+28+j,y+3+j,'#785b3e',1,1)}
  for(const tx of [x+13,x+17,x+34]){p(tx,y+4,'#785b3e',2,1);p(tx+1,y+5,'#785b3e',1,2);p(tx,y+7,'#785b3e',2,1)}
 }
 const board=(x:number,y:number,etched:boolean)=>{p(x,y,'#b48a58',41,12);p(x+1,y+1,'#dec08a',39,9);p(x+2,y+2,'#e8cea0',36,1);p(x+3,y+9,'#c5a16b',33,1);if(etched)mark(x,y)}
 if(finished){board(sx-17,sy,true);old(sx-25,f+42)}else old(sx-17,sy)
 person(p,cx-91,f+41,postman.avatar,'right',postman.who)
 person(p,cx+40,f+41,rudy.avatar,'left',rudy.who)
 // 기록자가 판자 곁으로 다가가 허리 높이의 판자를 받친다.
 const playerX=help?cx-50+47*a:cx-50
 person(p,playerX,f+41,avatar,'right','writer',false,help&&a<1,t)
 if(!finished){
  const bx=cx+12,by=f+27
  board(bx,by,quiet||help&&a>=1)
  // 루디의 가까운 손에 짧은 끌. 얼굴 아래에 놓는다.
  const tap=help?Math.floor(t*4)%2:0
  p(cx+42,f+25+tap,'#8f6e47',2,5);p(cx+40,f+29+tap,'#b4bdb0',3,2)
  if(help&&a>=1)for(let i=0;i<3;i++)p(cx+19+i*4,f+40+i%2,'#d8bd8d',2,1)
 }
 // 바람에 잎 하나가 움직인다. 선택 전에는 표지가 완성되지 않는다.
 const leaf=Math.floor(t*4)%25
 p(cx+72+leaf,f-10+Math.floor(t)%4,'#a7b981',3,1)
}



