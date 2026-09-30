import { useState } from 'react'
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
  // 줄을 누르면 그 능력치가 무엇에 쓰이는지 펼친다
  const [open, setOpen] = useState<StatId | null>(null)
  return (
    <section className="stats" aria-label={T.stats.title}>
      <h3>{T.stats.title}</h3>
      <ul className="stats-list">
        {STAT_IDS.map((id) => {
          const st = stats[id]
          const part = progressOf(st)
          return (
            <li key={id} data-stat={id} className={open === id ? 'on' : ''} onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id}>
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
              {open === id && <p className="tap-explain">{STAT_DESC[id]}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** 한 줄에 여섯 칸 — 빈칸까지 채워 보여 준다 (적어도 두 줄) */
const COLS = 6
function slotsFor(n: number): number {
  return Math.max(COLS * 2, Math.ceil(n / COLS) * COLS)
}

type Pick = { from: 'bag' | 'chest'; id: ItemId }

/** 아이콘만 늘어놓은 칸들. 누르면 아래에 이름·설명 */
function ItemGrid({ items, picked, from, onPick }: { items: [ItemId, number][]; picked: Pick | null; from: Pick['from']; onPick: (p: Pick) => void }) {
  return (
    <div className="bag-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
      {Array.from({ length: slotsFor(items.length) }, (_, i) => {
        const it = items[i]
        if (!it) return <span key={i} className="bag-slot empty" />
        const [id, n] = it
        const on = picked?.from === from && picked.id === id
        return (
          <button key={id} className={`bag-slot${on ? ' on' : ''}`} aria-label={`${ITEM_TEXT[id].name} ${n}`} aria-pressed={on} onClick={() => onPick({ from, id })}>
            <ItemIcon id={id} size={28} />
            {n > 1 && <b className="bag-count">{n}</b>}
          </button>
        )
      })}
    </div>
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
  const [picked, setPicked] = useState<Pick | null>(null)
  const list = picked?.from === 'chest' ? boxed : items
  const pickedN = picked ? (list.find(([id]) => id === picked.id)?.[1] ?? 0) : 0
  const detail = (from: Pick['from']) =>
    picked?.from === from && pickedN > 0 ? (
      <div className="bag-detail">
        <ItemIcon id={picked.id} size={32} />
        <div>
          <strong>
            {ITEM_TEXT[picked.id].name} <b>{pickedN}</b>
          </strong>
          <p>{ITEM_TEXT[picked.id].desc}</p>
        </div>
        {from === 'chest' && (
          <button disabled={!atHome} onClick={() => takeChest(picked.id)}>
            {T.easy.chestTake}
          </button>
        )}
      </div>
    ) : (
      <p className="bag-detail hint">{T.ui.bagTapHint}</p>
    )
  return (
    <div className="dialog bag" role="dialog" aria-label={T.ui.bag}>
      <h2>{T.ui.bag}</h2>
      {items.length === 0 ? <p>{T.ui.bagEmpty}</p> : <ItemGrid items={items} picked={picked} from="bag" onPick={setPicked} />}
      {items.length > 0 && detail('bag')}
      {chest && (
        <>
          <h3>{T.easy.chest}</h3>
          {boxed.length === 0 ? <p>{T.easy.chestEmpty}</p> : <ItemGrid items={boxed} picked={picked} from="chest" onPick={setPicked} />}
          {boxed.length > 0 && detail('chest')}
          <p className="hint">{T.easy.chestHint}</p>
        </>
      )}
      <h3>{T.ui.statusTitle}</h3>
      <NeedsView explain />
      <StatsView stats={game.stats} />
      <p className="hint">{T.ui.bagExplainHint}</p>
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
