// 빈칸 보기 고르기 (계획 8 작업 4) — 옮겨 적기(copy.ts)와 편지 서고 퀴즈 빈칸(quiz.ts)이 함께 쓴다.
// 이 파일은 quiz.ts·copy.ts를 import하지 않는다 (서로 import하는 고리 없이).
import type { Rng } from './types'

/** 빈칸 낱말의 최소 길이 (띄어쓰기를 뺀 글자 수) */
export const COPY_WORD_MIN = 3

/**
 * 빈칸으로 쓰지 않는 짧은 이음말·대이름말 (길이 조건을 넘는 것만 뜻이 있다 — '이는'·'또한'은 길이로도 빠진다).
 * 이런 낱말은 보기로 골라도 뜻을 가늠할 수 없어 옮겨 적기가 맞히기 놀이가 된다
 */
export const COPY_STOPWORDS: readonly string[] = [
  '그러나', '그러므로', '그런즉', '그러면', '그리하여', '그리고', '그러하나', '그러할지라도', '그런데', '이러므로', '이러한', '이와같이',
  '이는', '또한', '또는', '곧', '이것은', '이것이', '그것은', '그것이', '저것은',
  '우리가', '우리는', '우리의', '우리를', '우리에게', '우리도', '우리와',
  '너희가', '너희는', '너희의', '너희를', '너희에게', '너희도', '너희와',
  '저희가', '저희는', '저희의', '저희를', '저희에게', '저희도', '저희와',
  '내가', '나는', '나의', '나를', '나에게', '네가', '너는', '너의', '너를', '너에게',
  '그들이', '그들은', '그들의', '그들을', '그들에게',
  '아니라', '아니요', '아니니라', '아니하고', '아니하니', '아니하며', '아니하노라', '있느니라', '있으니', '있어', '하노라', '하느니라',
  '어떤', '어찌', '무엇이뇨', '무엇이냐', '모든', '누구든지', '무엇이든지',
  // 뜻보다 이음 구실을 하는 말 (자리만 보고도 고를 수 있거나, 골라도 본문을 읽은 것이 되지 않는다)
  '안에서', '위하여', '가운데', '가운데서', '말미암아', '말미암지', '인하여', '인하여서', '이것을', '이것이', '이것으로', '그것을', '그것으로',
  '하물며', '아무도', '아무것도', '가지는', '하나도', '되나니', '같으니', '같으나', '대하여', '향하여',
  '되었으니', '되었느니라', '되리라', '하려고', '하려함이라', '함이라', '함이니라', '함이요', '것이라', '것이니', '것이요', '것이니라',
  '이로써', '이제는', '그러니', '그런고로', '그러한즉', '뿐아니라', '아니면',
  '아니하나니', '아니하느니라', '아니하였으니', '이같이', '저같이', '그같이', '이렇게', '그렇게', '어떻게', '무엇을', '무엇으로', '누구를', '누구든',
  '있으며', '있나니', '있도다', '있을지어다', '없느니라', '없나니', '하였으니', '하였으나', '하였느니라',
]
const STOP = new Set(COPY_STOPWORDS)

/** 띄어쓰기·문장부호를 뺀 낱말 (보기끼리 같은지, 끝말이 같은지 볼 때) */
export const wordNorm = (s: string) => s.replace(/[\s,.!?]+/g, '')

/** 빈칸으로 쓸 수 있는 "내용 낱말": 한글만(문장부호·괄호 글자 없음), 3자 이상, 이음말 목록에 없음 */
export function isContentWord(w: string): boolean {
  return /^[가-힣]+$/.test(w) && w.length >= COPY_WORD_MIN && !STOP.has(w)
}

/** 섞기 (copy.ts·quiz.ts와 같은 방식 — rng를 부르는 순서까지 같다) */
export function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 틀린 보기의 순서: 끝말이 답과 같은 것 먼저 (끝 두 글자 같음 → 끝 글자 같음 → 나머지), 같은 무리 안에서는 길이가 답과 ±1자인 것 먼저.
 * 끝말(조사·어미)이 다르면 문장 자리만 보고도 답이 드러나기 때문
 */
export function optionRank(answer: string, w: string): number {
  const a = wordNorm(answer)
  const x = wordNorm(w)
  const ending = x.length >= 2 && a.length >= 2 && x.slice(-2) === a.slice(-2) ? 0 : x.slice(-1) === a.slice(-1) ? 2 : 4
  return ending + (Math.abs(x.length - a.length) <= 1 ? 0 : 1)
}

/** 보기 후보를 섞은 뒤 optionRank로 안정 정렬 (같은 순위 안에서는 섞은 순서) — 앞에서부터 고르면 된다 */
export function rankOptions(answer: string, candidates: readonly string[], rng: Rng): string[] {
  return shuffleWith(candidates, rng)
    .map((w, i) => ({ w, i, r: optionRank(answer, w) }))
    .sort((x, y) => x.r - y.r || x.i - y.i)
    .map((x) => x.w)
}
