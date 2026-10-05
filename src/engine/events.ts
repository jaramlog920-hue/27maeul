import { venueFor } from './plans'
import lifeText from '../content/life-text.json'
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf } from './calendar'
import { BABY_PARTY_DAY, gatheringWindow, VISIT_FROM, VISIT_TO, INVITE_FROM, INVITE_TO, FRIENDS_FROM, FRIENDS_TO } from './bonds'
import { lessonTime, type GameState } from './game'
import { formatTime, seasonOf } from './clock'
import { LESSON_FROM, LESSON_TO } from './stories'
import type { GameContent } from './types'
import { isBirthday } from './notebook'

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
export function scheduledEvents(s: Pick<GameState, 'clock' | 'today' | 'flags'> & Partial<Pick<GameState, 'notebook' | 'plans'>>, content: GameContent): ScheduledEvent[] {
  const events: ScheduledEvent[] = []
  const day = s.clock.day
  const add = (id: string, title: string, location: string, from: number, to: number, done = false, onDay = day) => {
    events.push({ id: `${onDay}:${id}`, day: onDay, title, location, from, to, done })
  }
  for (let d = day; d <= day + 7; d++) {
    const festival = festivalOf(d)
    if (festival) add('festival', festivals[festival], '장터 모닥불 · 특별 장면은 18:30부터', FESTIVAL_FROM, FESTIVAL_TO, false, d)
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
      add(`birthday:${id}`, `${role} 생일`, '선물하면 마음이 두 배', 6 * 60, 22 * 60, false, d)
    }
    if (d > day && d === BABY_PARTY_DAY && !isWet(weatherOf(d))) {
      const [from, to] = gatheringWindow('babyParty')
      add('gathering', gatherings.babyParty, '빵집 앞', from, to, false, d)
    }
  }
  // 복음서 방 잔치 (비가 와도 연다)
  if (s.flags.gospelFeast === 1) add('gospelFeast', '복음서 방 잔치', '장터 모닥불 · 특별 장면은 18:30부터', FESTIVAL_FROM, FESTIVAL_TO)
  // 스물일곱 권 잔치 (비가 와도 연다)
  if (s.flags.allFeast === 1) add('allFeast', '스물일곱 권 잔치', '장터 모닥불 · 특별 장면은 18:30부터', FESTIVAL_FROM, FESTIVAL_TO)
  const today = s.today
  const role = (id: string) => content.neighbors.find(n => n.id === id)?.role ?? '이웃'
  if (today?.visitor) add('visit', `${role(today.visitor)} 방문`, '내 집 앞', VISIT_FROM, VISIT_TO, today.visitGot)
  if (today?.inviter) add('dinner', `${role(today.inviter)} 저녁 초대`, '초대한 이웃의 집 문', INVITE_FROM, INVITE_TO, today.dined)
  if (today?.gathering) {
    const [from, to] = gatheringWindow(today.gathering)
    add('gathering', gatherings[today.gathering], today.gathering === 'babyParty' ? '빵집 앞' : '언덕', from, to)
  }
  if (lessonTime({ ...s, clock: { day, minute: LESSON_FROM } })) add('lesson', '아이와 글자 공부', '내 집 안', LESSON_FROM, LESSON_TO)
  if (s.flags['done:friends'] && !isWet(weatherOf(day))) add('friends', '아이와 양치기 친구', '양 우리 근처', FRIENDS_FROM, FRIENDS_TO)
  if (seasonOf(day) === 'autumn' && weatherOf(day) === 'rain') add('rainbow', '비 오는 날 무지개', '집 밖', 16 * 60, 17.5 * 60)
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
export function nextEvent(events: readonly ScheduledEvent[], day: number, minute: number): ScheduledEvent | null {
  return events.find((e) => !e.done && (e.day > day || (e.day === day && e.to > minute))) ?? null
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
