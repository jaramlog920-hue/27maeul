import { bindMinutes, copyMinutes, chooseBook, setArrangement, submitChapter, TRADES } from './game'
import { deserialize, serialize } from './save'
import { ITEM_TEXT } from '../content/text'
import { TOOLS } from './items'
import { newGame, tick, type GameState } from './game'
import { HOME_DOOR, HOME_ENTRY, HOME_FRONT, isHome, isWalkable, WARPS, key } from './world'
import { CONTENT, piecesOf } from '../content/catalog'
const zero = () => 0
const playerTileOf = (s: GameState) => ({ x: Math.round(s.player.x), y: Math.round(s.player.y) })
describe('문을 드나드는 동반 동물', () => {
  it('내 집 문을 밟으면 동물도 함께 들어오고, 문깔개로 나가면 함께 나간다', () => {
    const s0 = newGame(CONTENT)
    const cat = { kind: 'cat' as const, name: '나비', since: 1, x: HOME_FRONT.x - 1, y: HOME_FRONT.y, path: [], facing: 'down' as const, walkTime: 0 }
    let s: GameState = { ...s0, npcs: {}, companion: cat, player: { ...s0.player, ...HOME_FRONT, path: [HOME_DOOR] } }
    for (let i = 0; i < 40 && !isHome(playerTileOf(s)); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(playerTileOf(s)).toEqual(HOME_ENTRY)
    const inside = { x: Math.round(s.companion!.x), y: Math.round(s.companion!.y) }
    expect(isHome(inside)).toBe(true)
    // 문깔개(나가는 문) 위가 아니라 기록자 위쪽 칸에
    expect(WARPS.has(key(inside))).toBe(false)
    expect(inside).toEqual({ x: HOME_ENTRY.x, y: HOME_ENTRY.y - 1 })
    s = { ...s, player: { ...s.player, path: [{ x: HOME_ENTRY.x, y: HOME_ENTRY.y + 1 }] } }
    for (let i = 0; i < 40 && isHome(playerTileOf(s)); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(playerTileOf(s)).toEqual(HOME_FRONT)
    const outside = { x: Math.round(s.companion!.x), y: Math.round(s.companion!.y) }
    expect(isHome(outside)).toBe(false)
    // 밖에서도 문 위에는 세우지 않는다
    expect(WARPS.has(key(outside))).toBe(false)
    expect(isWalkable(outside)).toBe(true)
  })
})

describe('넓은 책상', () => {
  const chapter1 = piecesOf('lk').filter((p) => p.chapter === 1).map((p) => p.id)
  const ready = (): GameState => setArrangement({ ...chooseBook(newGame(CONTENT), 'lk', CONTENT), collected: chapter1 }, 'lk', 1, [...chapter1])
  it('옛 넓은 책상은 보존하지만 기록 설비 판매는 없다', () => {
    expect(TOOLS).toContain('wideDesk')
    expect(TRADES.some((x) => x.get.wideDesk || x.get.brightLamp)).toBe(false)
    const old = { ...newGame(CONTENT), inv: { wideDesk: 1 } }
    expect(deserialize(serialize(old), CONTENT)!.inv.wideDesk).toBe(1)
  })
  it('계획 14: 빠르게 하지 않는 꾸미기 물건 — 넓은 책상·기록대가 있어도 한 장에 드는 시간은 같다, 이미 산 책상은 그대로 가진다', () => {
    const base = ready()
    const plain = bindMinutes(base)
    expect(bindMinutes({ ...base, inv: { wideDesk: 1 } })).toBe(plain)
    expect(bindMinutes({ ...base, flags: { ...base.flags, 'fix:desk': 2 } })).toBe(plain)
    expect(copyMinutes({ ...base, inv: { wideDesk: 1 } })).toBe(copyMinutes(base))
    const a = submitChapter({ ...base, inv: {} }, 'lk', 1, CONTENT).state
    const b = submitChapter({ ...base, inv: { wideDesk: 1 } }, 'lk', 1, CONTENT).state
    expect(a.clock.minute - base.clock.minute).toBe(plain)
    expect(b.clock.minute - base.clock.minute).toBe(plain)
    expect(b.inv.wideDesk).toBe(1)
    expect(ITEM_TEXT.wideDesk.desc).not.toMatch(/시간|빠르/)
    expect(ITEM_TEXT.goodPen.desc).not.toMatch(/두 병|빠르/)
  })
})
