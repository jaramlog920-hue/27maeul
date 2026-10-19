import { CONTENT } from '../content/catalog'
import { newGame, placeFurniture, moveFurniture, rotateFurniture, removePiece, tapTile, syncHome, interactTile, pressTile, type GameState } from './game'
import { furnitureUseSpec, furnitureUseStands, stepFurnitureAutonomy } from './furniture-autonomy'
import { PERMANENT_GARDEN, LEGACY_GARDEN, outdoorGround } from './outdoor-layout'
import { outdoorFurniture } from './outdoor'
import { canPlant, harvest, water, GARDEN_TILES } from './garden'
import { deserialize, serialize } from './save'
import { canPlaceYard, moveYard, stowYard, yardSpot } from './yard'
import { MAX_STACK } from './items'
import { PLACES } from './world'

const yard=():GameState=>{
 const s=newGame(CONTENT)
 return {...s,scenes:[],player:{...s.player,x:10,y:8,path:[]},inv:{...s.inv,stool:3,table:1,vase:1,chair:1}}
}
const restored=(s:GameState)=>deserialize(serialize(s),CONTENT)!

it('밭은 네 칸이며 기존 열두 칸 작물은 저장 후에도 돌보고 수확할 수 있다',()=>{
 expect(GARDEN_TILES).toHaveLength(4)
 expect(PLACES.garden.tiles).toEqual(PERMANENT_GARDEN)
 const s=yard();s.garden=Object.fromEntries(LEGACY_GARDEN.map(t=>[`${t.x},${t.y}`,{crop:'herb',grown:3,wateredDay:null}]))
 const back=restored(restored(s))
 expect(back.garden).toEqual(s.garden)
 const old={x:14,y:6}
 expect(canPlant({...back,garden:{}},old,'herb')).toBe('taken')
 expect(tapTile(back,old).target).toMatchObject({kind:'place',id:'garden',tile:old})
 expect(tapTile({...back,player:{...back.player,...old,path:[]}},old).target).toMatchObject({kind:'place',id:'garden'})
 const beside={...back,player:{...back.player,x:14,y:7,facing:'up' as const,path:[]}}
 expect(interactTile(beside)).toEqual(old);expect(pressTile(beside)).toEqual(old)
 expect(water({...back,garden:{'14,6':{crop:'herb',grown:0,wateredDay:null}}},old)).not.toBeNull()
 const done=harvest(back,old)!
 expect(done.garden['14,6']).toBeUndefined()
 expect(Object.keys(done.garden)).toHaveLength(11)
 expect(placeFurniture({...done,player:{...done.player,x:10,y:8}},'stool',old)).not.toBeNull()
})

it.each([0,1,2,3] as const)('집 %i단계에서도 뒷마당 배치를 보존하고 미래 증축 영역은 비워 둔다',level=>{
 const s={...yard(),homeLevel:level}
 syncHome(s)
 expect(outdoorGround({x:4,y:3})).toBe(false)
 expect(outdoorGround({x:8,y:4})).toBe(false)
 expect(placeFurniture(s,'stool',{x:4,y:3})).toBeNull()
 expect(placeFurniture(s,'stool',{x:11,y:4})).toBeNull()
 const placed=placeFurniture(s,'stool',{x:12,y:2})!
 expect(placed).not.toBeNull()
 expect(restored(placed).outdoor).toEqual(placed.outdoor)
 expect(placed.inv.stool).toBe(s.inv.stool!-1)
 expect(placed.room).toEqual(s.room)
})

it('회전·이동·회수는 재고와 배치 ID를 보존한다',()=>{
 let s=placeFurniture(yard(),'table',{x:14,y:4},'down')!
 expect(s).not.toBeNull()
 const original=outdoorFurniture(s)[0],id=original.id
 s=rotateFurniture(s,original)!
 expect(outdoorFurniture(s)[0].facing).toBe('right')
 s=moveFurniture(s,outdoorFurniture(s)[0],{x:15,y:5})!
 expect(outdoorFurniture(s)[0]).toMatchObject({id,x:15,y:5})
 expect(s.inv.table??0).toBe(0)
 const full={...s,inv:{...s.inv,table:MAX_STACK}}
 expect(removePiece(full,outdoorFurniture(full)[0])).toBe(full)
 s=removePiece(s,outdoorFurniture(s)[0])
 expect(outdoorFurniture(s)).toHaveLength(0)
 expect(s.inv.table).toBe(1)
})

it('작물·도구·사람 위와 실내 고정 가구의 야외 설치를 막는다',()=>{
 let s=yard()
 s={...s,garden:{'14,6':{crop:'bean',grown:1,wateredDay:null}},flags:{...s.flags,'unlock:rainJar':1}}
 s=moveYard(s,'rainJar',{x:14,y:2})!
 expect(yardSpot(restored(s),'rainJar')).toEqual({x:14,y:2})
 expect(placeFurniture(s,'stool',{x:14,y:2})).toBeNull()
 expect(placeFurniture(s,'stool',{x:14,y:6})).toBeNull()
 expect(placeFurniture(s,'stool',{x:10,y:8})).toBeNull()
 expect(placeFurniture(s,'homeDesk',{x:12,y:2})).toBeNull()
 const p=placeFurniture(s,'stool',{x:12,y:2})!
 expect(canPlaceYard(p,'rainJar',{x:12,y:2})).toBe(false)
 expect(stowYard(p,'rainJar')!.inv.rainJar).toBe(1)
})

it('탁자와 위의 소품을 이동·회수해도 물건이 복제되거나 사라지지 않는다',()=>{
 let s=placeFurniture(yard(),'table',{x:14,y:4},'down')!
 s=placeFurniture(s,'vase',{x:14,y:4})!
 expect(outdoorFurniture(s)[1].on).toBe(true)
 s=moveFurniture(s,outdoorFurniture(s)[0],{x:15,y:6})!
 expect(outdoorFurniture(s).map(f=>[f.x,f.y])).toEqual([[15,6],[15,6]])
 s=removePiece(s,outdoorFurniture(s)[0])
 expect(outdoorFurniture(s)).toHaveLength(0)
 expect(s.inv.table).toBe(1);expect(s.inv.vase).toBe(1)
})

it('임시 밭 수확이 가방 부족으로 실패하면 작물과 잔디 전환을 모두 보류한다',()=>{
 const s={...yard(),inv:{herb:MAX_STACK},garden:{'14,6':{crop:'herb' as const,grown:3,wateredDay:null}}}
 expect(harvest(s,{x:14,y:6})).toBeNull()
 expect(restored(s).garden).toEqual(s.garden)
 expect(placeFurniture({...s,inv:{...s.inv,stool:1}},'stool',{x:14,y:6})).toBeNull()
})

it.each(['down','right','up','left'] as const)('유저가 %s 방향 의자에 직접 접근해 사용하며 이동 경로는 가구를 통과하지 않는다',facing=>{
 const s=placeFurniture(yard(),'chair',{x:13,y:2},facing)!
 const f=outdoorFurniture(s)[0],stand=furnitureUseStands(f,furnitureUseSpec('chair','adult')!)[0]
 const used=tapTile({...s,player:{...s.player,...stand,path:[]}},f)
 expect(used.act).toMatchObject({kind:'sit',use:'outdoor',facing,spot:{item:'chair',x:13,y:2}})
 const walk=tapTile(s,{x:13,y:1})
 expect(walk.player.path.some(t=>t.x===13&&t.y===2)).toBe(false)
})

it('마당의 주민도 같은 사용 모션을 쓰며 유저 자율행동 상태는 생성하지 않는다',()=>{
 let s=placeFurniture(yard(),'chair',{x:13,y:2},'down')!
 s={...s,clock:{day:12,minute:720},scenes:[],npcs:{baker:{id:'baker',visible:true,x:13,y:3,path:[],facing:'up',walkTime:0,goal:null}}}
 const context={room:outdoorFurniture(s),npcs:new Set(['baker']),child:null,inside:outdoorGround,clear:[]}
 for(let i=0;i<100&&!s.furnitureAuto?.['npc:baker'];i++)s=stepFurnitureAutonomy({...s,clock:{...s.clock,minute:s.clock.minute+.2}},.2,context)
 expect(s.furnitureAuto?.['npc:baker']).toBeDefined()
 expect(s.furnitureAuto?.player).toBeUndefined()
 const busy=outdoorFurniture(s)[0]
 expect(tapTile({...s,player:{...s.player,x:12,y:2,path:[]}},busy).act).toBeUndefined()
})
