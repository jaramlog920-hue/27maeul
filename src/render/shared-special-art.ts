import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {StoryLocationContext} from './story-location-context'
import {storyLocationContext} from './story-location-context'
import {drawSharedStoryBackground} from './shared-story-background'
import {drawPastureGround} from './pasture-ground'
import {drawConversationActor} from './shared-conversation-art'
import {spriteRows,writerPalette,ICON_PALETTE,ICONS} from './sprites'
import {OLD_TERRAIN,OLD_VILLAGE_PALETTE} from './old-village-art'
import {drawLibraryExterior} from './house-exterior-art'
import {OT_LIBRARY_ROOF} from './library-roof-palette'
import {ARCHIVE} from '../engine/newland-config'
import {seasonOf} from '../engine/clock'
import {firstChapterLayoutFrame} from './first-chapter-layout'
import {firstChapterViewContext} from './first-chapter-view'

export const SHARED_SPECIAL_IDS=['blanket','firstChapter','newlandGift'] as const
export function drawSharedSpecial(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,location:StoryLocationContext=storyLocationContext(),beat=0){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))},cx=Math.round(w/2)
 const ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6)
 const season=seasonOf(location.day)
 if(id==='newlandGift'){
  drawPastureGround(p,w,h,ground-8)
  p(0,ground-12,'#c6b28a',w,26)
  const stamp=(rows:readonly string[],x:number,y:number,scale:number)=>rows.forEach((r,yy)=>[...r].forEach((ch,xx)=>{const c=(OLD_VILLAGE_PALETTE as Record<string,string>)[ch];if(ch!=='.'&&c)p(x+xx*scale,y+yy*scale,c,scale,scale)}))
  // The original native archive and direction sign, without granting land or moving the game.
  const dx=cx+36-ARCHIVE.x0*16,dy=ground-(ARCHIVE.door.y+1)*16
  const archiveCanvas={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){p(x+dx,y+dy,this.fillStyle,width,height)}}
  drawLibraryExterior(archiveCanvas,{x0:ARCHIVE.x0,y0:ARCHIVE.y0,x1:ARCHIVE.x0+ARCHIVE.w-1,y1:ARCHIVE.door.y,doorX:ARCHIVE.door.x},OT_LIBRARY_ROOF)
  stamp(OLD_TERRAIN.mapWaySign.rows,cx-2,ground-32,2)
  drawConversationActor(g,{avatar,who:'writer',season},{x:cx-48,facing:beat===1?'up':'right',pose:'stand',walk:false},ground,t)
  return
 }
 const view=id==='firstChapter'?firstChapterViewContext(location,w,h,ground,avatar):location
 drawSharedStoryBackground(g,w,h,t,view)
 if(id==='firstChapter'){
  // Loose sheets remain loose sheets. No cover, stitching, completed book or offering.
  const f=firstChapterLayoutFrame(view,w,ground,t,avatar,h)
  for(const sheet of f.papers){p(sheet.x,sheet.y,'#f0e3c3',sheet.w,sheet.h);p(sheet.x+2,sheet.y+1,'#aa9676',7,1)}
  drawConversationActor(g,{avatar,who:'writer',season},{x:f.x,facing:f.facing,pose:'stand',walk:f.walk},f.ground,t)
  return
 }
 if(id==='blanket'){
  const av=avatar?withLookDefaults(avatar):undefined,rows=spriteRows('writer','down',{avatar:av,pose:'stand',frame:0,blink:false,season}),pal=writerPalette(season,av)
  const x=cx-10,top=ground-rows.length*2
  rows.forEach((r,y)=>[...r].forEach((ch,xx)=>{if(ch!=='.'&&pal[ch])p(x+xx*2,top+y*2,pal[ch],2,2)}))
  // Wrap only the existing torso pixels: never cover skin, hair, outline, hands or feet.
  const safeTop=rows.length-9,safeBottom=rows.length-4
  for(let y=safeTop;y<safeBottom;y++)for(let xx=3;xx<=6;xx++){
   const ch=rows[y]?.[xx]
   if(!ch||'.ks!5'.includes(ch))continue
   const pattern=ICONS.blanket[1+(y-safeTop)%5][xx]
   const c=ICON_PALETTE[pattern]
   if(c)p(x+xx*2,top+y*2,c,2,2)
  }
 }
}
