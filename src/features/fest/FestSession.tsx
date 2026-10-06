import { neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { doFestivalRole, festChoices, festFinish, festivalRoleReady, festReactions, festStep, joinFest } from '../../engine/fest'
import { useGame } from '../../store/game-store'
import { commitClub } from '../clubs/club-store'

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
  return <div className="dialog" role="dialog" aria-label={title}><h2>{title}{f.role ? ` · ${F.roles[f.role]}` : ''}</h2>
   {done ? <p>{F.done}</p> : <><p>{f.role ? F.roleDo[f.role] : ''}</p>{!ready && <p className="hint">{F.roleNear}</p>}</>}
   <div className="actions">{!done && <button className="primary" disabled={!ready} onClick={() => commitClub(doFestivalRole(game, id))}>{F.roleButton}</button>}<button data-close onClick={close}>{T.ui.close}</button></div>
  </div>
 }
 const a = game.plans.appts.find(x => x.id === f.apptId)
 const label = (c: string) => c === 'basic' ? (f.kind === 'housewarming' ? F.pick.home : F.pick.basic) : c === 'show' || c === 'story' ? F.pick[c] : itemName(c)
 const who = a?.startedWith ?? f.members
 return <div className="dialog" role="dialog" aria-label={title}><h2>{title} · {F.stepTitle[done ? 'done' : f.step]}</h2>
  {!done && !f.joined && <><button className="primary" onClick={() => {
   const next = joinFest(game, id)
   if (next !== game) commitClub(next)
   else useGame.getState().say(F.joinFar)
  }}>{F.join}</button><p className="hint">{F.joinFar}</p></>}
  {!done && f.joined && <>
   {f.step === 'tidy' && <p>{fill(F.tidy, { deco: f.deco ? itemName(f.deco) : F.basicDeco })}</p>}
   {f.step === 'arrive' && <><p>{F.arrive}</p><p>{who.map(n => neighborById(n)?.role).join(' · ')}</p></>}
   {f.step === 'activity' && <><p>{F.activity[f.kind]}</p><div className="actions menu column">{festChoices(game, f).map(c => <button key={c} onClick={() => commitClub(festStep(game, id, c))}>{label(c)}</button>)}</div></>}
   {f.step === 'talk' && <ul className="event-list">{festReactions(game, f).map(r => <li key={r.npc}>{neighborById(r.npc)?.role} · {r.text}</li>)}</ul>}
   {f.step === 'finish' && <p>{F.finishText}</p>}
   <div className="actions">
    {['tidy', 'arrive', 'talk'].includes(f.step) && <button className="primary" onClick={() => commitClub(festStep(game, id))}>{F.next}</button>}
    {f.step === 'finish' && <button className="primary" onClick={() => commitClub(festFinish(game, id))}>{F.finishButton}</button>}
   </div>
  </>}
  {done && <p>{F.done}</p>}
  <div className="actions"><button data-close onClick={close}>{T.ui.close}</button></div>
 </div>
}
