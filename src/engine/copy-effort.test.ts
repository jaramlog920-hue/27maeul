// 필사 퍼즐 수고 (2026-10-08): 퍼즐로 마친 절은 직접 쓰기의 60% 시간·피로
import { careKey, chapterEffort, notePuzzle, PUZZLE_EFFORT } from './copy-ways'

describe('퍼즐 수고 60%', () => {
  const key = careKey('lk', 1)
  it('모두 직접 쓰면 그대로, 모두 퍼즐이면 60%, 반이면 80%', () => {
    expect(chapterEffort(undefined, key, 10)).toBe(1)
    let care = undefined as ReturnType<typeof notePuzzle> | undefined
    for (let i = 0; i < 10; i++) care = notePuzzle(care, key)
    expect(chapterEffort(care, key, 10)).toBeCloseTo(PUZZLE_EFFORT)
    let half = undefined as ReturnType<typeof notePuzzle> | undefined
    for (let i = 0; i < 5; i++) half = notePuzzle(half, key)
    expect(chapterEffort(half, key, 10)).toBeCloseTo(0.8)
  })
  it('다른 장의 기록은 세지 않는다', () => {
    const other = notePuzzle(undefined, careKey('lk', 2))
    expect(chapterEffort(other, key, 4)).toBe(1)
  })
})
