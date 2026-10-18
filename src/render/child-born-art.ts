import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {householdCradleFrame} from './village-followup-art'
import {writerPalette} from './sprites'

/** 첫 아이의 탄생: 긴 밤 → 아침에 품에 안기 → 넓힌 방 요람 곁. */
export function drawChildBorn(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,baby:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),floor=Math.round(h>w?h*.68-42:h<=170?h*.48:Math.min(h*.4,h-110)),foot=floor+42,night=beat===0
 g.imageSmoothingEnabled=false
 p(0,0,night?'#93887d':'#ddcfb5',w,h);p(0,floor,night?'#88765e':'#baa17e',w,h-floor)
 p(0,floor-3,night?'#6c5f50':'#9f8663',w,3)
 for(let y=floor+8;y<h;y+=10)p(0,y,night?'#796950':'#ab916f',w,1)
 // 오른쪽 확장 방의 넓은 입구와 창. 칸막이는 얼굴·발을 가로지르지 않는다.
 p(cx+2,0,night?'#796f65':'#c5b392',5,floor-3);p(cx+7,0,night?'#aaa08a':'#eadfc2',2,floor-3)
 p(cx+57,floor-60,'#987d5b',43,36);p(cx+60,floor-57,night?'#41495d':'#eee3bb',37,30)
 if(night){for(const [x,y] of [[4,4],[17,9],[30,3]])p(cx+60+x,floor-57+y,'#c9c8b5',1,1)}
 else p(cx+60,floor-38,'#b5c6a0',37,11)
 p(cx+78,floor-57,'#b3956d',2,30);p(cx+60,floor-40,'#b3956d',37,2);p(cx+54,floor-25,'#bca17a',49,3)
 // 부부 침대, 두 베개, 출산 준비의 씻는 대야와 작은 수건.
 p(cx-116,floor-6,'#927553',77,37);p(cx-113,floor-3,'#e4d9bc',71,31)
 for(const x of [cx-110,cx-78]){p(x,floor-1,'#eee6d0',28,7);p(x,floor+5,'#d1c6aa',28,1)}
 p(cx-112,floor+9,night?'#8c9f95':'#adbfaf',69,18);p(cx-112,floor+15,'#c6d0ba',69,2);p(cx-116,floor+28,'#7c654b',77,4)
 p(cx-100,floor+41,'#a58b65',23,8);p(cx-98,floor+40,'#d2c6a7',19,2);p(cx-96,floor+43,'#a9b5a4',15,2)
 p(cx+91,floor+5,'#b79870',16,18);p(cx+89,floor+3,'#c6aa80',20,3);p(cx+92,floor+1,'#e3d9bd',13,2)
 // 밤 동안 켜 둔 작은 등잔. 불꽃만 움직이고 등잔·화면 크기는 고정.
 const lx=cx-29,ly=floor-5
 p(lx-5,ly,'#9c805e',19,3);p(lx-3,ly+3,'#856c51',2,16);p(lx+9,ly+3,'#856c51',2,16)
 p(lx,ly-6,'#b99868',9,6);p(lx+1,ly-7,'#cdb17d',7,2);p(lx+5,ly-10,'#78644e',2,4)
 if(night){p(lx+5,ly-13,'#e0b774',2,3);p(lx+5,ly-14+Math.floor(t*2)%2,'#f1d79b',1,2)}
 const av=baby.avatar?withLookDefaults(baby.avatar):withLookDefaults({name:'아기',look:'f'})
 const cradle=householdCradleFrame({name:av.name,look:av.look,avatar:{skin:av.skin},hair:av.hairColor},Math.floor(t/3),false)
 const layer=(rows:string[],pal:Record<string,string>,x:number,y:number,mirror=false)=>rows.forEach((row,yy)=>(mirror?[...row].reverse():[...row]).forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,y+yy*2,pal[c],2,2)}))
 const qx=cx+28,qy=floor+10
 layer(cradle.back,cradle.propPalette,qx,qy)
 if(beat>=2)layer(cradle.actor,cradle.actorPalette,qx,qy)
 layer(cradle.front,cradle.propPalette,qx,qy)
 if(night){
  person(p,cx-62,foot-6,avatar,'right','writer',true)
  person(p,cx-44,foot-6,spouse.avatar,'left',spouse.who,true)
  const pa=writerPalette('spring',avatar?withLookDefaults(avatar):undefined),sa=writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined)
  p(cx-46,foot-14,pa.s,3,2);p(cx-43,foot-14,sa.s,3,2)
 }else if(beat===1){
  person(p,cx-23,foot,avatar,'right')
  person(p,cx+5,foot,spouse.avatar,'left',spouse.who)
  // 포대기를 가슴 아래에서 받친다. 얼굴은 부모 얼굴과 겹치지 않는다.
  layer(cradle.actor,cradle.actorPalette,cx-31,foot-25,true)
  const pa=writerPalette('spring',avatar?withLookDefaults(avatar):undefined)
  p(cx-12,foot-10,pa.s,3,2)
 }else{
  person(p,cx+3,foot,avatar,'right','writer',true)
  person(p,cx+62,foot,spouse.avatar,'left',spouse.who,true)
 }
}
