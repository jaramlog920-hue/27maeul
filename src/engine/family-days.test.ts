import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import { SCENES } from '../content/text'
import { newChild } from './child'
import { eatSupper, SUPPER_FROM, supperReady } from './family'
import { childBirthday, familyMorning, spouseBirthday, YEAR_DAYS } from './family-days'
import { newGame, type GameState } from './game'
import { dayOf } from './calendar'
import { BIRTHDAYS } from './notebook'
import { NO_ROMANCE, type Romance } from './romance'
import { freshStats } from './stats'

const married = (partner = 'wendell', marriedDay = 10): Romance => ({ ...NO_ROMANCE, partner, stage: 'married', marriedDay })
function evening(day: number, extra: Partial<GameState> = {}): GameState {
  const g = newGame(CONTENT)
  return { ...g, scenes: [], clock: { ...g.clock, day, minute: SUPPER_FROM + 30 }, romance: married(), ...extra }
}
function supperDay(from = 20): number {
  for (let d = from; d < from + 40; d++) if (supperReady(evening(d))) return d
  throw new Error('no supper day')
}

describe('배우자와 저녁 (계획 12)', () => {
  it('부부일 때 저녁에 가끔 — 결혼 잔치 날·낮·이미 먹은 날·연인 사이는 아니다', () => {
    const n = Array.from({ length: 40 }, (_, i) => supperReady(evening(20 + i))).filter(Boolean).length
    expect(n).toBeGreaterThan(5)
    expect(n).toBeLessThan(35)
    const d = supperDay()
    const s = evening(d)
    expect(supperReady({ ...s, clock: { ...s.clock, minute: 12 * 60 } })).toBe(false)
    expect(supperReady({ ...s, flags: { ...s.flags, supperDay: d } })).toBe(false)
    expect(supperReady({ ...s, romance: { ...married(), stage: 'dating' } })).toBe(false)
    expect(supperReady({ ...s, romance: married('wendell', d) })).toBe(false)
  })

  it('같이 먹으면 배고픔이 가시고 마음이 조금 — 처음은 앨범 장면, 그 뒤엔 평소 장면, 하루 한 번', () => {
    const d = supperDay()
    const s = { ...evening(d), needs: { ...evening(d).needs, hunger: 80 } }
    const a = eatSupper(s)!
    expect(a.needs.hunger).toBeLessThan(80)
    expect(a.hearts.wendell ?? 0).toBeGreaterThan(0)
    expect(a.scenes).toEqual(['fam:supperFirst'])
    expect(eatSupper(a)).toBeNull()
    const d2 = supperDay(d + 1)
    const b = eatSupper({ ...a, scenes: [], clock: { ...a.clock, day: d2, minute: SUPPER_FROM + 30 } })!
    expect(b.scenes).toEqual(['fam:supper'])
    // 아이가 집에 있으면 셋이 둘러앉는다
    const withKid = { ...a, scenes: [], clock: { ...a.clock, day: d2, minute: SUPPER_FROM + 30 }, child: { ...newChild(d2 - 50, freshStats(), undefined), born: d2 - 50 } }
    expect(eatSupper(withKid)!.scenes).toEqual(['fam:supperAll'])
  })
})

describe('가족 생일 (계획 12)', () => {
  it('아이 생일은 태어난 날에서 한 해(네 철)씩', () => {
    expect(YEAR_DAYS).toBe(160)
    expect(childBirthday({ born: 5 }, 5)).toBe(false)
    expect(childBirthday({ born: 5 }, 165)).toBe(true)
    expect(childBirthday({ born: 5 }, 166)).toBe(false)
  })

  it('배우자 생일은 이웃 생일 그대로 (부부일 때만)', () => {
    const [season, n] = BIRTHDAYS.wendell
    const day = dayOf(season, n)
    expect(spouseBirthday(married(), day)).toBe(true)
    expect(spouseBirthday(married(), day + 1)).toBe(false)
    expect(spouseBirthday({ ...married(), stage: 'dating' }, day)).toBe(false)
  })

  it('생일 아침 장면 (배우자 · 집의 아이 · 먼 곳에 사는 아이는 편지)', () => {
    const [season, n] = BIRTHDAYS.wendell
    const day = dayOf(season, n)
    const g = { ...newGame(CONTENT), scenes: [] as string[], romance: married() }
    expect(familyMorning({ ...g, clock: { ...g.clock, day } }).scenes).toEqual(['fam:bdaySpouse'])
    const kid = { ...newChild(1, freshStats(), undefined), born: 1 }
    expect(familyMorning({ ...g, romance: NO_ROMANCE, child: kid, clock: { ...g.clock, day: 161 } }).scenes).toEqual(['fam:bdayChild'])
    expect(familyMorning({ ...g, romance: NO_ROMANCE, child: { ...kid, job: 'sailor', left: true }, clock: { ...g.clock, day: 161 } }).scenes).toEqual(['fam:bdayChildFar'])
    const plain = { ...g, romance: NO_ROMANCE, clock: { ...g.clock, day: 50 } }
    expect(familyMorning(plain)).toBe(plain)
  })

  it('문구: 앨범 제목, 금지어 없음', () => {
    for (const id of ['fam:supperFirst', 'fam:bdaySpouse', 'fam:bdayChild', 'fam:bdayChildFar']) expect(SCENES[id].album, id).toBeTruthy()
    for (const id of ['fam:supper', 'fam:supperAll']) expect(SCENES[id].album, id).toBeUndefined()
    for (const id of ['fam:supperFirst', 'fam:supper', 'fam:supperAll', 'fam:bdaySpouse', 'fam:bdayChild', 'fam:bdayChildFar'])
      for (const t of [SCENES[id].title, SCENES[id].album ?? '', ...SCENES[id].lines.map((l) => l.text)]) expect(forbiddenIn(t), t).toBeNull()
  })
})
