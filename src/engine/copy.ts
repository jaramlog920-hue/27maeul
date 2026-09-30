// 편지 옮겨 적기의 빈칸 (계획 7 작업 3, 설계 §7-2 ③).
// 편지 한 장을 책상에서 옮겨 적을 때 낱말 몇 개를 빈칸으로 가리고 보기 넷 중에서 고르게 한다.
// 빈칸은 자리만 가린다 — 답으로 채운 절은 원문(개역한글)과 한 글자도 다르지 않다 (copy.test가 87장 전부 확인).
// 결정적: 같은 장은 언제 열어도 같은 빈칸이다 (씨앗 = 'rom:1' 같은 문자열의 해시). 그래서 저장할 것이 없다.
import { mulberry32 } from './offers'
import { MIN_VERSE_CHARS, quizzable, type QuizSource, type VerseText } from './quiz'
import type { Book, Rng } from './types'

import { isContentWord, rankOptions, shuffleWith as shuffle, wordNorm as norm } from './word-options'

// 보기 고르기는 word-options.ts로 옮겼다 (계획 8 작업 4 — 편지 서고 퀴즈 빈칸도 함께 쓴다). import하는 쪽은 그대로
export { COPY_STOPWORDS, COPY_WORD_MIN, isContentWord, optionRank } from './word-options'

/** 한 장의 빈칸 수 (첫값 — 시험판에서 맞춘다) */
export const COPY_BLANKS = 3

/** 옮겨 적기가 읽는 본문: 한 책 안 (quizSourceFor([book]) + 장 조각의 참조들) */
export interface CopySource extends QuizSource {
  /** 본문에 든 모든 책(그 책만이 아니라)에서 이 문장을 가진 절의 수 — 틀린 보기로 채운 절이 어디에도 없어야 한다 */
  countAnywhere: (text: string) => number
  /** 그 책의 장 참조 (장 조각의 ref, 장 번호 순서) */
  chapters: readonly { chapter: number; ref: string }[]
}

export interface CopyBlank {
  /** 빈칸이 든 절 ('롬 1:3') */
  ref: string
  /** 그 절에서 몇째 낱말인가 (띄어쓰기로 나눈 낱말, 0부터) */
  index: number
  answer: string
  /** 보기 넷 (답 하나 + 같은 책 다른 절의 낱말 셋, 섞은 순서) */
  options: string[]
}

/** 절을 낱말(띄어쓰기 단위)과 띄어쓰기로 나눈다 — 합치면 원문 그대로 */
function tokens(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t !== '')
}
const isSpace = (t: string) => /^\s+$/.test(t)

/** 절의 index째 낱말 */
export function wordAt(text: string, index: number): string | undefined {
  return tokens(text).filter((t) => !isSpace(t))[index]
}

/** 절의 index째 낱말을 word로 바꾼 글 (띄어쓰기는 원문 그대로) */
export function fillVerse(text: string, index: number, word: string): string {
  let n = -1
  return tokens(text)
    .map((t) => (isSpace(t) ? t : ++n === index ? word : t))
    .join('')
}

/** 빈칸 앞뒤 글 (화면에서 밑줄 칸 앞뒤에 보인다). before + answer + after = 원문 */
export function blankParts(text: string, index: number): { before: string; after: string } {
  const ts = tokens(text)
  let n = -1
  const at = ts.findIndex((t) => !isSpace(t) && ++n === index)
  return { before: ts.slice(0, at).join(''), after: ts.slice(at + 1).join('') }
}

/** 'rom:1' 같은 문자열 → 씨앗 (FNV-1a) */
function hashSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const contentWords = (v: VerseText) =>
  tokens(v.text)
    .filter((t) => !isSpace(t))
    .map((w, index) => ({ w, index }))
    .filter((x) => isContentWord(x.w))

/** 빈칸 절: 문제로 쓸 수 있고(괄호·괄호 구간·본문 없는 절 제외) 14자 이상 */
const blankable = (v: VerseText) => quizzable(v.text, v.inBrackets) && v.text.replace(/\s+/g, '').length >= MIN_VERSE_CHARS

const memo = new WeakMap<CopySource, Map<string, CopyBlank[]>>()

/**
 * 한 장의 빈칸 (많아야 COPY_BLANKS개): 장의 빈칸 절들을 세 구간으로 나눠 구간마다 한 절, 절마다 내용 낱말 하나.
 * 보기 셋은 같은 책 다른 절의 내용 낱말 (끝말이 답과 같은 것, 길이가 답과 ±1자인 것 먼저 — optionRank) — 다른 보기로 채운 절이 본문 어느 책에도 없어야 한다.
 * 같은 절에 두 번 나오는 낱말은 답이 되지 않고, 한 장의 빈칸끼리 답·보기가 겹치지 않는다.
 * 보기를 셋 못 채우면 그 낱말 대신 다음 낱말, 그 절이 안 되면 같은 구간의 다음 절
 */
export function blanksFor(book: Book, chapter: number, src: CopySource): CopyBlank[] {
  const key = `${book}:${chapter}`
  const cached = memo.get(src)?.get(key)
  if (cached) return cached
  const out = makeBlanks(key, chapter, src)
  if (!memo.has(src)) memo.set(src, new Map())
  memo.get(src)!.set(key, out)
  return out
}

function makeBlanks(key: string, chapter: number, src: CopySource): CopyBlank[] {
  const ch = src.chapters.find((c) => c.chapter === chapter)
  if (!ch) return []
  const rng = mulberry32(hashSeed(key))
  const verses = src.versesOf(ch.ref).filter(blankable)
  // 보기 낱말 풀: 그 책의 문제로 쓸 수 있는 절의 내용 낱말 (어느 절에서 왔는지와 함께)
  const pool: { w: string; ref: string }[] = []
  const seen = new Set<string>()
  for (const c of src.chapters)
    for (const v of src.versesOf(c.ref))
      if (quizzable(v.text, v.inBrackets))
        for (const { w } of contentWords(v)) {
          const k = `${w}\u0000${v.ref}`
          if (!seen.has(k)) {
            seen.add(k)
            pool.push({ w, ref: v.ref })
          }
        }

  const n = Math.min(COPY_BLANKS, verses.length)
  const segments = Array.from({ length: n }, (_, i) =>
    verses.slice(Math.floor((i * verses.length) / n), Math.floor(((i + 1) * verses.length) / n)),
  )
  const out: CopyBlank[] = []
  for (const seg of segments) {
    for (const v of shuffle(seg, rng)) {
      const b = blankIn(v, pool, out, src, rng)
      if (b) {
        out.push(b)
        break
      }
    }
  }
  return out
}

function blankIn(v: VerseText, pool: readonly { w: string; ref: string }[], taken: readonly CopyBlank[], src: CopySource, rng: Rng): CopyBlank | null {
  // 이 장의 다른 빈칸에 이미 나온 낱말(답·보기)은 답으로도 보기로도 쓰지 않는다
  const usedAnswers = new Set(taken.map((b) => norm(b.answer)))
  const usedOptions = new Set(taken.flatMap((b) => b.options.map(norm)))
  const verseWords = tokens(v.text).filter((t) => !isSpace(t)).map(norm)
  for (const { w: answer, index } of shuffle(contentWords(v), rng)) {
    if (usedAnswers.has(norm(answer)) || usedOptions.has(norm(answer))) continue
    // 같은 절에 한 번 더 나오는 낱말은 빈칸으로 가려도 답이 보인다
    if (verseWords.filter((w) => w === norm(answer)).length > 1) continue
    // 같은 책 다른 절의 낱말, 답과 띄어쓰기·문장부호만 다른 것과 이 장의 다른 빈칸 답은 뺀다
    const cands = [...new Set(pool.filter((p) => p.ref !== v.ref && norm(p.w) !== norm(answer) && !usedAnswers.has(norm(p.w))).map((p) => p.w))]
    const ordered = rankOptions(answer, cands, rng)
    const picked: string[] = []
    for (const w of ordered) {
      if (picked.some((p) => norm(p) === norm(w))) continue
      // 틀린 보기로 채운 절이 그 책에도, 본문의 다른 어느 책에도 없어야 한다
      const filled = fillVerse(v.text, index, w)
      if (src.countVerse(filled) !== 0 || src.countAnywhere(filled) !== 0) continue
      picked.push(w)
      if (picked.length === 3) break
    }
    if (picked.length < 3) continue
    return { ref: v.ref, index, answer, options: shuffle([answer, ...picked], rng) }
  }
  return null
}
