import { personOf } from '../../engine/people'
import { neighborById } from '../../content/catalog'
import { venueFor } from '../../engine/plans'
import { seasonOf } from '../../engine/clock'
import { useState } from 'react'
import { T } from '../../content/text'
import { joinClub, chooseClub, doClubActivity, finishClub, type ClubSession as Run } from '../../engine/clubs'
import { startMini } from '../../engine/minigame'
import { has } from '../../engine/items'
import { useGame } from '../../store/game-store'
import { commitClub } from './club-store'

export function ClubSession({id}:{id:string}) {
 const game=useGame(s=>s.game),C=T.clubs
 const [note,setNote]=useState('')
 const a=game.plans.appts.find(a=>a.id===id),run=game.clubSessions[id]
 if(!a || !a.activity || !['tea','sew','garden','observe'].includes(a.activity))return null
 const activity=a.activity as 'tea'|'sew'|'garden'|'observe'
 const join=(mode:Run['mode'])=>commitClub(joinClub(game,id,mode))
 const weave=()=>useGame.setState({modal:{kind:'mini',state:startMini('weave',useGame.getState().rng),pending:{kind:'club',id}}})
 const finish=(where:'home'|'club')=>commitClub(finishClub(game,id,where))
 return <div className="dialog" role="dialog" aria-label={a.title??T.plans.activity[activity]}><h2>{a.title??T.plans.activity[activity]}</h2>
 {!run&&<div className="actions menu column">{Object.entries(C.mode).map(([m,l])=><button key={m} onClick={()=>join(m as Run['mode'])}>{l}</button>)}</div>}
 {run?.step==='choose'&&<><div className="actions menu column">{C.choice[activity].map(choice=><button key={choice} onClick={()=>commitClub(chooseClub(game,id,choice,note))}>{choice}</button>)}</div>{activity==='observe'&&<label>{C.memo}<textarea maxLength={120} value={note} onChange={e=>setNote(e.target.value)}/></label>}</>}
 {run?.step==='activity'&&<div className="actions menu column">
 {activity==='tea'&&<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.snack}</button>}
 {activity==='sew'&&<><p className="hint">{C.wool}</p>{run.mode==='direct'&&has(game.inv,{wool:2})?<button onClick={weave}>{C.weave}</button>:<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.watch}</button>}</>}
 {activity==='observe'&&<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.look}</button>}
 {activity==='garden'&&<><button onClick={()=>commitClub(doClubActivity(game,id))}>{C.seed}</button>{(venueFor(a).place==='garden' && seasonOf(game.clock.day)!=='winter'?Object.entries(game.garden):[]).map(([plot,p],index)=><button key={plot} onClick={()=>commitClub(doClubActivity(game,id,plot))}>{C.garden} · {index+1} · {p.crop==='herb'?T.items.herb.name:T.items.bean.name}</button>)}</>}
 </div>}
 {run?.step==='finish'&&<div className="actions menu column">{activity==='sew'&&run.woven&&has(game.inv,{wool:2})?<button onClick={()=>finish('home')}>{C.home}</button>:<button onClick={()=>finish('home')}>{C.finish}</button>}</div>}
 {run?.step==='done'&&<p>{C.done}</p>}
 {(a.startedWith??[]).map(npc=>{const line=personOf(npc)?.clubLines?.[run?.step==='done'?'finish':'start'];return line?<p key={npc}>{neighborById(npc)?.role} · {line}</p>:null})}
 <div className="actions"><button onClick={useGame.getState().closeModal}>{T.ui.close}</button></div>
 </div>
}
