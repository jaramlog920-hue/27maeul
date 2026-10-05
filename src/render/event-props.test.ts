// 행사 소품 (계획 17 작업 4·5): 엔진이 놓는 소품마다 원본 도트가 있고 크기가 맞는다
import { WEDDING_LAYOUT } from '../engine/event-scene'
import { EVENT_PROP_ART } from './event-props'

describe('행사 소품 그림', () => {
  it('엔진이 놓는 소품은 원본 도트가 있고 칸 크기가 같다', () => {
    for (const p of WEDDING_LAYOUT) {
      const a = EVENT_PROP_ART[p.art]
      expect(a, p.art).toBeDefined()
      expect([a.w, a.h], p.art).toEqual([p.w, p.h])
    }
  })
})
