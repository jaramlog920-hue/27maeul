import { useState } from 'react'
import { neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { featureAccess, featureHint } from '../../engine/feature-rules'
import { CLUB_MAX, pauseClub, dissolveClub, clubWorkSpots, type Club } from '../../engine/clubs'
import { clubLastHomeWork, clubMissed } from '../../engine/club-life'
import { formatTime } from '../../engine/clock'
import { useGame } from '../../store/game-store'
import { ClubForm } from './ClubForm'
import { commitClub } from './club-store'

/** 모임 상세: 플레이어가 없던 지난 회차에 실제 있었던 일, 함께 만든 방석 (모든 말은 지난 회차 기록에서만) */
function ClubNotes({club}:{club:Club}) {
 const game=useGame(s=>s.game),C=T.clubs
 const missed=clubMissed(game,club.id),left=game.clubWorks[club.id],home=clubLastHomeWork(game,club.id)
 const word=(color:string)=>(C.colorWord as Record<string,string>)[color]??color
 const work=left&&clubWorkSpots(game).some(w=>w.club===club.id)?C.workAtClub.replace('{color}',word(left.color)):home?C.workAtHome.replace('{color}',word(home.color)):null
 if(!missed&&!work)return null
 return <>{missed&&<p className="hint">{C.summary} · {C.lastTime} — {missed.items.map(i=>`${neighborById(i.npc)?.role} ${i.does}`).join(' · ')}</p>}{work&&<p className="hint">{C.madeWork} · {work}</p>}</>
}
export function ClubList() {
 const game=useGame(s=>s.game),C=T.clubs
 const [editing,setEditing]=useState<Club|null|undefined>(undefined)
 if(editing!==undefined)return <ClubForm club={editing??undefined} onClose={()=>setEditing(undefined)}/>
 const clubs=game.clubs.filter(c=>c.active)
 const access=featureAccess(game,'clubs')
 return <div className="dialog" role="dialog" aria-label={C.title}><h2>{C.title}</h2><p className="hint">{C.intro}</p>
 {access!=='full'&&<p role="status">{access==='preview'?'차 소모임 하나를 체험할 수 있어요. '+featureHint('clubs',true):featureHint('clubs')}</p>}
 {!clubs.length&&<p>{C.none}</p>}
 <ul className="event-list">{clubs.map(c=>{const next=game.plans.appts.find(a=>a.clubId===c.id&&['planned','running','moved'].includes(a.state));return <li key={c.id}><strong>{c.name}</strong><p>{T.plans.activity[c.activity]} · {T.plans.place[c.place as keyof typeof T.plans.place]}</p><p>{c.members.map(id=>neighborById(id)?.role).join(' · ')}</p><ClubNotes club={c}/><p>{c.paused?C.paused:next?`${C.next} · ${fill(T.ui.day, { day: next.day })} · ${formatTime(next.from)}`:C.day[c.weekday]}</p>{next?.reason&&<p className="hint">{next.reason==='weather'?T.plans.moved:C.errors[next.reason==='busy'?'appointment':'venue']}</p>}<div className="actions"><button onClick={()=>setEditing(c)}>{C.edit}</button><button onClick={()=>commitClub(pauseClub(game,c.id,!c.paused))}>{c.paused?C.resume:C.pause}</button><button onClick={()=>commitClub(dissolveClub(game,c.id))}>{C.dissolve}</button></div></li>})}</ul>
 <div className="actions"><button disabled={access==='locked'||clubs.length>=(access==='preview'?1:CLUB_MAX)} onClick={()=>setEditing(null)}>{C.create}</button><button data-close onClick={useGame.getState().closeModal}>{T.ui.close}</button></div></div>
}
