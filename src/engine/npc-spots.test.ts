import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, settle, tick } from './game'
import { separateNpcGoals } from './npc-spots'
import { isWalkable, key, roomAt } from './world'
import { lodgingNpcSpot, LODGING_WORK_SPOTS } from './lodging'
import { apptSpots } from './plans'
import { SITES } from './village-sites'
import { HALL_SPOTS } from './places'

describe('주민이 멈추는 자리',()=>{
 it('같은 자리로 가는 주민은 나누되 약속 참가자와 다른 주민의 원래 자리는 남긴다',()=>{
  const goals={baker:{x:22,y:20},grandpa:{x:22,y:20},child:{x:22,y:21}}
  const next=separateNpcGoals(goals,new Set(),['grandpa'])
  expect(next.grandpa).toEqual(goals.grandpa)
  expect(next.child).toEqual(goals.child)
  expect(next.baker).not.toEqual(next.grandpa)
  expect(isWalkable(next.baker!)).toBe(true)
  expect(separateNpcGoals(goals,new Set(),['grandpa'])).toEqual(next)
 })
 it('가구를 피해서 서는 대체 자리는 같은 방 안이며 문을 밟지 않는다',()=>{
  const at=HALL_SPOTS[0]
  const next=separateNpcGoals({baker:at},new Set([key(at)]))
  expect(next.baker).not.toEqual(at)
  expect(isWalkable(next.baker!,new Set([key(at)]))).toBe(true)
  expect(roomAt(next.baker!)).toBe(roomAt(at))
 })
 it('공동주택이 된 옛 작업장 좌표도 지금 작업대 옆으로 보정한다',()=>{
  expect(lodgingNpcSpot('smith',{x:43,y:22})).toEqual(LODGING_WORK_SPOTS.smith)
  expect(lodgingNpcSpot('presser',{x:46,y:21})).toEqual(LODGING_WORK_SPOTS.presser)
 })
 it('새로 불러온 뒤와 실제 이동 중에도 주민의 목적지가 건물 안이나 같은 칸으로 겹치지 않는다',()=>{
  const b=newGame(CONTENT)
  const flags={...b.flags,villageLevel:99,...Object.fromEntries(CONTENT.neighbors.flatMap(n=>[[`movedIn:${n.id}`,1],...(n.family?[[`movedIn:${n.family}`,1]]:[])]))}
  for(const [day,minute] of [[2,630],[35,810],[35,990]]){
   const s=settle({...b,flags,clock:{day,minute},scenes:[]},CONTENT)
   for(const state of [s,tick(s,.1,()=>.5,CONTENT).state]){
    const goals=Object.values(state.npcs).flatMap(n=>n.goal?[n.goal]:[])
    expect(goals.every(t=>isWalkable(t))).toBe(true)
    expect(new Set(goals.map(key)).size).toBe(goals.length)
   }
  }
 })
 it('긴 벤치 모임은 집 뒤가 아닌 골목 앞의 세 자리에서 만난다',()=>{
  const seats=apptSpots('commonBench')
  expect(seats).toEqual(SITES.longBench.seats)
  expect(seats).toHaveLength(3)
  expect(seats.every(t=>isWalkable(t)&&t.y===SITES.longBench.tiles[0].y+1)).toBe(true)
  expect(seats.some(t=>key(t)===key(SITES.longBench.stand))).toBe(false)
 })
})
