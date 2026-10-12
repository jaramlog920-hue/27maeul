import { CONTENT } from '../content/catalog'
import { newGame, goToSleep, canCraft, finishCraft, settle } from './game'
import { BAKER_BABY_ID, generatedCount, newGenState } from './gen'
import { settleGen } from './gen-settle'
import { familyTreeLayout } from './family-tree'
import { deserialize, serialize } from './save'
import { companionsOf } from './gen-looks'
import { bakerCribWaiting, makeBakerCrib } from './baker-baby'
import { bakerInfantAtHome, householdBabies, householdCradles } from '../render/village-followup-scene'
import { householdCradleFrame } from '../render/village-followup-art'
import { ROOMS } from './world'

describe('헤이즐의 고정 이야기 아기', () => {
  it.each([[21, 'baby'], [22, 'child'], [49, 'child'], [50, 'teen'], [91, 'teen'], [92, 'adult'], [252, 'elder']] as const)('%i일째에는 %s 단계이고 헤이즐의 같은 자녀다', (day, stage) => {
    const base = newGame(CONTENT)
    const gen = { ...newGenState(CONTENT, 1, 8), on: false }
    const after = settleGen({ ...base, gen, clock: { day, minute: 600 } }, CONTENT)
    expect(after.gen!.persons[BAKER_BABY_ID]).toMatchObject({ id: BAKER_BABY_ID, stage, born: 8, parents: ['baker'], origin: 'fixed' })
    expect(generatedCount(after.gen!)).toBe(0)
    const followers = companionsOf(after.gen, 'baker', day)
    expect(followers.filter(c => c.person.id === BAKER_BABY_ID)).toHaveLength(stage === 'baby' ? 0 : 1)
    expect(companionsOf(after.gen, 'wendell', day).some(c => c.person.id === BAKER_BABY_ID)).toBe(false)
    expect(companionsOf(undefined, 'baker', day)).toEqual(followers)
    expect(deserialize(serialize(after), CONTENT)!.gen?.persons[BAKER_BABY_ID].stage).toBe(stage)
  })

  it('정상 하루 정산에서 성장 소식은 한 번만 기록하고 임의 부모 은퇴는 만들지 않는다', () => {
    const base = newGame(CONTENT)
    const s = { ...base, gen: newGenState(CONTENT, 1, 21), clock: { day: 22, minute: 600 } }
    const after = settleGen(s, CONTENT)
    expect(after.gen!.log.filter(l => l.kind === 'grew:child' && l.who.includes(BAKER_BABY_ID))).toHaveLength(1)
    expect(settleGen(after, CONTENT).gen?.log).toEqual(after.gen!.log)
    expect(after.gen?.retired?.baker).toBeUndefined()
  })

  it('오래된 저장의 밀린 정산이 7일을 넘겨도 아기의 나이는 오늘 날짜에 맞춘다', () => {
    const base = newGame(CONTENT)
    const after = settleGen({ ...base, gen: newGenState(CONTENT, 1, 8), clock: { day: 100, minute: 600 } }, CONTENT)
    expect(after.gen?.persons[BAKER_BABY_ID].stage).toBe('adult')
  })

  it('7일째에는 없고 8일째 출생 장면과 함께 헤이즐의 자녀·파피의 동생이 된다', () => {
    const base = newGame(CONTENT)
    const before = { ...base, scenes: [], clock: { day: 7, minute: 22 * 60 }, gen: newGenState(CONTENT, 1, 7) }
    expect(before.gen.persons[BAKER_BABY_ID]).toBeUndefined()
    const after = goToSleep(before, CONTENT)
    expect(after.scenes).toContain('babyBorn')
    expect(after.gen?.persons[BAKER_BABY_ID]).toMatchObject({ born: 8, stage: 'baby', parents: ['baker'] })
    const g = after.gen!
    expect(familyTreeLayout(g, 'baker').nodes).toContainEqual(expect.objectContaining({ id: BAKER_BABY_ID, relation: 'child' }))
    expect(familyTreeLayout(g, 'wendell').nodes).toContainEqual(expect.objectContaining({ id: BAKER_BABY_ID, relation: 'sibling' }))
    expect(g.persons.wendell).toMatchObject({ born: null, stage: 'adult', parents: ['baker'] })
    expect(generatedCount(g)).toBe(0)
  })

  it('8일 이후의 옛 저장을 불러올 때 복원하고 반복 불러오기에도 한 명만 남는다', () => {
    const base = newGame(CONTENT)
    const legacy = { ...base, clock: { day: 30, minute: 600 }, gen: newGenState(CONTENT, 1, 7) }
    const back = deserialize(serialize(legacy), CONTENT)!
    expect(back.gen?.persons[BAKER_BABY_ID]).toMatchObject({ born: 8, stage: 'child', parents: ['baker'] })
    expect(deserialize(serialize(back), CONTENT)?.gen).toEqual(back.gen)
  })

  it('오늘 정산이 끝났거나 자율 가족 진행이 꺼져 있어도 고정 아기의 계보를 보완한다', () => {
    const base = newGame(CONTENT)
    const old = { ...newGenState(CONTENT, 1, 7), on: false, settledDay: 8 }
    const s = { ...base, clock: { day: 8, minute: 600 }, gen: old }
    expect(settleGen(s, CONTENT).gen?.persons[BAKER_BABY_ID]).toBeDefined()
    expect(settleGen(s, CONTENT).gen?.on).toBe(false)
  })
})

describe('헤이즐의 아기 침대 부탁', () => {
  const base = () => ({ ...newGame(CONTENT), scenes: [], clock: { day: 8, minute: 600 } })
  it.each([22, 50, 92, 252])('%i일째 자란 아이에게는 침대를 부탁하거나 재료를 받지 않는다 (저장 복원 포함)', (day) => {
    const s = { ...base(), clock: { day, minute: 600 }, inv: { reed: 3, blanket: 1 } }
    for (const today of [s, deserialize(serialize(s), CONTENT)!]) {
      expect(bakerCribWaiting(today, 'baker')).toBe(false)
      expect(makeBakerCrib(today)).toBeNull()
      expect(today.inv).toEqual({ reed: 3, blanket: 1 })
      expect(today.flags.bakerCribGiven).toBeUndefined()
    }
    expect(bakerCribWaiting({ ...s, clock: { day: 21, minute: 600 } }, 'baker')).toBe(true)
  })
  it('태어난 뒤 헤이즐만 부탁하고 재료 부족이면 아무것도 바뀌지 않는다', () => {
    const s = base()
    expect(bakerCribWaiting({ ...s, clock: { day: 7, minute: 600 } }, 'baker')).toBe(false)
    expect(bakerCribWaiting(s, 'baker')).toBe(true)
    expect(bakerCribWaiting(s, 'wendell')).toBe(false)
    expect(makeBakerCrib({ ...s, inv: { reed: 2, blanket: 1 } })).toBeNull()
    expect(makeBakerCrib({ ...s, inv: { reed: 3 } })).toBeNull()
  })
  it('한 번 만들어 건네면 재료를 쓰고 침대가 집에 보이며, 저장 후에도 중복 전달·추가 출생은 없다', () => {
    const s = { ...base(), inv: { reed: 4, blanket: 2 }, gen: { ...newGenState(CONTENT, 1, 8), on: false } }
    const next = makeBakerCrib(s)!
    expect(next.inv).toEqual({ reed: 1, blanket: 1 })
    expect(next.hearts.baker).toBeGreaterThan(s.hearts.baker ?? 0)
    expect(next.gen).toEqual(s.gen)
    expect(next.recipesKnown).toContain('homeCradle')
    const room = ROOMS.find(r => r.owner === 'baker')!
    expect(householdBabies(s, room)).toEqual([])
    expect(householdBabies(next, room)).toContainEqual(expect.objectContaining({ baby: expect.objectContaining({ id: BAKER_BABY_ID }) }))
    const back = deserialize(serialize(next), CONTENT)!
    expect(bakerCribWaiting(back, 'baker')).toBe(false)
    expect(makeBakerCrib(back)).toBeNull()
    expect(back.recipesKnown.filter(r => r === 'homeCradle')).toHaveLength(1)
    expect(householdCradles(back, room)).toEqual(householdCradles(next, room))
  })
  it('침대를 받기 전에도 집 안에만 머물고, 받은 뒤 21일까지 같은 침대 자리에서 지낸다', () => {
    const room = ROOMS.find(r => r.owner === 'baker')!
    const s = { ...base(), inv: { reed: 3, blanket: 1 } }
    const waiting = bakerInfantAtHome(s, room)!
    expect(waiting.baby.stage).toBe('baby')
    expect(bakerInfantAtHome(s, null)).toBeNull()
    const given = makeBakerCrib(s)!
    expect(bakerInfantAtHome(given, room)).toBeNull()
    const at = householdCradles(given, room)[0].at
    for (let day = 8; day <= 21; day++) {
      const today = { ...given, clock: { day, minute: 600 } }
      expect(householdCradles(today, room)[0]).toMatchObject({ at, baby: { id: BAKER_BABY_ID, stage: 'baby' } })
      expect(companionsOf(undefined, 'baker', day)).toEqual([])
    }
    const grown = { ...given, clock: { day: 22, minute: 600 } }
    expect(householdCradles(grown, room)).toEqual([{ at, baby: null, sleeping: false }])
    expect(householdBabies(grown, room)).toEqual([])
    expect(companionsOf(undefined, 'baker', 22)).toHaveLength(1)
    const empty = householdCradleFrame(null, 2, false)
    expect(empty.actor.every(r => /^\.+$/.test(r))).toBe(true)
    expect(empty.back.some(r => /[^.]/.test(r))).toBe(true)
  })
  it('전달 보상으로 배운 제작법만 작업대에서 쓸 수 있고, 기존 전달 저장에도 보상을 보완한다', () => {
    const s = { ...base(), inv: { reed: 6, blanket: 2 } }
    expect(canCraft(s, 'homeCradle')).toBe('recipe')
    expect(finishCraft(s, 'homeCradle')).toBe(s)
    const learned = makeBakerCrib(s)!
    expect(canCraft(learned, 'homeCradle')).toBeNull()
    const made = finishCraft(learned, 'homeCradle')
    expect(made.inv.homeCradle).toBeGreaterThanOrEqual(1)
    expect(made.inv.reed ?? 0).toBe(0)
    expect(made.inv.blanket ?? 0).toBe(0)
    expect(made.recipesKnown.filter(r => r === 'homeCradle')).toHaveLength(1)
    const legacy = { ...learned, recipesKnown: [] }
    const restored = settle(legacy, CONTENT)
    expect(restored.recipesKnown).toContain('homeCradle')
    expect(settle(restored, CONTENT).recipesKnown).toEqual(restored.recipesKnown)
  })
})
