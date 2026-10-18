import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {eventMotionFrame} from './event-life-motion'
import {writerPalette} from './sprites'

/** 찻집에 전시한 한 장: 클로버는 설명하고 주니퍼는 그림 옆을 지킨다. */
export function drawObservationPage(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,mother:FinalePerson,daughter:FinalePerson,teaKeeper:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),a,b)}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.48:Math.min(h*.46,h-95)),ask=choice===1,clap=choice===2
 p(0,0,'#e0d6b5',w,h);p(0,f,'#b49b78',w,h-f)
 for(let y=f+5;y<h;y+=10)p(0,y,'#a58b6a',w,1)
 p(0,f-3,'#92795b',w,3)
 // 밝은 오후 찻집 창과 차통 선반. 전시 벽 주변과 찻잔 자리는 떨어져 있다.
 p(cx-137,f-73,'#9c8160',56,45);p(cx-134,f-70,'#c9d9bf',50,39)
 p(cx-134,f-51,'#97b28d',50,20);p(cx-111,f-70,'#a18a64',3,39);p(cx-134,f-51,'#a18a64',50,2)
 p(cx-140,f-27,'#b29a72',62,3)
 p(cx+78,f-50,'#947859',46,4)
 for(let i=0;i<3;i++){p(cx+82+i*13,f-65,'#748579',8,15);p(cx+81+i*13,f-67,'#576e65',10,3);p(cx+84+i*13,f-60,'#ddd3ad',4,4)}
 // 벽에 걸린 공책 한 장. 다른 장면의 꽃 그림을 복사하지 않는다.
 const px=cx-25,py=f-73
 p(px+18,py-5,'#8c765b',2,6);p(px-2,py-1,'#977f5d',44,42);p(px,py,'#eee1bf',40,38)
 for(let i=0;i<4;i++)p(px+3+i*9,py+1,'#ab9877',2,1)
 const flower=(x:number,y:number,c:string)=>{p(x+3,y+3,'#6e895d',1,6);p(x+1,y+5,'#8aa56b',5,2);p(x,y,c,7,4);p(x+2,y-2,c,3,7);p(x+3,y+1,'#bd9b62',1,1)}
 flower(px+4,py+7,'#d9cfc0');flower(px+4,py+20,'#d4ad6a')
 // 토끼풀 네 번이라는 원래 답변만 명확한 숫자로 쓴다. 나머지는 관찰 글줄이다.
 const four=['101','101','111','001','001']
 four.forEach((row,y)=>[...row].forEach((a,x)=>{if(a==='1')p(px+24+x,py+9+y,'#796b54')}))
 // 네 번의 아침 관찰을 1·2·3·4로 표시한다.
 const sequence=[['010','110','010','010','111'],['111','001','111','100','111'],['111','001','111','001','111']]
 sequence.forEach((rows,i)=>rows.forEach((row,y)=>[...row].forEach((a,x)=>{if(a==='1')p(px+12+i*4+x,py+9+y,'#9f8b69')})))
 p(px+15,py+22,'#9f8b69',15,1);p(px+15,py+25,'#9f8b69',11,1);p(px+15,py+28,'#9f8b69',14,1)
 // 이름 없는 손님 둘. 박수 답변에서만 기록자 쪽으로 얼굴을 돌린다.
 const guestFloor=f+9
 p(cx-132,guestFloor-4,'#947351',17,3);p(cx-129,guestFloor-1,'#795d45',3,10)
 p(cx-93,guestFloor-4,'#947351',17,3);p(cx-89,guestFloor-1,'#795d45',3,10)
 person(p,cx-131,guestFloor,null,clap?'down':'right','writer',true)
 person(p,cx-93,guestFloor,null,clap?'down':'left','writer',true)
 p(cx-113,f+1,'#b69770',19,4);p(cx-110,f+5,'#8f7051',3,13);p(cx-100,f+5,'#8f7051',3,13)
 const cup=(x:number,y:number)=>{p(x,y,'#8fa89b',6,5);p(x,y-1,'#eadbb8',7,2);p(x+1,y,'#8e6649',4,1);p(x+6,y+1,'#8fa89b',2,3)}
 cup(cx-108,f-5)
 // 그림 옆자리에는 찻잔이나 탁자를 놓지 않는다. 세 사람의 실제 세대/외형은 호출부가 준다.
 person(p,cx+27,f+11,daughter.avatar,clap?'down':'left',daughter.who)
 person(p,cx-43,f+25,mother.avatar,ask?'right':'left',mother.who)
 person(p,cx+84,f+25,teaKeeper.avatar,'left',teaKeeper.who)
 p(cx+63,f+18,'#b69770',62,5);p(cx+66,f+23,'#8f7051',3,16);p(cx+119,f+23,'#8f7051',3,16)
 cup(cx+68,f+12);cup(cx+100,f+12)
 const writerX=ask?cx-12:cx-79,writerFloor=ask?f+25:f+31
 if(clap){
  // 기본 박수 모션의 정수 손동작만 사용한다. 몸 위치와 확대율은 고정한다.
  const frame=eventMotionFrame('writer','down','clap',Math.floor(t*4),{frame:0,blink:false,avatar:avatar?withLookDefaults(avatar):undefined})
  const pal=writerPalette('spring',avatar?withLookDefaults(avatar):undefined)
  frame.actor.forEach((row,y)=>[...row].forEach((a,x)=>{if(a!=='.'&&pal[a])p(writerX+(x-7)*2,writerFloor+(y-frame.anchor.y)*2,pal[a],2,2)}))
 }else person(p,writerX,writerFloor,avatar,ask?'up':'right')
 // 질문을 받으면 주니퍼가 그림 쪽으로 작은 손을 든다. 그림과 얼굴은 가리지 않는다.
 if(ask&&beat>=4){const pal=writerPalette('spring',daughter.avatar?withLookDefaults(daughter.avatar):undefined);p(cx+25,f-1,pal.s,2,2)}
}
