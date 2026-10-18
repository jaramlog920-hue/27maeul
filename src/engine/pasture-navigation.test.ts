import { expect, it, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { establishedGame } from './growth-test-support'
import { settle, tick } from './game'
import { weatherOf } from './calendar'
import * as movement from './movement'

it('실제 출근 시간의 맑은 날·비 오는 날 양우리 입구 점유는 실패 경로를 만들지 않는다', () => {
  const original = movement.findWarpRoute
  const failures: string[] = []
  const spy = vi.spyOn(movement, 'findWarpRoute').mockImplementation((from, to, blockers) => {
    const path = original(from, to, blockers)
    if (!path) failures.push(`${from.x},${from.y}->${to.x},${to.y}`)
    return path
  })
  try {
    expect(weatherOf(3)).toBe('rain')
    for (const day of [1, 3]) for (const position of [{ x: 10, y: 30 }, { x: 5, y: 27 }, { x: 5, y: 28 }]) {
      const base = establishedGame(CONTENT, 14)
      let s = settle({ ...base, scenes: [], clock: { day, minute: 399 }, player: { ...base.player, ...position, path: [] } }, CONTENT)
      s = { ...s, scenes: [] }
      for (let i = 0; i < 40; i++) s = tick(s, .1, () => .5, CONTENT).state
      expect(s.npcs.shepherd).toBeDefined()
    }
    expect(failures).toEqual([])
  } finally { spy.mockRestore() }
}, 30000)
