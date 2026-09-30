// 책상의 정성 (계획 13): 지금 기록하면 정성 몇 점인지, 좋은 파피루스로 쓸지 — 빠르기는 그대로
import { fill, T } from '../../content/text'
import { careNow, stockOf } from '../../engine/game'
import { CAREFUL_AT } from '../../engine/fixtures'
import { useGame } from '../../store/game-store'

export function CareLine() {
  const game = useGame((s) => s.game)
  const toggleFine = useGame((s) => s.toggleFine)
  const c = careNow(game)
  const parts = [c.fine && T.care.fine, c.focused && T.care.focus, c.goodLight && T.care.light, c.deskTier >= 2 && T.care.desk].filter(Boolean).join(' · ') || '—'
  const fine = stockOf(game, 'finePapyrus')
  return (
    <div className="care-line">
      <p className={`hint${c.score >= CAREFUL_AT ? ' careful' : ''}`}>
        {fill(T.care.score, { n: c.score, parts })} → {c.score >= CAREFUL_AT ? T.care.careful : T.care.plain}
      </p>
      {fine > 0 && (
        <label className="care-fine">
          <input type="checkbox" checked={!!game.flags.useFine} onChange={toggleFine} /> {T.care.useFine} ({fine})
        </label>
      )}
    </div>
  )
}
