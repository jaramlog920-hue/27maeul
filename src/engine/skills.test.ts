import { describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { recordExperienceIn, newGame } from './game'
import { finishNow } from './minigame'
import { deserialize, serialize } from './save'
import { discoveredFinish, canLearnFinish, startFinishLesson, chooseFinish, finishLesson, chooseStoolFinish, craftLearnedStool, canShowFinishedStool, sanitizeSkills, sanitizeSkillLesson, FINISH_SKILL, type SkillState } from './skills'

function working():SkillState {
  const s=newGame(CONTENT)
  return {...s,clock:{day:2,minute:480},player:{...s.player,x:5,y:24},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))},npcs:{...s.npcs,carpenter:{...s.npcs.carpenter,x:6,y:24,visible:true}}}
}
describe('배운 생활 기술',()=>{
  it('선물·친밀도만으로 발견되지 않고 실제 함께한 작업 뒤 발견된다',()=>{
    const s=working()
    expect(discoveredFinish({...s,hearts:{carpenter:100}})).toBe(false)
    expect(canLearnFinish(s,CONTENT)).toBe('unknown')
    const n=recordExperienceIn(s,{id:'work:carpenter:1',kind:'work',with:['carpenter']})
    expect(discoveredFinish(n)).toBe(true)
  })
  it('시범·선택·실습 후 한 번 배우며 재접속에는 끝낸 단계 유지',()=>{
    let n:SkillState=recordExperienceIn(working(),{id:'work:carpenter:1',kind:'work',with:['carpenter']})
    n=startFinishLesson(n,CONTENT);n=chooseFinish(n,'warm',()=>.5)
    expect(finishLesson(n)).toBe(n)
    n={...n,skillLesson:{...n.skillLesson!,mini:finishNow(n.skillLesson!.mini!)}}
    n=finishLesson(n)
    expect(n.skills?.[FINISH_SKILL]).toEqual({day:2,from:'carpenter',picked:'warm'})
    expect(finishLesson(n)).toBe(n)
    expect(sanitizeSkills(JSON.parse(JSON.stringify(n.skills)))).toEqual(n.skills)
    expect(deserialize(serialize(n),CONTENT)?.skills).toEqual(n.skills)
    expect(sanitizeSkillLesson(n.skillLesson)?.step).toBe(2)
  })
  it('작업대 모습 옵션은 배운 뒤에만 열리고 개인 재료로 실제 의자를 만든다',()=>{
    const s=working()
    expect(craftLearnedStool(s)).toBe(s)
    let n:SkillState={...s,skills:{[FINISH_SKILL]:{day:2,from:'carpenter',picked:'plain'}},inv:{reed:3}}
    n=chooseStoolFinish(n,'warm');n=craftLearnedStool(n)
    expect(n.inv.reed).toBe(1);expect(n.inv.stool).toBe(1)
    expect(n.flags['skillFinish:stool']).toBe(2)
    expect(canShowFinishedStool(n)).toBe(true)
    expect(n.progress).toEqual(s.progress)
    expect(n.shelved).toEqual(s.shelved)
    expect(n.stats).toEqual(s.stats)
    const married={...n,romance:{...n.romance,stage:'married' as const,partner:'poppy'}} as SkillState
    expect(chooseStoolFinish(married,'plain').flags['skillFinish:stool']).toBe(1)
  })
})
