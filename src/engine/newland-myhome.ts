// 새 터의 내 집 (2026-10-14 사용자: 새 터에 내 집을 만들고, 잠자는 곳 침대에서 일어나게).
// 다 지은 입주 주택 하나를 '내 집'으로 정한다(flags.myNewHome = 건물 번호). 그 집 안에 놓은 평상(daybed)이 잠자리 —
// 누르면 잠자리 창이 뜨고, 자고 나면 그 평상 곁에서 깬다. 내 집은 빈 집 목록(가족·손님에게 내어 줄 집)에서 빠진다.
import type { GameState } from './game'
import { buildsOf, type Build } from './newland-build'
import { homeAtSlot, roomOf, slotHere } from './newland-rooms'
import { footprint, type Furniture } from './room'
import type { Tile } from './types'

/** 새 터 잠자리로 쓰는 가구 */
export const NEW_HOME_BED = 'daybed'

const idOf = (b: Pick<Build, 'id'>): number => Number(b.id.slice(1))

/** 내 집으로 정한 다 지은 입주 주택 (없으면 undefined) */
export function myNewHome(s: Pick<GameState, 'flags' | 'newland'>): Build | undefined {
  const n = s.flags.myNewHome
  return n ? buildsOf(s).find((b) => b.kind === 'home' && b.state === 'done' && idOf(b) === n) : undefined
}

export type ClaimBlock = 'notHome' | 'notDone' | 'taken' | 'mine' | null
/** 이 건물을 내 집으로 정할 수 있는가: 다 지은 입주 주택이고, 가족·손님이 살지 않는 집 */
export function canClaimHome(s: Pick<GameState, 'flags' | 'newland'>, b: Build): ClaimBlock {
  if (b.kind !== 'home') return 'notHome'
  if (b.state !== 'done') return 'notDone'
  if (s.flags.myNewHome === idOf(b)) return 'mine'
  for (const [k, v] of Object.entries(s.flags)) if ((k.startsWith('settled:') || k.startsWith('familyHome:')) && v === idOf(b)) return 'taken'
  return null
}

/** 내 집으로 정한다 (다른 집을 정해 두었으면 바꾼다). b가 null이면 내 집을 그만 쓴다 */
export function claimHome<S extends Pick<GameState, 'flags' | 'newland'>>(s: S, b: Build | null): S {
  const flags = { ...s.flags }
  if (!b) {
    delete flags.myNewHome
    return { ...s, flags }
  }
  if (canClaimHome(s, b)) return s
  return { ...s, flags: { ...flags, myNewHome: idOf(b) } }
}

/** 기록자가 지금 새 터 내 집 안에 있는가 */
export function inMyNewHome(s: Pick<GameState, 'flags' | 'newland' | 'player'> & Partial<Pick<GameState, 'map'>>): boolean {
  const mine = myNewHome(s)
  const i = slotHere(s)
  return !!mine && i >= 0 && homeAtSlot(s, i)?.id === mine.id
}

/** 내 집 안에서 이 칸에 놓인 평상 (잠자리) */
export function newBedAt(s: Pick<GameState, 'flags' | 'newland' | 'player' | 'rooms' | 'room'> & Partial<Pick<GameState, 'map'>>, t: Tile): Furniture | undefined {
  if (!inMyNewHome(s)) return undefined
  return roomOf(s).find((f) => f.item === NEW_HOME_BED && footprint(f).some((p) => p.x === t.x && p.y === t.y))
}
