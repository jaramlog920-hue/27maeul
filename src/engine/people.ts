// 살아 움직이는 사람들 (계획 6b): 일과·목격·마을 사건·기억·말 고르기·사이 단계.
// 사람마다 내용은 src/content/people.json 한 곳 (게임 문장이 들어 있어 verify가 금지어를 본다).
// 이 파일은 상태를 바꾸지 않는 판단만 — 상태를 바꾸는 입구는 game.ts.
import type { ItemId, Minigame, Season, Tile, Weather } from './types'

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
export type Activity = 'hammer' | 'net' | 'tea' | 'book' | 'bread' | 'sheep' | 'herb' | 'weave' | 'bee' | 'grape' | 'music' | 'rest' | 'wait' | 'wood' | 'cat' | 'press' | 'sort'

export interface Routine {
  when?: When
  at: Tile
  doing?: Activity
  /** 함께 있는 이웃 (그 사람의 일과에도 같은 때 곁자리가 있다) */
  with?: string
  /** 가까이 지나가면 들리는 혼잣말 (하나를 고른다) */
  mutter?: string[]
  /** 이 조건이 맞을 때만 고른다 (계획 16 작업 3 — 이야기 뒤 생긴 일과·사라진 일과) */
  req?: Req
  /** 이 때는 마을에 없다 — 집 문으로 들어가 보이지 않고, 함께하는 일과의 상대도 기다리지 않는다 (계획 16 작업 10: 웬델이 배우러 가는 아침) */
  away?: boolean
  /** 오늘의 작은 근황에서 온 일과 (계획 16 작업 24 — 근황 id) */
  news?: string
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
  // ── 계획 16 작업 2 ──
  /** 이 중 하나라도 본 이벤트·목격 (갈래가 둘인 앞 사건을 이어받을 때) */
  seenAny?: string[]
  /** 끝난 이야기 (완료 표식 story:<id>). outcome이 있으면 그 갈래로 끝났을 때만 */
  story?: { id: string; outcome?: number }[]
  notStory?: string[]
  /** 이 사람과 실제로 함께한 경험 (경험 id) */
  exp?: string[]
  notExp?: string[]
  /** 지금 사이: 친구(3)·가까운 친구(4 이상)·연인(사귐·약혼)·배우자 — 하나라도 맞으면 */
  rel?: Rel[]
  /** 이 사이 단계 이상 */
  minStage?: Stage
  /** 이 사람과 함께한 그 경험이 최근 n일 안 */
  recent?: { exp: string; days: number }
  /** 이 사람과 함께한 그 경험에 남은 결과물이 이것일 때 (계획 16 작업 17: 함께 일한 마무리의 흔적) */
  expItem?: { exp: string; item: string }
  /** 이야기 뒤 소품이 지금 놓여 있을 때 (소품 id) */
  placed?: string
  /** 앞 사건의 선택을 마친 날에서 며칠 뒤 (날짜 미상인 옛 저장은 본 사건으로 판단) */
  after?: { event: string; days: number }
  /** 아직 이사 오지 않은 이웃 — 하나라도 와 있으면 안 맞는다 (계획 16 작업 11: 함께할 이웃 없이도 끝나는 다른 길) */
  notJoined?: string[]
  /** 이 사람과의 연애 단계가 이 중 하나일 때만 (계획 16 작업 12b: 약혼 중에만 하는 생활 준비 장면) */
  romance?: ('dating' | 'engaged' | 'married')[]
}

/** 말을 나누는 사이 (사이 단계와 연애에서) */
export type Rel = 'friend' | 'close' | 'lover' | 'spouse'

export function relOf(stage: Stage, romance: 'dating' | 'engaged' | 'married' | null | undefined): Rel | null {
  if (romance === 'married') return 'spouse'
  if (romance) return 'lover'
  return stage >= 4 ? 'close' : stage >= 3 ? 'friend' : null
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
  /** 이 말에서 직접 알게 되는 생활 취향 키 */
  reveals?: string
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
  // ── 계획 16 작업 4 ──
  /** 이야기의 갈래: 이 말을 고르면 완료 표식 story:<id> = outcome+1 (completes가 있는 사건에서만) */
  outcome?: number
  /** 고른 뒤 함께하는 손일 놀이 — 잘하든 못하든 끝나면 다음으로 (숙련으로 막지 않는다) */
  mini?: Minigame
  /** 고백 사건(confess)에서 "지금은 친구로" — 고르면 연인이 되지 않는다 (계획 16 작업 12b: 명시적 교제 선택) */
  stayFriends?: boolean
}

export interface PersonEvent {
  id: string
  title: string
  /** 이 사이 단계 이상 */
  stage: Stage
  /** 이 사람이 서 있는 곳 (플레이어가 가까이 가면 열린다) */
  at: Tile
  when?: When
  /** 실제로 곁에 있어야 장면에 참여하는 주민 */
  with?: string[]
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
  // ── 계획 16 작업 4: 이야기 이후의 변화 ──
  /** 이 사건으로 끝나는 이야기 id → flags['story:<id>'] (1 = 끝남, 갈래면 고른 말의 outcome+1). 참여자 모두에게 경험 story:<id> */
  completes?: string
  /** 끝날 때 플레이어 가방에 남는 물건 하나 (집 꾸미기로 놓는다 — 장식이 아니다) */
  keepsake?: ItemId
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
  clubLines?: { start?: string; finish?: string }
  /** 작은 행사에 보태 준 날 (계획 16 작업 16): 가져온 것을 내려놓고 손님으로 앉는 한 줄 */
  festLines?: { help?: string }
  /** 함께 일하는 하루 (계획 16 작업 17): 작업장 안내·손일 중·마무리 한 줄, 연인·배우자에게 다른 첫마디 */
  workLines?: { start?: string; hand?: string; finish?: string; lover?: string; spouse?: string }
  /** 내 좌판 손님일 때 (계획 16 작업 19): 상품을 살필 때·산 뒤·사지 않고 간 뒤·단골일 때 한 줄 */
  stallLines?: { look?: string; sold?: string; looked?: string; regular?: string }
  /**
   * 마을 공동 시설 (계획 16 작업 20): 시설 id마다 이웃이 하는 말 — 의견(게시판에서 고르기 전), 다른 안이 먼저 골라진 뒤,
   * 현장에서 거들 때, 완성된 시설을 함께 쓸 때. 고르지 않은 안의 이웃도 서운해하지 않는다
   */
  projectLines?: Record<string, { opinion?: string; next?: string; work?: string; used?: string }>
  id: string
  /** 마음이 열리는 빠르기 (1 보통, 크면 빨리) */
  pace: number
  dislikes?: string[]
  tastes?: LifestyleTastes
  routines: Routine[]
  /** 평소에서 벗어나는 날의 일과 (날 씨앗으로 한 달에 몇 번) */
  offDays?: { chance: number; routines: Routine[]; gossip?: string }
  lines: TalkLine[]
  sightings?: Sighting[]
  events?: PersonEvent[]
  /** 이야기 뒤 이웃 집 방·작업장 앞 지정 칸에 놓이는 소품 (계획 16 작업 4) */
  props?: StoryProp[]
}

export interface LifestyleTastes {
  activity?: Partial<Record<'tea' | 'sew' | 'garden' | 'observe' | 'taste' | 'make' | 'walk' | 'work', -1 | 0 | 1>>
  place?: Partial<Record<'indoor' | 'hill' | 'market' | 'shade' | 'lake', -1 | 0 | 1>>
  size?: Partial<Record<'small' | 'many', -1 | 0 | 1>>
  time?: Partial<Record<'early' | 'afternoon' | 'evening', -1 | 0 | 1>>
}

/**
 * 이야기 뒤 소품 (계획 16 작업 4): 조건(req — 보통 story)이 맞을 때만 보인다.
 * at은 마을 지도 칸(소품의 왼쪽 위). room이 있으면 그 이웃 집 방 안, 없으면 작업장 앞 바깥 칸.
 * 그림은 먼저 생활 확장 도트(art — assets/furniture/expansion/manifest.json의 id), 없으면 기존 가구 그림(item)
 */
export interface StoryProp {
  id: string
  room?: string
  at: Tile
  /** 기존 가구 (크기·길 막기·대신 그릴 그림) */
  item?: ItemId
  /** 생활 확장 도트 id (props/·structures/) */
  art?: string
  /** 방향이 있는 시설 도트(structures)의 방향 */
  facing?: 'down' | 'up' | 'left' | 'right'
  /** item이 없을 때 차지하는 칸 수 (기본 한 칸) */
  size?: { w: number; h: number }
  /** item이 없을 때 길을 막는가 (기본: 막지 않는 작은 물건) */
  solid?: boolean
  req: Req
  /** 이 때에만 (예: 장날만 오는 상인의 좌판 곁) */
  when?: When
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
  /** 방금 들린 혼잣말 (화면이 한 줄 띄운다 — 바뀔 때마다 새 객체) */
  heard?: { npc: string; text: string } | null
  /** 함께한 경험 (계획 16 작업 2): 경험 id → 한 항목. 같은 경험은 횟수·최근 날짜만 바뀐다 */
  experiences: Record<string, Experience>
  /**
   * 이어 갈 이야기 사건 (계획 16 작업 4): 고를 말이 남았거나(choice 없음) 고른 뒤 손일 놀이가 남은(mini) 사건.
   * 이 사건은 다 끝나기 전엔 뒤 사건의 seen 조건에 '본 것'으로 치지 않는다. 다시 말을 걸면 그 자리에서 이어 간다
   */
  storyWait?: StoryWait | null
}

export interface StoryWait {
  event: string
  npc: string
  choice?: number
  mini?: Minigame
}

// ── 경험 기억 (계획 16 작업 2) ──

export const EXPERIENCE_KINDS = ['make', 'gift', 'invite', 'visit', 'trip', 'promise', 'choice', 'story', 'club', 'event', 'work', 'learn', 'project', 'family', 'pet', 'stall', 'meal'] as const
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number]

/**
 * 의미 있는 경험 하나 (인사·클릭 같은 작은 행동은 기록하지 않는다).
 * 기록 입구: 이야기 완료·이벤트 선택·지킨 약속·좋아한 첫 선물·함께하기 결과
 */
export interface Experience {
  /** 고유 id (예: story:carpenterChair, choice:<이벤트>, promise:<약속>, gift:<이웃>) — 같은 id는 한 항목 */
  id: string
  kind: ExperienceKind
  /** 실제로 함께한 주민만 */
  with: string[]
  /** 처음·최근 날 (모르면 null — 지어내지 않는다) */
  first: number | null
  last: number | null
  count: number
  place?: string
  item?: string
  /** 고른 갈래 (선택지 번호) */
  choice?: number
}

/** 기록할 때 넘기는 것 (날짜·횟수는 엔진이 센다) */
export type ExperienceInput = Pick<Experience, 'id' | 'kind' | 'with'> & Partial<Pick<Experience, 'place' | 'item' | 'choice'>>

/** 그 사람에게 기억 표식 하나 (같은 표식은 한 번 — game.ts remember와 같은 규칙) */
export function rememberTag(life: Life, npc: string, tag: string, m: Moment): Life {
  if (hasMemory(life, npc, tag)) return life
  return { ...life, memories: { ...life.memories, [npc]: [...(life.memories[npc] ?? []), { tag, day: m.day, weather: m.weather, season: m.season }] } }
}

/**
 * 경험을 남긴다: 처음이면 만들고, 아니면 횟수+1·최근 날만 (항목이 끝없이 늘지 않는다).
 * 참여한 주민마다 기억 표식 exp:<id>를 한 번 — 기존 Req.memory가 그대로 읽는다
 */
export function recordExperience(life: Life, exp: ExperienceInput, m: Moment): Life {
  const was = life.experiences?.[exp.id]
  const withs = [...(was?.with ?? [])]
  for (const n of exp.with) if (!withs.includes(n)) withs.push(n)
  const entry: Experience = was
    ? { ...was, with: withs, last: m.day, count: was.count + 1, ...pickDefined(exp) }
    : { id: exp.id, kind: exp.kind, with: withs, first: m.day, last: m.day, count: 1, ...pickDefined(exp) }
  let next: Life = { ...life, experiences: { ...(life.experiences ?? {}), [exp.id]: entry } }
  for (const n of withs) next = rememberTag(next, n, `exp:${exp.id}`, m)
  return next
}
function pickDefined(e: ExperienceInput): Partial<Experience> {
  const o: Partial<Experience> = {}
  if (e.place !== undefined) o.place = e.place
  if (e.item !== undefined) o.item = e.item
  if (e.choice !== undefined) o.choice = e.choice
  return o
}

/** 이 사람과 함께한 경험 (없거나 함께하지 않았으면 null) */
export function sharedExperience(life: Life, npc: string, id: string): Experience | null {
  const e = life.experiences?.[id]
  return e && e.with.includes(npc) ? e : null
}

function sanitizeExperiences(raw: unknown): Record<string, Experience> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const day = (v: unknown) => v === null || (Number.isInteger(v) && (v as number) >= 0)
  const out: Record<string, Experience> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue
    const e = v as Record<string, unknown>
    if (e.id !== k || !(EXPERIENCE_KINDS as readonly unknown[]).includes(e.kind)) continue
    if (!Array.isArray(e.with) || !e.with.every((x) => typeof x === 'string')) continue
    if (!day(e.first) || !day(e.last) || !Number.isInteger(e.count) || (e.count as number) < 1) continue
    const x: Experience = { id: k, kind: e.kind as ExperienceKind, with: [...(e.with as string[])], first: e.first as number | null, last: e.last as number | null, count: e.count as number }
    if (typeof e.place === 'string') x.place = e.place
    if (typeof e.item === 'string') x.item = e.item
    if (Number.isInteger(e.choice)) x.choice = e.choice as number
    out[k] = x
  }
  return out
}

export const NO_LIFE: Life = { seen: [], memories: {}, colors: {}, recent: {}, cool: {}, mutterDay: 0, muttered: [], promises: [], experiences: {}, storyWait: null }

export function sanitizeLife(raw: unknown): Life {
  if (!raw || typeof raw !== 'object') return NO_LIFE
  const o = raw as Partial<Life>
  const obj = <T>(v: unknown, d: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : d)
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  return {
    seen: strs(o.seen),
    memories: obj(o.memories, {}),
    colors: obj(o.colors, {}),
    recent: renameRecent(obj(o.recent, {})),
    cool: obj(o.cool, {}),
    mutterDay: typeof o.mutterDay === 'number' ? o.mutterDay : 0,
    muttered: strs(o.muttered),
    promises: Array.isArray(o.promises) ? o.promises : [],
    // 계획 16: 옛 저장은 빈 경험, 모양이 틀린 항목은 버린다
    experiences: sanitizeExperiences(o.experiences),
    storyWait: sanitizeStoryWait(o.storyWait),
  }
}

/** 말 id를 바꾼 경우 (같은 id의 사건과 겹치던 파피의 동생 편지 말 — 2026-10-05): 최근에 한 말 목록도 새 id로 */
const RENAMED_LINES: Record<string, string> = { 'poppy:sister': 'poppy:sisterLetter' }
function renameRecent(recent: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(recent).map(([npc, ids]) => [npc, Array.isArray(ids) ? ids.map((id) => RENAMED_LINES[id] ?? id) : ids]))
}

const MINIGAMES: readonly Minigame[] = ['mash', 'timing', 'pick', 'hold', 'weave', 'order']
function sanitizeStoryWait(raw: unknown): StoryWait | null {
  if (!raw || typeof raw !== 'object') return null
  const w = raw as Record<string, unknown>
  if (typeof w.event !== 'string' || typeof w.npc !== 'string') return null
  const out: StoryWait = { event: w.event, npc: w.npc }
  if (Number.isInteger(w.choice) && (w.choice as number) >= 0) out.choice = w.choice as number
  if (MINIGAMES.includes(w.mini as Minigame)) out.mini = w.mini as Minigame
  if (out.mini && out.choice === undefined) return null
  return out
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
  // ── 계획 16 작업 2 (없으면: 낯선 사이·연애 없음·완료 표식 없음·놓인 소품 없음) ──
  /** 이 사람과의 사이 단계 */
  stage?: Stage
  /** 이 사람이 연인이면 그 단계 */
  romance?: 'dating' | 'engaged' | 'married' | null
  /** 게임 표식 (story:<id> 완료 표식을 본다) */
  flags?: Record<string, number>
  /** 지금 놓여 있는 이야기 뒤 소품 id */
  placed?: readonly string[]
  /** 이 이웃이 마을에 이사 와 있는가 (없으면 모두 와 있는 것으로) */
  joined?: (id: string) => boolean
}

/** 완료 표식 값: 1 = 끝남, 갈래가 있으면 outcome+1 (계획 16 작업 4가 쓴다) */
export function storyFlag(flags: Record<string, number> | undefined, id: string): number {
  return flags?.[`story:${id}`] ?? 0
}

/** 다 겪은 사건 (이어 갈 손일·고를 말이 남은 사건은 아직 — 계획 16 작업 4) */
export function seenDone(life: Life, id: string): boolean {
  return life.seen.includes(id) && life.storyWait?.event !== id
}

export function reqMet(r: Req | undefined, c: ReqCtx): boolean {
  if (!r) return true
  const seen = (id: string) => seenDone(c.life, id)
  if (r.seen && !r.seen.every(seen)) return false
  if (r.notSeen && r.notSeen.some(seen)) return false
  if (r.seenAny && !r.seenAny.some(seen)) return false
  if (r.notJoined && r.notJoined.some((id) => c.joined?.(id) ?? true)) return false
  if (r.after) {
    if (!seen(r.after.event)) return false
    const day = c.life.experiences[`choice:${r.after.event}`]?.last
    if (day !== undefined && day !== null && c.day - day < r.after.days) return false
  }
  if (r.story && !r.story.every((x) => (x.outcome === undefined ? storyFlag(c.flags, x.id) > 0 : storyFlag(c.flags, x.id) === x.outcome + 1))) return false
  if (r.notStory && r.notStory.some((id) => storyFlag(c.flags, id) > 0)) return false
  if (r.exp && !r.exp.every((id) => sharedExperience(c.life, c.npc, id))) return false
  if (r.notExp && r.notExp.some((id) => sharedExperience(c.life, c.npc, id))) return false
  if (r.recent) {
    const e = sharedExperience(c.life, c.npc, r.recent.exp)
    if (!e || e.last === null || c.day - e.last > r.recent.days) return false
  }
  if (r.expItem && sharedExperience(c.life, c.npc, r.expItem.exp)?.item !== r.expItem.item) return false
  if (r.minStage !== undefined && (c.stage ?? 0) < r.minStage) return false
  if (r.rel) {
    const rel = relOf(c.stage ?? 0, c.romance)
    if (!rel || !r.rel.includes(rel)) return false
  }
  if (r.romance && !(c.romance && r.romance.includes(c.romance))) return false
  if (r.placed !== undefined && !(c.placed ?? []).includes(r.placed)) return false
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

/**
 * 지금 이 사람이 있을 일과 (마을 사건 > 벗어나는 날 > 평소, 같은 무리에선 조건이 구체적인 것).
 * ok가 있으면 그것이 받아 주는 일과만 고른다 (계획 16 작업 3: 일과 조건 req·함께할 상대가 있는가) — 아니면 다음 후보로
 */
export function routineNow(p: Person, m: Moment, threads: Thread[], ok?: (r: Routine) => boolean): Routine | null {
  for (const t of threads) {
    const ph = threadPhase(t, m.day)
    const list = ph >= 0 && ph < t.phases.length ? t.phases[ph].routines?.[p.id] : undefined
    const r = list && pickRoutine(list, m, ok)
    if (r) return r
  }
  if (isOffDay(p, m.day) && p.offDays) {
    const r = pickRoutine(p.offDays.routines, m, ok)
    if (r) return r
  }
  return pickRoutine(p.routines, m, ok)
}

function pickRoutine(list: readonly Routine[], m: Moment, ok?: (r: Routine) => boolean): Routine | null {
  let best: Routine | null = null
  let score = -1
  for (const r of list)
    if (whenMatches(r.when, m) && routineScore(r) > score && (!ok || ok(r))) {
      best = r
      score = routineScore(r)
    }
  return best
}

/** 조건(req)이 걸린 일과는 같은 때의 평소 일과보다 먼저 — 이야기 뒤 바뀐 일과가 옛 일과를 덮는다 */
const routineScore = (r: Routine) => specificity(r.when) + (r.req ? 3 : 0)

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
  const score = (l: TalkLine) => l.depth * 2 + specificity(l.when) * 2 + (l.req ? Object.keys(l.req).length * 3 : 0) + (l.near ? 2 : 0) + talkBonus(l.req)
  const fresh = ok.filter((l) => !recent.includes(l.id))
  const pool = fresh.length ? fresh : ok.slice().sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id)).slice(0, 1)
  const top = Math.max(...pool.map(score))
  const best = pool.filter((l) => score(l) >= top - 2)
  return best[Math.min(best.length - 1, Math.floor(rnd * best.length))]
}

export const RECENT_KEEP = 8

/** 최근 경험 말은 일반 말보다 먼저 (계획 16 작업 2 — 숫자는 기본값) */
export const RECENT_BONUS = 12
/** 이야기·함께한 경험에 걸린 말도 조금 먼저 */
export const STORY_BONUS = 4
const STORY_EVENT = /:(story|small):/

/** 최근 경험·진행 중이거나 끝난 이야기에 걸린 말의 덤 (조건이 맞아 후보가 된 말에만 붙는다) */
function talkBonus(r: Req | undefined): number {
  if (!r) return 0
  if (r.recent) return RECENT_BONUS
  const story = r.story || r.exp || [...(r.seen ?? []), ...(r.seenAny ?? [])].some((id) => STORY_EVENT.test(id))
  return story ? STORY_BONUS : 0
}

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
/** 사건 id로 그 사건과 주인 (없으면 null) */
export function eventById(id: string): { owner: string; event: PersonEvent } | null {
  for (const p of Object.values(DATA.people)) {
    const e = p.events?.find((x) => x.id === id)
    if (e) return { owner: p.id, event: e }
  }
  return null
}

/** 사건에 실제로 등장한 주민 (주인 + 장면·고른 대답에서 말한 이웃 — 해설 빼고) */
export function eventCast(owner: string, e: PersonEvent, choice?: number): string[] {
  const lines = [...e.lines, ...(choice !== undefined ? (e.choices?.[choice]?.reply ?? []) : [])]
  const out = [owner]
  for (const l of lines) if (l.speaker !== 'narration' && !out.includes(l.speaker)) out.push(l.speaker)
  return out
}

/** 사건 속 목격 장면(사건 단계에 딸린 것)까지 모두 */
export function allSightings(): (Sighting & { npc: string; thread?: string; phase?: number })[] {
  const out: (Sighting & { npc: string; thread?: string; phase?: number })[] = []
  for (const p of Object.values(DATA.people)) for (const s of p.sightings ?? []) out.push({ ...s, npc: p.id })
  for (const t of DATA.threads) t.phases.forEach((ph, i) => (ph.sightings ?? []).forEach((s) => out.push({ ...s, thread: t.id, phase: i })))
  return out
}
