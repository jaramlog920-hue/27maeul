import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { GARDEN_TILES } from '../engine/garden'
import { tileAt, TILE } from '../engine/world'
import { drawDecor, LANTERNS, SHIP_AT } from './decor'

// 텃밭(14~17, 3~5) 위에 꽃·등불 기둥이 겹쳐 그려지지 않는지 확인한다
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

describe('나루에 들어오는 큰 배 (계획 5 작업 5)', () => {
  const shipTiles = [0, 1, 2].map((dx) => ({ x: SHIP_AT.x + dx, y: SHIP_AT.y }))
  it('배 자리는 나루(=) 바로 왼쪽 물 위다', () => {
    for (const t of shipTiles) expect(tileAt(t.x, t.y)).toBe('~')
    expect(tileAt(SHIP_AT.x + 3, SHIP_AT.y)).toBe('=')
  })
  it('여정을 다 이은 다음 날(actsShip 2)부터만 그린다', () => {
    for (const [ship, drawn] of [[undefined, false], [1, false], [2, true]] as const) {
      const game = { ...newGame(CONTENT), flags: ship ? { actsShip: ship } : ({} as Record<string, number>) }
      const ctx = new FakeCtx()
      drawDecor(ctx as unknown as CanvasRenderingContext2D, game, 'sunny', 0, true)
      expect(shipTiles.some((t) => ctx.calls.some(tileOf(t.x, t.y))), String(ship)).toBe(drawn)
    }
  })
})

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
    expect(ctx.calls.some(tileOf(3, 11))).toBe(true)
    expect(ctx.calls.some(tileOf(19, 8))).toBe(true)
  })

  it('등불이 풀린 뒤에는 (3,8)에 기둥이 서고 텃밭 칸에는 서지 않는다', () => {
    const game = { ...newGame(CONTENT), flags: { villageLevel: 0, 'unlock:lanterns': 1 } }
    const ctx = new FakeCtx()
    drawDecor(ctx as unknown as CanvasRenderingContext2D, game, 'sunny', 0, true)
    expect(ctx.calls.some(tileOf(3, 8))).toBe(true)
    for (const p of GARDEN_TILES) expect(ctx.calls.some(tileOf(p.x, p.y)), `${p.x},${p.y}`).toBe(false)
  })
})
