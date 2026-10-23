import type {GameState} from './game'
import type {ItemId} from './types'
import {count,take} from './items'
import {slotPerson} from './gen-growth'

export const WEDDING_ATTIRE=[
 {item:'weddingTuxedo',outfit:'groom-midnight',name:'검정 턱시도',coins:180},
 {item:'weddingWhiteSuit',outfit:'groom-white',name:'흰 재킷 정장',coins:180},
 {item:'weddingBallDress',outfit:'bride-ball',name:'흰 벨라인 웨딩드레스',coins:180},
 {item:'weddingLaceDress',outfit:'bride-lace',name:'로즈 레이스 드레스',coins:180},
] as const
export type WeddingAttireItem=typeof WEDDING_ATTIRE[number]['item']
export function isWeddingAttire(item:ItemId):item is WeddingAttireItem{return WEDDING_ATTIRE.some(a=>a.item===item)}
const numberOf=(item:WeddingAttireItem)=>WEDDING_ATTIRE.findIndex(a=>a.item===item)+1
const styleOf=(n:number|undefined)=>WEDDING_ATTIRE.find((_,i)=>i+1===n)?.outfit??null
export function weddingGiftsFor(s:GameState,id:string):WeddingAttireItem[]{
 return s.romance?.stage==='engaged'&&s.romance.partner===id?WEDDING_ATTIRE.filter(a=>count(s.inv,a.item)>0).map(a=>a.item):[]
}
/** An outfit is a cosmetic preparation gift, separate from daily affinity gifts. */
export function giveWeddingAttire(s:GameState,id:string,item:WeddingAttireItem):GameState|null{
 if(!weddingGiftsFor(s,id).includes(item))return null
 const inv=take(s.inv,{[item]:1})!
 return {...s,inv,flags:{...s.flags,[`weddingGift:${slotPerson(s.gen,id)}`]:numberOf(item)}}
}
/** Freeze the partner's gift at the real ceremony, even after generations change. */
export function recordWeddingAttire(s:GameState,id:string):GameState{
 return {...s,flags:{...s.flags,[`weddingPartnerWear:${id}:${s.clock.day}`]:s.flags[`weddingGift:${slotPerson(s.gen,id)}`]??0}}
}
function ceremonyDay(s:GameState,id:string){
 return s.romance?.partner===id&&s.romance.stage==='married'?s.romance.marriedDay??s.clock.day:s.album.find(a=>a.id===`wedding:${id}`)?.day??s.clock.day
}
const wearKey=(s:GameState,id:string)=>`weddingPlayerWear:${id}:${ceremonyDay(s,id)}`
export function weddingOutfitsFor(s:GameState,id:string){
 const day=ceremonyDay(s,id)
 return {player:styleOf(s.flags[wearKey(s,id)]),partner:styleOf(s.flags[`weddingPartnerWear:${id}:${day}`]),chosen:s.flags[wearKey(s,id)]!==undefined}
}
/** Only the current queued ceremony can choose. Owned outfits are reusable. */
export function chooseWeddingAttire(s:GameState,item:WeddingAttireItem|null):GameState|null{
 const id=s.romance?.partner
 if(!id||s.romance.stage!=='married'||!s.scenes.includes(`wedding:${id}`))return null
 if(item&&!WEDDING_ATTIRE.some(a=>a.item===item&&count(s.inv,item)>0))return null
 if(weddingOutfitsFor(s,id).chosen)return null
 return {...s,flags:{...s.flags,[wearKey(s,id)]:item?numberOf(item):0}}
}
