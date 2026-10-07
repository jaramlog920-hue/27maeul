// 계획 21 R1: 필사 방식 — 구절마다 직접 쓰기 / 낱말 조각 맞추기 / 빈칸 채우기 (사용자 결정 2026-10-07).
// 방식은 (저장 씨앗, 책, 장, 절) 해시로 정해 다시 열어도 같다. 퍼즐로 마친 절도 기록은 언제나 본문 그대로 (원문과 한 글자도 다르지 않다).
// 필사를 막지 않는다: 퍼즐에서 틀려도 불이익 없음, "직접 쓸게요"로 언제든 손으로 쓸 수 있다.
import { mulberry32 } from './offers'
import { isContentWord, rankOptions, shuffleWith, wordNorm } from './word-options'
import { levelOf, type Stats } from './stats'

export type CopyWay = 'write' | 'tiles' | 'blank'

/** 필사 실력 (2–10): 지능과 손재주 레벨의 합 — 필사로 장을 마칠 때 둘이 함께 자란다 */
export function copyLevel(stats: Stats | undefined): number {
  return levelOf(stats, 'wit') + levelOf(stats, 'hand')
}

/** 실력별 방식 확률 [직접, 조각, 빈칸] (%) — R1 표 */
export function wayOdds(level: number): [number, number, number] {
  if (level <= 2) return [100, 0, 0]
  if (level <= 4) return [80, 20, 0]
  if (level <= 6) return [55, 30, 15]
  if (level <= 8) return [40, 30, 30]
  return [25, 30, 45]
}

/** 문자열 → 씨앗 (FNV-1a) */
export function hashKey(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const verseKey = (seed: number, book: string, chapter: number, verse: number) => `${seed}|${book}|${chapter}|${verse}`

/** 이 절의 방식 (always=직접 쓰기 설정이면 늘 직접) */
export function wayFor(seed: number, book: string, chapter: number, verse: number, level: number, always = false): CopyWay {
  if (always) return 'write'
  const [w, t] = wayOdds(level)
  const r = mulberry32(hashKey(verseKey(seed, book, chapter, verse)))() * 100
  return r < w ? 'write' : r < w + t ? 'tiles' : 'blank'
}

// ── 낱말 조각 ──

export interface Tiles {
  /** 처음부터 놓여 있는 앞부분 (긴 구절) */
  fixed: string[]
  /** 맞춰야 할 조각 (본문 순서) */
  pieces: string[]
  /** 화면에 섞어 보이는 순서 (pieces의 번호) */
  order: number[]
}

/** 맞출 조각은 많아야 이만큼 — 긴 구절은 앞부분을 놓아 둔다 */
export const TILE_MAX = 8

/**
 * 절을 어절(띄어쓰기) 단위 조각으로: 실력이 높을수록 2–3어절 묶음. 조각을 이으면(띄어쓰기 하나씩) 본문과 같다.
 * 조각이 하나뿐이면 null (퍼즐이 되지 않는다)
 */
export function tilesFor(text: string, level: number, seed: number, book: string, chapter: number, verse: number): Tiles | null {
  const words = text.split(/\s+/).filter(Boolean)
  const rnd = mulberry32(hashKey(verseKey(seed, book, chapter, verse) + '|tiles'))
  const groups: string[] = []
  for (let i = 0; i < words.length; ) {
    const size = level >= 7 ? 2 + (rnd() < 0.5 ? 1 : 0) : level >= 5 ? 1 + (rnd() < 0.5 ? 1 : 0) : 1
    groups.push(words.slice(i, i + size).join(' '))
    i += size
  }
  const cut = Math.max(0, groups.length - TILE_MAX)
  const fixed = groups.slice(0, cut)
  const pieces = groups.slice(cut)
  if (pieces.length < 2) return null
  let order = shuffleWith(pieces.map((_, i) => i), rnd)
  // 섞은 결과가 본문 순서 그대로면 한 번 더 비튼다
  if (order.every((v, i) => v === i)) order = [...order.slice(1), order[0]]
  return { fixed, pieces, order }
}

/** 조각을 이은 글 (띄어쓰기 하나씩) */
export const joinTiles = (t: Tiles): string => [...t.fixed, ...t.pieces].join(' ')

// ── 빈칸 ──

export interface VerseBlank {
  /** 절에서 몇째 어절인가 (0부터) */
  index: number
  answer: string
  /** 보기 (답 하나 + 틀린 보기, 섞은 순서) — 셋 또는 넷 */
  options: string[]
}

/** 빈칸 수: 실력 6 이하 하나, 8 이하 둘, 그 위 셋 */
export const blankCount = (level: number): number => (level <= 6 ? 1 : level <= 8 ? 2 : 3)

/**
 * 한 절의 빈칸: 그 절에 한 번만 나오는 내용 낱말을 1–3개, 보기는 같은 장 다른 절의 내용 낱말 (끝말이 비슷한 것 먼저).
 * 틀린 보기로 채운 절이 그 장 어느 절과도 같아지지 않는다. 만들 수 없으면 null (직접 쓰기로)
 */
export function blanksForVerse(text: string, chapterTexts: readonly string[], level: number, seed: number, book: string, chapter: number, verse: number): VerseBlank[] | null {
  const words = text.split(/\s+/).filter(Boolean)
  const norm = words.map(wordNorm)
  const rnd = mulberry32(hashKey(verseKey(seed, book, chapter, verse) + '|blank'))
  const cands = words.map((w, index) => ({ w: wordNorm(w), raw: w, index })).filter((x) => isContentWord(x.w) && x.w === x.raw && norm.filter((n) => n === x.w).length === 1)
  if (!cands.length) return null
  const pool = [...new Set(chapterTexts.filter((t) => t !== text).flatMap((t) => t.split(/\s+/)).filter((w) => isContentWord(w)))]
  const others = new Set(chapterTexts.filter((t) => t !== text).map((t) => t.replace(/\s+/g, ' ').trim()))
  const out: VerseBlank[] = []
  for (const c of shuffleWith(cands, rnd)) {
    if (out.length >= blankCount(level)) break
    const used = new Set(out.flatMap((b) => b.options))
    const picks: string[] = []
    for (const w of rankOptions(c.w, pool.filter((p) => p !== c.w && !used.has(p)), rnd)) {
      const filled = words.map((x, i) => (i === c.index ? w : x)).join(' ')
      if (others.has(filled)) continue
      picks.push(w)
      if (picks.length === (level >= 9 ? 3 : 2)) break
    }
    if (picks.length < 2) continue
    out.push({ index: c.index, answer: c.w, options: shuffleWith([c.w, ...picks], rnd) })
  }
  return out.length ? out.sort((a, b) => a.index - b.index) : null
}

/** 조각·빈칸 퍼즐에서 이만큼 틀리면 다음 정답이 반짝인다 (불이익 없음) */
export const HINT_AFTER = 3

// ── 정성 필사 (R2) ──

/** 정성 도장: 한 장을 모두 직접 쓰고 틀린 글자가 이만큼 이하 */
export const CARE_TYPOS = 2
export type CopyCare = { at: string; typos: number; puzzle: boolean; /** 이 장에서 퍼즐로 마친 절 수 */ puzzled?: number }
export const careKey = (book: string, chapter: number): string => `${book}:${chapter}`

/** 마치지 않은 다른 장들의 기록 (책을 바꿔 쓰다 돌아와도 퍼즐·오타 기록을 잊지 않는다 — 2026-10-08 버그 08-A) */
export type CopyCares = Record<string, CopyCare>
/** 이 장의 기록: 지금 기록이 이 장이면 그것, 아니면 넣어 둔 기록, 둘 다 없으면 새로 */
export const careIn = (care: CopyCare | undefined, other: CopyCares | undefined, key: string): CopyCare =>
  care?.at === key ? care : other?.[key] ?? { at: key, typos: 0, puzzle: false }
/** 이 장으로 옮긴다: 지금 기록이 다른 장이면 넣어 두고, 이 장의 넣어 둔 기록을 꺼낸다 */
export function switchCare(care: CopyCare | undefined, other: CopyCares | undefined, key: string): { care: CopyCare; other: CopyCares } {
  const next: CopyCares = { ...(other ?? {}) }
  if (care && care.at !== key) next[care.at] = care
  const base = careIn(care, other, key)
  delete next[key]
  return { care: base, other: next }
}

/** 지금 장의 기록 (다른 장이면 새로) */
export const careFor = (care: CopyCare | undefined, key: string): CopyCare => (care?.at === key ? care : { at: key, typos: 0, puzzle: false })
/** 틀린 글자 하나 */
export const noteTypo = (care: CopyCare | undefined, key: string): CopyCare => {
  const c = careFor(care, key)
  return { ...c, typos: c.typos + 1 }
}
/** 퍼즐로 마친 절이 있다 — 이 장은 정성 도장을 받지 않는다 */
export const notePuzzle = (care: CopyCare | undefined, key: string): CopyCare => {
  const c = careFor(care, key)
  return { ...c, puzzle: true, puzzled: (c.puzzled ?? 0) + 1 }
}

/** 퍼즐로 마친 절의 수고: 직접 쓰기의 60% (시간·피로) — 2026-10-08 */
export const PUZZLE_EFFORT = 0.6
/** 장을 마칠 때 시간·피로에 곱하는 몫: 퍼즐로 마친 절 비율만큼 60%로 */
export function chapterEffort(care: CopyCare | undefined, key: string, verses: number): number {
  const c = careFor(care, key)
  const share = verses > 0 ? Math.min(1, (c.puzzled ?? (c.puzzle ? 1 : 0)) / verses) : 0
  return 1 - (1 - PUZZLE_EFFORT) * share
}

/** 장을 마쳤을 때: 조건을 지켰으면 도장 (이미 있으면 그대로) */
export function finishCare(done: readonly string[] | undefined, care: CopyCare | undefined, key: string): { careDone: string[]; earned: boolean } {
  const c = careFor(care, key)
  const list = done ?? []
  const earned = !c.puzzle && c.typos <= CARE_TYPOS && !list.includes(key)
  return { careDone: earned ? [...list, key] : [...list], earned }
}
