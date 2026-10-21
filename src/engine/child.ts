// 아이 (계획 12): 결혼 뒤 태어나 자라고, 자라서 살림을 돕는다. 대를 이어 아이로 플레이하지 않는다 (사용자 결정 2026-09-30).
// 아이는 부모의 능력치 '타고난 값'을 물려받는다 — 플레이어 쪽: 단계 4 이상인 능력치 +1, 배우자 쪽: 집안의 잘하는 능력치 +1 (최대 2).
// 자라는 단계: 아기(요람) → 걷는 아이(곁을 따라다님) → 돕는 아이(혼자 마을을 다니며 하루 한 번 돕는다).
// 모든 도움은 "덜 반복"이지 "공짜"가 아니다 — 하루 한 번, 한 개씩.
import { cleanCatch, TEMPERS, type Temper } from './persona'
import { mulberry32 } from './offers'
import { addXp, BORN_BONUS, freshStats, sanitizeStats, STAT_IDS, statScore, totalXp, type StatId, type Stats } from './stats'
import type { ItemId } from './types'
import type { Tile } from './types'
import { HOME_FRONT, SIDE_ROOM } from './world'

export type ChildLook = 'boy' | 'girl'
export type ChildStage = 'baby' | 'toddler' | 'helper' | 'adult'

export interface Child {
  name: string
  look: ChildLook
  /** 태어난 날 */
  born: number
  /** 아이의 능력치 (타고난 값은 부모에게서, 단계는 스스로 돕는 일로 오른다) */
  stats: Stats
  /** 같을 때 먼저 고르는 능력치 (배우자 집안의 능력치) */
  lean: StatId | null
  /**
   * 데리고 다니기(follow)·집에 두기(home)·혼자 다니기(roam, 돕는 아이만).
   * 비어 있으면 자라는 단계대로: 걷는 아이는 따라다니고, 돕는 아이는 혼자 마을을 다닌다
   */
  mode?: ChildMode
  /** 어른이 된 뒤의 일 (ADULT_AT에 정해진다) */
  job?: AdultJob
  /** 마을을 떠나 사는가 */
  left?: boolean
  /** 함께 보낸 시간으로 쌓인 가까움 0~100 (계획 12 "아이와 함께 보내는 시간" — 옛 저장은 없다 = 0) */
  close?: number
  /** 아기 때 하루 처음 돌본 날 수 (물려받는 몫의 확률을 올린다 — 2026-10-14 사용자) */
  cared?: number
  /** 기록자 능력치를 물려받은 몫 % (아기 시기가 끝나는 아침에 한 번 정해진다, 20~50) */
  inherited?: number
  interests?: Partial<Record<AdultJob, number>>
  jobConfirmed?: boolean
  /** 함께하지 않는 동안 맡아 두는 이 아이의 표식 (2026-10-13 아이 셋 — 함께할 아이를 바꾸면 game.flags와 맞바꾼다) */
  kidFlags?: Record<string, number>
  /** 함께하지 않는 동안 맡아 두는 이 아이의 옷장 모습 (game.looks.child와 맞바꾼다) */
  wardrobe?: Record<string, unknown>
  /** 성격 (persona.ts — 돕는 아이가 되는 아침, 함께한 일로 정해진다) */
  temper?: Temper
  /** 기록자가 정해 준 말버릇 */
  catch?: string
}

// ── 어른이 된 아이 (2026-09-30 사용자 요청) ──
// 함께한 활동의 관심을 우선하고 능력치로 진로를 추천한다. 직업과 거주지는 별도로 정한다.
// 남든 떠나든 가끔 편지·선물·닢을 보낸다 (떠난 아이가 더 자주).
export const ADULT_AT = 84
export const LEAVE_SCORE = 60
export type AdultJob = 'scribe' | 'scholar' | 'woodworker' | 'shipwright' | 'teaKeeper' | 'merchant' | 'fisher' | 'sailor' | 'herbalist' | 'traveler' | 'cook' | 'painter' | 'weaver' | 'gardener' | 'potter' | 'instrumentMaker'
export const JOB_STAT: Record<AdultJob, StatId> = { scribe:'wit',scholar:'wit',woodworker:'hand',shipwright:'hand',teaKeeper:'charm',merchant:'charm',fisher:'strength',sailor:'strength',herbalist:'luck',traveler:'luck',cook:'hand',painter:'wit',weaver:'hand',gardener:'luck',potter:'hand',instrumentMaker:'hand' }
export const ADULT_JOBS = Object.keys(JOB_STAT) as AdultJob[]
/** 능력치 → 기본/높은 숙련 진로. 거주지와는 독립적이다. */
export const JOBS_BY_STAT: Record<StatId, [AdultJob, AdultJob]> = {
  wit: ['scribe', 'scholar'],
  hand: ['woodworker', 'shipwright'],
  charm: ['teaKeeper', 'merchant'],
  strength: ['fisher', 'sailor'],
  luck: ['herbalist', 'traveler'],
}
/** 일마다 보내 주는 선물 */
export const JOB_GIFTS: Record<AdultJob, Partial<Record<ItemId, number>>> = {
  scribe: { papyrus: 2 },
  scholar: { finePapyrus: 1 },
  woodworker: { table: 1 },
  shipwright: { bronzeOrnament: 1 },
  teaKeeper: { honey: 2 },
  merchant: { purpleCloth: 1 },
  fisher: { fig: 3 },
  sailor: { perfumeOil: 1 },
  herbalist: { herb: 3 },
  traveler: { sealWax: 1 },
  cook: { bread: 2 },
  painter: { ink: 1 },
  weaver: { fineThread: 1 },
  gardener: { seedHerb: 2 },
  potter: { pot: 1 },
  instrumentMaker: { bronzeOrnament: 1 },
}

/**
 * 마을 밖(다른 지역)으로 떠나 사는 직업 (2026-10-12 사용자 결정 2): 뱃사람·여행자·상인.
 * 떠나면 마을에 안 보이고 편지·선물·닢을 보낸다. 그 밖의 직업은 마을 안 — 집에 살거나 공동주택에서 산다
 */
export const LEAVING_JOBS: readonly AdultJob[] = ['sailor', 'traveler', 'merchant']
export const leavesVillage = (job: AdultJob | undefined): boolean => !!job && LEAVING_JOBS.includes(job)
export type ChildHome = 'home' | 'lodging' | 'away'
/** 다 자란 아이가 사는 곳: 집 / 공동주택 2층 / 다른 지역 (공동주택 표식이 있으면 공동주택) */
export function childHome(s: { child?: Pick<Child, 'left'> | null; flags: Record<string, number> }): ChildHome {
  if (!s.child?.left) return 'home'
  return s.flags['lodging:playerChild'] ? 'lodging' : 'away'
}

/** 경험한 관심과 능력치로 직업을 추천하며 기존 거주 선택을 보존한다. */
export function adultJob(c: Pick<Child, 'stats' | 'lean'> & Partial<Pick<Child,'interests'|'left'>>): { job: AdultJob; left: boolean; stat: StatId } {
  let best: StatId = c.lean ?? 'strength'
  let n = statScore(c.stats[best])
  for (const id of STAT_IDS) {
    const sc = statScore(c.stats[id])
    if (sc > n) [best, n] = [id, sc]
  }
  const experienced = ADULT_JOBS.filter(j => (c.interests?.[j] ?? 0) > 0)
    .sort((a,b) => (c.interests?.[b] ?? 0) - (c.interests?.[a] ?? 0) || statScore(c.stats[JOB_STAT[b]]) - statScore(c.stats[JOB_STAT[a]]))
  const job = experienced[0] ?? JOBS_BY_STAT[best][n >= LEAVE_SCORE ? 1 : 0]
  return { job, left: c.left ?? false, stat: JOB_STAT[job] }
}

export function addCareerInterest(c: Child, jobs: readonly AdultJob[]): Child {
  const interests = { ...c.interests }
  for (const job of jobs) interests[job] = Math.min(100, (interests[job] ?? 0) + 1)
  return { ...c, interests }
}

export type KidMail = 'letter' | 'gift' | 'coins'
/** 어른이 된 아이가 오늘 무언가 보내는가 (날 씨앗): 떠난 아이는 나흘에 한 번꼴, 남은 아이는 이레에 한 번꼴 */
export function kidMailFor(c: Pick<Child, 'born' | 'left'>, day: number): KidMail | null {
  const rnd = mulberry32(day * 389 + c.born * 17 + 3)
  if (rnd() >= (c.left ? 0.25 : 1 / 7)) return null
  const k = rnd()
  return k < 0.4 ? 'letter' : k < 0.7 ? 'gift' : 'coins'
}
/** 보내 주는 닢 */
export function kidCoins(day: number): number {
  return 10 + Math.floor(mulberry32(day * 97 + 11)() * 21)
}
export type ChildMode = 'follow' | 'home' | 'roam'

/** 지금 아이가 어떻게 지내는가 (아기는 늘 요람) */
export function childMode(c: Pick<Child, 'born' | 'mode' | 'left'>, day: number): ChildMode | 'cradle' | 'away' {
  const st = childStage(c, day)
  if (st === 'baby') return 'cradle'
  if (st === 'adult' && c.left) return 'away'
  const grown = st === 'helper' || st === 'adult'
  if (c.mode === 'roam' && !grown) return 'follow'
  return c.mode ?? (grown ? 'roam' : 'follow')
}

/** 결혼하고 이만큼 지난 아침에 태어난다 */
export const CHILD_AFTER_WEDDING = 14
/** 아기 → 걷는 아이 → 돕는 아이 (태어난 날부터 센 날) */
export const TODDLER_AT = 14
export const HELPER_AT = 42

/** 이름 (성 없이 이름만, 짧은 목록에서 골라 주고 '다른 이름'으로 다시 뽑는다 — 2026-09-30 사용자 결정) */
export const CHILD_NAMES: Record<ChildLook, readonly string[]> = {
  boy: ['테디', '핀', '재스퍼', '오티스'],
  girl: ['루시', '윌로우', '데이지', '로지'],
}

export function childStage(c: Pick<Child, 'born'>, day: number): ChildStage {
  const age = day - c.born
  return age >= ADULT_AT ? 'adult' : age >= HELPER_AT ? 'helper' : age >= TODDLER_AT ? 'toddler' : 'baby'
}

/** 태어날 때 타고나는 값: 배우자 집안 능력치 +1 (기록자 쪽은 아기 시기가 끝날 때 inheritFromPlayer로 따로 물려받는다 — 2026-10-14 사용자) */
export function inheritBorn(_player: Stats, spouseStat: StatId | undefined): Partial<Record<StatId, number>> {
  return spouseStat ? { [spouseStat]: 1 } : {}
}

/** 기록자 능력치를 물려받는 몫: 20%~50% (2026-10-14 사용자: 단계와 상관없이 부모 능력치를 따라간다) */
export const INHERIT_MIN = 0.2
export const INHERIT_MAX = 0.5
/** 아기 때 돌본 날 3일마다 뽑기를 한 번 더 해 가장 높은 값을 쓴다 — 잘 돌볼수록 높은 몫이 나오기 쉽지만 늘 최대는 아니다 */
export const CARE_DAYS_PER_DRAW = 3
export function inheritShare(cared: number, rnd: () => number): number {
  const draws = 1 + Math.floor(Math.max(0, Math.min(cared, TODDLER_AT)) / CARE_DAYS_PER_DRAW)
  let best = 0
  for (let i = 0; i < draws; i++) best = Math.max(best, rnd())
  return INHERIT_MIN + (INHERIT_MAX - INHERIT_MIN) * best
}
/** 아기 시기가 끝나는 아침에 한 번: 기록자의 능력치마다 쌓인 경험치의 몫(20~50%)을 아이에게 (타고난 값 보너스 없이 그대로) */
export function inheritFromPlayer(c: Child, player: Stats, rnd: () => number): Child {
  if (c.inherited !== undefined) return c
  const share = inheritShare(c.cared ?? 0, rnd)
  let stats = c.stats
  for (const id of STAT_IDS) {
    const xp = Math.floor(totalXp(player[id]) * share)
    if (xp > 0) stats = addXp(stats, id, xp / (1 + BORN_BONUS * (stats[id]?.born ?? 0)))
  }
  return { ...c, stats, inherited: Math.round(share * 100) }
}

/** 세 추가 후보의 옛 아이에게 빠졌던 배우자 유전 한 칸만 복원한다. lean이 있어 중복 지급하지 않는다. */
export function repairSpouseInheritance(c: Child | null, partner: string | null, spouseStat: StatId | undefined): Child | null {
  if (!c || c.lean !== null || !spouseStat || !partner || !['merchant', 'presser', 'postman'].includes(partner)) return c
  return { ...c, lean: spouseStat, stats: { ...c.stats, [spouseStat]: { ...c.stats[spouseStat], born: Math.min(2, c.stats[spouseStat].born + 1) } } }
}

/** 날 씨앗으로 아이의 모습과 첫 이름 */
export function newChild(day: number, player: Stats, spouseStat: StatId | undefined): Child {
  const rnd = mulberry32(day * 613 + 29)
  const look: ChildLook = rnd() < 0.5 ? 'boy' : 'girl'
  const names = CHILD_NAMES[look]
  return { name: names[Math.floor(rnd() * names.length)], look, born: day, stats: freshStats(inheritBorn(player, spouseStat)), lean: spouseStat ?? null }
}

/** '다른 이름': 목록에서 지금 이름 다음 것 */
export function nextName(c: Pick<Child, 'name' | 'look'>): string {
  const names = CHILD_NAMES[c.look]
  return names[(names.indexOf(c.name) + 1) % names.length]
}

/**
 * 성격마다 돕는 일 (2026-10-21 점검: 같은 부모의 아이 셋이 아침마다 똑같이 도왔다) — 둘째·셋째는 성격대로 돕는다 (game.ts childMorning).
 * 첫째는 지금처럼 타고난 값으로
 */
export const TEMPER_HELP: Record<Temper, StatId> = { warm: 'charm', bold: 'strength', shy: 'hand', playful: 'luck', sharp: 'wit', easy: 'luck' }
/** 아이가 하루 한 번 하는 일: 타고난 값이 가장 높은 능력치 (같으면 배우자 쪽 능력치를 먼저) */
export function helpStat(c: Pick<Child, 'stats' | 'lean'>): StatId {
  let best: StatId = c.lean ?? 'strength'
  let n = c.stats[best]?.born ?? 0
  for (const id of STAT_IDS) {
    const b = c.stats[id]?.born ?? 0
    if (b > n) [best, n] = [id, b]
  }
  return best
}

/** 요람 자리와 아이가 밤에 자는 자리: 내 집 넓힌 방 */
export const CRADLE_SPOT: Tile = { x: SIDE_ROOM.x0 + 1, y: SIDE_ROOM.y1 }

/** 돕는 아이가 하루 동안 다니는 자리 (아침 우물가 → 낮 장터 → 저녁 집 앞 → 밤 집 안) */
export const HELPER_SPOTS: readonly { from: number; at: Tile }[] = [
  { from: 7 * 60, at: { x: 23, y: 15 } },
  { from: 11 * 60, at: { x: 28, y: 15 } },
  { from: 16 * 60, at: { x: HOME_FRONT.x - 1, y: HOME_FRONT.y } },
  { from: 20 * 60, at: CRADLE_SPOT },
]

export function helperSpot(minute: number): Tile {
  let at = CRADLE_SPOT
  for (const s of HELPER_SPOTS) if (minute >= s.from) at = s.at
  return at
}

export function sanitizeChild(raw: unknown): Child | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<Child>
  if (typeof o.name !== 'string' || (o.look !== 'boy' && o.look !== 'girl') || typeof o.born !== 'number' || !Number.isInteger(o.born)) return null
  const lean = typeof o.lean === 'string' && (STAT_IDS as readonly string[]).includes(o.lean) ? (o.lean as StatId) : null
  const mode = o.mode === 'follow' || o.mode === 'home' || o.mode === 'roam' ? o.mode : undefined
  const job = typeof o.job === 'string' && ADULT_JOBS.includes(o.job as AdultJob) ? (o.job as AdultJob) : undefined
  const interests: Partial<Record<AdultJob,number>> = {}
  if(o.interests && typeof o.interests === 'object') for(const id of ADULT_JOBS) {
    const n=o.interests[id]
    if(typeof n==='number' && Number.isFinite(n) && n>0) interests[id]=Math.min(100,Math.floor(n))
  }
  const close = typeof o.close === 'number' && Number.isFinite(o.close) ? Math.max(0, Math.min(100, Math.round(o.close))) : 0
  return {
    name: o.name.slice(0, 12),
    look: o.look,
    born: o.born,
    stats: sanitizeStats(o.stats),
    lean,
    ...(mode ? { mode } : {}),
    ...(job ? { job, left: !!o.left, jobConfirmed: o.jobConfirmed !== false } : {}),
    ...(Object.keys(interests).length ? { interests } : {}),
    ...(close ? { close } : {}),
    ...(typeof o.cared === 'number' && Number.isFinite(o.cared) && o.cared > 0 ? { cared: Math.min(TODDLER_AT, Math.floor(o.cared)) } : {}),
    ...(typeof o.inherited === 'number' && Number.isFinite(o.inherited) ? { inherited: Math.max(0, Math.min(100, Math.round(o.inherited))) } : {}),
    ...(o.kidFlags && typeof o.kidFlags === 'object' ? { kidFlags: Object.fromEntries(Object.entries(o.kidFlags).filter((e): e is [string, number] => typeof e[1] === 'number' && Number.isFinite(e[1]))) } : {}),
    ...(o.wardrobe && typeof o.wardrobe === 'object' ? { wardrobe: o.wardrobe } : {}),
    ...(typeof o.temper === 'string' && (TEMPERS as readonly string[]).includes(o.temper) ? { temper: o.temper as Temper } : {}),
    ...(typeof o.catch === 'string' && cleanCatch(o.catch) ? { catch: cleanCatch(o.catch) } : {}),
  }
}
