// 빈칸 보기 고르기(word-options — 필사 빈칸·편지 서고 퀴즈가 함께 쓴다)와 편지 책 조각.
// 예전 편지 옮겨 적기(빈칸 채워 장 기록)는 없앴다 — 장은 필사로만 마친다 (계획 14)
import bible from '../content/nt-krv.json'
import { copySourceFor, piecesOf, quizSourceFor, versesOf } from '../content/catalog'
import { isContentWord, optionRank } from './word-options'
import { BOOKS, LETTERS } from './types'

const FULL = bible as Record<string, string[][]>
const allSrc = quizSourceFor(BOOKS)

describe('빈칸 보기 고르기', () => {
  it('짧은 이음말·문장부호가 붙은 낱말은 내용 낱말이 아니다', () => {
    for (const w of ['그러나', '그러므로', '우리가', '너희가', '이는', '또한', '하나님께,', '(곧', '말씀.', '주']) expect(isContentWord(w), w).toBe(false)
    for (const w of ['하나님의', '복음을', '사도로']) expect(isContentWord(w), w).toBe(true)
  })
  it('이음 구실을 하는 말은 내용 낱말이 아니다', () => {
    const filler = ['안에서', '위하여', '가운데', '말미암아', '인하여', '이것을', '이것이', '하물며', '아무도', '가지는', '하나도', '되나니', '같으니', '같으나']
    for (const w of filler) expect(isContentWord(w), w).toBe(false)
  })
  it('보기 순서: 끝 두 글자 같음 → 끝 글자 같음 → 나머지, 무리 안에서 길이 ±1 먼저', () => {
    const a = '하나님께서'
    expect(optionRank(a, '그리스도께서')).toBeLessThan(optionRank(a, '예수께서는'))
    expect(optionRank(a, '성령께서')).toBe(0)
    expect(optionRank(a, '그리스도께서')).toBe(0)
    expect(optionRank(a, '주예수그리스도께서')).toBe(1)
    expect(optionRank(a, '아들이셔서')).toBe(2)
    expect(optionRank(a, '말미암지')).toBe(4)
    expect(optionRank(a, '성령께서')).toBeLessThan(optionRank(a, '아들이셔서'))
    expect(optionRank(a, '아들이셔서')).toBeLessThan(optionRank(a, '말미암지'))
  })
  it('틀린 보기 확인은 다른 책까지 센다 (countAnywhere)', () => {
    const src = copySourceFor('rom')
    // 에베소서 절은 로마서 안에서는 0번, 모든 책에서는 1번 이상
    const t = versesOf('엡 2:8')[0].text
    expect(src.countVerse(t)).toBe(0)
    expect(src.countAnywhere(t)).toBeGreaterThanOrEqual(1)
    expect(src.countAnywhere(t)).toBe(allSrc.countVerse(t))
  })
})

describe('편지 책 조각', () => {
  it('편지 장 조각은 책마다 장 순서대로', () => {
    for (const b of LETTERS) expect(piecesOf(b).map((p) => p.chapter)).toEqual(FULL[b].map((_, i) => i + 1))
  })
})
