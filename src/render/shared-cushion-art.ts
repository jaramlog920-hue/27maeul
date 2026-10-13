import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

export function drawSharedCushion(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,penelope:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),shore=Math.round(h<=170?h*.45:Math.min(h*.37,h-115)),foot=shore+31
 const sitting=beat>=2&&choice===0,turned=beat>=3&&choice===1
 p(0,0,'#d8e0c8',w,h)
 p(0,shore-26,'#a3b4a0',w,13);p(0,shore-14,'#8eafa7',w,26)
 for(let x=0;x<w;x++){const y=shore-29+Math.round(Math.sin(x/w*7)*3);p(x,y,'#a8bb9b',1,9)}
 for(let row=0;row<7;row++)for(let x=(row*23+Math.floor(t*2))%43-8;x<w;x+=43)p(x,shore-11+row*3,row%2?'#b4c9b9':'#789e97',9+row%3*4,1)
 // 길 끝의 풀 둔덕. 벤치 대신 땅에 놓인 두 방석으로 익숙한 자리를 만든다.
 p(0,shore+10,'#98aa7c',w,h-shore-10);p(0,shore+15,'#bec394',w,h-shore-15)
 p(0,foot+16,'#b9bb8c',w,h-foot-16)
 for(let y=shore+16;y<foot+20;y++)p(cx-114-(y-shore)*.4,y,'#c8bd99',28,1)
 p(cx-97,foot+15,'#c8bd99',107,5)
 for(let i=0;i<25;i++){const x=(i*59+7)%w,y=shore+20+(i*13)%Math.max(12,h-shore-24);p(x,y,'#aeb884',2,1)}
 // 버드나무 그늘을 인물에서 떨어뜨려 낮의 조용한 호숫가를 보여 준다.
 p(cx+106,shore-26,'#8e7956',4,58);p(cx+91,shore-58,'#8b9f75',36,11);p(cx+83,shore-48,'#749369',46,15)
 for(let i=0;i<6;i++){const x=cx+87+i*7;p(x,shore-34,'#749369',2,11+i%3*4)}
 p(cx+93,foot+8,'#a8b58a',35,4)
 p(cx-125,shore+19,'#a0aa8c',17,5);p(cx-122,shore+16,'#c3c8a3',11,4)
 const cushion=(x:number,rose:boolean)=>{
  p(x-2,foot+1,'#a5ad82',30,3)
  p(x,foot-5,rose?'#c28f99':'#ae9eb4',26,7)
  p(x+2,foot-7,rose?'#e7b4bc':'#cec1d3',22,7)
  p(x+3,foot-7,rose?'#f0d3ca':'#e6dcdf',20,1)
  p(x+2,foot-1,rose?'#d3a0aa':'#bdacc4',22,1)
  for(const dx of [3,21])p(x+dx,foot-4,rose?'#c28f99':'#ae9eb4',1,2)
 }
 cushion(cx+16,false);cushion(cx-33,true)
 person(p,cx+20,foot,penelope.avatar,turned?'up':'left',penelope.who,true)
 if(turned)p(cx+22,foot-14,'#c87d79',2,2)
 person(p,sitting?cx-29:cx-69,foot,avatar,'right','writer',sitting)
 // 갈대와 물결만 움직인다. 인물과 배경의 배율은 고정한다.
 const sway=Math.round(Math.sin(t*1.4))
 for(let i=0;i<4;i++){const x=cx-35+i*6;p(x,shore+4,'#84966b',1,8);p(x+sway,shore,'#b9b484',2,5)}
}

