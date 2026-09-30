// 날마다 어떤 이웃이 어떤 이야기 조각을 전해 줄지 정한다.
import type { Piece, Rng } from './types'

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const a = [...items]
  const r = mulberry32(seed * 9973 + 17)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 아직 다 쓰지 않은 장 중 가장 앞 장. 모두 썼으면 null */
export function currentChapter(pieces: readonly Piece[], completed: readonly number[]): number | null {
  const chapters = [...new Set(pieces.map((p) => p.chapter))].sort((a, b) => a - b)
  return chapters.find((c) => !completed.includes(c)) ?? null
}

/** 하루에 이야기를 건네는 이웃은 많아야 여섯 (2026-09-30 사용자) */
export const MAX_OFFERS_PER_DAY = 6

/**
 * 이웃마다 하루 하나씩, 많아야 여섯 명에게 나눠 준다. 지금 장에서 아직 듣지 않은 조각을 먼저(섞어서),
 * 지금 장 조각이 모자라면 다음 장 조각으로 채운다 — 하루에 한 장 넘게 모을 수 있다
 */
export function offersForDay(args: {
  day: number
  pieces: readonly Piece[]
  collected: readonly string[]
  chapter: number | null
  neighborIds: readonly string[]
}): Record<string, string> {
  const out: Record<string, string> = {}
  if (args.chapter === null) return out
  const chapter = args.chapter
  const left = args.pieces.filter((p) => !args.collected.includes(p.id) && p.chapter >= chapter)
  const chapters = [...new Set(left.map((p) => p.chapter))].sort((a, b) => a - b)
  // 장 순서대로, 한 장 안에서는 섞어서
  const queue = chapters.flatMap((c, i) => seededShuffle(left.filter((p) => p.chapter === c), args.day + i * 131)).slice(0, MAX_OFFERS_PER_DAY)
  // 조각이 이웃보다 적은 날에도 이야기가 골고루 돌도록 이웃 순서도 섞는다
  seededShuffle(args.neighborIds, args.day + 7777).forEach((id, i) => {
    if (queue[i]) out[id] = queue[i].id
  })
  return out
}
