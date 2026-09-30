// 계획 8 작업 4: 빈칸 보기 고르기 (옮겨 적기·편지 서고 퀴즈가 함께 쓴다)
import * as copy from './copy'
import { mulberry32 } from './offers'
import { COPY_STOPWORDS, isContentWord, optionRank, rankOptions } from './word-options'

describe('rankOptions', () => {
  it('끝 두 글자 같은 것 → 끝 글자 같은 것 → 나머지, 같은 무리 안에서 길이 ±1 먼저', () => {
    const answer = '역사하느니라'
    // 가짜 후보: [끝 두 글자 같음·길이 ±1, 끝 두 글자 같음·길이 멀다, 끝 글자 같음·길이 ±1, 끝 글자 같음·길이 멀다, 나머지·±1, 나머지·멀다]
    const cands = ['가나다느니라', '가느니라', '가나다바라', '가라', '가나다바사', '가나']
    for (let seed = 1; seed <= 20; seed++) {
      const out = rankOptions(answer, cands, mulberry32(seed))
      expect(out, `${seed}`).toEqual(['가나다느니라', '가느니라', '가나다바라', '가라', '가나다바사', '가나'])
      expect(out.map((w) => optionRank(answer, w))).toEqual([0, 1, 2, 3, 4, 5])
    }
  })

  it('같은 순위 안에서는 섞은 순서 (씨앗에 따라 달라지고, 같은 씨앗이면 같다)', () => {
    const cands = ['사랑하라', '기뻐하라', '감사하라', '기도하라', '구하라']
    const orders = new Set<string>()
    for (let seed = 1; seed <= 20; seed++) {
      const a = rankOptions('순종하라', cands, mulberry32(seed))
      expect(rankOptions('순종하라', cands, mulberry32(seed))).toEqual(a)
      expect([...a].sort()).toEqual([...cands].sort())
      // 끝 두 글자 '하라'인 넷이 '구하라'(끝 두 글자 같음, 길이 -1) 포함 모두 순위 0 → 섞인 순서
      orders.add(a.join())
    }
    expect(orders.size).toBeGreaterThan(1)
  })

  it('빈 후보는 빈 배열, 입력을 바꾸지 않는다', () => {
    expect(rankOptions('말씀을', [], mulberry32(1))).toEqual([])
    const cands = Object.freeze(['은혜를', '믿음으로'])
    expect(() => rankOptions('말씀을', cands, mulberry32(1))).not.toThrow()
  })

  it('copy.ts는 옮긴 것을 그대로 다시 내보낸다', () => {
    expect(copy.isContentWord).toBe(isContentWord)
    expect(copy.optionRank).toBe(optionRank)
    expect(copy.COPY_STOPWORDS).toBe(COPY_STOPWORDS)
  })
})
