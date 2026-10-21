import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../content/catalog'
import {T} from '../content/text'
import {gameAtChapters} from '../engine/growth-test-support'
import {goToSleep,finishLibrary,rankMorning,otTicketDue,type GameState} from '../engine/game'
import {newGenState,type GenState} from '../engine/gen'
import {generationOf} from '../engine/gen-birth'
import {newChild} from '../engine/child'
import {selectKid} from '../engine/siblings'
import {guestHouseMorning,kidVisiting,siblingVisiting,talkKidVisit} from '../engine/newland-life'
import {familyMoveMorning,askToStay,wantsToMove} from '../engine/gen-homes'
import {emptyNewland,type Build} from '../engine/newland-build'
import {deserialize,serialize} from '../engine/save'
import {useGame} from '../store/game-store'
import {GenBabyName} from '../features/talk/GenBabyName'
import {FacilityView} from '../features/newland/FacilityView'
import {Family} from '../features/family/Family'
import {BOOKS} from '../engine/types'
import {OT_BOOK_TABLE} from '../engine/ot-books'
import {bibleEndingEvents,completeBibleFinale} from '../engine/library-finale'

afterEach(()=>{cleanup();vi.useRealTimers()})
const base=():GameState=>({...gameAtChapters(CONTENT,260),clock:{day:319,minute:1320},scenes:[]})
function couples():GenState{
 const g=newGenState(CONTENT,7,319)
 for(let i=1;i<=4;i++)g.persons[`g-000${i}`]={id:`g-000${i}`,origin:'born',born:150,stage:'adult',name:`부모${i}`,look:i%2?'m':'f',parents:[['rudy','wendell','cosmo','basil'][i-1]],spouse:`g-000${i%2?i+1:i-1}`,household:i<=2?'h-1':'h-2'}
 for(let i=1;i<=2;i++)g.households[`h-${i}`]={id:`h-${i}`,home:i===1?'rudy':'cosmo',members:[`g-000${i*2-1}`,`g-000${i*2}`],children:[],since:270,lastBirth:null,cribAsk:{day:292,given:true},birthDue:320}
 g.nextPerson=5
 return g
}
const build=(id:string,kind:Build['kind'],slot?:number):Build=>({id,kind,x:id==='b1'?5:15,y:12,facing:'down',state:'done',orderedDay:280,paid:{coins:100,items:{}},refunded:false,...(slot===undefined?{}:{slot})})

// 2026-10-21 다른 창 검사의 재현(REPRO)을 고친 뒤의 동작으로 바꿨다 (LATE-002·003·004 고침)
it('LATE-002 고침: 손주 둘이 같은 아침 태어나면 첫째 이름을 정한 뒤 둘째 차례가 온다',()=>{
 const before={...base(),gen:couples()}
 const morning=goToSleep(before,CONTENT)
 const babies=Object.values(morning.gen!.persons).filter(p=>!before.gen.persons[p.id]&&generationOf(morning.gen!,p.id)===3)
 expect(babies.map(p=>p.id)).toEqual(['g-0005','g-0006'])
 expect(morning.flags.grandNaming).toBe(5)
 useGame.setState({game:morning,modal:{kind:'genName',id:'g-0005'}})
 render(<GenBabyName id="g-0005"/> )
 fireEvent.click(screen.getByRole('button',{name:'지어진 이름 그대로'}))
 const done=useGame.getState().game
 expect(done.flags.grandNaming).toBe(6)
 expect(deserialize(serialize(done),CONTENT)!.flags.grandNaming).toBe(6)
 expect(Object.keys(done.flags).some(k=>k.startsWith('grandNext:'))).toBe(false)
})

it('control: one birth retains its naming invitation across save and consumes it only on confirmation',()=>{
 const gen=couples();gen.households['h-2']={...gen.households['h-2'],birthDue:350}
 const morning=goToSleep({...base(),gen},CONTENT)
 expect(morning.flags.grandNaming).toBe(5)
 expect(deserialize(serialize(morning),CONTENT)!.flags.grandNaming).toBe(5)
})

it('LATE-003 고침: 두 가족이 같은 아침 이사를 바라면 알림에 둘 다 남는다',()=>{
 const g=couples()
 const initial: GameState={...base(),gen:g,newland:{...emptyNewland(),builds:[build('b1','home',0),build('b2','home',1)],nextId:3},flags:{...base().flags,newlandGift:1,'familyHome:1':1,'familyHome:2':2,'familyHomeDay:1':280,'familyHomeDay:2':280}}
 const match=Array.from({length:300},(_,i)=>320+i).map(day=>familyMoveMorning({...initial,clock:{day,minute:360}})).find(s=>s.flags['moveWish:1']&&s.flags['moveWish:2'])!
 expect(match).toBeDefined()
 expect(match.flags.familyWishNew).toBe(1)
 expect(match.flags['familyWishNew:2']).toBe(1)
 expect(deserialize(serialize(match),CONTENT)!.flags['familyWishNew:2']).toBe(1)
 const warned=askToStay(match,g.households['h-2'])
 expect(wantsToMove(warned,g.households['h-1'])).toBe(true)
 expect(wantsToMove(warned,g.households['h-2'])).toBe(false)
 const later=familyMoveMorning({...warned,clock:{day:match.clock.day+3,minute:360}})
 expect(later.flags['familyHome:1']).toBeUndefined()
 expect(later.flags['familyHome:2']).toBe(2)
})

it('LATE-004 고침: 다니러 온 아이가 묵는 동안에는 다른 아이로 바뀌지 않아 손님집 이야기가 이어진다',()=>{
 const s=base()
 const visitor={...newChild(100,s.stats,undefined),name:'방문아이',job:'traveler' as const,jobConfirmed:true,left:true}
 const other={...newChild(146,s.stats,undefined),name:'집아이',job:'cook' as const,jobConfirmed:true,left:false}
 const visiting=guestHouseMorning({...s,child:visitor,siblings:[other],newland:{...emptyNewland(),builds:[build('b1','guest')],nextId:2},flags:{...s.flags,newlandGift:1}})
 expect(kidVisiting(visiting)).toBe(true)
 expect(talkKidVisit(visiting)).not.toBeNull()
 useGame.setState({game:visiting,modal:null})
 const family=render(<Family/> )
 fireEvent.click(screen.getByRole('button',{name:/집아이/}))
 family.unmount()
 const switched=useGame.getState().game
 // 묵는 동안은 바꾸지 않는다 (까닭 한 줄만) — 방문 아이가 그대로 함께하는 아이
 expect(switched.child!.born).toBe(100)
 expect(kidVisiting(switched)).toBe(true)
 expect(talkKidVisit(switched)).not.toBeNull()
 render(<FacilityView id="guest"/> )
 expect(screen.queryByText(T.newlandLife.guestNone)).toBeNull()
 const loaded=deserialize(serialize(switched),CONTENT)!
 expect(kidVisiting(loaded)).toBe(true)
 void siblingVisiting; void selectKid
})

it('control: complete-library grant and same-rank-day rewards are idempotent, archive stops at four rooms',()=>{
 const full={...base(),shelved:Object.fromEntries(BOOKS.map(b=>[b,0])) as GameState['shelved']}
 const given=finishLibrary(full)
 expect(given.flags.otExpand).toBe(1)
 expect(finishLibrary(given).flags.otExpand).toBe(1)
 const day421={...given,clock:{day:421,minute:360}}
 const ranked=rankMorning(day421,CONTENT)
 expect(rankMorning(ranked,CONTENT)).toBe(ranked)
 const allOt=Object.fromEntries(OT_BOOK_TABLE.map(b=>[b.id,{completed:Array.from({length:b.chapters},(_,i)=>i+1),arrangement:{}}]))
 expect(otTicketDue({...given,flags:{...given.flags,otExpand:4},otProgress:allOt})).toBe(false)
})

it('control: final Bible letter and next-evening ending are queued once and retained in save',()=>{
 const before={...base(),shelved:Object.fromEntries(BOOKS.map(b=>[b,0])) as GameState['shelved'],otProgress:Object.fromEntries(OT_BOOK_TABLE.map(b=>[b.id,{completed:Array.from({length:b.chapters},(_,i)=>i+1),arrangement:{}}]))}
 const incomplete={...before,otProgress:{...before.otProgress,mal:{completed:[1,2,3],arrangement:{}}}}
 const done=completeBibleFinale(incomplete,before)
 expect(done.scenes).toContain('bibleLastLetter')
 expect(completeBibleFinale(incomplete,done)).toBe(done)
 const ready={...done,scenes:[],clock:{day:320,minute:1080},flags:{...done.flags,bibleLastLetterSeen:1}}
 const ending=bibleEndingEvents(ready)
 expect(ending.scenes).toEqual(['completeBible'])
 const back=deserialize(serialize(ending),CONTENT)!
 expect(back.scenes).toContain('completeBible')
 expect(bibleEndingEvents({...back,scenes:[]}).scenes).toEqual([])
})
