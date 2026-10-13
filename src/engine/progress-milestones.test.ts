import {CONTENT} from '../content/catalog'
import {legacyGame} from './growth-test-support'
import {otMilestoneScenes,homeBookMilestone,successionMilestone} from './progress-milestones'
import {otRow} from './ot-books'
import {toggleHomeBook} from './finished-books'
import {deserialize,serialize} from './save'
import {newGenState} from './gen'
import {settleGen} from './gen-settle'
import {RETIRE_AFTER} from './gen-growth'
import {startCopy,writeVerse,goToSleep} from './game'
import {ensureOtBook} from '../content/ot-catalog'
import {copyVerses} from './copying'
import {freshStats} from './stats'
const fresh=()=>({...legacyGame(CONTENT),scenes:[]})
const done=(book:'rut'|'psa')=>({completed:Array.from({length:otRow(book).chapters},(_,i)=>i+1),arrangement:{}})

it('실제 첫 구약 책의 마지막 절에만 새 서고 장면이 열린다',async()=>{
  await ensureOtBook('rut')
  const s=fresh(),last=copyVerses('rut',4,CONTENT).at(-1)!
  const before=startCopy({...s,otProgress:{rut:{completed:[1,2,3],arrangement:{}}},copy:{...s.copy,at:{...s.copy.at,rut:{chapter:4,verse:last.verse}}}},'rut',CONTENT)
  const next=writeVerse(before,'rut',last.text,CONTENT).state
  expect(next.scenes).toContain('firstOtBook')
  expect(next.scenes).not.toContain('bookBound')
  expect(next.flags.firstOtBookScene).toBe(1)
  const loaded=deserialize(serialize(next),CONTENT)!
  expect(loaded.scenes).toContain('firstOtBook')
  expect(otMilestoneScenes(loaded,{...loaded,scenes:[]}).scenes).toEqual([])
})
it('시편은 150장 모두 완료해야 열리고 첫 구약 책과 함께 완필해도 각 장면은 한 번이다',()=>{
  const before=fresh()
  expect(otMilestoneScenes(before,{...before,otProgress:{psa:{completed:Array(150).fill(1),arrangement:{}}}})).not.toHaveProperty('flags.psalmRestScene')
  const next=otMilestoneScenes(before,{...before,otProgress:{psa:done('psa')}})
  expect(next.scenes).toEqual(['firstOtBook','psalmRest'])
  expect(otMilestoneScenes(next,{...next,scenes:[]}).scenes).toEqual([])
  expect(otMilestoneScenes({...before,otProgress:{rut:done('rut')}},{...before,otProgress:{rut:done('rut'),psa:done('psa')}}).scenes).toEqual(['psalmRest'])
})
it('이미 구약을 완필한 저장에는 새로운 완필 장면을 소급하지 않는다',()=>{
  const s={...fresh(),otProgress:{psa:done('psa')}}
  expect(otMilestoneScenes(s,s)).toBe(s)
})
it('집 책장의 실제 첫 배치만 기록하고 미완성·취소·재배치는 제외한다',()=>{
  const s=fresh(),ready={...s,shelved:{phm:0 as const}}
  expect(homeBookMilestone(s,toggleHomeBook(s,'phm'))).toBe(s)
  const placed=homeBookMilestone(ready,toggleHomeBook(ready,'phm'))
  expect(placed.scenes).toEqual(['firstHomeBook'])
  expect(placed.shelved).toEqual(ready.shelved)
  expect(placed.flags.firstHomeBookIndex).toBeGreaterThan(0)
  const removed=toggleHomeBook({...placed,scenes:[]},'phm')
  expect(homeBookMilestone(removed,toggleHomeBook(removed,'phm')).scenes).toEqual([])
  expect(homeBookMilestone({...ready,homeShelf:['phm']},{...ready,homeShelf:[]})).not.toHaveProperty('flags.firstHomeBookScene')
})
it('실제 세대 정산의 첫 인계가 부모 자리와 자녀 정보를 보존한다',()=>{
  const s=fresh(),g=newGenState(CONTENT,7,99)
  const heir={id:'g-0001',origin:'born' as const,born:1,stage:'adult' as const,look:'f' as const,name:'루시',parents:['rudy','poppy'],spouse:null,household:'h-1'}
  const before={...s,clock:{day:100,minute:420},gen:{...g,on:true,settledDay:99,persons:{...g.persons,[heir.id]:heir},heirs:{rudy:{heir:heir.id,since:100-RETIRE_AFTER}}}}
  const next=settleGen(before,CONTENT)
  expect(next.gen?.retired?.rudy.heir).toBe(heir.id)
  expect(next.scenes).toContain('workSuccession:rudy')
  expect(next.gen?.persons.rudy).toBeDefined()
  expect(next.gen?.persons[heir.id].name).toBe('루시')
  expect(settleGen({...next,scenes:[]},CONTENT).scenes).toEqual([])
  const loaded=deserialize(serialize(next),CONTENT)!
  expect(loaded.scenes).toContain('workSuccession:rudy')
  expect(successionMilestone({...next,scenes:[]},{...next,scenes:[]}).scenes).toEqual([])
})
it.each([true,false])('아이의 어른 전환은 기존 떠남=%s 결과만 한 번 예약한다',left=>{
  const s=fresh(),stats=freshStats()
  for(const value of Object.values(stats))value.born=left?70:0
  const before={...s,clock:{day:83,minute:1200},child:{name:'우리 아이',look:'girl' as const,born:0,stats,lean:null,left}}
  const next=goToSleep(before,CONTENT)
  expect(next.child?.left).toBe(left)
  expect(next.scenes).toContain(left?'childLeaves':'childStays')
  const again=goToSleep({...next,scenes:[]},CONTENT)
  expect(again.scenes).not.toContain('childLeaves')
  expect(again.scenes).not.toContain('childStays')
})
