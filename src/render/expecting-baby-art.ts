import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {householdCradleFrame} from './village-followup-art'
import {PALETTE,writerPalette} from './sprites'

/** 아침 식탁에서 손을 맞잡고, 다음 컷에서는 요람 곁 접힌 이불을 함께 바라본다. */
export function drawExpectingBaby(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.68-30:h<=170?h*.55:Math.min(h*.41,h-105)),foot=f+30
 p(0,0,'#dfceb0',w,h);p(0,f,'#b99b76',w,h-f);p(0,f-3,'#a18661',w,3)
 for(let y=f+7;y<h;y+=9)p(0,y,'#ad8e6a',w,1)
 // 아침 창, 낮은 찬장과 식탁. 부모·요람 사이 통로를 비운다.
 p(cx-111,f-55,'#ac8d65',47,37);p(cx-108,f-52,'#e5e7bb',41,31)
 p(cx-108,f-32,'#b2bf92',41,11);p(cx-89,f-52,'#b49a70',2,31);p(cx-108,f-34,'#b49a70',41,2)
 p(cx-114,f-20,'#b7996d',53,3);p(cx-109,f+6,'#c8ad80',30,2);p(cx-98,f+12,'#c8ad80',38,2)
 p(cx+65,f-48,'#aa835a',43,48);p(cx+68,f-45,'#c5a476',37,43)
 p(cx+85,f-44,'#aa835a',2,41);p(cx+79,f-27,'#e3c18c',2,3);p(cx+92,f-27,'#e3c18c',2,3)
 p(cx+62,f-50,'#d4b689',49,3);p(cx+72,f-58,'#a68961',11,8);p(cx+75,f-63,'#b6a178',5,5)
 p(cx-120,f+16,'#a78462',14,10);p(cx-117,f+8,'#91a171',8,8);p(cx-120,f+10,'#a5b582',14,3)
 const cradle=householdCradleFrame(null,0,true),qx=cx+70,qy=f+2
 cradle.back.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.'&&cradle.propPalette[c])p(qx+x*2,qy+y*2,cradle.propPalette[c],2,2)}))
 // 준비해 둔 작은 이불은 요람 곁 낮은 받침에 놓인다.
 p(cx+45,f+27,'#a98c63',19,3);p(cx+47,f+30,'#8c704e',2,6);p(cx+60,f+30,'#8c704e',2,6)
 if(beat>=1){
  p(cx+46,f+20,'#a8bdb3',17,7);p(cx+47,f+20,'#dce4c8',15,2);p(cx+46,f+24,'#7d9e96',17,1)
  p(cx+48,f+23,'#d6ddbd',2,3);p(cx+59,f+23,'#d6ddbd',2,3)
 }
 // 두 사람이 앉을 작은 의자. 몸을 낮춘 원래 스프라이트를 쓴다.
 const playerX=beat>=1?cx-25:cx-30,spouseX=beat>=1?cx+1:cx-8
 for(const x of [playerX+3,spouseX+3]){p(x,foot-5,'#a8865e',12,3);p(x+1,foot-2,'#90704e',2,6);p(x+9,foot-2,'#90704e',2,6)}
 person(p,playerX,foot,avatar,'right','writer',true)
 person(p,spouseX,foot,spouse.avatar,beat>=1?'right':'left',spouse.who,true)
 // 식탁은 얼굴보다 아래. 첫 컷은 가까운 손끼리만 맞잡는다.
 const tx=cx-47,ty=foot-4
 p(tx,ty,'#a38158',65,5);p(tx+2,ty,'#d8bc8e',61,2);p(tx+5,ty+5,'#8e6e4b',3,13);p(tx+57,ty+5,'#8e6e4b',3,13)
 for(const x of [tx+7,tx+51]){p(x,ty-5,'#dcd7b3',6,5);p(x+1,ty-4,'#a99371',4,2);p(x+6,ty-4,'#dcd7b3',2,3)}
 p(tx+25,ty-2,'#e3d6b3',12,2);p(tx+27,ty-6,'#c6a06a',8,4);p(tx+28,ty-6,'#e1bf85',6,1)
 if(beat===0){
  const pp=writerPalette('spring',avatar?withLookDefaults(avatar):undefined),sp=spouse.who==='writer'?writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined):PALETTE
  p(cx-14,foot-8,pp.s,3,2);p(cx-11,foot-8,sp.s,3,2)
 }
 // 아침빛만 작게 변하고 카메라와 가구 위치는 고정한다.
 p(cx-77,f-38+(Math.floor(t/3)%2),'#e8e8bf',3,1)
}
