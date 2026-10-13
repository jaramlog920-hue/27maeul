import {CONTENT} from '../content/catalog'
import {legacyGame} from './growth-test-support'
import {finishReading,hallGuestsToday,dine,decorateBook,goToSleep} from './game'
import {READING_FROM} from './meetings'
import {ROOMS} from './world'
import {DEFAULT_CHOICE} from './binding'
import {completeProject,pickProject} from './projects'
import {livingGuests} from './living-moments'
import {serialize,deserialize} from './save'
import {kidMailFor} from './child'
import {freshStats} from './stats'
const fresh=()=>({...legacyGame(CONTENT),scenes:[]})
it('실제 낭독 완료 때만 한 번 예약하고 실제 참석자를 보존한다',()=>{
 const s={...fresh(),clock:{day:5,minute:READING_FROM}}
 expect(finishReading({...s,clock:{day:6,minute:READING_FROM}},CONTENT).scenes).toEqual([])
 const next=finishReading(s,CONTENT)
 expect(next.scenes).toContain('readingFinished')
 expect(new Set(livingGuests(next,CONTENT,'readingMomentGuest:'))).toEqual(new Set(hallGuestsToday(s,CONTENT)))
 expect(finishReading({...next,scenes:[]},CONTENT).scenes).toEqual([])
 expect(finishReading({...next,scenes:[],clock:{day:12,minute:READING_FROM}},CONTENT).scenes).not.toContain('readingFinished')
})
it('실제 초대한 사람이 집에 있을 때 첫 식사만 영화 장면으로 바뀐다',()=>{
 const base=fresh(),room=ROOMS.find(r=>r.owner==='grandpa')!
 const s={...base,clock:{day:1,minute:1110},today:{...base.today,inviter:'grandpa',dined:false},npcs:{...base.npcs,grandpa:{...base.npcs.grandpa,...room.sit,path:[]}}}
 expect(dine(s,'baker')).toBeNull()
 const next=dine(s,'grandpa')!
 expect(next.scenes).toContain('firstDinner:grandpa')
 expect(next.today.dined).toBe(true)
 expect(dine(next,'grandpa')).toBeNull()
 const again=dine({...next,scenes:[],clock:{day:2,minute:1110},today:{...next.today,dined:false}},'grandpa')!
 expect(again.scenes).toContain('dinner:grandpa')
})
it('표지는 실제 재료를 지불해 적용한 첫 디자인을 저장하고 이후 꾸밈으로 바꾸지 않는다',()=>{
 const base=fresh(),choice={...DEFAULT_CHOICE,color:'sky' as const,pattern:'diamonds' as const,detail:'metalCorners' as const}
 expect(decorateBook(base,'phm',choice)).toBe(base)
 const rich={...base,shelved:{phm:0 as const},inv:{...base.inv,creamPaper:20,blueDye:5,fineThread:10}}
 const next=decorateBook(rich,'phm',choice)
 expect(next.scenes).toContain('coverFinished')
 expect(next.bound.phm?.special).toEqual(choice)
 const again=decorateBook({...next,scenes:[]},'phm',{...DEFAULT_CHOICE,color:'sage'})
 expect(again.scenes).toEqual([])
 expect(again.flags.coverMomentColor).toBe(next.flags.coverMomentColor)
 expect(deserialize(serialize(next),CONTENT)?.scenes).toContain('coverFinished')
})
it('아이의 실제 편지가 온 날에만 한 번 예약하며 선물·닢 소식은 제외한다',()=>{
 const child={name:'하린',look:'girl' as const,born:1,stats:freshStats(),lean:null,job:'scribe' as const,jobConfirmed:true,left:true}
 const day=Array.from({length:90},(_,i)=>i+100).find(d=>kidMailFor(child,d)==='letter')!
 const s={...fresh(),child,clock:{day:day-1,minute:1200}}
 const next=goToSleep(s,CONTENT)
 expect(next.flags.kidMailKind).toBe(0)
 expect(next.scenes).toContain('childLetterReceived')
 expect(next.flags.childLetterMomentDay).toBe(day)
 const other=Array.from({length:90},(_,i)=>i+100).find(d=>kidMailFor(child,d)==='gift')!
 expect(goToSleep({...s,clock:{day:other-1,minute:1200}},CONTENT).scenes).not.toContain('childLetterReceived')
 const repeat=goToSleep({...next,scenes:[],clock:{day:day-1,minute:1200}},CONTENT)
 expect(repeat.scenes).not.toContain('childLetterReceived')
})
it('시설을 고른 때는 열리지 않고 실제 완공된 종류와 기여자만 기록한다',()=>{
 const base={...fresh(),flags:{...fresh().flags,villageLevel:99}}
 const started=pickProject(base,'longBench',CONTENT)
 expect(started.scenes).not.toContain('facilityFinished:longBench')
 const p=started.village!.projects.longBench!
 const s={...started,village:{...started.village!,projects:{...started.village!.projects,longBench:{...p,given:{carpenter:2,smith:0},with:['presser']}}}}
 const next=completeProject(s,'longBench',s.clock.day)
 expect(next.scenes).toContain('facilityFinished:longBench')
 expect(livingGuests(next,CONTENT,'facilityMomentCrew:longBench:')).toEqual(['presser','carpenter'])
 expect(completeProject(next,'longBench',s.clock.day)).toBe(next)
 expect(deserialize(serialize(next),CONTENT)?.scenes).toContain('facilityFinished:longBench')
})
