// 여행 판에 함께 온 배우자도 그린다 (2026-10-27 점검 41번, 시안 나안)
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { newGenState } from '../engine/gen'
import { genAvatar } from '../engine/gen-looks'
import { createTripRenderer } from './renderer'
import * as looks from './neighbor-look'

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

it('대를 이은 자리의 배우자는 마을과 같이 이어받은 사람의 모습으로 그린다', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => traceCtx().ctx as never)
  const spy = vi.spyOn(looks, 'neighborLook')
  const def = CONTENT.neighbors.find((d) => d.id === 'cosmo')!
  const g0 = newGenState(CONTENT, 7, 300)
  const heir = { id: 'g-0001', origin: 'born' as const, born: 100, stage: 'adult' as const, look: 'm' as const, name: '아치', parents: ['cosmo'], spouse: null, household: null }
  const gen = { ...g0, persons: { ...g0.persons, [heir.id]: heir }, retired: { cosmo: { heir: heir.id, day: 286 } } }
  const game = { ...newGame(CONTENT), clock: { day: 300, minute: 600 }, gen }
  const actor = { x: 4, y: 5, facing: 'right' as const, walking: false }
  createTripRenderer(traceCtx().ctx).draw('harbor', game, { ...actor, y: 4 }, null, 8, 0, { actor, def })
  const call = spy.mock.calls.at(-1)!
  expect(call[0]).toBe(def)
  expect(call[4]).toEqual(genAvatar(heir))
})
