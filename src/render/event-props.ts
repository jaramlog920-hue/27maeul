// 행사 소품 그리기 (계획 17 작업 4·5): 무엇이 어디 놓이는지는 엔진(event-scene.ts의 eventPropsNow)이 정하고,
// 여기서는 원본 도트(wedding-art·event-art·event-life-motion의 EVENT_STATES)를 소품 팔레트로 한 번 칠해 두고 그린다.
import type { EventProp } from '../engine/event-scene'
import { TILE } from '../engine/world'
import { FURNI_PALETTE, type FurnitureArt } from './furniture-art'
import { EVENT_PROPS } from './event-art'
import { EVENT_STATES } from './event-life-motion'
import { WEDDING_ARCH, WEDDING_PROPS } from './wedding-art'

/** 행사 소품 그림 이름 → 원본 도트 (꽃 아치는 앞에서 보는 모습) */
export const EVENT_PROP_ART: Record<string, FurnitureArt> = { ...WEDDING_PROPS, ...EVENT_PROPS, ...EVENT_STATES, weddingArch: WEDDING_ARCH.down }

const cache = new Map<string, HTMLCanvasElement>()
function painted(name: string): HTMLCanvasElement | null {
  const a = EVENT_PROP_ART[name]
  if (!a) return null
  let c = cache.get(name)
  if (c) return c
  c = document.createElement('canvas')
  c.width = a.w * 16
  c.height = a.h * 16
  const g = c.getContext('2d')!
  a.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = FURNI_PALETTE[ch]
      if (ch === '.' || !col) return
      g.fillStyle = col
      g.fillRect(x, y, 1, 1)
    }),
  )
  cache.set(name, c)
  return c
}

/** 소품 하나를 마을 좌표(칸 × TILE)에 */
export function drawEventProp(g: CanvasRenderingContext2D, p: EventProp): void {
  const c = painted(p.art)
  if (c) g.drawImage(c, p.at.x * TILE, p.at.y * TILE + (p.dy ?? 0))
}

/** 바닥 소품의 그리는 줄 (사람과 겹칠 때 앞뒤): 아래 줄 기준, 같은 줄의 사람보다 조금 뒤 */
export function eventPropSortY(p: EventProp): number {
  return p.at.y + p.h - 1 - 0.02
}
