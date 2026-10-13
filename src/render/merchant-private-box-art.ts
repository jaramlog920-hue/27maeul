import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 장날 오전 좌판: 닫힌 개인 상자와 판매 물건을 명확하게 떨어뜨린다. */
export function drawMerchantPrivateBox(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,merchant:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.62:Math.min(h*.48,h-102))
 g.imageSmoothingEnabled=false
 p(0,0,'#d7d9b8',w,h);p(0,f-29,'#9eaf7c',w,h-f+29);p(0,f,'#c6b28a',w,h-f)
 for(let i=0;i<28;i++)p((i*47+7)%w,f+40+(i*19)%Math.max(5,h-f-43),'#b6a27c',2,1)
 // 오전 장날 가리개, 뒤쪽 접어 둔 빈 운송 자루.
 p(cx-98,f-67,'#816344',4,99);p(cx+93,f-67,'#816344',4,99)
 p(cx-105,f-72,'#aa8865',208,7)
 for(let i=0;i<10;i++)p(cx-105+i*21,f-65,i%2?'#d0b187':'#b88d6c',21,12)
 p(cx-105,f-53,'#9b7654',208,3)
 p(cx+66,f-12,'#ad9870',21,29);p(cx+69,f-17,'#d2c09b',15,6)
 p(cx+70,f-7,'#8d785b',11,2)
 // 낮은 좌판과 깔린 천. 개인 상자는 오른쪽 아래, 판매 물건은 왼쪽 위.
 p(cx-77,f+18,'#9c7850',125,6);p(cx-71,f+24,'#77583e',4,8);p(cx+40,f+24,'#77583e',4,8)
 p(cx-75,f+17,'#cfb798',119,3)
 const flatten=choice===1,edge=flatten?Math.min(1,t/2):0
 p(cx+33,f+20,'#b59b7e',10,6-Math.round(edge*4))
 const pot=(x:number,y:number,c:string)=>{p(x+2,y-9,c,10,11);p(x,y-6,c,14,7);p(x+3,y-11,'#725844',8,3);p(x+4,y-10,'#493c30',6,1);p(x+3,y-5,'#dbc29b',2,4)}
 pot(cx-65,f+16,'#9d7251');pot(cx-44,f+16,'#b99768')
 p(cx-20,f+11,'#af8d63',21,5);p(cx-18,f+9,'#dbc49a',17,3)
 for(let i=0;i<3;i++)p(cx-16+i*5,f+9,'#a9865d',2,3)
 p(cx+8,f+8,'#eee1b9',14,8);p(cx+10,f+10,'#a89a78',9,1);p(cx+10,f+13,'#a89a78',7,1)
 const inspect=choice===2
 person(p,cx-91+(inspect?7:0),f+36,avatar,'right')
 person(p,cx+25,f+32,merchant.avatar,'left',merchant.who,beat===0)
 // 첫 컷에서만 상자를 자기 쪽으로 짧게 민다. 선택 이후에도 뚜껑은 열지 않는다.
 const shift=beat===0?Math.min(1,t/2.5):1,bx=cx+48-Math.round(shift*7),by=f+25
 p(bx,by,'#765739',23,7);p(bx+1,by+1,'#a58258',21,5);p(bx-1,by-2,'#b69567',25,4)
 p(bx+1,by-1,'#d1b184',21,1);p(bx+10,by+3,'#6b5942',3,3)
 const pal=merchant.who==='writer'?writerPalette('spring',merchant.avatar?withLookDefaults(merchant.avatar):undefined):PALETTE
 if(beat===0){p(bx-3,by+1,pal.s,4,2)}
 if(flatten){
  // 짧은 팔 끝이 천의 오른쪽 끝을 누른다. 얼굴과 접시는 가리지 않는다.
  p(cx+41,f+19,merchant.who==='writer'?pal.r:pal.p,3,3);p(cx+41,f+20,pal.s,3,2)
 }
 if(inspect){
  // 상자가 아니라 좌판의 판매 물건에 손을 둔다.
  const pp=writerPalette('spring',avatar?withLookDefaults(avatar):undefined)
  p(cx-69,f+22,pp.r,4,3);p(cx-65,f+21,pp.s,3,2)
 }
 if(choice===0){p(cx+28,f+17,pal.s,3,2)}
}
