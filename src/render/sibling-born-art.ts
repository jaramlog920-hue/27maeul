import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {householdCradleFrame} from './village-followup-art'
import {writerPalette} from './sprites'

export function drawSiblingBorn(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,older:FinalePerson&{baby?:boolean},newborn:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h>w?h*.68-40:h<=170?h*.48:Math.min(h*.4,h-110)),foot=f+40
 g.imageSmoothingEnabled=false
 p(0,0,'#d8c7ab',w,h);p(0,f,'#baa07e',w,h-f);p(0,f-3,'#92795b',w,3)
 for(let y=f+8;y<h;y+=10)p(0,y,'#ab8e6c',w,1)
 // 밤을 넘긴 침실. 꺼진 등잔, 씻는 대야, 아침빛과 접힌 천.
 p(cx-112,f-60,'#a88965',44,43);p(cx-109,f-57,'#ecdfb6',38,37);p(cx-109,f-36,'#bbc5a0',38,16)
 p(cx-91,f-57,'#ab906b',2,37);p(cx-109,f-39,'#ab906b',38,2);p(cx-115,f-18,'#c7ab80',50,3)
 p(cx+70,f-33,'#a78a63',28,3);p(cx+73,f-30,'#896e4e',3,32);p(cx+91,f-30,'#896e4e',3,32)
 p(cx+78,f-41,'#b6986d',9,8);p(cx+80,f-44,'#806d55',5,3);p(cx+79,f-42,'#d1b88b',7,2)
 p(cx+74,f-32,'#e4d9bc',15,2);p(cx+74,f-34,'#d1c7aa',15,2)
 p(cx+68,f+13,'#a78b65',31,8);p(cx+71,f+12,'#d4ceae',25,2);p(cx+73,f+14,'#abbcaf',21,3)
 // 낮은 부부 침대는 부모 뒤, 발이 서는 통로는 비운다.
 p(cx-111,f-2,'#947450',70,33);p(cx-108,f,'#e6ddc0',64,25);p(cx-107,f+8,'#a1b4a5',62,17)
 for(const x of [cx-105,cx-75]){p(x,f+1,'#f1e9d0',24,6);p(x,f+6,'#d8ceb2',24,1)}
 p(cx-108,f+12,'#c7d1b6',64,2);p(cx-111,f+29,'#80674a',70,4)
 if(beat===0){
  person(p,cx-43,foot-3,avatar,'right','writer',true)
  person(p,cx-25,foot-3,spouse.avatar,'left',spouse.who,true)
  const pa=writerPalette('spring',avatar?withLookDefaults(avatar):undefined),sa=writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined)
  p(cx-27,foot-11,pa.s,3,2);p(cx-24,foot-11,sa.s,3,2)
 }else{
  person(p,older.baby?cx-13:cx-57,foot,avatar,'right','writer',!!older.baby)
  person(p,cx+49,foot,spouse.avatar,'left',spouse.who)
 }
 const qx=cx+4,qy=foot-22
 const av=newborn.avatar?withLookDefaults(newborn.avatar):withLookDefaults({name:'아기',look:'f'})
 const cradle=householdCradleFrame({name:av.name,look:av.look,avatar:{skin:av.skin,hairFront:av.hairFront,hairBack:av.hairBack},hair:av.hairColor},Math.floor(t/3),beat===0)
 const rows=(rr:string[],palette:Record<string,string>)=>rr.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&palette[c])p(qx+x*2,qy+y*2,palette[c],2,2)}))
 rows(cradle.back,cradle.propPalette);rows(cradle.actor,cradle.actorPalette)
 if(beat>=1){
  if(older.baby){
   // 아직 걷지 못하는 큰아이는 부모 품에서 요람을 본다.
   const oa=older.avatar?withLookDefaults(older.avatar):av
   const held=householdCradleFrame({name:oa.name,look:oa.look,avatar:{skin:oa.skin},hair:oa.hairColor},0,false)
   held.actor.forEach((r,y)=>[...r].reverse().forEach((c,x)=>{if(c!=='.'&&held.actorPalette[c])p(cx-15+x*2,foot-23+y*2,held.actorPalette[c],2,2)}))
  }else person(p,cx-7,foot,older.avatar,'right',older.who,false,false,0,1,older.short)
  // 요람 가까이에 붙인다. 손가락과 아기 손은 각각 원본 도트 한 칸이다.
  const skin=writerPalette('spring',older.avatar?withLookDefaults(older.avatar):undefined).s
  p(cx+9,foot-9,skin,2,2);p(cx+11,foot-9,cradle.actorPalette.s,2,2)
 }
 rows(cradle.front,cradle.propPalette)
 p(qx+27,qy+10,'#d7ccb0',2,8)
}
