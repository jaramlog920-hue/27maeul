import { personOf } from '../../engine/people'
import { neighborById } from '../../content/catalog'
import { canAttendAppt, venueFor } from '../../engine/plans'
import { seasonOf } from '../../engine/clock'
import { useState } from 'react'
import { T } from '../../content/text'
import { joinClub, chooseClub, doClubActivity, finishClub, canLeaveWork, CLUB_ACTIVITIES, type ClubActivity, type ClubSession as Run } from '../../engine/clubs'
import { clubFollowUp, clubPerson } from '../../engine/club-life'
import { startMini } from '../../engine/minigame'
import { has } from '../../engine/items'
import { useGame } from '../../store/game-store'
import { commitClub } from './club-store'
import { canJoinNews, canShareClubDish, clubDishes, clubSeason, joinNews, shareClubDish } from '../../engine/club-extras'
import { fill, itemName, withObject } from '../../content/text'
import { GroupTask } from './GroupTask'

export function ClubSession({id}:{id:string}) {
 const game=useGame(s=>s.game),C=T.clubs
 const [note,setNote]=useState('')
 const a=game.plans.appts.find(a=>a.id===id),run=game.clubSessions[id]
 if(!a || !a.activity || !CLUB_ACTIVITIES.includes(a.activity as ClubActivity))return null
 if(run?.step!=='done' && !canAttendAppt(game,id)) return <div className="dialog" role="dialog" aria-label={a.title??T.plans.activity[a.activity as ClubActivity]}>
  <h2>{a.title??T.plans.activity[a.activity as ClubActivity]}</h2>
  <p className="hint">{a.state==='done'||a.state==='skipped'?C.done:T.fest.joinFar}</p>
  <div className="actions"><button data-close onClick={useGame.getState().closeModal}>{T.ui.close}</button></div>
 </div>
 const activity=a.activity as ClubActivity
 const follow=run?.step==='done'?null:clubFollowUp(game,a)
 const join=(mode:Run['mode'])=>commitClub(joinClub(game,id,mode))
 const weave=()=>useGame.setState({modal:{kind:'mini',state:startMini('weave',useGame.getState().rng),pending:{kind:'club',id}}})
 const finish=(where:'home'|'club')=>commitClub(finishClub(game,id,where))
 return <div className="dialog" role="dialog" aria-label={a.title??T.plans.activity[activity]}><h2>{a.title??T.plans.activity[activity]}</h2>
 {!run&&<div className="actions menu column">{Object.entries(C.mode).map(([m,l])=><button key={m} onClick={()=>join(m as Run['mode'])}>{l}</button>)}</div>}
 {run?.step==='choose'&&<>{activity==='sew'&&<p className="hint">{C.wool}</p>}<div className="actions menu column">{[...C.choice[activity],(C.seasonChoice as Record<string,Record<string,string>>)[activity]?.[clubSeason(game)]].filter(Boolean).map(choice=><button key={choice} onClick={()=>commitClub(chooseClub(game,id,choice,note))}>{choice}</button>)}</div>{activity==='observe'&&<label>{C.memo}<textarea maxLength={120} value={note} onChange={e=>setNote(e.target.value)}/></label>}</>}
 {run?.step==='activity'&&<div className="actions menu column">
 {run.mode==='direct'&&<GroupTask id={id} kind={activity} progress={run.task}/>}
 {(run.mode!=='direct'||(run.task?.stage??0)>=3)&&<>
 {activity==='tea'&&<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.snack}</button>}
 {activity==='tea'&&canShareClubDish(game,id)&&clubDishes(game).map(dish=><button key={dish} onClick={()=>{commitClub(shareClubDish(useGame.getState().game,id,dish));useGame.getState().say(fill(C.shared,{itemObj:withObject(itemName(dish))}),3000)}}>{fill(C.shareDish,{item:itemName(dish)})}</button>)}
 {activity==='sew'&&<>{run.mode==='direct'&&has(game.inv,{wool:2})?<button onClick={weave}>{C.weave}</button>:<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.watch}</button>}</>}
 {activity==='observe'&&<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.look}</button>}
 {(['read','cook','paint','music'] as ClubActivity[]).includes(activity)&&<button onClick={()=>commitClub(doClubActivity(game,id))}>{C.activityDo[activity as keyof typeof C.activityDo]}</button>}
 {activity==='garden'&&<><button onClick={()=>commitClub(doClubActivity(game,id))}>{C.seed}</button>{(venueFor(a).place==='garden' && seasonOf(game.clock.day)!=='winter'?Object.entries(game.garden):[]).map(([plot,p],index)=><button key={plot} onClick={()=>commitClub(doClubActivity(game,id,plot))}>{C.garden} · {index+1} · {p.crop==='herb'?T.items.herb.name:T.items.bean.name}</button>)}</>}
 </>}
 </div>}
 {run?.step==='finish'&&<div className="actions menu column">{activity==='sew'&&run.woven&&has(game.inv,{wool:2})?<><button onClick={()=>finish('home')}>{C.home}</button>{canLeaveWork(game,a.clubId??'',venueFor(a).place)&&<button onClick={()=>finish('club')}>{C.leave}</button>}</>:<button onClick={()=>finish('home')}>{C.finish}</button>}</div>}
 {run?.step==='done'&&<p>{C.done}</p>}
 {follow&&<p className="club-follow">{neighborById(follow.npc)?.role} · {follow.text}</p>}
 {follow&&run&&canJoinNews(game,id,follow.npc)&&<div className="actions menu"><button onClick={()=>{commitClub(joinNews(useGame.getState().game,id,follow.npc));useGame.getState().say(fill(C.joined,{who:neighborById(follow.npc)?.role??''}),3000)}}>{C.joinNews}</button></div>}
 {(a.startedWith??[]).map(npc=>{const p=clubPerson(npc,activity),line=p?(run?.step==='done'?p.finish:p.start):personOf(npc)?.clubLines?.[run?.step==='done'?'finish':'start'];return line?<p key={npc} className="club-person">{neighborById(npc)?.role} · {p&&<span className="hint">{p.does} · </span>}{line}</p>:null})}
 <div className="actions">{run&&run.step!=='done'&&<button onClick={useGame.getState().closeModal}>함께하는 모습 보기</button>}<button data-close onClick={useGame.getState().closeModal}>{T.ui.close}</button></div>
 </div>
}
