// 다른 마을 서고 점수는 하루 사이에 줄지 않는다 (2026-10-18 감사 L-25 — 주석과 달리 하루 최대 2점 줄었다)
import { villageScores } from './villages'

it('씨앗 여럿 × 400일: 어느 마을도 전날보다 점수가 낮아지지 않는다', () => {
  for (const seed of [20261007, 1, 42, 99991, 123456]) {
    let prev = villageScores(seed, 0)
    for (let day = 1; day <= 400; day++) {
      const now = villageScores(seed, day)
      now.forEach((v, i) => expect(v, `seed ${seed} day ${day} village ${i}`).toBeGreaterThanOrEqual(prev[i]))
      prev = now
    }
  }
})
