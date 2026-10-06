// 계획 20 2부 작업 E: 주민 출생 — 아기 침대 부탁, 만들어 건네면 기다림, 저장된 외형과 이름 (D32·P10·P11).
// 건네지 않으면 아이는 오지 않는다 (재촉·불이익 없음, 며칠 뒤 한 번 다시 말할 뿐). 플레이어의 아이와는 따로다.
import { BIRTH_AFTER_CRIB, BIRTH_GAP, CRIB_GAIN, CRIB_HIGH, CRIB_REASK, CRIB_WAIT_HIGH, MAX_CHILDREN, SECOND_GAIN } from './gen-config'
import { addLog, affinityOf, genRng, hasRoom, personId, type GenPerson, type GenState, type Household } from './gen'
import type { DayCtx } from './gen-relations'

/** 주민 아이 이름 (성 없이, 성경 인물 이름·마을 이웃 이름과 겹치지 않는 것) */
export const GEN_CHILD_NAMES: Record<'f' | 'm', readonly string[]> = {
  m: ['테디', '재스퍼', '오티스', '헨리', '찰리', '레오', '윈스턴', '아치'],
  f: ['루시', '데이지', '로지', '클라라', '엘라', '노라', '메이', '하퍼'],
}

/** 아기 침대 부탁을 꺼낼 때가 됐나 (P10): 오늘 호감도 ≥ 결혼한 날 + 15, 결혼한 날 값이 86 이상이면 결혼 뒤 14일 */
export function cribDue(g: GenState, h: Household, d: number): boolean {
  if (h.members.length < 2 || h.cribAsk || h.children.length || h.since == null) return false
  const wed = h.wedAffinity ?? 50
  if (wed >= CRIB_HIGH) return d - h.since >= CRIB_WAIT_HIGH
  return affinityOf(g, h.members[0], h.members[1]) >= wed + CRIB_GAIN
}

/** 이 이웃이 지금 플레이어에게 부탁하고 있는 아기 침대 (건네지 않은 것) */
export function cribAskOf(g: GenState | undefined, npc: string): Household | null {
  if (!g) return null
  return Object.values(g.households).find((h) => h.members.includes(npc) && h.cribAsk && !h.cribAsk.given) ?? null
}

/** 부탁을 꺼내는 사람: 집 주인이 아닌 쪽 (집 안 살림을 맡는 쪽이 부탁한다 — 두 사람이 정해져 있으면 그대로) */
export const cribAsker = (h: Household): string => h.members.find((m) => m !== h.home) ?? h.members[0]

/** 침대를 건넸다: 그날부터 28일 뒤 출생 */
export function giveCrib(g: GenState, hid: string, day: number): GenState | null {
  const h = g.households[hid]
  if (!h?.cribAsk || h.cribAsk.given) return null
  const next: Household = { ...h, cribAsk: { ...h.cribAsk, given: true }, birthDue: day + BIRTH_AFTER_CRIB }
  return addLog({ ...g, households: { ...g.households, [hid]: next } }, day, 'cribGiven', h.members)
}

/** 부모의 고를 수 있는 외형 값 (머리·피부·옷 번호) — 없으면 빈 것 */
export type AvatarOf = (id: string) => Record<string, number> | undefined

function babyOf(g: GenState, h: Household, d: number, avatarOf: AvatarOf): GenPerson {
  const id = personId(g.nextPerson)
  const rnd = genRng(g.seed, 'birth', h.members, h.children.length + 1)
  const look: 'f' | 'm' = rnd() < 0.5 ? 'f' : 'm'
  const taken = new Set(Object.values(g.persons).map((p) => p.name).filter(Boolean))
  const names = GEN_CHILD_NAMES[look].filter((n) => !taken.has(n))
  const list = names.length ? names : GEN_CHILD_NAMES[look]
  const name = list[Math.floor(rnd() * list.length)]
  // 외형: 값마다 부모 둘 중 한 사람의 것을 (같은 씨앗이면 같은 아이)
  const pa = avatarOf(h.members[0]) ?? {}, pb = avatarOf(h.members[1]) ?? {}
  const avatar: Record<string, number> = {}
  for (const k of [...new Set([...Object.keys(pa), ...Object.keys(pb)])].sort()) {
    const from = rnd() < 0.5 ? pa[k] ?? pb[k] : pb[k] ?? pa[k]
    if (Number.isInteger(from) && from >= 0) avatar[k] = from
  }
  return { id, origin: 'born', born: d, stage: 'baby', look, name, ...(Object.keys(avatar).length ? { avatar } : {}), parents: [...h.members], spouse: null, household: h.id }
}

export function settleBirth(g: GenState, d: number, ctx: DayCtx, avatarOf: AvatarOf = () => undefined): GenState {
  for (const hid of Object.keys(g.households).sort()) {
    let h = g.households[hid]
    if (h.members.length < 2 || h.members.some(ctx.busy)) continue
    const [a, b] = h.members
    // 태어날 날이 된 아침
    if (h.birthDue != null && d >= h.birthDue) {
      if (!hasRoom(g) || h.children.length >= MAX_CHILDREN) {
        h = { ...h, birthDue: null }
        g = { ...g, households: { ...g.households, [hid]: h } }
        continue
      }
      const baby = babyOf(g, h, d, avatarOf)
      const first = !h.children.length
      h = { ...h, children: [...h.children, baby.id], lastBirth: d, birthDue: null, ...(first ? { birthAffinity: affinityOf(g, a, b) } : {}) }
      g = { ...g, persons: { ...g.persons, [baby.id]: baby }, households: { ...g.households, [hid]: h }, nextPerson: g.nextPerson + 1 }
      g = addLog(g, d, 'birth', [a, b, baby.id])
      continue
    }
    // 첫 부탁
    if (cribDue(g, h, d)) {
      h = { ...h, cribAsk: { day: d, given: false } }
      g = addLog({ ...g, households: { ...g.households, [hid]: h } }, d, 'crib', [a, b])
      continue
    }
    // 건네지 않았으면 며칠 뒤 한 번만 다시 말한다
    if (h.cribAsk && !h.cribAsk.given && !h.cribAsk.reasked && d - h.cribAsk.day >= CRIB_REASK) {
      h = { ...h, cribAsk: { ...h.cribAsk, reasked: true } }
      g = addLog({ ...g, households: { ...g.households, [hid]: h } }, d, 'cribAgain', [a, b])
      continue
    }
    // 둘째: 같은 침대를 쓰니 부탁 없이 — 첫 아이 뒤 56일, 오늘 호감도 ≥ 첫 출생 날 값 + 10
    if (h.children.length === 1 && h.birthDue == null && h.lastBirth != null && d - h.lastBirth >= BIRTH_GAP && hasRoom(g)) {
      // 100에 막혀 더 오를 수 없으면 기간만 본다 (첫 부탁과 같은 생각)
      const need = (h.birthAffinity ?? 50) + SECOND_GAIN
      if (need > 100 || affinityOf(g, a, b) >= need) {
        h = { ...h, birthDue: d + BIRTH_AFTER_CRIB }
        g = addLog({ ...g, households: { ...g.households, [hid]: h } }, d, 'expecting', [a, b])
      }
    }
  }
  return g
}
