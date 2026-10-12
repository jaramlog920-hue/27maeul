import { BAKER_BABY_ID, type GenState } from './gen'

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
