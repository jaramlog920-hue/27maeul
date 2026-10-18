// 생활 가구 68종·아기 돌보기 연결 (2026-10-12 도트)
import { legacyGame as newGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { itemName } from '../content/text'
import { ADDITION_FURNITURE, ADDITION_IDS, MARKET_ADDITION_IDS, additionsOnMarket, ADDITIONS_PER_MARKET } from './furniture-additions'
import { FURNITURE_DEFS } from './furniture-defs'
import { careBaby, settle, TRADES, trade, tradeOnMarket, useAddition, type GameState } from './game'
import { setPeopleData } from './people'
import { sizeOf } from './room'
import { ADDITION_ART, ADDITION_FURNITURE_DIRECTIONS } from '../render/addition-furniture-directions'
import { ADDITION_USE_ACTIONS, ADDITION_USE_INFO, OPENING_FURNITURE } from '../render/addition-furniture-motion'
import { FURNITURE_ART } from '../render/furniture-art'
import { facingArt } from '../render/furniture-facing'
import { ICONS } from '../render/sprites'

beforeEach(() => setPeopleData(PEOPLE))

const game = (): GameState => settle(newGame(CONTENT, { look: 'f', name: '하늘' } as never), CONTENT)

describe('생활 가구 68종', () => {
  it('도트 68종이 모두 아이템·크기·그림·아이콘·네 방향을 가진다', () => {
    expect(ADDITION_IDS.sort()).toEqual(Object.keys(ADDITION_ART).sort())
    for (const id of ADDITION_IDS) {
      const art = ADDITION_ART[id as keyof typeof ADDITION_ART]
      expect(FURNITURE_DEFS[id]?.w, id).toBe(art.w)
      expect(FURNITURE_ART[id], id).toBe(ADDITION_FURNITURE_DIRECTIONS[id].down)
      expect(ICONS[id], id).toBeDefined()
      expect(itemName(id), id).toBe(ADDITION_FURNITURE[id].name)
      for (const f of ['down', 'up', 'left', 'right'] as const) {
        expect(facingArt(id, f), `${id} ${f}`).toBe(ADDITION_FURNITURE_DIRECTIONS[id][f])
        // 옆을 보면 넓은 가구는 1×2 — 그림 크기와 차지하는 칸이 같다
        const s = sizeOf(id, f)
        expect([s.w, s.h], `${id} ${f}`).toEqual([facingArt(id, f)!.w, facingArt(id, f)!.h])
      }
    }
  })
  it('그린 사용 동작 11종·여닫기 8종은 그 가구에서 한다', () => {
    for (const a of ADDITION_USE_ACTIONS) expect(ADDITION_FURNITURE[ADDITION_USE_INFO[a].furniture as keyof typeof ADDITION_FURNITURE].use, a).toBe(a)
    for (const id of OPENING_FURNITURE) expect(ADDITION_FURNITURE[id].use, id).toBe('open')
  })
  it('장날마다 여덟 가지씩, 아홉 장날이면 68종을 다 본다', () => {
    const seen = new Set<string>()
    for (let w = 0; w < Math.ceil(MARKET_ADDITION_IDS.length / ADDITIONS_PER_MARKET); w++) {
      const today = additionsOnMarket(w * 7)
      expect(today.length).toBe(ADDITIONS_PER_MARKET)
      today.forEach((id) => seen.add(id))
    }
    expect(seen.size).toBe(MARKET_ADDITION_IDS.length)
  })
  it('그 장날에 나온 것만 닢으로 산다', () => {
    const s = { ...game(), coins: 500, clock: { ...game().clock, day: 7, minute: 600 } }
    const on = TRADES.find((t) => t.id === `add:${additionsOnMarket(7)[0]}`)!
    const off = TRADES.find((t) => t.id.startsWith('add:') && !tradeOnMarket(t, 7))!
    expect(trade(s, off)).toBeNull()
    const got = trade(s, on)!
    expect(got.coins).toBe(500 - on.coins!)
  })
  it('놓인 가구를 쓰면 그 가구의 동작을 한다', () => {
    const s = game()
    const chair = useAddition(s, { item: 'rockingChair', x: 3, y: 3, facing: 'right' })
    expect(chair.act).toMatchObject({ kind: 'use', use: 'rock', spot: { x: 3, y: 3, item: 'rockingChair', facing: 'right' } })
    const box = useAddition(s, { item: 'wardrobe', x: 3, y: 3 })
    expect(box.act).toMatchObject({ kind: 'reach', spot: { item: 'wardrobe', facing: 'down' } })
    expect(useAddition(s, { item: 'armchair', x: 3, y: 3 }).act?.kind).toBe('sit')
    expect(useAddition(s, { item: 'mapTable', x: 3, y: 3 }).act?.kind).toBe('read')
  })
})

describe('아기 돌보기', () => {
  function withBaby(): GameState {
    const s = game()
    const crib = s.room.find((f) => f.item === 'homeCradle') ?? { item: 'homeCradle' as const, x: 4, y: 4 }
    const room = s.room.some((f) => f.item === 'homeCradle') ? s.room : [...s.room, crib]
    return { ...s, room, child: { name: '봄', look: 'girl', born: s.clock.day, close: 0 } as GameState['child'], player: { ...s.player, x: crib.x + 1, y: crib.y, path: [] } }
  }
  it('요람 곁에서 돌보면 그 동작을 하고, 하루 처음이면 조금 가까워진다', () => {
    const s = withBaby()
    const a = careBaby(s, 'soothe')!
    expect(a.act).toMatchObject({ kind: 'baby', use: 'soothe', facing: 'left' })
    expect(a.child!.close).toBe(2)
    const b = careBaby({ ...a, act: undefined }, 'tuck')!
    expect(b.child!.close).toBe(2)
  })
  it('멀리서는 돌볼 수 없다', () => {
    const s = withBaby()
    expect(careBaby({ ...s, player: { ...s.player, x: s.player.x + 4 } }, 'hold')).toBeNull()
  })
})


it.each([
  ['down', { x: 20, y: 113 }, 'up'],
  ['up', { x: 20, y: 111 }, 'down'],
  ['left', { x: 19, y: 112 }, 'right'],
  ['right', { x: 22, y: 112 }, 'left'],
] as const)('가구 %s 방향과 실제 서 있는 위치를 구분해서 읽기·마시기·여닫기를 그린다', (facing, at, expected) => {
  const s = game()
  const user = { ...s, player: { ...s.player, ...at, facing: 'down' as const, path: [] } }
  for (const item of ['mapTable', 'lowTeaTable', 'wardrobe'] as const) {
    const f = { item, x: 20, y: 112, facing }
    const action = useAddition(user, f).act!
    expect(action.standing).toBe(true)
    expect(action.at).toBeUndefined()
    expect(action.spot).toMatchObject({ item, facing })
    expect(action.facing).toBe(expected)
  }
})
