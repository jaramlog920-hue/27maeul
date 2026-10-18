import {storyLocationContext,type StoryLocationState} from './story-location-context'
import {storyNewlandTerrain} from './story-terrain-art'
import {storyHomeWallObjects,storyLayoutObjects,storyNewlandBuildings} from './story-layout-art'
import {joinedPathRows,PATH_BITS} from './archive-followup-art'
import {OLD_BUILDINGS,OLD_TERRAIN} from './old-village-art'
import {BG_ART} from './bg-materials-art'
import {newChild} from '../engine/child'
import {freshStats} from '../engine/stats'
import {NO_ROMANCE} from '../engine/romance'
import spouseRooms from '../content/spouse-rooms.json'
import {CONTENT} from '../content/catalog'
import {newGenState} from '../engine/gen'

const state=(x:number,y:number,extra:Partial<StoryLocationState>={}):StoryLocationState=>({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:100,minute:900},...extra})
const building={id:'b4',kind:'kidWork' as const,x:5,y:10,facing:'left' as const,state:'done' as const,orderedDay:1,paid:{coins:0,items:{}},refunded:false,owner:'me:1'}
it('selects each player child workplace from its own original job rather than always showing the cooking house',()=>{
 const child={...newChild(1,freshStats(),undefined),job:'herbalist' as const},sibling={...newChild(2,freshStats(),undefined),job:'shipwright' as const}
 for(const [owner,job] of [['me:1','herbalist'],['me:2','shipwright']] as const){
  const s=state(7,14,{map:'newland',child,siblings:[sibling],newland:{builds:[{...building,owner}],tiles:{},nextId:5,settledDay:99}}),before=JSON.stringify(s),c=storyLocationContext(s)
  expect(c.layout?.builds[0].job).toBe(job)
  expect(storyNewlandBuildings(c,320,108).find(o=>o.id==='b4')?.rows).toEqual(OLD_BUILDINGS[job].left.rows)
  expect(JSON.stringify(s)).toBe(before)
 }
})
it('uses the resident child actual fixed-parent job through the original ownerJob resolver',()=>{
 const gen=newGenState(CONTENT,7,100)
 gen.persons['g-0001']={id:'g-0001',origin:'born',born:1,stage:'adult',parents:['postman'],household:null,spouse:null}
 const c=storyLocationContext(state(7,14,{map:'newland',gen,newland:{builds:[{...building,owner:'g-0001'}],tiles:{},nextId:5,settledDay:99}}))
 expect(c.layout?.builds[0].job).toBe('scribe')
 expect(storyNewlandBuildings(c,320,108).find(o=>o.id==='b4')?.rows).toEqual(OLD_BUILDINGS.scribe.left.rows)
})
it('copies built and removed home walls without invoking global wall or map setters',()=>{
 const walls={built:['20,112','99,99'],removed:['21,110']},s=state(20,112,{homeWalls:walls,room:[]}),before=JSON.stringify(s),c=storyLocationContext(s)
 expect(c.layout?.homeWalls).toEqual(walls)
 expect(c.layout?.homeWalls?.built).not.toBe(walls.built)
 const objects=storyHomeWallObjects(c,320,108)
 expect(objects.map(o=>[o.key,o.removed])).toEqual([['21,110',true],['20,112',false]])
 expect(objects.every(o=>Number.isInteger(o.x)&&Number.isInteger(o.y))).toBe(true)
 expect(JSON.stringify(s)).toBe(before)
})
it('uses the actual spouse window but does not re-create moved or removed signature furniture',()=>{
 const c=storyLocationContext(state(21,107,{homeLevel:1,room:[],romance:{...NO_ROMANCE,partner:'wendell',stage:'married'}})),design=spouseRooms.find(d=>d.id==='wendell')!
 expect(c.layout?.fixed).toEqual([{x:18+design.window.x,y:104+design.window.y,ch:'N'}])
 expect(storyLayoutObjects(c,320,108).map(a=>a.id)).toEqual(['N'])
 expect(storyLocationContext(state(21,107,{homeLevel:1,room:[],romance:NO_ROMANCE})).layout?.fixed).toEqual([{x:23,y:104,ch:'N'}])
})
it('preserves native joined stone edges and exact user tile coordinates without modifying the saved ground',()=>{
 const tiles={'6,14':'stone' as const,'7,14':'stone' as const,'8,14':'stone' as const,'7,15':'path' as const,'6,15':'garden' as const},s=state(7,14,{map:'newland',newland:{builds:[],tiles,nextId:1,settledDay:99}}),before=JSON.stringify(s),c=storyLocationContext(s),out=storyNewlandTerrain(c,320,108)
 expect(c.layout?.tiles).toEqual(tiles);expect(c.layout?.tiles).not.toBe(tiles)
 expect(out.find(o=>o.key==='7,14')?.rows).toEqual(joinedPathRows('stone',PATH_BITS.east|PATH_BITS.west))
 expect(out.find(o=>o.key==='8,14')!.x-out.find(o=>o.key==='7,14')!.x).toBe(16)
 expect(out.find(o=>o.kind==='path')?.rows).toEqual(OLD_TERRAIN.path.rows)
 expect(out.find(o=>o.kind==='garden')?.rows).toEqual(OLD_TERRAIN.plantingBed.rows)
 expect(JSON.stringify(s)).toBe(before)
})
it.each(['soil','grassTuft','flower','rocks','bush','treeSmall','treeTall','treeBig'] as const)('reuses the original placed %s bitmap rather than substituting a generic prop',kind=>{
 const c=storyLocationContext(state(7,14,{map:'newland',newland:{builds:[],tiles:{'7,14':kind},nextId:1,settledDay:99}})),objects=storyNewlandTerrain(c,320,108)
 expect(objects).toHaveLength(1);expect(objects[0].rows).toBe(BG_ART[kind])
 expect(objects[0].y+objects[0].rows.length).toBe(108)
})
