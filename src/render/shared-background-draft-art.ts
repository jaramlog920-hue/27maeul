import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {StoryLocationContext} from './story-location-context'
import {storyLocationContext} from './story-location-context'
import {drawSharedStoryBackground} from './shared-story-background'
import {SHARED_GIFT_IDS,SHARED_GIFT_SPECS,drawSharedGiftForeground} from './shared-gift-art'
import {SHARED_REQUEST_REWARD_IDS,sharedRequestRewardSpec,drawSharedRequestRewardForeground} from './shared-request-reward-art'
import {SHARED_CONVERSATION_IDS,sharedConversationPeople,drawSharedConversationForeground} from './shared-conversation-art'
import {SHARED_RETURN_WALK_IDS,drawSharedReturnWalkForeground} from './shared-return-walk-art'
import {SHARED_SPECIAL_IDS,drawSharedSpecial} from './shared-special-art'
import {seasonOf} from '../engine/clock'

/** Shared foreground registry. Runtime activation is separate from final visual QA. */
export const SHARED_BACKGROUND_DRAFT_IDS=[...SHARED_GIFT_IDS,...SHARED_REQUEST_REWARD_IDS,...SHARED_CONVERSATION_IDS,...SHARED_RETURN_WALK_IDS,...SHARED_SPECIAL_IDS]
export const isSharedBackgroundStory=(id:string)=>SHARED_BACKGROUND_DRAFT_IDS.includes(id)
export function sharedBackgroundDraftPeople(id:string):string[]{
 if(SHARED_GIFT_SPECS[id])return [SHARED_GIFT_SPECS[id].npc]
 const reward=sharedRequestRewardSpec(id)
 if(reward)return [reward.request.npc]
 if(SHARED_RETURN_WALK_IDS.includes(id))return [id.split(':')[1]]
 return sharedConversationPeople(id)
}
export function drawSharedBackgroundDraft(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat=0,location:StoryLocationContext=storyLocationContext(),baby:FinalePerson|null=null){
 if(!SHARED_BACKGROUND_DRAFT_IDS.includes(id))return false
 const season=seasonOf(location.day),resident={...npc,season:npc.season??season}
 if((SHARED_SPECIAL_IDS as readonly string[]).includes(id)){drawSharedSpecial(g,id,w,h,t,avatar,location,beat);return true}
 const {ground}=drawSharedStoryBackground(g,w,h,t,location,SHARED_RETURN_WALK_IDS.includes(id))
 if(SHARED_GIFT_SPECS[id])drawSharedGiftForeground(g,id,w,ground,t,avatar,resident,season)
 else if(SHARED_REQUEST_REWARD_IDS.includes(id))drawSharedRequestRewardForeground(g,id,w,ground,t,beat,avatar,resident,baby,season)
 else if(SHARED_RETURN_WALK_IDS.includes(id))drawSharedReturnWalkForeground(g,id,w,ground,t,beat,avatar,resident,season)
 else drawSharedConversationForeground(g,id,w,ground,t,beat,avatar,resident,season)
 return true
}
