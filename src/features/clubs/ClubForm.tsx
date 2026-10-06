import { useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { clubCandidates, clubVenues, createClub, CLUB_SLOTS, nextClubDay, type Club, type ClubActivity, type ClubInput, type ClubSlot } from '../../engine/clubs'
import { availability, inviteReaction } from '../../engine/plans'
import type { PlaceId } from '../../engine/types'
import { OUTDOOR_PLACES, tastePlaceOf } from '../../engine/village-sites'
import { useGame } from '../../store/game-store'
import { commitClub } from './club-store'

export function ClubForm({club,onClose}:{club?:Club;onClose:()=>void}) {
 const game=useGame(s=>s.game),C=T.clubs,P=T.plans
 const [step,setStep]=useState(0),[error,setError]=useState('')
 const [activity,setActivity]=useState<ClubActivity>(club?.activity??'tea'),[place,setPlace]=useState<PlaceId>(club?.place??'hallTable'),[alt,setAlt]=useState<PlaceId>(club?.alt??'hallTable')
 const [members,setMembers]=useState<string[]>(club?.members??[]),[weekday,setWeekday]=useState(club?.weekday??((game.clock.day+1)%7)),[slot,setSlot]=useState<ClubSlot>(club?.slot??'afternoon'),[name,setName]=useState(club?.name??'')
 const [from,to]=CLUB_SLOTS[slot]
 let day=nextClubDay(game.clock.day,weekday)
 if(day===game.clock.day && from<=game.clock.minute) day+=7
 const input:ClubInput={name:name||C.defaultName[activity],activity,place,alt:OUTDOOR_PLACES.includes(place)?alt:undefined,members,weekday,slot}
 const save=()=>{const r=createClub(game,input,CONTENT,club?.id);if(r.error){setError(r.error);return}commitClub(r.state);onClose()}
 const valid=step===0||step===1||step===4||step===2 && members.length>0||step===3 && members.every(id=>availability(game,id,day,from,to,CONTENT)==='ok')
 return <div className="dialog fest-form" role="dialog" aria-label={C.create}><h2>{C.create} · {C.steps[step]}</h2>
  {step===0 && <div className="actions menu column">{(['tea','sew','observe',...(Object.keys(game.garden).length?['garden']:[])] as ClubActivity[]).map(a=><button key={a} className={activity===a?'primary':''} onClick={()=>{setActivity(a);setName('')}}>{P.activity[a]}</button>)}</div>}
  {step===1 && <><div className="actions menu column">{clubVenues(game,activity).map(p=><button key={p} className={place===p?'primary':''} onClick={()=>setPlace(p)}>{P.place[p as keyof typeof P.place]}</button>)}</div>{OUTDOOR_PLACES.includes(place)&&<label>{C.alt}<select value={alt} onChange={e=>setAlt(e.target.value as PlaceId)}>{(['hallTable','teaTable'] as const).map(p=><option key={p} value={p}>{P.place[p]}</option>)}</select></label>}</>}
  {step===2 && <><p className="hint">{C.members} · {members.length}/3</p><div className="actions menu column">{clubCandidates(game,CONTENT).map(id=>{const busy=availability(game,id,day,from,to,CONTENT),checked=members.includes(id),reaction=inviteReaction(id,activity,tastePlaceOf(place),slot==='morning'?'early':slot==='afternoon'?'afternoon':'evening');return <label key={id} className="check-row"><input type="checkbox" checked={checked} disabled={!checked&&(members.length>=3||(busy!=='ok'&&!busy.suggest))} onChange={()=>setMembers(checked?members.filter(m=>m!==id):[...members,id])}/>{neighborById(id)?.role} · {busy==='ok'?C[reaction]:C.errors[busy.busy as keyof typeof C.errors]??C.errors.time}</label>})}</div></>}
  {step===3 && <><label>{C.weekday}<select value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>{C.day.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label><label>{C.steps[3]}<select value={slot} onChange={e=>setSlot(e.target.value as ClubSlot)}>{Object.entries(C.slot).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>{members.map(id=>{const busy=availability(game,id,day,from,to,CONTENT);return busy==='ok'?null:<p key={id} className="hint">{neighborById(id)?.role} · {C.errors[busy.busy as keyof typeof C.errors]??C.errors.time}</p>})}</>}
  {step===4 && <><label>{C.name}<input maxLength={12} value={name} placeholder={C.defaultName[activity]} onChange={e=>setName(e.target.value)}/></label><p>{P.activity[activity]} · {P.place[place as keyof typeof P.place]} · {C.day[weekday]} · {C.slot[slot]}</p><p>{members.map(id=>neighborById(id)?.role).join(' · ')}</p>{input.alt&&<p>{C.alt} · {P.place[input.alt as keyof typeof P.place]}</p>}</>}
  {error&&<p role="alert">{C.errors[error as keyof typeof C.errors]??C.errors.time}</p>}
  <div className="actions">{step>0&&<button onClick={()=>setStep(step-1)}>{C.back}</button>}{step<4?<button disabled={!valid} onClick={()=>{setError('');setStep(step+1)}}>{C.nextButton}</button>:<button className="primary" onClick={save}>{C.save}</button>}<button onClick={onClose}>{T.ui.close}</button></div>
 </div>
}
