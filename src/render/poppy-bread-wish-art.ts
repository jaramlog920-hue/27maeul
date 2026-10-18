import {drawBakeryRoomBackground} from './bakery-room-background'
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
 drawBakeryRoomBackground(p,w,h,f)
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
