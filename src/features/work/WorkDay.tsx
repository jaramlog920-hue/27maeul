import { useCallback, useState } from 'react'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { canWorkDay, finishWorkDay, finishWorkStep, prepareWorkDay, startWorkDay, workDayHand, type WorkState } from '../../engine/work-day'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { HandPractice } from './HandPractice'

export function applyLifeState(next:WorkState,save=true) {
  if(save) saveGame(next)
  useGame.setState({game:next})
}
export function WorkEntry({ npc = 'carpenter' }: {npc?:string}) {
  const game=useGame(s=>s.game) as WorkState
  const [opened,setOpened]=useState(false)
  const w=game.workDay
  const resume=!!w && w.npc===npc && w.day===game.clock.day && !w.paid
  const block=resume?null:canWorkDay(game,npc,CONTENT)
  if(block==='away'||block==='notWorking') return null
  if(opened) return <WorkDayView npc={npc} close={()=>setOpened(false)}/>
  return <><button disabled={block!==null} onClick={()=>setOpened(true)}>{resume?T.work.resume:T.work.entry}</button>{block && <p className="hint">{T.work.blocks[block]}</p>}</>
}
export function WorkDayView({npc,close}:{npc:string;close:()=>void}) {
  const game=useGame(s=>s.game) as WorkState
  const w=game.workDay
  const current=!!w && w.npc===npc && w.day===game.clock.day
  const tick=useCallback((dt:number)=>{const s=useGame.getState();applyLifeState(workDayHand(s.game,'tick',dt,s.rng),false)},[])
  const tap=useCallback((input:number)=>{const s=useGame.getState();applyLifeState(workDayHand(s.game,'tap',input,s.rng))},[])
  const step=()=>{const s=useGame.getState();applyLifeState(finishWorkStep(s.game,s.rng))}
  return <section aria-label={T.work.title}>
    <h3>{T.work.title}</h3><p>{(T.work.jobs as Record<string,string>)[npc]??T.work.title}</p>
    {!current && <><p>{T.work.lead}</p><p className="hint">{T.work.supplies}</p><p className="hint">{T.work.partial}</p>
      <button onClick={()=>applyLifeState(startWorkDay(useGame.getState().game,npc,'sort',CONTENT))}>{T.work.sort}</button>
      {npc==='carpenter'&&<button onClick={()=>applyLifeState(startWorkDay(useGame.getState().game,npc,'finish',CONTENT))}>{T.work.finish}</button>}</>}
    {current && w.step===0 && <button onClick={()=>{const s=useGame.getState();applyLifeState(prepareWorkDay(s.game,s.rng))}}>{T.work.prepare}</button>}
    {current && w.mini && <HandPractice state={w.mini} tick={tick} tap={tap} finish={step}/>}
    {current && w.step===3 && !w.paid && <button onClick={()=>applyLifeState(finishWorkDay(useGame.getState().game))}>{T.work.closeWork}</button>}
    {current && w.paid && <p role="status">{T.work.done}</p>}
    <button onClick={()=>{saveGame(useGame.getState().game);close()}}>{T.work.pause}</button>
  </section>
}
