import { venueFor } from './plans'
import lifeText from '../content/life-text.json'
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf } from './calendar'
import { BABY_PARTY_DAY, gatheringWindow, VISIT_FROM, VISIT_TO, INVITE_FROM, INVITE_TO, FRIENDS_FROM, FRIENDS_TO } from './bonds'
import type { GameState } from './game'
import { formatTime } from './clock'
import type { GameContent } from './types'
import { isBirthday } from './notebook'
import { t } from '../shared/i18n'
import { isReadingDay, READING_FROM, READING_TO, readingRest, seasonCopyKey, seasonCopyOpen } from './meetings'

export interface ScheduledEvent {
  id: string
  day: number
  title: string
  location: string
  from: number
  to: number
  done?: boolean
}
const festivals = { blossom: '봄꽃 잔치', barley: '보리 거둔 날 잔치', grapes: '포도 수확 잔치', hearth: '모닥불 모임' }
const gatherings = { babyParty: '아기 잔치', picnic: '언덕 소풍', starNight: '별 보는 밤' }

/** 미래의 친밀도 이벤트는 추측하지 않고, 확정된 날짜와 오늘 정해진 일정만 안내한다. */
export function scheduledEvents(s: Pick<GameState, 'clock' | 'today' | 'flags'> & Partial<Pick<GameState, 'notebook' | 'plans' | 'gen' | 'romance'>>, content: GameContent): ScheduledEvent[] {
  const events: ScheduledEvent[] = []
  const day = s.clock.day
  const add = (id: string, title: string, location: string, from: number, to: number, done = false, onDay = day) => {
    events.push({ id: `${onDay}:${id}`, day: onDay, title, location, from, to, done })
  }
  // 내 결혼 잔치: 약혼한 다음 장날 저녁, 광장 모닥불 (7일 안이면)
  const r = s.romance
  if (r?.stage === 'engaged' && r.partner && r.weddingDay !== null && r.weddingDay >= day && r.weddingDay <= day + 7) {
    const who = content.neighbors.find((n) => n.id === r.partner)?.role ?? ''
    const c = who.charCodeAt(who.length - 1) - 0xac00
    const whoAnd = who + (c >= 0 && c < 11172 && c % 28 !== 0 ? '과' : '와')
    add('wedding', t('schedule.myWedding', { whoAnd }), lifeText.gen.weddingPlace, FESTIVAL_FROM, FESTIVAL_TO, false, r.weddingDay)
  }
  // 주민 결혼 잔치 (계획 20 2부 — 달력 초대): 결혼 준비 중인 쌍의 잔치 날, 7일 안이면
  if (s.gen?.on) {
    const nm = (id: string) => content.neighbors.find((n) => n.id === id)?.role ?? ''
    const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '')
    // 받침이 있으면 '과', 없으면 '와'
    const withAnd = (w: string) => {
      const c = w.charCodeAt(w.length - 1) - 0xac00
      return w + (c >= 0 && c < 11172 && c % 28 !== 0 ? '과' : '와')
    }
    for (const r of Object.values(s.gen.relations)) {
      const w = r.stage === 'preparing' ? r.prep?.wedding : undefined
      if (w === undefined || w < day || w > day + 7) continue
      add(`genWedding:${r.id}`, fill(lifeText.gen.wedding, { aAnd: withAnd(nm(r.a)), b: nm(r.b) }), lifeText.gen.weddingPlace, FESTIVAL_FROM, FESTIVAL_TO, false, w)
    }
  }
  // 계절 필사 주간 (계획 21 R7): 아직 받지 않았으면 오늘 하루 종일
  if (seasonCopyOpen(day) && !s.flags[seasonCopyKey(day)]) add('seasonCopy', lifeText.meetings.seasonCopy, lifeText.meetings.seasonCopyPlace, 6 * 60, 22 * 60)
  for (let d = day; d <= day + 7; d++) {
    // 마을 소리내어 읽기 모임 (계획 21 R7)
    if (isReadingDay(d) && !readingRest(s, d)) add('reading', lifeText.meetings.reading, lifeText.meetings.readingPlace, READING_FROM, READING_TO, s.flags.readDay === d, d)
    const festival = festivalOf(d)
    if (festival) add('festival', festivals[festival], '장터 모닥불', FESTIVAL_FROM, FESTIVAL_TO, false, d)
    if (isMarketDay(d)) {
      const schedule = content.neighbors.find(n => n.id === 'merchant')?.schedule ?? []
      const first = schedule.find(e => e.tile)
      const end = first && schedule.find(e => e.from > first.from && !e.tile)
      if (first && end) add('market', '장날 · 떠돌이 상인', '장터', first.from, end.from, false, d)
    }
    // 만난 이웃의 생일 (선물하면 마음이 두 배로)
    for (const id of s.notebook?.met ?? []) {
      if (!isBirthday(id, d)) continue
      const role = content.neighbors.find((n) => n.id === id)?.role ?? '이웃'
      add(`birthday:${id}`, `${role} 생일`, '선물 두 배', 6 * 60, 22 * 60, false, d)
    }
    if (d > day && d === BABY_PARTY_DAY && !isWet(weatherOf(d))) {
      const [from, to] = gatheringWindow('babyParty')
      add('gathering', gatherings.babyParty, '빵집 앞', from, to, false, d)
    }
  }
  // 복음서 방 잔치 (비가 와도 연다)
  if (s.flags.gospelFeast === 1) add('gospelFeast', '복음서 방 잔치', '장터 모닥불', FESTIVAL_FROM, FESTIVAL_TO)
  // 스물일곱 권 잔치 (비가 와도 연다)
  if (s.flags.allFeast === 1) add('allFeast', '스물일곱 권 잔치', '장터 모닥불', FESTIVAL_FROM, FESTIVAL_TO)
  const today = s.today
  const role = (id: string) => content.neighbors.find(n => n.id === id)?.role ?? '이웃'
  if (today?.visitor) add('visit', `${role(today.visitor)} 방문`, '내 집 앞', VISIT_FROM, VISIT_TO, today.visitGot)
  if (today?.inviter) add('dinner', `${role(today.inviter)} 저녁 초대`, '초대한 이웃의 집 문', INVITE_FROM, INVITE_TO, today.dined)
  if (today?.gathering) {
    const [from, to] = gatheringWindow(today.gathering)
    add('gathering', gatherings[today.gathering], today.gathering === 'babyParty' ? '빵집 앞' : '언덕', from, to)
  }
  if (s.flags['done:friends'] && !isWet(weatherOf(day))) add('friends', '아이와 양치기 친구', '양 우리 근처', FRIENDS_FROM, FRIENDS_TO)
  // 무지개는 일정에 넣지 않는다 — 비 갠 날 오후에 그냥 뜬다 (2026-10-13 사용자)
  for (const appt of s.plans?.appts ?? []) {
    if (appt.day < day || appt.day > day + 7 || appt.state === 'skipped') continue
    const venue = venueFor(appt)
    const labels = lifeText.plans
    const title = appt.title ?? (appt.activity ? labels.activity[appt.activity] : labels.kind[appt.kind])
    const location = labels.place[venue.place as keyof typeof labels.place] ?? '마을'
    add(appt.id, title, location, appt.from, appt.to, appt.state === 'done', appt.day)
  }
  return events.sort((a, b) => a.day - b.day || a.from - b.from)
}

export function eventStatus(event: ScheduledEvent, day: number, minute: number): string {
  if (event.done) return '참여 완료'
  if (event.day > day) return `${event.day - day}일 뒤`
  if (minute >= event.to || event.day < day) return '종료'
  if (minute >= event.from) return '진행 중'
  const left = Math.ceil(event.from - minute)
  return left >= 60 ? `${Math.floor(left / 60)}시간${left % 60 ? ` ${left % 60}분` : ''} 뒤` : `${left}분 뒤`
}

// ── 한눈에 보는 다음 일정 · 시작 전 알림 ──

/** 알림을 미리 띄우는 시간(분) */
export const ALERT_BEFORE = 30

export const eventName = (e: ScheduledEvent) => (e.id.endsWith(':market') ? '장날' : e.title)

/** 아직 끝나지 않은 가장 가까운 일정 */
/** 하루 종일 펼쳐진 일정 (계절 필사처럼 여덟 시간 넘게) — 미리보기·목록에서 시각이 정해진 일정 뒤로 (2026-10-13 사용자) */
export const isAllDay = (e: Pick<ScheduledEvent, 'from' | 'to'>): boolean => e.to - e.from >= 8 * 60

export function nextEvent(events: readonly ScheduledEvent[], day: number, minute: number): ScheduledEvent | null {
  const open = events.filter((e) => !e.done && (e.day > day || (e.day === day && e.to > minute)))
  // 시각이 정해진 가장 가까운 일정을 먼저 — 하루 종일 일정은 그런 일정이 하나도 없을 때만 (전체 일정 창에는 늘 보인다).
  // 다만 오늘 아직 시작 전인 긴 일정(장날 아침의 07:30~18:00 등)은 다른 날 일정보다 앞에 (2026-10-19 플레이 점검 P14).
  // 이미 진행 중이면 예전처럼 시각이 정해진 일정을 먼저 (2026-10-13)
  const timed = open.find((e) => !isAllDay(e))
  const today = open.find((e) => isAllDay(e) && e.day === day && e.from > minute)
  if (today && (!timed || timed.day > day)) return today
  return timed ?? open[0] ?? null
}

/** 전체 일정 목록 차례: 날짜순, 같은 날은 시각이 정해진 일정을 시작 시각순으로, 하루 종일 일정은 뒤에 */
export function eventsInOrder(events: readonly ScheduledEvent[]): ScheduledEvent[] {
  return [...events].sort((a, b) => a.day - b.day || Number(isAllDay(a)) - Number(isAllDay(b)) || a.from - b.from)
}

/** 상단 한 줄에 쓰는 짧은 안내 */
export function eventSummary(e: ScheduledEvent | null, day: number, minute: number): string {
  if (!e) return '예정된 일정 없음'
  const name = eventName(e)
  if (e.day > day) return `${e.day - day === 1 ? '내일' : `${e.day - day}일 뒤`} ${formatTime(e.from)} ${name}`
  if (minute >= e.from) return `${name} 진행 중 · ${formatTime(e.to)}까지`
  return `오늘 ${formatTime(e.from)} ${name} · ${eventStatus(e, day, minute)}`
}

/**
 * 시계가 before → after(같은 날, 분)로 흐르는 동안 넘은 알림.
 * 한꺼번에 여러 시각을 넘으면(잠·긴 일) 마지막 것만 — 이미 끝난 일정은 알리지 않는다.
 */
export function alertsBetween(events: readonly ScheduledEvent[], day: number, before: number, after: number): string[] {
  const out: string[] = []
  for (const e of events) {
    if (e.day !== day || e.done || after >= e.to) continue
    const name = eventName(e)
    if (before < e.from && e.from <= after) out.push(`${name} 시작! · ${e.location}`)
    else if (before < e.from - ALERT_BEFORE && e.from - ALERT_BEFORE <= after) out.push(`${ALERT_BEFORE}분 뒤 ${name} · ${e.location}`)
  }
  return out
}
