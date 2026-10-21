// 2026-10-22 초반 점검: 허브차 체험 재료 · 앓아눕는 까닭
import { CONTENT } from '../content/catalog'
import { applyEarlyGrowth } from './game'
import { gameAtChapters } from './growth-test-support'
import { canCook } from './cooking'
import { count } from './items'
import { SCENES, T } from '../content/text'

describe('초반 체험', () => {
  it('열다섯 장째에 허브차 재료(향초·물)를 받아 바로 만들어 볼 수 있다', () => {
    const before = gameAtChapters(CONTENT, 14)
    const after = applyEarlyGrowth(before, gameAtChapters(CONTENT, 15), CONTENT)
    expect(count(after.inv, 'herb')).toBe(1)
    expect(canCook(after, 'herbTea')).toBeNull()
  })
  it('앓아누운 날 설명은 실제 까닭(지친 채 잠듦·굶음)을 말한다', () => {
    const text = SCENES.sick.lines.map((l) => l.text).join(' ')
    expect(text).toContain('지친 채로')
    expect(T.ui.tiredWarn).toContain('앓아누워요')
  })
})
