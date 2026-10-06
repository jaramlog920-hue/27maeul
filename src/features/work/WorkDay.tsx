import { useCallback, useState } from 'react'
import { CONTENT } from '../../content/catalog'
import { callName, T } from '../../content/text'
import { canWorkDay, finishWorkDay, finishWorkStep, prepareWorkDay, shopOf, startWorkDay, WORK_SHOPS, workDayHand, workLine, type WorkState } from '../../engine/work-day'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { HandPractice } from './HandPractice'

interface ShopText { prep: Record<string, string>; hands: string[]; handsOff?: string[]; finish: Record<string, string>; result: string }
const SHOP_TEXT = T.work.shops as Record<string, ShopText>
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))

export function applyLifeState(next:WorkState,save=true) {
  if(save) saveGame(next)
  useGame.setState({game:next})
}
/** onOpen을 주면 여는 일을 부르는 쪽(말 걸기 창)에 맡긴다 — 함께 일하는 동안 다른 단추를 가리려고 */
export function WorkEntry({ npc = 'carpenter', onOpen }: {npc?:string; onOpen?:()=>void}) {
  const game=useGame(s=>s.game) as WorkState
  const [opened,setOpened]=useState(false)
  const w=game.workDay
  const resume=!!w && w.npc===npc && w.day===game.clock.day && !w.paid
  const block=resume?null:canWorkDay(game,npc,CONTENT)
  if(block==='away'||block==='notWorking') return null
  if(opened) return <WorkDayView npc={npc} close={()=>setOpened(false)}/>
  return <><button disabled={block!==null} onClick={()=>onOpen?onOpen():setOpened(true)}>{resume?T.work.resume:T.work.entry}</button></>
}
/** 작업장 안내 → 맡을 부분 → 손일 둘 → 마무리 고르기 → 결과. 화면에는 지금 단계와 고를 것만 */
export function WorkDayView({npc,close}:{npc:string;close:()=>void}) {
  const game=useGame(s=>s.game) as WorkState
  const w=game.workDay
  const current=!!w && w.npc===npc && w.day===game.clock.day
  const shop=shopOf(npc)
  const tick=useCallback((dt:number)=>{const s=useGame.getState();applyLifeState(workDayHand(s.game,'tick',dt,s.rng),false)},[])
  const tap=useCallback((input:number)=>{const s=useGame.getState();applyLifeState(workDayHand(s.game,'tap',input,s.rng))},[])
  const step=()=>{const s=useGame.getState();applyLifeState(finishWorkStep(s.game,s.rng))}
  if(!shop) return null
  const sh=WORK_SHOPS[shop], tx=SHOP_TEXT[shop]
  const say=(at:'start'|'hand'|'finish')=>{const l=workLine(game,npc,at);return l?<p className="talk-line">{callName(l,game.avatar?.name)}</p>:null}
  const handLabels=(shop==='vineyard' && w?.hands?.[0]!=='pick' && tx.handsOff) ? tx.handsOff : tx.hands
  return <section aria-label={T.work.title}>
    <h3>{T.work.title}</h3>
    {!current && <>{say('start')}
      <p>{T.work.part}</p>
      {sh.prep.map(p=><button key={p} onClick={()=>applyLifeState(startWorkDay(useGame.getState().game,npc,p,CONTENT))}>{tx.prep[p]}</button>)}</>}
    {current && w.step===0 && <><p>{tx.prep[w.choices[0]] ?? ''}</p><button onClick={()=>{const s=useGame.getState();applyLifeState(prepareWorkDay(s.game,s.rng))}}>{T.work.prepare}</button></>}
    {current && w.mini && <>{say('hand')}<p>{fill(T.work.hand,{n:w.step,label:handLabels[w.step-1]??''})}</p><HandPractice state={w.mini} tick={tick} tap={tap} finish={step}/></>}
    {current && w.step===3 && !w.paid && <>{say('finish')}<p>{T.work.finishAsk}</p>
      {sh.finish.map(f=><button key={f} onClick={()=>applyLifeState(finishWorkDay(useGame.getState().game,f))}>{tx.finish[f]}</button>)}</>}
    {current && w.paid && <p role="status">{w.step===4?`${tx.result} ${T.work.done}`:T.work.done}</p>}
    <button onClick={()=>{saveGame(useGame.getState().game);close()}}>{T.work.pause}</button>
  </section>
}
