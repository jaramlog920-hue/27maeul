import giftSpecs from './shared-gift-specs.json'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {FURNITURE_ART,FURNI_PALETTE} from './furniture-art'
import {COOKING_PROPS} from './cooking-art'
import {ICONS,ICON_PALETTE} from './sprites'
import {sharedGiftPlayerArt} from './shared-gift-player'

type GiftSpec={npc:string;items:Record<string,number>;original:string[]}
export const SHARED_GIFT_SPECS:Record<string,GiftSpec>=giftSpecs
/** Shared gift foregrounds use the same runtime and review renderer. */
export const SHARED_GIFT_IDS=Object.keys(SHARED_GIFT_SPECS)
export interface GiftProp {item:string;x:number;y:number;scale:number;rows:readonly string[];palette:Record<string,string>}

export function sharedGiftProps(id:string,cx:number,ground:number,t:number):GiftProp[]{
 const spec=SHARED_GIFT_SPECS[id]
 if(!spec)return []
 const items=Object.entries(spec.items).flatMap(([item,n])=>Array.from({length:n},()=>item))
 const material=items.every(item=>!FURNITURE_ART[item]),gap=20,total=items.length*gap-4
 return items.map((item,i)=>{
  // The apothecary's old cooking pot and the child's living plant share an inventory id.
  // Preserve that original distinction without changing the actual inventory.
  // A gift rug is still folded, not installed across the current meeting place.
  const furniture=id==='gift:apothecary:6'?COOKING_PROPS.potEmpty:item==='rug'?undefined:FURNITURE_ART[item]
  const rows=furniture?.rows??ICONS[item]
  if(!rows)throw new Error(`Missing native gift art: ${id}/${item}`)
  const palette={...(furniture?FURNI_PALETTE:ICON_PALETTE)}
  const scale=2,width=rows[0].length*scale,height=rows.length*scale
  const x=material?cx-total/2+i*gap+Math.round((1-Math.min(1,Math.max(0,t/.8)))*12):cx-width/2
  const y=material?ground-14-height:ground+6-height
  return {item,x:Math.round(x),y,scale,rows,palette}
 })
}

/** No background choice, saved reward or installed furniture is changed by these foregrounds. */
export function drawSharedGiftForeground(g:CanvasRenderingContext2D,id:string,w:number,ground:number,t:number,av:Avatar|null,npc:FinalePerson,season:NonNullable<FinalePerson['season']>='spring'){
 const spec=SHARED_GIFT_SPECS[id]
 if(!spec)return
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))},cx=Math.round(w/2)
 const props=sharedGiftProps(id,cx,ground,t),material=Object.keys(spec.items).every(item=>!FURNITURE_ART[item])
 if(material){const width=Math.max(32,props.length*20+2);p(cx-width/2,ground-12,'#b69871',width,4);p(cx-width/2+3,ground-8,'#866548',3,14);p(cx+width/2-6,ground-8,'#866548',3,14)}
 for(const a of props){
  a.rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&a.palette[c])p(a.x+x*a.scale,a.y+y*a.scale,a.palette[c],a.scale,a.scale)}))
  if(id==='gift:smith:9'){p(a.x+3,a.y+8,'#878176',2,3);p(a.x+a.rows[0].length*2-6,a.y+8,'#878176',2,3)}
  if(id==='gift:child:3'){
   p(cx,ground-22,'#708b5b',1,12);p(cx-4,ground-24,'#eee1bd',5,3);p(cx+1,ground-27,'#c8a3ad',5,3);p(cx-1,ground-25,'#e1bb77',2,2)
  }
  if(id==='gift:child:6'){p(cx,ground-19,'#708b5b',1,10);p(cx-4,ground-18,'#8ea76e',7,3);p(cx,ground-23,'#8ea76e',7,3)}
  // Use marks remain on the object, away from the native short hands and faces.
  if(id==='gift:fisher:9'||id==='gift:grandpa:9')p(cx-4,ground-3,'#a99878',3,1)
  if(id==='gift:presser:9')p(cx-3,ground-5,'#b99a6d',5,1)
  if(id==='gift:weaver:9')p(cx-7,ground-5,'#a18560',14,1)
  if(id==='gift:postman:9'){p(cx-8,ground-5,'#987957',3,1);p(cx+4,ground-3,'#987957',2,1)}
  if(id==='gift:fisher:6')p(cx-7,ground-4,'#e5cf9e',14,1)
 }
 const player=sharedGiftPlayerArt(id,cx,ground,t,av,season)
 player.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'&&player.palette[ch])p(player.x+x*2,player.y+y*2,player.palette[ch],2,2)}))
 const crouch=!material&&t<.65
 person(p,cx+60,ground,npc.avatar,'left',npc.who,crouch,false,t,npc.growth??1,npc.short,npc.elder,npc.season)
}
