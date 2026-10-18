import type {GameState} from '../engine/game'
import type {DateArtOrigin,StoryLocationState} from './story-location-context'
import {sceneLocationContext} from './scene-location-context'
import {sharedBackgroundCast} from './shared-background-cast'
import {storyAvatarSnapshot} from './story-avatar-snapshot'
import {drawSharedBackgroundDraft} from './shared-background-draft-art'

export type SharedBackgroundSceneState=StoryLocationState&Pick<GameState,'avatar'|'looks'|'gen'>

/** Prepare the same detached scene input for animation, preview and thumbnail sizes. */
export function sharedBackgroundSceneSnapshot(s:SharedBackgroundSceneState,id:string,options:{preview?:boolean;dateOrigin?:DateArtOrigin|null}={}){
 const cast=sharedBackgroundCast(s,id)
 if(!cast||cast.people.some(person=>!person))return null
 const location=sceneLocationContext(s,id,options.dateOrigin)
 if(options.preview)location.mode='preview'
 return {id,avatar:options.preview||!s.avatar?null:storyAvatarSnapshot(s.avatar),people:cast.people,baby:cast.baby,location}
}

export type SharedBackgroundSceneSnapshot=NonNullable<ReturnType<typeof sharedBackgroundSceneSnapshot>>

/** Common runtime/review renderer; this function never writes saves or albums. */
export function drawSharedBackgroundScene(g:CanvasRenderingContext2D,scene:SharedBackgroundSceneSnapshot,w:number,h:number,t:number,beat=0){
 // Narration-only special scenes do not paint this unused actor argument.
 const actor=scene.people[0]??{avatar:null,who:'writer' as const}
 return drawSharedBackgroundDraft(g,scene.id,w,h,t,scene.avatar,actor,beat,scene.location,scene.baby)
}
