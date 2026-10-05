import { useState } from 'react'
import { neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { CLUB_MAX, pauseClub, dissolveClub, type Club } from '../../engine/clubs'
import { formatTime } from '../../engine/clock'
import { useGame } from '../../store/game-store'
import { ClubForm } from './ClubForm'
import { commitClub } from './club-store'

export function ClubList() {
 const game=useGame(s=>s.game),C=T.clubs
 const [editing,setEditing]=useState<Club|null|undefined>(undefined)
 if(editing!==undefined)return <ClubForm club={editing??undefined} onClose={()=>setEditing(undefined)}/>
 const clubs=game.clubs.filter(c=>c.active)
 return <div className="dialog" role="dialog" aria-label={C.title}><h2>{C.title}</h2><p className="hint">{C.intro}</p>
 {!clubs.length&&<p>{C.none}</p>}
 <ul className="event-list">{clubs.map(c=>{const next=game.plans.appts.find(a=>a.clubId===c.id&&['planned','running','moved'].includes(a.state));return <li key={c.id}><strong>{c.name}</strong><p>{T.plans.activity[c.activity]} · {T.plans.place[c.place as keyof typeof T.plans.place]}</p><p>{c.members.map(id=>neighborById(id)?.role).join(' · ')}</p><p>{c.paused?C.paused:next?`${C.next} · ${next.day}${T.ui.day??''} · ${formatTime(next.from)}`:C.day[c.weekday]}</p>{next?.reason&&<p className="hint">{next.reason==='weather'?T.plans.moved:C.errors[next.reason==='busy'?'appointment':'venue']}</p>}<div className="actions"><button onClick={()=>setEditing(c)}>{C.edit}</button><button onClick={()=>commitClub(pauseClub(game,c.id,!c.paused))}>{c.paused?C.resume:C.pause}</button><button onClick={()=>commitClub(dissolveClub(game,c.id))}>{C.dissolve}</button></div></li>})}</ul>
 <div className="actions"><button disabled={clubs.length>=CLUB_MAX} onClick={()=>setEditing(null)}>{C.create}</button><button onClick={useGame.getState().closeModal}>{T.ui.close}</button></div></div>
}
