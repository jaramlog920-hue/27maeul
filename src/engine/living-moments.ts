import type {GameState} from './game'
import type {GameContent,Book} from './types'
import {BOOKS} from './types'
import {COVER_COLORS,COVER_PATTERNS,SPINE_DECOS,BOOK_DETAIL_CHOICES,type SpecialChoice} from './binding'
import type {FacilityId} from './village-sites'

export function readingMoment(s:GameState,guests:readonly string[]):GameState {
 if(s.flags.readingMoment)return s
 const marks=Object.fromEntries(guests.map(id=>[`readingMomentGuest:${id}`,1]))
 return {...s,flags:{...s.flags,readingMoment:1,...marks},scenes:[...s.scenes,'readingFinished']}
}
export function coverMoment(s:GameState,book:Book,choice:SpecialChoice):GameState {
 if(s.flags.coverMoment)return s
 return {...s,flags:{...s.flags,coverMoment:1,coverMomentBook:BOOKS.indexOf(book),coverMomentColor:COVER_COLORS.indexOf(choice.color),coverMomentPattern:COVER_PATTERNS.indexOf(choice.pattern),coverMomentDeco:SPINE_DECOS.indexOf(choice.deco),coverMomentDetail:BOOK_DETAIL_CHOICES.indexOf(choice.detail??'none')},scenes:[...s.scenes,'coverFinished']}
}
export function childLetterMoment(s:GameState):GameState {
 if(s.flags.childLetterMoment)return s
 return {...s,flags:{...s.flags,childLetterMoment:1,childLetterMomentDay:s.clock.day},scenes:[...s.scenes,'childLetterReceived']}
}
export function facilityMoment(s:GameState,id:FacilityId,crew:readonly string[]):GameState {
 const scene=`facilityFinished:${id}`,marks=Object.fromEntries(crew.map(npc=>[`facilityMomentCrew:${id}:${npc}`,1]))
 return {...s,flags:{...s.flags,...marks},scenes:[...s.scenes,scene]}
}
export function livingGuests(s:Pick<GameState,'flags'>,content:GameContent,prefix:string):string[]{
 return content.neighbors.filter(n=>s.flags[prefix+n.id]).map(n=>n.id)
}
