import type {SharedBackgroundSceneState} from './shared-background-scene'
/** Explicit representative preview input; never reads the live game or invents an infant. */
export function sharedBackgroundPreviewState(id:string):SharedBackgroundSceneState {
 return {avatar:null,looks:{},gen:undefined,player:{x:id==='firstChapter'?20:24,y:id==='firstChapter'?112:18,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900}}
}
