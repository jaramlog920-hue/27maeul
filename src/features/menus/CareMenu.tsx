// 기록자를 누르면: 돌볼 거리가 있을 때만 열린다 (설계 2.6 돌봄)
import { T } from '../../content/text'
import { hasFood, playerTile, seasonalNeed } from '../../engine/game'
import { moodOf } from '../../engine/mood'
import { isHome } from '../../engine/world'
import { useGame } from '../../store/game-store'

export function CareMenu() {
  const game = useGame((s) => s.game)
  const { eat, blanket, rest, drink, closeModal } = useGame.getState()
  const n = game.needs
  const home = isHome(playerTile(game))
  const canEat = n.hunger >= 30 && hasFood(game.inv)
  const canCover = n.cold >= 30 && (game.inv.blanket ?? 0) > 0
  const canRest = n.fatigue >= 30 && home
  const canDrink = n.heat >= 30 && (game.inv.water ?? 0) > 0
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.careTitle}>
      <h2>{T.ui.careTitle}</h2>
      <NeedsView />
      <div className="actions menu column">
        {canEat && <button onClick={eat}>{T.ui.careEat}</button>}
        {canCover && <button onClick={blanket}>{T.ui.careBlanket}</button>}
        {canRest && <button onClick={rest}>{T.ui.careRest}</button>}
        {canDrink && <button onClick={drink}>{T.ui.careDrink}</button>}
        {!canEat && !canCover && !canRest && !canDrink && <p>{T.ui.careNothing}</p>}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

export function NeedsView() {
  const game = useGame((s) => s.game)
  const n = game.needs
  const extra = seasonalNeed(game)
  const rows: [string, number, boolean][] = [
    ['hunger', n.hunger, false],
    ['fatigue', n.fatigue, false],
    ...(extra ? [[extra, n[extra], false] as [string, number, boolean]] : []),
    ['mood', moodOf(game), true],
  ]
  return (
    <div className="needs">
      {rows.map(([k, v, good]) => (
        <div key={k} className="need">
          <span>{T.ui.needs[k as keyof typeof T.ui.needs]}</span>
          <div
            className={`need-bar ${good ? `good${v >= 70 ? ' happy' : ''}` : v >= 70 ? 'high' : ''}`}
            role="meter"
            aria-label={T.ui.needs[k as keyof typeof T.ui.needs]}
            aria-valuenow={Math.round(v)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${v}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
