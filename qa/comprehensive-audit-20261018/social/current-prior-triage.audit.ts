import { describe,it,expect } from 'vitest'
import { CONTENT } from '../../../src/content/catalog'
import { establishedGame } from '../../../src/engine/growth-test-support'
import { breakUp,heartUp,giveBouquet,lookOf,dressUp } from '../../../src/engine/game'
import { withLookDefaults } from '../../../src/engine/avatar'
import { newGenState } from '../../../src/engine/gen'
import { peopleData } from '../../../src/engine/people'
import { giveFamilyHome,familyMoveMorning,familyHomes } from '../../../src/engine/gen-homes'
import { demolishBuild,type Build } from '../../../src/engine/newland-build'

describe('reverification of earlier social report candidates',()=>{
 it('SOC-05 fixed: 9 heart milestone does not repeat after breakup and redating',()=>{
  let s=establishedGame(CONTENT,200)
  const merchant=CONTENT.neighbors.find(n=>n.id==='merchant')!
  s={...s,clock:{day:300,minute:600},scenes:[],flags:{...s.flags,'movedIn:merchant':1},inv:{...s.inv,bouquet:3},hearts:{merchant:89},romance:{partner:'merchant',stage:'dating',since:280,weddingDay:null,marriedDay:null}}
  s={...s,life:{...s.life,seen:Object.values(peopleData().people).flatMap(p=>(p.events??[]).map(e=>e.id))}}
  const before=s.inv.rug??0
  s=heartUp(s,'merchant',1,Infinity,'story')
  expect(s.inv.rug).toBe(before+1)
  s=breakUp(s,'merchant')
  expect(s.hearts.merchant).toBe(49)
  s={...s,clock:{day:314,minute:600},heartDay:undefined}
  // Accumulating valid heart gains is possible after the 14-day cooling period.
  s=heartUp(s,'merchant',31,Infinity,'story')
  s=giveBouquet(s,merchant)
  expect(s.romance.stage).toBe('dating')
  s=heartUp(s,'merchant',10,Infinity,'story')
  expect(s.inv.rug).toBe(before+1)
 })
 it('SOC-06 remains: spouse wardrobe loads fixed retired parent appearance',()=>{
  let s=establishedGame(CONTENT,200)
  const g=newGenState(CONTENT,4,300)
  const heir={id:'g-0001',origin:'born' as const,born:100,stage:'adult' as const,look:'f' as const,name:'이어받은 딸',avatar:{skin:5,hairFront:9,top:7},parents:['cosmo'],spouse:null,household:null}
  s={...s,avatar:withLookDefaults({look:'m',name:'검사'}),gen:{...g,persons:{...g.persons,'g-0001':heir},retired:{cosmo:{heir:'g-0001',day:250}}},romance:{partner:'cosmo',stage:'married',since:270,weddingDay:null,marriedDay:280}}
  const loaded=lookOf(s,'spouse',CONTENT)!
  const original=CONTENT.neighbors.find(n=>n.id==='cosmo')!
  expect(loaded.look).toBe(original.look)
  expect(loaded.look).not.toBe(heir.look)
  expect(loaded.name).toBe(original.role)
  const dressed=dressUp(s,'spouse',withLookDefaults({...loaded,top:8}),CONTENT)
  expect(dressed.looks?.cosmo?.top).toBe(8)
  expect(dressed.gen!.persons['g-0001'].avatar?.top).toBe(7)
 })
 it('SOC-07 fixed: demolition and rehoming clear stale move request',()=>{
  let s=establishedGame(CONTENT,200)
  let g=newGenState(CONTENT,7,40)
  const person=(id:string)=>({id,origin:'born' as const,born:1,stage:'adult' as const,look:'f' as const,name:id,parents:[],spouse:null,household:'h-0001'})
  const h={id:'h-0001',home:'g-0001',members:['g-0001','g-0002'],children:[],lastBirth:null,since:9}
  g={...g,persons:{...g.persons,'g-0001':person('g-0001'),'g-0002':person('g-0002')},households:{'h-0001':h}}
  const b:Build={id:'b1',kind:'home',x:16,y:12,facing:'down',state:'done',orderedDay:1,paid:{coins:100,items:{}},refunded:false,slot:0}
  s={...s,gen:g,clock:{day:40,minute:600},flags:{...s.flags,'familyHome:1':1,'familyHomeDay:1':10,'moveWish:1':40},newland:{builds:[b],tiles:{},nextId:2,settledDay:40}}
  s=demolishBuild(s,'b1')!
  const replacement={...b,id:'b2'}
  s={...s,clock:{day:41,minute:600},newland:{...s.newland!,builds:[replacement],nextId:3}}
  s=giveFamilyHome(s,'h-0001',replacement,()=>false)
  expect(s.flags['familyHomeDay:1']).toBe(41)
  expect(s.flags['moveWish:1']).toBeUndefined()
  expect(familyHomes(s)).toHaveLength(1)
  const gone=familyMoveMorning({...s,clock:{day:43,minute:360}})
  expect(familyHomes(gone)).toHaveLength(1)
  expect(gone.flags['movedAway:1']).toBeUndefined()
 })
})



