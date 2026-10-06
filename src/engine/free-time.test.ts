// 계획 20 2부 작업 B: 자유 시간 자리 — 동선을 막지 않는 자리, 결정적 고르기, 켜지 않으면 일과 그대로
import { CONTENT } from '../content/catalog'
import { newGame, tick, type GameState } from './game'
import { newGenState } from './gen'
import { withPairs } from './gen-settle'
import { FREE_SPOTS, freeSpotsFor, isFreeRoutine } from './free-time'
import { isWalkable, lockedTiles, MAP, zoneAt } from './world'
import { isWet, weatherOf } from './calendar'
import type { Tile } from './types'

const ch = (t: Tile) => MAP[t.y]?.[t.x] ?? 'T'
const inPlaza = (t: Tile) => t.x >= 18 && t.x <= 31 && t.y >= 12 && t.y <= 23
const all = FREE_SPOTS.flatMap((p) => [...p])

describe('쉬는 자리 (P4-1: 동선을 막지 않게)', () => {
  it('모두 걸을 수 있고, 잠기는 구역 밖이다', () => {
    for (const t of all) {
      expect(isWalkable(t), `${t.x},${t.y}`).toBe(true)
      expect(zoneAt(t), `${t.x},${t.y}`).toBeNull()
      expect(lockedTiles(0).has(`${t.x},${t.y}`)).toBe(false)
    }
  })
  it('길 위가 아니다 (넓은 광장만 예외)', () => {
    for (const t of all) if (!inPlaza(t)) expect(ch(t), `${t.x},${t.y}`).not.toBe(',')
  })
  it('문 칸·문 바로 앞(아래)·문 바로 위가 아니다', () => {
    const doorish = (t: Tile) => 'DLE'.includes(ch(t))
    for (const t of all) {
      expect(doorish(t), `${t.x},${t.y}`).toBe(false)
      expect(doorish({ x: t.x, y: t.y - 1 }), `${t.x},${t.y} 문 앞`).toBe(false)
      expect(doorish({ x: t.x, y: t.y + 1 }), `${t.x},${t.y} 문 위`).toBe(false)
    }
  })
  it('두 칸은 가로로만 붙고, 어떤 자리도 다른 자리와 위아래로 붙지 않는다 (세로로 두 명 서지 않게)', () => {
    for (const [a, b] of FREE_SPOTS) expect([b.x - a.x, b.y - a.y]).toEqual([1, 0])
    for (const a of all) for (const b of all) if (a !== b) expect(a.x === b.x && Math.abs(a.y - b.y) === 1, `${a.x},${a.y}`).toBe(false)
  })
  it('어떤 자리도 다른 자리와 대각선으로 붙지 않는다 (사용자 2026-10-07)', () => {
    for (const a of all) for (const b of all) if (a !== b) expect(Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1, `${a.x},${a.y} ↔ ${b.x},${b.y}`).toBe(false)
  })
  it('자리를 막아도 마을이 둘로 나뉘지 않는다', () => {
    const reach = (blocked: Set<string>) => {
      const start = { x: 24, y: 10 }
      const seen = new Set([`${start.x},${start.y}`])
      const q = [start]
      while (q.length) {
        const t = q.shift()!
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = { x: t.x + dx, y: t.y + dy }
          const k = `${n.x},${n.y}`
          if (seen.has(k) || blocked.has(k) || n.y >= 40 || !isWalkable(n)) continue
          seen.add(k)
          q.push(n)
        }
      }
      return seen.size
    }
    const base = reach(new Set())
    expect(reach(new Set(all.map((t) => `${t.x},${t.y}`)))).toBe(base - all.length)
  })
})

describe('자리 고르기', () => {
  const g = newGenState(CONTENT, 11, 1, withPairs())
  const ids = CONTENT.neighbors.map((d) => d.id)
  it('같은 씨앗·날·시간 칸이면 같은 자리, 한 자리에 한 사람', () => {
    const a = freeSpotsFor(g, 5, 600, ids)
    const b = freeSpotsFor({ ...g, affinity: { ...g.affinity } }, 5, 610, [...ids].reverse())
    expect(b).toEqual(a)
    const keys = Object.values(a).map((t) => `${t.x},${t.y}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.length).toBe(Math.min(ids.length, all.length))
  })
  it('단짝이어도 늘 붙어 다니지 않고, 여러 이웃과 고루 같은 자리에 선다 (120일)', () => {
    const rp = 'poppy|rudy'
    const best = { ...g, affinity: { ...g.affinity, [rp]: 100 } }
    const partners = new Map<string, Set<string>>(ids.map((id) => [id, new Set()]))
    let together = 0, slots = 0
    for (let day = 1; day <= 120; day++) {
      for (let m = 480; m < 1200; m += 120) {
        const spots = freeSpotsFor(best, day, m, ids)
        const byTile = new Map<number, string[]>()
        for (const [id, t] of Object.entries(spots)) {
          const i = FREE_SPOTS.findIndex((p) => p.some((x) => x.x === t.x && x.y === t.y))
          byTile.set(i, [...(byTile.get(i) ?? []), id])
        }
        for (const pair of byTile.values()) if (pair.length === 2) {
          partners.get(pair[0])!.add(pair[1])
          partners.get(pair[1])!.add(pair[0])
          if (pair.includes('rudy') && pair.includes('poppy')) together++
        }
        if (spots.rudy && spots.poppy) slots++
      }
    }
    expect(together / slots).toBeLessThan(0.2)
    expect(partners.get('rudy')!.size).toBeGreaterThanOrEqual(12)
    expect(partners.get('carpenter')!.size).toBeGreaterThanOrEqual(12)
  })
  it('두 시간이 지나면 다시 고른다', () => {
    const a = freeSpotsFor(g, 5, 600, ids), b = freeSpotsFor(g, 5, 720, ids)
    expect(b).not.toEqual(a)
  })
  it('쉬는 일과만 바꾼다: 일·함께하는 일과·조건 걸린 일과·벗어나는 날·근황은 그대로', () => {
    const at = { x: 1, y: 1 }
    const when = { from: 0, to: 60 }
    expect(isFreeRoutine('baker', { at, when, doing: 'rest' })).toBe(true)
    expect(isFreeRoutine('baker', { at, when, doing: 'bread' })).toBe(false)
    expect(isFreeRoutine('baker', { at, when, doing: 'rest', with: 'postman' })).toBe(false)
    expect(isFreeRoutine('baker', { at, when, doing: 'rest', req: { seen: ['x'] }})).toBe(false)
    expect(isFreeRoutine('poppy', { at, when, doing: 'tea' })).toBe(false) // 파피에게 찻집은 일
    expect(isFreeRoutine('baker', { at, when, doing: 'tea' })).toBe(true)
  })
})

describe('자율 생활이 꺼져 있으면 이웃 하루는 예전 그대로', () => {
  it('맑은 날 하루를 10분 간격으로 돌려도, gen이 없거나 꺼져 있으면 목적지가 같다', () => {
    let d = 3
    while (isWet(weatherOf(d))) d++
    const base = newGame(CONTENT)
    const start: GameState = { ...base, clock: { day: d, minute: 6 * 60 } }
    const off: GameState = { ...start, gen: { ...newGenState(CONTENT, 3, d, withPairs()), on: false } }
    let a = start, b = off
    for (let m = 6 * 60; m < 22 * 60; m += 10) {
      a = tick(a, 600 / 60, () => 0.5, CONTENT).state
      b = tick(b, 600 / 60, () => 0.5, CONTENT).state
      for (const id of Object.keys(a.npcs)) expect(b.npcs[id]?.goal, `${id} ${m}`).toEqual(a.npcs[id]?.goal)
    }
  })
})
