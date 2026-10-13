import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

export function drawOvenSharing(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,mother:FinalePerson,daughter:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h*(h<=170?.61:.47))
 p(0,0,'#d6b79b',w,h);p(0,floor,'#b99b77',w,h-floor)
 for(let y=floor+8;y<h;y+=9)p(0,y,'#ab8965',w,1)
 p(0,floor-3,'#ad8c68',w,3)
 // 낮은 아침창과 밀가루 자루, 반죽용 나무판.
 p(cx+53,floor-68,'#a27f59',43,38);p(cx+56,floor-65,'#d6d8ae',37,32)
 p(cx+56,floor-46,'#b9c697',37,13);p(cx+73,floor-65,'#ac8b61',3,32);p(cx+56,floor-51,'#ac8b61',37,2)
 p(cx+104,floor-24,'#b59c73',18,26);p(cx+106,floor-28,'#d9c8a0',14,4)
 p(cx+110,floor-21,'#8e795a',6,1);p(cx+112,floor-22,'#8e795a',1,8)
 // 아치 가마. 불은 안쪽에 두고 손이나 몸으로 뜨거운 빵을 가리지 않는다.
 const ox=cx-119,oy=floor-61
 p(ox+5,oy,'#af7657',60,63);p(ox,oy+8,'#af7657',70,55)
 p(ox+9,oy-5,'#b98964',52,6);p(ox+13,oy+13,'#684c3c',45,42)
 p(ox+20,oy+8,'#684c3c',30,7);p(ox+15,oy+17,'#463e34',41,35)
 for(let y=oy+5;y<floor;y+=9){p(ox+2,y,'#966348',9,1);p(ox+59,y,'#966348',9,1)}
 p(ox+4,floor-6,'#c49b72',62,6);p(ox+12,floor,'#8b694c',47,3)
 const glow=Math.floor(t*4)%2
 p(ox+24,floor-22,'#bc7750',22,10);p(ox+28+glow,floor-26,'#e0a061',7,13);p(ox+39-glow,floor-24,'#d59057',5,11)
 p(ox+18,floor-13,'#554437',35,4)
 const bread=(x:number,y:number,shape=0)=>{
  p(x,y,'#a57045',shape===1?10:14,4);p(x+1,y-3,'#cc9b60',shape===1?8:12,5)
  p(x+3,y-2,'#e0bc80',2,2);if(shape!==1)p(x+8,y-2,'#e0bc80',2,2)
 }
 // 두 사람의 역할을 먼저 보여 준다. 반죽판 높이는 팔이 닿는 허리 아래.
 person(p,cx+56,floor+22,mother.avatar,'down',mother.who)
 p(cx+29,floor+8,'#b18b62',60,5);p(cx+33,floor+13,'#7e5b40',3,14);p(cx+82,floor+13,'#7e5b40',3,14)
 p(cx+37,floor+5,'#ead8b0',15,3);p(cx+40,floor+3,'#ead8b0',9,3)
 p(cx+73,floor+5,'#94704c',12,2);p(cx+75,floor+3,'#bb9264',7,5)
 const progress=beat>=2?Math.min(1,t/3):0
 const dx=cx-51+progress*20
 person(p,dx,floor+22,daughter.avatar,progress<.5?'left':'right',daughter.who,false,progress>0&&progress<1,t)
 // 나무 손잡이의 빵 주걱. 길게 보이는 것은 도구이며 팔은 기존 스프라이트를 그대로 쓴다.
 if(progress<.5){p(dx-14,floor+5,'#8d6c45',17,2);p(dx-26,floor+2,'#b89868',13,6);bread(dx-25,floor+1)}
 // 나무 진열 받침을 옮긴다. 식은 빵을 놓은 탁자는 기록자 앞쪽에 있다.
 const trayX=cx-1+(beat>=2?Math.min(1,t/2)*10:0)
 p(cx-5,floor+17,'#b88e60',53,5);p(cx-1,floor+22,'#806043',3,10);p(cx+41,floor+22,'#806043',3,10)
 p(trayX,floor+12,'#806043',35,5);p(trayX+2,floor+12,'#d0ac77',31,3)
 bread(trayX+3,floor+10);bread(trayX+20,floor+10,1)
 if(progress>=.5)bread(cx+29,floor+10)
 person(p,cx+104,floor+32,avatar,'left')
 // 빵에서만 김이 올라온다. 인물이나 가구를 늘이지 않는다.
 if(beat>=2){const sy=floor+5-Math.floor(t*3)%8;p(cx+33,sy,'#dec9a8',1,3);p(cx+35,sy-2,'#dec9a8',1,2)}
}
