import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 파피가 현재의 가마 곁에서 어릴 적 이야기를 한다. 회상 속 아버지를 새 등장인물로 넣지 않는다. */
export function drawPoppyFireMemory(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,poppy:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.66:Math.min(h*.51,h-95))
 g.imageSmoothingEnabled=false
 p(0,0,'#c4b7aa',w,h);p(0,f-30,'#edb88e',w,32);p(0,f+2,'#c3a47e',w,h-f-2)
 for(let y=f+9;y<h;y+=10)p(0,y,'#af916e',w,1)
 // 새벽빛 창, 아직 닫힌 판매 덧문과 비어 있는 빵 선반.
 p(cx+72,f-74,'#986f50',47,40);p(cx+75,f-71,'#8494a1',41,34)
 p(cx+75,f-56,'#d7bba2',41,19);p(cx+94,f-71,'#ae8862',3,34);p(cx+75,f-54,'#ae8862',41,2)
 p(cx+69,f-34,'#b69268',53,3)
 p(cx+64,f-19,'#966b49',58,4);p(cx+68,f-15,'#78583e',3,20);p(cx+116,f-15,'#78583e',3,20)
 p(cx+78,f-25,'#b79261',28,7);p(cx+80,f-24,'#70533b',24,3)
 // 빵집의 아치 가마. 불은 인물의 손이 아닌 안쪽에 고정한다.
 const ox=cx-128
 p(ox+10,f-75,'#b57d59',58,76);p(ox+3,f-66,'#b57d59',72,67)
 p(ox+16,f-81,'#c3936c',46,7)
 p(ox+18,f-54,'#704e3a',42,52);p(ox+25,f-62,'#704e3a',28,10)
 p(ox+21,f-51,'#3f3530',36,45);p(ox+28,f-58,'#3f3530',22,8)
 for(let y=f-68;y<f-4;y+=10){p(ox+4,y,'#996548',12,1);p(ox+62,y,'#996548',12,1)}
 p(ox+25,f-15,'#7f5537',29,4);p(ox+31,f-18,'#7f5537',20,4)
 const flame=Math.floor(t*3)%2
 p(ox+29,f-27,'#ba6b44',22,12);p(ox+33,f-31-flame,'#e3a058',6,16+flame);p(ox+43,f-28+flame,'#f0c17a',4,12-flame)
 p(ox+14,f-5,'#c39a70',50,6);p(ox+12,f+1,'#886547',54,3)
 // 불을 다루는 도구는 긴 나무 손잡이. 사람의 팔은 기본 도트 길이를 유지한다.
 p(ox+7,f+9,'#795f45',55,3);p(ox+2,f+7,'#a88a62',9,7)
 // 기록자와 현재의 파피는 뜨거운 입구에서 떨어져 같은 바닥에 선다.
 person(p,cx-26,f+22,avatar,'right')
 person(p,cx+9,f+22,poppy.avatar,'left',poppy.who)
 if(beat>=1){
  // 둘째 대사에서는 도구를 둔 쪽으로 작은 손짓. 얼굴보다 아래에 둔다.
  const skin=poppy.who==='writer'?writerPalette('spring',poppy.avatar?withLookDefaults(poppy.avatar):undefined).s:PALETTE.s
  p(cx+10,f+9,poppy.who==='writer'?writerPalette('spring',poppy.avatar?withLookDefaults(poppy.avatar):undefined).r:PALETTE.c,4,3);p(cx+8,f+8,'#725039',3,3);p(cx+7,f+7,skin,3,2)
 }
 // 장작은 벽 쪽에 정리. 어린 파피나 아버지를 현재 장면에 넣지 않는다.
 for(let i=0;i<3;i++){p(cx-124+i*12,f+20,'#886342',10,5);p(cx-122+i*12,f+21,'#c09563',3,3)}
}
