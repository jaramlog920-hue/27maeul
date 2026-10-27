// 여행 판에 함께 온 배우자도 그린다 (2026-10-27 점검 41번, 시안 나안)
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { createTripRenderer } from './renderer'

function traceCtx() {
  const images: unknown[][] = []
  const target = { canvas: { width: 320, height: 180 }, fillStyle: '', imageSmoothingEnabled: false }
  const ctx = new Proxy(target, {
    get(t, k) {
      if (k === 'drawImage') return (...a: unknown[]) => images.push(a)
      if (String(k).startsWith('create')) return () => ({ addColorStop() {} })
      return k in t ? Reflect.get(t, k) : () => undefined
    },
    set(t, k, v) {
      Reflect.set(t, k, v)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { images, ctx }
}

afterEach(() => vi.restoreAllMocks())

it('배우자와 함께면 내 옆에 배우자 그림이 하나 더 그려지고, 발 아래 순서를 따른다', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => traceCtx().ctx as never)
  const def = CONTENT.neighbors.find((d) => d.id === 'marigold')!
  const game = { ...newGame(CONTENT), clock: { day: 10, minute: 600 } }
  const me = { x: 5.05, y: 4.05, facing: 'right' as const, walking: false }
  const mate = { x: 4.8, y: 5, facing: 'right' as const, walking: false }

  const alone = traceCtx()
  createTripRenderer(alone.ctx).draw('harbor', game, me, null, 8, 0)
  const both = traceCtx()
  createTripRenderer(both.ctx).draw('harbor', game, me, null, 8, 0, { actor: mate, def })

  expect(both.images.length).toBe(alone.images.length + 1)
  const people = both.images.slice(-2).map((a) => a[0])
  // 내가 먼저(위), 아래쪽 배우자가 나중에 — 서로 다른 그림
  expect(people[0]).toBe(alone.images.at(-1)![0])
  expect(people[1]).not.toBe(people[0])
})
