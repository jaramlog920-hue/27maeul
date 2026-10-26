// 성격 (2026-10-21 사용자: 동물의 숲처럼 — 같은 성격이어도 다른 사람처럼 느껴지게).
// 한 사람 = 성격 하나(말투의 바탕) + 특성 셋까지(무엇에 마음이 가는지) + 말버릇(직접 정해 줄 수 있다).
// 우리 아이: 성격은 걷는 아이 때 함께한 일(관심 interests)로 돕는 아이가 되는 아침 정해지고(Child.temper),
//   특성은 걷는 아이 하나 → 돕는 아이 둘 → 어른 셋으로 늘어난다.
// 주민의 자녀·손주: 부모의 성격·특성을 하나쯤 닮고 나머지는 새로 — 저장하지 않아도 같은 씨앗이면 늘 같다 (말버릇만 저장).
// 처음부터 마을에 있던 이웃은 쓰지 않는다 (그 이웃의 대사는 따로 쓴 것).
import LINES from '../content/persona-lines.json'
import { childStage, type AdultJob, type Child } from './child'
import type { GenPerson, GenState } from './gen'
import type { Weather } from './types'
import { fillSlots } from '../shared/josa'
import { forbiddenIn } from '../content/forbidden'

export const TEMPERS = ['warm', 'bold', 'shy', 'playful', 'sharp', 'easy'] as const
export type Temper = (typeof TEMPERS)[number]
export const TRAITS = ['foodie', 'flowers', 'collector', 'singer', 'timid', 'sleepy', 'crafty', 'skywatch', 'animals', 'gossip'] as const
export type Trait = (typeof TRAITS)[number]
export const MAX_TRAITS = 3
/** 말버릇 글자 수 */
export const CATCH_MAX = 6

export interface Persona {
  temper: Temper
  traits: Trait[]
  catch?: string
}

type Register = 'kid' | 'grown' | 'villager'
type TemperBlock = { greet: string[]; rain: string[]; snow: string[]; sunny: string[]; evening: string[]; family: string[]; dream?: string[]; work?: string[] }
type TraitBlock = { topic: string[]; night: string[] }
const D = LINES as unknown as {
  tempers: Record<Temper, { name: string; catch: string[] }>
  traits: Record<Trait, { name: string; gift: string }>
  temperLines: Record<Temper, Record<Register, TemperBlock>>
  traitLines: Record<Trait, Record<Register, TraitBlock>>
}

export const temperName = (t: Temper): string => D.tempers[t].name
export const traitName = (t: Trait): string => D.traits[t].name
export const catchIdeas = (t: Temper): readonly string[] => D.tempers[t].catch

const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** 함께한 일 → 성격 (책·글이면 똑 부러진, 바다·나무 일이면 씩씩한…) — 가장 많이 한 일로 */
const JOB_TEMPER: Record<AdultJob, Temper> = {
  cook: 'warm', gardener: 'warm', teaKeeper: 'warm',
  fisher: 'bold', sailor: 'bold', shipwright: 'bold', woodworker: 'bold',
  painter: 'shy', weaver: 'shy', potter: 'shy',
  merchant: 'playful', traveler: 'playful', instrumentMaker: 'playful',
  scribe: 'sharp', scholar: 'sharp',
  herbalist: 'easy',
}
/** 처음부터 마을에 있던 이웃의 성격 (자녀가 닮을 때만 쓴다) */
const FIXED_TEMPER: Record<string, Temper> = {
  baker: 'warm', wendell: 'warm', grandpa: 'easy', merchant: 'playful', smith: 'bold', shepherd: 'easy', presser: 'sharp',
  weaver: 'shy', beekeeper: 'easy', postman: 'playful', apothecary: 'sharp', fisher: 'bold', carpenter: 'bold', child: 'playful',
  poppy: 'warm', tilly: 'shy', rudy: 'bold', penelope: 'warm', dexter: 'sharp', juniper: 'shy', cosmo: 'playful', basil: 'easy', marigold: 'warm',
}

function traitsFrom(seed: string, n: number, first?: Trait): Trait[] {
  const out: Trait[] = first ? [first] : []
  let h = hash(seed)
  while (out.length < n) {
    const t = TRAITS[h % TRAITS.length]
    if (!out.includes(t)) out.push(t)
    h = hash(`${seed}:${h}`)
  }
  return out.slice(0, n)
}

/** 관심이 가장 큰 일의 성격 (관심이 없으면 null) */
export function temperFromInterests(c: Pick<Child, 'interests'>): Temper | null {
  const best = Object.entries(c.interests ?? {}).filter(([, n]) => (n ?? 0) > 0).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]
  return best ? JOB_TEMPER[best[0] as AdultJob] ?? null : null
}

/** 우리 아이의 성격 */
export function kidPersona(c: Child, day: number): Persona {
  const stage = childStage(c, day)
  const temper = c.temper ?? temperFromInterests(c) ?? TEMPERS[hash(`kid:${c.born}:${c.name}`) % TEMPERS.length]
  const n = stage === 'adult' ? MAX_TRAITS : stage === 'helper' ? 2 : 1
  return { temper, traits: traitsFrom(`kidtrait:${c.born}`, n), ...(c.catch ? { catch: c.catch } : {}) }
}

/** 주민의 자녀·손주의 성격 (처음부터 있던 이웃은 null) */
export function genPersona(g: Pick<GenState, 'persons' | 'seed'> | undefined, id: string, depth = 0): Persona | null {
  const p: GenPerson | undefined = g?.persons[id]
  if (!g || !p || p.origin !== 'born' || depth > 4) return null
  const r = hash(`${g.seed}:${id}`)
  const parentTempers = p.parents.map((q) => {
    const parent = g.persons[q]
    if (parent?.origin === 'born') return genPersona(g, q, depth + 1)?.temper ?? null
    return FIXED_TEMPER[parent?.npc ?? q] ?? null
  }).filter((t): t is Temper => !!t)
  // 반쯤은 부모 한 사람의 성격을 닮는다
  const temper = parentTempers.length && r % 2 === 0 ? parentTempers[(r >>> 3) % parentTempers.length] : TEMPERS[(r >>> 5) % TEMPERS.length]
  const n = p.stage === 'adult' || p.stage === 'elder' ? MAX_TRAITS : p.stage === 'teen' ? 2 : 1
  // 태어난 주민 부모가 있으면 특성 하나를 닮기도 한다
  const bornParent = p.parents.find((q) => g.persons[q]?.origin === 'born')
  const inherit = bornParent && r % 3 === 0 ? genPersona(g, bornParent, depth + 1)?.traits[0] : undefined
  return { temper, traits: traitsFrom(`gentrait:${g.seed}:${id}`, n, inherit), ...(p.catch ? { catch: p.catch } : {}) }
}

/** 성격마다 마음이 가는 일 (마을에서 자란 아이가 스스로 찾는 일 — 2026-10-21 사용자: 부모 일을 물려받지 않는다) */
const TEMPER_JOBS: Record<Temper, AdultJob[]> = {
  warm: ['cook', 'gardener', 'teaKeeper'],
  bold: ['fisher', 'woodworker', 'shipwright'],
  shy: ['weaver', 'potter', 'painter'],
  playful: ['merchant', 'teaKeeper', 'painter'],
  sharp: ['scribe', 'herbalist', 'merchant'],
  easy: ['gardener', 'herbalist', 'fisher'],
}
/** 마을에서 태어난 사람이 어른이 되어 찾은 일 (어른 전이면 null) */
export function residentJob(g: Pick<GenState, 'persons' | 'seed'> | undefined, id: string): AdultJob | null {
  const p = g?.persons[id]
  if (!p || p.origin !== 'born' || (p.stage !== 'adult' && p.stage !== 'elder')) return null
  const persona = genPersona(g, id)
  if (!persona) return null
  const jobs = TEMPER_JOBS[persona.temper]
  return jobs[hash(`job:${g!.seed}:${id}`) % jobs.length]
}

/** 성격·특성마다 좋아하는 함께하기 (family KID_ACTS id) — 하면 조금 더 가까워진다 (2026-10-21 점검: 성격이 게임에 쓰이지 않았다) */
const TEMPER_LIKES: Record<Temper, string> = { warm: 'cook', bold: 'ball', shy: 'puzzle', playful: 'ball', sharp: 'read', easy: 'walk' }
const TRAIT_LIKES: Record<Trait, string> = { foodie: 'cook', flowers: 'walk', collector: 'tour', singer: 'story', timid: 'read', sleepy: 'story', crafty: 'make', skywatch: 'walk', animals: 'walk', gossip: 'errand' }
export function likedActs(p: Persona): ReadonlySet<string> {
  return new Set([TEMPER_LIKES[p.temper], ...p.traits.map((t) => TRAIT_LIKES[t])])
}
/** 좋아하는 것 한 줄 (특성의 첫 번째) */
export const likesLine = (p: Persona): string | null => (p.traits[0] ? D.traits[p.traits[0]].gift : null)

/** 이름 아래 짧은 줄: "씩씩한 · 먹보 · 동물 친구" */
export const personaTags = (p: Persona): string => [temperName(p.temper), ...p.traits.map(traitName)].join(' · ')

/** 말버릇 정리: 앞뒤 공백·문장부호를 떼고 CATCH_MAX자까지. 비면 없앤다 */
export function cleanCatch(raw: string): string | undefined {
  const s = [...raw.replace(/[\s.,!?~…"'“”‘’]+/g, ' ').trim()].slice(0, CATCH_MAX).join('').trim()
  // 지어낸 말에 쓰지 않는 낱말은 말버릇으로도 받지 않는다 (2026-10-26 감사 A21)
  return s && !forbiddenIn(s) ? s : undefined
}

export interface LineCtx {
  day: number
  minute: number
  weather: Weather
  /** 우리 아이가 부르는 기록자 (엄마·아빠) */
  parent?: string
  /** 주민이 부르는 기록자 이름 */
  player?: string
  /** 그 사람의 일 이름 */
  job?: string
  /** 같은 날 다른 사람과 다른 말이 나오게 (이름·id) */
  salt: string
}

const fillLine = (s: string, c: LineCtx) => (!c.job && s.includes('{job}') ? s.replace(/\{job\}[,\s]*/g, '') : s)
const fillRest = (s: string, c: LineCtx) => fillSlots(s, { parent: c.parent ?? '', player: c.player ?? '', job: c.job ?? '' }, 'keep')
/** 말 앞에 오는 말버릇 (문장 앞에 붙인다) */
const LEADING = new Set(['있잖아', '저기', '음', '흠', '그러니까', '어디 보자', '자', '에헴', '아참'])
/**
 * 말버릇 붙이기: 앞에 오는 말(있잖아·저기…)은 문장 앞에, 나머지는 마지막 문장 끝 부호 앞에 ", 말버릇".
 * 물음으로 끝나는 말 뒤에는 붙이지 않는다 (2026-10-21 점검: "들어 보실래요, 있잖아?")
 */
export const withCatch = (s: string, word?: string): string => {
  if (!word) return s
  if (LEADING.has(word)) return `${word}, ${s}`
  if (/\?\s*$/.test(s)) return s
  return s.replace(/([.!?…~]*)$/, (end) => `, ${word}${end || '.'}`)
}

/**
 * 오늘의 한마디: 성격 줄(말투)과 특성 줄(화제)을 날마다 섞어 — 밤이면 저녁 말과 밤 화제, 비·눈이면 날씨 말.
 * 같은 날 같은 사람이면 같은 말 (말을 다시 걸어도 바뀌지 않는다)
 */
export function personaLine(p: Persona, who: Register, c: LineCtx): string {
  const h = hash(`${c.day}:${c.salt}`)
  const night = c.minute >= 19 * 60 || c.minute < 6 * 60
  const T = D.temperLines[p.temper][who]
  const pick = (xs: readonly string[] | undefined, salt: number) => (xs?.length ? xs[(h >>> salt) % xs.length] : '')
  // 일 이야기는 일이 있는 사람만 ({job}이 비면 빼고 — 어린 주민·일이 없는 사람)
  const topics = [T.greet, T.family, who === 'kid' ? T.dream : c.job ? T.work : undefined].filter((x): x is string[] => !!x?.length)
  const temperLine = night ? pick(T.evening, 2)
    : c.weather === 'rain' && h % 2 ? pick(T.rain, 3)
      : c.weather === 'snow' && h % 2 ? pick(T.snow, 3)
        : c.weather === 'sunny' && h % 5 === 0 ? pick(T.sunny, 4)
          : pick(topics[(h >>> 7) % topics.length], 9)
  const trait = p.traits.length ? p.traits[(h >>> 11) % p.traits.length] : null
  const TL = trait ? D.traitLines[trait][who] : null
  const traitLine = TL ? pick(night ? TL.night : TL.topic, 13) : ''
  // 넷에 둘은 말투+화제, 하나는 말투만, 하나는 화제만
  const mix = h % 4
  const parts = mix === 0 || !traitLine ? [temperLine] : mix === 1 ? [traitLine] : [temperLine, traitLine]
  // 말버릇은 사흘에 하루꼴로만 (늘 붙으면 어색했다 — 2026-10-21 점검)
  const word = p.catch && hash(`catch:${c.day}:${c.salt}`) % 3 === 0 ? p.catch : undefined
  return withCatch(fillRest(fillLine(parts.filter(Boolean).join(' '), c), c), word)
}
