import { CONTENT } from '../content/catalog'
import { FIXTURES } from './home-layout'
import { legacyGame } from './growth-test-support'
import { deserialize, serialize } from './save'

describe('옛 저장의 작업대도 필사 책상 옆으로 (2026-10-13)', () => {
  for (const old of [{ x: 23, y: 113 }, { x: 19, y: 114 }]) {
    it(`(${old.x},${old.y}) → 책상 옆`, () => {
      const s = legacyGame(CONTENT)
      const room = s.room.filter((f) => f.item !== 'homeWorkbench').concat({ item: 'homeWorkbench', ...old })
      const back = deserialize(serialize({ ...s, room }), CONTENT)!
      const wb = back.room.find((f) => f.item === 'homeWorkbench')!
      expect({ x: wb.x, y: wb.y }).toEqual({ x: FIXTURES.homeWorkbench.x, y: FIXTURES.homeWorkbench.y })
    })
  }
})
