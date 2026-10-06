// 계획 20 2부 작업 A: 주민 자율 가족의 하루 정산 (아침 단계에서 하루에 한 번, D18).
// 순서: 관계(헤어짐·친한 사이·연인·상담 시작) → 결혼(부부 되기·결혼 준비) → 출생(침대 부탁·아이).
import { closeKin } from './gen-kin'
import { MAX_CATCHUP } from './gen-config'
import { ensureFixed, newGenState, relationId, type GenState, type Relation } from './gen'
import { settleRelations, type DayCtx } from './gen-relations'
import { settleMarriage, type HomeOf } from './gen-marriage'
import { settleBirth, type AvatarOf } from './gen-birth'
import { peopleData } from './people'
import type { GameState } from './game'
import type { GameContent } from './types'

export interface SettleOpts {
  /** 오늘 큰 사건이 걸린 주민이면 true — 그 주민의 전환은 보류한다 (다음 정산에 다시 본다) */
  busy?: (npc: string) => boolean
  /** 결혼식을 열 수 있는 날인가 (장날·잔치·플레이어 결혼식 피하기) — 없으면 모든 날 */
  weddingFree?: (day: number) => boolean
  /** 첫 정산에서 한 번 정할 씨앗 (테스트용). 없으면 무작위 */
  seed?: number
}

/** 양쪽 모두에 서로 함께하는 일과(with)가 있는 쌍 (people.json) */
export function withPairs(): [string, string][] {
  const people = peopleData().people
  const one = new Set<string>()
  for (const p of Object.values(people)) for (const r of p.routines ?? []) if (r.with) one.add(`${p.id}>${r.with}`)
  const out: [string, string][] = []
  for (const x of one) {
    const [a, b] = x.split('>')
    if (a < b && one.has(`${b}>${a}`)) out.push([a, b])
  }
  return out.sort()
}

/** 처음 만들 때: 이미 30 이상인 남은 소식 없이 친한 사이로 시작한다 */
function startFriends(g: GenState, day: number): GenState {
  const relations = { ...g.relations }
  for (const [id, v] of Object.entries(g.affinity)) {
    const [a, b] = id.split('|')
    if (v >= 30 && !relations[id] && g.persons[a] && g.persons[b] && !closeKin(g.persons, a, b)) relations[id] = { id, a, b, stage: 'friend', since: day } satisfies Relation
  }
  return { ...g, relations }
}

export function homeOfFor(content: GameContent): HomeOf {
  const ids = new Set(content.neighbors.map((n) => n.id))
  return (id) => {
    const fam = content.neighbors.find((n) => n.id === id)?.family
    return fam && ids.has(fam) ? { home: fam, own: false } : { home: id, own: true }
  }
}

export function avatarOfFor(content: GameContent): AvatarOf {
  return (id) => {
    const a = content.neighbors.find((n) => n.id === id)?.avatar
    if (!a) return undefined
    const out: Record<string, number> = {}
    for (const k of ['skin', 'hairFront', 'hairBack', 'top', 'bottom'] as const) if (Number.isInteger(a[k])) out[k] = a[k] as number
    return out
  }
}

/** 한 날의 정산 */
export function settleOneDay(g: GenState, d: number, s: Partial<Pick<GameState, 'romance'>>, content: GameContent, opts: SettleOpts): GenState {
  const partner = s.romance?.partner ?? null
  const busy = (id: string) => !!(g.persons[id]?.npc && opts.busy?.(g.persons[id].npc as string))
  const ctx: DayCtx = { partner, busy }
  g = settleRelations(g, d, ctx)
  g = settleMarriage(g, d, { ...ctx, weddingFree: opts.weddingFree ?? (() => true) }, homeOfFor(content))
  g = settleBirth(g, d, ctx, avatarOfFor(content))
  return g
}

/**
 * 하루 정산 (아침 단계에서 하루에 한 번, D18).
 * - gen이 없으면 만들고 settledDay를 오늘로 (지나간 기간은 처리하지 않는다)
 * - on=false면 settledDay만 오늘로 맞추고 끝
 * - 밀린 날은 순서대로 최대 7일까지만, 나머지는 버린다
 */
export function settleGen(s: GameState, content: GameContent, opts: SettleOpts = {}): GameState {
  const day = s.clock.day
  const old = s.gen
  if (!old) {
    const seed = opts.seed ?? Math.floor(Math.random() * 0x7fffffff)
    return { ...s, gen: startFriends(newGenState(content, seed, day, withPairs()), day) }
  }
  if (old.settledDay >= day) return s
  let g = ensureFixed(old, content)
  if (!g.on) return { ...s, gen: { ...g, settledDay: day } }
  const last = Math.min(day, g.settledDay + MAX_CATCHUP)
  for (let d = g.settledDay + 1; d <= last; d++) g = settleOneDay(g, d, s, content, opts)
  // 지난 날의 만남 수는 버린다
  return { ...s, gen: { ...g, meets: {}, settledDay: day } }
}

/** 자율 진행 켜고 끄기 (D17·P14): 다시 켤 때 settledDay를 오늘로 맞춰 지나간 기간을 한꺼번에 처리하지 않는다 */
export function setGenOn(s: GameState, on: boolean): GameState {
  if (!s.gen) return s
  return { ...s, gen: { ...s.gen, on, settledDay: s.clock.day } }
}

export { relationId }
