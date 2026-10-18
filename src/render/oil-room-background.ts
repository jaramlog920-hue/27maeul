import {OIL_PRESS_ART} from './oil-press-art'
import {FURNI_PALETTE} from './furniture-art'
import {pressHandle,type DecorCanvas} from './bond-decor-art'

/** The native unlocked grip belongs on the real press frame, never loose on grass. */
export function drawOilPressHandle(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,wall:number){
 const x=Math.round(w/2)-80,y=wall+2
 pressHandle({fillStyle:'',fillRect(this:{fillStyle:string},a:number,b:number,c:number,d:number){p(x+a,y+b,this.fillStyle,c,d)}} as DecorCanvas,{x:0,y:0})
}
/** Existing downstairs oil workshop, press, olives and jars. */
export function drawOilRoomBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,wall:number){
 const cx=Math.round(w/2)
 p(0,0,'#d0bda0',w,h);p(0,wall,'#b3936e',w,h-wall);p(0,wall-3,'#927553',w,3)
 for(let y=wall+7;y<h;y+=9){p(0,y,'#a48762',w,1);for(let x=20+(y%3)*11;x<w;x+=47)p(x,y-8,'#a98c65',1,8)}
 // 실제 아래층 작업장의 칸막이와 출입구. 일하는 통로는 비워 둔다.
 p(cx-132,0,'#927553',5,wall+2);p(cx+126,0,'#927553',5,wall+2)
 p(cx+71,wall-54,'#947453',36,57);p(cx+74,wall-51,'#705e4b',30,51)
 p(cx+75,wall-50,'#a8af89',28,25);p(cx+75,wall-25,'#c2ae87',28,25)
 p(cx+71,wall+1,'#c6a779',38,4);p(cx+106,wall-53,'#b8976a',9,55);p(cx+107,wall-52,'#c3a77b',1,53)
 // 창으로 들어오는 늦은 오후 빛. 기름틀과 인물이 겹치지 않는다.
 p(cx-99,wall-54,'#967957',45,34);p(cx-96,wall-51,'#dbe0b0',39,28)
 p(cx-96,wall-35,'#9eae82',39,12);p(cx-78,wall-51,'#ac8b61',2,28);p(cx-96,wall-36,'#ac8b61',39,2)
 p(cx-102,wall-21,'#ac8b61',51,3)
 p(cx-94,wall+9,'#bea47a',38,3);p(cx-83,wall+13,'#bea47a',38,3)
 const pressX=cx-94,pressY=wall-2
 OIL_PRESS_ART.rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.'&&FURNI_PALETTE[c])p(pressX+x*2,pressY+y*2,FURNI_PALETTE[c],2,2)}))
 // 올리브 바구니와 완성된 기름 항아리. 생산이나 보상은 추가하지 않는다.
 p(cx-122,wall+18,'#94714d',18,12);p(cx-120,wall+19,'#b19360',14,9)
 for(let i=0;i<5;i++)p(cx-119+i*3,wall+16+i%2,'#7d8857',3,3)
 for(const x of [cx-59,cx-44]){
  p(x+3,wall+8,'#8d6e4c',6,3);p(x+2,wall+11,'#b49369',8,3);p(x,wall+14,'#a58259',12,14)
  p(x+2,wall+15,'#c5a979',2,9);p(x+1,wall+26,'#896e4e',10,2)
 }
}
