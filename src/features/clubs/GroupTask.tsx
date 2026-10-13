import { useEffect, useRef, useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { advanceGroupTask, type GroupTaskProgress } from '../../engine/group-task'
import { useGame } from '../../store/game-store'
import { commitClub } from './club-store'
import { drawGroupPreview } from '../../render/renderer'
import { copiedChapters, copiedReadingVerses } from '../../engine/copied-reading'
import { copyBookName, withSubject } from '../../content/text'
import { FESTIVAL_SPOTS } from '../../engine/neighbors'
import { ensureOtBook } from '../../content/ot-catalog'
import { chapterUnit, isOtBook } from '../../engine/ot-books'
import './group-task.css'

type TaskKind='tea'|'sew'|'garden'|'observe'|'read'|'cook'|'paint'|'music'|'housewarming'|'showcase'|'festivalFood'|'festivalDeco'|'festivalTidy'
const TASKS:Record<TaskKind,{choices:string[];work:string;finish:string;mode:'hold'|'trace'|'tap'}>={
 tea:{choices:['따뜻한 차 따르기','시원한 물 나누기'],work:'버튼을 누르고 있다가 표시된 구간에서 놓아 주세요.',finish:'잔을 건넬 이웃을 골라 주세요.',mode:'hold'},
 sew:{choices:['작은 꽃무늬','줄무늬'],work:'번호 순서대로 눌러 바느질 선을 이어 주세요.',finish:'완성한 천을 보여줄 이웃을 골라 주세요.',mode:'trace'},
 garden:{choices:['씨앗 심기 맡기','물주기 맡기'],work:'흙 위의 번호를 순서대로 눌러 심을 자리를 만들어 주세요.',finish:'함께 마무리할 이웃을 골라 주세요.',mode:'trace'},
 observe:{choices:['꽃과 잎 관찰하기','하늘과 구름 관찰하기'],work:'반짝이는 곳을 찾아 네 번 눌러 기록해 주세요.',finish:'발견한 곳을 알려줄 이웃을 골라 주세요.',mode:'tap'},
 read:{choices:['책 함께 읽기','내 말씀 필사본 나누기'],work:'글의 표시를 순서대로 눌러 함께 읽을 부분을 짚어 주세요.',finish:'같이 들여다볼 이웃을 골라 주세요.',mode:'trace'},
 cook:{choices:['반죽하기 맡기','재료 섞기 맡기'],work:'누르고 있다가 알맞은 구간에서 놓아 반죽을 준비해 주세요.',finish:'음식을 먼저 맛볼 이웃을 골라 주세요.',mode:'hold'},
 paint:{choices:['꽃 그리기','마을 그리기'],work:'번호 순서대로 눌러 그림의 선을 이어 주세요.',finish:'완성한 그림을 보여줄 이웃을 골라 주세요.',mode:'trace'},
 music:{choices:['연주 맡기','박수로 박자 맞추기'],work:'반짝이는 박자를 차례로 네 번 눌러 주세요.',finish:'마지막 박자를 함께 맞출 이웃을 골라 주세요.',mode:'tap'},
 housewarming:{choices:['손님에게 차 대접하기','선물 받아 함께 살펴보기'],work:'누르고 있다가 표시된 구간에서 놓아 손님 자리를 준비해 주세요.',finish:'먼저 맞이할 손님을 골라 주세요.',mode:'hold'},
 showcase:{choices:['작품 펼쳐 보이기','내 말씀 필사본 보여주기'],work:'번호 순서대로 눌러 소개할 부분을 짚어 주세요.',finish:'먼저 감상할 이웃을 골라 주세요.',mode:'trace'},
 festivalFood:{choices:['음식 쟁반 준비','음식 나눠주기'],work:'알맞은 구간에서 놓아 쟁반에 음식을 준비해 주세요.',finish:'음식을 건넬 이웃을 골라 주세요.',mode:'hold'},
 festivalDeco:{choices:['꽃 장식 잇기','걸개 장식 달기'],work:'번호 순서대로 눌러 장식을 이어 주세요.',finish:'장식을 함께 달 이웃을 골라 주세요.',mode:'trace'},
 festivalTidy:{choices:['탁자 닦기','빈 접시 정리하기'],work:'반짝이는 자리를 순서대로 눌러 정리해 주세요.',finish:'정리를 함께 마무리할 이웃을 골라 주세요.',mode:'tap'},
}

export function Preview({id}:{id:string}) {
 const canvas=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return
  let raf=0
  const draw=(t:number)=>{drawGroupPreview(ctx,useGame.getState().game,CONTENT,id,t/1000);raf=requestAnimationFrame(draw)}
  raf=requestAnimationFrame(draw)
  return()=>cancelAnimationFrame(raf)
 },[id])
 return <canvas ref={canvas} width={128} height={40} className="group-preview" aria-label="나와 이웃이 함께하는 동작" />
}

export function GroupTask({id,kind,progress}:{id:string;kind:TaskKind;progress?:GroupTaskProgress}) {
 const game=useGame(s=>s.game),stage=progress?.stage??0,task=TASKS[kind]
 const [amount,setAmount]=useState(0),[marks,setMarks]=useState(0),[hint,setHint]=useState('')
 const [loading,setLoading]=useState(false)
 const amountRef=useRef(0),timer=useRef<ReturnType<typeof setInterval>|null>(null)
 const stop=()=>{if(timer.current!==null){clearInterval(timer.current);timer.current=null}}
 useEffect(()=>{setMarks(0);setAmount(0);amountRef.current=0;setHint('');return stop},[stage])
 const a=game.plans.appts.find(a=>a.id===id)
 const members=a?.startedWith??a?.members??Object.entries(FESTIVAL_SPOTS).filter(([npc,spot])=>{const n=game.npcs[npc];return n?.visible&&Math.abs(Math.round(n.x)-spot.x)+Math.abs(Math.round(n.y)-spot.y)<=2}).map(([npc])=>npc)
 const copies=copiedChapters(game,CONTENT)
 const selectedCopy=copies.find(c=>progress?.selection===`${copyBookName(c.book)} ${c.chapter}장 필사본`)
 const next=(choice?:string)=>commitClub(advanceGroupTask(useGame.getState().game,id,stage,choice))
 const press=()=>{
  if(timer.current!==null)return
  amountRef.current=0;setAmount(0);setHint('')
  timer.current=setInterval(()=>{amountRef.current=Math.min(100,amountRef.current+4);setAmount(amountRef.current)},50)
 }
 const release=()=>{if(timer.current===null)return;stop();if(amountRef.current>=55&&amountRef.current<=85)next();else setHint('다시 누르고 색이 있는 구간에서 놓아 주세요.')}
 const mark=(n:number)=>{if(n!==marks)return;const done=marks+1;setMarks(done);if(done===4)next()}
 return <section className="group-task" aria-label="내가 맡은 일">
  <h3>내가 맡은 일 · {Math.min(3,stage+1)}/3</h3>
  <Preview id={id}/>
  {stage===0&&<div className="actions menu">{task.choices.filter(choice=>!choice.includes('필사본')).map(choice=><button key={choice} disabled={loading} onClick={()=>next(choice)}>{choice}</button>)}{['read','showcase'].includes(kind)&&copies.map(c=><button key={`${c.book}:${c.chapter}`} disabled={loading} onClick={async()=>{setLoading(true);try{if(isOtBook(c.book))await ensureOtBook(c.book);next(`${copyBookName(c.book)} ${c.chapter}${chapterUnit(c.book)} 필사본`)}catch{setHint('본문을 불러오지 못했어요. 다시 골라 주세요.')}finally{setLoading(false)}}}>{copyBookName(c.book)} {c.chapter}{chapterUnit(c.book)} · 내가 쓴 말씀 나누기</button>)}{hint&&<p role="status">{hint}</p>}</div>}
  {selectedCopy&&<blockquote>{copiedReadingVerses(selectedCopy,CONTENT).slice(0,2).map(v=><p key={v.verse}>{v.verse}. {v.text}</p>)}</blockquote>}
  {stage===1&&<><p>{task.work}</p>{task.mode==='hold'?<>
   <div className="group-meter" role="meter" aria-label="손일 진행" aria-valuenow={amount} aria-valuemin={0} aria-valuemax={100}><span className="group-meter-target"/><span className="group-meter-fill" style={{width:`${amount}%`}}/></div>
   <button className="primary group-hold" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press()}} onPointerUp={release} onPointerCancel={stop} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();press()}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release()}}} onBlur={stop}>누르고 있다가 놓기</button>
  </>:<div className="group-marks">{[0,1,2,3].map(n=><button key={n} className={n<marks?'done':n===marks?'next':''} disabled={n!==marks} onClick={()=>mark(n)} aria-label={`${n+1}번째 ${task.mode==='trace'?'선 잇기':'박자'}`}>{n<marks?'✓':task.mode==='trace'?n+1:'♪'}</button>)}</div>}{hint&&<p role="status">{hint}</p>}</>}
  {stage===2&&<><p>{task.finish}</p>{!members.length&&<p className="hint">이웃이 아직 자리에 오지 않았어요. 잠시 후 다시 건네주세요.</p>}<div className="actions menu">{members.map(npc=><button key={npc} onClick={()=>next(npc)}>{neighborById(npc)?.role??npc}에게</button>)}</div></>}
  {stage>=3&&<p role="status">{withSubject(neighborById(progress?.choice??'')?.role??'이웃')} 함께 살펴보고 고개를 끄덕여요.</p>}
 </section>
}
