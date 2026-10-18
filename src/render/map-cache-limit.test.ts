// 지도 그림 캐시는 최근 것 몇 장만 남긴다 (2026-10-18 감사 M-9 — 벽을 바꿀 때마다 768×2624 캔버스가 쌓이고 지워지지 않았다)
import { CONTENT } from '../content/catalog'
import { buildWall, canBuildWall, newGame, syncHome, type GameState } from '../engine/game'
import { setHomeWalls } from '../engine/home-walls'
import { HEIGHT, TILE, WIDTH } from '../engine/world'
import { drawVillageMap } from './renderer'

function fakeContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop() {} }
  return new Proxy({ fillStyle: '', canvas: { width: 320, height: 180 } }, {
    get(target, key) {
      if (key in target) return target[key as keyof typeof target]
      return (...args: unknown[]) => (String(key).endsWith('Gradient') ? gradient : String(key) === 'measureText' ? { width: 12 } : (void args, undefined))
    },
    set(target, key, value) {
      Reflect.set(target, key, value)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

it('벽 배치가 많아도 지도 그림은 최근 12장만 남고, 오래된 것은 다시 그린다', () => {
  const base = newGame(CONTENT)
  let s: GameState = { ...base, homeLevel: 3, coins: 50000, flags: { ...base.flags, growthLegacy: 1 } }
  syncHome(s)
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()
  let full = 0
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    if (!contexts.has(this)) {
      contexts.set(this, fakeContext())
      if (this.width === WIDTH * TILE && this.height === HEIGHT * TILE) full++
    }
    return contexts.get(this)!
  } as never)
  const g = fakeContext()
  const states = [s]
  const spots = Array.from({ length: 14 }, (_, y) => Array.from({ length: 26 }, (_, x) => ({ x: x + 6, y: y + 104 }))).flat()
  for (let i = 0; i < 15; i++) {
    const next = spots.find((t) => canBuildWall(s, t) === null)
    if (!next) break
    s = buildWall(s, next)!
    states.push(s)
  }
  expect(states.length).toBeGreaterThan(13)
  for (const st of states) {
    syncHome(st)
    drawVillageMap(g, st)
  }
  const made = full
  // 최근 것들은 다시 그리지 않는다
  for (const st of states.slice(-6)) {
    syncHome(st)
    drawVillageMap(g, st)
  }
  expect(full).toBe(made)
  // 가장 오래된 배치는 캐시에서 빠져 다시 그린다
  syncHome(states[0])
  drawVillageMap(g, states[0])
  expect(full).toBe(made + 1)
  setHomeWalls(undefined)
  vi.restoreAllMocks()
})
