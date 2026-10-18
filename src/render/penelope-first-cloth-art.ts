import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 처음 짠 구멍 난 천의 기억. 어머니의 옛 행동을 현재 새 인물/새 행동으로 재연하지 않는다. */
export function drawPenelopeFirstCloth(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,penelope:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.68:Math.min(h*.52,h-98)),wall=f-15
 g.imageSmoothingEnabled=false
 p(0,0,'#d7c2a5',w,h);p(0,wall,'#b99b79',w,h-wall);p(0,wall-3,'#987a59',w,3)
 for(let y=wall+9;y<h;y+=10)p(0,y,'#a98a69',w,1)
 // 창빛이 구멍 사이로 비치는, 매듭 두 곳에 걸린 첫 천 한 장.
 const wx=cx-119,wy=f-82
 p(wx-4,wy-4,'#987453',71,62);p(wx,wy,'#dde1bd',63,54)
 p(wx,wy+32,'#a6bb91',63,22);p(wx+29,wy,'#ab8863',3,54)
 p(wx,wy+26,'#ab8863',63,2);p(wx-7,wy+55,'#b59268',77,4)
 const clothX=wx+7,clothY=wy+8
 const rows=[
  '111111111111111111111',
  '111111111111111111111',
  '111100011111111111111',
  '111000011111110011111',
  '111100011111100001111',
  '111111111111100001111',
  '111111111111110011111',
  '111111110011111111111',
  '111111100001111111111',
  '111111100001111111111',
  '111111110011111111111',
  '111111111111111111111',
  '111111111111111100111',
  '111111111111111000111',
  '111111111111111000111',
  '111111111111111100111',
  '111111111111111111111',
  '111111111111111111111',
 ]
 // 구멍은 덧칠하지 않고 창을 그대로 드러낸다. 서로 다른 크기와 불규칙한 짜임.
 rows.forEach((r,y)=>[...r].forEach((cell,x)=>{if(cell==='1')p(clothX+x*2,clothY+y*2,(y%3===0||x%4===0)?'#b69788':'#cab29b',2,2)}))
 for(const x of [clothX+2,clothX+37]){p(x,wy+4,'#806249',1,5);p(x-1,clothY,'#806249',3,2)}
 for(let i=0;i<7;i++)p(clothX+1+i*6,clothY+36,'#b69788',1,3+i%2)
 // 오른쪽에는 지금 쓰는 작은 베틀. 첫 천의 구멍을 새 베틀 천과 구분한다.
 p(cx+73,f-47,'#8b694b',4,49);p(cx+119,f-47,'#8b694b',4,49)
 p(cx+71,f-47,'#ae8961',54,4);p(cx+73,f-7,'#a47e56',50,4)
 for(let i=0;i<11;i++)p(cx+79+i*3,f-41,'#e0cead',1,33)
 p(cx+78,f-25,'#a7a990',38,15)
 for(let y=f-23;y<f-10;y+=3)p(cx+79,y,'#bac1a4',36,1)
 p(cx+75,f-32,'#986c49',46,3);p(cx+90,f-33,'#ccb087',16,3)
 p(cx+74,f+2,'#73553e',8,3);p(cx+117,f+2,'#73553e',8,3)
 // 실타래는 낮은 보조 의자 위에 정리한다. 인물의 발과 겹치지 않는다.
 p(cx+38,f+5,'#a9835b',24,4);p(cx+41,f+9,'#77573e',3,13);p(cx+56,f+9,'#77573e',3,13)
 for(let i=0;i<2;i++){p(cx+42+i*10,f-4,'#bcaa8c',8,9);p(cx+41+i*10,f-5,'#84654a',10,2);p(cx+41+i*10,f+4,'#84654a',10,2)}
 person(p,cx-44,f+25,penelope.avatar,beat>=1?'left':'right',penelope.who)
 person(p,cx-9,f+25,avatar,'left')
 if(beat>=1){
  // 창가의 천 쪽으로 짧게 손을 편다. 천을 다시 걸거나 새로 고치지 않는다.
  const pal=penelope.who==='writer'?writerPalette('spring',penelope.avatar?withLookDefaults(penelope.avatar):undefined):PALETTE
  p(cx-43,f+12,penelope.who==='writer'?pal.r:pal.V,4,3);p(cx-46,f+11,pal.s,3,2)
 }
 // 고정된 창과 인물 배율. 창밖 잎의 작은 움직임만 남긴다.
 p(wx+52+Math.floor(t/2)%3,wy+40,'#90a67f',2,1)
}
