// 살아 움직이는 사람들 (계획 6b): 일과·목격·마을 사건·기억·말 고르기·사이 단계.
// 사람마다 내용은 src/content/people.json 한 곳 (게임 문장이 들어 있어 verify가 금지어를 본다).
// 이 파일은 상태를 바꾸지 않는 판단만 — 상태를 바꾸는 입구는 game.ts.
import type { Season, Tile, Weather } from './types'

// ── 조건 ──

/** 때·날씨·계절·요일 조건. 비어 있으면 늘 맞다 */
export interface When {
  /** 시각 창 [from, to) 분. to가 from보다 작으면 자정을 넘긴다 */
  from?: number
  to?: number
  /** 요일 (날 % 7 — 0이 장날) */
  days?: number[]
  weather?: (Weather | 'wet' | 'dry')[]
  season?: Season[]
}

export interface Moment {
  day: number
  minute: number
  weather: Weather
  season: Season
}

const WET: readonly Weather[] = ['rain', 'snow']

export function inWindow(minute: number, from = 0, to = 24 * 60 + 60): boolean {
  return from <= to ? minute >= from && minute < to : minute >= from || minute < to
}

export function whenMatches(w: When | undefined, m: Moment): boolean {
  if (!w) return true
  if ((w.from !== undefined || w.to !== undefined) && !inWindow(m.minute, w.from, w.to)) return false
  if (w.days && !w.days.includes(m.day % 7)) return false
  if (w.season && !w.season.includes(m.season)) return false
  if (w.weather) {
    const wet = WET.includes(m.weather)
    const ok = w.weather.some((x) => (x === 'wet' ? wet : x === 'dry' ? !wet : x === m.weather))
    if (!ok) return false
  }
  return true
}

/** 조건이 얼마나 구체적인가 (많이 걸린 일과·말을 먼저 고른다) */
export function specificity(w: When | undefined): number {
  if (!w) return 0
  return (w.days ? 2 : 0) + (w.weather ? 2 : 0) + (w.season ? 1 : 0) + (w.from !== undefined ? 1 : 0)
}

// ── 사이 단계 ──

/** 낯선 사람 → 아는 사람 → 편한 사이 → 친구 → 특별한 사람 → 연애 가능 (연인부터는 romance) */
export const STAGE_POINTS = [0, 5, 15, 30, 55, 75] as const
export type Stage = 0 | 1 | 2 | 3 | 4 | 5

export function stageOfPoints(points: number): Stage {
  let st = 0
  STAGE_POINTS.forEach((p, i) => {
    if (points >= p) st = i
  })
  return st as Stage
}

/** 말의 깊이: 처음(0) · 중간(1) · 깊은(2) · 연인(3) */
export function depthOf(stage: Stage, lover: boolean): 0 | 1 | 2 | 3 {
  if (lover) return 3
  return stage >= 4 ? 2 : stage >= 2 ? 1 : 0
}

// ── 사람 한 명의 내용 (people.json) ──

export type Color = 'warm' | 'tease' | 'honest' | 'quiet'
export type Activity = 'hammer' | 'net' | 'tea' | 'book' | 'bread' | 'sheep' | 'herb' | 'weave' | 'bee' | 'grape' | 'music' | 'rest' | 'wait' | 'wood' | 'cat'

export interface Routine {
  when?: When
  at: Tile
  doing?: Activity
  /** 함께 있는 이웃 (그 사람의 일과에도 같은 때 곁자리가 있다) */
  with?: string
  /** 가까이 지나가면 들리는 혼잣말 (하나를 고른다) */
  mutter?: string[]
}

export interface Req {
  /** 이미 본 이벤트·목격 */
  seen?: string[]
  notSeen?: string[]
  /** 그 사람과의 기억 표식 */
  memory?: string[]
  notMemory?: string[]
  /** 마을 사건의 단계 (단계 번호 중 하나) */
  thread?: { id: string; phase: number[] }
  /** 가장 많이 쌓인 관계의 색 */
  color?: Color
  /** 연인인가 */
  lover?: boolean
  /** 연애할 수 있는 모습인가 (주인공과 다른 모습) */
  suitor?: boolean
}

export interface TalkLine {
  id: string
  text: string
  depth: 0 | 1 | 2 | 3
  when?: When
  req?: Req
  /** 어느 자리 곁에서만 (칸, 반경 2) */
  near?: Tile
  /** 서먹할 때만 하는 말 */
  cool?: boolean
}

export interface SceneLine {
  speaker: string
  text: string
}

export interface Choice {
  label: string
  color: Color
  /** 남는 기억 표식 */
  memory?: string
  reply: SceneLine[]
  /** 약속: 다음 날 그 시각 그 자리 (지키면 kept:<id>, 잊으면 forgot:<id>와 며칠 서먹) */
  promise?: { id: string; at: Tile; from: number; to: number }
}

export interface PersonEvent {
  id: string
  title: string
  /** 이 사이 단계 이상 */
  stage: Stage
  /** 이 사람이 서 있는 곳 (플레이어가 가까이 가면 열린다) */
  at: Tile
  when?: When
  req?: Req
  lines: SceneLine[]
  choices?: Choice[]
  /** 오르는 마음 점수 (선택과 상관없이 — 정답 없음) */
  gain?: number
  /** 이 이벤트를 겪어야 넘어가는 사이 단계 (문턱) */
  opens?: Stage
  /** 연애 시작 (주인공과 다른 모습일 때만) */
  confess?: boolean
  /** 끝나면 며칠 서먹 */
  cool?: number
  album?: string
}

export interface Sighting {
  id: string
  title: string
  at: Tile
  when?: When
  req?: Req
  /** 이 사이 단계 이상일 때만 (처음 보는 사람에겐 안 보이는 모습이 있다) */
  stage?: Stage
  lines: SceneLine[]
  memory: string
}

export interface Person {
  id: string
  /** 마음이 열리는 빠르기 (1 보통, 크면 빨리) */
  pace: number
  dislikes?: string[]
  routines: Routine[]
  /** 평소에서 벗어나는 날의 일과 (날 씨앗으로 한 달에 몇 번) */
  offDays?: { chance: number; routines: Routine[]; gossip?: string }
  lines: TalkLine[]
  sightings?: Sighting[]
  events?: PersonEvent[]
}

export interface ThreadPhase {
  /** 이 단계가 시작하는 날 */
  day: number
  /** 이 단계 동안 바뀌는 일과 (사람 id → 일과) */
  routines?: Record<string, Routine[]>
  sightings?: (Sighting & { npc: string })[]
}

/** 마을 사건: 플레이어가 끼어들지 않아도 날짜를 따라 흘러간다 */
export interface Thread {
  id: string
  phases: ThreadPhase[]
  /** 마지막 단계가 끝나는 날 (그 뒤로는 끝난 사건) */
  end: number
}

export interface PeopleData {
  people: Record<string, Person>
  threads: Thread[]
}

/** 오늘 이 사건은 몇째 단계인가 (시작 전 -1, 끝난 뒤 phases.length) */
export function threadPhase(t: Thread, day: number): number {
  if (day >= t.end) return t.phases.length
  let at = -1
  t.phases.forEach((p, i) => {
    if (day >= p.day) at = i
  })
  return at
}

// ── 평소에서 벗어나는 날 ──

function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

export function idSeed(id: string): number {
  let h = 7
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return h
}

export function isOffDay(p: Person, day: number): boolean {
  if (!p.offDays) return false
  return hash(day * 131 + idSeed(p.id)) < p.offDays.chance
}

// ── 기억 ──

export interface MemoryEntry {
  tag: string
  day: number
  weather: Weather
  season: Season
}

// ── 상태 (GameState.life) ──

export interface Life {
  /** 본 이벤트·목격 id */
  seen: string[]
  /** 사람마다 기억 */
  memories: Record<string, MemoryEntry[]>
  /** 사람마다 관계의 색 */
  colors: Record<string, Partial<Record<Color, number>>>
  /** 사람마다 최근에 한 말 (되풀이하지 않게) */
  recent: Record<string, string[]>
  /** 서먹한 사이: 사람 → 이날까지 */
  cool: Record<string, number>
  /** 오늘 혼잣말을 들은 사람 (날 → 사람들) */
  mutterDay: number
  muttered: string[]
  /** 지킬 약속 */
  promises: { id: string; npc: string; day: number; at: Tile; from: number; to: number }[]
}

export const NO_LIFE: Life = { seen: [], memories: {}, colors: {}, recent: {}, cool: {}, mutterDay: 0, muttered: [], promises: [] }

export function sanitizeLife(raw: unknown): Life {
  if (!raw || typeof raw !== 'object') return NO_LIFE
  const o = raw as Partial<Life>
  const obj = <T>(v: unknown, d: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : d)
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  return {
    seen: strs(o.seen),
    memories: obj(o.memories, {}),
    colors: obj(o.colors, {}),
    recent: obj(o.recent, {}),
    cool: obj(o.cool, {}),
    mutterDay: typeof o.mutterDay === 'number' ? o.mutterDay : 0,
    muttered: strs(o.muttered),
    promises: Array.isArray(o.promises) ? o.promises : [],
  }
}

export function hasMemory(life: Life, npc: string, tag: string): boolean {
  return (life.memories[npc] ?? []).some((m) => m.tag === tag)
}

export function topColor(life: Life, npc: string): Color | null {
  const c = life.colors[npc] ?? {}
  let best: Color | null = null
  let n = 0
  for (const [k, v] of Object.entries(c) as [Color, number][]) if (v > n) [best, n] = [k, v]
  return best
}

export interface ReqCtx {
  life: Life
  npc: string
  day: number
  lover: boolean
  suitor: boolean
  threads: Thread[]
}

export function reqMet(r: Req | undefined, c: ReqCtx): boolean {
  if (!r) return true
  if (r.seen && !r.seen.every((id) => c.life.seen.includes(id))) return false
  if (r.notSeen && r.notSeen.some((id) => c.life.seen.includes(id))) return false
  if (r.memory && !r.memory.every((t) => hasMemory(c.life, c.npc, t))) return false
  if (r.notMemory && r.notMemory.some((t) => hasMemory(c.life, c.npc, t))) return false
  if (r.color && topColor(c.life, c.npc) !== r.color) return false
  if (r.lover !== undefined && r.lover !== c.lover) return false
  if (r.suitor !== undefined && r.suitor !== c.suitor) return false
  if (r.thread) {
    const t = c.threads.find((x) => x.id === r.thread!.id)
    if (!t || !r.thread.phase.includes(threadPhase(t, c.day))) return false
  }
  return true
}

// ── 일과 고르기 ──

/** 지금 이 사람이 있을 일과 (마을 사건 > 벗어나는 날 > 평소, 같은 무리에선 조건이 구체적인 것) */
export function routineNow(p: Person, m: Moment, threads: Thread[]): Routine | null {
  for (const t of threads) {
    const ph = threadPhase(t, m.day)
    const list = ph >= 0 && ph < t.phases.length ? t.phases[ph].routines?.[p.id] : undefined
    const r = list && pickRoutine(list, m)
    if (r) return r
  }
  if (isOffDay(p, m.day) && p.offDays) {
    const r = pickRoutine(p.offDays.routines, m)
    if (r) return r
  }
  return pickRoutine(p.routines, m)
}

function pickRoutine(list: readonly Routine[], m: Moment): Routine | null {
  let best: Routine | null = null
  let score = -1
  for (const r of list)
    if (whenMatches(r.when, m) && specificity(r.when) > score) {
      best = r
      score = specificity(r.when)
    }
  return best
}

// ── 말 고르기 ──

/**
 * 지금 할 말: 깊이가 지금 사이 이하이고 조건이 맞는 말 중에서, 깊고 조건이 많이 걸린 말을 먼저.
 * 최근에 한 말은 건너뛴다 (다 했으면 가장 오래된 것부터 다시). 서먹할 때는 서먹한 말만
 */
export function pickLine(p: Person, c: ReqCtx & { m: Moment; depth: number; cool: boolean; here: Tile }, rnd: number): TalkLine | null {
  const recent = c.life.recent[p.id] ?? []
  const ok = p.lines.filter(
    (l) =>
      l.depth <= c.depth &&
      !!l.cool === c.cool &&
      whenMatches(l.when, c.m) &&
      reqMet(l.req, c) &&
      (!l.near || Math.abs(l.near.x - c.here.x) + Math.abs(l.near.y - c.here.y) <= 2),
  )
  if (!ok.length) return null
  const score = (l: TalkLine) => l.depth * 2 + specificity(l.when) * 2 + (l.req ? Object.keys(l.req).length * 3 : 0) + (l.near ? 2 : 0)
  const fresh = ok.filter((l) => !recent.includes(l.id))
  const pool = fresh.length ? fresh : ok.slice().sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id)).slice(0, 1)
  const top = Math.max(...pool.map(score))
  const best = pool.filter((l) => score(l) >= top - 2)
  return best[Math.min(best.length - 1, Math.floor(rnd * best.length))]
}

export const RECENT_KEEP = 8

// ── 내용 등록 (catalog가 people.json을 읽어 넣는다 — 엔진은 json을 직접 읽지 않는다) ──

let DATA: PeopleData = { people: {}, threads: [] }
export function setPeopleData(d: PeopleData): void {
  DATA = d
}
export function peopleData(): PeopleData {
  return DATA
}
export function personOf(id: string): Person | undefined {
  return DATA.people[id]
}
/** 사건 속 목격 장면(사건 단계에 딸린 것)까지 모두 */
export function allSightings(): (Sighting & { npc: string; thread?: string; phase?: number })[] {
  const out: (Sighting & { npc: string; thread?: string; phase?: number })[] = []
  for (const p of Object.values(DATA.people)) for (const s of p.sightings ?? []) out.push({ ...s, npc: p.id })
  for (const t of DATA.threads) t.phases.forEach((ph, i) => (ph.sightings ?? []).forEach((s) => out.push({ ...s, thread: t.id, phase: i })))
  return out
}
