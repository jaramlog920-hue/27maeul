// 목수에게 부탁하는 집 넓히기와 살림 도구.
// 줄마다 무엇이 좋아지는지, 드는 것, 지금 부탁할 수 있는지를 함께 보인다.
import { neighborById } from '../../content/catalog'
import { fill, itemList, itemName, T } from '../../content/text'
import { CARPENTER_WORKS } from '../../engine/easier'
import { canOrderHome, canOrderWork, nextHomeStage, stockOf, type GameState } from '../../engine/game'
import type { ItemId } from '../../engine/types'
import { featureHint } from '../../engine/feature-rules'
import { useGame } from '../../store/game-store'
import { BlockedButton } from '../../shared/BlockedButton'

const EASY = T.easy.names as Record<string, string>

function why(block: string | null): string | null {
  if (block === 'coins') return T.orders.coinsShort
  if (block === 'ordered') return T.orders.ordered
  return null
}

/** 모자란 재료를 「파피루스 3/10」처럼 — 무엇이 몇 개 모자라는지 안 나왔다 (2026-10-27 플레이 점검 32) */
function shortOf(game: GameState, needs: Partial<Record<ItemId, number>>): string {
  return (Object.entries(needs) as [ItemId, number][]).filter(([id, n]) => stockOf(game, id) < n).map(([id, n]) => `${itemName(id)} ${stockOf(game, id)}/${n}`).join(' · ')
}

export function OrdersView({ npc }: { npc: string }) {
  const game = useGame((s) => s.game)
  const { askHome, askWork, closeModal, open } = useGame.getState()
  const def = neighborById(npc)
  const maker = npc === 'smith' ? 'smith' : 'carpenter'
  const rows: { key: string; name: string; effect?: string; cost: string; block: string | null; act: () => void; short?: string }[] = []
  if (maker === 'carpenter') {
    const st = nextHomeStage(game)
    const hb = st ? canOrderHome(game) : 'done'
    if (st && hb !== 'notMoved')
      rows.push({ key: 'home', name: st.level === 1 ? T.ui.homeStage1 : st.level === 2 ? T.ui.homeStage2 : T.ui.homeStage3, cost: fill(T.ui.homeCost, { coins: st.coins, items: itemList(st.needs) }), block: hb, act: () => askHome(npc), short: shortOf(game, st.needs) })
    for (const w of CARPENTER_WORKS) {
      const b = canOrderWork(game, w.id)
      if (b === 'owned' || b === 'notMoved') continue
      rows.push({ key: w.id, name: EASY[w.id], cost: `${w.coins}닢`, block: b, act: () => askWork(npc, w.id) })
    }
  }
  return (
    <div className="dialog orders" role="dialog" aria-label={T.orders.title}>
      <h2>
        {def?.role} · {T.orders.title}
      </h2>
      {rows.length === 0 ? (
        <p>{T.orders.allDone}</p>
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
                  {r.block === 'needs' && <em> · {fill(T.orders.needsShort, { items: r.short ?? '' })}</em>}
                  {r.block === 'locked' && <em> · {featureHint(r.key === 'home' ? game.homeLevel === 0 ? 'spouseRoom' : 'childRoom' : 'convenience')}</em>}
                </span>
              </div>
              <BlockedButton className="primary" why={r.block === null ? null : why(r.block) || (r.block === 'needs' ? fill(T.orders.needsShort, { items: r.short ?? '' }) : r.block === 'locked' ? featureHint(r.key === 'home' ? game.homeLevel === 0 ? 'spouseRoom' : 'childRoom' : 'convenience') : '')} onClick={r.act}>
                {T.orders.ask}
              </BlockedButton>
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button onClick={() => open({ kind: 'talk', neighborId: npc, line: '' })}>{T.ui.back}</button>
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
