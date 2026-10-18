import {storyLocationContext,type StoryLocationState} from './story-location-context'
import {storyRoomWallObjects,storyLayoutObjects} from './story-layout-art'
import {currentHomeLevel,homeLayoutOverrideAt} from '../engine/world'
import {currentMapId} from '../engine/maps'

const state=(extra:Partial<StoryLocationState>={}):StoryLocationState=>({player:{x:21,y:112,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},homeLevel:1,room:[],...extra})
it('snapshots the full actual perimeter and doorway without filling missing extension corners',()=>{
 const c=storyLocationContext(state()),tiles=c.layout!.roomTiles!,walls=storyRoomWallObjects(c,320,108)
 expect(tiles['21,110']).toBe('D');expect(walls.some(o=>o.key==='21,110')).toBe(false)
 expect(walls.some(o=>o.key==='16,112')).toBe(true)
 expect(walls.some(o=>o.key==='24,112')).toBe(true)
 expect(homeLayoutOverrideAt(10,105,3)).toBeUndefined()
 expect(homeLayoutOverrideAt(21,110,1)).toBe('D')
})
it('draws a continuous partition with native vertical highlights and a native horizontal cap',()=>{
 const c=storyLocationContext(state({homeWalls:{built:['20,111','20,112','20,113'],removed:[]}})),walls=storyRoomWallObjects(c,320,108)
 const middle=walls.find(o=>o.key==='20,112')!,next=walls.find(o=>o.key==='20,113')!,top=walls.find(o=>o.key==='22,110')!
 expect(middle.rows[8]).toBe('bb'+'a'.repeat(12)+'bb')
 expect(next.y-middle.y).toBe(16)
 expect(top.rows[0]).toBe('b'.repeat(16));expect(top.rows[15]).toBe('c'.repeat(16))
})
it('removes a shared wall completely and never restores it behind the actors',()=>{
 const c=storyLocationContext(state({homeWalls:{built:[],removed:['20,110']}}))
 expect(c.layout?.roomTiles?.['20,110']).toBe('f')
 expect(storyRoomWallObjects(c,320,108).some(o=>o.key==='20,110')).toBe(false)
})
it('keeps original level-zero wall-edit gating and the default spouse-room window',()=>{
 const c=storyLocationContext(state({homeLevel:0,homeWalls:{built:['20,112'],removed:[]}}))
 expect(c.layout?.roomTiles?.['20,112']).not.toBe('#')
 const partner=storyLocationContext(state({player:{...state().player,x:21,y:107}}))
 expect(partner.layout?.roomTiles?.['23,104']).toBe('N')
 expect(storyLayoutObjects(partner,320,108).map(o=>o.id)).toEqual(['N'])
})
it.each([[320,108],[320,374],[320,83]])('keeps map-wall diagnostics separate from grounded event furniture at %i × floor %i', (w,ground)=>{
 const s=state({room:[{item:'jar',x:20,y:111}],homeWalls:{built:['19,111','19,112'],removed:[]}}),before=JSON.stringify(s),level=currentHomeLevel(),map=currentMapId(),c=storyLocationContext(s)
 const walls=storyRoomWallObjects(c,w,ground),left=walls.find(o=>o.key==='19,111')!,below=walls.find(o=>o.key==='19,112')!,jar=storyLayoutObjects(c,w,ground).find(o=>o.id==='jar')!
 expect(below.y-left.y).toBe(16)
 expect(jar.x).toBe(w/2-32)
 expect(jar.y+jar.rows.length).toBe(ground-36)
 expect(JSON.stringify(s)).toBe(before);expect(currentHomeLevel()).toBe(level);expect(currentMapId()).toBe(map)
})
