import { forbiddenIn } from './forbidden'

describe('금지어', () => {
  it('성경 인물·지명·돈 이름은 걸린다', () => {
    for (const t of ['예수', '베드로의 집', '데나리온 한 닢', '드라크마', '달란트', '므나', '세겔', '렙돈', '바울']) expect(forbiddenIn(t), t).not.toBeNull()
  })
  it('책 이름과 낱말 가운데는 통과한다', () => {
    for (const t of ['누가복음', '요한복음', '사도행전', '요한계시록', '요한일서', '필요한 것', '닢 열 개', '양치기']) expect(forbiddenIn(t), t).toBeNull()
  })
})
