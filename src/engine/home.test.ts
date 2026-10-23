import { chooseBook, TRADES } from './game'
import { copyNextChapter } from './copy-chapter.helper'
import { deserialize, serialize } from './save'
import { ITEM_TEXT } from '../content/text'
import { TOOLS } from './items'
import { newGame, tick, type GameState } from './game'
import { HOME_DOOR, HOME_ENTRY, HOME_FRONT, isHome, isWalkable, WARPS, key } from './world'
import { CONTENT } from '../content/catalog'
const zero = () => 0
const playerTileOf = (s: GameState) => ({ x: Math.round(s.player.x), y: Math.round(s.player.y) })
describe('문을 드나드는 동반 동물', () => {
  it('내 집 문을 밟으면 동물도 함께 들어오고, 문깔개로 나가면 함께 나간다', () => {
    const s0 = newGame(CONTENT)
    // 고양이는 외출하지 않는다 (집에서만 지낸다) — 데리고 다니는 강아지로
    const cat = { kind: 'dog' as const, name: '바둑', since: 1, x: HOME_FRONT.x - 1, y: HOME_FRONT.y, path: [], facing: 'down' as const, walkTime: 0 }
    let s: GameState = { ...s0, npcs: {}, companion: cat, player: { ...s0.player, ...HOME_FRONT, path: [HOME_DOOR] } }
    for (let i = 0; i < 40 && !isHome(playerTileOf(s)); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(playerTileOf(s)).toEqual(HOME_ENTRY)
    const inside = { x: Math.round(s.companion!.x), y: Math.round(s.companion!.y) }
    expect(isHome(inside)).toBe(true)
    // 문깔개(나가는 문) 위가 아니라 기록자 곁에 — 뒤(문깔개)가 막혀 옆에서 기다린다
    expect(WARPS.has(key(inside))).toBe(false)
    expect(Math.abs(inside.x - HOME_ENTRY.x) + Math.abs(inside.y - HOME_ENTRY.y)).toBe(1)
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
  const ready = (): GameState => chooseBook(newGame(CONTENT), 'lk', CONTENT)
  it('옛 넓은 책상은 보존하지만 기록 설비 판매는 없다', () => {
    expect(TOOLS).toContain('wideDesk')
    expect(TRADES.some((x) => x.get.wideDesk || x.get.brightLamp)).toBe(false)
    const old = { ...newGame(CONTENT), inv: { wideDesk: 1 } }
    expect(deserialize(serialize(old), CONTENT)!.inv.wideDesk).toBe(1)
  })
  it('계획 14: 빠르게 하지 않는 꾸미기 물건 — 넓은 책상·기록대가 있어도 한 장에 드는 시간은 같다, 이미 산 책상은 그대로 가진다', () => {
    const base = ready()
    const a = copyNextChapter({ ...base, inv: {} }, 'lk', CONTENT)
    const b = copyNextChapter({ ...base, inv: { wideDesk: 1 } }, 'lk', CONTENT)
    const c = copyNextChapter({ ...base, flags: { ...base.flags, 'fix:desk': 2 } }, 'lk', CONTENT)
    expect(b.clock).toEqual(a.clock)
    expect(c.clock).toEqual(a.clock)
    expect(b.inv.wideDesk).toBe(1)
    expect(ITEM_TEXT.wideDesk.desc).not.toMatch(/시간|빠르/)
    expect(ITEM_TEXT.goodPen.desc).not.toMatch(/두 병|빠르/)
  })
})
