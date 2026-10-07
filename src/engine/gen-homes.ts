// 주민 가족 생활 (2026-10-08): 결혼한 주민은 저녁·밤에 한 집(가구의 집, D21)으로 들어간다 + 새 터 주택 희망 목록.
// - sharedHomeOf: 결혼해 가구의 집이 다른 이웃의 집이면 그 집 주인 id (아니면 null — 제 집 그대로)
// - 주택 희망: 집 주인이 이웃(방이 있는 사람)이 아닌 가구 = 집이 없는 신혼 가구. 새 터의 빈 입주 주택을 내어 주면
//   familyHome:<가구 번호> = 그 집 건물 번호(b<n>의 n), 그 집 문 옆에 그 가구의 어른 한 사람이 선다. 집이 걷히면 다시 희망 목록으로.
import type { GameState } from './game'
import type { GenState, Household } from './gen'
import { doneHomes, standSpotOf, type Build } from './newland-build'
import type { Tile } from './types'

/** 결혼한 이웃이 저녁에 들어가는 집의 주인 (제 집이면 null) */
export function sharedHomeOf(g: GenState | undefined, id: string, hasRoom: (owner: string) => boolean): string | null {
  const p = g?.persons[id]
  if (!p?.spouse || !p.household) return null
  const home = g!.households[p.household]?.home
  return home && home !== id && hasRoom(home) ? home : null
}

const householdNo = (h: Household): number => Number(/^h-(\d+)$/.exec(h.id)?.[1] ?? 0)

/** 집이 없는 가구 (어른 둘 이상, 집 주인이 방 있는 이웃이 아니다) — 이미 새 터 집에 사는 가구는 뺀다 */
export function homeWishes(s: Pick<GameState, 'gen' | 'flags' | 'newland'>, hasRoom: (owner: string) => boolean): Household[] {
  const living = new Set(familyHomes(s).map((x) => x.household.id))
  return Object.values(s.gen?.households ?? {}).filter((h) => householdNo(h) > 0 && h.members.length >= 2 && !hasRoom(h.home) && !living.has(h.id))
}

/** 새 터 집에 사는 가구와 그 집 (집이 걷히면 빠진다) */
export function familyHomes(s: Pick<GameState, 'gen' | 'flags' | 'newland'>): { household: Household; home: Build }[] {
  const out: { household: Household; home: Build }[] = []
  for (const h of Object.values(s.gen?.households ?? {})) {
    const v = s.flags[`familyHome:${householdNo(h)}`]
    const home = v ? doneHomes(s).find((b) => b.id === `b${v}`) : undefined
    if (home) out.push({ household: h, home })
  }
  return out
}

/** 아무도 살지 않는 새 터 입주 주택 (이웃이 된 손님·가족이 사는 집 빼고) */
export function emptyHomes(s: Pick<GameState, 'flags' | 'newland'>): Build[] {
  const used = new Set<string>()
  for (const [k, v] of Object.entries(s.flags)) if ((k.startsWith('settled:') || k.startsWith('familyHome:')) && v) used.add(`b${v}`)
  return doneHomes(s).filter((b) => !used.has(b.id))
}

/** 이 칸이 빈 입주 주택의 사람 서는 칸인가 (그 앞에 서면 희망 목록) */
export function emptyHomeAt(s: Pick<GameState, 'gen' | 'flags' | 'newland'>, t: Tile): Build | null {
  return emptyHomes(s).find((b) => {
    const st = standSpotOf(b)
    return !!st && st.x === t.x && st.y === t.y
  }) ?? null
}

/** 가구에게 그 집을 내어 준다 */
export function giveFamilyHome<T extends Pick<GameState, 'gen' | 'flags' | 'newland' | 'clock'>>(s: T, householdId: string, home: Build, hasRoom: (owner: string) => boolean): T {
  const h = homeWishes(s, hasRoom).find((x) => x.id === householdId)
  if (!h || !emptyHomes(s).some((b) => b.id === home.id)) return s
  return { ...s, flags: { ...s.flags, [`familyHome:${householdNo(h)}`]: Number(home.id.slice(1)), [`familyHomeDay:${householdNo(h)}`]: s.clock.day } }
}

/** 새 터 집에 사는 가구의 사람이 서는 자리와 그 사람 */
export function familyAt(s: Pick<GameState, 'gen' | 'flags' | 'newland'>, t: Tile): { household: Household; home: Build } | null {
  return familyHomes(s).find((x) => {
    const st = standSpotOf(x.home)
    return !!st && st.x === t.x && st.y === t.y
  }) ?? null
}
