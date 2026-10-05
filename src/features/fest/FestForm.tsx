import { Fragment, useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { clubCandidates, CLUB_SLOTS, type ClubSlot } from '../../engine/clubs'
import { createFest, festCapacity, festivalDays, festKinds, festVenues, festWorks, FEST_DAYS_AHEAD, FEST_DECOR, FEST_HELP, FEST_SNACKS, type FestKind, type FestRole } from '../../engine/fest'
import { isBirthday } from '../../engine/notebook'
import { availability, inviteReaction } from '../../engine/plans'
import type { ItemId, PlaceId } from '../../engine/types'
import { OUTDOOR_PLACES, tastePlaceOf } from '../../engine/village-sites'
import { useGame } from '../../store/game-store'
import { commitClub } from '../clubs/club-store'

type Step = 'kind'|'work'|'place'|'time'|'members'|'role'|'prepare'|'summary'
const STEPS: Record<FestKind, Step[]> = {
 tea: ['kind','place','time','members','prepare','summary'],
 housewarming: ['kind','time','members','prepare','summary'],
 showcase: ['kind','work','place','time','members','prepare','summary'],
 festival: ['kind','role','prepare','summary'],
}
const errorText = (e: string) => (T.fest.errors as Record<string, string>)[e] ?? (T.clubs.errors as Record<string, string>)[e] ?? T.fest.errors.time
const dayLabel = (d: number, today: number) => `${d === today ? '오늘' : `${d}일째`} · ${T.clubs.day[d % 7]}`
const itemName = (id: string) => (T.items as Record<string, { name: string }>)[id]?.name ?? id

/** 행사 준비: 휴대폰에서 한 화면에 한 가지씩 고른다 (종류 → 장소·날짜 → 이웃 → 준비 → 한눈에 보기) */
export function FestForm({ onClose }: { onClose: () => void }) {
 const game = useGame(s => s.game), F = T.fest, P = T.plans
 const kinds = festKinds(game, CONTENT)
 const [kind, setKind] = useState<FestKind>(kinds[0] ?? 'tea')
 const [at, setAt] = useState(0), [error, setError] = useState('')
 const [place, setPlace] = useState<PlaceId>('hallTable'), [alt, setAlt] = useState<PlaceId>('hallTable')
 const [day, setDay] = useState(game.clock.day + 1), [slot, setSlot] = useState<ClubSlot>('afternoon')
 const [members, setMembers] = useState<string[]>([]), [help, setHelp] = useState<string[]>([])
 const [snack, setSnack] = useState<ItemId | ''>(''), [deco, setDeco] = useState<ItemId | ''>('')
 const [role, setRole] = useState<FestRole>('food'), [work, setWork] = useState('')
 const fdays = festivalDays(game)
 const [fday, setFday] = useState(fdays[0] ?? game.clock.day)
 const steps = STEPS[kind], step = steps[at]
 const [from, to] = CLUB_SLOTS[slot]
 const venues = festVenues(game, kind)
 const where: PlaceId = kind === 'housewarming' ? 'hearth' : venues.includes(place) ? place : venues[0]
 const cap = festCapacity(game, kind)
 const works = festWorks(game)
 const activity = kind === 'showcase' ? 'make' : 'tea'
 const time = slot === 'morning' ? 'early' : slot === 'afternoon' ? 'afternoon' : 'evening'
 const days = Array.from({ length: FEST_DAYS_AHEAD + 1 }, (_, i) => game.clock.day + i).filter(d => d > game.clock.day || CLUB_SLOTS.evening[0] > game.clock.minute)
 const past = day === game.clock.day && from <= game.clock.minute
 const busy = (id: string) => availability(game, id, day, from, to, CONTENT)
 const snacks = FEST_SNACKS.filter(i => (game.inv[i] ?? 0) > 0), decos = FEST_DECOR.filter(i => (game.inv[i] ?? 0) > 0)
 const valid = step === 'kind' ? kinds.includes(kind)
  : step === 'work' ? works.some(w => w.id === work)
  : step === 'place' ? venues.includes(where)
  : step === 'time' ? !past
  : step === 'members' ? members.length > 0 && members.length <= cap && members.every(id => busy(id) === 'ok')
  : step === 'role' ? fdays.includes(fday)
  : true
 const save = () => {
  const r = kind === 'festival'
   ? createFest(game, { kind, day: fday, role, members: [], ...(role === 'food' && snack ? { snack } : {}), ...(role === 'deco' && deco ? { deco } : {}) }, CONTENT)
   : createFest(game, { kind, day, slot, place: where, ...(OUTDOOR_PLACES.includes(where) ? { alt } : {}), members, help: help.filter(h => members.includes(h)), ...(snack ? { snack } : {}), ...(deco ? { deco } : {}), ...(kind === 'showcase' ? { work } : {}) }, CONTENT)
  if (r.error) { setError(r.error); return }
  commitClub(r.state)
  onClose()
 }
 const birthday = kind !== 'festival' ? members.find(m => isBirthday(m, day)) : undefined
 const workLabel = (id: string) => {
  const w = works.find(x => x.id === id)
  if (!w) return ''
  const label = w.kind === 'clubWork' ? F.works.clubWork : (T.taste.kinds as Record<string, string>)[w.kind] ?? T.taste.kinds.make
  return [label, ...w.with.map(n => neighborById(n)?.role)].filter(Boolean).join(' · ')
 }
 return <div className="dialog fest-form" role="dialog" aria-label={F.create}>
  <h2>{F.create} · {F.steps[step]}</h2>
  {step === 'kind' && <div className="actions menu column">{kinds.map(k => <button key={k} className={kind === k ? 'primary' : ''} onClick={() => { setKind(k); setMembers([]); setHelp([]) }}>{F.kind[k]}</button>)}<p className="hint">{F.kindHint[kind]}</p></div>}
  {step === 'work' && <div className="actions menu column">{works.map(w => <button key={w.id} className={work === w.id ? 'primary' : ''} onClick={() => { setWork(w.id); setMembers(w.with.filter(n => clubCandidates(game, CONTENT).includes(n)).slice(0, 3)) }}>{workLabel(w.id)}</button>)}</div>}
  {step === 'place' && <><div className="actions menu column">{venues.map(p => <button key={p} className={where === p ? 'primary' : ''} onClick={() => setPlace(p)}>{P.place[p as keyof typeof P.place]}</button>)}</div>{OUTDOOR_PLACES.includes(where) && <label>{F.alt}<select value={alt} onChange={e => setAlt(e.target.value as PlaceId)}>{(['hallTable', 'teaTable'] as const).map(p => <option key={p} value={p}>{P.place[p]}</option>)}</select></label>}</>}
  {step === 'time' && <><label>{F.dayLabel}<select value={day} onChange={e => setDay(Number(e.target.value))}>{days.map(d => <option key={d} value={d}>{dayLabel(d, game.clock.day)}</option>)}</select></label><label>{F.slotLabel}<select value={slot} onChange={e => setSlot(e.target.value as ClubSlot)}>{Object.entries(T.clubs.slot).map(([id, label]) => <option key={id} value={id} disabled={day === game.clock.day && CLUB_SLOTS[id as ClubSlot][0] <= game.clock.minute}>{label}</option>)}</select></label>{past && <p className="hint">{T.clubs.errors.past}</p>}</>}
  {step === 'members' && <><p className="hint">{T.clubs.members} · {members.length}/{cap}{cap < 3 ? ` · ${fill(F.capacity, { n: cap })}` : ''}</p><div className="actions menu column">{clubCandidates(game, CONTENT).map(id => {
   const b = busy(id), checked = members.includes(id)
   const reaction = inviteReaction(id, activity, tastePlaceOf(where), time)
   return <Fragment key={id}>
    <label className="check-row"><input type="checkbox" checked={checked} disabled={!checked && (members.length >= cap || b !== 'ok')} onChange={() => setMembers(checked ? members.filter(m => m !== id) : [...members, id])} />{neighborById(id)?.role} · {b === 'ok' ? T.clubs[reaction] : `${errorText(b.busy)}${b.suggest ? ` · ${dayLabel(b.suggest.day, game.clock.day)}` : ''}`}</label>
    {checked && FEST_HELP[id] && <label className="check-row sub hint"><input type="checkbox" checked={help.includes(id)} onChange={() => setHelp(help.includes(id) ? help.filter(h => h !== id) : [...help, id])} />{fill(F.askHelp, { who: neighborById(id)?.role ?? '' })} · {F.helpKind[FEST_HELP[id]]}</label>}
   </Fragment>
  })}</div>{help.length > 0 && <p className="hint">{F.helpHint}</p>}</>}
  {step === 'role' && <>{fdays.length > 1 && <label>{F.dayLabel}<select value={fday} onChange={e => setFday(Number(e.target.value))}>{fdays.map(d => <option key={d} value={d}>{dayLabel(d, game.clock.day)}</option>)}</select></label>}<p className="hint">{fill(F.festivalDay, { day: dayLabel(fday, game.clock.day) })}</p><div className="actions menu column">{(['food', 'deco', 'tidy'] as const).map(r => <button key={r} className={role === r ? 'primary' : ''} onClick={() => setRole(r)}>{F.roles[r]}</button>)}</div></>}
  {step === 'prepare' && <>
   {(kind !== 'festival' || role === 'food') && <label>{F.snack}<select value={snack} onChange={e => setSnack(e.target.value as ItemId | '')}><option value="">{F.basicSnack}</option>{snacks.map(i => <option key={i} value={i}>{itemName(i)} · {game.inv[i]}</option>)}</select></label>}
   {(kind !== 'festival' || role === 'deco') && <label>{F.deco}<select value={deco} onChange={e => setDeco(e.target.value as ItemId | '')}><option value="">{F.basicDeco}</option>{decos.map(i => <option key={i} value={i}>{itemName(i)}</option>)}</select></label>}
   {kind === 'festival' && role === 'tidy' && <p>{F.roleDo.tidy}</p>}
   <p className="hint">{F.reserveHint}</p>{!snacks.length && !decos.length && <p className="hint">{F.noStock}</p>}
  </>}
  {step === 'summary' && <>
   <p><strong>{F.kind[kind]}</strong>{kind === 'festival' ? ` · ${F.roles[role]}` : ` · ${P.place[where as keyof typeof P.place]}`}</p>
   <p>{kind === 'festival' ? fill(F.festivalDay, { day: dayLabel(fday, game.clock.day) }) : `${dayLabel(day, game.clock.day)} · ${T.clubs.slot[slot]}`}</p>
   {kind === 'showcase' && <p>{workLabel(work)}</p>}
   {members.length > 0 && kind !== 'festival' && <p>{members.map(id => neighborById(id)?.role).join(' · ')}</p>}
   {OUTDOOR_PLACES.includes(where) && kind !== 'festival' && <p>{F.alt} · {P.place[alt as keyof typeof P.place]}</p>}
   <p>{snack ? itemName(snack) : F.basicSnack} · {deco ? itemName(deco) : F.basicDeco}</p>
   {help.filter(h => members.includes(h)).map(h => <p key={h} className="hint">{F.helpLabel} · {neighborById(h)?.role} · {F.helpKind[FEST_HELP[h]]}</p>)}
   {birthday && <p className="hint">{fill(F.birthday, { who: neighborById(birthday)?.role ?? '' })}</p>}
  </>}
  {error && <p role="alert">{errorText(error)}</p>}
  <div className="actions">{at > 0 && <button onClick={() => { setError(''); setAt(at - 1) }}>{F.back}</button>}{at < steps.length - 1 ? <button disabled={!valid} onClick={() => { setError(''); setAt(at + 1) }}>{F.nextButton}</button> : <button className="primary" onClick={save}>{F.save}</button>}<button onClick={onClose}>{T.ui.close}</button></div>
 </div>
}
