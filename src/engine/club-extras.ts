// 소모임 덧붙임 (2026-10-08): 계절마다 다른 고르기 하나 · 만든 음식을 차 모임에 나누기 · 주민 근황에 함께하기(기억)
// 모두 소모임 기록(clubSessions)에 한 번씩만 — 저장 정리는 sanitizeClubSessions가 모양만 보고 덧붙은 칸은 그대로 둔다.
import { seasonOf } from './clock'
import type { ClubSession } from './clubs'
import { heartUp, recordExperienceIn, type GameState } from './game'
import { COOKED_ITEMS, count, take } from './items'
import type { ItemId, Season } from './types'


const sessionOf = (s: GameState, id: string): ClubSession | undefined => s.clubSessions?.[id]
const appt = (s: GameState, id: string) => s.plans.appts.find((a) => a.id === id)

/** 오늘 계절 (계절마다 다른 고르기 하나를 붙인다 — 문구는 clubs.seasonChoice[활동][계절]) */
export const clubSeason = (s: Pick<GameState, 'clock'>): Season => seasonOf(s.clock.day)

/** 차 모임에 나눌 수 있는 만든 음식 (가방에 있는 것, 표 순서) */
export function clubDishes(s: Pick<GameState, 'inv'>): ItemId[] {
  return COOKED_ITEMS.filter((id) => count(s.inv, id) > 0)
}
export function canShareClubDish(s: GameState, id: string): boolean {
  const run = sessionOf(s, id)
  const a = appt(s, id)
  return !!run && !!a && a.activity === 'tea' && run.step === 'activity' && !run.shared && clubDishes(s).length > 0
}
/** 만든 음식 하나를 차 모임에 나눈다: 가방에서 하나, 함께한 이웃마다 마음 +1, 함께 먹은 기억 */
export function shareClubDish(s: GameState, id: string, dish: ItemId): GameState {
  if (!canShareClubDish(s, id) || count(s.inv, dish) < 1) return s
  const a = appt(s, id)!
  const run = sessionOf(s, id)!
  const inv = take(s.inv, { [dish]: 1 })
  if (!inv) return s
  let next: GameState = { ...s, inv, clubSessions: { ...s.clubSessions, [id]: { ...run, shared: dish } } }
  const with_ = a.startedWith ?? a.members ?? []
  for (const npc of with_) next = heartUp(next, npc, 1)
  if (with_.length) next = recordExperienceIn(next, { id: `clubMeal:${id}`, kind: 'meal', with: [...with_] })
  return next
}

/** 주민 근황에 함께하기: 그 소식을 꺼낸 이웃과 기억 하나, 마음 +2 — 모임마다 한 번 */
export function canJoinNews(s: GameState, id: string, npc: string): boolean {
  const run = sessionOf(s, id)
  return !!run && !run.joinedNews && !!npc
}
export function joinNews(s: GameState, id: string, npc: string): GameState {
  if (!canJoinNews(s, id, npc)) return s
  const run = sessionOf(s, id)!
  let next: GameState = { ...s, clubSessions: { ...s.clubSessions, [id]: { ...run, joinedNews: npc } } }
  next = heartUp(next, npc, 2)
  return recordExperienceIn(next, { id: `clubNews:${id}`, kind: 'club', with: [npc] })
}
