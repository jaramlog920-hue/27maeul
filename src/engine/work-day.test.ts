import { describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, finishHelp } from './game'
import { canWorkDay, startWorkDay, prepareWorkDay, finishWorkStep, finishWorkDay, expireWorkDay, sanitizeWorkDay, type WorkState } from './work-day'
import { finishNow } from './minigame'
import { deserialize, serialize } from './save'

function working():WorkState {
  const s=newGame(CONTENT)
  return {...s,clock:{day:2,minute:480},player:{...s.player,x:5,y:24},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))},npcs:{...s.npcs,carpenter:{...s.npcs.carpenter,x:6,y:24,visible:true}}}
}
const finishHand=(s:WorkState):WorkState=>finishWorkStep({...s,workDay:{...s.workDay!,mini:finishNow(s.workDay!.mini!)}},()=>.5)
describe('함께 일하는 하루',()=>{
  it('근무·현장·두 시간 여유가 있을 때만 시작한다',()=>{
    const s=working()
    expect(canWorkDay(s,'carpenter',CONTENT)).toBeNull()
    expect(canWorkDay({...s,player:{...s.player,x:50,y:50}},'carpenter',CONTENT)).toBe('away')
    expect(canWorkDay({...s,clock:{day:2,minute:1200}},'carpenter',CONTENT)).toBe('late')
    expect(canWorkDay({...s,helped:['carpenter']},'carpenter',CONTENT)).toBe('done')
  })
  it('준비·두 손일·정리 뒤 수고비와 참여 기억을 한 번만 받는다',()=>{
    const s=working()
    let n=startWorkDay(s,'carpenter','finish',CONTENT)
    n=prepareWorkDay(n,()=>.5)
    expect(finishWorkStep(n,()=>.5)).toBe(n)
    n=finishHand(n);n=finishHand(n);n=finishWorkDay(n)
    expect(n.clock.minute-s.clock.minute).toBe(120)
    expect(n.coins-s.coins).toBe(8)
    expect(n.life.experiences['work:carpenter:2'].with).toEqual(['carpenter'])
    expect(n.inv).toEqual(s.inv)
    expect(finishWorkDay(n)).toBe(n)
    const carpenter=CONTENT.neighbors.find(d=>d.id==='carpenter')!
    expect(finishHelp(n,carpenter)).toBe(n)
  })
  it('중단 저장은 끝낸 단계를 유지하고 다음 날 부분 정산 한 번',()=>{
    const s=working()
    let n=prepareWorkDay(startWorkDay(s,'carpenter','sort',CONTENT),()=>.5)
    n=finishHand(n)
    const restored=sanitizeWorkDay(JSON.parse(JSON.stringify(n.workDay)))
    expect(restored?.step).toBe(2)
    expect(deserialize(serialize(n),CONTENT)?.workDay?.step).toBe(2)
    const next=expireWorkDay({...n,workDay:restored,clock:{day:3,minute:480}})
    expect(next.coins-s.coins).toBe(2)
    expect(expireWorkDay(next)).toBe(next)
    expect(next.life.experiences['work:carpenter:2']).toBeUndefined()
  })
  it('겹치는 일정이 있으면 시작하지 않는다',()=>{
    const s=working()
    const n={...s,plans:{nextId:2,appts:[{id:'appt:1',kind:'event' as const,day:2,from:480,to:600,place:'teaTable' as const,members:['carpenter'],state:'planned' as const,rewarded:false,remembered:false}]}}
    expect(canWorkDay(n,'carpenter',CONTENT)).toBe('busy')
  })
})
