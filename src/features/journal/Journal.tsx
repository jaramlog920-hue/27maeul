// 일지 — 게임 속에서 일어난 사실만 적는다
import { pieceById } from '../../content/catalog'
import { fill, JOURNAL_NOTES, T } from '../../content/text'
import { weatherOf } from '../../engine/calendar'
import type { JournalEntry } from '../../engine/game'
import { useGame } from '../../store/game-store'

export function journalLine(e: JournalEntry): string {
  const weather = fill(T.journal.weather, { weather: (T.ui.weather as Record<string, string>)[weatherOf(e.day)] })
  const heard = e.heard.length ? fill(T.journal.heard, { refs: e.heard.map((id) => pieceById(id).ref).join(', ') }) : ''
  const notes = (e.notes ?? []).map((n) => JOURNAL_NOTES[n] ?? '').join('')
  const body = heard + notes || T.journal.quiet
  return fill(T.journal.day, { day: e.day }) + weather + body
}

export function Journal() {
  const journal = useGame((s) => s.game.journal)
  const closeModal = useGame((s) => s.closeModal)
  return (
    <div className="dialog journal" role="dialog" aria-label={T.ui.journalTitle}>
      <h2>{T.ui.journalTitle}</h2>
      {journal.length === 0 ? (
        <p>{T.ui.journalEmpty}</p>
      ) : (
        <ul className="journal-list">
          {[...journal].reverse().map((e) => (
            <li key={e.day}>{journalLine(e)}</li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
