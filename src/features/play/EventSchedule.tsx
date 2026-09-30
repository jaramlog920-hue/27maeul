import { useEffect } from 'react'
import { CONTENT } from '../../content/catalog'
import { formatTime } from '../../engine/clock'
import { alertsBetween, eventName, eventStatus, eventSummary, nextEvent, scheduledEvents } from '../../engine/events'
import { useGame } from '../../store/game-store'

/** 알림 풍선이 떠 있는 시간(ms) — 보통 안내보다 조금 길게 */
const ALERT_MS = 4200

function useEvents() {
  const day = useGame((s) => s.game.clock.day)
  const minute = useGame((s) => Math.floor(s.game.clock.minute))
  const today = useGame((s) => s.game.today)
  const flags = useGame((s) => s.game.flags)
  const notebook = useGame((s) => s.game.notebook)
  return { day, minute, events: scheduledEvents({ clock: { day, minute }, today, flags, notebook }, CONTENT) }
}

/** 상단에 늘 보이는 "다음 일정" 한 줄. 누르면 전체 일정 창 */
export function NextEventBar() {
  const { day, minute, events } = useEvents()
  const next = nextEvent(events, day, minute)
  const now = !!next && next.day === day && minute >= next.from
  return (
    <button
      className={`next-event${now ? ' now' : ''}`}
      aria-label={`다음 일정: ${eventSummary(next, day, minute)}. 눌러서 전체 일정 보기`}
      onClick={() => useGame.getState().open({ kind: 'schedule' })}
    >
      <span className="next-event-label">{now ? '지금' : '다음'}</span>
      <span className="next-event-text">{eventSummary(next, day, minute)}</span>
      <span className="next-event-more">일정 ›</span>
    </button>
  )
}

/** 전체 일정 창 */
export function ScheduleDialog() {
  const { day, minute, events } = useEvents()
  const close = useGame((s) => s.closeModal)
  return (
    <div className="dialog schedule" role="dialog" aria-label="일정">
      <h2>일정</h2>
      <p className="hint">게임 속 시간 기준 · 앞으로 7일</p>
      {!events.some((e) => e.day === day) && <p className="hint">오늘은 예정된 일정이 없어요.</p>}
      <ul className="event-list">
        {events.map((e) => {
          const status = eventStatus(e, day, minute)
          return (
            <li key={e.id} className={status === '진행 중' ? 'event-active' : e.done || status === '종료' ? 'event-past' : ''}>
              <div className="event-head">
                <strong>{e.id.endsWith(':market') ? '장날 · 떠돌이 상인 방문' : eventName(e)}</strong>
                <span className="event-status">{status}</span>
              </div>
              <span>
                {e.day === day ? '오늘' : `${e.day}일째`} · {formatTime(e.from)}~{formatTime(e.to)} · {e.location}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="hint">이웃 방문·초대·소풍은 그날 아침에 정해지면 표시돼요. 시작 30분 전과 시작할 때 알려 드려요.</p>
      <div className="actions">
        <button onClick={close}>닫기</button>
      </div>
    </div>
  )
}

/** 시작 30분 전과 시작할 때 화면 위에 알린다 */
export function useEventAlerts() {
  useEffect(() => {
    let last = { day: -1, minute: 0 }
    return useGame.subscribe((state) => {
      const { day, minute: m } = state.game.clock
      const minute = Math.floor(m)
      // 새 날(잠에서 깸)이나 처음 불러올 때는 지나간 시각을 알리지 않는다
      if (day !== last.day || minute < last.minute) {
        last = { day, minute }
        return
      }
      if (minute === last.minute) return
      const before = last.minute
      last = { day, minute }
      const events = scheduledEvents(state.game, CONTENT)
      const alerts = alertsBetween(events, day, before, minute)
      if (alerts.length) state.say(alerts[alerts.length - 1], ALERT_MS)
    })
  }, [])
}
