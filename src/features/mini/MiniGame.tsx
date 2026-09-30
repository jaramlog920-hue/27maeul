// 손으로 하는 짧은 활동. 실패가 없다.
import { neighborById } from '../../content/catalog'
import { NEIGHBOR_LINES, T } from '../../content/text'
import { cursorOf, HOLD_DOWN, HOLD_UP, isDone, litCell, ORDER_CELLS, PICK_COLS, PICK_ROWS, progressOf, showing, type MiniState } from '../../engine/minigame'
import { count } from '../../engine/items'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame, type Pending } from '../../store/game-store'

const PLACE_ICON: Record<string, ItemId> = { well: 'water', reeds: 'reed', olive: 'olive', vine: 'grapes', field: 'barley', wildHerb: 'herb' }
const RECIPE_ICON: Record<string, ItemId> = { bread: 'bread', papyrus: 'papyrus', ink: 'ink', oil: 'oil', blanket: 'blanket', cover: 'cover' }

function titleOf(p: Pending): string {
  if (p.kind === 'gather') return (T.ui.minigame.gather as Record<string, string>)[p.place] ?? (T.places as Record<string, string>)[p.place] ?? ''
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
  const skipMini = useGame((s) => s.skipMini)
  const kit = useGame((s) => count(s.game.inv, 'handyKit') > 0)
  const done = isDone(state)
  const icon = iconOf(pending)
  const M = T.ui.minigame
  const watching = state.kind === 'order' && showing(state)
  return (
    <div className="dialog mini" role="dialog" aria-label={titleOf(pending)}>
      <h2>{titleOf(pending)}</h2>
      <p className="hint">{done ? M.done : watching ? M.watch : M[state.kind]}</p>
      <div className="mini-bar" role="progressbar" aria-valuenow={Math.round(progressOf(state) * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${progressOf(state) * 100}%` }} />
      </div>
      {state.kind === 'timing' && (
        <div className={`timing-track ${state.flash ?? ''}`}>
          <div className="timing-zone" style={{ left: `${state.zone[0] * 100}%`, width: `${(state.zone[1] - state.zone[0]) * 100}%` }} />
          <div className="timing-cursor" style={{ left: `${cursorOf(state.t) * 100}%` }} />
        </div>
      )}
      {state.kind === 'hold' && (
        <div className={`hold-gauge ${state.flash ?? ''}`}>
          <div className="hold-zone" style={{ bottom: `${state.zone[0] * 100}%`, height: `${(state.zone[1] - state.zone[0]) * 100}%` }} />
          <div className="hold-fill" style={{ height: `${state.fill * 100}%` }} />
        </div>
      )}
      {state.kind === 'hold' ? (
        !done && (
          <button
            className={`primary big hold-btn${state.holding ? ' holding' : ''}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId)
              miniTap(HOLD_DOWN)
            }}
            onPointerUp={() => miniTap(HOLD_UP)}
            onPointerCancel={() => miniTap(HOLD_UP)}
          >
            <ItemIcon id={icon} size={28} /> {M.holdBtn}
          </button>
        )
      ) : state.kind === 'weave' ? (
        !done && (
          <div className={`weave-row ${state.flash ?? ''}`}>
            {([0, 1] as const).map((side) => (
              <button key={side} className={`weave-btn${state.next === side ? ' next' : ''}`} onPointerDown={() => miniTap(side)}>
                {side === 0 ? `◀ ${M.left}` : `${M.right} ▶`}
              </button>
            ))}
            <div className="weave-shuttle" style={{ left: `${state.next === 0 ? 70 : 30}%` }}>
              <ItemIcon id={icon} size={24} />
            </div>
          </div>
        )
      ) : state.kind === 'order' ? (
        <div className={`order-grid ${state.flash ?? ''}`}>
          {Array.from({ length: ORDER_CELLS }, (_, i) => (
            <button key={i} className={`order-cell c${i}${litCell(state) === i ? ' lit' : ''}`} disabled={done || watching} aria-label={`${i + 1}`} onPointerDown={() => miniTap(i)}>
              {['◆', '●', '▲', '■'][i]}
            </button>
          ))}
        </div>
      ) : state.kind === 'pick' ? (
        <div className="pick-grid" style={{ gridTemplateColumns: `repeat(${PICK_COLS}, 1fr)` }}>
          {Array.from({ length: PICK_COLS * PICK_ROWS }, (_, i) => {
            const x = i % PICK_COLS
            const y = Math.floor(i / PICK_COLS)
            const item = state.items.find((it) => it.x === x && it.y === y)
            return (
              <button key={i} className="pick-cell" disabled={!item || done} aria-label={item ? M.tap : M.empty} onPointerDown={() => item && miniTap(item.id)}>
                {item && <ItemIcon id={icon} size={28} />}
              </button>
            )
          })}
        </div>
      ) : (
        !done && (
          <button className="primary big" onPointerDown={() => miniTap()}>
            <ItemIcon id={icon} size={28} /> {M.tap}
          </button>
        )
      )}
      <div className="actions">
        {done ? (
          <button className="primary" onClick={() => miniTap()}>
            {T.ui.close}
          </button>
        ) : (
          <>
            {kit && (
              <button className="mini-skip" onClick={skipMini}>
                <ItemIcon id="handyKit" size={20} /> {M.skip}
              </button>
            )}
            <button onClick={quitMini}>{T.ui.miniQuit}</button>
          </>
        )}
      </div>
    </div>
  )
}
