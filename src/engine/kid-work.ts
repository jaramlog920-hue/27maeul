// 집 겸 일터 주인 (2026-10-14 사용자: 한 채만은 안 된다 — 우리 아이 셋 모두, 이웃이 낳은 아이들도 원하면 지어 줄 수 있게).
// 우리 아이: 어른이 되어 일이 정해졌고 마을을 떠나지 않은 아이마다 한 채 ('me:<태어난 날>').
// 이웃 자녀: 고정 주민이 낳은 아이가 어른이 되었고, 그 부모와 마음이 다섯 이상이면 (자기 일터를 꿈꾸는 이야기를 들은 사이) 한 채 — 일은 부모의 일을 잇는다.
import { childHome, childStage, type AdultJob } from './child'
import type { GameState } from './game'
import { heartsOf } from './hearts'
import { buildsOf } from './newland-build'
import { allKids } from './siblings'

/** 부모 이웃의 일 → 그 자녀가 꾸릴 일터 그림 */
const PARENT_JOB: Record<string, AdultJob> = {
  baker: 'cook', wendell: 'cook', presser: 'cook', smith: 'woodworker', tilly: 'potter', carpenter: 'woodworker', rudy: 'woodworker',
  weaver: 'weaver', penelope: 'weaver', shepherd: 'weaver', fisher: 'fisher', cosmo: 'shipwright', apothecary: 'herbalist', basil: 'herbalist',
  beekeeper: 'gardener', juniper: 'gardener', grandpa: 'gardener', marigold: 'gardener', merchant: 'merchant', postman: 'scribe',
  poppy: 'teaKeeper', dexter: 'painter', child: 'gardener',
}
export const RESIDENT_KID_HEARTS = 5

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

/** 이웃 자녀의 부모 고정 주민 id */
function fixedParentOf(s: Pick<GameState,'gen'>, id: string): string | null {
  const p = s.gen?.persons[id]
  for (const q of p?.parents ?? []) {
    const parent = s.gen?.persons[q]
    if (parent?.origin === 'fixed') return parent.npc ?? parent.id
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
    if (childHome({ child: k, flags: s.flags }) === 'away' || k.left) continue
    out.push({ owner: key, name: k.name, job: k.job })
  }
  for (const p of Object.values(s.gen?.persons ?? {})) {
    if (p.origin !== 'born' || p.stage !== 'adult' || owned.has(p.id)) continue
    const parent = fixedParentOf(s, p.id)
    if (!parent || heartsOf(s.hearts[parent]) < RESIDENT_KID_HEARTS) continue
    out.push({ owner: p.id, name: p.name ?? '', job: PARENT_JOB[parent] ?? 'gardener' })
  }
  return out
}

/** 그 일터 주인의 일 (그림·이름표) — 모르면 null */
export function ownerJob(s: Pick<GameState,'child'|'siblings'|'gen'>, owner: string | undefined): AdultJob | null {
  if (!owner) return s.child?.job ?? null
  if (owner.startsWith('me:')) return allKids(s).find((k) => myKey(k.born) === owner)?.job ?? null
  const parent = fixedParentOf(s, owner)
  return parent ? (PARENT_JOB[parent] ?? 'gardener') : null
}

export function ownerName(s: GameState, owner: string | undefined): string {
  if (!owner) return s.child?.name ?? ''
  if (owner.startsWith('me:')) return allKids(s).find((k) => myKey(k.born) === owner)?.name ?? ''
  return s.gen?.persons[owner]?.name ?? ''
}
