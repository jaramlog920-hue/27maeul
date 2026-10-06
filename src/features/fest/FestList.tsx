import { useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { formatTime } from '../../engine/clock'
import { CLUB_SLOTS, type ClubSlot } from '../../engine/clubs'
import { cancelFest, festivalRoleReady, festKinds, festWaiting, postponeFest, FEST_DAYS_AHEAD, type Fest } from '../../engine/fest'
import { useGame } from '../../store/game-store'
import { commitClub } from '../clubs/club-store'
import { FestForm } from './FestForm'

const errorText = (e: string) => (T.fest.errors as Record<string, string>)[e] ?? (T.clubs.errors as Record<string, string>)[e] ?? T.fest.errors.time

/** 다른 날로 다시 잡기: 날짜와 시간 둘만 고른다 */
function Postpone({ fest, onDone }: { fest: Fest; onDone: () => void }) {
 const game = useGame(s => s.game), F = T.fest
 const [day, setDay] = useState(game.clock.day + 1), [slot, setSlot] = useState<ClubSlot>('afternoon'), [error, setError] = useState('')
 const days = Array.from({ length: FEST_DAYS_AHEAD }, (_, i) => game.clock.day + 1 + i)
 const save = () => { const r = postponeFest(game, fest.id, day, slot, CONTENT); if (r.error) { setError(r.error); return } commitClub(r.state); onDone() }
 return <div>
  <label>{F.dayLabel}<select value={day} onChange={e => setDay(Number(e.target.value))}>{days.map(d => <option key={d} value={d}>{d}일째 · {T.clubs.day[d % 7]}</option>)}</select></label>
  <label>{F.slotLabel}<select value={slot} onChange={e => setSlot(e.target.value as ClubSlot)}>{(Object.keys(CLUB_SLOTS) as ClubSlot[]).map(id => <option key={id} value={id}>{T.clubs.slot[id]}</option>)}</select></label>
  {error && <p role="alert">{errorText(error)}</p>}
  <div className="actions"><button className="primary" onClick={save}>{F.confirm}</button><button onClick={onDone}>{F.back}</button></div>
 </div>
}

/** 작은 행사 목록: 준비 중인 것만 (지난 것·놓친 것 목록은 없다) */
export function FestList() {
 const game = useGame(s => s.game), F = T.fest, open = useGame.getState().open
 const [creating, setCreating] = useState(false), [moving, setMoving] = useState<string | null>(null)
 if (creating) return <FestForm onClose={() => setCreating(false)} />
 const kinds = festKinds(game, CONTENT)
 const list = (game.fests ?? []).filter(f => !f.closed)
 const role = festivalRoleReady(game)
 return <div className="dialog fest-form" role="dialog" aria-label={F.title}><h2>{F.title}</h2><p className="hint">{F.intro}</p>
  {!list.length && <p>{F.none}</p>}
  <ul className="event-list">{list.map(f => {
   const a = f.apptId ? game.plans.appts.find(x => x.id === f.apptId) : undefined
   const running = a?.state === 'running'
   const waiting = festWaiting(game, f)
   return <li key={f.id}>
    <strong>{F.kind[f.kind]}{f.role ? ` · ${F.roles[f.role]}` : ''}</strong>
    <p>{f.day === game.clock.day ? '오늘' : `${f.day}일째`}{a ? ` · ${formatTime(a.from)}~${formatTime(a.to)} · ${T.plans.place[f.place as keyof typeof T.plans.place] ?? ''}` : ''}</p>
    {f.members.length > 0 && f.kind !== 'festival' && <p>{f.members.map(id => neighborById(id)?.role).join(' · ')}</p>}
    <p className="hint">{waiting ? F.waiting : running ? F.running : F.planned}</p>
    {moving === f.id ? <Postpone fest={f} onDone={() => setMoving(null)} /> : <div className="actions">
     {running && <button className="primary" onClick={() => open({ kind: 'festSession', id: f.id })}>{F.join}</button>}
     {f.kind === 'festival' && role?.id === f.id && <button className="primary" onClick={() => open({ kind: 'festSession', id: f.id })}>{F.roleButton}</button>}
     {a && !running && <button onClick={() => setMoving(f.id)}>{F.postpone}</button>}
     {!running && <button onClick={() => commitClub(cancelFest(game, f.id))}>{waiting ? F.cancel : F.cancelPlanned}</button>}
    </div>}
    {f.kind === 'festival' && role?.id !== f.id && <p className="hint">{F.roleNear}</p>}
   </li>
  })}</ul>
  <div className="actions">{kinds.length > 0 && <button onClick={() => setCreating(true)}>{F.create}</button>}<button data-close onClick={useGame.getState().closeModal}>{T.ui.close}</button></div>
 </div>
}
