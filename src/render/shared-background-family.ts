import type {GameState} from '../engine/game'
import {bakerBabyAt,BAKER_BABY_ID} from '../engine/gen'
import {slotPerson} from '../engine/gen-growth'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {storyAvatarSnapshot} from './story-avatar-snapshot'

/** Only the current baker's actual infant. Never turn a grown child back into a baby. */
export function sharedBackgroundBakerBaby(s:Pick<GameState,'gen'|'clock'>):FinalePerson|null {
 const gen=s.gen,id=gen?slotPerson(gen,'baker'):'baker',parent=gen?.persons[id]
 const house=parent?.household?gen?.households[parent.household]:undefined
 const fixed=bakerBabyAt(s.clock.day,gen?.persons[BAKER_BABY_ID])
 const current=house?.children.map(pid=>gen?.persons[pid]).filter(p=>p?.stage==='baby').at(-1)
 const baby=id==='baker'&&fixed?.stage==='baby'?fixed:current
 return baby?{avatar:storyAvatarSnapshot(withLookDefaults({name:baby.name??'아기',look:baby.look??'f',...baby.avatar,...(baby.hair?{hairColor:baby.hair}:{})})),who:'writer'}:null
}
