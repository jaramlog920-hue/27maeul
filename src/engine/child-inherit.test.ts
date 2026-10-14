// 기록자 능력치 물려받기 (2026-10-14 사용자): 단계와 상관없이 20~50%, 아기 때 잘 돌볼수록 높은 몫이 나오기 쉽다(늘 최대는 아님)
import { describe, expect, it } from 'vitest'
import { INHERIT_MAX, INHERIT_MIN, inheritFromPlayer, inheritShare, newChild } from './child'
import { mulberry32 } from './offers'
import { freshStats, totalXp } from './stats'

describe('물려받기', () => {
  it('몫은 늘 20~50% 사이, 잘 돌볼수록 평균이 오르지만 최대가 보장되지는 않는다', () => {
    const avg = (cared: number) => {
      const r = mulberry32(42)
      let sum = 0
      for (let i = 0; i < 2000; i++) {
        const v = inheritShare(cared, r)
        expect(v).toBeGreaterThanOrEqual(INHERIT_MIN)
        expect(v).toBeLessThanOrEqual(INHERIT_MAX)
        sum += v
      }
      return sum / 2000
    }
    const none = avg(0), all = avg(14)
    expect(all).toBeGreaterThan(none + 0.05)
    expect(all).toBeLessThan(INHERIT_MAX)
    // 다 돌봐도 낮은 몫이 나올 수 있다
    expect(inheritShare(14, () => 0)).toBe(INHERIT_MIN)
  })
  it('기록자의 모든 능력치에서 단계와 상관없이 같은 몫을 받고, 한 번만', () => {
    const player = freshStats()
    player.wit = { level: 2, xp: 10, born: 0 }
    player.hand = { level: 5, xp: 0, born: 0 }
    const c = newChild(10, player, undefined)
    const got = inheritFromPlayer(c, player, () => 0.5)
    const share = got.inherited! / 100
    expect(share).toBeCloseTo(INHERIT_MIN + (INHERIT_MAX - INHERIT_MIN) * 0.5, 2)
    expect(totalXp(got.stats.wit)).toBe(Math.floor(totalXp(player.wit) * share))
    expect(totalXp(got.stats.hand)).toBe(Math.floor(totalXp(player.hand) * share))
    expect(inheritFromPlayer(got, player, () => 1)).toBe(got)
  })
})
