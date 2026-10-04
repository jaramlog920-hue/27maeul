import { adopt, cleanName, companionGoal, EAVES, isGrown, STRAY_SPOTS, stepCompanion } from './companion'
import { goalFor, placeNpc, route, stepNpc, FESTIVAL_SPOTS } from './neighbors'
import { findPath } from './movement'
import { isWalkable, PLACES } from './world'
import neighbors from '../content/neighbors.json'
import type { NeighborDef } from './types'

const defs = neighbors as unknown as NeighborDef[]
const baker = defs.find((d) => d.id === 'baker')!
const merchant = defs.find((d) => d.id === 'merchant')!
const base = { wet: false, market: false, festival: false }

describe('neighbors', () => {
  it('모든 시간표 자리·비 피할 곳·행사 자리는 문에서 걸어갈 수 있다', () => {
    for (const d of defs) {
      expect(isWalkable(d.door), `${d.id} door`).toBe(true)
      const spots = [...d.schedule.flatMap((e) => [e.tile, e.wet]), FESTIVAL_SPOTS[d.id]].filter(Boolean)
      // 집 안 자리(찻집 종업원)는 문을 건너 닿는다
      for (const t of spots) expect(findPath(d.door, t!) ?? route(d.door, t!), `${d.id} → ${t!.x},${t!.y}`).not.toBeNull()
    }
  })
  it('이웃 자리는 기록자가 서는 칸과 겹치지 않는다', () => {
    const stands = Object.values(PLACES).flatMap((p) => (p.stand ? [`${p.stand.x},${p.stand.y}`] : []))
    for (const d of defs) for (const e of d.schedule) if (e.tile) expect(stands).not.toContain(`${e.tile.x},${e.tile.y}`)
  })
  it('시간표: 새벽엔 집, 아침엔 문 앞, 한낮엔 장터', () => {
    expect(goalFor(baker, { ...base, minute: 300 })).toBeNull()
    // 아침엔 바깥 화덕 곁 큰길, 한낮엔 광장 서쪽 (계획 14 지도)
    expect(goalFor(baker, { ...base, minute: 400 })).toEqual({ x: 2, y: 17 })
    expect(goalFor(baker, { ...base, minute: 700 })).toEqual({ x: 20, y: 17 })
    expect(goalFor(baker, { ...base, minute: 23 * 60 })).toBeNull()
    expect(goalFor(baker, { ...base, minute: 25 * 60 })).toBeNull()
  })
  it('비 오면 처마 밑, 상인은 장날에만', () => {
    expect(goalFor(baker, { ...base, minute: 700, wet: true })).toEqual({ x: 6, y: 17 }) // 처마 밑, 문 바로 앞은 비워 둔다
    expect(goalFor(merchant, { ...base, minute: 700 })).toBeNull()
    expect(goalFor(merchant, { ...base, minute: 700, market: true })).toEqual({ x: 21, y: 14 })
  })
  it('행사 날 저녁엔 모닥불 둘레, 이야기 자리가 가장 앞선다', () => {
    expect(goalFor(baker, { ...base, minute: 19 * 60, festival: true })).toEqual(FESTIVAL_SPOTS.baker)
    expect(goalFor(baker, { ...base, minute: 700, special: { baker: { x: 7, y: 4 } } })).toEqual({ x: 7, y: 4 })
  })
  it('집에서 나와 걸어가고, 저녁엔 문으로 들어가 사라진다', () => {
    let n = placeNpc(baker, null)
    expect(n.visible).toBe(false)
    n = stepNpc(n, baker, { x: 6, y: 10 }, 0.01)
    expect(n.visible).toBe(true)
    for (let i = 0; i < 200; i++) n = stepNpc(n, baker, { x: 6, y: 10 }, 0.05)
    expect([n.x, n.y]).toEqual([6, 10])
    for (let i = 0; i < 200; i++) n = stepNpc(n, baker, null, 0.05)
    expect(n.visible).toBe(false)
  })
})

describe('companion', () => {
  it('이름은 8자까지, 비면 기본 이름', () => {
    expect(cleanName('  아주아주아주긴이름입니다 ', 'cat')).toBe('아주아주아주긴이')
    expect(cleanName('   ', 'dog')).toBe('누렁이')
  })
  it('열흘이 지나면 다 자란다', () => {
    const c = adopt('cat', '나비', 2, STRAY_SPOTS.cat)
    expect(isGrown(c, 11)).toBe(false)
    expect(isGrown(c, 12)).toBe(true)
  })
  it('기록자 옆으로 따라가고, 비 오는 바깥이면 처마 밑으로', () => {
    let c = adopt('dog', '누렁이', 2, STRAY_SPOTS.dog)
    const goal = companionGoal({ x: 11, y: 12 }, false)!
    for (let i = 0; i < 300; i++) c = stepCompanion(c, goal, 0.05)
    expect([c.x, c.y]).toEqual([goal.x, goal.y])
    expect(companionGoal({ x: 11, y: 12 }, true)).toEqual(EAVES)
  })
})
