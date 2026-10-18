import {drawFamilyRoomRemainder,FAMILY_ROOM_REMAINDER_IDS} from './family-room-remainder-art'
import {person} from './milestone-moments-art'
import {furnitureUseFrame} from './furniture-use-motion'
import {FURNITURE_ART} from './furniture-art'
import {spriteRows,writerPalette} from './sprites'
import {withLookDefaults} from '../engine/avatar'
import {SCENES} from '../content/text'
const npc={avatar:withLookDefaults({name:'다음 세대 이웃',look:'f',skin:2,top:5,hairFront:8}),who:'writer' as const}
const frames=FAMILY_ROOM_REMAINDER_IDS.flatMap(id=>SCENES[id].lines.flatMap((_,beat)=>[0,.35,.7,1.2,8].flatMap(t=>[170,180,480,693].flatMap(h=>[null,withLookDefaults({name:'기록자',look:'m',top:3,skin:3})].map(av=>({id,beat,t,h,av}))))))
it.each(frames)('$id phase $beat time $t height $h preserves native body, face, short hands and feet',({id,beat,t,h,av})=>{
 const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-90,y);yy<Math.min(ground+4,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawFamilyRoomRemainder(g,id,320,h,t,av,npc,beat)
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,y+yy*2,pal[c],2,2)}))
 if(id==='sick'){
  stamp(furnitureUseFrame('writer','down','lie',2,{frame:0,blink:false,avatar:av??undefined}).actor,writerPalette('spring',av??undefined),86+(FURNITURE_ART.homeBed.w*32-48)/2,ground-56)
  if(beat>=1){const arrive=beat>=2?1:Math.min(1,t/.7);person(p,155+Math.round((1-arrive)*20),ground,npc.avatar,'left',npc.who,false,arrive<1,t)}
 }else{
  person(p,99,ground,av,'right','writer',true)
  if(beat>=1&&t<.7){const rows=spriteRows('writer','left',{frame:0,blink:false,avatar:npc.avatar,pose:'wave'});stamp(rows,writerPalette('spring',npc.avatar),195,ground-rows.length*2)}
  else person(p,195,ground,npc.avatar,'left','writer',true)
 }
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
})
