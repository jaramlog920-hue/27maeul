// 66권 전체 절의 짧은 해시 (계획 20 작업 5). 구약 빈칸 오답 보기가 다른 책(신약 포함)의 실제 본문이 되지 않도록,
// 빌드 때 모든 절의 해시 목록(verse-hashes.json)을 만들고 구약 필사 본문이 "어느 책에도 없는가"를 이것으로 본다.
// 구약 3.3MB 전권을 불러오지 않고도 66권 전체를 볼 수 있다. 노드 스크립트(build-verse-hashes)도 이 파일을 읽는다.

/** 띄어쓰기와 문장부호를 떼고 비교한다 — catalog.ts·ot-catalog.ts의 quizKey와 같은 규칙 */
export const verseKey = (s: string): string => s.replace(/[\s,.!?]+/g, '')

/** 본문이 없는 절 ('(없음)'·'(25절에 포함되어 있음)') — catalog.ts의 noText와 같은 규칙 */
export const verseNoText = (text: string): boolean => text === '(없음)' || /^\(\d+절에 포함되어 있음\)$/.test(text)

/** 해시 글자 수 (30비트 → 36진수 6글자) */
export const HASH_LEN = 6

/** 절 한 줄의 해시: 정규화한 글의 FNV-1a 32비트에서 아래 30비트, 36진수 6글자. 겹치면 "있다"로 읽혀 보기를 하나 덜 쓸 뿐이다 */
export function verseHash(text: string): string {
  const key = verseKey(text)
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return ((h >>> 0) & 0x3fffffff).toString(36).padStart(HASH_LEN, '0')
}

/** 해시를 이어 붙인 글 → 집합 */
export function hashSetOf(joined: string): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i + HASH_LEN <= joined.length; i += HASH_LEN) out.add(joined.slice(i, i + HASH_LEN))
  return out
}
