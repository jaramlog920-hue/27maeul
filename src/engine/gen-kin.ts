// 계획 20 작업 10: 친족 판정과 계보 복구. 계보 id로만 따진다 — 이름·외형·역할로 짐작하지 않는다.
import type { GenPerson } from './gen'

type People = Record<string, GenPerson>

/** 고정 주민의 family 칸이 가리키는 관계 (작업 9 표). 적히지 않은 것은 부모 — 조부모·종류 모름은 따로 */
export const FAMILY_REL: Record<string, 'grandparent' | 'relative'> = { grandpa: 'grandparent', weaver: 'relative' }

const spouseOf = (p: People, id: string): string | null => {
  const s = p[id]?.spouse
  return s && p[s] ? s : null
}

/** 부모와, 부모의 배우자(의붓부모) */
function parentsX(p: People, id: string): string[] {
  const out = new Set<string>()
  for (const q of p[id]?.parents ?? []) {
    if (!p[q]) continue
    out.add(q)
    const sp = spouseOf(p, q)
    if (sp) out.add(sp)
  }
  out.delete(id)
  return [...out]
}

function ancestors2(p: People, id: string): Set<string> {
  const out = new Set<string>()
  for (const q of parentsX(p, id)) for (const r of parentsX(p, q)) out.add(r)
  return out
}

function direct(p: People, a: string, b: string): boolean {
  if (!p[a] || !p[b]) return false
  const pa = parentsX(p, a), pb = parentsX(p, b)
  if (pa.includes(b) || pb.includes(a)) return true // 부모·자녀·의붓부모
  if (pa.some((x) => pb.includes(x))) return true // 형제자매·의붓 형제
  if (ancestors2(p, a).has(b) || ancestors2(p, b).has(a)) return true // 조부모·손주
  if (p[a].kin?.some((k) => k.id === b) || p[b].kin?.some((k) => k.id === a)) return true // 알려진 친척(조부모·종류 모름)
  return false
}

/**
 * 가까운 친족인가: 부모·자녀·형제자매·조부모·손주·의붓 관계·배우자, 그리고 배우자의 가까운 친족.
 * 같은 사람이면 true (자기 자신과는 짝이 되지 않는다). 계보에 없는 id는 false.
 */
export function closeKin(p: People, a: string, b: string): boolean {
  if (a === b) return true
  if (!p[a] || !p[b]) return false
  if (p[a].spouse === b || p[b].spouse === a) return true
  if (direct(p, a, b)) return true
  const sa = spouseOf(p, a), sb = spouseOf(p, b)
  if (sa && direct(p, sa, b)) return true
  if (sb && direct(p, a, sb)) return true
  return false
}

/**
 * 계보 복구: 없는 사람 참조·자기 참조·순환 부모·한쪽만 걸린 배우자·집 연결을 고친다.
 * 깨진 연결만 버리고 나머지는 그대로 둔다. 새 객체를 돌려준다.
 */
export function repairKin<H extends { id: string; members: string[]; children: string[] }>(persons: People, households: Record<string, H>): { persons: People; households: Record<string, H> } {
  const ps: People = {}
  for (const [id, raw] of Object.entries(persons)) {
    ps[id] = { ...raw, parents: [...new Set(raw.parents.filter((q) => q !== id && persons[q]))], kin: raw.kin?.filter((k) => k.id !== id && persons[k.id]) }
    if (!ps[id].kin?.length) delete ps[id].kin
  }
  // 순환: 조상을 따라가 자기 자신이 나오면 그 사람의 부모 연결을 끊는다
  const reaches = (from: string, target: string): boolean => {
    const seen = new Set<string>()
    const stack = [...ps[from].parents]
    while (stack.length) {
      const x = stack.pop() as string
      if (x === target) return true
      if (seen.has(x)) continue
      seen.add(x)
      stack.push(...(ps[x]?.parents ?? []))
    }
    return false
  }
  for (const id of Object.keys(ps).sort()) if (ps[id].parents.length && reaches(id, id)) ps[id] = { ...ps[id], parents: [] }
  // 배우자: 서로 가리켜야 한다. 한쪽만이면 상대가 비어 있을 때 채우고, 아니면 끊는다
  for (const id of Object.keys(ps).sort()) {
    const sp = ps[id].spouse
    if (!sp) continue
    if (sp === id || !ps[sp]) ps[id] = { ...ps[id], spouse: null }
    else if (ps[sp].spouse == null) ps[sp] = { ...ps[sp], spouse: id }
    else if (ps[sp].spouse !== id) ps[id] = { ...ps[id], spouse: null }
  }
  // 가구: 없는 사람은 빼고, 사람 쪽 연결(household)과 맞춘다
  const hs: Record<string, H> = {}
  for (const [hid, h] of Object.entries(households)) {
    const members = [...new Set(h.members.filter((m) => ps[m]))]
    if (!members.length) continue
    // 자녀 목록은 가구 구성원을 부모로 둔, 태어난 사람만
    const children = [...new Set(h.children.filter((c) => ps[c] && ps[c].origin === 'born' && ps[c].parents.some((q) => members.includes(q))))]
    hs[hid] = { ...h, members, children }
  }
  for (const id of Object.keys(ps)) {
    const hid = ps[id].household
    if (!hid) continue
    const h = hs[hid]
    if (!h) ps[id] = { ...ps[id], household: null }
    else if (!h.members.includes(id) && !h.children.includes(id)) {
      if (ps[id].origin === 'born' && ps[id].parents.some((q) => h.members.includes(q))) hs[hid] = { ...h, children: [...h.children, id] }
      else ps[id] = { ...ps[id], household: null }
    }
  }
  return { persons: ps, households: hs }
}
