import {drawWeaverRoomBackground} from './weaver-room-background'
import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 실 한 올과 엮인 천을 나란히 보여 주고, 둘째 대사에서 책 곁의 빈 자리를 이야기한다. */
export function drawPenelopeWovenBook(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,penelope:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.62:Math.min(h*.51,h-100))
 g.imageSmoothingEnabled=false;drawWeaverRoomBackground(p,w,h,f)
 // 각자 낮은 방석에 앉는다. 팔을 늘이지 않고 낮은 탁자를 사이에 둔다.
 for(const x of [cx-40,cx+29]){p(x-3,f+15,'#b18f8c',25,8);p(x-1,f+16,'#d2b2a0',21,5)}
 person(p,cx-39,f+18,penelope.avatar,'right',penelope.who,true)
 person(p,cx+30,f+18,avatar,'left','writer',true)
 p(cx-42,f+14,'#ac8259',81,5);p(cx-37,f+19,'#79583c',3,10);p(cx+31,f+19,'#79583c',3,10)
 // 소품은 얼굴 아래. 한 올은 손에서 나온 긴 소품이며 손/팔은 기본 길이.
 p(cx-25,f+11,'#80664c',6,3);p(cx-24,f+8,'#c4b491',4,5)
 p(cx-20,f+10,'#efe0b6',18,1);p(cx-3,f+11,'#efe0b6',3,1)
 p(cx-11,f+8,'#7f9b91',19,7)
 for(let y=f+9;y<f+14;y+=2)p(cx-10,y,'#b6c3a6',17,1)
 for(let x=cx-8;x<cx+6;x+=4)p(x,f+8,'#c8cfb1',1,6)
 // 기록자의 책은 닫힌 채 그대로 둔다. 새 표지나 함께 한 작업을 미리 완성하지 않는다.
 p(cx+15,f+9,'#76583f',18,6);p(cx+16,f+10,'#d9c9a6',16,3);p(cx+15,f+8,'#a47c5d',18,3)
 p(cx+18,f+9,'#c9ac7d',9,1)
 const pal=penelope.who==='writer'?writerPalette('spring',penelope.avatar?withLookDefaults(penelope.avatar):undefined):PALETTE
 if(beat===0){p(cx-22,f+11,pal.s,3,2)}
 else{
  // 책 곁에서 무언가 엮고 싶다는 말: 짧은 열린 손만 보이고 실제 작업은 시작하지 않는다.
  p(cx-22,f+9,penelope.who==='writer'?pal.r:pal.V,4,3);p(cx-18,f+10,pal.s,3,2)
 }
 p(cx+111+Math.floor(t/2)%3,f-51,'#89a07a',2,1)
}
