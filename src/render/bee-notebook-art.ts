import {drawBeeFieldBackground} from './bee-field-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {FURNI_PALETTE} from './furniture-art'

export function drawBeeNotebook(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,keeper:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.54:Math.min(h*.39,h-125)),study=beat>=1&&choice===1,approach=study?Math.min(1,t/1.2):0
 drawBeeFieldBackground(p,w,h,f)
 person(p,cx-37+5*approach,f+45,keeper.avatar,'right',keeper.who,study)
 person(p,cx+45-25*approach,f+45,avatar,'left','writer',study&&approach>=1,study&&approach<1,t)
 // 낮은 나무 의자 위에 펼친 공책. 표지를 쥐거나 새 공책을 내미는 장면으로 바꾸지 않는다.
 p(cx-15,f+34,FURNI_PALETTE.w,38,4);p(cx-12,f+38,FURNI_PALETTE.W,3,8);p(cx+16,f+38,FURNI_PALETTE.W,3,8)
 p(cx-15,f+34,FURNI_PALETTE.l,38,1)
 const bx=cx-13,by=f+24
 p(bx,by,'#a48a66',34,11);p(bx+1,by,'#ece0bb',15,9);p(bx+17,by,'#f3e8ca',16,9)
 p(bx+16,by,'#baaa82',1,10);p(bx+2,by+8,'#d1c39c',13,1);p(bx+19,by+8,'#d1c39c',12,1)
 const digit=(rows:readonly string[],x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c==='x')p(x+xx,y+yy,'#928369')}))
 digit(['.x.','xx.','.x.','.x.','xxx'],bx+3,by+2)
 digit(['xxx','..x','xxx','x..','xxx'],bx+10,by+4)
 // 세 잎과 흰 꽃 머리, 곁에는 숫자 4. 숫자만 가득한 장부와 다른 관찰 공책이다.
 p(bx+23,by+4,'#7f9a68',1,4);p(bx+21,by+6,'#91a570',2,2);p(bx+24,by+6,'#91a570',2,2)
 p(bx+21,by+2,'#fcf5dd',5,3);p(bx+22,by+1,'#fcf5dd',3,5);p(bx+23,by+3,'#d7c78b',1,1)
 digit(['x.x','x.x','xxx','..x','..x'],bx+28,by+3)
 p(bx+9,by+2,'#ceb0bb',3,2);p(bx+10,by+4,'#88a073',1,2)
 // 작은 벌 두 마리는 벌통과 꽃 사이에서만 움직인다. 얼굴과 공책에는 겹치지 않는다.
 for(let i=0;i<2;i++){
  const x=cx-83+Math.round(Math.sin(t*.8+i*2)*12),y=f-38+i*12+Math.round(Math.cos(t+i)*3)
  p(x,y,'#d5b365',4,2);p(x+1,y,'#665a3b',1,2);p(x,y-1,'#ecebd7',2,1);p(x+3,y-1,'#ecebd7',2,1)
 }
}



