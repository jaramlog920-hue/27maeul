// 집 안 가구 규칙(room.ts)의 결과를 고정하는 대표 배치 20가지 — 집 단계 0–3 (계획 20 작업 7).
// 결과 문자열은 RoomCtx를 넣기 전의 room.ts로 기록한 값이다 (room-ctx.test.ts가 지금 room.ts와 비교).
import { initialHomeFurniture, type Furniture } from './room'
import { homeRect, setHomeFurniture, setHomeLevel } from './world'
import type { Inventory } from './items'
import type { Facing, ItemId } from './types'

export interface RoomApi {
  placement(room: readonly Furniture[], item: ItemId, t: { x: number; y: number }, facing?: Facing): Furniture | null
  rotation(room: readonly Furniture[], f: Furniture): Furniture | null
  removal(room: readonly Furniture[], t: { x: number; y: number }): Furniture[]
  refitRoom(room: readonly Furniture[], inv: Inventory): { room: Furniture[]; inv: Inventory }
}

const ITEMS = ['rug', 'table', 'stool', 'nightstand', 'vase', 'chair', 'bookcase', 'roundRug', 'cupboard', 'jar', 'longBench', 'candle', 'cushion', 'daybed'] as ItemId[]
const FACES: (Facing | undefined)[] = [undefined, 'down', 'up', 'left', 'right']
const sig = (f: Furniture | null) => (f ? `${f.item}@${f.x},${f.y},${f.facing ?? '-'},${f.on ? 'on' : 'floor'}` : 'null')

/** 시나리오 i(0–19): 집 단계 i % 4, 놓기 12번 → 돌리기 → 치우기 → 다시 맞추기 */
export function runScenario(api: RoomApi, i: number): string {
  const level = (i % 4) as 0 | 1 | 2 | 3
  setHomeLevel(level)
  const home = initialHomeFurniture()
  setHomeFurniture(home)
  let seed = 1000 + i * 7919
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return Math.floor((seed / 2147483648) * n)
  }
  const r = homeRect(level)
  let room: Furniture[] = [...home]
  const out: string[] = []
  const placed: Furniture[] = []
  for (let k = 0; k < 12; k++) {
    const item = ITEMS[rnd(ITEMS.length)]
    const t = { x: r.x0 + rnd(r.x1 - r.x0 + 1), y: r.y0 + rnd(r.y1 - r.y0 + 1) }
    const f = api.placement(room, item, t, FACES[rnd(FACES.length)])
    out.push(sig(f))
    if (f) {
      room = [...room, f]
      placed.push(f)
    }
  }
  for (const f of placed) {
    const t = api.rotation(room, f)
    out.push(`rot:${sig(t)}`)
  }
  if (placed[0]) out.push(`rm:${api.removal(room, placed[0]).map(sig).join('+')}`)
  const fit = api.refitRoom(room, { rug: 1 })
  out.push(`fit:${fit.room.length}/${JSON.stringify(fit.inv)}`)
  return out.join(';')
}
