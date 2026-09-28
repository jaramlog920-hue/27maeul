// 손으로 하는 짧은 활동. 실패가 없다.
import { neighborById } from '../../content/catalog'
import { NEIGHBOR_LINES, T } from '../../content/text'
import { cursorOf, isDone, PICK_COLS, PICK_ROWS, progressOf, type MiniState } from '../../engine/minigame'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame, type Pending } from '../../store/game-store'

const PLACE_ICON: Record<string, ItemId> = { well: 'water', reeds: 'reed', olive: 'olive', vine: 'grapes', field: 'barley' }
const RECIPE_ICON: Record<string, ItemId> = { bread: 'bread', papyrus: 'papyrus', ink: 'ink', oil: 'oil', blanket: 'blanket' }

function titleOf(p: Pending): string {
  if (p.kind === 'gather') return (T.places as Record<string, string>)[p.place] ?? ''
  if (p.kind === 'craft') return (T.recipes as Record<string, string>)[p.recipe]?.split(' — ')[0] ?? ''
  if (p.kind === 'teach') return T.ui.talkTeach
  if (p.kind === 'letter') return T.letters.mini
  const l = NEIGHBOR_LINES[p.neighborId]
  return `${neighborById(p.neighborId)?.role ?? ''} · ${l?.help.label ?? ''}`
}

function iconOf(p: Pending): ItemId {
  if (p.kind === 'gather') return PLACE_ICON[p.place] ?? 'water'
  if (p.kind === 'craft') return RECIPE_ICON[p.recipe] ?? 'bread'
  if (p.kind === 'teach') return 'papyrus'
  if (p.kind === 'letter') return 'papyrus'
  return 'wool'
}

export function MiniGame({ state, pending }: { state: MiniState; pending: Pending }) {
  const miniTap = useGame((s) => s.miniTap)
  const quitMini = useGame((s) => s.quitMini)
  const done = isDone(state)
  const icon = iconOf(pending)
  return (
    <div className="dialog mini" role="dialog" aria-label={titleOf(pending)}>
      <h2>{titleOf(pending)}</h2>
      <p className="hint">{done ? T.ui.minigame.done : T.ui.minigame[state.kind]}</p>
      <div className="mini-bar" role="progressbar" aria-valuenow={Math.round(progressOf(state) * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${progressOf(state) * 100}%` }} />
      </div>
      {state.kind === 'timing' && (
        <div className={`timing-track ${state.flash ?? ''}`}>
          <div className="timing-zone" style={{ left: `${state.zone[0] * 100}%`, width: `${(state.zone[1] - state.zone[0]) * 100}%` }} />
          <div className="timing-cursor" style={{ left: `${cursorOf(state.t) * 100}%` }} />
        </div>
      )}
      {state.kind === 'pick' ? (
        <div className="pick-grid" style={{ gridTemplateColumns: `repeat(${PICK_COLS}, 1fr)` }}>
          {Array.from({ length: PICK_COLS * PICK_ROWS }, (_, i) => {
            const x = i % PICK_COLS
            const y = Math.floor(i / PICK_COLS)
            const item = state.items.find((it) => it.x === x && it.y === y)
            return (
              <button key={i} className="pick-cell" disabled={!item || done} aria-label={item ? T.ui.minigame.tap : T.ui.minigame.empty} onPointerDown={() => item && miniTap(item.id)}>
                {item && <ItemIcon id={icon} size={28} />}
              </button>
            )
          })}
        </div>
      ) : (
        !done && (
          <button className="primary big" onPointerDown={() => miniTap()}>
            <ItemIcon id={icon} size={28} /> {T.ui.minigame.tap}
          </button>
        )
      )}
      <div className="actions">
        {done ? (
          <button className="primary" onClick={() => miniTap()}>
            {T.ui.close}
          </button>
        ) : (
          <button onClick={quitMini}>{T.ui.miniQuit}</button>
        )}
      </div>
    </div>
  )
}
