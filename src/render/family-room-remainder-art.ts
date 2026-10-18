import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawFamilyRoomBackground} from './family-room-background'
import {furnitureUseFrame} from './furniture-use-motion'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'
import {REMAINING_FIXTURE_ART} from './remaining-furniture-art'
import {PALETTE,writerPalette,spriteRows} from './sprites'

export const FAMILY_ROOM_REMAINDER_IDS=['sick','dinner:child'] as const
export const isFamilyRoomRemainder=(id:string)=>(FAMILY_ROOM_REMAINDER_IDS as readonly string[]).includes(id)
export const familyRoomRemainderPeople=(id:string)=>[id==='sick'?'baker':'child']

/** The shared wall/floor stays native; the player's bed and Willow's learning room stay distinct. */
export function drawFamilyRoomRemainder(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),sick=id==='sick'
 g.imageSmoothingEnabled=false
 drawFamilyRoomBackground(p,w,h,ground,sick?false:true)
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=2)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const furniture=(key:string,x:number,y:number,scale=1)=>{const a=FURNITURE_ART[key]??REMAINING_FIXTURE_ART[key];if(a)stamp(a.rows,FURNI_PALETTE,x,y,scale)}
 if(sick){
  // FIXTURES.homeBed is the existing upper-left bed. Preserve its native view and size.
  const bed=FURNITURE_ART.homeBed,bx=cx-74,by=ground-58
  furniture('homeBed',bx,by,2)
  const full=av?withLookDefaults(av):undefined
  const lying=furnitureUseFrame('writer','down','lie',2,{frame:0,blink:false,avatar:full}).actor
  stamp(lying,writerPalette('spring',full),bx+(bed.w*32-48)/2,by+2)
  // A visitor arrives only on the spoken page; the bowl stays on a separate bedside surface.
  if(beat>=1){
   const arrive=beat>=2?1:Math.min(1,Math.max(0,t/.7)),x=cx-5+Math.round((1-arrive)*20)
   person(p,x,ground,npc.avatar,'left',npc.who,false,arrive<1,t,1,npc.short)
   furniture('stool',cx-26,ground-12)
   if(t>=.7||beat>=2){p(cx-23,ground-15,'#e7ddbf',10,3);p(cx-22,ground-17,'#c79663',8,2);p(cx-20,ground-17,'#92a37b',2,1)}
  }
  return
 }
 // ROOMS.child: two beds to the left, chest and hearth behind the learning table.
 furniture('homeBed',cx-116,ground-62)
 furniture('homeBed',cx-82,ground-62)
 furniture('chest',cx-42,ground-53)
 furniture('h',cx+31,ground-53)
 const nx=cx+35
 person(p,cx-61,ground,av,'right','writer',true)
 if(beat>=1&&t<.7){
  const full=npc.avatar?withLookDefaults(npc.avatar):undefined
  stamp(spriteRows(npc.who,'left',{frame:0,blink:false,avatar:full,short:npc.short,pose:'wave'}),npc.who==='writer'?writerPalette('spring',full):PALETTE,nx,ground-spriteRows(npc.who,'left',{frame:0,blink:false,avatar:full,short:npc.short,pose:'wave'}).length*2)
 }else person(p,nx,ground,npc.avatar,'left',npc.who,true,false,0,1,npc.short)
 // The learning table occupies the gap between bodies; all short hands and feet stay exposed.
 furniture('table',cx-17,ground-15)
 p(cx-9,ground-15,'#eee2c3',17,9)
 p(cx-6,ground-13,'#89745c',7,1);p(cx-3,ground-13,'#89745c',1,5);p(cx-6,ground-9,'#89745c',7,1)
 furniture('teapot',cx+4,ground-19)
}
