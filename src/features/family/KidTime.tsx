import { featureHint } from '../../engine/feature-rules'
import { kidPersona, likedActs } from '../../engine/persona'
// 아이와 함께 보내는 시간 (계획 12, 2026-10-04 사용자): 누르기 → 짧은 장면 → 결과. 미니게임 없음.
// 배움터는 빠르고 편한 능력치, 직접 함께하기는 조금 느리지만 가까움과 추억. 하루에 두 번까지 (잠들기 전 이야기는 따로)
import { neighborById } from '../../content/catalog'
import { fill, itemList, kidFill, T, withAnd, withSubject } from '../../content/text'
import { canSpouseAct } from '../../engine/family-memory'
import { canKidAct, closeHearts, KID_ACTS, KID_ACTS_PER_DAY, kidActsToday, type KidAct } from '../../engine/family'
import type { StatId } from '../../engine/stats'
import { useGame, type KidDone, type SpouseDone } from '../../store/game-store'
import { BlockedButton } from '../../shared/BlockedButton'

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

/** 가방 정리는 사용자가 물건을 골라서 한다. 활동은 공간 확보 뒤 한 번만 실행한다. */
export function KidCapacity() {
  const retry=useGame(s=>s.modal?.kind==='kidCapacity'?s.modal.retry:undefined)
  if(!retry)return null
  const {open,closeModal,retryKidAct}=useGame.getState()
  return <div className="dialog" role="dialog" aria-label="가방 공간이 부족해요">
    <h2>가방 공간이 부족해요</h2>
    <p>물건을 받을 공간이 부족해요. 가방을 비우시겠습니까?</p>
    <p className="hint">활동은 아직 시작하지 않았어요. 시간과 오늘 활동 횟수는 그대로예요.</p>
    <div className="actions column">
      <button className="primary" onClick={()=>open({kind:'bag',tab:'items',resumeKid:retry})}>가방 비우기</button>
      <button onClick={retryKidAct}>공간 확인하고 다시 받기</button>
      <button data-close onClick={closeModal}>나중에</button>
    </div>
  </div>
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
          <button data-close className="primary" onClick={closeModal}>
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
          <button data-close className="primary" onClick={closeModal}>
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
  const blocks = KID_ACTS.map((act) => canKidAct(game, act))
  const sameBlock = blocks.every((b) => b !== null && b === blocks[0]) ? blocks[0] : null
  return (
    <div className="dialog kid-time" role="dialog" aria-label={K.title}>
      <h2>{K.title}</h2>
      <p className="hint">
        {fill(K.today, { n: kidActsToday(game), max: KID_ACTS_PER_DAY })}
      </p>
      <p className="kid-close">
        {K.close} {'♥'.repeat(hearts)}
        {'♡'.repeat(5 - hearts)}
      </p>
      {/* 잠겼으면 안내는 한 번만 (활동마다 아홉 번 나왔다 — 2026-10-21 점검) */}
      {canKidAct(game, KID_ACTS[0]) === 'locked' && <p className="hint">{featureHint('childActivities')}</p>}
      {/* 모든 활동이 같은 까닭으로 막혔으면(아기·떠남 등) 그 까닭도 한 번만 — 줄마다 열 번 되풀이됐다 (2026-10-26 점검) */}
      {sameBlock && sameBlock !== 'done' && sameBlock !== 'locked' && <p className="hint">{BLOCKS[sameBlock]}</p>}
      <ul className="kid-acts">
        {KID_ACTS.map((act) => {
          const block = canKidAct(game, act)
          const a = ACTS[act]
          const liked = game.child ? likedActs(kidPersona(game.child, game.clock.day)).has(act) : false
          return (
            <li key={act}>
              <BlockedButton why={block === null ? null : block === 'locked' ? featureHint('childActivities') : BLOCKS[block] ?? ''} onClick={() => kidAct(act)}>
                <span className="kid-act-name">{a.label}</span>
                {a.grows && <span className="kid-act-grows">{a.grows}</span>}
                {liked && <span className="kid-act-grows">좋아해요</span>}
              </BlockedButton>
              {block && block !== 'done' && block !== 'locked' && !sameBlock && <span className="kid-act-why">{BLOCKS[block]}</span>}
            </li>
          )
        })}
      </ul>
      {KID_ACTS.some((a) => canKidAct(game, a) === 'done') && <p className="hint">{BLOCKS.done}</p>}
      {spouseDef && (
        <section className="kid-spouse">
          <h3>{spouseDef.label}</h3>
          <ul className="kid-acts">
            {spouseDef.choices.map((c, i) => (
              <li key={c}>
                <BlockedButton why={spouseBlock === null ? null : spouseBlock === 'locked' ? featureHint('childActivities') : W.blocks[spouseBlock] ?? ''} onClick={() => spouseKidAct(i)}>
                  <span className="kid-act-name">{c}</span>
                </BlockedButton>
              </li>
            ))}
          </ul>
          {spouseBlock && <p className="hint">{spouseBlock === 'locked' ? featureHint('childActivities') : W.blocks[spouseBlock]}</p>}
        </section>
      )}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
