import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import { ITEM_TEXT, SCENES, T } from '../content/text'
import { newChild, sanitizeChild } from './child'
import { canKidAct, cookBurns, doKidAct, familyTrip, KID_ACTS, KID_ACTS_PER_DAY, KID_MADE, type KidAct } from './family'
import { FURNITURE_DEFS } from './furniture-defs'
import { newGame, sendToSchool, type GameState } from './game'
import { freshStats, totalXp } from './stats'
import { ICONS } from '../render/sprites'

function kid(day = 60, age = 50, minute = 10 * 60, extra: Partial<GameState> = {}): GameState {
  const g = newGame(CONTENT)
  return { ...g, scenes: [], coins: 100, clock: { ...g.clock, day, minute }, child: { ...newChild(day - age, freshStats(), undefined), born: day - age }, ...extra }
}
const run = (s: GameState, act: KidAct) => doKidAct(s, act, CONTENT)!

describe('아이와 함께 보내는 시간 (계획 12)', () => {
  it('누르면 아이 능력치가 조금(배움터보다 느리게) 오르고 가까움이 쌓이며 시간이 흐른다 — 닢은 들지 않는다', () => {
    const s = kid()
    const r = run(s, 'read')
    expect(totalXp(r.state.child!.stats.wit)).toBeGreaterThan(totalXp(s.child!.stats.wit))
    expect(totalXp(r.state.child!.stats.wit) - totalXp(s.child!.stats.wit)).toBeLessThan(15)
    expect(r.state.child!.close).toBe(3)
    expect(r.state.clock.minute).toBeGreaterThan(s.clock.minute)
    expect(r.state.coins).toBe(s.coins)
    // 플레이어 능력치는 그대로 (신앙 수치 같은 것도 없다)
    expect(r.state.stats).toEqual(s.stats)
  })

  it('하루에 두 번까지 — 잠들기 전 이야기는 따로, 밤에만 한 번', () => {
    let s = kid()
    s = run(s, 'puzzle').state
    s = run(s, 'ball').state
    expect(canKidAct(s, 'read')).toBe('done')
    expect(KID_ACTS_PER_DAY).toBe(2)
    expect(canKidAct(s, 'story')).toBe('notYet')
    s = { ...s, clock: { ...s.clock, minute: 20 * 60 } }
    const t = run(s, 'story')
    expect(t.state.child!.close).toBeGreaterThan(s.child!.close!)
    expect(t.state.child!.stats).toEqual(s.child!.stats)
    expect(canKidAct(t.state, 'story')).toBe('storyDone')
    // 다음 날은 다시
    const next = { ...t.state, clock: { ...t.state.clock, day: t.state.clock.day + 1, minute: 9 * 60 } }
    expect(canKidAct(next, 'read')).toBeNull()
  })

  it('밖에서 하는 일은 저녁 일곱 시까지, 아기·어른·배움터에 간 아이와는 못 한다 (배움터와 같은 날도 돌아오면 된다)', () => {
    expect(canKidAct(kid(60, 50, 20 * 60), 'walk')).toBe('dark')
    expect(canKidAct(kid(60, 50, 20 * 60), 'read')).toBeNull()
    expect(canKidAct(kid(60, 3), 'read')).toBe('baby')
    expect(canKidAct(kid(60, 90), 'read')).toBe('grown')
    expect(canKidAct({ ...newGame(CONTENT), child: null }, 'read')).toBe('noChild')
    const school = sendToSchool(kid(), 'wit')!
    expect(canKidAct(school, 'read')).toBe('school')
    expect(canKidAct({ ...school, clock: { ...school.clock, minute: 18 * 60 + 10 } }, 'read')).toBeNull()
  })

  it('같이 만들기는 방에 놓는 장난감(번갈아), 요리는 빵 — 가끔 탄다, 산책은 작은 것을 줍는다', () => {
    let s = kid()
    const a = run(s, 'make')
    expect(a.state.inv[KID_MADE[0]]).toBe(1)
    for (const id of KID_MADE) {
      expect(FURNITURE_DEFS[id]).toBeTruthy()
      expect(ICONS[id]).toHaveLength(8)
      expect(ITEM_TEXT[id].name).toBeTruthy()
    }
    const b = run({ ...a.state, clock: { ...a.state.clock, day: 61 } }, 'make')
    expect(b.state.inv[KID_MADE[1]]).toBe(1)
    expect([1, 2, 3, 4, 5, 6].map(cookBurns)).toEqual([false, true, false, false, false, true])
    s = kid()
    const c1 = run(s, 'cook')
    expect(c1.burnt).toBe(false)
    expect(c1.state.inv.bread).toBe((s.inv.bread ?? 0) + 1)
    const c2 = run(c1.state, 'cook')
    expect(c2.burnt).toBe(true)
    expect(c2.state.inv.bread).toBe(c1.state.inv.bread)
    expect(c2.state.scenes).toContain('fam:burnt')
    const w = run(kid(), 'walk')
    expect(Object.values(w.got).reduce<number>((x, y) => x + (y ?? 0), 0)).toBe(1)
  })

  it('처음 있는 일은 가족 앨범 장면 한 번 (두 번째는 없다)', () => {
    const r = run(kid(), 'read')
    expect(r.state.scenes).toEqual(['fam:read'])
    const again = run({ ...r.state, scenes: [] }, 'read')
    expect(again.state.scenes).toEqual([])
    expect(run(kid(1, 0, 10 * 60, {}), 'read')).toBeNull()
    for (const id of ['fam:read', 'fam:make', 'fam:burnt', 'fam:walk', 'fam:picnic', 'fam:market', 'fam:story', 'fam:trip']) expect(SCENES[id]?.album, id).toBeTruthy()
  })

  it('심부름은 이웃 마음이 조금, 마을 구경은 이웃이 아이에게 말을 건다', () => {
    const e = run(kid(), 'errand')
    expect(e.who).toBeTruthy()
    expect(e.state.hearts[e.who!] ?? 0).toBeGreaterThan(0)
    expect(run(kid(), 'tour').who).toBeTruthy()
  })

  it('아이를 데리고 다녀온 여행: 가까움, 처음이면 가족 앨범', () => {
    const t = familyTrip(kid())
    expect(t.child!.close).toBeGreaterThan(0)
    expect(t.scenes).toEqual(['fam:trip'])
    expect(familyTrip({ ...t, scenes: [] }).scenes).toEqual([])
  })

  it('옛 저장: 가까움이 없던 아이는 0, 저장한 가까움은 그대로', () => {
    const c = newChild(10, freshStats(), undefined)
    expect(sanitizeChild(c)!.close).toBeUndefined()
    expect(sanitizeChild({ ...c, close: 42 })!.close).toBe(42)
    expect(sanitizeChild({ ...c, close: 999 })!.close).toBe(100)
  })

  it('문구: 활동마다 이름·짧은 장면 셋, 금지어 없음', () => {
    const acts = T.family.time.acts as Record<string, { label: string; lines: string[]; burnt?: string; alone?: string }>
    for (const a of KID_ACTS) {
      expect(acts[a].label).toBeTruthy()
      expect(acts[a].lines).toHaveLength(3)
    }
    const all: string[] = []
    const walk = (o: unknown) => {
      if (typeof o === 'string') all.push(o)
      else if (o && typeof o === 'object') Object.values(o).forEach(walk)
    }
    walk(T.family)
    for (const id of Object.keys(SCENES).filter((k) => k.startsWith('fam:'))) walk(SCENES[id])
    for (const t of all) expect(forbiddenIn(t), t).toBeNull()
  })
})
