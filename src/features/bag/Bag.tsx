import { fill, ITEM_TEXT, T } from '../../content/text'
import { chestOf, playerTile } from '../../engine/game'
import { MAX_LEVEL, progressOf, STAT_IDS, type StatId, type Stats } from '../../engine/stats'
import { isHome } from '../../engine/world'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'

const STAT_NAME = T.stats.names as Record<StatId, string>
const STAT_DESC = T.stats.desc as Record<StatId, string>

/** 능력치 다섯 (계획 11 작업 4): 단계만큼 찬 막대 다섯(다음 칸은 쌓인 경험치만큼), 타고난 값은 작은 별 */
export function StatsView({ stats }: { stats: Stats }) {
  return (
    <section className="stats" aria-label={T.stats.title}>
      <h3>{T.stats.title}</h3>
      <ul className="stats-list">
        {STAT_IDS.map((id) => {
          const st = stats[id]
          const part = progressOf(st)
          return (
            <li key={id} data-stat={id} title={STAT_DESC[id]}>
              <span className="stat-name">
                {STAT_NAME[id]}
                {st.born > 0 && (
                  <span className="stat-born" aria-label={fill(T.stats.born, { n: st.born })}>
                    {'★'.repeat(st.born)}
                  </span>
                )}
              </span>
              <span className="stat-bars" aria-label={fill(T.stats.level, { n: st.level })}>
                {Array.from({ length: MAX_LEVEL }, (_, i) => {
                  const fillPct = i < st.level ? 100 : i === st.level ? Math.round(part * 100) : 0
                  return (
                    <span key={i} className="stat-bar">
                      <span style={{ width: `${fillPct}%` }} />
                    </span>
                  )
                })}
              </span>
              <span className="stat-level">{fill(T.stats.level, { n: st.level })}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function Bag() {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const takeChest = useGame((s) => s.takeChest)
  const inv = game.inv
  const items = (Object.entries(inv) as [ItemId, number][]).filter(([, n]) => n > 0)
  // 재료 궤짝 (계획 11): 가진 뒤에만 보인다. 꺼내기는 집 안에서만
  const chest = chestOf(game)
  const boxed = chest ? (Object.entries(chest) as [ItemId, number][]).filter(([, n]) => n > 0) : []
  const atHome = isHome(playerTile(game))
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.bag}>
      <h2>{T.ui.bag}</h2>
      <NeedsView />
      <StatsView stats={game.stats} />
      {items.length === 0 ? (
        <p>{T.ui.bagEmpty}</p>
      ) : (
        <ul className="bag-list">
          {items.map(([id, n]) => (
            <li key={id}>
              <ItemIcon id={id} />
              <span className="bag-name">
                {ITEM_TEXT[id].name} <b>{n}</b>
              </span>
              <span className="bag-desc">{ITEM_TEXT[id].desc}</span>
            </li>
          ))}
        </ul>
      )}
      {chest && (
        <>
          <h3>{T.easy.chest}</h3>
          {boxed.length === 0 ? (
            <p>{T.easy.chestEmpty}</p>
          ) : (
            <ul className="bag-list">
              {boxed.map(([id, n]) => (
                <li key={id}>
                  <ItemIcon id={id} />
                  <span className="bag-name">
                    {ITEM_TEXT[id].name} <b>{n}</b>
                  </span>
                  <button disabled={!atHome} onClick={() => takeChest(id)}>
                    {T.easy.chestTake}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="hint">{T.easy.chestHint}</p>
        </>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
