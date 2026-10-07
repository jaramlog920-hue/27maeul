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

describe('긴 시뮬레이션 (작업 G): 플레이어가 상담마다 응원하고 아기 침대를 건네면', () => {
  it('200일 안에 결혼과 출생이 일어나고, 상한·가족당 둘·저장 되돌리기가 지켜진다', async () => {
    const { answerConsult, consultFor } = await import('./gen-marriage')
    const { giveCrib } = await import('./gen-birth')
    const { MAX_GENERATED, MAX_CHILDREN } = await import('./gen-config')
    const { sanitizeGen } = await import('./gen')
    let married = 0, born = 0
    for (const seed of [11, 22, 33]) {
      let { g } = playthrough(seed, 1)
      for (let day = 2; day <= 200; day++) {
        // 하루 몫의 만남
        for (let m = 480; m < 1200; m += 120) {
          const spots = freeSpotsFor(g, day, m, ids)
          const by = new Map<number, string[]>()
          for (const [id, t] of Object.entries(spots)) {
            const i = FREE_SPOTS.findIndex((p) => p.some((x) => x.x === t.x && x.y === t.y))
            by.set(i, [...(by.get(i) ?? []), id])
          }
          for (const pair of by.values()) {
            if (pair.length !== 2 || !canMeetMore(g, pair[0], pair[1], day)) continue
            const n = meetsToday(g, pair[0], pair[1], day).n
            g = addAffinity(g, pair[0], pair[1], MEET_GAIN[meetResult(g, pair[0], pair[1], day, n, fitOf(pair[0], pair[1], likes))])
            g = { ...g, meets: { ...g.meets, [relationId(pair[0], pair[1])]: { day, n: n + 1, last: m } } }
          }
        }
        // 플레이어가 상담에 응원하고, 침대를 건넨다
        for (const id of ids) {
          const r = consultFor(g, id, {}, day)
          if (r) g = answerConsult(g, r.id, 'cheer', day).g
        }
        for (const h of Object.values(g.households)) if (h.cribAsk && !h.cribAsk.given) g = giveCrib(g, h.id, day) ?? g
        g = settleOneDay({ ...g, meets: {} }, day, {}, CONTENT, {})
        // 저장했다 불러와도 같은 상태
        if (day % 50 === 0) {
          const back = sanitizeGen(JSON.parse(JSON.stringify(g)), day)! as unknown as Record<string, unknown>
          const want = { ...g, meets: {} } as unknown as Record<string, unknown>
          for (const k of Object.keys(want)) expect(back[k], `${seed} ${day} ${k}`).toEqual(want[k])
        }
      }
      married += Object.keys(g.households).length
      const kids = Object.values(g.persons).filter((p) => p.origin === 'born')
      born += kids.length
      expect(kids.length).toBeLessThanOrEqual(MAX_GENERATED)
      for (const h of Object.values(g.households)) expect(h.children.length).toBeLessThanOrEqual(MAX_CHILDREN)
      // 배우자는 서로 가리키고, 연인·배우자는 한 사람에 하나
      for (const p of Object.values(g.persons)) if (p.spouse) expect(g.persons[p.spouse].spouse).toBe(p.id)
      const partners = new Map<string, number>()
      for (const r of Object.values(g.relations)) if (r.stage !== 'friend') for (const x of [r.a, r.b]) partners.set(x, (partners.get(x) ?? 0) + 1)
      for (const n of partners.values()) expect(n).toBe(1)
    }
    expect(married).toBeGreaterThan(0)
    expect(born).toBeGreaterThan(0)
  }, 60000)
})

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
