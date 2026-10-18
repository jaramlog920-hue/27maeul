import {storyLocationContext,type StoryLocationState,type DateArtOrigin} from './story-location-context'

/** UI provenance is valid only for this partner and day; restored queues are not provenance. */
export function sceneLocationContext(state:StoryLocationState,id:string,origin?:DateArtOrigin|null){
 const date=origin&&id===`loverTrust:${origin.partner}`&&state.clock.day===origin.day?origin:null
 const current=id.startsWith('loverTrust:')&&!date?{...state,scenes:[]}:state
 return storyLocationContext(date?{...state,map:date.map,player:{...state.player,...date.at},clock:{...state.clock,minute:date.minute}}:current,date?{datePlace:date.place}:{})
}
