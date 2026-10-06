// 계획 20 2부: 회차마다 다른 짝 (사용자 2026-10-07 — 다회차에도 늘 비슷한 사람끼리 맺어지면 안 된다).
// 쉬는 자리 고르기 → 같은 자리 둘의 만남 → 하루 정산을 여러 씨앗으로 150일씩 돌려, 처음 맺어진 연인 쌍이 고루 퍼지는지 본다.
import { CONTENT } from '../content/catalog'
import { addAffinity, newGenState, relationId, type GenState } from './gen'
import { settleOneDay, withPairs } from './gen-settle'
import { FREE_SPOTS, freeSpotsFor } from './free-time'
import { canMeetMore, meetsToday } from './gen'
import { fitOf, meetResult, MEET_GAIN } from './meet'

const likes = (id: string) => CONTENT.neighbors.find((d) => d.id === id)?.likes ?? []
const ids = CONTENT.neighbors.filter((d) => !d.marketOnly).map((d) => d.id)

/** 한 회차: 낮 여섯 칸마다 같은 자리에 선 둘이 한 번 만난다 */
export function playthrough(seed: number, days = 150): { firstLovers: string[]; g: GenState } {
  let g = newGenState(CONTENT, seed, 1, withPairs())
  const firstLovers: string[] = []
  for (let day = 2; day <= days; day++) {
    for (let m = 480; m < 1200; m += 120) {
      const spots = freeSpotsFor(g, day, m, ids)
      const bySpot = new Map<number, string[]>()
      for (const [id, t] of Object.entries(spots)) {
        const i = FREE_SPOTS.findIndex((p) => p.some((x) => x.x === t.x && x.y === t.y))
        bySpot.set(i, [...(bySpot.get(i) ?? []), id])
      }
      for (const pair of bySpot.values()) {
        if (pair.length !== 2) continue
        const [a, b] = pair
        if (!canMeetMore(g, a, b, day)) continue
        const n = meetsToday(g, a, b, day).n
        const kind = meetResult(g, a, b, day, n, fitOf(a, b, likes))
        g = addAffinity(g, a, b, MEET_GAIN[kind])
        g = { ...g, meets: { ...g.meets, [relationId(a, b)]: { day, n: n + 1, last: m } } }
      }
    }
    const before = new Set(Object.values(g.relations).filter((r) => r.stage === 'lover').map((r) => r.id))
    g = settleOneDay({ ...g, meets: {} }, day, {}, CONTENT, {})
    for (const r of Object.values(g.relations)) if (r.stage === 'lover' && !before.has(r.id) && !firstLovers.includes(r.id)) firstLovers.push(r.id)
  }
  return { firstLovers, g }
}

describe('회차마다 다른 짝', () => {
  it('씨앗 40개: 첫 연인 쌍이 한두 쌍에 몰리지 않는다', () => {
    const first = new Map<string, number>()
    const any = new Map<string, number>()
    const runs = 40
    for (let seed = 1; seed <= runs; seed++) {
      const { firstLovers } = playthrough(seed * 7919)
      if (firstLovers[0]) first.set(firstLovers[0], (first.get(firstLovers[0]) ?? 0) + 1)
      for (const p of firstLovers) any.set(p, (any.get(p) ?? 0) + 1)
    }
    const top = [...first.entries()].sort((a, b) => b[1] - a[1])
    const topAny = [...any.entries()].sort((a, b) => b[1] - a[1])
    console.log('첫 연인 쌍 (회차 수):', top.slice(0, 8))
    console.log('한 번이라도 연인 (회차 수):', topAny.slice(0, 8))
    // 가장 흔한 첫 쌍도 회차의 1/4을 넘지 않고, 서로 다른 첫 쌍이 여럿
    expect(top[0][1]).toBeLessThanOrEqual(runs / 4)
    expect(first.size).toBeGreaterThanOrEqual(8)
    // 어떤 쌍도 절반이 넘는 회차에서 연인이 되지 않는다
    expect(topAny[0][1]).toBeLessThanOrEqual(runs / 2)
  }, 60000)
})
