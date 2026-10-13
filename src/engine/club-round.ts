// 모임·행사 한 판 (2026-10-13 사용자: 차 따라 주기처럼 길게 — 다른 모임·행사도 같은 방식, 끝에 결과 창).
// 함께 온 이웃마다 한 차례: 이웃이 바라는 것을 말하고 → 맞게 해 준다 → 이웃의 한마디. 맞추면 마음이 조금 오른다.
// 'hold'는 누르고 있다가 알맞은 구간에서 놓기, 'pick'은 셋 중 이웃이 바라는 것 고르기. 못 맞춰도 불이익은 없다.
// 진행은 손일 진행(GroupTaskProgress)에 그대로 남긴다: selection = 차례마다 '1'(맞음)·'0', 다 끝나면 stage 3.
import { FESTIVAL_FROM, FESTIVAL_TO, festivalOf } from './calendar'
import { heartUp, type GameState } from './game'
import type { GroupTaskProgress } from './group-task'
import { GAIN } from './hearts'
import { FESTIVAL_SPOTS, FIRE } from './neighbors'
import { canAttendAppt } from './plans'

export type RoundKind = 'tea' | 'sew' | 'garden' | 'observe' | 'read' | 'cook' | 'paint' | 'music' | 'housewarming' | 'showcase' | 'festivalFood' | 'festivalDeco' | 'festivalTidy'
export const ROUND_MODE: Record<RoundKind, 'hold' | 'pick'> = {
  tea: 'hold', cook: 'hold', festivalFood: 'hold', housewarming: 'hold',
  sew: 'pick', garden: 'pick', observe: 'pick', read: 'pick', paint: 'pick', music: 'pick', showcase: 'pick', festivalDeco: 'pick', festivalTidy: 'pick',
}
/** 누르고 있다 놓는 막대(0~100)의 세 구간 */
export const HOLD_BANDS: readonly (readonly [number, number])[] = [[18, 42], [42, 66], [66, 90]]

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
/** 이웃이 이 일에서 바라는 것 (0·1·2) — 사람마다, 일마다 늘 같다 */
export function wantOf(npc: string, kind: RoundKind): 0 | 1 | 2 {
  return (hash(npc + ':' + kind) % 3) as 0 | 1 | 2
}
export const holdHit = (want: number, amount: number) => amount >= HOLD_BANDS[want][0] && amount <= HOLD_BANDS[want][1]
/** 놓은 값이 어느 구간인가 (모자람 -1, 넘침 3) */
export const holdZone = (amount: number) => (amount < HOLD_BANDS[0][0] ? -1 : amount > HOLD_BANDS[2][1] ? 3 : HOLD_BANDS.findIndex(([a, b]) => amount >= a && amount <= b))

/** 이 판의 진행 (모임·행사·잔치 역할 모두) */
export function roundTask(s: Pick<GameState, 'plans' | 'clubSessions' | 'fests'>, id: string): GroupTaskProgress | undefined {
  const a = s.plans.appts.find((x) => x.id === id)
  if (a?.clubId) return s.clubSessions?.[id]?.task
  const f = (s.fests ?? []).find((x) => (a ? x.id === a.festId : x.id === id))
  return f?.task
}
export const roundMarks = (s: Pick<GameState, 'plans' | 'clubSessions' | 'fests'>, id: string): string => roundTask(s, id)?.selection?.replace(/[^01]/g, '') ?? ''
export const roundDone = (s: Pick<GameState, 'plans' | 'clubSessions' | 'fests'>, id: string) => (roundTask(s, id)?.stage ?? 0) >= 3

/** 지금 이 판을 할 수 있는 곳에 있는가 (원래 손일과 같은 조건) */
function canPlay(s: GameState, id: string): boolean {
  if ((s.map ?? 'village') !== 'village') return false
  const a = s.plans.appts.find((x) => x.id === id)
  if (!a) {
    const f = (s.fests ?? []).find((x) => x.id === id && x.kind === 'festival' && !x.closed && x.day === s.clock.day)
    return !!f && !!festivalOf(s.clock.day) && s.clock.minute >= FESTIVAL_FROM && s.clock.minute < FESTIVAL_TO && Math.abs(Math.round(s.player.x) - FIRE.x) + Math.abs(Math.round(s.player.y) - FIRE.y) <= 4
  }
  if (!a.attended || !canAttendAppt(s, id)) return false
  if (a.clubId) {
    const run = s.clubSessions[id]
    return !!run && run.step === 'activity'
  }
  const f = (s.fests ?? []).find((x) => x.id === a.festId)
  return !!f && !!f.joined && !f.closed && f.step === 'activity'
}

function setTask(s: GameState, id: string, task: GroupTaskProgress): GameState {
  const a = s.plans.appts.find((x) => x.id === id)
  if (a?.clubId) return { ...s, clubSessions: { ...s.clubSessions, [id]: { ...s.clubSessions[id], task } } }
  const fid = a ? a.festId : id
  return { ...s, fests: s.fests.map((x) => (x.id === fid ? { ...x, task } : x)) }
}

/**
 * 한 차례: guests 중 지금 차례의 이웃에게 value(누른 양 0~100 또는 고른 번호)를 건넨다.
 * 맞으면 그 이웃 마음이 오른다. 마지막 차례면 stage 3 (원래 손일을 마친 것과 같다)
 */
export function playRound(s: GameState, id: string, kind: RoundKind, guests: readonly string[], value: number): { state: GameState; good: boolean } {
  const marks = roundMarks(s, id)
  const npc = guests[marks.length]
  if (!npc || roundDone(s, id) || !canPlay(s, id)) return { state: s, good: false }
  const want = wantOf(npc, kind)
  const good = ROUND_MODE[kind] === 'hold' ? holdHit(want, value) : value === want
  const next = marks + (good ? '1' : '0')
  const prev = roundTask(s, id)
  let state = setTask(s, id, { stage: next.length >= guests.length ? 3 : 0, choice: prev?.choice ?? npc, selection: next })
  if (good) state = heartUp(state, npc, GAIN.help)
  return { state, good }
}

/** 약속(모임·행사)에 함께 온 이웃 — 셋까지, 이 차례대로 */
export function apptGuests(s: Pick<GameState, 'plans' | 'fests'>, id: string): string[] {
  const a = s.plans.appts.find((x) => x.id === id)
  const f = a?.festId ? (s.fests ?? []).find((x) => x.id === a.festId) : undefined
  return (a?.startedWith ?? a?.members ?? f?.members ?? []).slice(0, 3)
}

/** 잔치 모닥불 곁에 와 있는 이웃 (잔치 역할의 한 판) — 셋까지 */
export function fireGuests(s: Pick<GameState, 'npcs'>): string[] {
  return Object.entries(FESTIVAL_SPOTS)
    .filter(([npc, spot]) => {
      const n = s.npcs[npc]
      return n?.visible && Math.abs(Math.round(n.x) - spot.x) + Math.abs(Math.round(n.y) - spot.y) <= 2
    })
    .map(([npc]) => npc)
    .slice(0, 3)
}

/** 차례가 끝난 뒤 결과 줄에 쓸 씨앗 — 같은 판이면 같고, 날·모임마다 다르다 */
export const roundSeed = (day: number, id: string) => hash(`${day}:${id}`)
