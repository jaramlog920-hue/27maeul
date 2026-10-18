import {SCENES} from '../../content/text'
import type {SharedBackgroundSceneState} from '../../render/shared-background-scene'
import {storyLocationContext} from '../../render/story-location-context'
import {sharedBackgroundBakerBaby} from '../../render/shared-background-family'
import {storyLayoutObjects} from '../../render/story-layout-art'

/** User-approved wording only when the original action has no real counterpart.
 * Keep the content catalog, choices, rewards, triggers and save data untouched. */
export function sceneStateText(id:string,state:SharedBackgroundSceneState|null){
 const original=SCENES[id]
 if(!original||!state||!['firstChapter','done:baker:2'].includes(id))return original
 let text:string|undefined
 if(id==='done:baker:2'&&!sharedBackgroundBakerBaby(state))text='덕분에 아기 이불을 준비할 수 있었어요.'
 if(id==='firstChapter'){
  const shelf=storyLayoutObjects(storyLocationContext(state),320,108).find(o=>o.id==='homeShelf'||o.id==='bookcase')
  if(!shelf)text='첫 장을 차례대로 이어 정리해 두었다.'
 }
 return text?{...original,lines:original.lines.map((line,i)=>i===0?{...line,text}:line)}:original
}
