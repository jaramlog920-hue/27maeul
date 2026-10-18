import {storyLocationContext} from './story-location-context'
import {storySheepFrames} from './story-sheep-art'
import {villageSheepFrames} from './village-sheep-frame'
import {sharedBackgroundKey} from './shared-story-background'

const context=(flags:Record<string,number>={})=>storyLocationContext({player:{x:9,y:28,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},flags})
it('chooses the actual pen by map coordinates, and preserves exactly three/five native sheep',()=>{
 expect(sharedBackgroundKey(context())).toBe('sheep-pasture')
 expect(storySheepFrames(context(),320,108,0)).toHaveLength(3)
 expect(storySheepFrames(context({'unlock:penBig':1}),320,108,0)).toHaveLength(5)
 expect(sharedBackgroundKey({...context(),datePlace:'tea'},true)).toBe('tea-front')
})
it('stops each native sheep during its grazing interval rather than sliding its body while eating',()=>{
 const a=villageSheepFrames({},9.1)[0],b=villageSheepFrames({},11.8)[0]
 expect(a.action).toBe('graze');expect(b.action).toBe('graze')
 expect(a.x).toBe(b.x);expect(a.y).toBe(b.y)
 expect(villageSheepFrames({},8.9)[0].action).toBe('walk')
})
it.each([83,108,374])('anchors native feet and keeps immutable unlock state at floor %i',ground=>{
 const c=context({'unlock:penBig':1}),before=JSON.stringify(c),frames=storySheepFrames(c,320,ground,.6)
 expect(frames.every(a=>Number.isInteger(a.px)&&Number.isInteger(a.py))).toBe(true)
 for(const a of frames)expect(a.py+a.rows.length).toBe(Math.round(ground+(a.y-c.at.y)*16-1))
 expect(JSON.stringify(c)).toBe(before)
 expect(storySheepFrames({...c,map:'newland'},320,ground,0)).toEqual([])
 expect(storySheepFrames({...c,indoors:true},320,ground,0)).toEqual([])
})
