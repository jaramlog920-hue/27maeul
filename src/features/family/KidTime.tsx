// 아이와 함께 보내는 시간 (계획 12, 2026-10-04 사용자): 누르기 → 짧은 장면 → 결과. 미니게임 없음.
// 배움터는 빠르고 편한 능력치, 직접 함께하기는 조금 느리지만 가까움과 추억. 하루에 두 번까지 (잠들기 전 이야기는 따로)
import { neighborById } from '../../content/catalog'
import { fill, itemList, kidFill, T, withAnd, withSubject } from '../../content/text'
import { canSpouseAct } from '../../engine/family-memory'
import { canKidAct, closeHearts, KID_ACTS, KID_ACTS_PER_DAY, kidActsToday, type KidAct } from '../../engine/family'
import type { StatId } from '../../engine/stats'
import { useGame, type KidDone, type SpouseDone } from '../../store/game-store'

const K = T.family.time
const ACTS = K.acts as Record<KidAct, { label: string; grows: string; lines: string[]; burnt?: string; alone?: string }>
const BLOCKS = K.blocks as Record<string, string>
const STAT_NAME = T.stats.names as Record<StatId, string>
const W = T.family.withSpouse as unknown as {
  title: string
  hint: string
  blocks: Record<string, string>
  pick: string
  closer: string
  album: string
  close: string
  spouses: Record<string, { label: string; choices: string[]; picks: string[] }>
}

/** 짧은 장면 한 줄과 결과 줄들 */
export function kidDoneLines(done: KidDone, kid: string): { scene: string; results: string[] } {
  const a = ACTS[done.act]
  const role = done.who ? (neighborById(done.who)?.role ?? '') : ''
  const raw = done.burnt && a.burnt ? a.burnt : !role && a.alone ? a.alone : a.lines[done.variant % a.lines.length]
  // 아이 이름을 먼저 넣고(조사까지), 그다음 이웃 이름
  const scene = fill(kidFill(raw, kid), { whoSubj: role ? withSubject(role) : '', who: role })
  const results: string[] = []
  const stats = Object.keys(done.gains) as StatId[]
  if (stats.length) results.push(fill(kidFill(K.grow, kid), { stat: withSubject(stats.map((id) => STAT_NAME[id]).join('·')) }))
  if (done.act === 'make' && Object.keys(done.got).length) results.push(fill(K.made, { items: itemList(done.got) }))
  if (done.act === 'cook') results.push(done.burnt ? K.burnt : fill(K.baked, { items: itemList(done.got) }))
  if (done.act === 'walk' && Object.keys(done.got).length) results.push(fill(K.found, { items: itemList(done.got) }))
  if (done.act === 'errand' && role) results.push(fill(K.neighbor, { whoAnd: withAnd(role) }))
  if (done.act === 'story') results.push(K.rested)
  results.push(kidFill(K.closer, kid))
  if (done.album) results.push(K.album)
  return { scene, results }
}

export function KidTime({ done, spouse }: { done?: KidDone; spouse?: SpouseDone }) {
  const game = useGame((s) => s.game)
  const { kidAct, spouseKidAct, open, closeModal } = useGame.getState()
  const kid = game.child
  if (!kid) return null
  const name = kid.name
  if (spouse) {
    const def = W.spouses[spouse.partner]
    return (
      <div className="dialog kid-time" role="dialog" aria-label={W.title}>
        <h2>{def?.label ?? W.title}</h2>
        <p className="scene-line narration">{def ? kidFill(def.picks[spouse.choice], name) : ''}</p>
        <ul className="kid-results">
          <li>{kidFill(W.closer, name)}</li>
          {spouse.album && <li>{W.album}</li>}
        </ul>
        <div className="actions">
          <button className="primary" onClick={closeModal}>
            {T.ui.close}
          </button>
        </div>
      </div>
    )
  }
  if (done) {
    const { scene, results } = kidDoneLines(done, name)
    return (
      <div className="dialog kid-time" role="dialog" aria-label={K.title}>
        <h2>{ACTS[done.act].label}</h2>
        <p className="scene-line narration">{scene}</p>
        <ul className="kid-results">
          {results.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="actions">
          <button onClick={() => open({ kind: 'kidTime' })}>{K.again}</button>
          <button className="primary" onClick={closeModal}>
            {T.ui.close}
          </button>
        </div>
      </div>
    )
  }
  const hearts = closeHearts(kid)
  const partner = game.romance?.stage === 'married' ? game.romance.partner : null
  const spouseDef = partner ? W.spouses[partner] : undefined
  const spouseBlock = canSpouseAct(game)
  return (
    <div className="dialog kid-time" role="dialog" aria-label={K.title}>
      <h2>{K.title}</h2>
      <p className="hint">
        {K.hint} · {fill(K.today, { n: kidActsToday(game), max: KID_ACTS_PER_DAY })}
      </p>
      <p className="kid-close">
        {K.close} {'♥'.repeat(hearts)}
        {'♡'.repeat(5 - hearts)}
      </p>
      <ul className="kid-acts">
        {KID_ACTS.map((act) => {
          const block = canKidAct(game, act)
          const a = ACTS[act]
          return (
            <li key={act}>
              <button disabled={block !== null} onClick={() => kidAct(act)}>
                <span className="kid-act-name">{a.label}</span>
                {a.grows && <span className="kid-act-grows">{a.grows}</span>}
              </button>
              {block && block !== 'done' && <span className="kid-act-why">{BLOCKS[block]}</span>}
            </li>
          )
        })}
      </ul>
      {KID_ACTS.some((a) => canKidAct(game, a) === 'done') && <p className="hint">{BLOCKS.done}</p>}
      {spouseDef && (
        <section className="kid-spouse">
          <h3>{spouseDef.label}</h3>
          <p className="hint">{kidFill(W.hint, name)}</p>
          <ul className="kid-acts">
            {spouseDef.choices.map((c, i) => (
              <li key={c}>
                <button disabled={spouseBlock !== null} onClick={() => spouseKidAct(i)}>
                  <span className="kid-act-name">{c}</span>
                </button>
              </li>
            ))}
          </ul>
          {spouseBlock && <p className="hint">{W.blocks[spouseBlock]}</p>}
        </section>
      )}
      <p className="hint">{kidFill(K.trip, name)}</p>
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
