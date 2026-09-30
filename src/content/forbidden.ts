// 지어낸 문장(생활 문구·이웃·이름)에 쓰지 않는 말 (exclusion-list §2-2, gospel-days §2-4).
// 책 이름(누가복음·요한복음·사도행전·요한계시록·요한일서·베드로전서…)은 허용한다.
// 낱말 가운데에 들어간 경우(필요한 → 요한)는 거른다: 바로 앞이 한글이면 다른 낱말의 일부.
const WORDS: readonly RegExp[] = [
  /예수/, /그리스도/, /하나님/, /주님/, /성령/, /천사/, /사도(?!행전)/, /제자/, /베드로(?!전서|후서)/, /요한(?!복음|계시록|일서|이서|삼서)/, /누가(?!복음)/,
  /마리아/, /바울/, /데오빌로/, /세례/, /예루살렘/, /갈릴리/, /나사렛/, /베들레헴/, /사마리아/,
  /유월절/, /오순절/, /초막절/, /안식일/, /성전/, /회당/, /의원/, /제사장/, /세리/, /바리새/, /서기관/,
  // 성경의 돈 이름 — 게임 화폐는 "닢"
  /데나리온/, /드라크마/, /렙돈/, /달란트/, /므나/, /세겔/,
]

export const FORBIDDEN: readonly RegExp[] = WORDS.map((re) => new RegExp('(?<![가-힣])' + re.source))

export function forbiddenIn(text: string): string | null {
  for (const re of FORBIDDEN) if (re.test(text)) return re.source
  return null
}
