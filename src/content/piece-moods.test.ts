// 계획 21 작업 3: 조각 분위기 표식 — 본문 낱말에서, 셋까지, 결정적
import { PIECES } from './catalog'
import { MOODS, moodsOf, moodsOfText, pieceLength } from './piece-moods'

describe('조각 분위기 표식', () => {
  it('본문에 나온 낱말로만 정한다', () => {
    expect(moodsOfText('너희는 기뻐하고 즐거워하라')).toEqual(['joy'])
    expect(moodsOfText('두려워 말라 담대하라 평안하라')).toEqual(['courage', 'comfort'])
    expect(moodsOfText('아무 말도 없는 문장')).toEqual([])
  })
  it('모든 조각이 셋까지, 같은 조각은 늘 같은 표식, 꽤 많은 조각이 표식을 가진다', () => {
    let tagged = 0
    for (const p of PIECES) {
      const m = moodsOf(p.id)
      expect(m.length).toBeLessThanOrEqual(3)
      for (const x of m) expect(MOODS).toContain(x)
      expect(moodsOf(p.id)).toEqual(m)
      if (m.length) tagged++
    }
    expect(tagged / PIECES.length).toBeGreaterThan(0.3)
    expect(moodsOf('없는-조각')).toEqual([])
    expect(pieceLength(PIECES[0].id)).toBeGreaterThan(0)
  })
})
