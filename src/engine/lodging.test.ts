import {expect,it} from 'vitest'
import {CONTENT} from '../content/catalog'
import {HOUSES,ROOMS,WARPS,key,PLACES,isWalkable,tileAt} from './world'
import {route,goalFor} from './neighbors'
import {LODGING_DOOR,LODGING_SEATS,LODGING_CHILD_SEATS,LODGING_STAIRS,LODGING_PRESS,LODGING_WORK_SPOTS,lodgingNpcSpot} from './lodging'
import {HOME_FRONT} from './world'

it('the compact two-story house has one exterior door and connected floors, suites, spare rooms and workshops',()=>{
 const house=HOUSES.find(h=>h.id==='lodging')!
 expect(house.x1-house.x0+1).toBe(6)
 expect(house.y1-house.y0+1).toBe(8)
 const ground=ROOMS.find(r=>r.owner==='lodging')!,upper=ROOMS.find(r=>r.owner==='lodgingUpper')!
 expect(ground.w*ground.h).toBeLessThanOrEqual(38*16*0.55)
 expect(upper.w*upper.h).toBeLessThanOrEqual(38*18*0.55)
 expect(WARPS.get(key(LODGING_DOOR))).toEqual(ground.entry)
 expect(isWalkable({x:LODGING_DOOR.x+1,y:LODGING_DOOR.y})).toBe(true)
 expect(WARPS.get(key({x:LODGING_DOOR.x+1,y:LODGING_DOOR.y}))).toEqual(ground.entry)
 expect(WARPS.get(key(LODGING_STAIRS))).toEqual(upper.entry)
 for(const seat of [...Object.values(LODGING_SEATS),...LODGING_CHILD_SEATS]){
  expect(isWalkable(seat),key(seat)).toBe(true)
  expect(route(HOME_FRONT,seat),key(seat)).not.toBeNull()
 }
 for(const tool of [PLACES.anvil.stand!,PLACES.press.stand!])expect(route(upper.entry,tool)).not.toBeNull()
})
it('the five residents go upstairs in rain and at night',()=>{
 for(const[id,seat]of Object.entries(LODGING_SEATS)){
  const def=CONTENT.neighbors.find(n=>n.id===id)!
  expect(goalFor(def,{minute:720,wet:true,market:false,festival:false})).toEqual(seat)
  expect(goalFor(def,{minute:1320,wet:false,market:false,festival:false})).toEqual(seat)
 }
})
import {newGame,settle,walkDirection,tick} from './game'
import {peopleData} from './people'
import {lodgingChildren} from './lodging'
import {newChild} from './child'
import {freshStats} from './stats'
import {useGame} from '../store/game-store'
import {serialize,deserialize} from './save'
import {newGenState,type GenPerson} from './gen'

it('기름틀 위의 가짜 문만 없애고 틀·사용 자리·방문객은 서로 다른 안전한 칸으로 둔다',()=>{
 newGame(CONTENT)
 const room=ROOMS.find(r=>r.owner==='lodging')!
 expect(tileAt(24,124)).toBe('f')
 expect(WARPS.has('24,124')).toBe(false)
 expect(room.things.filter(([, , ch])=>ch==='E')).toEqual([])
 expect(tileAt(23,125)).toBe('f')
 expect(tileAt(LODGING_PRESS.x,LODGING_PRESS.y)).toBe('P')
 expect(PLACES.press.tiles).toEqual([LODGING_PRESS])
 expect(isWalkable(PLACES.press.stand!)).toBe(true)
 expect(Object.values(LODGING_WORK_SPOTS).some(t=>key(t)===key(PLACES.press.stand!))).toBe(false)
 expect(route(LODGING_STAIRS,PLACES.press.stand!)).not.toBeNull()
})
it('공동주택 탁자 양옆의 의자는 빈 칸 없이 붙고 서로 마주한다',()=>{
 const room=ROOMS.find(r=>r.owner==='lodging')!
 const chairs=room.decor.filter(([, ,item])=>item==='chair')
 expect(chairs).toEqual([[10,3,'chair'],[13,3,'chair','flip']])
 const table=room.things.filter(([, ,ch])=>ch==='n')
 expect(table).toEqual([[11,3,'n'],[12,3,'n']])
 expect(chairs[0][0]+1).toBe(table[0][0])
 expect(table[1][0]+1).toBe(chairs[1][0])
})

it('사진의 공동주택 북쪽 잔디 두 줄은 아래로 걸을 수 있고 실제 지붕부터 막힌다',()=>{
 const base=newGame(CONTENT)
 for(let x=41;x<=46;x++){
  for(const y of [17,18]){expect(tileAt(x,y)).toBe('.');expect(isWalkable({x,y})).toBe(true)}
  expect(isWalkable({x,y:19})).toBe(false)
 }
 const s={...base,scenes:[],npcs:{},player:{...base.player,x:42,y:16,path:[]}}
 const down=walkDirection(s,0,1)
 expect(down.player.path).toEqual([{x:42,y:17}])
 const after=tick(down,1,()=>.5,CONTENT).state
 expect(Math.round(after.player.y)).toBe(17)
})

it('grown children without homes occupy four rooms, keep rooms after loading, and cannot overfill them',()=>{
 const s={...newGame(CONTENT),gen:newGenState(CONTENT,7,1)}
 const people=Object.fromEntries(Array.from({length:6},(_,i)=>{const id=`g-${i}`;return[id,{id,origin:'born',born:i,stage:i===0?'child':'adult',name:`아이${i}`,parents:[],spouse:null,household:null} satisfies GenPerson]}))
 const g={...s,gen:{...s.gen!,persons:{...s.gen!.persons,...people}}}
 expect(lodgingChildren(g).map(p=>p.id)).toEqual(['g-1','g-2','g-3','g-4'])
 const loaded=deserialize(serialize(g),CONTENT)!
 expect(lodgingChildren(loaded).map(p=>p.seat)).toEqual(lodgingChildren(g).map(p=>p.seat))
 const child={...newChild(1,freshStats(),undefined),job:'cook' as const,jobConfirmed:true,left:false}
 useGame.setState({game:{...g,clock:{...g.clock,day:85},child}})
 useGame.getState().setChildResidence('lodging')
 expect(useGame.getState().game.child?.left).toBe(false)
})

it('틸리의 모루 옆 작업 자리는 대장장이와 마주볼 수 있는 거리이며 플레이어 칸을 비운다',()=>{
 const at=lodgingNpcSpot('tilly',{x:8,y:126})
 const smith=LODGING_WORK_SPOTS.smith
 expect(Math.abs(at.x-smith.x)+Math.abs(at.y-smith.y)).toBeLessThanOrEqual(2)
 expect(key(at)).not.toBe(key(PLACES.anvil.stand!))
 expect(isWalkable(at)).toBe(true)
})

it('틸리의 고리 작업·사건과 페넬로피의 실 방문은 같은 모루 곁에 모이고 다른 방문은 유지한다',()=>{
 const tilly=lodgingNpcSpot('tilly',{x:12,y:127})
 const penelope=lodgingNpcSpot('penelope',{x:40,y:22})
 const smith=LODGING_WORK_SPOTS.smith
 expect(Math.abs(tilly.x-smith.x)+Math.abs(tilly.y-smith.y)).toBeLessThanOrEqual(2)
 expect(Math.abs(tilly.x-penelope.x)+Math.abs(tilly.y-penelope.y)).toBeLessThanOrEqual(2)
 expect(key(tilly)).not.toBe(key(penelope))
 for(const at of [tilly,penelope]){
  expect(isWalkable(at)).toBe(true)
  expect(route(LODGING_STAIRS,at)).not.toBeNull()
  expect([PLACES.anvil.stand!,PLACES.press.stand!].some(t=>key(t)===key(at))).toBe(false)
 }
 expect(lodgingNpcSpot('tilly',{x:2,y:17})).toEqual({x:2,y:17})
 expect(lodgingNpcSpot('penelope',{x:6,y:52})).toEqual({x:6,y:52})
})

it('공동주택 작업장 주민·방문객 자리와 플레이어 작업 칸이 겹치지 않고 모두 계단에서 닿는다',()=>{
 const spots=Object.values(LODGING_WORK_SPOTS)
 expect(new Set(spots.map(key)).size).toBe(spots.length)
 const playerSeats=[PLACES.anvil.stand!,PLACES.press.stand!]
 const ground=ROOMS.find(r=>r.owner==='lodging')!,upper=ROOMS.find(r=>r.owner==='lodgingUpper')!
 for(const at of spots){
  expect(isWalkable(at),key(at)).toBe(true)
  expect(playerSeats.some(t=>key(t)===key(at))).toBe(false)
  expect(WARPS.has(key(at))).toBe(false)
  expect(route(upper.entry,at),key(at)).not.toBeNull()
 }
 const data=peopleData()
 for(const[id,at]of Object.entries(LODGING_WORK_SPOTS)){
  const person=data.people[id]
  expect(lodgingNpcSpot(id,id==='smith'?{x:7,y:126}:{x:22,y:125})).toEqual(at)
  const all=[...person.routines,...(person.offDays?.routines??[]),...(person.events??[]),...(person.sightings??[])]
  for(const value of all.filter(v=>v.at.y>=ground.y0&&v.at.y<ground.y0+ground.h))expect(playerSeats.some(t=>key(t)===key(value.at)),`${id} ${key(value.at)}`).toBe(false)
 }
})

it.each([1,4,7,42,81])('%i일의 공동주택 일과를 배치할 때 주민들이 같은 칸을 차지하지 않는다',day=>{
 const s=newGame(CONTENT)
 const flags={...s.flags,villageLevel:3,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))}
 for(const minute of [420,600,840,960,1000,1120,1210,1320]){
  const at=settle({...s,scenes:[],flags,clock:{day,minute}},CONTENT)
  const residents=Object.values(at.npcs).filter(n=>n.visible&&n.y>=122&&n.y<154)
  const keys=residents.map(n=>`${Math.round(n.x)},${Math.round(n.y)}`)
  expect(new Set(keys).size,`${day}/${minute}: ${residents.map(n=>`${n.id}=${Math.round(n.x)},${Math.round(n.y)}`).join(' ')}`).toBe(keys.length)
  for(const n of residents)expect(isWalkable({x:Math.round(n.x),y:Math.round(n.y)}),n.id).toBe(true)
 }
})
