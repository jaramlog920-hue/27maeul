// 계획 20 2부 작업 A: 주민 자율 가족의 하루 정산 (아침 단계에서 하루에 한 번, D18).
// 순서: 관계(헤어짐·친한 사이·연인·상담 시작) → 결혼(부부 되기·결혼 준비) → 출생(침대 부탁·아이) → 자라기.
import { featureAccess } from './feature-rules'
import { withLookDefaults } from './avatar'
import { ROOMS } from './world'
import { closeKin } from './gen-kin'
import { MAX_CATCHUP, PLAYER_COOLING } from './gen-config'
import { ensureBakerBaby, ensureFixed, newGenState, relationId, type GenState, type Relation } from './gen'
import { settleRelations, type DayCtx } from './gen-relations'
import { settleMarriage, type HomeOf } from './gen-marriage'
import { settleBirth, type AvatarOf } from './gen-birth'
import { pauseResidentAging, settleGrowth, slotOfPerson, slotPerson } from './gen-growth'
import { peopleData } from './people'
import type { GameState } from './game'
import type { GameContent } from './types'

/** 플레이어가 공들이는 연애 후보로 보는 마음 점수 (6하트) — 가장 높은 후보가 이만큼이면 그 사람은 다른 주민과 사귀지 않는다 */
export const COURT_POINTS = 60

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

export function homeOfFor(content: GameContent, g?: GenState): HomeOf {
  // 집안 어른이 이웃이 아니어도 첫 마을에 방이 있으면(찻집 등) 그 방이 집 (2026-10-08 버그 22-B·F03: 없는 방에 살아 아기가 안 보였다)
  const rooms = new Set(ROOMS.map((r) => r.owner))
  const resolve = (id: string, seen: Set<string>): ReturnType<HomeOf> | undefined => {
    if (seen.has(id)) return undefined
    seen.add(id)
    const slot = Object.entries(g?.retired ?? {}).find(([, r]) => r.heir === id)?.[0]
    if (slot) {
      const inherited = resolve(slot, seen)
      if (inherited) return inherited
    }
    const fam = content.neighbors.find((n) => n.id === id)?.family
    if (rooms.has(id)) return { home: id, own: true }
    if (fam && rooms.has(fam)) return { home: fam, own: false }
    const p = g?.persons[id]
    const home = p?.household ? g?.households[p.household]?.home : undefined
    if (home && rooms.has(home)) return { home, own: false }
    for (const parent of [...(p?.parents ?? [])].sort()) {
      const inherited = resolve(parent, seen)
      if (inherited) return { ...inherited, own: false }
    }
    return undefined
  }
  return (id) => resolve(id, new Set()) ?? { home: id, own: true }
}

/** 이미 저장된 손주 가구의 잘못된 방 연결만 복원한다. 날짜·관계·출생 예약은 진행하지 않는다. */
export function repairHouseholdHomes(g: GenState, content: GameContent): GenState {
  const homeOf = homeOfFor(content, g)
  for (const h of Object.values(g.households)) {
    if (!h.home.startsWith('g-')) continue
    const home = homeOf(h.home).home
    if (home === h.home || !ROOMS.some((r) => r.owner === home)) continue
    g = { ...g, households: { ...g.households, [h.id]: { ...h, home } } }
  }
  return g
}

export function avatarOfFor(content: GameContent): AvatarOf {
  return (id) => {
    const a = content.neighbors.find((n) => n.id === id)?.avatar
    if (!a) return undefined
    const out: Record<string, number> = {}
    for (const k of ['skin', 'hairFront', 'hairBack', 'top', 'bottom'] as const) if (Number.isInteger(a[k])) out[k] = a[k] as number
    // 머리색은 따로 실어 보낸다 (아기 외형 다섯 값과 섞지 않는다 — babyOf가 hair로 옮긴다)
    const n = content.neighbors.find((x) => x.id === id)!
    const hc = withLookDefaults({ look: n.look ?? 'f', name: n.role, ...a }).hairColor
    if (hc) [out.hairH, out.hairS, out.hairV] = hc
    return out
  }
}

/** 한 날의 정산 */
export function settleOneDay(g: GenState, d: number, s: Partial<Pick<GameState, 'romance' | 'flags' | 'progress' | 'shelved' | 'hearts' | 'avatar'>>, content: GameContent, opts: SettleOpts): GenState {
  const partner = s.romance?.partner ? slotPerson(g, s.romance.partner) : null
  // 자리를 이어받은 자녀는 npc가 없으니 그 자리 id로 (그 자리 이야기 날엔 큰일을 미룬다)
  const busy = (id: string) => { const p = g.persons[id]; return !!p && !!opts.busy?.(p.npc ?? slotOfPerson(g, id)) }
  // 플레이어와 헤어진 사람은 14일 동안 다른 주민과 사귀지 않는다 (사용자 결정 ③)
  // 아직 연인이 없는 플레이어가 가장 공들이는 연애 후보(마음 COURT_POINTS 이상 중 가장 높은 사람, 같으면 모두)는 다른 주민과 사귀지 않는다
  // (2026-10-21 점검: 공들이던 사람이 갑자기 남과 사귀었다 — 모든 후보를 막으면 마을 연애가 멈추므로 가장 가까운 사람만)
  const playerLook = s.avatar?.look ?? 'f'
  const wooable = (id: string) => {
    const slot = slotOfPerson(g, id)
    const p = g.persons[id]
    return !!p?.look && p.look !== playerLook && !p.spouse && !s.flags?.[`friendsOnly:${id}`] && !!content.neighbors.find((n) => n.id === slot)?.romanceable
  }
  const heartOf = (id: string) => s.hearts?.[slotOfPerson(g, id)] ?? 0
  const top = s.romance?.partner ? 0 : Math.max(0, ...Object.keys(g.persons).filter(wooable).map(heartOf))
  const courting = (id: string) => top >= COURT_POINTS && heartOf(id) === top && wooable(id)
  const cooling = (id: string) => {
    const at = s.flags?.[`exPartner:${slotOfPerson(g, id)}`]
    return (typeof at === 'number' && d - at < PLAYER_COOLING) || courting(id)
  }
  const ctx: DayCtx = { partner, busy, cooling }
  if (featureAccess(s, 'autonomy') === 'full') {
    g = settleRelations(g, d, ctx)
    g = settleMarriage(g, d, { ...ctx, weddingFree: opts.weddingFree ?? (() => true) }, homeOfFor(content, g))
    g = settleBirth(g, d, ctx, avatarOfFor(content))
  }
  // 자라기. 은퇴·견습은 없다 (2026-10-21 사용자: 이웃은 계속 그 자리에서 지내고, 다 자란 자녀는 스스로 일을 찾는다) —
  // 180장(다음 세대)부터는 어른이 된 자녀가 자기 일을 찾은 소식이 남는다 (ownJob)
  g = settleGrowth(g, d, { ownJobs: featureAccess(s, 'generations') === 'full', ageless: featureAccess(s, 'autonomy') !== 'full' || !!s.flags?.ageless })
  return ensureBakerBaby(g, d)
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
    let gen = startFriends(newGenState(content, seed, day, withPairs()), day)
    if (featureAccess(s, 'autonomy') !== 'full' || s.flags.ageless) gen = pauseResidentAging(gen, day)
    return { ...s, gen }
  }
  let g = repairHouseholdHomes(ensureFixed(old, content), content)
  if (old.settledDay >= day) {
    g = ensureBakerBaby(g, day)
    if (!g.on || featureAccess(s, 'autonomy') !== 'full' || s.flags.ageless) g = pauseResidentAging(g, day)
    return g === old ? s : { ...s, gen: g }
  }
  if (!g.on) return { ...s, gen: { ...pauseResidentAging(ensureBakerBaby(g, day), day), settledDay: day } }
  g = ensureBakerBaby(g, g.settledDay)
  const last = Math.min(day, g.settledDay + MAX_CATCHUP)
  for (let d = g.settledDay + 1; d <= last; d++) {
    g = settleOneDay(g, d, s, content, opts)
  }
  // 지난 날의 만남 수는 버린다
  g = ensureBakerBaby(g, day)
  if (featureAccess(s, 'autonomy') !== 'full' || s.flags.ageless) g = pauseResidentAging(g, day)
  return { ...s, gen: { ...g, meets: {}, settledDay: day } }
}

/** 자율 진행 켜고 끄기 (D17·P14): 다시 켤 때 settledDay를 오늘로 맞춰 지나간 기간을 한꺼번에 처리하지 않는다 */
export function setGenOn(s: GameState, on: boolean): GameState {
  if (!s.gen || (on && featureAccess(s, 'autonomy') !== 'full')) return s
  const gen = pauseResidentAging(s.gen, s.clock.day, s.gen.on)
  return { ...s, gen: { ...gen, on, settledDay: s.clock.day } }
}

/** 주민이 나이 드는지 켜고 끄기 — 자율 생활이 열려야 켤 수 있고(화면·직접 호출 모두), 멈춰 있던 날은 그대로 쌓아 둔다 */
export function setResidentAging(s: GameState, on: boolean): GameState {
  if (on && featureAccess(s, 'autonomy') !== 'full') return s
  const flags = { ...s.flags }
  if (on) delete flags.ageless
  else flags.ageless = 1
  const wasPaused = !!s.flags.ageless || featureAccess(s, 'autonomy') !== 'full' || s.gen?.on === false
  const gen = s.gen && (wasPaused || !on) ? pauseResidentAging(s.gen, s.clock.day, !wasPaused) : s.gen
  return { ...s, flags, ...(gen ? { gen } : {}) }
}

export { relationId }
