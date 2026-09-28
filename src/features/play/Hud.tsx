import { fill, T } from '../../content/text'
import { isMarketDay, weatherOf } from '../../engine/calendar'
import { formatTime, phaseOf, seasonOf } from '../../engine/clock'
import { useGame } from '../../store/game-store'

export function Hud() {
  const day = useGame((s) => s.game.clock.day)
  // 10분 단위로만 다시 그린다
  const minute = useGame((s) => Math.floor(s.game.clock.minute / 10) * 10)
  const shelf = useGame((s) => s.game.completed.length)
  const { open } = useGame.getState()
  const weather = (T.ui.weather as Record<string, string>)[weatherOf(day)]
  return (
    <header className="hud">
      <div className="hud-row">
        <span className="hud-day">
          {fill(T.ui.day, { day })} · {T.ui.season[seasonOf(day)]} · {weather}
          {isMarketDay(day) && <b className="hud-market"> · {T.ui.market}</b>}
        </span>
        <span className="hud-time">
          {T.ui.phase[phaseOf(minute)]} {formatTime(minute)}
        </span>
      </div>
      <div className="hud-row hud-toolbar">
        <span className="hud-shelf">{fill(T.ui.shelf, { n: shelf })}</span>
        <div className="hud-buttons">
          <button className="hud-btn" onClick={() => open({ kind: 'settings' })}>설정</button>
          <button className="hud-btn" onClick={() => open({ kind: 'bag' })}>
            {T.ui.bag}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'journal' })}>
            {T.ui.journalTitle}
          </button>
        </div>
      </div>
    </header>
  )
}

export function Toast() {
  const toast = useGame((s) => s.toast)
  if (!toast) return null
  return (
    <div className="toast" role="status">
      {toast.text}
    </div>
  )
}
