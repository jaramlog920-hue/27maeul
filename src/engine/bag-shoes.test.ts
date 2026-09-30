// 계획 11 작업 2: 가방과 신 — 가죽 가방(한 칸 18), 튼튼한 신(×1.2), 가벼운 신(양치기 선물, ×1.4)
import { CONTENT } from '../content/catalog'
import { isWet, weatherOf } from './calendar'
import { ITEM_TEXT, JOURNAL_NOTES, SCENES, T } from '../content/text'
import { COMPANION_SPEED } from './companion'
import { fromChest, LIGHT_SHOES, stash, stashOverflows, WALK_MUL, walkMul } from './easier'
import {
  gatherInfo,
  greetNeighbor,
  newGame,
  ownsTradeTool,
  playerTile,
  tick,
  trade,
  TRADES,
  walkDirection,
  wouldOverflow,
  type GameState,
} from './game'
import { heartsOf } from './hearts'
import { add, BIG_STACK, MAX_STACK, stackCap, TOOLS } from './items'
import { findPath, SPEED } from './movement'
import { deserialize, serialize } from './save'
import { HOME_DOOR, HOME_ENTRY, HOME_FRONT, isHome, PLACES } from './world'
import { walkFrame } from '../render/anim'
import { ICONS } from '../render/sprites'

const MARKET = 7
const zero = () => 0
const byId = (id: string) => TRADES.find((t) => t.id === id)!
const at = (s: GameState, day: number, minute = 10 * 60): GameState => ({ ...s, clock: { day, minute } })
const rich = (): GameState => ({ ...newGame(CONTENT), coins: 1000, scenes: [] })
const tileOf = (s: GameState) => playerTile(s)

describe('장날에 사는 것: 가죽 가방 닢 120, 튼튼한 신 닢 60', () => {
  it('값과 물건', () => {
    expect(byId('leatherBag')).toMatchObject({ coins: 120, get: { leatherBag: 1 } })
    expect(byId('sturdyShoes')).toMatchObject({ coins: 60, get: { sturdyShoes: 1 } })
    // 가벼운 신은 팔지 않는다 (양치기의 선물)
    expect(TRADES.some((t) => t.get.lightShoes)).toBe(false)
  })
  it('장날에만, 닢이 있으면 한 번만 산다', () => {
    const s = rich()
    expect(trade(at(s, MARKET - 1), byId('leatherBag'))).toBeNull()
    const a = trade(at(s, MARKET), byId('leatherBag'))!
    expect(a.inv.leatherBag).toBe(1)
    expect(a.coins).toBe(1000 - 120)
    expect(ownsTradeTool(a.inv, byId('leatherBag'), a.flags)).toBe(true)
    expect(trade(a, byId('leatherBag'))).toBeNull()
    const b = trade(at(s, MARKET), byId('sturdyShoes'))!
    expect(b.inv.sturdyShoes).toBe(1)
    expect(b.coins).toBe(1000 - 60)
    expect(trade(b, byId('sturdyShoes'))).toBeNull()
    expect(trade({ ...at(s, MARKET), coins: 119 }, byId('leatherBag'))).toBeNull()
    expect(trade({ ...at(s, MARKET), coins: 59 }, byId('sturdyShoes'))).toBeNull()
  })
  it('가방과 신은 한 번 사면 계속 쓰는 도구 (가방 칸에 하나)', () => {
    for (const id of ['leatherBag', 'sturdyShoes', 'lightShoes'] as const) {
      expect(TOOLS).toContain(id)
      expect(add({ [id]: 1 }, { [id]: 3 })[id]).toBe(1)
    }
  })
})

describe('가죽 가방: 한 칸 최대 9 → 18', () => {
  const bag = { leatherBag: 1 }
  it('가방이 없으면 9, 있으면 18', () => {
    expect(MAX_STACK).toBe(9)
    expect(BIG_STACK).toBe(18)
    expect(stackCap({})).toBe(9)
    expect(stackCap(bag)).toBe(18)
    expect(add({}, { reed: 30 }).reed).toBe(9)
    expect(add(bag, { reed: 30 }).reed).toBe(18)
  })
  it('넘치는지 볼 때도 18까지', () => {
    expect(wouldOverflow({ reed: 9 }, { reed: 1 })).toBe(true)
    expect(wouldOverflow({ ...bag, reed: 9 }, { reed: 1 })).toBe(false)
    expect(wouldOverflow({ ...bag, reed: 18 }, { reed: 1 })).toBe(true)
    const s = rich()
    const full = { ...s, clock: { day: 3, minute: 10 * 60 }, inv: { reed: 9 } }
    expect(gatherInfo(full, 'reeds')).toEqual({ blocked: 'full' })
    expect(gatherInfo({ ...full, inv: { ...bag, reed: 9 } }, 'reeds')).not.toEqual({ blocked: 'full' })
  })
  it('재료 궤짝: 가방이 18까지 찬 다음에 궤짝으로, 꺼낼 때도 18까지', () => {
    const r = stash({ ...bag, reed: 15 }, {}, { reed: 5 })
    expect(r.inv.reed).toBe(18)
    expect(r.chest).toEqual({ reed: 2 })
    expect(stash({ reed: 8 }, {}, { reed: 5 }).chest).toEqual({ reed: 4 })
    expect(stashOverflows({ ...bag, reed: 17 }, null, { reed: 1 })).toBe(false)
    expect(stashOverflows({ ...bag, reed: 18 }, null, { reed: 1 })).toBe(true)
    expect(stashOverflows({ reed: 9 }, null, { reed: 1 })).toBe(true)
    expect(fromChest({ ...bag, reed: 10 }, { reed: 20 }, 'reed')).toEqual({ inv: { ...bag, reed: 18 }, chest: { reed: 12 } })
    expect(fromChest({ reed: 5 }, { reed: 20 }, 'reed')).toEqual({ inv: { reed: 9 }, chest: { reed: 16 } })
  })
  it('옛 저장의 물건은 그대로, 가방이 있으면 18개 칸도 그대로 남는다', () => {
    const old = { ...newGame(CONTENT), inv: { reed: 9, goodPen: 1, bread: 4 } }
    expect(deserialize(serialize(old), CONTENT)!.inv).toEqual({ reed: 9, goodPen: 1, bread: 4 })
    const withBag = { ...newGame(CONTENT), inv: { leatherBag: 1, sturdyShoes: 1, lightShoes: 1, reed: 18, papyrus: 14 } }
    expect(deserialize(serialize(withBag), CONTENT)!.inv).toEqual(withBag.inv)
  })
})

describe('신: 걷는 속도 ×1.2, ×1.4 (그 이상은 없다)', () => {
  it('배수', () => {
    expect(walkMul({})).toBe(1)
    expect(walkMul({ sturdyShoes: 1 })).toBe(1.2)
    expect(walkMul({ lightShoes: 1 })).toBe(1.4)
    expect(walkMul({ sturdyShoes: 1, lightShoes: 1 })).toBe(1.4)
    expect(Math.max(...Object.values(WALK_MUL))).toBeLessThanOrEqual(1.4)
  })

  /** 오른쪽으로 곧게 뻗은 길을 1초 걷는다 */
  const walkOneSecond = (inv: GameState['inv']) => {
    const s0 = newGame(CONTENT)
    const path = Array.from({ length: 10 }, (_, i) => ({ x: 20 + i + 1, y: 10 }))
    let s: GameState = { ...s0, npcs: {}, companion: null, inv, player: { ...s0.player, x: 20, y: 10, path } }
    for (let i = 0; i < 20; i++) s = tick(s, 0.05, zero, CONTENT).state
    return s.player
  }
  it('1초에 걷는 칸 수: 3.5 → 4.2 → 4.9', () => {
    expect(walkOneSecond({}).x - 20).toBeCloseTo(SPEED, 5)
    expect(walkOneSecond({ sturdyShoes: 1 }).x - 20).toBeCloseTo(SPEED * 1.2, 5)
    expect(walkOneSecond({ sturdyShoes: 1, lightShoes: 1 }).x - 20).toBeCloseTo(SPEED * 1.4, 5)
  })
  it('걷는 그림도 같은 배수로 빨라진다 (발이 미끄러지지 않게 — 한 칸에 걸음 수가 같다)', () => {
    const a = walkOneSecond({})
    const b = walkOneSecond({ lightShoes: 1 })
    expect(b.walkTime).toBeCloseTo(a.walkTime * 1.4, 5)
    // 한 칸 걷는 동안의 걸음 그림 바뀜 수 = walkTime 늘어난 양 ÷ 칸 수
    expect(b.walkTime / (b.x - 20)).toBeCloseTo(a.walkTime / (a.x - 20), 5)
    expect([1, 2]).toContain(walkFrame(b.walkTime))
  })
  it('한 칸씩 걷기(키보드·조이스틱)는 칸 위에 정확히 멈춘다', () => {
    const s0 = newGame(CONTENT)
    let s: GameState = { ...s0, npcs: {}, inv: { lightShoes: 1 }, player: { ...s0.player, x: 11, y: 9, path: [] } }
    for (let step = 0; step < 3; step++) {
      s = walkDirection(s, 1, 0)
      expect(s.player.path).toHaveLength(1)
      // 한 칸 걷는 동안 다음 걸음은 받지 않는다 (누르고 있으면 걸음이 끝나는 대로 다음 칸)
      expect(walkDirection(s, 1, 0)).toBe(s)
      for (let i = 0; i < 20 && s.player.path.length; i++) s = tick(s, 0.05, zero, CONTENT).state
      expect(s.player.path).toEqual([])
      expect(Number.isInteger(s.player.x) && Number.isInteger(s.player.y)).toBe(true)
    }
    expect([s.player.x, s.player.y]).toEqual([14, 9])
  })
  it('빨리 걸어도 문을 밟으면 집 안으로 들어간다', () => {
    const s0 = newGame(CONTENT)
    let s: GameState = { ...s0, npcs: {}, companion: null, inv: { lightShoes: 1 }, player: { ...s0.player, ...HOME_FRONT, path: [HOME_DOOR] } }
    for (let i = 0; i < 40 && !isHome(tileOf(s)); i++) s = tick(s, 0.05, zero, CONTENT).state
    expect(tileOf(s)).toEqual(HOME_ENTRY)
  })
  it('동반 동물도 같은 배수로 — 가벼운 신으로 멀리 걸어도 곁을 따라온다', () => {
    const s0 = newGame(CONTENT)
    const cat = { kind: 'cat' as const, name: '나비', since: 1, x: HOME_FRONT.x - 1, y: HOME_FRONT.y, path: [], facing: 'down' as const, walkTime: 0 }
    // 집 앞에서 서고 쪽 장터 벤치까지 (스무 칸 넘는 길)
    const path = findPath(HOME_FRONT, PLACES.bench.stand!)!
    expect(path.length).toBeGreaterThan(20)
    // 비 오는 날은 동물이 처마 밑에 웅크리므로 맑은 날에
    const dry = Array.from({ length: 20 }, (_, i) => i + 2).find((d) => !isWet(weatherOf(d)))!
    let s: GameState = { ...s0, clock: { day: dry, minute: 10 * 60 }, npcs: {}, companion: cat, inv: { lightShoes: 1 }, player: { ...s0.player, ...HOME_FRONT, path } }
    let far = 0
    for (let i = 0; i < 200; i++) {
      s = tick(s, 0.05, zero, CONTENT).state
      far = Math.max(far, Math.abs(s.companion!.x - s.player.x) + Math.abs(s.companion!.y - s.player.y))
    }
    expect(s.player.path).toEqual([])
    // 걷는 사이에도 세 칸 넘게 벌어지지 않고, 멈추면 바로 옆에 와 있다
    expect(far).toBeLessThanOrEqual(3)
    expect(Math.abs(Math.round(s.companion!.x) - s.player.x) + Math.abs(Math.round(s.companion!.y) - s.player.y)).toBe(1)
    // 동물은 가장 빠른 기록자보다 빠르다
    expect(COMPANION_SPEED * 1.4).toBeGreaterThan(SPEED * 1.4)
  })
})

describe('가벼운 신: 튼튼한 신을 산 뒤, 양치기와 마음이 쌓이면 선물 (짧은 장면)', () => {
  const pts = (h: number) => h * 10
  const base = (inv: GameState['inv'], hearts: number): GameState => ({ ...rich(), inv, hearts: { shepherd: pts(hearts) }, talked: [] })
  it('양치기 마음이 모자라거나 튼튼한 신이 없으면 받지 않는다', () => {
    expect(LIGHT_SHOES).toEqual({ npc: 'shepherd', hearts: 5 })
    const noShoes = greetNeighbor(base({}, 8), 'shepherd')
    expect(noShoes.inv.lightShoes).toBeUndefined()
    const low = greetNeighbor(base({ sturdyShoes: 1 }, 3), 'shepherd')
    expect(heartsOf(low.hearts.shepherd)).toBeLessThan(5)
    expect(low.inv.lightShoes).toBeUndefined()
    // 다른 이웃에게 인사해도 받지 않는다
    const other = greetNeighbor({ ...base({ sturdyShoes: 1 }, 8), hearts: { shepherd: pts(8), weaver: pts(8) } }, 'weaver')
    expect(other.inv.lightShoes).toBeUndefined()
  })
  it('튼튼한 신이 있고 마음 5가 되면 인사할 때 받는다 — 한 번만', () => {
    const s = greetNeighbor(base({ sturdyShoes: 1 }, 4.9), 'shepherd')
    expect(heartsOf(s.hearts.shepherd)).toBe(5)
    expect(s.inv.lightShoes).toBe(1)
    expect(s.scenes).toContain('lightShoes')
    expect(s.giftsGot).toContain('lightShoes')
    const again = greetNeighbor({ ...s, talked: [], scenes: [] }, 'shepherd')
    expect(again.inv.lightShoes).toBe(1)
    expect(again.scenes).not.toContain('lightShoes')
  })
  it('마음이 이미 가득 찬 뒤에 신을 사도 다음 인사 때 받는다', () => {
    const s = greetNeighbor(base({ sturdyShoes: 1 }, 10), 'shepherd')
    expect(s.inv.lightShoes).toBe(1)
    expect(s.scenes).toEqual(['lightShoes'])
  })
  it('저장하고 불러와도 신과 가방이 남는다', () => {
    const s = greetNeighbor(base({ sturdyShoes: 1, leatherBag: 1 }, 6), 'shepherd')
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.inv).toMatchObject({ sturdyShoes: 1, lightShoes: 1, leatherBag: 1 })
    expect(walkMul(back.inv)).toBe(1.4)
    expect(stackCap(back.inv)).toBe(18)
  })
})

describe('문구와 그림', () => {
  it('이름·설명·거래 이름·장면·일지 한 줄·아이콘', () => {
    for (const id of ['leatherBag', 'sturdyShoes', 'lightShoes'] as const) {
      expect(ITEM_TEXT[id].name).toBeTruthy()
      expect(ITEM_TEXT[id].desc).toBeTruthy()
      expect(ICONS[id]).toHaveLength(8)
      for (const row of ICONS[id]) expect(row).toHaveLength(8)
    }
    for (const id of ['leatherBag', 'sturdyShoes']) expect((T.trades as Record<string, string>)[id]).toBeTruthy()
    expect(SCENES.lightShoes.lines.every((l) => ['shepherd', 'narration'].includes(l.speaker))).toBe(true)
    expect(JOURNAL_NOTES.lightShoes).toBeTruthy()
  })
})
