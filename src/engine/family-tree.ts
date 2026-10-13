import type { Avatar } from './avatar'
import { childStage, type Child } from './child'
import { BAKER_BABY_ID, type GenPerson, type GenState } from './gen'
import { slotPerson } from './gen-growth'
import type { Romance } from './romance'

/** 가계도에서 이름을 바꿀 수 있는 사람: 마을에서 태어난 아이(빵집 아기 포함) */
export function canRenamePerson(g: GenState, id: string): boolean {
  const p = g.persons[id]
  return !!p && (p.origin === 'born' || p.id === BAKER_BABY_ID)
}
/** 이름: 앞뒤 공백을 떼고 8자까지. 비면 바꾸지 않는다 */
export const RENAME_MAX = 8
export function renamePerson(g: GenState, id: string, raw: string): GenState {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, RENAME_MAX)
  if (!name || !canRenamePerson(g, id)) return g
  return { ...g, persons: { ...g.persons, [id]: { ...g.persons[id], name } } }
}

export type TreeRelation = 'focus' | 'parent' | 'grandparent' | 'spouse' | 'sibling' | 'child' | 'grandchild' | 'relative' | 'inLaw'
export interface TreeNode { id: string; x: number; y: number; relation: TreeRelation }
export interface TreeEdge { from: string; to: string; kind: 'parent' | 'spouse' | 'kin' }

/** 선택한 인물의 위아래 두 세대와 배우자·형제자매. 저장된 가족 관계만 연결한다. */
export function familyTreeLayout(g: GenState, focus: string): { nodes: TreeNode[]; edges: TreeEdge[]; width: number; height: number } {
  const persons = g.persons
  if (!persons[focus]) return { nodes: [], edges: [], width: 320, height: 120 }
  const rows = new Map<number, { id: string; relation: TreeRelation }[]>()
  const used = new Set<string>()
  const add = (id: string | null | undefined, row: number, relation: TreeRelation) => {
    if (!id || !persons[id] || used.has(id)) return
    used.add(id)
    rows.set(row, [...(rows.get(row) ?? []), { id, relation }])
  }
  add(focus, 0, 'focus')
  const spouse = persons[focus].spouse
  add(spouse, 0, 'spouse')
  const parents = persons[focus].parents
  for (const id of parents) add(id, -1, 'parent')
  for (const id of spouse ? persons[spouse]?.parents ?? [] : []) add(id, -1, 'inLaw')
  for (const parent of rows.get(-1) ?? []) {
    add(persons[parent.id].spouse, -1, 'inLaw')
    for (const id of persons[parent.id].parents) add(id, -2, 'grandparent')
  }
  for (const p of Object.values(persons)) {
    if (p.parents.some(id => parents.includes(id))) add(p.id, 0, 'sibling')
    if (p.parents.includes(focus) || (!!spouse && p.parents.includes(spouse))) {
      add(p.id, 1, 'child')
      add(p.spouse, 1, 'inLaw')
    }
  }
  for (const p of Object.values(persons)) {
    if (p.parents.some(id => (rows.get(1) ?? []).some(child => child.id === id && child.relation === 'child'))) add(p.id, 2, 'grandchild')
  }
  // 조부모·관계 미상의 친척은 부모로 바꾸어 추측하지 않는다.
  for (const kin of persons[focus].kin ?? []) add(kin.id, kin.rel === 'grandparent' ? -2 : 0, kin.rel === 'grandparent' ? 'grandparent' : 'relative')
  for (const p of Object.values(persons)) if (p.kin?.some(kin => kin.id === focus)) add(p.id, 0, 'relative')
  const middle = rows.get(0) ?? []
  const others = middle.filter(node => node.id !== focus && node.id !== spouse)
  const half = Math.ceil(others.length / 2)
  rows.set(0, [...others.slice(0, half), ...middle.filter(node => node.id === focus || node.id === spouse), ...others.slice(half)])
  const width = Math.max(320, Math.max(...[...rows.values()].map(row => row.length)) * 116 + 32)
  const ordered = [...rows].sort(([a], [b]) => a - b)
  const nodes = ordered.flatMap(([, row], level) => row.map((node, i) => ({ ...node, x: (width - row.length * 116) / 2 + i * 116 + 58, y: 24 + level * 132 })))
  const edges: TreeEdge[] = []
  for (const node of nodes) {
    const p = persons[node.id]
    for (const parent of p.parents) if (used.has(parent)) edges.push({ from: parent, to: p.id, kind: 'parent' })
    if (p.spouse && used.has(p.spouse) && p.id < p.spouse) edges.push({ from: p.id, to: p.spouse, kind: 'spouse' })
    for (const kin of p.kin ?? []) if (used.has(kin.id)) edges.push({ from: kin.id, to: p.id, kind: 'kin' })
  }
  return { nodes, edges, width, height: ordered.length * 132 + 12 }
}

// ── 우리 가족 (2026-10-12 점검 7, 사용자 결정: 우리 가족은 가계도에 있어야 한다) ──
/** 가계도에서만 쓰는 주인공·우리 아이 자리 (저장하지 않는다) */
export const ME = 'me'
export const MY_CHILD = 'me:child'

function avatarNums(a: Avatar | undefined): Record<string, number> | undefined {
  if (!a) return undefined
  const out: Record<string, number> = {}
  for (const k of ['skin', 'hairFront', 'hairBack', 'top', 'bottom'] as const) if (Number.isInteger(a[k])) out[k] = a[k]!
  return out
}

/**
 * 가계도용 인물에 주인공과 우리 아이를 더한다: 결혼했으면 주인공–배우자(지금 그 자리 사람) 줄, 우리 아이는 [주인공, 배우자]의 자녀.
 * 결혼 전이고 아이도 없으면 그대로 (헤어짐·약혼은 줄 없음)
 */
export function withPlayerFamily(
  g: GenState,
  s: { romance?: Pick<Romance, 'stage' | 'partner'>; child?: Pick<Child, 'name' | 'look' | 'born'> | null; siblings?: Pick<Child, 'name' | 'look' | 'born'>[]; avatar?: Avatar | null; looks?: Record<string, Avatar>; clock: { day: number } },
): GenState {
  const married = s.romance?.stage === 'married' && !!s.romance.partner
  if (!married && !s.child) return g
  const persons: Record<string, GenPerson> = { ...g.persons }
  const partner = married ? slotPerson(g, s.romance!.partner!) : null
  const spouse = partner && persons[partner] ? partner : null
  const av = s.avatar ?? undefined
  persons[ME] = {
    id: ME, origin: 'arrived', born: null, stage: 'adult', look: av?.look ?? 'f', name: av?.name || undefined,
    avatar: avatarNums(av), ...(av?.hairColor ? { hair: av.hairColor as [number, number, number] } : {}),
    parents: [], spouse, household: null,
  }
  if (spouse && !persons[spouse].spouse) persons[spouse] = { ...persons[spouse], spouse: ME }
  if (s.child) {
    const st = childStage(s.child, s.clock.day)
    const look = s.looks?.child
    persons[MY_CHILD] = {
      id: MY_CHILD, origin: 'born', born: s.child.born,
      stage: st === 'baby' || st === 'toddler' ? 'baby' : st === 'helper' ? 'child' : 'adult',
      look: s.child.look === 'boy' ? 'm' : 'f', name: s.child.name,
      avatar: avatarNums(look ? { ...look, skin: av?.skin ?? look.skin } : undefined), ...(look?.hairColor ? { hair: look.hairColor as [number, number, number] } : {}),
      parents: [ME, ...(spouse ? [spouse] : [])], spouse: null, household: null,
    }
    // 둘째·셋째 (2026-10-13): 같은 부모 아래
    ;(s.siblings ?? []).forEach((k, i) => {
      const kst = childStage(k, s.clock.day)
      persons[`${MY_CHILD}:${i + 2}`] = {
        id: `${MY_CHILD}:${i + 2}`, origin: 'born', born: k.born,
        stage: kst === 'baby' || kst === 'toddler' ? 'baby' : kst === 'helper' ? 'child' : 'adult',
        look: k.look === 'boy' ? 'm' : 'f', name: k.name,
        parents: [ME, ...(spouse ? [spouse] : [])], spouse: null, household: null,
      }
    })
  }
  return { ...g, persons }
}
