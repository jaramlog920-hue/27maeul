import {CONTENT} from '../content/catalog'
import {newGenState} from '../engine/gen'
import {withLookDefaults} from '../engine/avatar'
import {sharedBackgroundSceneSnapshot,drawSharedBackgroundScene} from './shared-background-scene'
import {drawSharedBackgroundDraft,SHARED_BACKGROUND_DRAFT_IDS} from './shared-background-draft-art'
import type {DateArtOrigin} from './story-location-context'
import {sharedBackgroundKey} from './shared-story-background'
import {ROOMS} from '../engine/world'
import {INTERIOR_ENTRY,ROOM_SLOTS} from '../engine/newland-config'

const state=()=>({avatar:withLookDefaults({name:'기록자',look:'f',hairColor:[30,40,25]}),looks:{},gen:newGenState(CONTENT,7,121),player:{x:20,y:112,facing:'down' as const,path:[],walkTime:0},clock:{day:121,minute:900},room:[]})
const origin:DateArtOrigin={place:'tea',day:121,partner:'wendell',map:'village',at:{x:32,y:18},minute:1080}

it.each(SHARED_BACKGROUND_DRAFT_IDS)('%s retains every actual room owner and newland building state independently of its speaker',id=>{
 for(const room of ROOMS){
  const s={...state(),player:{...state().player,...room.sit},clock:{day:121,minute:1300}},before=JSON.stringify(s)
  const scene=sharedBackgroundSceneSnapshot(s,id)!
  expect(scene.location).toMatchObject({map:'village',at:{x:room.sit.x,y:room.sit.y},day:121,minute:1300,indoors:true,room:{kind:'neighbor',owner:room.owner}})
  expect(JSON.stringify(s)).toBe(before)
 }
 const s={...state(),map:'newland' as const,player:{...state().player,...INTERIOR_ENTRY},rooms:{'newland:archive':[{item:'jar' as const,x:18,y:33}]}},before=JSON.stringify(s)
 const archive=sharedBackgroundSceneSnapshot(s,id)!
 expect(archive.location).toMatchObject({map:'newland',at:INTERIOR_ENTRY,indoors:true,room:{kind:'newland-archive',owner:'library'}})
 expect(archive.location.layout!.furniture).toEqual(s.rooms['newland:archive'])
 expect(archive.location.layout!.furniture[0]).not.toBe(s.rooms['newland:archive'][0])
 const slot=ROOM_SLOTS[0],build={id:'b3',kind:'home' as const,x:5,y:10,facing:'left' as const,state:'done' as const,orderedDay:1,paid:{coins:0,items:{}},slot:0,refunded:false,owner:'g-0042'}
 for(const phase of ['ordered','building','done'] as const){
  const at={...s,player:{...s.player,...slot.entry},newland:{builds:[{...build,state:phase}],tiles:{},nextId:4,settledDay:2}},saved=JSON.stringify(at)
  const scene=sharedBackgroundSceneSnapshot(at,id)!
  expect(scene.location.at).toEqual(slot.entry)
  expect(scene.location.indoors).toBe(phase==='done')
  if(phase==='done')expect(scene.location.room).toEqual({kind:'newland-home',owner:'g-0042',buildingId:'b3',slot:0})
  else expect(scene.location.room).toBeNull()
  expect(JSON.stringify(at)).toBe(saved)
 }
 expect(JSON.stringify(s)).toBe(before)
})

it.each(SHARED_BACKGROUND_DRAFT_IDS.filter(id=>id.startsWith('loverTrust:')))('%s preserves all three explicit outing destinations only for this partner and day',id=>{
 const partner=id.slice('loverTrust:'.length)
 for(const place of ['tea','walk','sunset'] as const){
  const s={...state(),scenes:['dateTea','dateSunset','dateWalk',id]},before=JSON.stringify(s)
  const dateOrigin={...origin,partner,place}
  const scene=sharedBackgroundSceneSnapshot(s,id,{dateOrigin})!
  expect(scene.location).toMatchObject({at:origin.at,minute:1080,datePlace:place,dateSource:'explicit'})
  expect(sharedBackgroundKey(scene.location,true)).toBe(place==='tea'?'tea-front':place==='sunset'?'sunset':'pasture')
  for(const invalid of [null,{...dateOrigin,day:120},{...dateOrigin,partner:'unrelated'}]){
   const fallback=sharedBackgroundSceneSnapshot(s,id,{dateOrigin:invalid})!
   expect(fallback.location).toMatchObject({at:{x:20,y:112},minute:900,room:{kind:'home'},datePlace:null,dateSource:'unavailable'})
  }
  expect(JSON.stringify(s)).toBe(before)
 }
})
function canvas(){
 const rects:unknown[][]=[]
 const g={fillStyle:'',fillRect(this:{fillStyle:string},...args:number[]){rects.push([this.fillStyle,...args])}} as CanvasRenderingContext2D
 return {g,rects}
}
it('uses outing provenance only for the matching same-day returning partner',()=>{
 const s=state(),before=JSON.stringify(s)
 const match=sharedBackgroundSceneSnapshot(s,'loverTrust:wendell',{dateOrigin:origin})!
 expect(match.location).toMatchObject({at:origin.at,minute:1080,datePlace:'tea',dateSource:'explicit'})
 for(const [id,dateOrigin] of [['loverTrust:rudy',origin],['loverTrust:wendell',{...origin,day:120}],['blanket',origin]] as const){
  const snapshot=sharedBackgroundSceneSnapshot(s,id,{dateOrigin})!
  expect(snapshot.location.at).toEqual({x:20,y:112})
  expect(snapshot.location.minute).toBe(900)
  expect(snapshot.location.datePlace).toBeNull()
 }
 expect(JSON.stringify(s)).toBe(before)
})
it('detaches location, layout and avatar colors for review without changing saved state',()=>{
 const s=state(),before=JSON.stringify(s),scene=sharedBackgroundSceneSnapshot(s,'firstChapter')!
 scene.avatar!.hairColor![0]=180;scene.location.at.x=0
 expect(JSON.stringify(s)).toBe(before)
 const preview=sharedBackgroundSceneSnapshot(s,'firstChapter',{preview:true})!
 expect(preview.avatar).toBeNull();expect(preview.location.mode).toBe('preview')
 expect(sharedBackgroundSceneSnapshot({...s,avatar:null},'firstChapter')?.avatar).toBeNull()
 expect(sharedBackgroundSceneSnapshot(s,'unknown')).toBeNull()
})
it.each(['dateTea','dateSunset','dateWalk','date:tea:2'])('does not infer a return destination from restored %s queue history',queued=>{
 const s={...state(),scenes:[queued,'loverTrust:wendell']},before=JSON.stringify(s)
 for(const dateOrigin of [null,{...origin,day:120},{...origin,partner:'rudy'}]){
  const scene=sharedBackgroundSceneSnapshot(s,'loverTrust:wendell',{dateOrigin})!
  expect(scene.location).toMatchObject({at:{x:20,y:112},minute:900,datePlace:null,dateSource:'unavailable',room:{kind:'home'}})
  expect(sharedBackgroundKey(scene.location,true)).toBe('home')
 }
 const valid=sharedBackgroundSceneSnapshot(s,'loverTrust:wendell',{dateOrigin:origin})!
 expect(sharedBackgroundKey(valid.location,true)).toBe('tea-front')
 expect(JSON.stringify(s)).toBe(before)
})
it.each(SHARED_BACKGROUND_DRAFT_IDS)('%s keeps identical drawing commands through the combined snapshot at every viewport size',id=>{
 const s=state(),before=JSON.stringify(s)
 for(const preview of [false,true]){
  const scene=sharedBackgroundSceneSnapshot(s,id,{preview})!,actor=scene.people[0]??{avatar:null,who:'writer' as const},snapshotBefore=JSON.stringify(scene)
  for(const h of [180,693,120]){
   const actual=canvas(),expected=canvas()
   drawSharedBackgroundScene(actual.g,scene,320,h,.6,1)
   drawSharedBackgroundDraft(expected.g,id,320,h,.6,scene.avatar,actor,1,scene.location,scene.baby)
   expect(actual.rects).toEqual(expected.rects)
  }
  expect(JSON.stringify(scene)).toBe(snapshotBefore)
 }
 expect(JSON.stringify(s)).toBe(before)
})
