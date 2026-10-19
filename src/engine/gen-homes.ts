// 주민 가족 생활 (2026-10-08): 결혼한 주민은 저녁·밤에 한 집(가구의 집, D21)으로 들어간다 + 새 터 주택 희망 목록.
// - sharedHomeOf: 결혼해 가구의 집이 다른 이웃의 집이면 그 집 주인 id (아니면 null — 제 집 그대로)
// - 주택 희망: 집 주인이 이웃(방이 있는 사람)이 아닌 가구 = 집이 없는 신혼 가구. 새 터의 빈 입주 주택을 내어 주면
//   familyHome:<가구 번호> = 그 집 건물 번호(b<n>의 n), 그 집 문 옆에 그 가구의 어른 한 사람이 선다. 집이 걷히면 다시 희망 목록으로.
import type { GameState } from './game'
import { moveInGift } from './collection-gifts'
import type { GenState, Household } from './gen'
import { doneHomes, standSpotOf, type Build } from './newland-build'
import type { Tile } from './types'
import { LODGING_SEATS } from './lodging'
import { slotPerson } from './gen-growth'

/** 결혼한 이웃이 저녁에 들어가는 집의 주인 (제 집이면 null) */
export function sharedHomeOf(g: GenState | undefined, id: string, hasRoom: (owner: string) => boolean): string | null {
  const p = g?.persons[id]
  if (!p?.spouse || !p.household) return null
  const home = g!.households[p.household]?.home
  return home && home !== id && (hasRoom(home)||!!LODGING_SEATS[home]) ? home : null
}

const householdNo = (h: Household): number => Number(/^h-(\d+)$/.exec(h.id)?.[1] ?? 0)

/** 집이 없는 가구 (어른 둘 이상, 집 주인이 방 있는 이웃이 아니다) — 이미 새 터 집에 사는 가구는 뺀다 */
export function homeWishes(s: Pick<GameState, 'gen' | 'flags' | 'newland'> & Partial<Pick<GameState, 'clock'>>, hasRoom: (owner: string) => boolean): Household[] {
  const living = new Set(familyHomes(s).map((x) => x.household.id))
  // 이사 간 지 한 달이 안 된 가구는 다시 바라지 않는다 (2026-10-14)
  const moved = (h: Household) => s.clock !== undefined && recentlyMoved(s as Pick<GameState, 'flags' | 'clock'>, h)
  return Object.values(s.gen?.households ?? {}).filter((h) => householdNo(h) > 0 && h.members.length >= 2 && !hasRoom(h.home) && !LODGING_SEATS[h.home] && !living.has(h.id) && !moved(h))
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

/**
 * 새 터 집으로 이사한 가구의 사람인가 (2026-10-12 사용자 결정 1): 밤에는 새 터 집에서 자고, 첫 마을의 다른 집으로 들어가지 않는다.
 * npc는 이웃 자리 id나 사람 id
 */
export function livesInNewland(s: Pick<GameState, 'gen' | 'flags' | 'newland'>, npc: string): boolean {
  // 이웃 자리 id면 지금 그 자리에 선 사람으로 (자리를 이어받은 자녀 — 2026-10-19 감사 L-27)
  const who = slotPerson(s.gen, npc)
  return familyHomes(s).some((x) => x.household.members.includes(who))
}

/** 새 터 집 문 옆에 설 사람: 아기가 아닌 첫 사람 — 원래 이웃끼리 꾸린 가구도 (그림은 그 이웃의 모습으로) */
export function familyShownMember(s: Pick<GameState, 'gen'>, h: Household): string | null {
  return h.members.find((id) => { const p = s.gen?.persons[id]; return !!p && p.stage !== 'baby' }) ?? null
}

/** 아무도 살지 않는 새 터 입주 주택 (이웃이 된 손님·가족이 사는 집, 내 집(flags.myNewHome) 빼고) */
export function emptyHomes(s: Pick<GameState, 'flags' | 'newland'>): Build[] {
  const used = new Set<string>()
  for (const [k, v] of Object.entries(s.flags)) if ((k.startsWith('settled:') || k.startsWith('familyHome:') || k === 'myNewHome') && v) used.add(`b${v}`)
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
export function giveFamilyHome(s: GameState, householdId: string, home: Build, hasRoom: (owner: string) => boolean): GameState {
  const h = homeWishes(s, hasRoom).find((x) => x.id === householdId)
  if (!h || !emptyHomes(s).some((b) => b.id === home.id)) return s
  const n = householdNo(h)
  // 예전 집에서 생긴 이사 마음·인사·머물기는 새 집에 들고 가지 않는다 (2026-10-18 감사 M-17)
  const flags = { ...s.flags, [`familyHome:${n}`]: Number(home.id.slice(1)), [`familyHomeDay:${n}`]: s.clock.day }
  for (const k of [`moveWish:${n}`, `moveBye:${n}`, `moveStay:${n}`]) delete flags[k]
  const moved = { ...s, flags }
  return h.members.reduce((next, id) => moveInGift(next, id), moved)
}

/** 새 터 집에 사는 가구의 사람이 서는 자리와 그 사람 */
export function familyAt(s: Pick<GameState, 'gen' | 'flags' | 'newland'>, t: Tile): { household: Household; home: Build } | null {
  return familyHomes(s).find((x) => {
    const st = standSpotOf(x.home)
    return !!st && st.x === t.x && st.y === t.y
  }) ?? null
}

// ── 이사 가고 싶은 가족 (2026-10-14 사용자: 동물의 숲처럼 낮은 확률로 이사 간다고 — 유저는 말리거나 인사하거나) ──
// 새 터 집에서 두 이레 넘게 산 가족이 아침에 드물게(MOVE_CHANCE) 이사를 바라게 된다 (flags.moveWish:<가구>).
// 집 앞에서 말을 걸면: 말리기 → 머물고 한 달은 다시 묻지 않는다 / 인사하기 → 다음 날 아침 떠난다. 그냥 두면 사흘 뒤 떠난다.
// 떠난 가족은 첫 마을 원래 집으로 돌아가고, 한 달 동안은 새 터 집 희망 목록에 오르지 않는다. 집은 빈집으로 남는다
export const MOVE_CHANCE = 0.04
export const MOVE_AFTER_DAYS = 14
export const MOVE_WAIT_DAYS = 3
export const MOVE_QUIET_DAYS = 28

const hashDay = (day: number, n: number) => ((day * 2654435761 + n * 40503) >>> 0) / 4294967296

/** 이 가구가 지금 이사를 바라는가 */
export const wantsToMove = (s: Pick<GameState, 'flags'>, h: Household): boolean => !!s.flags[`moveWish:${householdNo(h)}`]

/** 아침: 이사 마음이 생기거나, 떠날 날이 된 가족은 떠난다. 떠난 가구 번호를 flags.familyLeft에 (알림용) */
export function familyMoveMorning<S extends Pick<GameState, 'gen' | 'flags' | 'newland' | 'clock'>>(s: S): S {
  const day = s.clock.day
  const flags = { ...s.flags }
  delete flags.familyLeft
  for (const { household: h } of familyHomes(s)) {
    const n = householdNo(h)
    const wish = flags[`moveWish:${n}`]
    if (wish) {
      if (flags[`moveBye:${n}`] || day >= wish + MOVE_WAIT_DAYS) {
        for (const k of [`familyHome:${n}`, `familyHomeDay:${n}`, `moveWish:${n}`, `moveBye:${n}`]) delete flags[k]
        flags[`movedAway:${n}`] = day
        flags.familyLeft = n
      }
      continue
    }
    const since = flags[`familyHomeDay:${n}`] ?? 0
    const quiet = flags[`moveStay:${n}`]
    if (day - since < MOVE_AFTER_DAYS || (quiet !== undefined && day < quiet + MOVE_QUIET_DAYS)) continue
    if (hashDay(day, n) < MOVE_CHANCE) flags[`moveWish:${n}`] = day
  }
  return { ...s, flags }
}

/** 말리기: 이사 마음을 접고 머문다 (한 달은 다시 묻지 않는다) */
export function askToStay<S extends Pick<GameState, 'flags'>>(s: S, h: Household): S {
  const n = householdNo(h)
  if (!s.flags[`moveWish:${n}`]) return s
  const flags = { ...s.flags, [`moveStay:${n}`]: (s as unknown as Pick<GameState, 'clock'>).clock?.day ?? 0 }
  delete flags[`moveWish:${n}`]
  return { ...s, flags }
}

/** 인사하기: 다음 날 아침 떠난다 */
export function sayGoodbye<S extends Pick<GameState, 'flags'>>(s: S, h: Household): S {
  const n = householdNo(h)
  if (!s.flags[`moveWish:${n}`]) return s
  return { ...s, flags: { ...s.flags, [`moveBye:${n}`]: 1 } }
}

/** 떠난 지 한 달이 안 된 가구 (희망 목록에서 뺀다) */
export const recentlyMoved = (s: Pick<GameState, 'flags' | 'clock'>, h: Household): boolean => {
  const d = s.flags[`movedAway:${householdNo(h)}`]
  return d !== undefined && s.clock.day < d + MOVE_QUIET_DAYS
}
export const householdById = (s: Pick<GameState, 'gen'>, no: number): Household | undefined => Object.values(s.gen?.households ?? {}).find((h) => householdNo(h) === no)
