import {describe,it,expect,vi} from 'vitest'
import * as movement from './movement'
import {route, stepNpc, npcTile, type Npc} from './neighbors'
import {CONTENT} from '../content/catalog'
describe('막힌 주민 목적지의 길찾기',()=>{
 it('사람이 목적지에 서 있으면 다른 집의 문까지 탐색하지 않는다',()=>{
  const spy=vi.spyOn(movement,'findPath')
  try {
   expect(route({x:24,y:26},{x:30,y:25},new Set(['30,25']))).toBeNull()
   expect(spy).not.toHaveBeenCalled()
  } finally {spy.mockRestore()}
 })
 it('이미 도착한 칸이 점유됐다고 자기 자리에서 다시 길을 찾지 않는다',()=>{
  expect(route({x:30,y:25},{x:30,y:25},new Set(['30,25']))).toEqual([])
 })
})


it('양우리 입구를 플레이어가 막아도 경로를 유지해 기다리고 비면 즉시 이어 걷는다',()=>{
 const search=vi.spyOn(movement,'findPath')
 const warped=vi.spyOn(movement,'findWarpRoute')
 const def=CONTENT.neighbors.find(n=>n.id==='shepherd')!
 const goal={x:5,y:29}, gate={x:5,y:27}
 let npc:Npc={id:def.id,x:10,y:30,path:[],facing:'left',walkTime:0,visible:true,goal:null}
 try {
  npc=stepNpc(npc,def,goal,.1,new Set(),gate)
  expect(npc.path).toContainEqual(gate)
  const planned=search.mock.calls.length
  for(let i=0;i<300;i++)npc=stepNpc(npc,def,goal,.1,new Set(),gate)
  expect(warped).not.toHaveBeenCalled()
  expect(search.mock.calls.length).toBe(planned)
  expect(npcTile(npc)).not.toEqual(gate)
  expect(npc.path[0]).toEqual(gate)
  const before={x:npc.x,y:npc.y}
  npc=stepNpc(npc,def,goal,.1,new Set(),{x:10,y:30})
  expect({x:npc.x,y:npc.y}).not.toEqual(before)
  for(let i=0;i<40;i++)npc=stepNpc(npc,def,goal,.1,new Set(),{x:10,y:30})
  expect(npcTile(npc)).toEqual(goal)
  expect(npc.path).toEqual([])
 }finally{search.mockRestore();warped.mockRestore()}
})
