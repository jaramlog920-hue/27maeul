import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'

/** 약방 앞에서 약병 다섯 개를 줄 세우는 바질. 선택 결과에 맞춰 네 개/빈 탁자로 바뀐다. */
export function drawWorriedApothecary(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,basil:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.57:Math.min(h*.43,h-100)),clear=choice===1&&beat>=4,reduced=choice===0
 p(0,0,'#d3d9bd',w,h);p(0,f-10,'#9eaf85',w,h-f+10);p(0,f+9,'#c5b18d',w,h-f-9)
 // 실제 약방의 붉은 기와·크림 벽·초록 줄무늬 차양.
 const left=cx-125
 p(left,f-61,'#f0d8b0',105,68);p(left+3,f-58,'#f4e0c0',99,61)
 p(left-5,f-76,'#944850',115,16);p(left-2,f-74,'#b05860',109,11)
 for(let y=f-71;y<f-62;y+=4){p(left-2,y,'#c06c74',109,1);for(let x=left+5;x<left+105;x+=13)p(x,y-3,'#944850',1,3)}
 p(left+59,f-43,'#906040',28,49);p(left+62,f-40,'#a47c52',22,46);p(left+79,f-20,'#ddbd82',2,3)
 p(left+13,f-56,'#ac7444',31,27);p(left+16,f-53,'#d7dbaf',25,21);p(left+27,f-53,'#ac7444',2,21)
 for(let i=0;i<6;i++)p(left+8+i*7,f-62,i%2?'#f8e8cc':'#58984c',7,7)
 p(left+9,f-29,'#b38e63',40,4)
 // 약초 화분은 왼쪽에 두어 약병 다섯 개와 구분한다.
 p(left+10,f-7,'#ad8461',16,15);p(left+8,f-9,'#c6a077',20,3)
 for(let i=0;i<3;i++){p(left+12+i*4,f-23,'#708b5b',1,14);p(left+9+i*4,f-25-i%2*3,'#8ea76e',7,3)}
 p(cx+86,f-39,'#927751',3,52);p(cx+69,f-63,'#a1b183',32,10);p(cx+64,f-53,'#859c73',42,15);p(cx+73,f-38,'#859c73',25,6)
 for(let i=0;i<20;i++)p((i*53+11)%w,f+30+(i*17)%Math.max(12,h-f-35),'#b9a37d',2,1)
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
