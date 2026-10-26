import { neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { doFestivalRole, festChoices, festFinish, festivalRoleReady, festReactions, festStep, joinFest } from '../../engine/fest'
import { useGame } from '../../store/game-store'
import { attendWhy, canAttendAppt, type AttendWhy } from '../../engine/plans'
import { BlockedButton } from '../../shared/BlockedButton'
import { t } from '../../shared/i18n'
import { commitClub } from '../clubs/club-store'
import { ClubRound } from '../clubs/ClubRound'
import { apptGuests, fireGuests, roundGuests, roundMarks } from '../../engine/club-round'

const itemName = (id: string) => (T.items as Record<string, { name: string }>)[id]?.name ?? id

/** 행사 당일: 정돈 → 도착 → 함께하기 → 이야기 → 마무리. 점수·평가 없음 */
export function FestSession({ id }: { id: string }) {
 const game = useGame(s => s.game), F = T.fest
 const f = (game.fests ?? []).find(x => x.id === id)
 const close = useGame.getState().closeModal
 if (!f) return null
 const title = F.kind[f.kind]
 const done = f.step === 'done' || f.closed
 if (f.kind === 'festival') {
  const ready = festivalRoleReady(game)?.id === id
  // 한 판의 차례 이웃은 시작할 때 정한 그대로. 모닥불 곁에 아무도 없으면 한 판 없이 바로 맡은 일을 마칠 수 있다 (엔진도 허용 — 2026-10-18 감사 M-13)
  const guests = roundGuests(game, id, fireGuests(game))
  const roundOver = (f.task?.stage ?? 0) >= 3 || roundMarks(game, id).length >= guests.length
  return <div className="dialog" role="dialog" aria-label={title}><h2>{title}{f.role ? ` · ${F.roles[f.role]}` : ''}</h2>
   {done ? <p>{F.done}</p> : <><p>{f.role ? F.roleDo[f.role] : ''}</p>{!ready && <p className="hint">{F.roleNear}</p>}</>}
   {!done&&ready&&guests.length>0&&<ClubRound id={id} kind={f.role==='deco'?'festivalDeco':f.role==='tidy'?'festivalTidy':'festivalFood'} guests={guests}/>}
   <div className="actions">{!done && <BlockedButton className="primary" why={!ready ? t('why.festNear') : !roundOver ? t('why.roundFirst') : null} onClick={() => commitClub(doFestivalRole(game, id))}>{F.roleButton}</BlockedButton>}<button data-close onClick={close}>{T.ui.close}</button></div>
  </div>
 }
 const a = game.plans.appts.find(x => x.id === f.apptId)
 const nearby = !!a && canAttendAppt(game,a.id)
 const why = (F.joinWhy as Record<AttendWhy, string>)[a ? attendWhy(game, a.id) ?? 'far' : 'time']
 const label = (c: string) => c === 'basic' ? (f.kind === 'housewarming' ? F.pick.home : F.pick.basic) : c === 'show' || c === 'story' ? F.pick[c] : itemName(c)
 const who = a?.startedWith ?? f.members
 return <div className="dialog" role="dialog" aria-label={title}><h2>{title} · {F.stepTitle[done ? 'done' : f.step]}</h2>
  {!done && !f.joined && <><button className="primary" onClick={() => {
   const next = joinFest(game, id)
   if (next !== game) commitClub(next)
   else useGame.getState().say(why, 2800)
  }}>{F.join}</button>{!nearby && <p className="hint">{why}</p>}</>}
  {!done && f.joined && !nearby && <p className="hint">{why}</p>}
  {!done && f.joined && nearby && <>
   {f.step === 'tidy' && <p>{fill(F.tidy, { deco: f.deco ? itemName(f.deco) : F.basicDeco })}</p>}
   {f.step === 'arrive' && <><p>{F.arrive}</p><p>{who.map(n => neighborById(n)?.role).join(' · ')}</p></>}
   {f.step === 'activity' && <><p>{F.activity[f.kind]}</p><ClubRound id={a!.id} kind={f.kind} guests={apptGuests(game,a!.id)}/>{(f.task?.stage??0)>=3&&<div className="actions menu column">{festChoices(game, f).map(c => <button key={c} onClick={() => commitClub(festStep(game, id, c))}>{label(c)}</button>)}</div>}</>}
   {f.step === 'talk' && <ul className="event-list">{festReactions(game, f).map(r => <li key={r.npc}>{neighborById(r.npc)?.role} · {r.text}</li>)}</ul>}
   {f.step === 'finish' && <p>{F.finishText}</p>}
   <div className="actions">
    {['tidy', 'arrive', 'talk'].includes(f.step) && <button className="primary" onClick={() => commitClub(festStep(game, id))}>{F.next}</button>}
    {f.step === 'finish' && <button className="primary" onClick={() => commitClub(festFinish(game, id))}>{F.finishButton}</button>}
   </div>
  </>}
  {done && <p>{F.done}</p>}
  <div className="actions">{!done&&f.joined&&<button onClick={close}>함께하는 모습 보기</button>}<button data-close onClick={close}>{T.ui.close}</button></div>
 </div>
}
