import type {GameState} from '../engine/game'
import {neighborById} from '../content/catalog'
import {slotPerson} from '../engine/gen-growth'
import {genAvatar} from '../engine/gen-looks'
import {seasonOf} from '../engine/clock'
import {neighborLook} from './neighbor-look'
import {residentIsElder} from './elder-details'
import {sharedBackgroundDraftPeople,SHARED_BACKGROUND_DRAFT_IDS} from './shared-background-draft-art'
import {sharedBackgroundBakerBaby} from './shared-background-family'
import type {FinalePerson} from './library-finale-art'
import {childGrowth} from '../engine/stories'
import {storyAvatarSnapshot} from './story-avatar-snapshot'

type CastState=Pick<GameState,'gen'|'looks'|'clock'>
/** Same native appearance/wardrobe/heir priority as the live village renderer. */
export function sharedBackgroundActor(s:CastState,role:string):(FinalePerson&{id:string;role:string})|null {
 const def=neighborById(role)
 if(!def)return null
 const id=slotPerson(s.gen,role),person=s.gen?.persons[id],heir=id!==role&&person?genAvatar(person):null
 const elder=residentIsElder(s.gen,id),look=neighborLook(def,role==='child'?childGrowth(s.clock.day):undefined,s.looks?.[id],elder,heir)
 return {id,role,who:look.who,avatar:look.extra.avatar?storyAvatarSnapshot(look.extra.avatar):null,growth:look.extra.growth,elder:look.extra.elder,season:seasonOf(s.clock.day)}
}
/** Original speakers only. No fallback stranger, extra parent or hypothetical baby. */
export function sharedBackgroundCast(s:CastState,id:string){
 if(!SHARED_BACKGROUND_DRAFT_IDS.includes(id))return null
 return {people:sharedBackgroundDraftPeople(id).map(role=>sharedBackgroundActor(s,role)),baby:id==='done:baker:2'?sharedBackgroundBakerBaby(s):null}
}
