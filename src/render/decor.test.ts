import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { GARDEN_TILES } from '../engine/garden'
import { TILE } from '../engine/world'
import { drawDecor, LANTERNS } from './decor'

// 텃밭(14~17, 3~4) 위에 꽃·등불 기둥이 겹쳐 그려지지 않는지 확인한다
class FakeCtx {
  calls: { x: number; y: number }[] = []
  fillStyle = ''
  fillRect(x: number, y: number) {
    this.calls.push({ x, y })
  }
  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  strokeStyle = ''
  lineWidth = 1
}

const tileOf = (x: number, y: number) => (c: { x: number; y: number }) => c.x >= x * TILE && c.x < (x + 1) * TILE && c.y >= y * TILE && c.y < (y + 1) * TILE

describe('마을 꽃·등불이 텃밭 위에 겹치지 않는다', () => {
  it('텃밭 여덟 칸 어디에도 등불 기둥이 서지 않는다', () => {
    for (const l of LANTERNS) expect(GARDEN_TILES.some((p) => p.x === l.x && p.y === l.y)).toBe(false)
  })

  it('마을 1단계 꽃길은 텃밭 칸에 그려지지 않는다', () => {
    const game = { ...newGame(CONTENT), flags: { villageLevel: 1 } }
    const ctx = new FakeCtx()
    drawDecor(ctx as unknown as CanvasRenderingContext2D, game, 'sunny', 0, true)
    for (const p of GARDEN_TILES) expect(ctx.calls.some(tileOf(p.x, p.y)), `${p.x},${p.y}`).toBe(false)
    // 큰길 양쪽 꽃은 그려진다
    expect(ctx.calls.some(tileOf(4, 9))).toBe(true)
    expect(ctx.calls.some(tileOf(4, 11))).toBe(true)
  })

  it('등불이 풀린 뒤에는 (5,9)에 기둥이 서고 텃밭 칸에는 서지 않는다', () => {
    const game = { ...newGame(CONTENT), flags: { villageLevel: 0, 'unlock:lanterns': 1 } }
    const ctx = new FakeCtx()
    drawDecor(ctx as unknown as CanvasRenderingContext2D, game, 'sunny', 0, true)
    expect(ctx.calls.some(tileOf(5, 9))).toBe(true)
    for (const p of GARDEN_TILES) expect(ctx.calls.some(tileOf(p.x, p.y)), `${p.x},${p.y}`).toBe(false)
  })
})
