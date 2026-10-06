// 계획 16 작업 25: 직접 요리하고 함께 먹는 생활 — 만들기(재료 한 번)·중단·가방 가득·먹기·식탁·함께 먹은 기억·배우기·행사·좌판·옛 저장
import { CONTENT } from '../content/catalog'
import { ITEM_TEXT, T } from '../content/text'
import { newGame, syncHome, type GameState } from './game'
import {
  canCook, canLearnDish, canServe, canSit, chooseLook, clearTable, cookHand, cookOf, DISHES, deliverCook, dinersNear, dishTaughtBy, eatDish, kidCanChoose, knownDish,
  learnDish, mealReaction, missingFor, NEW_DISHES, nextCookStep, readyBlock, sanitizeCooking, serveMax, serveTable, setBreadShape, settleTable, sitTable, startCook, UNEVEN_CHANCE,
} from './cooking'
import { FEST_SNACKS, festReactions, type Fest } from './fest'
import { COOKED_ITEMS, count, DISH_HUNGER, FOODS, MAX_STACK } from './items'
import { moodOf } from './mood'
import { finishNow } from './minigame'
import { newChild } from './child'
import { placement, type Furniture } from './room'
import { deserialize, serialize } from './save'
import { setSpace } from './space-life'
import { STALL_GOODS, stallPrice } from './stall'
import { EXPERIENCE_KINDS } from './people'
import type { ItemId } from './types'

const rng = () => 0.5
type Facing = 'up' | 'down' | 'left' | 'right'
function furnish(s: GameState, pieces: [ItemId, number, number, Facing?][]): GameState {
  syncHome(s)
  let room: Furniture[] = [...s.room]
  for (const [item, x, y, facing] of pieces) {
    const f = placement(room, item, { x, y }, facing)
    expect(f, `${item} ${x},${y}`).not.toBeNull()
    room = [...room, f!]
    syncHome({ ...s, room })
  }
  return { ...s, room }
}
function base(inv: Partial<Record<ItemId, number>> = {}): GameState {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], clock: { day: 3, minute: 15 * 60 }, inv: { ...inv }, needs: { ...s.needs, hunger: 80, fatigue: 0 } }
}
/** 마지막 손 동작까지 끝내고 담는 모습을 고를 수 있는 상태로 */
function toFinish(s: GameState, dish: (typeof NEW_DISHES)[number]): GameState {
  let g = startCook(s, dish, rng)
  for (let i = 0; i < DISHES[dish].hands.length; i++) {
    const r = cookOf(g).run!
    g = { ...g, cooking: { ...cookOf(g), run: { ...r, mini: finishNow(r.mini!) } } }
    g = nextCookStep(g, rng)
  }
  expect(cookOf(g).run!.phase).toBe('finish')
  return g
}

describe('요리 목록과 처음부터 아는 요리', () => {
  it('빵·콩 요리·무화과 접시는 처음부터 알고, 나머지는 이웃에게 함께 배운다', () => {
    const s = base()
    for (const d of ['bread', 'beanDish', 'figPlate'] as const) expect(knownDish(s, d)).toBe(true)
    for (const d of ['herbBeanDish', 'honeyBread', 'herbTea'] as const) expect(knownDish(s, d)).toBe(false)
    expect(dishTaughtBy('baker')).toBe('honeyBread')
    expect(dishTaughtBy('wendell')).toBe('honeyBread')
    expect(dishTaughtBy('basil')).toBe('herbTea')
    expect(dishTaughtBy('smith')).toBeUndefined()
  })
  it('빵은 기존 제작법 그대로 (보리 1 + 물 1 → 빵 2)', () => {
    expect(DISHES.bread.needs).toEqual({ barley: 1, water: 1 })
    expect(DISHES.bread.qty).toBe(2)
    expect(DISHES.bread.minutes).toBe(30)
  })
  it('모든 요리 음식에 이름·설명이 있고 말씀과 무관하며, 허브 차는 포만이 없다', () => {
    for (const i of COOKED_ITEMS) {
      expect(ITEM_TEXT[i].name).toBeTruthy()
      expect(ITEM_TEXT[i].desc).toBeTruthy()
      expect(ITEM_TEXT[i].name + ITEM_TEXT[i].desc).not.toMatch(/말씀|조각|필사|성경|두루마리/)
    }
    expect(DISH_HUNGER.herbTea).toBe(0)
    expect(FOODS.map(([i]) => i)).not.toContain('herbTea')
    for (const [i, n] of FOODS) if (COOKED_ITEMS.includes(i)) expect(n).toBeLessThanOrEqual(55)
  })
  it('손 동작은 계속 누르기(hold)를 쓰지 않고 한두 개뿐', () => {
    for (const d of NEW_DISHES) {
      expect(DISHES[d].hands.length).toBeGreaterThanOrEqual(1)
      expect(DISHES[d].hands.length).toBeLessThanOrEqual(2)
      expect(DISHES[d].hands).not.toContain('hold')
    }
  })
})

describe('만들기 — 재료는 시작할 때 한 번', () => {
  it('재료가 모자라면 시작할 수 없고 모자란 것을 알려 준다', () => {
    const s = base({ bean: 1 })
    expect(canCook(s, 'beanDish')).toBe('needs')
    expect(missingFor(s, 'beanDish')).toEqual([{ item: 'water', need: 1, have: 0 }])
    expect(startCook(s, 'beanDish', rng)).toBe(s)
  })
  it('배우지 않은 요리는 시작하지 못한다', () => {
    const s = base({ bean: 1, water: 1, herb: 1 })
    expect(canCook(s, 'herbBeanDish')).toBe('unknown')
    expect(startCook(s, 'herbBeanDish', rng)).toBe(s)
  })
  it('시작하면 재료가 한 번 빠지고, 같은 요리를 겹쳐 시작하지 못한다', () => {
    const s = startCook(base({ bean: 2, water: 2 }), 'beanDish', rng)
    expect(count(s.inv, 'bean')).toBe(1)
    expect(count(s.inv, 'water')).toBe(1)
    expect(cookOf(s).run).toMatchObject({ dish: 'beanDish', phase: 'hand', hand: 0 })
    expect(canCook(s, 'figPlate')).toBe('busy')
    expect(startCook(s, 'beanDish', rng)).toBe(s)
    expect(count(startCook(s, 'beanDish', rng).inv, 'bean')).toBe(1)
  })
  it('끝나지 않은 손 동작은 건너뛰지 못한다', () => {
    const s = startCook(base({ fig: 1 }), 'figPlate', rng)
    expect(nextCookStep(s, rng)).toBe(s)
    expect(chooseLook(s, 0)).toBe(s)
  })
  it('가방이 가득 차면 시작하지 않는다 (결과가 버려지지 않게)', () => {
    const s = base({ fig: 1, figPlate: MAX_STACK })
    expect(canCook(s, 'figPlate')).toBe('full')
  })
  it('지쳤으면 쉬고 만들게 한다', () => {
    const s = { ...base({ fig: 1 }), needs: { ...base().needs, fatigue: 100 } }
    expect(canCook(s, 'figPlate')).toBe('tired')
  })
  it('끝까지 만들면 음식이 한 번 생기고 시간이 흐르며 재료는 다시 빠지지 않는다', () => {
    const s0 = base({ bean: 1, water: 1 })
    let g = toFinish(s0, 'beanDish')
    expect(count(g.inv, 'bean')).toBe(0)
    g = chooseLook(g, 1)
    expect(cookOf(g).run).toBeUndefined()
    expect(count(g.inv, 'beanDish')).toBe(1)
    expect(count(g.inv, 'bean')).toBe(0)
    expect(g.clock.minute).toBeGreaterThanOrEqual(s0.clock.minute + DISHES.beanDish.minutes)
    expect(cookOf(g).looks.beanDish).toBe(1)
    expect(cookOf(g).made.beanDish).toBe(1)
    expect(g.flags['cook:first:beanDish']).toBe(3)
    // 한 번 더 받을 수 없다
    expect(deliverCook(g)).toBe(g)
  })
  it('모양이 달라질 수 있어도 분량은 같고 재료를 잃지 않는다', () => {
    const draws: boolean[] = []
    for (let day = 1; day < 40; day++) {
      const g = startCook({ ...base({ fig: 1 }), clock: { day, minute: 15 * 60 } }, 'figPlate', rng)
      draws.push(cookOf(g).run!.uneven)
    }
    expect(draws.some(Boolean)).toBe(true)
    expect(draws.some((d) => !d)).toBe(true)
    expect(UNEVEN_CHANCE).toBeLessThan(0.3)
    const odd = [...Array(40).keys()].map((d) => d + 1).find((d) => cookOf(startCook({ ...base({ fig: 1 }), clock: { day: d, minute: 15 * 60 } }, 'figPlate', rng)).run!.uneven)!
    const done = chooseLook(toFinish({ ...base({ fig: 1 }), clock: { day: odd, minute: 15 * 60 } }, 'figPlate'), 0)
    expect(count(done.inv, 'figPlate')).toBe(1)
  })
  it('가방이 중간에 가득 차도 완성품은 사라지지 않고 비우면 받는다', () => {
    let g = toFinish(base({ fig: 1 }), 'figPlate')
    g = { ...g, inv: { ...g.inv, figPlate: MAX_STACK } }
    const waited = chooseLook(g, 0)
    expect(cookOf(waited).run).toMatchObject({ phase: 'ready' })
    expect(readyBlock(waited)).toBe('full')
    expect(count(waited.inv, 'figPlate')).toBe(MAX_STACK)
    expect(deliverCook(waited)).toBe(waited)
    const room = { ...waited, inv: { ...waited.inv, figPlate: 2 } }
    const got = deliverCook(room)
    expect(cookOf(got).run).toBeUndefined()
    expect(count(got.inv, 'figPlate')).toBe(3)
  })
  it('중단: 저장하고 다시 불러와도 하던 요리가 그대로 이어지고 재료는 한 번만 빠져 있다', () => {
    const g = startCook(base({ bean: 1, water: 1 }), 'beanDish', rng)
    const back = deserialize(serialize(g), CONTENT)!
    expect(cookOf(back).run).toMatchObject({ dish: 'beanDish', phase: 'hand', hand: 0 })
    expect(cookOf(back).run!.mini).toBeTruthy()
    expect(count(back.inv, 'bean')).toBe(0)
    expect(count(back.inv, 'water')).toBe(0)
    const fin = toFinish(back, 'beanDish')
    const saved = deserialize(serialize(fin), CONTENT)!
    expect(cookOf(saved).run!.phase).toBe('finish')
    expect(count(chooseLook(saved, 0).inv, 'beanDish')).toBe(1)
  })
  it('빵 모양은 그림만 고르고 기존 빵 수량은 그대로', () => {
    const s = setBreadShape(base(), 1)
    expect(cookOf(s).breadShape).toBe(1)
    expect(setBreadShape(s, 5)).toBe(s)
    expect(count(s.inv, 'bread')).toBe(count(base().inv, 'bread'))
  })
  it('손 동작 입력은 이 요리가 아닐 때 아무것도 바꾸지 않는다', () => {
    const s = base()
    expect(cookHand(s, 'tap', 0, rng)).toBe(s)
  })
})

describe('먹기', () => {
  it('혼자 먹으면 한 접시가 빠지고 배고픔이 덜어지며 그날 기분이 조금 오른다', () => {
    const s = base({ honeyBread: 1 })
    const m0 = moodOf(s)
    const e = eatDish(s, 'honeyBread')
    expect(count(e.inv, 'honeyBread')).toBe(0)
    expect(e.needs.hunger).toBeLessThan(s.needs.hunger)
    expect(moodOf(e)).toBeGreaterThan(m0)
    expect(moodOf(e) - moodOf({ ...e, flags: s.flags })).toBeLessThanOrEqual(5)
    expect(eatDish(e, 'honeyBread')).toBe(e)
  })
  it('허브 차는 배고픔을 줄이지 않고 약효도 없다', () => {
    const s = base({ herbTea: 1 })
    const e = eatDish(s, 'herbTea')
    expect(e.needs.hunger).toBeGreaterThanOrEqual(s.needs.hunger)
    expect(e.needs.cold).toBeLessThanOrEqual(s.needs.cold + 5)
    expect(count(e.inv, 'herbTea')).toBe(0)
  })
  it('요리가 아닌 물건은 이 길로 먹지 않는다', () => {
    const s = base({ honey: 1 })
    expect(eatDish(s, 'honey')).toBe(s)
  })
})

function withTea(inv: Partial<Record<ItemId, number>> = {}): GameState {
  const s = furnish(base(inv), [['table', 19, 112], ['chair', 19, 113, 'up'], ['chair', 20, 113, 'up']])
  const next = setSpace(s, s.room.find(f => f.item === 'table')!, 'tea')
  expect(next).not.toBeNull()
  return next!
}
const guest = (s: GameState, id: string, x = 21, y = 112): GameState => {
  const n = s.npcs[id]
  return { ...s, npcs: { ...s.npcs, [id]: { ...n, visible: true, x, y, path: [] } } }
}

describe('식탁 — 차리기·먹기·치우기', () => {
  it('식탁 자리(차 자리)가 없으면 차릴 수 없지만 혼자 먹기는 된다', () => {
    const s = base({ honeyBread: 2 })
    expect(canServe(s)).toBe('noSpace')
    expect(count(eatDish(s, 'honeyBread').inv, 'honeyBread')).toBe(1)
  })
  it('차리면 가방에서 식탁으로 한 번 옮겨지고 두 번 차리지 못한다', () => {
    const s = withTea({ honeyBread: 3 })
    expect(canServe(s)).toBeNull()
    expect(serveMax(s, 'honeyBread')).toBe(2)
    const t = serveTable(s, 'honeyBread', 2)
    expect(count(t.inv, 'honeyBread')).toBe(1)
    expect(cookOf(t).table).toMatchObject({ item: 'honeyBread', left: 2, id: 'table:1' })
    expect(canServe(t)).toBe('busy')
    expect(serveTable(t, 'honeyBread', 1)).toBe(t)
    expect(serveTable(s, 'honeyBread', 3)).toBe(s)
    expect(serveTable(s, 'beanDish', 1)).toBe(s)
  })
  it('혼자 앉아 먹으면 접시 하나만 쓰고 함께 먹은 기억은 만들지 않는다', () => {
    const t = serveTable(withTea({ figPlate: 2 }), 'figPlate', 2)
    const r = sitTable(t, [])!
    expect(cookOf(r.state).table!.left).toBe(1)
    expect(r.state.flags.mealDay).toBe(3)
    expect(r.state.flags.sharedMealDay).toBeUndefined()
    expect(Object.keys(r.state.life.experiences ?? {}).filter((k) => k.startsWith('meal:'))).toEqual([])
    const done = sitTable(r.state, [])!
    expect(cookOf(done.state).table).toBeUndefined()
  })
  it('식탁 곁에 실제로 있는 이웃만 초대할 수 있고, 함께 먹은 기억은 앉은 사람에게만 남는다', () => {
    let s = withTea({ honeyBread: 3 })
    s = guest(s, 'poppy')
    const t = serveTable(s, 'honeyBread', 2)
    expect(dinersNear(t).map((d) => d.id)).toEqual(['poppy'])
    expect(canSit(t, ['baker'])).toBe('who')
    expect(canSit(t, ['poppy'])).toBeNull()
    const r = sitTable(t, ['poppy'])!
    expect(cookOf(r.state).table).toBeUndefined()
    expect(count(r.state.inv, 'honeyBread')).toBe(1)
    const exp = r.state.life.experiences['meal:1']
    expect(exp).toMatchObject({ kind: 'meal', with: ['poppy'], item: 'honeyBread' })
    expect(r.state.flags.sharedMealDay).toBe(3)
    expect(moodOf(r.state)).toBeGreaterThan(moodOf(base()))
    expect(r.reactions).toHaveLength(1)
    // 자리에 없던 이웃은 기억에 없다
    expect(JSON.stringify(r.state.life.memories.baker ?? [])).not.toContain('meal:1')
    expect(JSON.stringify(r.state.life.memories.poppy)).toContain('exp:meal:1')
  })
  it('접시가 사람 수보다 적으면 앉지 못하고, 같은 사람을 두 번 부를 수 없다', () => {
    let s = withTea({ honeyBread: 1 })
    s = guest(s, 'poppy')
    const t = serveTable(s, 'honeyBread', 1)
    expect(canSit(t, ['poppy'])).toBe('few')
    expect(canSit(t, ['poppy', 'poppy'])).not.toBeNull()
  })
  it('다른 약속이 진행 중인 이웃과는 식사를 시작하지 않는다', () => {
    let s = withTea({ honeyBread: 2 })
    s = guest(s, 'poppy')
    s = { ...s, plans: { ...s.plans, appts: [{ id: 'a1', kind: 'club', day: 3, from: 14 * 60, to: 17 * 60, place: 'hallTable', members: ['poppy'], startedWith: ['poppy'], state: 'running', rewarded: false, remembered: false }] } }
    const t = serveTable(s, 'honeyBread', 2)
    expect(dinersNear(t)).toEqual([{ id: 'poppy', block: 'busy' }])
    expect(canSit(t, ['poppy'])).toBe('who')
  })
  it('배우자와 함께 앉으면 오늘의 가족 저녁으로 쳐서 저녁 장면이 겹치지 않고, 이미 가족 저녁을 먹은 날은 새 식사를 만들지 않는다', () => {
    let s = withTea({ beanDish: 3 })
    s = { ...s, romance: { ...s.romance, partner: 'poppy', stage: 'married', marriedDay: 1 }, clock: { day: 3, minute: 19 * 60 + 30 } }
    s = guest(s, 'poppy')
    const t = serveTable(s, 'beanDish', 2)
    const r = sitTable(t, ['poppy'])!
    expect(r.state.flags.supperDay).toBe(3)
    expect(r.firstFamily).toBe(true)
    expect(r.state.scenes).toContain('fam:meal')
    expect(r.state.flags.suppers ?? 0).toBe(0)
    // 이미 가족 저녁을 먹은 날
    const ate = { ...t, flags: { ...t.flags, supperDay: 3 } }
    expect(dinersNear(ate)).toEqual([{ id: 'poppy', block: 'supperDone' }])
    expect(canSit(ate, ['poppy'])).toBe('who')
    expect(canSit(ate, [])).toBeNull()
  })
  it('아이가 식탁 곁에 있으면 함께 앉을 수 있고 가족 앨범 장면은 처음 한 번만', () => {
    let s = withTea({ beanDish: 4 })
    s = { ...s, child: { ...newChild(3, s.stats, undefined), born: -17 }, clock: { day: 3, minute: 19 * 60 + 30 } }
    const t = serveTable(s, 'beanDish', 2)
    const ids = dinersNear(t).map((d) => d.id)
    expect(ids).toContain('family:child')
    const r = sitTable(t, ['family:child'])!
    expect(r.state.scenes.filter((x) => x === 'fam:meal')).toHaveLength(1)
    expect(r.state.life.experiences['fam:meal'].with).toEqual(['family:child'])
    const second = serveTable({ ...r.state, scenes: [], clock: { ...r.state.clock, day: 4 } }, 'beanDish', 2)
    const again = sitTable(second, ['family:child'])
    if (again) expect(again.state.scenes).not.toContain('fam:meal')
  })
  it('치우면 남은 접시가 한 번 가방으로 돌아오고 가방이 차도 잃지 않는다', () => {
    const t = serveTable(withTea({ figPlate: 2 }), 'figPlate', 2)
    const full = { ...t, inv: { ...t.inv, figPlate: MAX_STACK } }
    const c = clearTable(full)
    expect(cookOf(c).table).toBeUndefined()
    expect(count(c.inv, 'figPlate')).toBe(MAX_STACK + 2)
    expect(clearTable(c)).toBe(c)
  })
  it('날짜가 바뀌거나 가구가 치워지면 남은 음식이 한 번만 돌아온다', () => {
    const t = serveTable(withTea({ figPlate: 2 }), 'figPlate', 2)
    expect(settleTable(t)).toBe(t)
    const next = settleTable({ ...t, clock: { ...t.clock, day: 4 } })
    expect(cookOf(next).table).toBeUndefined()
    expect(count(next.inv, 'figPlate')).toBe(2)
    expect(settleTable(next)).toBe(next)
    const moved = settleTable({ ...t, room: t.room.filter((f) => f.item !== 'table') })
    expect(cookOf(moved).table).toBeUndefined()
    expect(count(moved.inv, 'figPlate')).toBe(2)
  })
  it('저장: 식탁에 차린 음식이 재접속에도 두 번 생기지 않는다', () => {
    const t = serveTable(withTea({ figPlate: 2 }), 'figPlate', 2)
    const back = deserialize(serialize(t), CONTENT)!
    expect(cookOf(back).table).toMatchObject({ item: 'figPlate', left: 2 })
    expect(count(back.inv, 'figPlate')).toBe(0)
  })
})

describe('주민 취향 반응', () => {
  it('캐릭터의 생활 취향(차·맛보기)에서 읽고 선물 취향을 복사하지 않으며 싫어한다고 관계가 떨어지지 않는다', () => {
    expect(mealReaction('poppy', 'herbTea').kind).toBe('like')
    expect(mealReaction('wendell', 'honeyBread').kind).toBe('like')
    expect(mealReaction('dexter', 'honeyBread').kind).toBe('new')
    const s = withTea({ honeyBread: 2 })
    const t = serveTable(guest(s, 'dexter'), 'honeyBread', 2)
    const r = sitTable(t, ['dexter'])!
    expect(r.state.hearts.dexter ?? 0).toBe(s.hearts.dexter ?? 0)
  })
})

describe('이웃과 함께 배우기', () => {
  function near(npc: string): GameState {
    let s = base()
    s = { ...s, flags: { ...s.flags, villageLevel: 10 } }
    const n = s.npcs[npc]
    s = { ...s, npcs: { ...s.npcs, [npc]: { ...n, visible: true, x: s.player.x + 1, y: s.player.y, path: [] } } }
    return s
  }
  it('함께한 일이 없으면 배울 수 없다', () => {
    expect(canLearnDish(near('baker'), 'baker', CONTENT)).toBe('unknown')
  })
  it('함께한 일이 있고 곁에 있으면 한 번 배우고, 되풀이해도 중복되지 않는다', () => {
    let s = near('baker')
    s = { ...s, life: { ...s.life, experiences: { 'work:baker': { id: 'work:baker', kind: 'work', with: ['baker'], first: 1, last: 1, count: 1 } } } }
    const block = canLearnDish(s, 'baker', CONTENT)
    if (block !== null) { expect(['away', 'busy', 'late']).toContain(block); return }
    const l = learnDish(s, 'baker', CONTENT)
    expect(knownDish(l, 'honeyBread')).toBe(true)
    expect(cookOf(l).learned.honeyBread).toMatchObject({ from: 'baker' })
    expect(l.life.experiences['learn:cook:honeyBread']).toMatchObject({ kind: 'learn', with: ['baker'] })
    expect(canLearnDish(l, 'baker', CONTENT)).toBe('known')
    expect(learnDish(l, 'baker', CONTENT)).toBe(l)
    expect(l.inv).toEqual(s.inv)
  })
  it('가르치지 않는 이웃에게는 배울 수 없다', () => {
    expect(canLearnDish(near('smith'), 'smith', CONTENT)).toBe('none')
  })
})

describe('행사·좌판 연결', () => {
  it('직접 만든 음식을 행사 간식으로 낼 수 있다', () => {
    for (const i of COOKED_ITEMS) expect(FEST_SNACKS).toContain(i)
    const s = furnish(base({ honeyBread: 1, herbTea: 1 }), [['table', 19, 112], ['chair', 19, 113, 'up']])
    expect(FEST_SNACKS).toContain('honeyBread')
    expect(count(s.inv, 'honeyBread')).toBe(1)
  })
  it('좌판 상품이 되고 값은 작은 범위에서 상인 표보다 눈에 띄게 늘지 않는다', () => {
    const s = base()
    for (const i of COOKED_ITEMS) {
      expect(STALL_GOODS).toContain(i)
      expect(stallPrice(s, i, 'normal')).toBeLessThanOrEqual(12)
    }
    expect(stallPrice(s, 'beanDish', 'normal')).toBeGreaterThan(3)
  })
  it('경험 종류에 함께 먹은 식사가 있고 이름이 있다', () => {
    expect(EXPERIENCE_KINDS).toContain('meal')
    expect((T.taste.kinds as Record<string, string>).meal).toBeTruthy()
  })
})

describe('옛 저장', () => {
  it('요리 칸이 없는 옛 저장은 처음부터 아는 요리로 열린다', () => {
    const s = base()
    const raw = JSON.parse(serialize(s))
    delete raw.cooking
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(knownDish(back, 'beanDish')).toBe(true)
    expect(knownDish(back, 'honeyBread')).toBe(false)
    expect(cookOf(back).run).toBeUndefined()
  })
  it('망가진 값은 버리고 가르쳐 준 적 없는 이웃의 배움은 받지 않는다', () => {
    const c = sanitizeCooking({ learned: { honeyBread: { day: 2, from: 'smith' }, herbTea: { day: 4, from: 'basil' } }, looks: { beanDish: 7 }, made: { beanDish: -1 }, table: { id: 'bad', item: 'ink', left: 9 }, run: { dish: 'bread' }, meals: 'x' })!
    expect(c.learned).toEqual({ herbTea: { day: 4, from: 'basil' } })
    expect(c.looks).toEqual({})
    expect(c.made).toEqual({})
    expect(c.table).toBeUndefined()
    expect(c.run).toBeUndefined()
    expect(c.meals).toBe(0)
    expect(sanitizeCooking(null)).toBeUndefined()
  })
  it('배우지 않은 요리를 하던 중이라는 저장은 이어받지 않는다', () => {
    const c = sanitizeCooking({ run: { dish: 'herbTea', day: 3, phase: 'hand', hand: 0, look: 0, kid: -1, uneven: false } })!
    expect(c.run).toBeUndefined()
  })
})

describe('아이는 요리 조작 없이 접시만 고른다', () => {
  it('아기 단계 아이나 아이가 없으면 접시를 고르지 못한다', () => {
    let s = base()
    s = { ...s, child: { ...newChild(3, s.stats, undefined), born: 3 } }
    expect(kidCanChoose(s)).toBe(false)
    expect(kidCanChoose(base())).toBe(false)
  })
  it('걷는 아이가 집에 있으면 접시를 골라 주고 가족 기억은 아이만, 앨범 장면은 처음 한 번', () => {
    let s = base({ fig: 2 })
    s = { ...s, child: { ...newChild(3, s.stats, undefined), born: -17 } }
    expect(kidCanChoose(s)).toBe(true)
    const done = chooseLook(toFinish(s, 'figPlate'), 1, true)
    expect(done.life.experiences['fam:cook']).toMatchObject({ kind: 'family', with: ['family:child'], choice: 1 })
    expect(done.scenes.filter((x) => x === 'fam:cook')).toHaveLength(1)
    const again = chooseLook(toFinish({ ...done, scenes: [] }, 'figPlate'), 0, true)
    expect(again.scenes).not.toContain('fam:cook')
    expect(count(again.inv, 'figPlate')).toBe(2)
    // 아이가 고르지 않았으면 기억도 없다
    expect(chooseLook(toFinish(s, 'figPlate'), 0, false).life.experiences['fam:cook']).toBeUndefined()
  })
})

describe('행사 반응', () => {
  it('직접 만든 음식을 낸 차 모임에서 주민 취향은 생활 취향에서 읽는다', () => {
    const f: Fest = { id: 'fest:1', kind: 'tea', day: 3, place: 'hallTable', members: ['poppy', 'dexter'], reserve: {}, step: 'talk', picked: 'honeyBread', snack: 'honeyBread', joined: true, consumed: true, closed: false, cancelled: false }
    const r = festReactions(base(), f)
    expect(r.find((x) => x.npc === 'poppy')!.kind).toBe('dish')
    expect(r.find((x) => x.npc === 'poppy')!.text).toContain('꿀 곁들인 빵')
    expect(r.find((x) => x.npc === 'dexter')!.kind).not.toBe('dish')
  })
})
