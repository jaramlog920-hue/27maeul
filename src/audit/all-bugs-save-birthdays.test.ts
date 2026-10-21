import { CONTENT } from '../content/catalog'
import { newChild } from '../engine/child'
import { familyMorning, prepareFamilyBirthday } from '../engine/family-days'
import { legacyGame } from '../engine/growth-test-support'
import { sceneSeen } from '../engine/game'
import { addGift } from '../engine/items'
import { deserialize, serialize } from '../engine/save'

it('normalizes corrupt inventory before any arithmetic and keeps legitimate gift overflow',()=>{
  const base=legacyGame(CONTENT), raw=JSON.parse(serialize(base))
  raw.inv={bread:'2',fig:-1,honey:.5,barley:3,reed:500,water:1.9,soot:null}
  const loaded=deserialize(JSON.stringify(raw),CONTENT)!
  expect(loaded.inv).toEqual({barley:3,reed:500,water:1})
  expect(addGift(loaded.inv,{bread:1}).bread).toBe(1)
  expect(deserialize(serialize(loaded),CONTENT)!.inv).toEqual(loaded.inv)
})

it('preserves more than fifty legitimate item kinds and stacks above ninety-nine',()=>{
  const base=legacyGame(CONTENT)
  const inventory=Object.fromEntries(Array.from({length:60},(_,i)=>[`testItem${i}`,120+i]))
  const saved=deserialize(serialize({...base,inv:inventory}),CONTENT)!
  expect(saved.inv).toEqual(inventory)
})

it('queues every sibling birthday, preserves targets across save and does not repeat a completed child',()=>{
  const base=legacyGame(CONTENT)
  const first={...newChild(1,base.stats,undefined),name:'첫째',left:false}
  const second={...newChild(161,base.stats,undefined),name:'둘째',left:false}
  const active={...newChild(70,base.stats,undefined),name:'선택아이',left:false}
  let state=familyMorning({...base,clock:{day:321,minute:360},scenes:[],child:active,siblings:[first,second]})
  expect(state.child.name).toBe('선택아이')
  expect(state.scenes).toContain('fam:bdayChild')
  state=prepareFamilyBirthday(deserialize(serialize(state),CONTENT)!,'fam:bdayChild') as typeof state
  expect(state.child.name).toBe('첫째')
  state=sceneSeen(state,'fam:bdayChild',[]) as typeof state
  expect(state.scenes).toContain('fam:bdayChild')
  state=prepareFamilyBirthday(state,'fam:bdayChild') as typeof state
  expect(state.child.name).toBe('둘째')
  state=sceneSeen(state,'fam:bdayChild',[]) as typeof state
  expect(state.scenes).not.toContain('fam:bdayChild')
  expect(familyMorning(state).scenes).not.toContain('fam:bdayChild')
  expect(state.flags['familyBirthdayDone:1']).toBe(321)
  expect(state.flags['familyBirthdayDone:161']).toBe(321)
})
