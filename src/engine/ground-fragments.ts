import { drawFragment, fragmentSeed } from './fragments'
import { mulberry32 } from './offers'
import { OT_PIECES } from './ot-pieces'
import { lockedTiles, MAP } from './world'
import { villageBookCount } from './progression'
import type { GameState } from './game'
import type { Piece, Tile } from './types'

/** 게임 날짜마다 5% 확률, 하루에 많아야 한 조각. 새로고침·왕복으로 다시 뽑지 않는다. */
export const GROUND_FRAGMENT_CHANCE = 0.05
const ROAD_SPOTS: Tile[] = MAP.flatMap((row, y) => y >= 8 && y <= 25 ? [...row].flatMap((tile, x) => tile === ',' ? [{ x, y }] : []) : [])

export function groundFragment(s: Pick<GameState, 'clock' | 'flags' | 'collected' | 'otCollected' | 'gen' | 'shelved' | 'map' | 'post' | 'offers' | 'progress'>, pieces: readonly Piece[]): { at: Tile; id: string } | null {
  if ((s.map ?? 'village') !== 'village' || s.flags.groundPieceDay === s.clock.day) return null
  const seed = fragmentSeed(s.clock.day, `ground:${s.gen?.seed ?? 0}`)
  const rng = mulberry32(seed)
  if (rng() >= GROUND_FRAGMENT_CHANCE) return null
  // 구역 해금은 다른 곳(지도·덤불·누르기)과 같은 기준 (2026-10-12)
  const locked = lockedTiles(villageBookCount(s))
  const spots = ROAD_SPOTS.filter(at => !locked.has(`${at.x},${at.y}`))
  if (!spots.length) return null
  const at = spots[Math.floor(rng() * spots.length)]
  const pool = [...pieces, ...(s.flags.newlandGift ? OT_PIECES : [])]
  const id = drawFragment(pool, [...s.collected, ...(s.otCollected ?? []), ...(s.post ?? []), ...Object.values(s.offers ?? {})], seed + 1)
  return id ? { at, id } : null
}
