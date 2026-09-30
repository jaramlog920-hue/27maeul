// 휴대폰 아래 조작판: 왼쪽 나침반 패드, 오른쪽 밀랍 도장 "살피기" 단추와 가방·일지·설정.
// 위 가장자리에는 몸 상태 눈금과 다음 일정 한 줄. 터치 화면에서만 보인다(CSS).
import { unlockAudio } from '../../audio/sound'
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { nextEvent, eventSummary, scheduledEvents } from '../../engine/events'
import { seasonalNeed } from '../../engine/game'
import { moodOf } from '../../engine/mood'
import { useGame } from '../../store/game-store'
import { DirectionPad } from './Joystick'

const NEED_ICON: Record<string, string> = { hunger: '🍞', fatigue: '💤', cold: '❄', heat: '☀', mood: '☺' }

function DeckNeeds() {
  const game = useGame((s) => s.game)
  const extra = seasonalNeed(game)
  const rows: [string, number, boolean][] = [
    ['hunger', game.needs.hunger, false],
    ['fatigue', game.needs.fatigue, false],
    ...(extra ? [[extra, game.needs[extra], false] as [string, number, boolean]] : []),
    ['mood', moodOf(game), true],
  ]
  return (
    <div className="deck-needs">
      {rows.map(([k, v, good]) => {
        const label = T.ui.needs[k as keyof typeof T.ui.needs]
        const warn = good ? v < 30 : v >= 70
        return (
          <span key={k} className={`deck-need${warn ? ' warn' : ''}${good ? ' good' : ''}`} role="meter" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
            <i aria-hidden="true">{NEED_ICON[k]}</i>
            <b>
              <em style={{ width: `${v}%` }} />
            </b>
          </span>
        )
      })}
    </div>
  )
}

function DeckNext() {
  const day = useGame((s) => s.game.clock.day)
  const minute = useGame((s) => Math.floor(s.game.clock.minute))
  const today = useGame((s) => s.game.today)
  const flags = useGame((s) => s.game.flags)
  const events = scheduledEvents({ clock: { day, minute }, today, flags }, CONTENT)
  const next = nextEvent(events, day, minute)
  const now = !!next && next.day === day && minute >= next.from
  return (
    <button className={`deck-next${now ? ' now' : ''}`} onClick={() => useGame.getState().open({ kind: 'schedule' })} aria-label={`다음 일정: ${eventSummary(next, day, minute)}. 눌러서 전체 일정 보기`}>
      {eventSummary(next, day, minute)}
    </button>
  )
}

export function ControlDeck() {
  const deck = useGame((s) => s.deck)
  if (!deck) return null
  const { open, press } = useGame.getState()
  const D = T.controls
  return (
    <section className="deck" aria-label={D.deckLabel}>
      <div className="deck-strip">
        <DeckNeeds />
        <DeckNext />
      </div>
      <div className="deck-main">
        <DirectionPad className="deck-pad" />
        <div className="deck-right">
          <button
            className="deck-seal"
            onPointerDown={(e) => {
              e.preventDefault()
              unlockAudio()
              press()
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && press()}
            aria-label={D.sealLabel}
          >
            <span>{D.seal}</span>
          </button>
          <div className="deck-tabs">
            <button onClick={() => open({ kind: 'bag' })}>{T.ui.bag}</button>
            <button onClick={() => open({ kind: 'journal' })}>{T.ui.journalTitle}</button>
            <button onClick={() => open({ kind: 'settings' })}>{D.settings}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
