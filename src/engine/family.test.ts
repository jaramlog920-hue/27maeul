import { CONTENT } from '../content/catalog'
import { SCENES, T } from '../content/text'
import { forbiddenIn } from '../content/forbidden'
import { newChild } from './child'
import { answerDesk, DESK_DOZE_AT, deskAsks, deskKidReady, deskKidVerse, deskKidWith, deskPose, isFamilyAlbum, spouseReading } from './family'
import { newGame, type GameState } from './game'
import { NO_ROMANCE } from './romance'
import { freshStats } from './stats'
import { FAMILY_DESK } from '../render/sprites'

/** age일 된 아이가 있는 day일째 게임 */
function withKid(day: number, age: number, minute = 10 * 60): GameState {
  const g = newGame(CONTENT)
  return { ...g, scenes: [], clock: { ...g.clock, day, minute }, child: { ...newChild(day - age, freshStats(), undefined), born: day - age } }
}
/** 아이가 옆에 앉고 싶어 하는 날 하나 */
function askDay(from = 60): number {
  for (let d = from; d < from + 50; d++) if (deskAsks(withKid(d, 20))) return d
  throw new Error('no ask day')
}

describe('가족과 함께 있는 필사 (계획 14 작업 10)', () => {
  it('걷는 아이·돕는 아이만 곁에 앉는다 — 아기·어른·배움터에 간 아이는 아니다', () => {
    expect(deskKidReady(withKid(60, 3))).toBe(false)
    expect(deskKidReady(withKid(60, 20))).toBe(true)
    expect(deskKidReady(withKid(60, 50))).toBe(true)
    expect(deskKidReady(withKid(60, 90))).toBe(false)
    const school = withKid(60, 50)
    expect(deskKidReady({ ...school, flags: { ...school.flags, schoolDay: 60 } })).toBe(false)
    expect(deskKidReady({ ...newGame(CONTENT), child: null })).toBe(false)
  })

  it('가끔 묻는다 (날 씨앗), 하루에 한 번만', () => {
    const asks = Array.from({ length: 40 }, (_, i) => deskAsks(withKid(60 + i, 20))).filter(Boolean).length
    expect(asks).toBeGreaterThan(5)
    expect(asks).toBeLessThan(35)
    const d = askDay()
    const s = withKid(d, 20)
    expect(deskAsks({ ...s, flags: { ...s.flags, deskAskDay: d } })).toBe(false)
  })

  it('[혼자 쓰기]면 곁에 없고, [같이 있기]면 그날만 곁에 있다', () => {
    const d = askDay()
    const s = withKid(d, 20)
    expect(deskKidWith(answerDesk(s, false))).toBe(false)
    const t = answerDesk(s, true)
    expect(deskKidWith(t)).toBe(true)
    expect(deskKidWith({ ...t, clock: { ...t.clock, day: d + 1 } })).toBe(false)
  })

  it('같이 쓴 절이 쌓이면 그림 → 책 → 졸기, 처음 잠든 날 한 번 앨범 장면 — 아이 능력치는 그대로', () => {
    let s = answerDesk(withKid(askDay(), 20), true)
    const stats = s.child!.stats
    expect(deskPose(s)).toBe('draw')
    for (let i = 0; i < DESK_DOZE_AT; i++) s = deskKidVerse(s)
    expect(deskPose(s)).toBe('doze')
    expect(s.scenes).toEqual(['fam:deskNap'])
    expect(s.child!.stats).toEqual(stats)
    s = deskKidVerse(deskKidVerse(s))
    expect(s.scenes).toEqual(['fam:deskNap'])
    // 곁에 없으면 세지 않는다
    const alone = withKid(askDay(), 20)
    expect(deskKidVerse(alone)).toBe(alone)
  })

  it('배우자는 부부일 때 저녁·밤에만 같은 방에서 책을 읽는다', () => {
    const g = newGame(CONTENT)
    const married = { ...NO_ROMANCE, partner: 'wendell', stage: 'married' as const, marriedDay: 1 }
    expect(spouseReading({ ...g, romance: married, clock: { ...g.clock, minute: 20 * 60 } })).toBe(true)
    expect(spouseReading({ ...g, romance: married, clock: { ...g.clock, minute: 12 * 60 } })).toBe(false)
    expect(spouseReading({ ...g, romance: { ...married, stage: 'dating' }, clock: { ...g.clock, minute: 20 * 60 } })).toBe(false)
  })

  it('가족 앨범 쪽: fam:·우리 아이·결혼의 날 / 이웃 아이의 날은 아니다', () => {
    expect(isFamilyAlbum('fam:deskNap')).toBe(true)
    expect(isFamilyAlbum('childWalks')).toBe(true)
    expect(isFamilyAlbum('wedding:poppy')).toBe(true)
    expect(isFamilyAlbum('firstLetter')).toBe(false)
    expect(isFamilyAlbum('dinner:child')).toBe(false)
  })

  it('문구: 장면과 앨범 제목이 있고 금지어가 없다, 그림은 16×12', () => {
    expect(SCENES['fam:deskNap'].album).toBeTruthy()
    for (const t of [...Object.values(T.family.desk), SCENES['fam:deskNap'].title, ...SCENES['fam:deskNap'].lines.map((l) => l.text)]) expect(forbiddenIn(t), t).toBeNull()
    for (const rows of Object.values(FAMILY_DESK)) {
      expect(rows).toHaveLength(12)
      for (const r of rows) expect(r).toHaveLength(16)
    }
  })
})
