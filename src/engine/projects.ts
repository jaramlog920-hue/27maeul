// 주민이 함께 바꾸는 마을 (계획 16 작업 20, 기획 07): 사랑방 게시판의 공동 시설 제안 → 하나 고르기 → 주민별 기여(고정 공급분, 대기 진행)
// → 선택적인 거들기(손일 재사용)와 선택 장식 → 설치 → 이웃이 쓰기 시작.
// 규칙: 마감일·미완성 불이익 없음. 주민 공급분만으로도 끝난다(플레이어가 혼자 다 부담하지 않음). 필사·책상·서고에는 조건을 걸지 않는다.
// 설치 여부는 완료 표식 하나(flags['story:village:<id>'])로만 판정한다 — 그 표식을 이웃의 일과·말이 Req.story로 읽는다.
// 기존 이웃 부탁 해금과 같은 자리를 만들지 않고(village-sites.ts), 서고 권수로 잠긴 구역 안에도 놓지 않는다. 말씀 조각·필사본은 재료도 보상도 아니다.
import { heartUp, notYet, passTime, playerTile, recordExperienceIn, type GameState } from './game'
import { isWet, weatherOf } from './calendar'
import { isDone, startMini, stepMini, tapMini, type MiniState } from './minigame'
import { npcTile } from './neighbors'
import { has, take } from './items'
import { personOf } from './people'
import { setVillageShown } from './world'
import { FACILITY_IDS, SITES, type FacilityId, type FacilityPlace } from './village-sites'
import type { GameContent, Rng, Tile } from './types'

/** 이웃 한 사람이 하루에 하나씩 보태는 고정 공급분 (사업 하나당 이만큼까지) */
export const PROJECT_SUPPLY = 3
/** 사업 하나가 끝나는 몫 — 처음 고를 때 관심 있는 이웃 공급분보다 크지 않게 정한다(주민만으로도 끝난다) */
export const PROJECT_NEED = 8
/** 게시판에 한꺼번에 보이는 제안 수 / 제안이 되려면 이사 와 있어야 하는 관심 이웃 수 */
export const PROJECT_OFFER_MAX = 3
export const PROJECT_MIN_JOINED = 2
/** 기록자가 거들 수 있는 몫(합쳐서) · 한 번 거드는 데 걸리는 시간(분) */
export const PROJECT_WORK_MAX = 3
export const PROJECT_WORK_MINUTES = 30
/** 이웃이 현장에 모여 일하는 오전 (맑은 날) */
export const CREW_FROM = 10 * 60
export const CREW_TO = 12 * 60
/** 이웃과 이만큼(칸) 안에서 거든다 */
export const SITE_NEAR = 5
/** 주민이 며칠을 건너뛴 접속 뒤에도 한꺼번에 따라잡는 최대 날 수 */
const CATCH_UP_DAYS = 20
/** 거들어 준 이웃에게 완성 때 오르는 마음 (한 번) */
export const PROJECT_HEART = 2

export interface ProjectProgress {
  /** 고른 날 */
  day: number
  /** 끝나는 몫 (고를 때 정한다) */
  need: number
  units: number
  /** 이웃마다 보탠 횟수 (공급분 PROJECT_SUPPLY까지) */
  given: Record<string, number>
  /** 기록자가 거든 날 (하루 한 번) */
  worked: number[]
  /** 기록자와 실제로 함께 일한 이웃 */
  with: string[]
  /** 선택 장식을 보탰는가 / 지금 장식을 보이는가 (보태면 언제든 바꿀 수 있다) */
  donated: boolean
  look: 0 | 1
}
export interface VillageWork { id: FacilityId; day: number; mini: MiniState }
export interface Village {
  /** 지금 진행 중인 사업 (한 번에 하나) */
  active?: FacilityId
  /** 주민 기여를 마지막으로 처리한 날 */
  lastDay: number
  projects: Partial<Record<FacilityId, ProjectProgress>>
  work?: VillageWork
}
export const NO_VILLAGE: Village = { lastDay: 0, projects: {} }

type Flags = Record<string, number>
type VState = Pick<GameState, 'clock' | 'flags'> & { village?: Village }
type Content = Pick<GameContent, 'neighbors'>

export const villageOf = (s: { village?: Village }): Village => s.village ?? NO_VILLAGE
export const builtFlag = (id: FacilityId) => `story:village:${id}`
export const isBuilt = (flags: Flags, id: FacilityId): boolean => (flags[builtFlag(id)] ?? 0) > 0
export const builtIds = (flags: Flags): FacilityId[] => FACILITY_IDS.filter((id) => isBuilt(flags, id))

/** 마을에 보이는 시설 자리 (진행 중 + 완성) */
export function shownPlaces(s: Pick<GameState, 'flags'> & { village?: Village }): FacilityPlace[] {
  const act = villageOf(s).active
  return FACILITY_IDS.filter((id) => isBuilt(s.flags, id) || id === act).map((id) => SITES[id].place)
}
/** 지도(world.placeAt)가 이 게임의 공동 시설을 보게 한다 — 상태가 바뀔 때·불러올 때·syncHome에서 */
export function syncVillage(s: Pick<GameState, 'flags'> & { village?: Village }): void {
  setVillageShown(shownPlaces(s))
}

/** 이사 와 있고 장날에만 오지 않는 관심 이웃 */
export function eligible(s: Pick<GameState, 'flags'>, content: Content, id: FacilityId): string[] {
  const level = s.flags.villageLevel ?? 0
  return SITES[id].interested.filter((n) => {
    const d = content.neighbors.find((x) => x.id === n)
    return !!d && !d.marketOnly && !notYet(d, level, s.flags)
  })
}

/** 게시판에 보이는 제안 (아직 짓지 않았고, 관심 이웃이 둘 이상 이사 와 있는 것 — 열리지 않은 곳의 이웃만으로는 제안이 되지 않는다) */
export function offeredProjects(s: Pick<GameState, 'flags'> & { village?: Village }, content: Content): FacilityId[] {
  return FACILITY_IDS.filter((id) => !isBuilt(s.flags, id) && eligible(s, content, id).length >= PROJECT_MIN_JOINED).slice(0, PROJECT_OFFER_MAX)
}

export type PickBlock = 'active' | 'built' | 'few' | null
export function canPick(s: Pick<GameState, 'flags'> & { village?: Village }, id: FacilityId, content: Content): PickBlock {
  if (isBuilt(s.flags, id)) return 'built'
  if (villageOf(s).active) return 'active'
  if (eligible(s, content, id).length < PROJECT_MIN_JOINED) return 'few'
  return null
}

/** 이 안으로 해요: 한 번에 하나. 이전에 보탠 장식은 그대로 이어진다 */
export function pickProject(s: GameState, id: FacilityId, content: Content): GameState {
  if (canPick(s, id, content)) return s
  const v = villageOf(s)
  const prev = v.projects[id]
  const need = Math.min(PROJECT_NEED, eligible(s, content, id).length * PROJECT_SUPPLY)
  const p: ProjectProgress = { day: s.clock.day, need, units: prev?.units ?? 0, given: prev?.given ?? {}, worked: prev?.worked ?? [], with: prev?.with ?? [], donated: prev?.donated ?? false, look: prev?.look ?? 0 }
  const next: GameState = { ...s, village: { ...v, active: id, lastDay: s.clock.day, projects: { ...v.projects, [id]: p } } }
  syncVillage(next)
  return next
}

/** 아직 아무것도 시작하지 않았다면 다시 고를 수 있다 (고른 날, 보탠 것 없음) */
export function canUndoPick(s: Pick<GameState, 'clock'> & { village?: Village }): boolean {
  const v = villageOf(s)
  const p = v.active && v.projects[v.active]
  return !!p && p.units === 0 && p.day === s.clock.day && !p.donated && !v.work
}
export function undoPick(s: GameState): GameState {
  if (!canUndoPick(s)) return s
  const v = villageOf(s)
  const projects = { ...v.projects }
  delete projects[v.active!]
  const next: GameState = { ...s, village: { ...v, active: undefined, projects } }
  syncVillage(next)
  return next
}

const setProject = (s: GameState, id: FacilityId, p: ProjectProgress): GameState => ({ ...s, village: { ...villageOf(s), projects: { ...villageOf(s).projects, [id]: p } } })

/** 그날 기준으로 경험을 남긴다 (날짜를 건너뛴 접속에서도 그날의 날씨·계절이 기억에 남도록) */
function onDay(s: GameState, day: number, fn: (x: GameState) => GameState): GameState {
  const r = fn({ ...s, clock: { ...s.clock, day } })
  return { ...r, clock: s.clock }
}

/**
 * 사업이 끝났다 — 완료 표식 하나(한 번만), 마을에 시설이 서고, 함께한 이웃의 기억, 기록자와 함께 일한 이웃에게만 마음.
 * 이미 표식이 있으면 아무것도 바꾸지 않는다 (같은 지급·기억이 두 번 나가지 않게)
 */
export function completeProject(s: GameState, id: FacilityId, day: number): GameState {
  if (isBuilt(s.flags, id)) return s
  const v = villageOf(s)
  const p = v.projects[id]
  let next: GameState = { ...s, flags: { ...s.flags, [builtFlag(id)]: 1 }, village: { ...v, active: v.active === id ? undefined : v.active, work: v.work?.id === id ? undefined : v.work } }
  const crew = Object.entries(p?.given ?? {}).filter(([, n]) => n > 0).map(([npc]) => npc)
  const who = [...new Set([...crew, ...(p?.with ?? [])])]
  if (who.length) next = onDay(next, day, (x) => recordExperienceIn(x, { id: `project:${id}`, kind: 'project', with: who, place: SITES[id].place }))
  for (const npc of p?.with ?? []) next = heartUp(next, npc, PROJECT_HEART)
  syncVillage(next)
  return next
}

/**
 * 하루가 지난 아침마다 관심 이웃이 한 사람 1씩 보탠다 (고정 공급분 PROJECT_SUPPLY까지, 플레이어가 없어도) — 그들의 경험으로 남는다.
 * 같은 날은 한 번만 (lastDay), 날짜를 건너뛴 접속도 하루씩 따라잡는다
 */
export function advanceVillage(s: GameState, content: Content): GameState {
  const v = villageOf(s)
  const id = v.active
  if (!id) return s
  const first = v.projects[id]
  if (!first || isBuilt(s.flags, id)) return { ...s, village: { ...v, active: undefined } }
  if (v.lastDay >= s.clock.day) return s
  let p: ProjectProgress = { ...first, given: { ...first.given } }
  let next: GameState = s
  for (let d = Math.max(v.lastDay + 1, s.clock.day - CATCH_UP_DAYS); d <= s.clock.day; d++) {
    const who = eligible(next, content, id).filter((n) => (p.given[n] ?? 0) < PROJECT_SUPPLY)
    if (!who.length) continue
    for (const n of who) p.given[n] = (p.given[n] ?? 0) + 1
    p = { ...p, units: Math.min(p.need, p.units + who.length) }
    next = setProject(next, id, p)
    next = onDay(next, d, (x) => recordExperienceIn(x, { id: `project:${id}`, kind: 'project', with: who, place: SITES[id].place }))
    if (p.units >= p.need) {
      next = completeProject(next, id, d)
      break
    }
  }
  return { ...next, village: { ...villageOf(next), lastDay: s.clock.day } }
}

// ── 현장에서 일하는 이웃과 거들기 ──

/** 지금 현장에 모여 일하는 이웃과 선 칸 (맑은 오전, 아직 보탤 몫이 남은 이웃) — game.ts lateSpots가 덮는다 */
export function crewNow(s: VState, content: Content, joined?: (id: string) => boolean): Record<string, Tile> {
  const v = villageOf(s)
  const id = v.active
  const p = id && v.projects[id]
  if (!id || !p || s.clock.minute < CREW_FROM || s.clock.minute >= CREW_TO || isWet(weatherOf(s.clock.day))) return {}
  const out: Record<string, Tile> = {}
  eligible(s, content, id)
    .filter((n) => (p.given[n] ?? 0) < PROJECT_SUPPLY && (!joined || joined(n)))
    .forEach((n, i) => {
      out[n] = SITES[id].crew[i]
    })
  return out
}

const dist = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const siteNear = (s: GameState, id: FacilityId) => dist(playerTile(s), SITES[id].stand) <= SITE_NEAR

/** 지금 현장 곁에 보이는 일하는 이웃 */
export function crewPresent(s: GameState, content: Content): string[] {
  const id = villageOf(s).active
  if (!id) return []
  return Object.keys(crewNow(s, content)).filter((n) => {
    const npc = s.npcs[n]
    return !!npc?.visible && dist(npcTile(npc), SITES[id].stand) <= SITE_NEAR + 1
  })
}

export type WorkBlock = 'none' | 'done' | 'wet' | 'time' | 'far' | 'nobody' | 'max' | null
export function canWork(s: GameState, content: Content): WorkBlock {
  const v = villageOf(s)
  const id = v.active
  const p = id && v.projects[id]
  if (!id || !p) return 'none'
  if (v.work?.day === s.clock.day) return null
  if (p.worked.includes(s.clock.day)) return 'done'
  if (p.worked.length >= PROJECT_WORK_MAX) return 'max'
  if (isWet(weatherOf(s.clock.day))) return 'wet'
  if (s.clock.minute < CREW_FROM || s.clock.minute >= CREW_TO) return 'time'
  if (!siteNear(s, id)) return 'far'
  if (!crewPresent(s, content).length) return 'nobody'
  return null
}

export function startWork(s: GameState, content: Content, rng: Rng): GameState {
  const v = villageOf(s)
  if (canWork(s, content) || !v.active) return s
  if (v.work?.day === s.clock.day) return s
  return { ...s, village: { ...v, work: { id: v.active, day: s.clock.day, mini: startMini(SITES[v.active].hand, rng) } } }
}

export function workHand(s: GameState, kind: 'tick' | 'tap', input: number, rng: Rng): GameState {
  const v = villageOf(s)
  const w = v.work
  if (!w || w.day !== s.clock.day || v.active !== w.id) return s
  const mini = kind === 'tick' ? stepMini(w.mini, Math.min(0.2, Math.max(0, input)), rng) : tapMini(w.mini, input)
  return { ...s, village: { ...v, work: { ...w, mini } } }
}

/** 손일을 마치면 몫 하나, 30분. 함께 일한 이웃은 지금 현장 곁에 있는 이웃뿐 (그 이웃의 기억·마음) */
export function finishWork(s: GameState, content: Content): GameState {
  const v = villageOf(s)
  const w = v.work
  const id = v.active
  const p = id && v.projects[id]
  if (!w || !id || !p || w.id !== id || w.day !== s.clock.day || !isDone(w.mini)) return s
  const crew = crewPresent(s, content)
  const done = !p.worked.includes(s.clock.day)
  const np: ProjectProgress = done
    ? { ...p, units: Math.min(p.need, p.units + 1), worked: [...p.worked, s.clock.day], with: [...new Set([...p.with, ...crew])] }
    : p
  let next: GameState = { ...setProject(s, id, np), village: { ...villageOf(setProject(s, id, np)), work: undefined } }
  if (done && crew.length) next = recordExperienceIn(next, { id: `project:${id}`, kind: 'project', with: crew, place: SITES[id].place })
  next = passTime(next, PROJECT_WORK_MINUTES)
  if (np.units >= np.need) next = completeProject(next, id, next.clock.day)
  return next
}

/** 거들다 그만둬도 손일만 버린다 (몫·시간은 쓰지 않는다) */
export function dropWork(s: GameState): GameState {
  const v = villageOf(s)
  return v.work ? { ...s, village: { ...v, work: undefined } } : s
}

// ── 선택 장식 ──

export type DonateBlock = 'none' | 'already' | 'have' | null
export function canDonate(s: GameState, id: FacilityId): DonateBlock {
  const p = villageOf(s).projects[id]
  if (!p || (villageOf(s).active !== id && !isBuilt(s.flags, id))) return 'none'
  if (p.donated) return 'already'
  const d = SITES[id].decor
  return has(s.inv, { [d.item]: d.n }) ? null : 'have'
}

/** 선택 장식에 보탠다: 재료는 한 번만 내고(진행 중이면 몫 하나도 보탠다), 그 뒤로 장식을 보일지 말지는 언제든 바꾼다 */
export function donate(s: GameState, id: FacilityId): GameState {
  if (canDonate(s, id)) return s
  const d = SITES[id].decor
  const p = villageOf(s).projects[id]!
  const inv = take(s.inv, { [d.item]: d.n })!
  const building = villageOf(s).active === id && !isBuilt(s.flags, id)
  const np: ProjectProgress = { ...p, donated: true, look: 1, units: building ? Math.min(p.need, p.units + 1) : p.units }
  let next: GameState = { ...setProject(s, id, np), inv }
  if (building && np.units >= np.need) next = completeProject(next, id, s.clock.day)
  return next
}

export function setLook(s: GameState, id: FacilityId, look: 0 | 1): GameState {
  const p = villageOf(s).projects[id]
  if (!p || !p.donated || p.look === look) return s
  return setProject(s, id, { ...p, look })
}

// ── 그림·사용 ──

export interface VillageScene {
  id: FacilityId
  /** 0 재료만 · 1 골격 · 2 거의 다 · 3 완성 */
  stage: 0 | 1 | 2 | 3
  look: 0 | 1
}
/** 지금 마을에 보이는 시설 (진행 중이면 진행 정도, 완성이면 3) */
export function villageScenes(s: VState): VillageScene[] {
  const v = villageOf(s)
  const out: VillageScene[] = []
  for (const id of FACILITY_IDS) {
    const p = v.projects[id]
    if (isBuilt(s.flags, id)) out.push({ id, stage: 3, look: p?.look ?? 0 })
    else if (v.active === id && p) {
      const r = p.need ? p.units / p.need : 0
      out.push({ id, stage: r < 1 / 3 ? 0 : r < 2 / 3 ? 1 : 2, look: p.look })
    }
  }
  return out
}

/** 시설 곁에 지금 보이는 참여 이웃 (함께 지은 이웃만 시설을 쓴다) */
export function usersAt(s: GameState, id: FacilityId): string[] {
  const exp = s.life?.experiences?.[`project:${id}`]
  if (!exp) return []
  return exp.with.filter((n) => {
    const npc = s.npcs[n]
    return !!npc?.visible && SITES[id].tiles.some((t) => dist(npcTile(npc), t) <= 3)
  })
}

/** 이웃이 하는 말 (의견 · 다른 안이 고른 뒤 · 거들 때 · 쓸 때) */
export function projectLine(npc: string, id: FacilityId, at: 'opinion' | 'next' | 'work' | 'used'): string | null {
  return personOf(npc)?.projectLines?.[id]?.[at] ?? null
}

// ── 저장 ──

const isId = (x: unknown): x is FacilityId => typeof x === 'string' && (FACILITY_IDS as readonly string[]).includes(x)
const int = (x: unknown, lo: number, hi: number) => (typeof x === 'number' && Number.isInteger(x) ? Math.max(lo, Math.min(hi, x)) : lo)

/** 옛 저장은 비어 있다. 모르는 사업·깨진 값은 버리고, 이미 지은 시설(완료 표식)은 흔들지 않는다 */
export function sanitizeVillage(raw: unknown, flags: Flags, day: number): Village | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Partial<Village>
  const projects: Partial<Record<FacilityId, ProjectProgress>> = {}
  for (const id of FACILITY_IDS) {
    const p = (r.projects as Record<string, unknown> | undefined)?.[id] as Partial<ProjectProgress> | undefined
    if (!p || typeof p !== 'object') continue
    const need = int(p.need, 1, PROJECT_NEED)
    const given: Record<string, number> = {}
    for (const [n, c] of Object.entries(p.given && typeof p.given === 'object' ? p.given : {})) if (SITES[id].interested.includes(n)) given[n] = int(c, 0, PROJECT_SUPPLY)
    projects[id] = {
      day: int(p.day, 1, 1e6), need, units: int(p.units, 0, need), given,
      worked: Array.isArray(p.worked) ? [...new Set(p.worked.filter((d): d is number => Number.isInteger(d) && d >= 1))].slice(-PROJECT_WORK_MAX) : [],
      with: Array.isArray(p.with) ? [...new Set(p.with.filter((n): n is string => typeof n === 'string' && SITES[id].interested.includes(n)))] : [],
      donated: p.donated === true, look: p.donated === true && p.look === 1 ? 1 : 0,
    }
  }
  const active = isId(r.active) && !isBuilt(flags, r.active) && projects[r.active] ? r.active : undefined
  const out: Village = { lastDay: int(r.lastDay, 0, 1e6), projects }
  if (active) out.active = active
  // 하던 손일은 같은 날 같은 사업이면 처음부터 다시 (저장·재접속에도 몫은 한 번만)
  const w = r.work as Partial<VillageWork> | undefined
  if (w && active && w.id === active && w.day === day) out.work = { id: active, day, mini: startMini(SITES[active].hand, () => 0.5) }
  return out
}
