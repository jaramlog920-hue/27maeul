import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {Facing} from '../engine/types'
import {spriteRows,writerPalette,PALETTE,type Who} from './sprites'

export const WEDDING_OUTFITS=[
 {id:'groom-midnight',name:'남자 1 · 검정 턱시도',look:'m',main:'#303541',shade:'#1e232d',trim:'#f7f3e9',accent:'#697382',bottom:'#292e38'},
 {id:'groom-white',name:'남자 2 · 흰 재킷 정장',look:'m',main:'#f5f1e8',shade:'#c5c7cc',trim:'#303541',accent:'#8e969f',bottom:'#292e38'},
 {id:'bride-ball',name:'여자 1 · 흰 벨라인 웨딩드레스',look:'f',main:'#fffaf0',shade:'#d5d8df',trim:'#e9e5dc',accent:'#d7bd84',bottom:'#eeeef1'},
 {id:'bride-lace',name:'여자 2 · 로즈 레이스 드레스',look:'f',main:'#e8c4ce',shade:'#be96ac',trim:'#fff6ee',accent:'#9f728f',bottom:'#dbb0c2'},
] as const
export type WeddingOutfitId=typeof WEDDING_OUTFITS[number]['id']
export type WeddingDressedAvatar=Avatar&{weddingOutfit?:WeddingOutfitId}
export function weddingDressedAvatar(avatar:Avatar|null,outfit:WeddingOutfitId|null):Avatar|null{
 return outfit?{...(avatar??{name:'기록자',look:'f'}),weddingOutfit:outfit} as WeddingDressedAvatar:avatar
}

/** Clothing-only sprite variants; no avatar, wardrobe or save is written. */
export function weddingOutfitFrame(avatar:Avatar,id:WeddingOutfitId,facing:Facing='down',time=0,pose:'stand'|'wave'|'crouch'='stand',walk=false,who:Who='writer',elder=false){
 const outfit=WEDDING_OUTFITS.find(outfit=>outfit.id===id)!,av=withLookDefaults({...avatar,top:0,bottom:outfit.look==='f'?0:2})
 const original=spriteRows(who,facing,{avatar:av,frame:walk?(Math.floor(time*3)%2?1:2):0,blink:false,pose:pose==='crouch'?'stand':pose,elder,season:'spring'})
 const garment=who==='merchant'?'pQH':who==='smith'?'nNLy':who==='postman'?'tTaLy':'rRldDb'
 const cells=original.map((row,y)=>[...row].map(ch=>{
  if(y<7||y>12||!garment.includes(ch))return ch
  if(y>=11)return outfit.look==='m'||y===12?'δ':'α'
  if(ch==='R'||ch==='D')return 'β'
  return 'α'
 }))
 const front=facing==='down',back=facing==='up',side=!front&&!back
 const put=(x:number,y:number,ink:string)=>{
  // The silhouette may widen at the skirt hem; protected anatomy never changes.
  const protectedInk=who==='merchant'?'s5!L+o2':who==='smith'?'s5!j+o2':'s5!h01+o2'
  if(!protectedInk.includes(original[y]?.[x]??'.'))cells[y][x]=ink
 }
 if(outfit.look==='m'){
  if(!back){
   const centre=side?(facing==='right'?5:4):4
   // White shirt triangle, diagonal satin lapels, bow tie and jacket buttons.
   put(centre,7,'ζ');put(centre+1,7,'ζ')
   put(centre,8,'η');put(centre+1,8,id==='groom-white'?'η':'ζ')
   put(centre,9,id==='groom-white'?'ζ':'η');put(centre+1,9,'ζ')
   put(centre+1,10,'κ')
   if(!side){put(3,7,'ζ');put(6,7,'ζ');put(3,8,'ε');put(6,8,'ε')}
  }else {put(4,9,'β');put(5,10,'β')}
 }else{
  // Fitted bodice, narrow waist and a flared floor-length skirt ending above
  // the existing feet. The shoulders and short arms keep their native shape.
  for(let x=3;x<=6;x++)put(x,9,'ε')
  for(let x=1;x<=8;x++)put(x,11,x===1||x===8?'β':'α')
  for(let x=0;x<=9;x++)put(x,12,x===0||x===9?'β':id==='bride-lace'?'γ':'δ')
  if(!back){
   for(const x of side?[4,5]:[3,6])put(x,7,'γ')
   put(4,8,'γ');put(5,8,'γ')
   if(id==='bride-lace')for(const x of [3,5,7])put(x,11,'γ')
   else {put(3,11,'δ');put(6,11,'δ')}
  }
 }
 const drawn=cells.map(row=>row.join('')),rows=pose==='crouch'?[...drawn.slice(0,7),...drawn.slice(9)]:drawn
 const palette:Record<string,string>={...(who==='writer'?writerPalette('spring',av):PALETTE),'α':outfit.main,'β':outfit.shade,'γ':outfit.trim,'δ':outfit.bottom,'ε':outfit.accent,'ζ':'#fbf7ef','η':'#272b35','κ':'#e3cc9b'}
 // Face, hair, skin, hands, feet and total sprite height remain native.
 return {rows,palette,original,time}
}
