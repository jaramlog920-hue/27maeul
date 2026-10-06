// 정해 둔 집 안 자리를 실제로 쓰기 (계획 16 작업 23, 기획 09): 자리 정하기·해제, 기록자가 앉아 쉬기·차 마시기·손일·읽기,
// 가족과 함께 쓴 첫 자리의 가족 기억. 쓰임의 덤은 그날의 기분(꾸민 방이 주는 기분)뿐 — 능력치·닢·재료·필사에는 아무 조건도 걸지 않는다.
// 동시 이용은 이 순간의 비어 있는 자리로 다시 계산하고, 저장하지 않는다.
import { childTile, passTime, recordExperienceIn, startAct, syncHome, type ActKind, type GameState } from './game'
import { npcTile } from './neighbors'
import { rest } from './needs'
import { clearSpace, designateSpace, liveSpaces, reserveSeats, spaceFurniture, SPACE_USES, spaceAtTile, type HomeSpace, type SpaceUse } from './spaces'
import { footprint, type Furniture } from './room'
import { isHome, key } from './world'
import type { Tile } from './types'

/** 처음 가족과 함께 쓴 자리의 경험 id (한 항목 — 다음부터는 횟수·최근 날만) */
export const SPACE_TOGETHER_ID = 'fam:space'
/** 자리마다 한 번 쓰는 분 (기획 기본값) */
export const SPACE_MINUTES: Record<SpaceUse, number> = { tea: 20, craft: 30, family: 20, read: 20, pet: 0 }
const ACT: Record<SpaceUse, ActKind | null> = { tea: 'drink', craft: 'craft', family: 'sit', read: 'read', pet: null }
/** 이만큼 가까이 있으면 함께 쓴 것으로 본다 */
const TOGETHER = 3
const dist = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/** "자리의 쓰임 정하기": 가구를 고른 채 쓰임을 고른다 (되는 쓰임만 — 안 되면 null) */
export function setSpace(s: GameState, anchor: Furniture, use: SpaceUse): GameState | null {
  syncHome(s)
  const spaces = designateSpace(s.room, s.spaces ?? [], anchor, use)
  return spaces ? { ...s, spaces } : null
}
export function unsetSpace(s: GameState, id: string): GameState {
  return (s.spaces ?? []).some(sp => sp.id === id) ? { ...s, spaces: clearSpace(s.spaces ?? [], id) } : s
}
export function spaceById(s: Pick<GameState, 'room' | 'spaces'>, id: string): HomeSpace | undefined {
  return liveSpaces(s).find(sp => sp.id === id)
}
/** 이 가구가 앵커인 자리 (정해 둔 자리 — 쓸 수 있든 쉬고 있든) */
export function spaceOfPiece(s: Pick<GameState, 'spaces'>, f: Pick<Furniture, 'item' | 'x' | 'y'>): HomeSpace | undefined {
  return (s.spaces ?? []).find(sp => sp.id === `space:${f.item}:${f.x}:${f.y}`)
}

/** 지금 누가 서 있는 칸 (이웃·아이·동물) */
function standing(s: GameState): Set<string> {
  const out = new Set<string>()
  for (const n of Object.values(s.npcs)) if (n.visible) out.add(key(npcTile(n)))
  const kid = childTile(s)
  if (kid) out.add(key(kid))
  if (s.companion) out.add(key({ x: Math.round(s.companion.x), y: Math.round(s.companion.y) }))
  return out
}

export type SpaceBlock = 'gone' | 'away' | 'full' | null
export function canUseSpace(s: GameState, id: string): SpaceBlock {
  syncHome(s)
  const sp = spaceById(s, id)
  if (!sp || sp.use === 'pet') return 'gone'
  if (!isHome({ x: Math.round(s.player.x), y: Math.round(s.player.y) })) return 'away'
  const seat = reserveSeats(s.room, sp, ['me'], standing(s)).me
  return seat ? null : 'full'
}

/** 지금 이 자리 곁에 함께 있는 가족 (배우자·아이) */
export function familyAtSpace(s: GameState, sp: HomeSpace): string[] {
  const near = (t: Tile) => spaceFurniture(s.room, sp).some(f => footprint(f).some(p => dist(p, t) <= TOGETHER))
  const out: string[] = []
  const r = s.romance
  if (r?.stage === 'married' && r.partner) {
    const n = s.npcs[r.partner]
    if (n?.visible && isHome(npcTile(n)) && near(npcTile(n))) out.push(r.partner)
  }
  const kid = childTile(s)
  if (kid && isHome(kid) && near(kid)) out.unshift('family:child')
  return out
}

export interface SpaceUseResult { state: GameState; use: SpaceUse; /** 가족과 함께 쓴 처음 */ first: boolean; together: string[] }

/**
 * 자리에 앉아 쓴다: 곁의 비어 있는 의자(같은 의자에 둘이 겹치지 않는다)에 앉는 동작, 시간이 조금 흐르고, 그날 기분이 좋아진다.
 * 차 자리·가족 쉼터·읽는 자리는 쉬고 손일 자리는 쉬지 않는다. 가족이 곁에 있으면 함께 쓴 기억(처음 한 번 안내)
 */
export function useSpace(s: GameState, id: string): SpaceUseResult | null {
  if (canUseSpace(s, id)) return null
  const sp = spaceById(s, id)!
  const here: Tile = { x: Math.round(s.player.x), y: Math.round(s.player.y) }
  // 곁에서 가장 가까운 비어 있는 의자에 앉는다
  const seat = reserveSeats(s.room, sp, ['me'], standing(s), here).me
  if (!seat) return null
  const act = ACT[sp.use]!
  let next: GameState = { ...s, flags: { ...s.flags, spaceDay: s.clock.day } }
  if (sp.use !== 'craft') next = { ...next, needs: rest(next.needs) }
  next = passTime(next, SPACE_MINUTES[sp.use])
  const together = familyAtSpace(next, sp)
  let first = false
  if (together.length) {
    first = !next.life?.experiences?.[SPACE_TOGETHER_ID]
    next = recordExperienceIn(next, { id: SPACE_TOGETHER_ID, kind: 'family', with: together, place: 'home', choice: SPACE_USES.indexOf(sp.use) })
  }
  return { state: startAct(next, act, seat.at), use: sp.use, first, together }
}

export { spaceAtTile }
