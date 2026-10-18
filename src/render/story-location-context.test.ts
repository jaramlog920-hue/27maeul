import {storyLocationContext,type StoryLocationState} from './story-location-context'
import {ROOMS} from '../engine/world'
import {currentMapId,setActiveMap} from '../engine/maps'
import {ROOM_SLOTS,INTERIOR_ENTRY} from '../engine/newland-config'
import {weatherOf} from '../engine/calendar'

const state=(x:number,y:number,extra:Partial<StoryLocationState>={}):StoryLocationState=>({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:3,minute:1100},...extra})
it.each(ROOMS)('uses the actual $owner room geometry independently of the active global map',room=>{
 const old=currentMapId();setActiveMap('newland')
 try{expect(storyLocationContext(state(room.sit.x,room.sit.y))).toMatchObject({map:'village',indoors:true,room:{kind:'neighbor',owner:room.owner}});expect(currentMapId()).toBe('newland')}
 finally{setActiveMap(old)}
})
it('keeps a village coordinate outdoors on the other map rather than using the NPC workplace',()=>{
 expect(storyLocationContext(state(20,18))).toMatchObject({indoors:false,room:null,map:'village'})
 expect(storyLocationContext(state(20,18,{map:'newland'}))).toMatchObject({indoors:false,room:null,map:'newland'})
})
it.each([[0,20,112,true],[0,20,106,false],[1,20,106,true],[1,27,112,false],[2,27,112,true],[2,10,113,false],[3,10,113,true],[3,10,106,false]] as const)('resolves home stage %i at %i,%i without filling missing corners', (homeLevel,x,y,indoors)=>{
 expect(storyLocationContext(state(x,y,{homeLevel})).indoors).toBe(indoors)
})
it('uses the newland archive and only occupied completed house slots',()=>{
 expect(storyLocationContext(state(INTERIOR_ENTRY.x,INTERIOR_ENTRY.y,{map:'newland'})).room).toEqual({kind:'newland-archive',owner:'library'})
 const slot=ROOM_SLOTS[0],at=state(slot.entry.x,slot.entry.y,{map:'newland'})
 expect(storyLocationContext(at).indoors).toBe(false)
 const build={id:'b3',kind:'home' as const,x:5,y:10,facing:'down' as const,state:'done' as const,orderedDay:1,paid:{coins:0,items:{}},slot:0,refunded:false,owner:'g-0042'}
 expect(storyLocationContext({...at,newland:{builds:[build],tiles:{},nextId:4,settledDay:2}}).room).toEqual({kind:'newland-home',owner:'g-0042',buildingId:'b3',slot:0})
 expect(storyLocationContext({...at,newland:{builds:[{...build,state:'building'}],tiles:{},nextId:4,settledDay:2}}).indoors).toBe(false)
})
it('keeps explicit or queued date provenance and never guesses a night hill from a tea date',()=>{
 const s=state(20,18,{scenes:['date:tea:1','loverTrust:wendell']})
 expect(storyLocationContext(s)).toMatchObject({datePlace:'tea',dateSource:'queue',minute:1100})
 expect(storyLocationContext({...s,scenes:['loverTrust:wendell']})).toMatchObject({datePlace:null,dateSource:'unavailable'})
 expect(storyLocationContext(s,{datePlace:'walk'})).toMatchObject({datePlace:'walk',dateSource:'explicit'})
})
it('returns detached read-only inputs without touching global map or game state',()=>{
 const s=state(24,18),before=JSON.stringify(s),map=currentMapId(),ctx=storyLocationContext(s)
 ctx.at.x=99
 expect(JSON.stringify(s)).toBe(before);expect(currentMapId()).toBe(map)
 expect(ctx.weather).toBe(weatherOf(s.clock.day))
})
it('allows preview variants without reading the current game or changing it',()=>{
 expect(storyLocationContext(undefined,{preview:{map:'newland',at:INTERIOR_ENTRY,minute:1300,weather:'snow'}})).toMatchObject({mode:'preview',map:'newland',room:{kind:'newland-archive'},minute:1300,weather:'snow'})
})
