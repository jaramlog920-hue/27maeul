// 계획 21 작업 3: 말씀 조각의 분위기 표식 (기쁨·위로·소망·용기·감사·지혜·성실) 0–3개.
// 해석하지 않는다 — 조각 본문에 실제로 나오는 낱말(아래 목록)을 세어 많이 나온 표식부터 셋까지. 화면에는 표식 이름만 쓴다.
// 데이터 파일 대신 본문에서 바로 계산한다(결정: 같은 본문이면 늘 같은 표식, 검수 기록은 docs/content-audit.md 계획 21 절).
import { pieceById, versesOf } from './catalog'

export type Mood = 'joy' | 'comfort' | 'hope' | 'courage' | 'thanks' | 'wisdom' | 'faithful'
export const MOODS: readonly Mood[] = ['joy', 'comfort', 'hope', 'courage', 'thanks', 'wisdom', 'faithful']

/** 표식마다 본문에서 찾는 낱말 조각 (개역한글 낱말 그대로) */
export const MOOD_WORDS: Record<Mood, readonly string[]> = {
  joy: ['기뻐', '기쁨', '기쁘', '즐거', '즐겁', '찬송', '노래'],
  comfort: ['위로', '평안', '안식', '쉬게', '슬퍼', '눈물', '근심'],
  hope: ['소망', '바라', '영생', '기다리', '약속'],
  courage: ['두려워 말', '두려워하지 말', '담대', '강하', '굳게', '일어나'],
  thanks: ['감사', '축복', '복이 있', '복을'],
  wisdom: ['지혜', '깨닫', '명철', '슬기', '배우', '가르'],
  faithful: ['충성', '부지런', '수고', '일하', '맡은', '착하고'],
}

const memo = new Map<string, Mood[]>()

/** 본문 글에서 표식 (많이 나온 것부터 셋까지, 같으면 MOODS 순서) */
export function moodsOfText(text: string): Mood[] {
  const score = MOODS.map((m) => ({ m, n: MOOD_WORDS[m].reduce((k, w) => k + text.split(w).length - 1, 0) }))
  return score.filter((x) => x.n > 0).sort((a, b) => b.n - a.n || MOODS.indexOf(a.m) - MOODS.indexOf(b.m)).slice(0, 3).map((x) => x.m)
}

/** 신약 조각의 표식 (구약 조각·모르는 id는 빈 목록 — 부탁에 "어느 구절이든" 조건만) */
export function moodsOf(pieceId: string): Mood[] {
  const hit = memo.get(pieceId)
  if (hit) return hit
  let out: Mood[] = []
  try {
    const p = pieceById(pieceId)
    out = moodsOfText(versesOf(p.ref).map((v) => v.text).join(' '))
  } catch {
    out = []
  }
  memo.set(pieceId, out)
  return out
}

/** 부탁 필사에 쓰는 조각의 사실: 분위기·길이·그 장의 정성 도장 (계획 21 R3) */
export function pieceFacts(careDone: readonly string[] | undefined, pieceId: string): { moods: Mood[]; chars: number; care: boolean } {
  let care = false
  try {
    const p = pieceById(pieceId)
    care = (careDone ?? []).includes(`${p.book}:${p.chapter}`)
  } catch {
    care = false
  }
  return { moods: moodsOf(pieceId), chars: pieceLength(pieceId), care }
}

/** 조각 본문 글자 수 (짧은 구절 조건) */
export function pieceLength(pieceId: string): number {
  try {
    return versesOf(pieceById(pieceId).ref).reduce((n, v) => n + v.text.replace(/\s+/g, '').length, 0)
  } catch {
    return Infinity
  }
}
