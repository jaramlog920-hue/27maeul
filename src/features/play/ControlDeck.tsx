// 휴대폰 아래 조작판: 왼쪽 십자 단추, 오른쪽 둥근 "확인" 단추와 작은 메뉴(가방·일지·설정).
// 위 가장자리에는 몸 상태 눈금과 다음 일정 한 줄. 터치 화면에서만 보인다(CSS).
import { useState } from 'react'
import { unlockAudio } from '../../audio/sound'
import { CONTENT, neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { nextEvent, eventSummary, scheduledEvents } from '../../engine/events'
import { seasonalNeed } from '../../engine/game'
import { moodOf } from '../../engine/mood'
import { useGame } from '../../store/game-store'
import { DirectionPad } from './Joystick'


const NEED_ICON: Record<string, string> = { hunger: '🍞', fatigue: '💤', cold: '❄️', heat: '☀️', mood: '🙂' }

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
        const help = (T.controls.needHelp as Record<string, string>)[k]
        // 누르면 무엇인지 한 줄로 알려 준다
        return (
          <button key={k} className={`deck-need${warn ? ' warn' : ''}${good ? ' good' : ''}`} onClick={() => useGame.getState().say(fill(help, { n: Math.round(v) }), 3200)}>
            <i aria-hidden="true">{NEED_ICON[k]}</i>
            <b role="meter" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
              <em style={{ width: `${v}%` }} />
            </b>
          </button>
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

/** 오늘 이야기를 들려줄 이웃 수 — 없으면 보이지 않는다. 누르면 누구인지 */
function DeckStories() {
  const who = useGame((s) => Object.keys(s.game.offers).join(','))
  if (!who) return null
  const ids = who.split(',')
  const names = ids.map((id) => neighborById(id)?.role ?? id).join(', ')
  return (
    <button className="deck-stories" onClick={() => useGame.getState().say(fill(T.controls.storiesWho, { who: names }), 3600)}>
      {fill(T.controls.stories, { n: ids.length })}
    </button>
  )
}

export function ControlDeck() {
  const deck = useGame((s) => s.deck)
  // 메뉴 단추를 누르면 가방·일지·일정·설정이 위로 펼쳐진다
  const [menu, setMenu] = useState(false)
  const modalOpen = useGame((s) => s.modal !== null)
  if (!deck) return null
  const { open, press } = useGame.getState()
  const D = T.controls
  const go = (m: Parameters<typeof open>[0]) => {
    setMenu(false)
    open(m)
  }
  return (
    <section className="deck" aria-label={D.deckLabel}>
      <div className="deck-strip">
        <DeckNeeds />
        <DeckStories />
        <DeckNext />
      </div>
      <div className="deck-main">
        <DirectionPad className="deck-pad" />
        <div className="deck-right">
          <div className="deck-menu-wrap">
            <button className={`deck-menu${menu ? ' on' : ''}`} aria-expanded={menu} onClick={() => setMenu(!menu)}>
              {D.menu}
            </button>
            {menu && !modalOpen && (
              <div className="deck-menu-pop" role="menu">
                <button role="menuitem" onClick={() => go({ kind: 'bag' })}>{T.ui.bag}</button>
                <button role="menuitem" onClick={() => go({ kind: 'journal' })}>{T.ui.journalTitle}</button>
                <button role="menuitem" onClick={() => go({ kind: 'settings' })}>{D.settings}</button>
              </div>
            )}
          </div>
          <button
            className="deck-seal"
            onPointerDown={(e) => {
              e.preventDefault()
              unlockAudio()
              setMenu(false)
              press()
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && press()}
            aria-label={D.sealLabel}
          >
            {D.seal}
          </button>
        </div>
      </div>
    </section>
  )
}
