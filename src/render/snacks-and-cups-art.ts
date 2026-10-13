import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

export function drawSnacksAndCups(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,host:FinalePerson,baker:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h<=170?.48:.42)),a=Math.min(1,t/1.6),chosen=beat>=2&&choice!=null
 p(0,0,'#e0d6b5',w,h);p(0,f,'#b49b78',w,h-f)
 for(let y=f+5;y<h;y+=10){p(0,y,'#a58b6a',w,1);for(let x=(y%3)*33;x<w;x+=65)p(x,y,'#a58b6a',1,10)}
 p(0,f-3,'#92795b',w,3)
 // 찻집의 넓은 격자창과 차통 선반. 창 아래 작은 잎 그림자가 흔들린다.
 p(cx-105,f-66,'#9c8160',62,49);p(cx-102,f-63,'#c9d9bf',56,43)
 p(cx-102,f-43,'#97b28d',56,23)
 for(let i=0;i<4;i++){p(cx-101+i*14,f-34-(i%2)*5,'#789871',14,9);p(cx-100+i*14,f-27,'#b3c39b',12,5)}
 p(cx-77,f-63,'#a18a64',3,43);p(cx-102,f-44,'#a18a64',56,3)
 p(cx-110,f-69,'#8c765b',72,3);p(cx-108,f-66,'#ddd0aa',6,45);p(cx-47,f-66,'#ddd0aa',6,45)
 p(cx+53,f-56,'#947859',55,4)
 for(let i=0;i<3;i++){p(cx+59+i*15,f-72,'#748579',9,16);p(cx+58+i*15,f-74,'#576e65',11,3);p(cx+61+i*15,f-65,'#ddd3ad',5,5)}
 p(cx+67,f-25,'#b69770',44,5);p(cx+70,f-20,'#8f7051',3,27);p(cx+105,f-20,'#8f7051',3,27)
 // 보조 탁자에 작은 찻주전자. 시음 탁자에는 찻잔을 정확히 세 개만 그린다.
 const kettle=(x:number,y:number,tilt=false)=>{p(x,y,'#7c9187',10,8);p(x+2,y-2,'#9caf9b',6,3);p(x+4,y-4,'#677e74',2,2);p(x-3,y+1,'#7c9187',4,3);p(x+10,y,'#657e74',3,6);p(x+11,y+2,'#e0d6b5',1,2);if(tilt)p(x-3,y+4,'#bd9367',1,6)}
 const pour=chosen&&choice===1
 if(!pour)kettle(cx+76,f-34)
 const hostX=cx-22
 person(p,hostX,f+22,host.avatar,'right',host.who)
 person(p,cx+33,f+22,baker.avatar,'left',baker.who)
 const taste=chosen&&choice===0
 
 // 낮은 탁자와 얇은 천: 얼굴을 가리지 않고 발은 마룻바닥에 붙인다.
 p(cx-39,f+23,'#8d6b4d',3,18);p(cx+40,f+23,'#8d6b4d',3,18)
 p(cx-44,f+15,'#bd9e75',92,10);p(cx-43,f+15,'#ece0be',90,8);p(cx-44,f+24,'#9f8059',92,2)
 p(cx-39,f+16,'#c5b899',82,1);p(cx-39,f+22,'#c5b899',82,1)
 const cups=[cx-26,cx,cx+26],cy=f+10
 cups.forEach((x,i)=>{p(x-5,cy+5,'#d5cbb0',13,2);p(x-3,cy,'#748d83',7,6);p(x-4,cy-1,i===1?'#f6edce':i===0?'#c5ac80':'#91a19c',9,2);p(x-2,cy,'#8e6649',5,1);p(x+4,cy+1,'#748d83',3,3);p(x+5,cy+2,'#ece0be',1,1)})
 person(p,cx-66+(taste?16*a:0),f+43,avatar,'right','writer',false,taste&&a<1,t)
 const bread=(x:number,y:number,i:number,plate=true)=>{
  if(plate)p(x-6,y+5,'#d4c6a5',13,2)
  if(i===0){p(x-4,y+1,'#bb854a',9,5);p(x-3,y,'#e4b467',7,4);p(x-1,y+1,'#f2d08a',3,1)}
  if(i===1){p(x-5,y+1,'#b98951',11,4);p(x-4,y,'#d4a666',9,4);for(let j=0;j<3;j++)p(x-3+j*3,y+1,'#f0d5a3',1,2)}
  if(i===2){p(x-4,y,'#a57949',9,6);p(x-3,y-1,'#c19a63',7,5);p(x-2,y,'#e9d5ac',1,1);p(x+1,y+2,'#e9d5ac',1,1);p(x+2,y,'#e9d5ac',1,1)}
 }
 for(let i=0;i<3;i++){
  const pairing=chosen&&choice===2
  const x=cups[i]+(pairing?5*a:0),y=f+18-(pairing?4*a:0)
  // 꿀빵은 접시에서 입 가까이 옮긴다. 같은 빵을 탁자에 중복해서 남기지 않는다.
  if(i===0&&taste)bread(x+(cx-35-x)*a,y+(f+24-y)*a,i,a<1)
  else bread(x,y,i)
 }
 if(pour){kettle(cx+76-(75*a),f-34+36*a,true);if(a>=1)p(cx-2,cy,'#a7774c',5,1)}
 if(beat>=1&&!chosen){const sy=cy-4-Math.floor(t*2)%3;p(cx-26,sy,'#e6e3ce',1,2);p(cx+26,sy-2,'#e6e3ce',1,2)}
}



