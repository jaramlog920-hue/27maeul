// 기록자를 누르면: 돌볼 거리가 있을 때만 열린다 (설계 2.6 돌봄)
import { T } from '../../content/text'
import { hasFood, playerTile } from '../../engine/game'
import { isHome } from '../../engine/world'
import { useGame } from '../../store/game-store'

export function CareMenu() {
  const game = useGame((s) => s.game)
  const { eat, blanket, rest, closeModal } = useGame.getState()
  const n = game.needs
  const home = isHome(playerTile(game))
  const canEat = n.hunger >= 30 && hasFood(game.inv)
  const canCover = n.cold >= 30 && (game.inv.blanket ?? 0) > 0
  const canRest = n.fatigue >= 30 && home
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.careTitle}>
      <h2>{T.ui.careTitle}</h2>
      <NeedsView />
      <div className="actions menu column">
        {canEat && <button onClick={eat}>{T.ui.careEat}</button>}
        {canCover && <button onClick={blanket}>{T.ui.careBlanket}</button>}
        {canRest && <button onClick={rest}>{T.ui.careRest}</button>}
        {!canEat && !canCover && !canRest && <p>{T.ui.careNothing}</p>}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

export function NeedsView() {
  const n = useGame((s) => s.game.needs)
  const rows: ['hunger' | 'fatigue' | 'cold', number][] = [
    ['hunger', n.hunger],
    ['fatigue', n.fatigue],
    ['cold', n.cold],
  ]
  return (
    <div className="needs">
      {rows.map(([k, v]) => (
        <div key={k} className="need">
          <span>{T.ui.needs[k]}</span>
          <div className={`need-bar ${v >= 70 ? 'high' : ''}`} role="meter" aria-label={T.ui.needs[k]} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${v}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
