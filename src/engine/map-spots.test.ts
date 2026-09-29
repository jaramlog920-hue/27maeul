// 지도를 고치면 좌표가 흩어진 곳(이웃 하루·잔치·모임·고양이 자리)이 벽이나 물에 박히기 쉽다.
// 모든 자리가 걸을 수 있고, 이웃은 자기 집 문에서 거기까지 걸어갈 수 있어야 한다.
import neighbors from '../content/neighbors.json'
import * as bonds from './bonds'
import * as companion from './companion'
import { findPath } from './movement'
import { FESTIVAL_SPOTS, FIRE, goalFor } from './neighbors'
import * as stories from './stories'
import type { Tile } from './types'
import { isWalkable, lockedTiles, lockedZones, MAP, PLACES, ROOMS, zoneAt } from './world'
import { CONTENT } from '../content/catalog'
import { newGame, tapTile } from './game'

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
  it('이웃이 서는 자리는 한 칸 통로가 아니다 (그 칸을 막아도 마을이 둘로 나뉘지 않는다, 문 앞은 빼고)', () => {
    const inVillage = (t: Tile) => t.y < 40
    const reachable = (blocked: string) => {
      const start = { x: 24, y: 10 }
      const seen = new Set([`${start.x},${start.y}`])
      const queue = [start]
      while (queue.length) {
        const t = queue.shift()!
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = { x: t.x + dx, y: t.y + dy }
          const k = `${n.x},${n.y}`
          if (seen.has(k) || k === blocked || !inVillage(n) || !isWalkable(n)) continue
          seen.add(k)
          queue.push(n)
        }
      }
      // 문 칸은 세지 않는다 — 제 집 문 앞에 서는 것은 막힌 길이 아니다
      return [...seen].filter((k) => { const [x, y] = k.split(',').map(Number); return !'DL'.includes(MAP[y][x]) }).length
    }
    const all = reachable('')
    for (const d of neighbors)
      for (const e of d.schedule as { from: number; tile?: Tile; wet?: Tile }[])
        for (const t of [e.tile, e.wet]) {
          if (!t || !inVillage(t)) continue
          expect(reachable(`${t.x},${t.y}`), `${d.id} ${e.from} ${where(t)}`).toBe(all - 1)
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

describe('서고 권수로 열리는 구역', () => {
  const vine = PLACES.vine.tiles[0]
  it('구역마다 맡은 곳을 덮고, 마을의 기본 자리는 덮지 않는다', () => {
    expect(zoneAt(vine)?.id).toBe('vineyard')
    expect(zoneAt({ x: 24, y: 33 })?.id).toBe('dock') // 나루
    expect(zoneAt(ROOMS.find((r) => r.owner === 'beekeeper')!.door)?.id).toBe('hives')
    expect(zoneAt(PLACES.anvil.tiles[0])?.id).toBe('forge')
    for (const id of ['bed', 'desk', 'well', 'hill', 'bench', 'library', 'basket', 'field'] as const)
      for (const t of [...PLACES[id].tiles, ...(PLACES[id].stand ? [PLACES[id].stand!] : [])]) expect(zoneAt(t), id).toBeNull()
    for (const r of ROOMS.filter((r) => r.owner !== 'beekeeper')) expect(zoneAt(r.door), r.owner).toBeNull()
  })
  it('책이 꽂힐수록 하나씩 열린다', () => {
    expect(lockedZones(0).map((z) => z.id)).toEqual(['vineyard', 'dock', 'hives', 'forge'])
    expect(lockedZones(1).map((z) => z.id)).toEqual(['dock', 'hives', 'forge'])
    expect(lockedZones(4)).toEqual([])
    expect(lockedTiles(0).has(`${vine.x},${vine.y}`)).toBe(true)
    expect(lockedTiles(1).has(`${vine.x},${vine.y}`)).toBe(false)
  })
  it('잠긴 곳으로는 걸어갈 수 없고, 책을 꽂으면 갈 수 있다', () => {
    const s = newGame(CONTENT)
    const to = { x: 43, y: 5 } // 포도원 한가운데
    expect(tapTile(s, to).player.path).toEqual([])
    const opened = tapTile({ ...s, shelved: { mk: 1 } }, to)
    expect(opened.player.path.at(-1)).toEqual(to)
  })
  it('잠긴 곳에서 일하던 이웃은 열린 다른 자리에서 지내고, 갈 곳이 없으면 집에 있다', () => {
    const grandpa = CONTENT.neighbors.find((d) => d.id === 'grandpa')!
    const smith = CONTENT.neighbors.find((d) => d.id === 'smith')!
    const ctx = { minute: 720, wet: false, market: false, festival: false }
    expect(zoneAt(goalFor(grandpa, ctx)!)?.id).toBe('vineyard')
    const shut = goalFor(grandpa, { ...ctx, locked: lockedTiles(0) })!
    expect(zoneAt(shut)).toBeNull()
    expect(isWalkable(shut)).toBe(true)
    expect(goalFor(smith, { ...ctx, locked: lockedTiles(0) })).toBeNull()
    expect(goalFor(smith, { ...ctx, locked: lockedTiles(4) })).not.toBeNull()
  })
})

describe('새 이웃 넷의 행사 자리', () => {
  const NEW = ['postman', 'innkeeper', 'fisher', 'carpenter']
  const sets: [string, Record<string, Tile>][] = [
    ['잔치', FESTIVAL_SPOTS],
    ['아기 잔치', bonds.BABY_PARTY_SPOTS],
    ['언덕', bonds.HILL_SPOTS],
  ]
  it('넷 모두 각 행사에 자리가 있고, 같은 행사 안에서 겹치지 않는다', () => {
    for (const [name, spots] of sets) {
      for (const id of NEW) expect(spots[id], `${name} ${id}`).toBeDefined()
      const keys = Object.values(spots).map((t) => `${t.x},${t.y}`)
      expect(new Set(keys).size, `${name} 겹침`).toBe(keys.length)
    }
  })
  it('잔치 자리는 광장 안, 선물은 마음 3·9 단계에 있다', () => {
    for (const id of NEW) {
      const t = FESTIVAL_SPOTS[id]
      expect(t.x >= 19 && t.x <= 29 && t.y >= 13 && t.y <= 20, id).toBe(true)
      expect(stories.MILESTONE_GIFTS[id]?.[3], id).toBeDefined()
      expect(stories.MILESTONE_GIFTS[id]?.[9], id).toBeDefined()
    }
  })
})
