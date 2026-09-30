// 부탁하기 (계획 13 — 대화 창이 붐비지 않게 한곳에): 목수는 집 넓히기·살림·기록 설비, 대장장이는 등잔.
// 줄마다 무엇이 좋아지는지, 드는 것, 지금 부탁할 수 있는지를 함께 보인다.
import { neighborById } from '../../content/catalog'
import { fill, itemList, T } from '../../content/text'
import { CARPENTER_WORKS } from '../../engine/easier'
import { canOrderHome, canOrderWork, fixtureOffers, nextHomeStage, type FixtureBlock } from '../../engine/game'
import { fixtureTier } from '../../engine/fixtures'
import { useGame } from '../../store/game-store'

const NAMES = T.fixtures.names as Record<string, string[]>
const EFFECT = T.fixtures.effect as Record<string, string>
const EASY = T.easy.names as Record<string, string>

function why(block: FixtureBlock | string | null): string | null {
  if (block === 'coins') return T.fixtures.coinsShort
  if (block === 'ordered') return T.fixtures.ordered
  return null
}

export function OrdersView({ npc }: { npc: string }) {
  const game = useGame((s) => s.game)
  const { askHome, askWork, askFixture, closeModal, open } = useGame.getState()
  const def = neighborById(npc)
  const maker = npc === 'smith' ? 'smith' : 'carpenter'
  const rows: { key: string; name: string; effect?: string; cost: string; block: string | null; act: () => void }[] = []
  if (maker === 'carpenter') {
    const st = nextHomeStage(game)
    const hb = st ? canOrderHome(game) : 'done'
    if (st && hb !== 'notMoved')
      rows.push({ key: 'home', name: st.level === 1 ? T.ui.homeStage1 : T.ui.homeStage2, cost: fill(T.ui.homeCost, { coins: st.coins, items: itemList(st.needs) }), block: hb, act: () => askHome(npc) })
    for (const w of CARPENTER_WORKS) {
      const b = canOrderWork(game, w.id)
      if (b === 'owned' || b === 'notMoved') continue
      rows.push({ key: w.id, name: EASY[w.id], cost: `${w.coins}닢`, block: b, act: () => askWork(npc, w.id) })
    }
  }
  for (const { step, block } of fixtureOffers(game, maker)) {
    if (block === 'notMoved') continue
    const needs = Object.keys(step.needs).length ? ` · ${itemList(step.needs)}` : ''
    rows.push({
      key: step.line,
      name: `${NAMES[step.line][fixtureTier(game, step.line)] || ''} → ${NAMES[step.line][step.tier]}`.replace(/^ → /, ''),
      effect: EFFECT[`${step.line}${step.tier}`],
      cost: `${step.coins}닢${needs}`,
      block,
      act: () => askFixture(npc, step.line),
    })
  }
  return (
    <div className="dialog orders" role="dialog" aria-label={T.fixtures.title}>
      <h2>
        {def?.role} · {T.fixtures.title}
      </h2>
      {rows.length === 0 ? (
        <p>{T.fixtures.allDone}</p>
      ) : (
        <ul className="order-list">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="order-main">
                <b>{r.name}</b>
                {r.effect && <span className="order-effect">{r.effect}</span>}
                <span className="order-cost">
                  {r.cost}
                  {why(r.block) && <em> · {why(r.block)}</em>}
                  {r.block === 'needs' && <em> · {T.fixtures.needsShort}</em>}
                </span>
              </div>
              <button className="primary" disabled={r.block !== null} onClick={r.act}>
                {T.fixtures.ask}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="hint">{T.fixtures.carpenterHint}</p>
      <div className="actions">
        <button onClick={() => open({ kind: 'talk', neighborId: npc, line: '' })}>{T.ui.back}</button>
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
