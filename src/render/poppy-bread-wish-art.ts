import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 아직 만들지 않은 자기 이름의 빵을 이야기한다. 완성/시식/선물 동작을 앞당기지 않는다. */
export function drawPoppyBreadWish(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,poppy:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.67:Math.min(h*.51,h-95))
 g.imageSmoothingEnabled=false
 p(0,0,'#e4c7a4',w,h);p(0,f-23,'#c6a67c',w,h-f+23)
 for(let y=f-14;y<h;y+=10)p(0,y,'#b7946c',w,1)
 p(0,f-26,'#a98460',w,3)
 // 빵집 준비대와 밀가루 선반. 장래의 특별한 빵은 아직 진열하지 않는다.
 p(cx-126,f-83,'#9c7654',57,42);p(cx-123,f-80,'#e8dfbb',51,36)
 p(cx-123,f-61,'#b5c7a0',51,17);p(cx-99,f-80,'#ad8c61',3,36)
 p(cx-123,f-63,'#ad8c61',51,2);p(cx-129,f-41,'#b39367',63,3)
 p(cx+67,f-79,'#805d43',59,52);p(cx+70,f-76,'#bd9c75',53,46)
 for(let row=0;row<2;row++){
  p(cx+70,f-56+row*23,'#96704c',53,3)
  for(let i=0;i<3;i++){
   const x=cx+75+i*16,y=f-71+row*23
   p(x,y,'#cebd95',11,15);p(x+1,y-3,'#ead8ac',9,4);p(x+4,y+4,'#ab9975',3,5)
  }
 }
 p(cx-117,f-10,'#9d7652',69,5);p(cx-112,f-5,'#78553c',4,18);p(cx-56,f-5,'#78553c',4,18)
 p(cx-109,f-15,'#e2cfaa',22,5);p(cx-104,f-17,'#eadbb9',12,3)
 p(cx-76,f-16,'#9e7c51',22,3);p(cx-63,f-18,'#b99162',5,7)
 // 두 사람은 낮은 시음대 앞에 선다. 빈 접시는 미래의 약속으로 남긴다.
 p(cx-27,f+12,'#a77d53',64,5);p(cx-24,f+17,'#77583d',3,7);p(cx+29,f+17,'#77583d',3,7)
 p(cx-6,f+8,'#c2b599',22,4);p(cx-4,f+7,'#eee0bd',18,3)
 person(p,cx-36,f+25,avatar,'right')
 person(p,cx+20,f+25,poppy.avatar,'left',poppy.who)
 if(beat>=1){
  // 먼저 맛봐 달라는 대사에서 기록자 쪽으로 짧게 손을 편다.
  const pal=poppy.who==='writer'?writerPalette('spring',poppy.avatar?withLookDefaults(poppy.avatar):undefined):PALETTE
  p(cx+22,f+12,pal.r,4,3);p(cx+19,f+11,'#79583e',4,3);p(cx+18,f+10,pal.s,4,2)
 }
 // 창밖 잎 하나만 흔들리고 카메라와 인물 배율은 바꾸지 않는다.
 p(cx-114+Math.floor(t/2)%6,f-55,'#91a27b',2,1)
}
