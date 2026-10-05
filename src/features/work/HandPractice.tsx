import { useEffect } from 'react'
import { HOLD_DOWN, HOLD_UP, isDone, progressOf, type MiniState } from '../../engine/minigame'
import { T } from '../../content/text'

/** 기존 손일 엔진의 길게 누르기. 완료되지 않은 손일을 건너뛰어 정산하지 않는다. */
export function HandPractice({ state, tick, tap, finish }: {state:MiniState;tick:(dt:number)=>void;tap:(input:number)=>void;finish:()=>void}) {
  const done=isDone(state)
  useEffect(()=>{
    if(done) return
    const timer=window.setInterval(()=>tick(.1),100)
    return ()=>window.clearInterval(timer)
  },[done,tick])
  return <div className="mini">
    <p>{done?T.ui.minigame.done:T.ui.minigame.hold}</p>
    <div className="mini-bar" role="progressbar" aria-label={T.work.action} aria-valuenow={Math.round(progressOf(state)*100)} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${progressOf(state)*100}%`}} /></div>
    {state.kind==='hold' && <div className="hold-gauge"><div className="hold-zone" style={{bottom:`${state.zone[0]*100}%`,height:`${(state.zone[1]-state.zone[0])*100}%`}}/><div className="hold-fill" style={{height:`${state.fill*100}%`}}/></div>}
    {!done && <button className="primary big" onPointerDown={(e)=>{e.currentTarget.setPointerCapture?.(e.pointerId);tap(HOLD_DOWN)}} onPointerUp={()=>tap(HOLD_UP)} onPointerCancel={()=>tap(HOLD_UP)} onKeyDown={(e)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)tap(HOLD_DOWN)}}} onKeyUp={(e)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();tap(HOLD_UP)}}}>{T.ui.minigame.holdBtn}</button>}
    {done && <button className="primary" onClick={finish}>{T.work.next}</button>}
  </div>
}
