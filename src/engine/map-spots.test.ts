// 지도를 고치면 좌표가 흩어진 곳(이웃 하루·잔치·모임·고양이 자리)이 벽이나 물에 박히기 쉽다.
// 모든 자리가 걸을 수 있고, 이웃은 자기 집 문에서 거기까지 걸어갈 수 있어야 한다.
import neighbors from '../content/neighbors.json'
import * as bonds from './bonds'
import * as companion from './companion'
import { findPath } from './movement'
import { FESTIVAL_SPOTS, FIRE } from './neighbors'
import * as stories from './stories'
import type { Tile } from './types'
import { isWalkable, MAP } from './world'

const isTile = (v: unknown): v is Tile => !!v && typeof v === 'object' && 'x' in v && 'y' in v
const where = (t: Tile) => `${t.x},${t.y} '${MAP[t.y]?.[t.x]}'`

describe('지도 위의 자리', () => {
  it('이웃의 집 문과 하루 동선은 걸을 수 있고, 문에서 닿는다', () => {
    for (const d of neighbors) {
      expect(isWalkable(d.door), `${d.id} 문 ${where(d.door)}`).toBe(true)
      for (const e of d.schedule as { from: number; tile?: Tile; wet?: Tile }[]) {
        for (const t of [e.tile, e.wet]) {
          if (!t) continue
          expect(isWalkable(t), `${d.id} ${e.from} ${where(t)}`).toBe(true)
          expect(findPath(d.door, t), `${d.id} ${e.from} 길`).not.toBeNull()
        }
      }
    }
  })
  it('잔치·모임·이야기·동물 자리는 모두 걸을 수 있다', () => {
    const spots: [string, Tile][] = [['모닥불', FIRE]]
    for (const [k, v] of Object.entries(FESTIVAL_SPOTS)) spots.push([`잔치 ${k}`, v])
    for (const mod of [bonds, stories, companion] as Record<string, unknown>[])
      for (const [name, val] of Object.entries(mod)) {
        if (isTile(val)) spots.push([name, val])
        else if (val && typeof val === 'object' && !Array.isArray(val))
          for (const [k, v] of Object.entries(val)) if (isTile(v)) spots.push([`${name}.${k}`, v])
      }
    expect(spots.length).toBeGreaterThan(30)
    for (const [label, t] of spots) expect(isWalkable(t), `${label} ${where(t)}`).toBe(true)
  })
})
