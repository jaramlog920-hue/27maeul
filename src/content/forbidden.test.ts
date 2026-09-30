import { forbiddenIn } from './forbidden'

describe('금지어', () => {
  it('성경 인물·지명·돈 이름은 걸린다', () => {
    for (const t of ['예수', '베드로의 집', '데나리온 한 닢', '드라크마', '달란트', '므나', '세겔', '렙돈', '바울']) expect(forbiddenIn(t), t).not.toBeNull()
  })
  it('책 이름과 낱말 가운데는 통과한다', () => {
    for (const t of ['누가복음', '요한복음', '사도행전', '요한계시록', '요한일서', '필요한 것', '닢 열 개', '양치기']) expect(forbiddenIn(t), t).toBeNull()
  })
  it('여덟 권의 책 이름(계획 8)도 통과한다 — 사람 이름만으로는 여전히 걸린다', () => {
    for (const t of ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서']) expect(forbiddenIn(t), t).toBeNull()
    for (const t of ['베드로', '베드로가', '베드로의 편지', '요한이']) expect(forbiddenIn(t), t).not.toBeNull()
  })
  it('요한계시록·잔치 문구에 쓰지 않는 말(계획 9)은 걸린다 — 요한계시록 책 이름·다른 숫자는 통과', () => {
    for (const t of ['정경', '정경이 모였다', '휴거', '천년왕국', '적그리스도', '666', '숫자 666', '짐승의 표']) expect(forbiddenIn(t), t).not.toBeNull()
    for (const t of ['요한계시록', '1666닢', '6667', '짐승', '표 한 장', '일곱 교회']) expect(forbiddenIn(t), t).toBeNull()
  })
})
