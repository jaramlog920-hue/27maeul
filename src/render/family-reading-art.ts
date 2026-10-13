import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {BABY,SMALL_PALETTE,PALETTE,writerPalette} from './sprites'

export function drawFamilyReading(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,child:FinalePerson&{baby?:boolean},beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h<=170?h*.69:Math.min(h*.57,h-84)),wall=foot-37
 p(0,0,'#d8c5a6',w,h);p(0,wall,'#b69872',w,h-wall)
 for(let y=wall+7;y<h;y+=9)p(0,y,'#a58764',w,1)
 p(0,wall-3,'#947754',w,3)
 // 집 안의 낮은 창과 그림책을 둘 수 있는 시렁.
 p(cx-111,wall-50,'#aa8863',43,36);p(cx-108,wall-47,'#e3dfba',37,30)
 p(cx-108,wall-28,'#b1c396',37,11);p(cx-91,wall-47,'#af946a',3,30);p(cx-108,wall-31,'#af946a',37,2)
 p(cx-114,wall-15,'#ad8d62',49,3)
 p(cx+70,wall-41,'#a17c56',38,43);p(cx+73,wall-38,'#c7a67b',32,38)
 for(let row=0;row<2;row++){
  for(let i=0;i<4;i++){p(cx+76+i*7,wall-33+row*19,['#8eaa91','#b38b83','#bca978','#a696ae'][i],5,13);p(cx+77+i*7,wall-31+row*19,'#e5d7b4',3,1)}
  p(cx+73,wall-18+row*19,'#967452',32,2)
 }
 p(cx-104,foot-8,'#b38662',13,9);p(cx-101,foot-11,'#bca67b',7,3)
 p(cx-100,foot-21,'#89956b',1,10);p(cx-105,foot-21,'#a1ad7b',7,3);p(cx-100,foot-25,'#a1ad7b',6,3)
 // 둘이 붙어 앉는 한 장의 깔개. 기본 몸 비율을 유지한다.
 p(cx-46,foot-4,'#b48f8b',78,10);p(cx-44,foot-3,'#d3b3a0',74,7)
 for(let x=cx-40;x<cx+28;x+=8)p(x,foot-2,'#ead2b5',2,5)
 person(p,cx-32,foot,avatar,'right','writer',true)
 if(child.baby){
  const pal={...SMALL_PALETTE,s:writerPalette('spring',avatar?withLookDefaults(avatar):undefined).s}
  BABY.baby.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c as keyof typeof pal])p(cx-13+x*2,foot-14+y*2,pal[c as keyof typeof pal],2,2)}))
 }else person(p,cx-9,foot,child.avatar,beat>=1?'left':'down',child.who,true,false,t,1,child.short)
 const bx=cx-27,by=foot-6
 if(beat===0){
  // 펼친 한 권. 그림과 작은 글줄을 구분하여 필사 책처럼 보이지 않게 한다.
  p(bx,by,'#928369',36,9);p(bx+1,by,'#efe2bd',16,7);p(bx+19,by,'#f5e8c9',16,7);p(bx+18,by,'#c2b493',1,8)
  p(bx+6,by+2,'#9fac77',1,4);p(bx+4,by+1,'#d2a3ac',5,2);p(bx+5,by,'#ecd1bc',3,4)
  p(bx+23,by+2,'#98b4b2',7,3);p(bx+27,by+1,'#98b4b2',4,2);p(bx+31,by+2,'#c5a774',2,1)
  p(bx+2,by+6,'#b5a886',11,1);p(bx+21,by+6,'#b5a886',11,1)
  if(!child.baby){const pal=child.who==='writer'?writerPalette('spring',child.avatar?withLookDefaults(child.avatar):undefined):PALETTE;const point=Math.floor(t/2)%2;p(cx+3-point*4,by+3,pal.s,2,2)}
 }else{
  p(cx-21,by+1,'#8ba6a1',24,7);p(cx-20,by+6,'#d5c9a8',22,1);p(cx-21,by+1,'#638581',2,6)
  p(cx-13,by+2,'#d5d5b0',6,3);p(cx-11,by+1,'#eadbb4',2,5)
 }
}
