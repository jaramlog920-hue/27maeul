// 계획 20 2부 작업 A: 주민의 자율 가족 — 상태(인물·쌍 호감도·관계·가구·사건·기록)와 저장.
// 하루 정산은 gen-settle.ts, 단계 전환은 gen-relations.ts·gen-marriage.ts·gen-birth.ts가 이 상태를 채워 간다.
// 필사·능력치·닢·말씀 진도는 읽지도 쓰지도 않는다 (말씀은 보상이 아니다).
import { mulberry32 } from './offers'
import { CANDIDATE_IDS } from './romance'
import { closeKin, FAMILY_REL, repairKin } from './gen-kin'
import { ELDER_PAIR, FALLBACK_SEED, MAX_GENERATED, MEETS_PER_DAY, SPOUSE_FLOOR, START_CLOSE } from './gen-config'
import type { GameContent, NeighborDef } from './types'

export type GenStage = 'baby' | 'child' | 'teen' | 'adult' | 'elder'
export type GenOrigin = 'fixed' | 'born' | 'arrived'
export const GEN_STAGES: readonly GenStage[] = ['baby', 'child', 'teen', 'adult', 'elder']

export interface GenPerson {
  /** 고정 주민은 neighbors.json id 그대로, 생성 인물은 g-0001부터 */
  id: string
  origin: GenOrigin
  /** 고정 주민 id (origin이 fixed일 때) */
  npc?: string
  /** 태어난 날. 날짜 미상은 null — 지어내지 않는다 */
  born: number | null
  stage: GenStage
  /** 모습 (여자/남자) — 짝 조건(서로 다른 모습)에 쓴다 */
  look?: 'f' | 'm'
  /** 생성 인물의 이름 */
  name?: string
  /** 생성 인물의 외형 (부모의 값 조합, 0 이상 정수들) */
  avatar?: Record<string, number>
  /** 부모 id (계보 id) */
  parents: string[]
  /** 배우자 id (서로 가리켜야 한다) */
  spouse: string | null
  /** 사는 가구 id */
  household: string | null
  /** 알려진 친척 중 부모·자녀로 적을 수 없는 것 (조부모·종류 모름) */
  kin?: { id: string; rel: 'grandparent' | 'relative' }[]
}

/** 이웃은 따로 적지 않는다 — 관계 기록이 없으면 이웃 */
export type RelationStage = 'neighbor' | 'friend' | 'lover' | 'preparing' | 'spouse'
export const RELATION_STAGES: readonly RelationStage[] = ['neighbor', 'friend', 'lover', 'preparing', 'spouse']

export type ConsultAnswer = 'cheer' | 'wait'
/** 결혼 전 상담 (D31·P8): 물은 날·답·다음에 물을 수 있는 날 */
export interface Consult {
  asked: number[]
  answers: ConsultAnswer[]
  /** 이 날부터 물을 수 있다 (하루 한 질문, 기다려 보라면 14일 뒤) */
  nextAsk: number
  /** 이 바퀴가 시작된 날 (질문 순서 씨앗) */
  round?: number
  /** 마지막 재촉 근황 날 */
  nudged?: number
}

/** 결혼 준비 (P9): 준비 일 두 가지와 끝낸 것, 결혼식 날 */
export interface Prep {
  tasks: string[]
  done: string[]
  wedding: number
}

export interface Relation {
  /** 정렬된 두 id를 '|'로 이은 값 */
  id: string
  a: string
  b: string
  stage: Exclude<RelationStage, 'neighbor'>
  /** 지금 단계가 시작된 날 */
  since: number
  consult?: Consult
  prep?: Prep
}

export interface Household {
  id: string
  members: string[]
  /** 집 주인 npc id (신혼 거주는 집이 있는 쪽, D21) */
  home: string
  children: string[]
  lastBirth: number | null
  /** 결혼한 날 */
  since: number | null
  /** 결혼한 날의 호감도 (P10) */
  wedAffinity?: number
  /** 첫 아이가 태어난 날의 호감도 (둘째 기준) */
  birthAffinity?: number
  /** 아기 침대 부탁: 부탁한 날·건넸는지·다시 말했는지 */
  cribAsk?: { day: number; given: boolean; reasked?: boolean }
  /** 아이가 태어날 날 (침대를 건넨 날 + 28, 둘째는 기다리기 시작한 날 + 28) */
  birthDue?: number | null
}

export interface GenEvent {
  /** 유일한 사건 id (e-0001…) */
  id: string
  kind: string
  /** 예정(또는 일어난) 날 */
  day: number
  who: string[]
  done: boolean
  news: boolean
}

export interface GenLog {
  day: number
  kind: string
  who: string[]
}

/** 오늘 그 쌍이 만난 횟수와 마지막 만남 (분) — 날이 바뀌면 버린다 */
export interface MeetMark {
  day: number
  n: number
  last: number
}

export interface GenState {
  /** 자율 진행 (D17·P14): 끄면 새 만남·전환만 멈춘다 */
  on: boolean
  seed: number
  settledDay: number
  persons: Record<string, GenPerson>
  /** 쌍 호감도 0–100 (없으면 0, P1) */
  affinity: Record<string, number>
  meets: Record<string, MeetMark>
  /** 헤어진 날 (쌍 id) */
  breakup: Record<string, number>
  relations: Record<string, Relation>
  households: Record<string, Household>
  events: GenEvent[]
  log: GenLog[]
  nextPerson: number
  nextEvent: number
}

export const LOG_CAP = 200

export const relationId = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)
export const personId = (n: number): string => `g-${String(n).padStart(4, '0')}`
export const eventId = (n: number): string => `e-${String(n).padStart(4, '0')}`

/** 변하는 난수 상태 없이, 저장된 씨앗 + (종류, 인물 id들, 횟수)로 같은 난수를 다시 만든다 (D19) */
export function genRng(seed: number, kind: string, ids: readonly string[], n: number): () => number {
  const text = `${kind}|${[...ids].sort().join(',')}|${n}`
  let h = 2166136261 ^ (seed >>> 0)
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return mulberry32(h >>> 0)
}

/** 생성 주민 수 (고정 주민·플레이어 가족은 세지 않는다) */
export const generatedCount = (g: GenState): number => Object.values(g.persons).filter((p) => p.origin !== 'fixed').length
/** 새 생성 주민이 들어올 자리가 있나 (D14) */
export const hasRoom = (g: GenState): boolean => generatedCount(g) < MAX_GENERATED

// ── 참여·짝 조건 ─────────────────────────────────────

/** 자율 연애에 참여하는 고정 주민 (D28): 연애 후보 13명 + 작업 9 표의 참여 가능 2명 */
export const GEN_ELIGIBLE: readonly string[] = [...CANDIDATE_IDS, ...ELDER_PAIR]
export const genEligible = (id: string): boolean => GEN_ELIGIBLE.includes(id)
/** 세대 무리: 부모 세대(목수·대장장이)와 젊은 후보는 짝이 되지 않는다 */
const generationOf = (id: string): number => ((ELDER_PAIR as readonly string[]).includes(id) ? 1 : 0)

export const relationOf = (g: GenState, a: string, b: string): Relation | undefined => g.relations[relationId(a, b)]
export const stageOf = (g: GenState, a: string, b: string): RelationStage => relationOf(g, a, b)?.stage ?? 'neighbor'
/** 연인 이상(연인·결혼 준비·배우자)인 상대 */
export function partnerOf(g: GenState, id: string): string | null {
  for (const r of Object.values(g.relations)) {
    if (r.stage === 'friend') continue
    if (r.a === id) return r.b
    if (r.b === id) return r.a
  }
  return null
}

/**
 * 연인이 될 수 있는 쌍인가 (P7): 둘 다 성인 참여 대상·같은 세대, 서로 다른 모습, 가까운 친족 아님,
 * 둘 다 다른 연인·배우자 없음, 플레이어의 연인·약혼자·배우자 아님
 */
export function canPair(g: GenState, playerPartner: string | null | undefined, a: string, b: string): boolean {
  if (a === b || !genEligible(a) || !genEligible(b) || generationOf(a) !== generationOf(b)) return false
  const pa = g.persons[a], pb = g.persons[b]
  if (!pa || !pb || pa.stage !== 'adult' || pb.stage !== 'adult') return false
  if (!pa.look || !pb.look || pa.look === pb.look) return false
  if (pa.spouse || pb.spouse || closeKin(g.persons, a, b)) return false
  if (playerPartner && (playerPartner === a || playerPartner === b)) return false
  const other = (id: string) => {
    const p = partnerOf(g, id)
    return p != null && p !== (id === a ? b : a)
  }
  return !other(a) && !other(b)
}

// ── 호감도 ───────────────────────────────────────────

export const affinityOf = (g: GenState, a: string, b: string): number => g.affinity[relationId(a, b)] ?? 0

/** 호감도 더하기: 0–100으로 자르고, 배우자는 50 아래로 내려가지 않는다 */
export function addAffinity(g: GenState, a: string, b: string, delta: number): GenState {
  if (a === b || !delta) return g
  const id = relationId(a, b)
  const floor = g.relations[id]?.stage === 'spouse' ? SPOUSE_FLOOR : 0
  const v = Math.max(floor, Math.min(100, (g.affinity[id] ?? 0) + delta))
  return { ...g, affinity: { ...g.affinity, [id]: v } }
}

/** 오늘 이 쌍이 더 만날 수 있나 (하루 3번) */
export function meetsToday(g: GenState, a: string, b: string, day: number): MeetMark {
  const m = g.meets[relationId(a, b)]
  return m && m.day === day ? m : { day, n: 0, last: -9999 }
}
export const canMeetMore = (g: GenState, a: string, b: string, day: number): boolean => meetsToday(g, a, b, day).n < MEETS_PER_DAY

// ── 만들기 ───────────────────────────────────────────

const lookOf = (n: NeighborDef): 'f' | 'm' | undefined => n.look ?? n.gender

function fixedPerson(n: NeighborDef, ids: ReadonlySet<string>): GenPerson {
  const look = lookOf(n)
  const p: GenPerson = {
    id: n.id,
    origin: 'fixed',
    npc: n.id,
    born: null,
    stage: n.id === 'child' ? 'child' : n.id === 'grandpa' ? 'elder' : 'adult',
    ...(look ? { look } : {}),
    parents: [],
    spouse: null,
    household: null,
  }
  if (n.family && ids.has(n.family)) {
    const rel = FAMILY_REL[n.family]
    if (rel) p.kin = [{ id: n.family, rel }]
    else p.parents = [n.family]
  }
  return p
}

/** 마을에 있는 고정 주민이 계보에 없으면 넣는다 (있는 것은 건드리지 않는다) */
export function ensureFixed(g: GenState, content: GameContent): GenState {
  const ids = new Set(content.neighbors.map((n) => n.id))
  const add = content.neighbors.filter((n) => !g.persons[n.id])
  if (!add.length) return g
  const persons = { ...g.persons }
  for (const n of add) persons[n.id] = fixedPerson(n, ids)
  return { ...g, persons }
}

/**
 * 처음 호감도 (P1): 이미 설정상 친한 쌍 — 양쪽 모두에 서로 함께하는 일과(with)가 있거나 집안(family)으로 이어진 쌍 — 은 30, 나머지 0.
 * 일과는 people.json에서 받아 온다 (gen은 콘텐츠 파일을 직접 읽지 않는다)
 */
export function startAffinity(content: GameContent, withPairs: readonly [string, string][]): Record<string, number> {
  const ids = new Set(content.neighbors.map((n) => n.id))
  const out: Record<string, number> = {}
  for (const [a, b] of withPairs) if (a !== b && ids.has(a) && ids.has(b)) out[relationId(a, b)] = START_CLOSE
  for (const n of content.neighbors) if (n.family && ids.has(n.family) && n.family !== n.id) out[relationId(n.id, n.family)] = START_CLOSE
  return out
}

export function newGenState(content: GameContent, seed: number, day: number, withPairs: readonly [string, string][] = []): GenState {
  return ensureFixed(
    { on: true, seed: seed >>> 0, settledDay: day, persons: {}, affinity: startAffinity(content, withPairs), meets: {}, breakup: {}, relations: {}, households: {}, events: [], log: [], nextPerson: 1, nextEvent: 1 },
    content,
  )
}

export const addLog = (g: GenState, day: number, kind: string, who: string[]): GenState => ({ ...g, log: [...g.log, { day, kind, who }].slice(-LOG_CAP) })

// ── 저장 ─────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isNat = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 999999
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 40
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter(isStr) : [])
const isLook = (v: unknown): v is 'f' | 'm' => v === 'f' || v === 'm'
const STAGES_SAVED: readonly RelationStage[] = RELATION_STAGES.filter((x) => x !== "neighbor")

function sanitizeConsult(raw: unknown): Consult | undefined {
  if (!isObj(raw)) return undefined
  const answers = Array.isArray(raw.answers) ? raw.answers.filter((a): a is ConsultAnswer => a === 'cheer' || a === 'wait').slice(0, 20) : []
  const asked = Array.isArray(raw.asked) ? raw.asked.filter(isNat).slice(0, 20) : []
  return { asked, answers, nextAsk: isNat(raw.nextAsk) ? raw.nextAsk : 0, ...(isNat(raw.round) ? { round: raw.round } : {}), ...(isNat(raw.nudged) ? { nudged: raw.nudged } : {}) }
}

function sanitizePrep(raw: unknown): Prep | undefined {
  if (!isObj(raw) || !isNat(raw.wedding)) return undefined
  const tasks = strs(raw.tasks).slice(0, 5)
  return { tasks, done: strs(raw.done).filter((t) => tasks.includes(t)), wedding: raw.wedding }
}

function sanitizeAvatar(raw: unknown): Record<string, number> | undefined {
  if (!isObj(raw)) return undefined
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) if (isStr(k) && isNat(v)) out[k] = v
  return Object.keys(out).length ? out : undefined
}

const score = (v: unknown): number | undefined => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100 ? (v as number) : undefined)

/**
 * 저장에서 읽기: 모양이 맞는 것만 남기고 깨진 항목만 버린다. 계보(순환·없는 참조·한쪽만 걸린 배우자·집)는 복구한다.
 * 통째로 알아볼 수 없으면 undefined (다음 정산에서 새로 만든다 — 지난 기간은 처리하지 않는다)
 */
export function sanitizeGen(raw: unknown, today: number): GenState | undefined {
  if (!isObj(raw) || !isObj(raw.persons)) return undefined
  const persons: Record<string, GenPerson> = {}
  for (const [id, v] of Object.entries(raw.persons)) {
    if (!isObj(v) || !isStr(id) || v.id !== id) continue
    const origin = v.origin === 'fixed' || v.origin === 'born' || v.origin === 'arrived' ? v.origin : null
    if (!origin) continue
    const kin = Array.isArray(v.kin)
      ? v.kin.filter((k): k is { id: string; rel: 'grandparent' | 'relative' } => isObj(k) && isStr(k.id) && (k.rel === 'grandparent' || k.rel === 'relative'))
      : []
    const avatar = sanitizeAvatar(v.avatar)
    persons[id] = {
      id,
      origin,
      ...(origin === 'fixed' && isStr(v.npc) ? { npc: v.npc } : {}),
      born: isNat(v.born) ? Math.min(v.born, today) : null,
      stage: GEN_STAGES.includes(v.stage as GenStage) ? (v.stage as GenStage) : 'adult',
      ...(isLook(v.look) ? { look: v.look } : {}),
      ...(isStr(v.name) ? { name: v.name } : {}),
      ...(avatar ? { avatar } : {}),
      parents: strs(v.parents),
      spouse: isStr(v.spouse) ? v.spouse : null,
      household: isStr(v.household) ? v.household : null,
      ...(kin.length ? { kin } : {}),
    }
  }
  const hsRaw: Record<string, Household> = {}
  if (isObj(raw.households)) {
    for (const [id, v] of Object.entries(raw.households)) {
      if (!isObj(v) || v.id !== id) continue
      const members = strs(v.members)
      const crib = isObj(v.cribAsk) && isNat(v.cribAsk.day) && typeof v.cribAsk.given === 'boolean'
        ? { day: Math.min(v.cribAsk.day, today), given: v.cribAsk.given, ...(v.cribAsk.reasked === true ? { reasked: true } : {}) }
        : undefined
      const wed = score(v.wedAffinity), birthA = score(v.birthAffinity)
      hsRaw[id] = {
        id,
        members,
        home: isStr(v.home) && members.includes(v.home) ? v.home : members[0] ?? '',
        children: strs(v.children),
        lastBirth: isNat(v.lastBirth) ? Math.min(v.lastBirth, today) : null,
        since: isNat(v.since) ? Math.min(v.since, today) : null,
        ...(wed != null ? { wedAffinity: wed } : {}),
        ...(birthA != null ? { birthAffinity: birthA } : {}),
        ...(crib ? { cribAsk: crib } : {}),
        ...(isNat(v.birthDue) ? { birthDue: v.birthDue } : {}),
      }
    }
  }
  const fixed = repairKin(persons, hsRaw)
  const households = fixed.households
  const relations: Record<string, Relation> = {}
  if (isObj(raw.relations)) {
    for (const [id, v] of Object.entries(raw.relations)) {
      if (!isObj(v) || !isStr(v.a) || !isStr(v.b) || v.a === v.b || relationId(v.a, v.b) !== id || v.id !== id) continue
      if (!fixed.persons[v.a] || !fixed.persons[v.b] || !STAGES_SAVED.includes(v.stage as RelationStage)) continue
      const stage = v.stage as Relation['stage']
      // 친족은 짝이 되지 않는다 (친한 사이는 괜찮다)
      if ((stage === 'lover' || stage === 'preparing') && closeKin(fixed.persons, v.a, v.b)) continue
      // 배우자는 계보에서 서로 가리켜야 한다
      if (stage === 'spouse' && fixed.persons[v.a].spouse !== v.b) continue
      const consult = sanitizeConsult(v.consult)
      const prep = stage === 'preparing' ? sanitizePrep(v.prep) : undefined
      if (stage === 'preparing' && !prep) continue
      relations[id] = {
        id,
        a: id.split('|')[0],
        b: id.split('|')[1],
        stage,
        since: isNat(v.since) ? Math.min(v.since, today) : today,
        ...(consult && stage === 'lover' ? { consult } : {}),
        ...(prep ? { prep } : {}),
      }
    }
  }
  // 계보에는 배우자인데 관계 기록이 없으면 배우자 관계를 만든다 (계보가 이긴다)
  for (const p of Object.values(fixed.persons)) {
    if (!p.spouse || p.id > p.spouse) continue
    const id = relationId(p.id, p.spouse)
    if (relations[id]?.stage !== 'spouse') relations[id] = { id, a: id.split('|')[0], b: id.split('|')[1], stage: 'spouse', since: households[p.household ?? '']?.since ?? today }
  }
  const affinity: Record<string, number> = {}
  if (isObj(raw.affinity)) {
    for (const [id, v] of Object.entries(raw.affinity)) {
      const n = score(v)
      const [a, b] = id.split('|')
      if (n == null || !n || !a || !b || a === b || relationId(a, b) !== id || !fixed.persons[a] || !fixed.persons[b]) continue
      affinity[id] = relations[id]?.stage === 'spouse' ? Math.max(n, 50) : n
    }
  }
  const meets: Record<string, MeetMark> = {}
  if (isObj(raw.meets)) {
    for (const [id, v] of Object.entries(raw.meets)) {
      // 오늘 것만 남긴다 — 지난 날의 만남 수는 쓸 데가 없다
      if (isObj(v) && v.day === today && isNat(v.n) && Number.isInteger(v.last) && fixed.persons[id.split('|')[0]] && fixed.persons[id.split('|')[1] ?? '']) meets[id] = { day: today, n: v.n, last: v.last as number }
    }
  }
  const breakup: Record<string, number> = {}
  if (isObj(raw.breakup)) for (const [id, v] of Object.entries(raw.breakup)) if (isNat(v) && id.includes('|')) breakup[id] = Math.min(v, today)
  const seen = new Set<string>()
  const events: GenEvent[] = []
  if (Array.isArray(raw.events)) {
    for (const e of raw.events) {
      if (!isObj(e) || !isStr(e.id) || seen.has(e.id) || !isStr(e.kind) || !isNat(e.day)) continue
      seen.add(e.id)
      events.push({ id: e.id, kind: e.kind, day: e.day, who: strs(e.who), done: e.done === true, news: e.news === true })
    }
  }
  const log: GenLog[] = []
  if (Array.isArray(raw.log)) for (const l of raw.log) if (isObj(l) && isNat(l.day) && isStr(l.kind)) log.push({ day: l.day, kind: l.kind, who: strs(l.who) })
  const maxNum = (ids: string[], re: RegExp) => ids.reduce((m, id) => Math.max(m, Number(re.exec(id)?.[1] ?? 0)), 0)
  return {
    on: raw.on !== false,
    seed: Number.isInteger(raw.seed) && (raw.seed as number) >= 0 ? (raw.seed as number) : FALLBACK_SEED,
    settledDay: isNat(raw.settledDay) ? Math.min(raw.settledDay, today) : today,
    persons: fixed.persons,
    affinity,
    meets,
    breakup,
    relations,
    households,
    events,
    log: log.slice(-LOG_CAP),
    nextPerson: Math.max(isNat(raw.nextPerson) ? raw.nextPerson : 1, maxNum(Object.keys(fixed.persons), /^g-(\d+)$/) + 1),
    nextEvent: Math.max(isNat(raw.nextEvent) ? raw.nextEvent : 1, maxNum(events.map((e) => e.id), /^e-(\d+)$/) + 1),
  }
}
