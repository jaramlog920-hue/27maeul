import { useCallback, useState } from 'react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { canShowFinishedStool, canLearnFinish, chooseFinish, chooseStoolFinish, craftLearnedStool, discoveredFinish, FINISH_SKILL, finishLesson, finishLessonHand, startFinishLesson, type SkillState } from '../../engine/skills'
import { has } from '../../engine/items'
import { overflows } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'
import { HandPractice } from '../work/HandPractice'

/** onOpen을 주면 배우는 화면을 부르는 쪽(말 걸기 창)이 연다 */
export function SkillEntry({npc='carpenter',onOpen}:{npc?:string;onOpen?:()=>void}) {
  const game=useGame(s=>s.game) as SkillState
  const [opened,setOpened]=useState(false)
  const [shown,setShown]=useState(false)
  if(npc!=='carpenter' || !discoveredFinish(game)) return null
  const known=!!game.skills?.[FINISH_SKILL]
  const block=canLearnFinish(game,CONTENT)
  if(known) return <><p>{T.skill.known}</p>{canShowFinishedStool(game)&&<button onClick={()=>setShown(true)}>{T.skill.show}</button>}{shown&&<p role="status">{T.skill.reply}</p>}</>
  if(opened) return <FinishLesson close={()=>setOpened(false)}/>
  return <button disabled={block==='busy'} onClick={()=>{applyLifeState(startFinishLesson(useGame.getState().game,CONTENT));if(onOpen)onOpen();else setOpened(true)}}>{T.skill.entry}</button>
}
export function FinishLesson({close}:{close:()=>void}) {
  const game=useGame(s=>s.game) as SkillState
  const l=game.skillLesson
  const tick=useCallback((dt:number)=>{const s=useGame.getState();applyLifeState(finishLessonHand(s.game,'tick',dt,s.rng),false)},[])
  const tap=useCallback((input:number)=>{const s=useGame.getState();applyLifeState(finishLessonHand(s.game,'tap',input,s.rng))},[])
  const pick=(picked:'plain'|'warm')=>{const s=useGame.getState();applyLifeState(chooseFinish(s.game,picked,s.rng))}
  return <section aria-label={T.skill.title}><h3>{T.skill.title}</h3>
    {l?.step===0 && <><p>{T.skill.demo}</p><button onClick={()=>pick('plain')}>{T.skill.plain}</button><button onClick={()=>pick('warm')}>{T.skill.warm}</button></>}
    {l?.mini && <><p>{T.skill.practice}</p><HandPractice state={l.mini} tick={tick} tap={tap} finish={()=>applyLifeState(finishLesson(useGame.getState().game))}/></>}
    {game.skills?.[FINISH_SKILL] && <p role="status">{T.skill.known}</p>}
    <button onClick={close}>{T.skill.pause}</button>
  </section>
}
export function SkillCraftOptions() {
  const game=useGame(s=>s.game) as SkillState
  if(!game.skills?.[FINISH_SKILL]) return null
  const needs=!has(game.inv,{reed:2})
  const full=overflows(game,{stool:1})
  const selected=game.flags['skillFinish:stool']===2?'warm':'plain'
  return <section aria-label={T.skill.options}><h3>{T.skill.options}</h3><p>{T.skill.materials}</p>
    <div className="actions"><button aria-pressed={selected==='plain'} onClick={()=>applyLifeState(chooseStoolFinish(useGame.getState().game,'plain'))}>{T.skill.plain}</button><button aria-pressed={selected==='warm'} onClick={()=>applyLifeState(chooseStoolFinish(useGame.getState().game,'warm'))}>{T.skill.warm}</button></div>
    <button disabled={needs||full} onClick={()=>applyLifeState(craftLearnedStool(useGame.getState().game))}>{T.skill.craft}</button>
    {(needs||full)&&<p className="hint">{needs?T.skill.needs:T.skill.full}</p>}
  </section>
}
