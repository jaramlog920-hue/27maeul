import { describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { T } from '../content/text'
import { recordExperienceIn, newGame, placeFurniture } from './game'
import { finishNow } from './minigame'
import { RECIPES } from './items'
import { FURNITURE } from './room'
import { HOME_RECT } from './world'
import { deserialize, serialize } from './save'
import { EXPANSION_PROPS } from '../render/expansion-prop-art'
import { STYLE_PALETTES } from '../render/furniture-art'
import { discoveredFinish, canLearnFinish, startFinishLesson, chooseFinish, finishLesson, chooseStoolFinish, craftLearnedStool, canShowFinishedStool, sanitizeSkills, sanitizeSkillLesson, FINISH_SKILL, type SkillState, SKILL_DEFS, SKILL_IDS, skillOf, discoveredSkill, canLearn, startLesson, chooseStyle, lookAgain, craftLearned, canShowSkillItem, chooseSkillStyle, styleOf } from './skills'

function working():SkillState {
  const s=newGame(CONTENT)
  return {...s,clock:{day:2,minute:480},player:{...s.player,x:5,y:24},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))},npcs:{...s.npcs,carpenter:{...s.npcs.carpenter,x:6,y:24,visible:true}}}
}
/** 이웃 하나를 플레이어 곁에 세운다 */
function beside(s:SkillState,npc:string):SkillState {
  return {...s,npcs:{...s.npcs,[npc]:{...s.npcs[npc],x:6,y:24,visible:true}}}
}
function learn(s:SkillState,npc:string,style:string):SkillState {
  let n=startLesson(s,npc,CONTENT);n=chooseStyle(n,style,()=>.5)
  n={...n,skillLesson:{...n.skillLesson!,mini:finishNow(n.skillLesson!.mini!)}}
  return finishLesson(n)
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

describe('이웃마다 배우는 생활 기술 (기획 11)',()=>{
  it('가르치는 이웃·물건·그림·문구가 실제로 있다 (한 이웃 = 한 기술)',()=>{
    const ids=new Set(CONTENT.neighbors.map(n=>n.id))
    const seen=new Set<string>()
    const L=T.skill.lessons as Record<string,{name:string;demo:Record<string,string>;styles:Record<string,string>;reply:Record<string,string>}>
    for(const id of SKILL_IDS){
      const d=SKILL_DEFS[id]
      expect(FURNITURE,id).toContain(d.item)
      for(const a of d.art) expect(EXPANSION_PROPS[a],`${id} ${a}`).toBeDefined()
      expect(STYLE_PALETTES[d.item]?.[d.styles[1]],`${id} 배운 모습 색`).toBeDefined()
      expect(L[id]?.name,id).toBeTruthy()
      for(const st of d.styles) expect(L[id].styles[st],`${id} ${st}`).toBeTruthy()
      for(const t of d.teachers){
        expect(ids.has(t),t).toBe(true)
        expect(seen.has(t),`${t} 두 기술`).toBe(false);seen.add(t)
        expect(skillOf(t)).toBe(id)
        expect(L[id].demo[t],`${id} ${t} 시범`).toBeTruthy()
        expect(L[id].reply[t],`${id} ${t} 반응`).toBeTruthy()
      }
      // 만드는 재료는 가방에 있는 물건만 (말씀·필사본 아님)
      for(const k of Object.keys(d.needs??{})) expect(['papyrus','ink','cover','finePapyrus','creamPaper'].includes(k),k).toBe(false)
    }
  })
  it('함께 일한 이웃의 기술을 알게 되고, 같은 작업장 이웃 누구에게서나 한 번 배운다',()=>{
    let s=beside(working(),'penelope')
    expect(discoveredSkill({...s,hearts:{weaver:100,penelope:100}},'clothColor')).toBe(false)
    expect(canLearn(s,'penelope',CONTENT)).toBe('unknown')
    s=recordExperienceIn(s,{id:'work:weaver',kind:'work',with:['weaver']})
    expect(discoveredSkill(s,'clothColor')).toBe(true)
    expect(discoveredSkill(s,'snackShape')).toBe(false)
    expect(canLearn(s,'penelope',CONTENT)).toBeNull()
    const n=learn(s,'penelope','rose')
    expect(n.skills?.clothColor).toEqual({day:2,from:'penelope',picked:'rose'})
    expect(n.flags['skillFinish:cushion']).toBe(2)
    expect(n.clock.minute).toBe(510)
    // 함께 배운 기억은 가르쳐 준 이웃에게만
    expect(n.life.experiences['learn:clothColor']).toMatchObject({kind:'learn',with:['penelope'],count:1,item:'cushion'})
    expect(n.life.memories.penelope?.some(m=>m.tag==='exp:learn:clothColor')).toBe(true)
    expect(n.life.memories.weaver?.some(m=>m.tag==='exp:learn:clothColor')).toBeFalsy()
    // 다시 배워도 중복 없음
    expect(canLearn(beside(n,'weaver'),'weaver',CONTENT)).toBe('known')
    expect(startLesson(beside(n,'weaver'),'weaver',CONTENT)).toEqual(beside(n,'weaver'))
    expect(finishLesson(n)).toBe(n)
  })
  it('서툴러도 실패가 없고, 다시 살펴보며 다른 방식을 고를 수 있다',()=>{
    let n=recordExperienceIn(beside(working(),'baker'),{id:'work:baker',kind:'work',with:['baker']})
    n=startLesson(n,'baker',CONTENT);n=chooseStyle(n,'round',()=>.5)
    expect(n.skillLesson?.step).toBe(1)
    expect(finishLesson(n)).toBe(n)
    n=lookAgain(n)
    expect(n.skillLesson).toMatchObject({step:0,mini:undefined})
    n=chooseStyle(n,'long',()=>.5)
    n={...n,skillLesson:{...n.skillLesson!,mini:finishNow(n.skillLesson!.mini!)}}
    n=finishLesson(n)
    expect(n.skills?.snackShape?.picked).toBe('long')
    expect(styleOf(n,'snackShape')).toBe('long')
  })
  it('중단한 실습은 저장·재접속 뒤 그 단계에서 이어가고, 지급은 마칠 때 한 번',()=>{
    let n=recordExperienceIn(beside(working(),'grandpa'),{id:'work:grandpa',kind:'work',with:['grandpa']})
    n=startLesson(n,'grandpa',CONTENT);n=chooseStyle(n,'vine',()=>.5)
    const back=deserialize(serialize(n),CONTENT) as SkillState
    expect(back.skillLesson).toMatchObject({id:'basketCare',npc:'grandpa',step:1,picked:'vine'})
    expect(back.skillLesson?.mini?.kind).toBe('weave')
    expect(back.skills).toEqual({})
    // 같은 날 다시 말을 걸면 처음부터가 아니라 그대로
    expect(startLesson(back,'grandpa',CONTENT).skillLesson?.step).toBe(1)
    expect(sanitizeSkillLesson({id:'constructor',npc:'grandpa',day:2,step:0,picked:'plain'})).toBeUndefined()
    expect(sanitizeSkillLesson({id:'basketCare',npc:'carpenter',day:2,step:0,picked:'plain'})).toBeUndefined()
  })
  it('바쁘거나 늦은 때는 다른 때를 안내할 뿐 (잠금·불이익 없음)',()=>{
    const s=recordExperienceIn(beside(working(),'smith'),{id:'work:smith',kind:'work',with:['smith']})
    expect(canLearn({...s,clock:{day:2,minute:17*60+50}},'smith',CONTENT)).toBe('late')
    expect(canLearn({...s,npcs:{...s.npcs,smith:{...s.npcs.smith,x:40,y:40}}},'smith',CONTENT)).toBe('away')
    expect(canLearn({...s,workDay:{id:'w',npc:'smith',day:2,startedAt:480,step:1,choices:[],used:true,paid:false}} as SkillState,'smith',CONTENT)).toBe('busy')
    expect(canLearn(s,'smith',CONTENT)).toBeNull()
    expect(s.hearts).toEqual(working().hearts)
  })
  it('배운 모습은 작업대에서 고르고, 방에 놓을 때 그 모습이 된다 — 모습만 고르는 기술은 재료 없이',()=>{
    const base=working()
    let n:SkillState={...base,skills:{clothColor:{day:2,from:'weaver',picked:'blue'},hookFinish:{day:2,from:'tilly',picked:'copper'}},inv:{wool:2,barrel:1}}
    expect(craftLearned(n,'hookFinish')).toBe(n)
    n=chooseSkillStyle(n,'clothColor','rose')
    n=craftLearned(n,'clothColor')
    expect(n.inv.cushion).toBe(1);expect(n.inv.wool).toBeUndefined()
    expect(canShowSkillItem(n,'clothColor')).toBe(true)
    expect(canShowSkillItem(n,'hookFinish')).toBe(true)
    expect(canShowSkillItem(n,'snackShape')).toBe(false)
    n=chooseSkillStyle(n,'hookFinish','copper')
    const at=(x:number,y:number)=>({x:x+HOME_RECT.x0-2,y:y+HOME_RECT.y0-2})
    const placeAny=(s:SkillState,item:'cushion'|'barrel')=>{for(let y=3;y<9;y++)for(let x=3;x<9;x++){const p=placeFurniture(s,item,at(x,y));if(p)return p as SkillState}return null}
    const p=placeAny({...n,room:[]},'cushion')!
    expect(p.room.find(f=>f.item==='cushion')?.finish).toBe('rose')
    const q=placeAny({...n,room:[]},'barrel')!
    expect(q.room.find(f=>f.item==='barrel')?.finish).toBe('copper')
    // 본래 모습을 고르면 모습 표시 없이 놓인다
    const r=placeAny({...chooseSkillStyle(n,'clothColor','blue'),room:[]},'cushion')!
    expect(r.room.find(f=>f.item==='cushion')?.finish).toBeUndefined()
    // 배우지 않은 기술의 모습은 고를 수 없다
    expect(chooseSkillStyle(n,'potTidy','stone')).toBe(n)
    expect(n.progress).toEqual(base.progress);expect(n.stats).toEqual(base.stats);expect(n.coins).toBe(base.coins)
  })
  it('배우자가 되어도 배운 기술은 그대로이고, 옛 저장·옛 제작법은 바뀌지 않는다',()=>{
    const s:SkillState={...working(),skills:{teaSetting:{day:3,from:'poppy',picked:'blue'},[FINISH_SKILL]:{day:2,from:'carpenter',picked:'warm'}}}
    const married={...s,romance:{...s.romance,stage:'married' as const,partner:'poppy'}} as SkillState
    expect(canLearn(beside(married,'poppy'),'poppy',CONTENT)).toBe('known')
    expect(sanitizeSkills(married.skills)).toEqual(s.skills)
    expect(sanitizeSkills({teaSetting:{day:3,from:'carpenter',picked:'blue'},nope:{day:1,from:'poppy',picked:'x'}})).toEqual({})
    const old=JSON.parse(serialize(working()));delete old.skills;delete old.skillLesson
    expect((deserialize(JSON.stringify(old),CONTENT) as SkillState).skills).toEqual({})
    expect(Object.keys(RECIPES).sort()).toEqual(['blanket','bread','cover','creamPaper','fineThread','ink','oil','papyrus','scentCandle'])
  })
})
