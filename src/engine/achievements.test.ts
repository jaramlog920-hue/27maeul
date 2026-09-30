import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { ACHIEVEMENTS, withFound } from './achievements'
import { newGame, recordProgress } from './game'
import { deserialize, serialize } from './save'

describe('도감·업적', () => {
  it('업적 id는 겹치지 않고 이름·설명이 있다', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    for (const a of ACHIEVEMENTS) expect(a.name && a.desc).toBeTruthy()
  })

  it('새 게임은 가진 물건만 도감에, 업적은 아직 없다', () => {
    const { state, fresh } = recordProgress(newGame(CONTENT))
    expect(fresh).toEqual([])
    for (const id of Object.keys(state.inv)) expect(state.found).toContain(id)
  })

  it('이루면 한 번만 남고 날짜가 적힌다', () => {
    const s = { ...newGame(CONTENT), coins: 600 }
    const a = recordProgress(s)
    expect(a.fresh.map((x) => x.id)).toContain('coins500')
    expect(a.state.achieved.find((x) => x.id === 'coins500')?.day).toBe(s.clock.day)
    expect(recordProgress(a.state).fresh).toEqual([])
  })

  it('물건 도감은 가방과 궤짝을 함께 보고, 새 것이 없으면 그대로', () => {
    const f = withFound(['water'], { water: 1 }, { ink: 2 })
    expect(f).toEqual(['water', 'ink'])
    const same = ['water'] as const
    expect(withFound(same as never, { water: 3 })).toBe(same)
  })

  it('저장했다 불러와도 이어진다', () => {
    const { state } = recordProgress({ ...newGame(CONTENT), coins: 600 })
    const back = deserialize(serialize(state), CONTENT)!
    expect(back.achieved.map((a) => a.id)).toContain('coins500')
    expect(back.found.length).toBeGreaterThan(0)
  })
})
