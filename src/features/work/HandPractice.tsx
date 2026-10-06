import { useEffect } from 'react'
import { cursorOf, HOLD_DOWN, HOLD_UP, isDone, litCell, ORDER_CELLS, PICK_COLS, PICK_ROWS, progressOf, showing, type MiniState } from '../../engine/minigame'
import { T } from '../../content/text'

/** 기존 손일 엔진 여섯 가지를 그대로 쓴다. 완료되지 않은 손일을 건너뛰어 정산하지 않는다. 실패·시간 경쟁 없음 */
export function HandPractice({ state, tick, tap, finish }: {state:MiniState;tick:(dt:number)=>void;tap:(input:number)=>void;finish:()=>void}) {
  const done=isDone(state)
  const M=T.ui.minigame
  // 화면 새로 그릴 때마다 실제 흐른 시간만큼 움직인다 — 0.1초 간격이면 막대가 뚝뚝 끊겨 보이는 자리와 판정 자리가 어긋났다 (2026-10-07)
  useEffect(()=>{
    if(done) return
    let last=performance.now(), raf=0
    const loop=(now:number)=>{tick(Math.min(.1,Math.max(0,(now-last)/1000)));last=now;raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop)
    return ()=>cancelAnimationFrame(raf)
  },[done,tick])
  const watching=state.kind==='order' && showing(state)
  return <div className="mini">
    <p>{done?M.done:watching?M.watch:M[state.kind]}</p>
    <div className="mini-bar" role="progressbar" aria-label={T.work.action} aria-valuenow={Math.round(progressOf(state)*100)} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${progressOf(state)*100}%`}} /></div>
    {state.kind==='hold' && <div className="hold-gauge"><div className="hold-zone" style={{bottom:`${state.zone[0]*100}%`,height:`${(state.zone[1]-state.zone[0])*100}%`}}/><div className="hold-fill" style={{height:`${state.fill*100}%`}}/></div>}
    {state.kind==='timing' && <div className={`timing-track ${state.flash ?? ''}`}><div className="timing-zone" style={{left:`${state.zone[0]*100}%`,width:`${(state.zone[1]-state.zone[0])*100}%`}}/><div className="timing-cursor" style={{left:`${cursorOf(state.t)*100}%`}}/></div>}
    {!done && state.kind==='hold' && <button className="primary big" onPointerDown={(e)=>{e.currentTarget.setPointerCapture?.(e.pointerId);tap(HOLD_DOWN)}} onPointerUp={()=>tap(HOLD_UP)} onPointerCancel={()=>tap(HOLD_UP)} onKeyDown={(e)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)tap(HOLD_DOWN)}}} onKeyUp={(e)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();tap(HOLD_UP)}}}>{M.holdBtn}</button>}
    {!done && state.kind==='weave' && <div className={`weave-row ${state.flash ?? ''}`}>{([0,1] as const).map(side=><button key={side} className={`weave-btn${state.next===side?' next':''}`} onClick={()=>tap(side)}>{side===0?`◀ ${M.left}`:`${M.right} ▶`}</button>)}</div>}
    {state.kind==='order' && <div className={`order-grid ${state.flash ?? ''}`}>{Array.from({length:ORDER_CELLS},(_,i)=><button key={i} className={`order-cell c${i}${litCell(state)===i?' lit':''}`} disabled={done||watching} aria-label={`${i+1}`} onClick={()=>tap(i)}>{['◆','●','▲','■'][i]}</button>)}</div>}
    {state.kind==='pick' && <div className="pick-grid" style={{gridTemplateColumns:`repeat(${PICK_COLS}, 1fr)`}}>{Array.from({length:PICK_COLS*PICK_ROWS},(_,i)=>{const item=state.items.find(it=>it.x===i%PICK_COLS&&it.y===Math.floor(i/PICK_COLS));return <button key={i} className="pick-cell" disabled={!item||done} aria-label={item?M.tap:M.empty} onClick={()=>item&&tap(item.id)}>{item?'●':''}</button>})}</div>}
    {!done && (state.kind==='mash'||state.kind==='timing') && <button className="primary big" onClick={()=>tap(0)}>{M.tap}</button>}
    {done && <button className="primary" onClick={finish}>{T.work.next}</button>}
  </div>
}
