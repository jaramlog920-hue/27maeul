// 계획 20 2부 작업 E: 주민 출생 — 아기 침대 부탁, 만들어 건네면 기다림, 저장된 외형과 이름 (D32·P10·P11).
// 건네지 않으면 아이는 오지 않는다 (재촉·불이익 없음, 며칠 뒤 한 번 다시 말할 뿐). 플레이어의 아이와는 따로다.
import { BIRTH_AFTER_CRIB, BIRTH_GAP, CRIB_GAIN, CRIB_HIGH, CRIB_REASK, CRIB_WAIT_HIGH, MAX_CHILDREN, SECOND_GAIN } from './gen-config'
import { addLog, affinityOf, BAKER_BABY_ID, genRng, hasRoom, personId, type GenPerson, type GenState, type Household } from './gen'
import type { DayCtx } from './gen-relations'

/** 아기 침대를 만들어 건네는 데 드는 재료 (부탁을 받으면 가방의 재료로 그 자리에서 짜 준다 — 결정 P10 변형) */
export const CRIB_NEEDS = { reed: 3, blanket: 1 } as const

/** 주민 아이 이름 (성 없이, 성경 인물 이름·마을 이웃 이름과 겹치지 않는 것) */
export const GEN_CHILD_NAMES: Record<'f' | 'm', readonly string[]> = {
  m: ['테디', '재스퍼', '오티스', '헨리', '찰리', '레오', '윈스턴', '아치'],
  f: ['루시', '데이지', '로지', '클라라', '엘라', '노라', '메이', '하퍼'],
}

/**
 * 세대 (2026-10-21 사용자: 유저의 자식의 자식까지만 — 주민도 같다): 처음부터 마을에 있던 사람·손님은 1대,
 * 그 자녀 2대, 손주 3대. 3대는 아이를 낳지 않는다
 */
export const MAX_GENERATION = 3
export function generationOf(g: Pick<GenState, 'persons'>, id: string, seen: Set<string> = new Set()): number {
  const p = g.persons[id]
  // 처음부터 있던 주민은 서로 부모·자녀 사이여도 모두 1대 (빵집 아기만 헤이즐의 아이라 2대)
  if (!p || seen.has(id) || !p.parents?.length || (p.origin !== 'born' && p.id !== BAKER_BABY_ID)) return 1
  seen.add(id)
  return 1 + Math.max(...p.parents.map((q) => generationOf(g, q, seen)))
}
/** 이 가구가 아이를 가질 수 있는 세대인가 (아기가 MAX_GENERATION대를 넘지 않는가) */
export const canHaveBaby = (g: Pick<GenState, 'persons'>, h: Pick<Household, 'members'>): boolean =>
  Math.max(...h.members.map((m) => generationOf(g, m))) + 1 <= MAX_GENERATION

/** 아기 침대 부탁을 꺼낼 때가 됐나 (P10): 오늘 호감도 ≥ 결혼한 날 + 15, 결혼한 날 값이 86 이상이면 결혼 뒤 14일 */
export function cribDue(g: GenState, h: Household, d: number): boolean {
  // 마을 정원(MAX_GENERATED)이 찼으면 침대를 부탁하지 않는다 — 건네도 아기가 오지 않으므로 (2026-10-20 점검)
  if (h.members.length < 2 || h.cribAsk || h.children.length || h.since == null || !hasRoom(g) || !canHaveBaby(g, h)) return false
  const wed = h.wedAffinity ?? 50
  if (wed >= CRIB_HIGH) return d - h.since >= CRIB_WAIT_HIGH
  return affinityOf(g, h.members[0], h.members[1]) >= wed + CRIB_GAIN
}

/** 이 이웃이 지금 플레이어에게 부탁하고 있는 아기 침대 (건네지 않은 것) */
export function cribAskOf(g: GenState | undefined, npc: string): Household | null {
  if (!g) return null
  return Object.values(g.households).find((h) => h.members.includes(npc) && h.cribAsk && !h.cribAsk.given && canHaveBaby(g, h)) ?? null
}

/** 부탁을 꺼내는 사람: 집 주인이 아닌 쪽 (집 안 살림을 맡는 쪽이 부탁한다 — 두 사람이 정해져 있으면 그대로) */
export const cribAsker = (h: Household): string => h.members.find((m) => m !== h.home) ?? h.members[0]

/** 침대를 건넸다: 그날부터 28일 뒤 출생 */
export function giveCrib(g: GenState, hid: string, day: number): GenState | null {
  const h = g.households[hid]
  if (!h?.cribAsk || h.cribAsk.given || !canHaveBaby(g, h)) return null
  const next: Household = { ...h, cribAsk: { ...h.cribAsk, given: true }, birthDue: day + BIRTH_AFTER_CRIB }
  return addLog({ ...g, households: { ...g.households, [hid]: next } }, day, 'cribGiven', h.members)
}

/** 부모의 고를 수 있는 외형 값 (머리·피부·옷 번호) — 없으면 빈 것 */
export type AvatarOf = (id: string) => Record<string, number> | undefined

// 아들에게 어울리지 않는 것 (avatar.ts 목록 번호): 치마(BOTTOMS 0·1·4·5), 긴 머리·묶은 머리(HAIR_BACKS 짧은 머리·짧은 층머리 말고),
// 하트 가르마·땋은 앞머리·두 갈래 앞머리(HAIR_FRONTS 17·18·21), 리본·레이스 옷(TOPS 20·21), 꽃 핀·리본 핀·꽃 화관 같은 장신구
const BOY_BOTTOMS = new Set([2, 3, 6, 7])
const BOY_HAIR_BACKS = new Set([0, 11])
const NOT_BOY_FRONTS = new Set([17, 18, 21])
const NOT_BOY_TOPS = new Set([20, 21])
const BOY_ACCS = new Set([0, 3, 5, 10, 11, 12])
// 딸은 치마를 먼저 (엄마가 바지면 바지도 괜찮다 — 같은 성별 부모 것을 먼저 고르므로)
const GENDERED: Record<string, (look: 'f' | 'm', v: number) => boolean> = {
  bottom: (look, v) => look === 'f' || BOY_BOTTOMS.has(v),
  hairBack: (look, v) => look === 'f' || BOY_HAIR_BACKS.has(v),
  hairFront: (look, v) => look === 'f' || !NOT_BOY_FRONTS.has(v),
  top: (look, v) => look === 'f' || !NOT_BOY_TOPS.has(v),
  acc: (look, v) => look === 'f' || BOY_ACCS.has(v),
}
const GENDER_DEFAULT: Record<'f' | 'm', Record<string, number>> = {
  m: { bottom: 2, hairBack: 0, hairFront: 0, top: 0, acc: 0 },
  f: { bottom: 0, hairBack: 1, hairFront: 1, top: 0, acc: 0 },
}

/** 성별에 어울리지 않는 옷·머리·장신구는 기본값으로 (예전에 태어난 아들의 긴 치마 같은 것 — 그림에서 고친다) */
export function fitGenderLook(look: 'f' | 'm', avatar: Record<string, number>): Record<string, number> {
  let out = avatar
  for (const k of Object.keys(GENDERED)) {
    const v = avatar[k]
    if (Number.isInteger(v) && !GENDERED[k](look, v)) out = { ...out, [k]: GENDER_DEFAULT[look][k] }
  }
  return out
}

function babyOf(g: GenState, h: Household, d: number, avatarOf: AvatarOf): GenPerson {
  const id = personId(g.nextPerson)
  const rnd = genRng(g.seed, 'birth', h.members, h.children.length + 1)
  const look: 'f' | 'm' = rnd() < 0.5 ? 'f' : 'm'
  const taken = new Set(Object.values(g.persons).map((p) => p.name).filter(Boolean))
  const names = GEN_CHILD_NAMES[look].filter((n) => !taken.has(n))
  const list = names.length ? names : GEN_CHILD_NAMES[look]
  const name = list[Math.floor(rnd() * list.length)]
  // 외형: 값마다 부모 둘 중 한 사람의 것을 (같은 씨앗이면 같은 아이)
  // 생성된 부모는 저장된 외형을 먼저 (2026-10-08 버그 31-A·F05 — 손주가 기본 외형이 되었다)
  const ofParent = (pid: string): Record<string, number> => {
    const p = g.persons[pid]
    const base = p?.avatar ?? avatarOf(pid) ?? {}
    return p?.hair ? { ...base, hairH: p.hair[0], hairS: p.hair[1], hairV: p.hair[2] } : base
  }
  const pa = ofParent(h.members[0]), pb = ofParent(h.members[1])
  const avatar: Record<string, number> = {}
  // 머리색은 한 사람의 것을 통째로 (31-B·F06)
  const HAIR = ['hairH', 'hairS', 'hairV']
  const hairFrom = rnd() < 0.5 ? (pa.hairH !== undefined ? pa : pb) : pb.hairH !== undefined ? pb : pa
  const hair: [number, number, number] | undefined = hairFrom.hairH !== undefined ? [hairFrom.hairH, hairFrom.hairS, hairFrom.hairV] : undefined
  // 옷·머리 모양·장신구는 아이와 같은 성별의 부모 것을 먼저, 그 성별에 어울리지 않으면 다른 부모 것·기본값으로
  // (2026-10-20 사용자: 아들이 엄마의 긴 치마·긴 머리를 물려받지 않게). 얼굴·피부·눈빛은 그대로 둘 중 한 사람
  const same = [h.members[0], h.members[1]].map((pid) => g.persons[pid]?.look)
  const [first, second] = same[1] === look && same[0] !== look ? [pb, pa] : [pa, pb]
  for (const k of [...new Set([...Object.keys(pa), ...Object.keys(pb)])].filter((k) => !HAIR.includes(k)).sort()) {
    const roll = rnd()
    if (k in GENDERED) {
      const fits = (v: number | undefined): v is number => Number.isInteger(v) && v! >= 0 && GENDERED[k](look, v!)
      const v = fits(first[k]) ? first[k] : fits(second[k]) ? second[k] : GENDER_DEFAULT[look][k]
      if (v !== undefined) avatar[k] = v
      continue
    }
    const from = roll < 0.5 ? pa[k] ?? pb[k] : pb[k] ?? pa[k]
    if (Number.isInteger(from) && from >= 0) avatar[k] = from
  }
  return { id, origin: 'born', born: d, stage: 'baby', look, name, ...(Object.keys(avatar).length ? { avatar } : {}), ...(hair ? { hair } : {}), parents: [...h.members], spouse: null, household: h.id }
}

export function settleBirth(g: GenState, d: number, ctx: DayCtx, avatarOf: AvatarOf = () => undefined): GenState {
  for (const hid of Object.keys(g.households).sort()) {
    let h = g.households[hid]
    if (h.members.length < 2 || h.members.some(ctx.busy)) continue
    const [a, b] = h.members
    // 태어날 날이 된 아침
    if (h.birthDue != null && d >= h.birthDue) {
      // 손주 세대(3대)는 아이를 낳지 않는다 — 옛 저장에 남은 예약은 지운다 (2026-10-21)
      if (!canHaveBaby(g, h)) {
        g = { ...g, households: { ...g.households, [hid]: { ...h, birthDue: undefined } } }
        continue
      }
      // 마을 정원이 찼으면 예약을 지우지 않고 기다린다(D14) — 자리가 나는 아침에 태어난다 (2026-10-08 버그 22-D)
      if (!hasRoom(g) && h.children.length < MAX_CHILDREN) continue
      if (h.children.length >= MAX_CHILDREN) {
        h = { ...h, birthDue: undefined }
        g = { ...g, households: { ...g.households, [hid]: h } }
        continue
      }
      const baby = babyOf(g, h, d, avatarOf)
      const first = !h.children.length
      h = { ...h, children: [...h.children, baby.id], lastBirth: d, birthDue: undefined, ...(first ? { birthAffinity: affinityOf(g, a, b) } : {}) }
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
    if (h.children.length === 1 && h.children.length < MAX_CHILDREN && h.birthDue == null && h.lastBirth != null && d - h.lastBirth >= BIRTH_GAP && hasRoom(g) && canHaveBaby(g, h)) {
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
