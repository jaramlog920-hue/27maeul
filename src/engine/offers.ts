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

/**
 * 기록자 자신의 말 — 이웃에게서 "전해 들은" 이야기가 아니다 (눅 1:1-4, exclusion-list §3-5).
 * 처음부터 책상 위에 놓여 있고, 이웃의 제안에는 나오지 않는다.
 */
export const OWN_WORDS: readonly string[] = ['lk-001-001']

/** 아직 다 쓰지 않은 장 중 가장 앞 장. 모두 썼으면 null */
export function currentChapter(pieces: readonly Piece[], completed: readonly number[]): number | null {
  const chapters = [...new Set(pieces.map((p) => p.chapter))].sort((a, b) => a - b)
  return chapters.find((c) => !completed.includes(c)) ?? null
}

/** 이웃마다 하루 하나씩, 지금 장에서 아직 듣지 않은 조각을 섞어서 나눠 준다 */
export function offersForDay(args: {
  day: number
  pieces: readonly Piece[]
  collected: readonly string[]
  chapter: number | null
  neighborIds: readonly string[]
}): Record<string, string> {
  const out: Record<string, string> = {}
  if (args.chapter === null) return out
  const remaining = args.pieces.filter((p) => p.chapter === args.chapter && !args.collected.includes(p.id) && !OWN_WORDS.includes(p.id))
  const shuffled = seededShuffle(remaining, args.day)
  // 조각이 이웃보다 적은 날에도 이야기가 골고루 돌도록 이웃 순서도 섞는다
  seededShuffle(args.neighborIds, args.day + 7777).forEach((id, i) => {
    if (shuffled[i]) out[id] = shuffled[i].id
  })
  return out
}
