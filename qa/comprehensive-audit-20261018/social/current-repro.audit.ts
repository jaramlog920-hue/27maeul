import { describe,it,expect } from 'vitest'
import { CONTENT, PEOPLE } from '../../../src/content/catalog'
import { establishedGame } from '../../../src/engine/growth-test-support'
import { newChild } from '../../../src/engine/child'
import { babyBlock, selectKid, askBaby } from '../../../src/engine/siblings'
import { createClub,dissolveClub,sanitizeClubs,type ClubInput } from '../../../src/engine/clubs'
import { serialize,deserialize } from '../../../src/engine/save'
import type { GameState } from '../../../src/engine/game'

const ready=():GameState=>{
 const s=establishedGame(CONTENT,200)
 return {...s, clock:{day:300,minute:480},scenes:[],homeLevel:2,romance:{partner:'cosmo',stage:'married',since:1,weddingDay:10,marriedDay:10},notebook:{...s.notebook,met:CONTENT.neighbors.map(n=>n.id)},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))}}
}
describe('social independent audit reproductions',()=>{
 it('SOC-01 fixed: youngest pregnancy guard survives selected child changes',()=>{
  const b=ready();const first=newChild(200,b.stats,undefined);const baby=newChild(299,b.stats,undefined)
  const s={...b,child:first,siblings:[baby]}
  expect(babyBlock(s)).toBe('youngest')
  const selected=selectKid(s,299)
  expect(selected.child!.born).toBe(299)
  expect(babyBlock(selected)).toBe('youngest')
  expect(askBaby(selected).flags.babyWish).toBeUndefined()
 })
 it('SOC-02 fixed: active club survives three historical dissolutions and save round trip',()=>{
  let s=ready()
  const input:ClubInput={name:'차 모임',place:'hallTable',members:['baker'],weekday:(s.clock.day+1)%7,slot:'morning',activity:'tea'}
  for(let i=0;i<4;i++) {
   const r=createClub(s,input,CONTENT)
   expect(r.error).toBeUndefined()
   s=r.state
   if(i<3) s=dissolveClub(s,s.clubs.at(-1)!.id)
  }
  expect(s.clubs.filter(c=>c.active).map(c=>c.id)).toEqual(['club:4'])
  expect(sanitizeClubs(s.clubs).filter(c=>c.active).map(c=>c.id)).toEqual(['club:4'])
  const loaded=deserialize(serialize(s),CONTENT)!
  expect(loaded.clubs.filter(c=>c.active).map(c=>c.id)).toEqual(['club:4'])
 })
})

