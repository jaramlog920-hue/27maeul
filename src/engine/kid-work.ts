// 집 겸 일터 주인 (2026-10-14 사용자: 한 채만은 안 된다 — 우리 아이 셋 모두, 이웃이 낳은 아이들도 원하면 지어 줄 수 있게).
// 우리 아이: 어른이 되어 일이 정해졌고 마을을 떠나지 않은 아이마다 한 채 ('me:<태어난 날>').
// 이웃 자녀: 고정 주민이 낳은 아이가 어른이 되었고, 그 부모와 마음이 다섯 이상이면 (자기 일터를 꿈꾸는 이야기를 들은 사이) 한 채 — 일은 스스로 찾은 일 (persona residentJob).
// 이웃 (2026-10-21 사용자: 모든 이웃의 꿈터): 새 터가 열린 뒤 마음 넷 이상인 이웃에게 「꿈 이야기 듣기」를 들으면 그 이웃의 꿈터 ('npc:<id>').
//   페넬로피·틸리는 따로 쓴 꿈(직조인의 공방·그림방)이 있어 빼고, 자리를 물려준 이웃도 뺀다 (그 자리는 자녀가 잇는다).
import { childHome, childStage, type AdultJob, type Child } from './child'
import { overflows, putAway, type GameState } from './game'
import type { ItemId } from './types'
import { heartsOf } from './hearts'
import NEIGHBORS from '../content/neighbors.json'
import { slotOfPerson } from './gen-growth'
import { residentJob } from './persona'
import { buildsOf, type Build } from './newland-build'
import type { GenPerson } from './gen'
import { allKids } from './siblings'

/** 부모 이웃의 일 → 그 자녀가 꾸릴 일터 그림 */
const PARENT_JOB: Record<string, AdultJob> = {
  baker: 'cook', wendell: 'cook', presser: 'cook', smith: 'woodworker', tilly: 'potter', carpenter: 'woodworker', rudy: 'woodworker',
  weaver: 'weaver', penelope: 'weaver', shepherd: 'weaver', fisher: 'fisher', cosmo: 'shipwright', apothecary: 'herbalist', basil: 'herbalist',
  beekeeper: 'gardener', juniper: 'gardener', grandpa: 'gardener', marigold: 'gardener', merchant: 'merchant', postman: 'scribe',
  poppy: 'teaKeeper', dexter: 'painter', child: 'gardener',
}
export const RESIDENT_KID_HEARTS = 5
/** 이웃 자리의 일 (자리를 이어받은 자녀가 하는 일 — 성격 대사의 {job}) */
export const slotJob = (slot: string): AdultJob | null => PARENT_JOB[slot] ?? null

/** 꿈 이야기를 들려줄 수 있는 이웃 (따로 쓴 꿈이 있는 페넬로피·틸리 빼고, 일이 정해진 이웃) */
export const DREAM_JOB_NPCS: readonly string[] = Object.keys(PARENT_JOB).filter((id) => id !== 'penelope' && id !== 'tilly')
const NPC_ROLE = new Map((NEIGHBORS as { id: string; role: string }[]).map((n) => [n.id, n.role]))
const npcKey = (id: string) => `npc:${id}`

export interface KidWorkOwner {
  owner: string
  name: string
  job: AdultJob
}

const myKey = (born: number) => `me:${born}`

/** 이미 지은(또는 주문한) 집 겸 일터의 주인들 — 주인 없는 옛 기록은 함께하는 아이 몫 */
function ownedKeys(s: GameState): Set<string> {
  const out = new Set<string>()
  for (const b of buildsOf(s)) if (b.kind === 'kidWork') out.add(b.owner ?? (s.child ? myKey(s.child.born) : 'me:?'))
  return out
}

/** 이웃 자녀의 부모 이웃 자리 id (고정 주민, 또는 자리를 이어받은 부모의 그 자리) */
function fixedParentOf(s: Pick<GameState,'gen'>, id: string): string | null {
  const p = s.gen?.persons[id]
  for (const q of p?.parents ?? []) {
    const parent = s.gen?.persons[q]
    if (parent?.origin === 'fixed') return parent.npc ?? parent.id
    // 부모가 이웃 자리를 이어받은 자녀면 그 자리 (손주 대 — 2026-10-20)
    const slot = slotOfPerson(s.gen, q)
    if (slot !== q) return slot
  }
  return null
}

/** 지금 지어 줄 수 있는 주인 후보 */
export function kidWorkOwners(s: GameState): KidWorkOwner[] {
  const owned = ownedKeys(s)
  const out: KidWorkOwner[] = []
  for (const k of allKids(s)) {
    const key = myKey(k.born)
    if (owned.has(key) || !k.job || childStage(k, s.clock.day) !== 'adult') continue
    // 멀리 떠난 아이만 뺀다 — 공동 주택(하숙)에 사는 아이는 마을 아이 (일터 규칙 kidWorkers와 같게, 2026-10-21 점검)
    if (childHome({ child: k, flags: k.born === s.child?.born ? s.flags : k.kidFlags ?? {} }) === 'away') continue
    out.push({ owner: key, name: k.name, job: k.job })
  }
  // 꿈 이야기를 들은 이웃 (아직 자리를 물려주지 않은)
  for (const id of DREAM_JOB_NPCS) {
    if (!s.flags[`dream:${id}`] || owned.has(npcKey(id)) || s.gen?.retired?.[id]) continue
    out.push({ owner: npcKey(id), name: NPC_ROLE.get(id) ?? id, job: PARENT_JOB[id] })
  }
  for (const p of Object.values(s.gen?.persons ?? {})) {
    if (p.origin !== 'born' || p.stage !== 'adult' || owned.has(p.id)) continue
    const parent = fixedParentOf(s, p.id)
    if (!parent || heartsOf(s.hearts[parent]) < RESIDENT_KID_HEARTS) continue
    out.push({ owner: p.id, name: p.name ?? '', job: residentJob(s.gen, p.id) ?? 'gardener' })
  }
  return out
}

/** 그 일터 주인의 일 (그림·이름표) — 모르면 null */
export function ownerJob(s: Pick<GameState,'child'|'siblings'|'gen'>, owner: string | undefined): AdultJob | null {
  if (!owner) return s.child?.job ?? null
  if (owner.startsWith('me:')) return allKids(s).find((k) => myKey(k.born) === owner)?.job ?? null
  if (owner.startsWith('npc:')) return PARENT_JOB[owner.slice(4)] ?? null
  // 마을 아이는 스스로 찾은 일 (부모 일을 물려받지 않는다 — 2026-10-21)
  return residentJob(s.gen, owner)
}

export function ownerName(s: GameState, owner: string | undefined): string {
  if (!owner) return s.child?.name ?? ''
  if (owner.startsWith('me:')) return allKids(s).find((k) => myKey(k.born) === owner)?.name ?? ''
  if (owner.startsWith('npc:')) return NPC_ROLE.get(owner.slice(4)) ?? ''
  return s.gen?.persons[owner]?.name ?? ''
}

/** 집 겸 일터마다 지금 일하는 사람 (그림·길 막기 같은 기준) — 우리 아이면 kid, 이웃 자녀면 resident */
export function kidWorkers(s: GameState): { build: Build; job: AdultJob; kid: Child | null; resident: GenPerson | null; npc?: string }[] {
  const out: { build: Build; job: AdultJob; kid: Child | null; resident: GenPerson | null; npc?: string }[] = []
  for (const build of buildsOf(s)) {
    if (build.kind !== 'kidWork' || build.state !== 'done') continue
    // 이웃의 꿈터: 그 이웃이 낮에 문 옆에서 일한다 (자리를 물려주면 쉰다)
    if (build.owner?.startsWith('npc:')) {
      const id = build.owner.slice(4)
      const job = PARENT_JOB[id]
      if (job && !s.gen?.retired?.[id]) out.push({ build, job, kid: null, resident: null, npc: id })
      continue
    }
    const kid = build.owner?.startsWith('me:') ? allKids(s).find((k) => myKey(k.born) === build.owner) ?? null : !build.owner ? s.child ?? null : null
    const resident = build.owner && !build.owner.startsWith('me:') ? s.gen?.persons[build.owner] ?? null : null
    let job: AdultJob | null = null
    if (kid) {
      const flags = kid.born === s.child?.born ? s.flags : kid.kidFlags ?? {}
      job = kid.job && childHome({ child: kid, flags }) !== 'away' && childStage(kid, s.clock.day) === 'adult' ? kid.job : null
    } else if (resident && (resident.stage === 'adult' || resident.stage === 'elder')) job = ownerJob(s, build.owner)
    if (job) out.push({ build, job, kid, resident })
  }
  return out
}

/** 이웃 꿈터의 선물 간격 (공방·그림방과 같은 이레) */
export const NPC_DREAM_GIFT_GAP = 7
/**
 * 이웃의 꿈터에 들르기 (2026-10-21 점검: 21곳이 모두 같은 곳처럼 느껴졌다): 처음 들른 날은 문 연 날의 말,
 * 그 뒤로는 이레마다 그 이웃이 늘 건네던 것(neighbors.json help.gives)을 하나 챙겨 준다 (가방·궤짝이 차면 다음에)
 */
export function visitNpcDream(s: GameState, npc: string): { state: GameState; first: boolean; gift?: Partial<Record<ItemId, number>> } {
  const openKey = `npcDreamOpen:${npc}`
  const giftKey = `npcDreamGift:${npc}`
  const day = s.clock.day
  if (!s.flags[openKey]) return { state: { ...s, flags: { ...s.flags, [openKey]: day, [giftKey]: day } }, first: true }
  const last = s.flags[giftKey] ?? 0
  const gives = (NEIGHBORS as { id: string; help?: { gives?: Partial<Record<ItemId, number>> } }[]).find((n) => n.id === npc)?.help?.gives
  if (!gives || day - last < NPC_DREAM_GIFT_GAP || overflows(s, gives)) return { state: s, first: false }
  const put = putAway(s, gives)
  return { state: { ...put, flags: { ...put.flags, [giftKey]: day } }, first: false, gift: gives }
}
