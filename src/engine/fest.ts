// 내가 준비하는 작은 행사 (계획 16 작업 16, 기획 05): 차 모임·집들이·함께 만든 것 보여 주기·계절 잔치 준비 역할.
// 초대·일정·참석·정산은 소모임과 같은 약속 엔진(plans.ts, kind 'event' — 한 번만)을 그대로 쓴다.
// 준비 점수·등급·불참 불이익 없음. 보관분(간식·장식)은 가방과 따로 두고, 쓴 것만 한 번 빠지고 나머지는 돌려준다.
// 필사·책상·서고에는 아무 조건도 걸지 않는다.
import { scheduleAppt, attendAppt, settleAppt, venueFor, type Appt } from './plans'
import { clubCandidates, clubVenues, CLUB_SLOTS, type ClubSlot } from './clubs'
import { passTime, recordExperienceIn, syncHome, type GameState } from './game'
import { OUTDOOR_PLACES } from './village-sites'
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { addGift, has, take, type Inventory } from './items'
import { isBirthday } from './notebook'
import { personOf } from './people'
import { placement } from './room'
import { guestStands } from './spaces'
import { CRADLE_SPOT, HELPER_SPOTS } from './child'
import { FESTIVAL_SPOTS, FIRE } from './neighbors'
import { HEARTH_STAND, HOME_ENTRY, homeRect, isHome, PET_HOME, START } from './world'
import lifeText from '../content/life-text.json'
import neighborsRaw from '../content/neighbors.json'
import type { Furniture } from './room'
import type { GameContent, ItemId, PlaceId, Tile } from './types'

export type FestKind = 'tea'|'housewarming'|'showcase'|'festival'
export type FestStep = 'tidy'|'arrive'|'activity'|'talk'|'finish'|'done'
export type FestRole = 'food'|'deco'|'tidy'
export const FEST_STEPS: readonly FestStep[] = ['tidy','arrive','activity','talk','finish','done']
/** 며칠 안의 날짜만 (기획 기본값) */
export const FEST_DAYS_AHEAD = 7
/** 행사 시간: 시작부터 이 분이 지나면 이 단계 (늦게 오면 진행 중인 단계부터) */
const STEP_AT: readonly [FestStep, number][] = [['tidy',0],['arrive',15],['activity',30],['talk',70],['finish',100]]
/** 특별 간식: 가방에 있는 것만 (없으면 기본 차와 간식으로 연다) */
export const FEST_SNACKS: readonly ItemId[] = ['bread','fig','grapes','honey']
/** 장식: 가진 생활 장식(없으면 기본 천) — 행사가 끝나면 그대로 돌아온다 */
export const FEST_DECOR: readonly ItemId[] = ['vase','dryFlowers','candle','teapot','fruitBowl','cushion','pillows']
/** 보태기를 부탁할 수 있는 이웃(기획 05 §6) — 부탁해도 손님으로 앉는다. 가방에 물건이 생기지 않는다 */
export const FEST_HELP: Readonly<Record<string,'snack'|'tea'|'cloth'|'prop'|'invite'>> = {
 baker:'snack', wendell:'snack', poppy:'tea', basil:'tea', weaver:'cloth', penelope:'cloth', carpenter:'prop', tilly:'prop', postman:'invite',
}
const FEST_PLACES: Record<Exclude<FestKind,'festival'|'housewarming'>, readonly PlaceId[]> = { tea:['hallTable','teaTable','pavilion','commonBench','shadeSpot'], showcase:['hallTable','teaTable'] }

export interface Fest {
 id: string; kind: FestKind; day: number; place: PlaceId; alt?: PlaceId; members: string[]
 /** 약속 엔진의 회차 (계절 잔치 준비는 마을 잔치 그대로라 없음) */
 apptId?: string
 snack?: ItemId; deco?: ItemId; help?: string[]; role?: FestRole; work?: string; birthday?: string
 /** 행사 보관분 — 가방과 따로. 끝나거나 취소하면 남은 것을 돌려준다 */
 reserve: Inventory
 step: FestStep; picked?: string; joined: boolean; consumed: boolean; closed: boolean; cancelled: boolean
}
export interface FestInput {
 kind: FestKind; day: number; slot?: ClubSlot; place?: PlaceId; alt?: PlaceId; members: string[]
 snack?: ItemId; deco?: ItemId; help?: string[]; role?: FestRole; work?: string
}

const fests = (s: Pick<GameState,'fests'>) => s.fests ?? []
const apptOf = (s: GameState, f: Fest) => f.apptId ? s.plans.appts.find(a => a.id === f.apptId) : undefined
const withFest = (s: GameState, id: string, change: Partial<Fest>): GameState => ({ ...s, fests: fests(s).map(f => f.id === id ? { ...f, ...change } : f) })

/** 집들이 자리: 집 안 바닥 중 가구 놓기 규칙으로도 놓을 수 있는 칸(서는 자리·문·통로를 막지 않음), 화덕 쪽부터 */
export function homeSeats(s: Pick<GameState,'room'|'homeLevel'|'flags'|'romance'> & Partial<Pick<GameState,'spaces'>>, n: number): Tile[] {
 syncHome(s)
 const { x0, y0, x1, y1 } = homeRect()
 // 동물·아기·돕는 아이 자리, 기록자가 깨어 서는 칸, 들어오는 칸과 그 둘레(문에서 들어오는 길)는 비워 둔다
 const around = (t: Tile) => [t, { x: t.x + 1, y: t.y }, { x: t.x - 1, y: t.y }, { x: t.x, y: t.y - 1 }]
 const avoid = [PET_HOME, CRADLE_SPOT, START, ...around(HOME_ENTRY), ...HELPER_SPOTS.map(h => h.at)]
 const tiles: Tile[] = []
 for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) tiles.push({ x, y })
 tiles.sort((a, b) => Math.abs(a.x - HEARTH_STAND.x) + Math.abs(a.y - HEARTH_STAND.y) - (Math.abs(b.x - HEARTH_STAND.x) + Math.abs(b.y - HEARTH_STAND.y)) || a.y - b.y || a.x - b.x)
 let room: Furniture[] = [...s.room]
 // 정해 둔 차 자리·쉼터가 있으면 손님은 그 자리의 의자 앞에 먼저 앉는다 (작업 23). 없거나 모자라면 아래 기본 자리
 const out: Tile[] = guestStands(s, n, avoid)
 for (const t of out) { const seat = placement(room, 'stool', t); if (seat) room = [...room, seat] }
 for (const t of tiles) {
  if (out.length >= n) break
  if (!isHome(t) || avoid.some(a => a.x === t.x && a.y === t.y) || out.some(a => a.x === t.x && a.y === t.y)) continue
  // 손님 한 명 = 1칸 의자 하나를 놓는 것과 같은 규칙: 놓은 뒤에도 집 안 모든 자리에 갈 수 있어야 한다
  const seat = placement(room, 'stool', t)
  if (!seat) continue
  room = [...room, seat]
  out.push(t)
 }
 return out
}

/** 보여 줄 수 있는 함께 만든 것: 모임 작품, 함께 만들기·일하기·배우기·마을 가꾸기 기억 */
export function festWorks(s: GameState): { id: string; kind: string; with: string[] }[] {
 const works = Object.entries(s.clubWorks ?? {}).map(([club]) => ({ id: `clubWork:${club}`, kind: 'clubWork', with: s.plans.appts.find(a => a.clubId === club)?.startedWith ?? [] }))
 const shared = Object.values(s.life?.experiences ?? {}).filter(e => ['make','work','learn','project'].includes(e.kind) && e.with.length).map(e => ({ id: e.id, kind: e.kind, with: e.with }))
 return [...works, ...shared]
}

/** 준비 역할을 고를 수 있는 잔치 날 (며칠 안, 아직 고르지 않은 날) */
export function festivalDays(s: GameState): number[] {
 const out: number[] = []
 for (let d = s.clock.day; d <= s.clock.day + FEST_DAYS_AHEAD; d++) {
  if (!festivalOf(d) || (d === s.clock.day && s.clock.minute >= FESTIVAL_TO)) continue
  if (fests(s).some(f => f.kind === 'festival' && f.day === d && !f.closed)) continue
  out.push(d)
 }
 return out
}

/** 지금 열 수 있는 행사 종류만 (빈 메뉴를 보이지 않는다) */
export function festKinds(s: GameState, content: GameContent): FestKind[] {
 const anyone = clubCandidates(s, content).length > 0
 const out: FestKind[] = []
 if (anyone && clubVenues(s, 'tea').length) out.push('tea')
 if (anyone && homeSeats(s, 1).length) out.push('housewarming')
 if (anyone && festWorks(s).length) out.push('showcase')
 if (festivalDays(s).length) out.push('festival')
 return out
}
export function festVenues(s: GameState, kind: FestKind): PlaceId[] {
 if (kind === 'housewarming') return ['hearth']
 if (kind === 'festival') return []
 const open = clubVenues(s, 'tea')
 return FEST_PLACES[kind].filter(p => open.includes(p))
}
/** 장소 크기: 집들이는 놓을 수 있는 자리 수만큼(셋 이내) */
export function festCapacity(s: GameState, kind: FestKind): number {
 return kind === 'housewarming' ? homeSeats(s, 3).length : 3
}

export function createFest(s: GameState, input: FestInput, content: GameContent): { state: GameState; error?: string; id?: string } {
 if (input.day < s.clock.day || input.day > s.clock.day + FEST_DAYS_AHEAD) return { state: s, error: 'date' }
 const reserve: Inventory = { ...(input.snack ? { [input.snack]: 1 } : {}), ...(input.deco ? { [input.deco]: 1 } : {}) }
 if ((input.snack && !FEST_SNACKS.includes(input.snack)) || (input.deco && !FEST_DECOR.includes(input.deco))) return { state: s, error: 'stock' }
 if (!has(s.inv, reserve)) return { state: s, error: 'stock' }
 const id = `fest:${Math.max(0, ...fests(s).map(f => Number(f.id.split(':')[1]) || 0)) + 1}`
 const base = { id, kind: input.kind, day: input.day, reserve, step: 'tidy' as const, joined: false, consumed: false, closed: false, cancelled: false, ...(input.snack ? { snack: input.snack } : {}), ...(input.deco ? { deco: input.deco } : {}) }
 if (input.kind === 'festival') {
  if (!festivalDays(s).includes(input.day)) return { state: s, error: 'festival' }
  if (!input.role || !['food','deco','tidy'].includes(input.role)) return { state: s, error: 'role' }
  const fest: Fest = { ...base, place: 'bench', members: [], role: input.role }
  return { state: { ...s, inv: take(s.inv, reserve)!, fests: [...fests(s), fest] }, id }
 }
 const members = [...new Set(input.members)]
 const candidates = clubCandidates(s, content)
 if (!members.length || members.length > festCapacity(s, input.kind) || members.some(m => !candidates.includes(m))) return { state: s, error: 'members' }
 if ((input.help ?? []).some(h => !members.includes(h) || !FEST_HELP[h])) return { state: s, error: 'help' }
 if (input.kind === 'showcase' && !festWorks(s).some(w => w.id === input.work)) return { state: s, error: 'work' }
 const place: PlaceId = input.kind === 'housewarming' ? 'hearth' : input.place ?? 'hallTable'
 if (!festVenues(s, input.kind).includes(place)) return { state: s, error: 'venue' }
 // 야외는 실내 대체 자리를 미리 정한다
 if (OUTDOOR_PLACES.includes(place) && (!input.alt || !['hallTable','teaTable'].includes(input.alt))) return { state: s, error: 'alt' }
 const slot = input.slot && input.slot in CLUB_SLOTS ? input.slot : 'afternoon'
 const [from, to] = CLUB_SLOTS[slot]
 const seats = input.kind === 'housewarming' ? homeSeats(s, members.length) : undefined
 if (seats && seats.length < members.length) return { state: s, error: 'venue' }
 const result = scheduleAppt(s, {
  kind: 'event', festId: id, title: lifeText.fest.kind[input.kind], day: input.day, from, to, place, members,
  activity: input.kind === 'showcase' ? 'make' : 'tea',
  ...(OUTDOOR_PLACES.includes(place) ? { alt: input.alt } : {}),
  ...(seats ? { seats, requiresPlayer: true } : {}),
 }, content)
 if (!result.appt) return { state: s, error: typeof result.blocked === 'object' ? result.blocked.busy : String(result.blocked) }
 const birthday = members.find(m => isBirthday(m, input.day))
 const fest: Fest = {
  ...base, place, members, apptId: result.appt.id,
  ...(OUTDOOR_PLACES.includes(place) ? { alt: input.alt } : {}),
  ...(input.help?.length ? { help: [...new Set(input.help)] } : {}),
  ...(input.kind === 'showcase' ? { work: input.work } : {}),
  ...(birthday ? { birthday } : {}),
 }
 return { state: { ...result.state, inv: take(s.inv, reserve)!, fests: [...fests(s), fest] }, id }
}

/** 남은 보관분을 가방으로 돌려주고 닫는다 (한 번만) */
function closeOut(s: GameState, f: Fest, change: Partial<Fest> = {}): GameState {
 if (f.closed) return s
 return { ...withFest(s, f.id, { ...change, reserve: {}, closed: true }), inv: addGift(s.inv, f.reserve) }
}

/** 취소 또는 "이번 약속 마치기": 보관분은 모두 돌아오고, 관계·마음은 그대로 */
export function cancelFest(s: GameState, id: string): GameState {
 const f = fests(s).find(f => f.id === id)
 const a = f && apptOf(s, f)
 if (!f || f.closed || a?.state === 'running' || a?.state === 'done') return s
 const next = a ? { ...s, plans: { ...s.plans, appts: s.plans.appts.map(x => x.id === a.id ? { ...x, state: 'skipped' as const } : x) } } : s
 return closeOut(next, f, { cancelled: true })
}

/** 다른 날로 다시 잡기 (기다리는 집들이·건너뛴 행사도) — 같은 행사 id, 새 회차 */
export function postponeFest(s: GameState, id: string, day: number, slot: ClubSlot, content: GameContent): { state: GameState; error?: string } {
 const f = fests(s).find(f => f.id === id)
 const a = f && apptOf(s, f)
 if (!f || !a || f.closed || a.state === 'running' || a.state === 'done') return { state: s, error: 'time' }
 if (day < s.clock.day || day > s.clock.day + FEST_DAYS_AHEAD) return { state: s, error: 'date' }
 const [from, to] = CLUB_SLOTS[slot]
 const base: GameState = { ...s, plans: { ...s.plans, appts: s.plans.appts.map(x => x.id === a.id ? { ...x, state: 'skipped' as const } : x) } }
 const seats = f.kind === 'housewarming' ? homeSeats(s, f.members.length) : undefined
 if (seats && seats.length < f.members.length) return { state: s, error: 'venue' }
 const { id: _old, state: _state, rewarded: _r, remembered: _m, startedWith: _w, attended: _at, movedFrom: _mf, reason: _re, ...rest } = a
 void _old; void _state; void _r; void _m; void _w; void _at; void _mf; void _re
 const result = scheduleAppt(base, { ...rest, day, from, to, ...(seats ? { seats } : {}) }, content)
 if (!result.appt) return { state: s, error: typeof result.blocked === 'object' ? result.blocked.busy : String(result.blocked) }
 const birthday = f.members.find(m => isBirthday(m, day))
 return { state: withFest(result.state, id, { day, apptId: result.appt.id, step: 'tidy', joined: false, birthday }) }
}

/** 이번 회차가 건너뛰어져 다시 잡거나 마칠 차례 (집에 없던 집들이 등) — 놓친 목록이 아니라 고를 일 하나 */
export function festWaiting(s: GameState, f: Fest): boolean {
 return !f.closed && f.kind !== 'festival' && apptOf(s, f)?.state === 'skipped'
}

function stepByTime(a: Appt, minute: number): FestStep {
 let step: FestStep = 'tidy'
 for (const [k, at] of STEP_AT) if (minute - a.from >= at) step = k
 return step
}
const later = (a: FestStep, b: FestStep) => FEST_STEPS.indexOf(a) >= FEST_STEPS.indexOf(b) ? a : b

/** 지금 이 자리에서 열린 행사 */
export function festHere(s: GameState, place: PlaceId): Fest | undefined {
 return fests(s).find(f => {
  const a = apptOf(s, f)
  return !f.closed && !!a && a.state === 'running' && a.day === s.clock.day && s.clock.minute >= a.from && s.clock.minute < a.to && venueFor(a).place === place
 })
}
/** 지금 진행 중인 행사 (어느 자리든) */
export function festRunning(s: GameState): Fest | undefined {
 return fests(s).find(f => { const a = apptOf(s, f); return !f.closed && a?.state === 'running' })
}

/** 함께하기: 자리 곁에 있어야 하고(가까이 있다고 저절로 참여하지 않음), 늦으면 진행 중인 단계부터 */
export function joinFest(s: GameState, id: string): GameState {
 const f = fests(s).find(f => f.id === id)
 const a = f && apptOf(s, f)
 if (!f || !a || f.closed) return s
 const next = attendAppt(s, a.id)
 if (!next.plans.appts.find(x => x.id === a.id)?.attended) return s
 return withFest(next, id, { joined: true, step: later(f.step, stepByTime(a, s.clock.minute)) })
}

/** 고를 수 있는 것: 차 모임은 간식, 집들이는 보여 줄 물건, 작품 소개는 펼치는 방식. 'basic'은 언제나 */
export function festChoices(s: GameState, f: Fest): string[] {
 const snack = f.snack && f.reserve[f.snack] ? [f.snack] : []
 if (f.kind === 'tea') return [...snack, 'basic']
 if (f.kind === 'housewarming') return [...snack, ...[...new Set<string>(s.room.map(r => r.item).filter(i => !i.startsWith('home') && !i.startsWith('spouse:')))].slice(0, 4), 'basic']
 if (f.kind === 'showcase') return ['show', 'story', 'basic']
 return ['basic']
}

/** 다음 단계로. 함께하기(activity)에선 고른 것을 받는다 — 고른 간식만 한 번 빠진다 */
export function festStep(s: GameState, id: string, choice?: string): GameState {
 const f = fests(s).find(f => f.id === id)
 const a = f && apptOf(s, f)
 if (!f || !a || f.closed || !f.joined || a.state !== 'running' || f.step === 'finish' || f.step === 'done') return s
 if (f.step === 'activity') {
  if (!choice || !festChoices(s, f).includes(choice)) return s
  const served = !!f.snack && choice === f.snack && !f.consumed
  const reserve = served ? take(f.reserve, { [f.snack!]: 1 }) ?? f.reserve : f.reserve
  return withFest(s, id, { step: 'talk', picked: choice, ...(served ? { consumed: true, reserve } : {}) })
 }
 return withFest(s, id, { step: FEST_STEPS[FEST_STEPS.indexOf(f.step) + 1] })
}

/** 마무리: 남은 시간을 보내고 한 번 정산(참석한 이웃만 기억, 마음은 상한), 보관분 회수 */
export function festFinish(s: GameState, id: string): GameState {
 const f = fests(s).find(f => f.id === id)
 const a = f && apptOf(s, f)
 if (!f || !a || f.closed || f.step !== 'finish' || a.state !== 'running' || !a.attended) return s
 let next = passTime(s, Math.max(0, a.to - s.clock.minute))
 next = settleAppt(next, a.id)
 const now = fests(next).find(x => x.id === id) ?? f
 return closeOut(next, now, { step: 'done' })
}

export interface FestReaction { npc: string; kind: 'birthday'|'help'|'likeItem'|'memory'|'likes'|'quiet'|'new'; item?: string; memory?: string }
/** 참석한 이웃의 반응: 생일 → 보태 준 것 → 좋아하는 물건 → 함께한 기억 → 생활 취향 (무작위 없음) */
export function festReactions(s: GameState, f: Fest): (FestReaction & { text: string })[] {
 const a = apptOf(s, f)
 const who = a?.startedWith ?? f.members
 const item = (f.kind === 'tea' || f.kind === 'housewarming') && f.picked && f.picked !== 'basic' ? f.picked : undefined
 const activity = f.kind === 'showcase' ? 'make' : 'tea'
 return who.map(npc => {
  let r: FestReaction
  const p = personOf(npc)
  const shared = Object.values(s.life?.experiences ?? {}).filter(e => e.id !== f.id && e.with.includes(npc) && e.kind !== 'gift').sort((x, y) => (y.last ?? 0) - (x.last ?? 0))[0]
  if (f.birthday === npc) r = { npc, kind: 'birthday' }
  else if (f.help?.includes(npc)) r = { npc, kind: 'help' }
  else if (item && likesItem(npc, item)) r = { npc, kind: 'likeItem', item }
  else if (shared) r = { npc, kind: 'memory', memory: shared.kind }
  else if (p?.tastes?.activity?.[activity] === 1) r = { npc, kind: 'likes' }
  else if (p?.tastes?.activity?.[activity] === -1 || (p?.tastes?.size?.many === -1 && who.length >= 3)) r = { npc, kind: 'quiet' }
  else r = { npc, kind: 'new' }
  return { ...r, text: reactionText(r, f, npc) }
 })
}
/** 이웃 선물 취향(neighbors.json likes)에 든 물건인가 */
const likesItem = (npc: string, item: string) => !!(neighborsRaw as { id: string; likes?: string[] }[]).find(n => n.id === npc)?.likes?.includes(item)

function reactionText(r: FestReaction, f: Fest, npc: string): string {
 const R = lifeText.fest.react
 if (r.kind === 'help') return personOf(npc)?.festLines?.help ?? R.help
 if (r.kind === 'likeItem') return R.likeItem.replace('{item}', (lifeText.items as Record<string, { name: string }>)[r.item!]?.name ?? '')
 if (r.kind === 'memory') return R.memory.replace('{kind}', (lifeText.taste.kinds as Record<string, string>)[r.memory!] ?? lifeText.taste.kinds.event)
 if (r.kind === 'likes') return R.likes[f.kind === 'showcase' ? 'showcase' : f.kind === 'housewarming' ? 'housewarming' : 'tea']
 return R[r.kind]
}

/** 계절 잔치 준비 역할: 잔치 저녁에 모닥불 곁(네 칸 안)에 있으면 맡은 일을 할 수 있다 */
export function festivalRoleReady(s: GameState): Fest | null {
 const f = fests(s).find(f => f.kind === 'festival' && !f.closed && f.day === s.clock.day)
 if (!f || !festivalOf(s.clock.day) || s.clock.minute < FESTIVAL_FROM || s.clock.minute >= FESTIVAL_TO) return null
 const me = { x: Math.round(s.player.x), y: Math.round(s.player.y) }
 return Math.abs(me.x - FIRE.x) + Math.abs(me.y - FIRE.y) <= 4 ? f : null
}
/** 맡은 일 한 번: 잔치 자리에 실제로 와 있는 이웃만 기억, 음식 역할의 간식만 한 번 빠진다. 잔치 자체·잔치 보상은 그대로 */
export function doFestivalRole(s: GameState, id: string): GameState {
 const f = festivalRoleReady(s)
 if (!f || f.id !== id) return s
 const present = Object.entries(FESTIVAL_SPOTS).filter(([npc, spot]) => {
  const n = s.npcs[npc]
  return !!n?.visible && Math.abs(Math.round(n.x) - spot.x) + Math.abs(Math.round(n.y) - spot.y) <= 2
 }).map(([npc]) => npc)
 const served = f.role === 'food' && !!f.snack && !!f.reserve[f.snack]
 const reserve = served ? take(f.reserve, { [f.snack!]: 1 }) ?? f.reserve : f.reserve
 let next = recordExperienceIn(s, { id: f.id, kind: 'event', with: present, place: 'bench' })
 next = withFest(next, id, { reserve, consumed: served, joined: true, members: present, step: 'done' })
 return closeOut(next, fests(next).find(x => x.id === id)!)
}

/** 매 틱(advancePlans 끝): 끝난 회차의 보관분 회수, 지난 잔치 준비는 닫기 — 이유 없이 사라지거나 두 번 빠지지 않는다 */
export function settleFests(s: GameState): GameState {
 let next = s
 for (const f of fests(s)) {
  if (f.closed) continue
  if (f.kind === 'festival') {
   if (f.day < s.clock.day || (f.day === s.clock.day && s.clock.minute >= FESTIVAL_TO)) next = closeOut(next, f)
   continue
  }
  const a = apptOf(next, f)
  if (!a) { next = closeOut(next, f); continue }
  if (a.state === 'done') next = closeOut(next, f, { step: 'done' })
 }
 return next
}

/** 저장에서: 모양이 맞는 것만, 보관분은 행사 물건만 */
export function sanitizeFests(raw: unknown): Fest[] {
 if (!Array.isArray(raw)) return []
 const ids = new Set<string>()
 const keep = [...FEST_SNACKS, ...FEST_DECOR] as string[]
 const out: Fest[] = []
 for (const f of raw as Partial<Fest>[]) {
  if (!f || typeof f !== 'object' || typeof f.id !== 'string' || ids.has(f.id) || !['tea','housewarming','showcase','festival'].includes(f.kind as string) || !Number.isInteger(f.day) || !FEST_STEPS.includes(f.step as FestStep) || typeof f.place !== 'string' || !Array.isArray(f.members) || !f.members.every(m => typeof m === 'string')) continue
  ids.add(f.id)
  const reserve = Object.fromEntries(Object.entries(f.reserve ?? {}).filter(([id, n]) => keep.includes(id) && Number.isInteger(n) && (n as number) > 0)) as Inventory
  out.push({
   ...(f as Fest), members: [...new Set(f.members)].slice(0, 3), reserve,
   help: Array.isArray(f.help) ? f.help.filter(h => typeof h === 'string' && FEST_HELP[h]) : undefined,
   snack: f.snack && FEST_SNACKS.includes(f.snack) ? f.snack : undefined,
   deco: f.deco && FEST_DECOR.includes(f.deco) ? f.deco : undefined,
   role: f.role && ['food','deco','tidy'].includes(f.role) ? f.role : undefined,
   joined: f.joined === true, consumed: f.consumed === true, closed: f.closed === true, cancelled: f.cancelled === true,
  })
 }
 return out
}
