import {drawApothecaryFrontBackground} from './apothecary-front-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

/** 약방 앞에서 약병 다섯 개를 줄 세우는 바질. 선택 결과에 맞춰 네 개/빈 탁자로 바뀐다. */
export function drawWorriedApothecary(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,basil:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.57:Math.min(h*.43,h-100)),clear=choice===1&&beat>=4,reduced=choice===0
 drawApothecaryFrontBackground(p,w,h,f)
 const left=cx-125
 // 마주 보는 두 사람의 얼굴 아래에 낮은 탁자를 둔다.
 person(p,cx-47,f+29,basil.avatar,'right',basil.who)
 p(cx-23,f+16,'#9c7950',62,5);p(cx-21,f+17,'#c7a77a',58,2)
 p(cx-19,f+21,'#81623f',3,15);p(cx+32,f+21,'#81623f',3,15)
 const bottle=(x:number,y:number,index:number)=>{
  p(x+2,y,'#9a7a51',3,2);p(x+1,y+2,'#8daba0',5,2);p(x,y+4,'#6f9187',7,8)
  p(x+1,y+4,'#bad0ba',1,6);p(x+2,y+7,'#e4d8b7',4,3);p(x+3,y+8,['#7c8460','#a07a69','#87917c','#a58e61','#7f9391'][index],2,1)
 }
 // 첫 대사에서는 모아 준비하고 둘째 대사에서 한 줄로 세운다.
 if(!clear){
  const n=reduced?4:5
  for(let i=0;i<n;i++){
   const target=cx-18+i*11,packed=cx-10+i%3*9,y=f+4-(beat===0&&i>=3?5:0)
   const a=beat===0?0:beat===1?Math.min(1,Math.max(0,t/.9-i*.14)):1
   bottle(beat===0?packed:packed+(target-packed)*a,y,i)
  }
 }
 // 덜어낸 한 병 또는 치운 다섯 병을 뒤쪽 선반에 둔다.
 if(clear||reduced){
  p(left+17,f-41,'#ad8b61',22,2)
  for(let i=0;i<(clear?5:1);i++){p(left+17+i*4,f-48,'#779687',3,7);p(left+18+i*4,f-49,'#977b53',1,1)}
 }
 person(p,cx+44,f+29,avatar,'left')
}
