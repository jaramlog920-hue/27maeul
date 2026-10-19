// 2026-10-11 살림·경제 플레이 점검(docs/playtest-살림경제-2026-10-11.md)에서 찾은 버그의 회귀 검사
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { canOrderHome, goToSleep, homeRefitReturned, newGame, orderHome, placeFurniture, tapTile, type GameState } from './game'
import { canPlant, CROPS, GARDEN_TILES, harvest } from './garden'
import { establishedGame } from './growth-test-support'
import { MAX_STACK } from './items'
import { deserialize, serialize } from './save'
import { craftLearned } from './skills'
import { FINISH_SKILL } from './skill-defs'
import { PLACES, WILD_HERBS } from './world'

const key = (t: { x: number; y: number }) => `${t.x},${t.y}`
const withChest = (s: GameState, chest: GameState['chest']): GameState => ({ ...s, flags: { ...s.flags, 'unlock:supplyChest': 1 }, chest })

describe('1. 텃밭 칸', () => {
  it('엔진 텃밭 칸이 지도 텃밭 칸과 같다', () => {
    expect(GARDEN_TILES.map(key).sort()).toEqual(PLACES.garden.tiles.map(key).sort())
  })
  it('지도 텃밭 열두 칸 어디에나 심을 수 있다', () => {
    const s = { ...newGame(CONTENT), inv: { seedHerb: 1 } }
    for (const t of PLACES.garden.tiles) expect(canPlant(s, t, 'herb'), key(t)).toBeNull()
  })
  it('옛 저장의 텃밭 밖 작물은 원래 좌표에 남는다', () => {
    const s = newGame(CONTENT)
    const keep = PLACES.garden.tiles[0]
    const plot = { crop: 'herb' as const, grown: 1, wateredDay: null }
    const old = { ...s, garden: { [key(keep)]: plot, '17,3': { ...plot, crop: 'bean' as const } } }
    const back = deserialize(serialize(old), CONTENT)!
    // 2026-10-19 집 옆 자유 마당: 텃밭 밖 옛 작물도 원래 좌표에 남는다 (거두면 잔디로)
    const keys = Object.keys(back.garden)
    expect(keys).toHaveLength(2)
    expect(back.garden[key(keep)]).toEqual(plot)
    expect(back.garden['17,3']).toEqual({ ...plot, crop: 'bean' })
  })
})

describe('2. 집 넓히기·배운 물건 만들기는 재료 궤짝도 본다', () => {
  const rich = (): GameState => {
    const s = establishedGame(CONTENT, 21)
    s.progress.phm.completed = [1]
    return { ...s, coins: 20000, flags: { ...s.flags, 'movedIn:carpenter': 1 } }
  }
  it('가방 4 + 궤짝 6 올리브로 1단계를 부탁하고, 가방 것부터 쓴다', () => {
    const s = withChest({ ...rich(), inv: { olive: 4 } }, { olive: 6 })
    expect(canOrderHome(s)).toBeNull()
    const out = orderHome(s)!
    expect(out.inv.olive ?? 0).toBe(0)
    expect(out.chest?.olive ?? 0).toBe(0)
    expect(out.flags.homeOrder).toBe(1)
  })
  it('궤짝이 없으면 예전처럼 가방만', () => {
    const s = { ...rich(), inv: { olive: 4 }, chest: { olive: 6 } }
    expect(canOrderHome(s)).toBe('needs')
  })
  it('배운 물건(의자)을 궤짝의 갈대로 만든다', () => {
    const base = newGame(CONTENT)
    const s = withChest({ ...base, inv: { reed: 1 }, skills: { [FINISH_SKILL]: 1 } } as unknown as GameState, { reed: 5 })
    const out = craftLearned(s, FINISH_SKILL)
    expect(out.inv.stool).toBe(1)
    expect((out.inv.reed ?? 0) + (out.chest?.reed ?? 0)).toBe(4)
  })
})

describe('3. 텃밭 수확은 가방이 차면 궤짝으로', () => {
  it('가방이 꽉 차도 궤짝에 자리가 있으면 거둔다', () => {
    const at = GARDEN_TILES[0]
    const s = withChest({ ...newGame(CONTENT), inv: { herb: MAX_STACK - 1 }, garden: { [key(at)]: { crop: 'herb', grown: CROPS.herb.days, wateredDay: null } } }, {})
    const out = harvest(s, at)!
    expect(out).not.toBeNull()
    expect(out.inv.herb).toBe(MAX_STACK)
    expect(out.chest?.herb).toBe(1)
    expect(out.garden[key(at)]).toBeUndefined()
  })
})

const standAt = (s: GameState, t: { x: number; y: number }): GameState => ({ ...s, clock: { ...s.clock, minute: 10 * 60 }, player: { ...s.player, x: t.x, y: t.y, path: [] } })

describe('4. 서 있는 텃밭 칸을 다시 누르면 텃밭 창', () => {
  it('제자리 텃밭 칸을 누르면 그 칸의 텃밭으로 도착한다', () => {
    const at = PLACES.garden.tiles[PLACES.garden.tiles.length - 1]
    const out = tapTile(standAt(newGame(CONTENT), at), at)
    expect(out.target).toEqual({ kind: 'place', id: 'garden', tile: at })
    expect(out.player.path).toEqual([])
  })
})

describe('6. 들 약초는 누른 자리 곁에서만 바로 캔다', () => {
  it('한 약초 곁에서 먼 약초를 누르면 그쪽으로 걸어간다', () => {
    const [here, far] = [WILD_HERBS[0], WILD_HERBS[1]]
    const out = tapTile(standAt(newGame(CONTENT), { x: here.x, y: here.y + 1 }), far)
    expect(out.target).toMatchObject({ kind: 'place', id: 'wildHerb' })
    expect(out.player.path.length).toBeGreaterThan(5)
  })
  it('곁의 약초를 누르면 그 자리에서 바로', () => {
    const here = WILD_HERBS[0]
    const out = tapTile(standAt(newGame(CONTENT), { x: here.x, y: here.y + 1 }), here)
    expect(out.player.path).toEqual([])
  })
  it('넓은 밭은 한 덩이 안이면 곁에 선 채로 연다 (2026-10-04 사용자)', () => {
    const field = PLACES.field.tiles
    const a = field[0]
    const b = field.reduce((m, t) => (Math.abs(t.x - a.x) + Math.abs(t.y - a.y) > Math.abs(m.x - a.x) + Math.abs(m.y - a.y) ? t : m), a)
    const below = { x: a.x, y: a.y - 1 }
    const out = tapTile(standAt(newGame(CONTENT), below), b)
    expect(out.player.path).toEqual([])
  })
})

describe('5. 집이 넓어져 가방으로 돌아간 가구를 알려 준다', () => {
  it('생활방을 지어 새 문 앞이 된 칸의 가구는 가방으로 가고, 그 목록이 나온다', () => {
    let s = establishedGame(CONTENT, 21)
    s.progress.phm.completed = [1]
    s = { ...s, coins: 20000, inv: { olive: 40, papyrus: 30 }, flags: { ...s.flags, 'movedIn:carpenter': 1 } }
    s = goToSleep(orderHome(s)!, CONTENT)
    s = goToSleep(orderHome(s)!, CONTENT)
    expect(homeRefitReturned(s, s)).toEqual([])
    // 생활방 문(16,113) 바로 옆 칸(17,113)에 의자를 둔다 — 새 게임은 작업대가 책상에 붙어 이 칸이 책상 앞 자리가 되므로 작업대만 예전 자리로 (2026-10-13)
    s = { ...s, room: s.room.map((f) => (f.item === 'homeWorkbench' ? { ...f, x: 23, y: 113 } : f)) }
    const placed = placeFurniture({ ...s, inv: { ...s.inv, stool: 1 } }, 'stool', { x: 17, y: 113 })!
    expect(placed.room.some((f) => f.item === 'stool')).toBe(true)
    const built = goToSleep(orderHome(placed)!, CONTENT)
    expect(built.homeLevel).toBe(3)
    expect(built.room.some((f) => f.item === 'stool')).toBe(false)
    expect(homeRefitReturned(placed, built)).toEqual(['stool'])
  })
})
