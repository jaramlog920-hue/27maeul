import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import { SCENES, T, kidFill } from '../content/text'
import { HELPER_AT, newChild, TODDLER_AT } from './child'
import { doKidAct } from './family'
import { canShow, canSpouseAct, doSpouseAct, FAMILY_CHOICES, latestWork, showAtSchool, SPOUSE_ACT_MINUTES, spouseActId } from './family-memory'
import { childBirthday, familyMorning } from './family-days'
import { newGame, sendToSchool, type GameState } from './game'
import { sharedExperience } from './people'
import { CANDIDATE_IDS, NO_ROMANCE } from './romance'
import { deserialize, serialize } from './save'
import { freshStats } from './stats'
import { HOME_ENTRY } from './world'

describe('가족의 실제 첫 경험', () => {
  function ready() {
    const s = newGame(CONTENT)
    return { ...s, scenes: [], clock: { ...s.clock, day: 60, minute: 600 }, child: newChild(10, freshStats(), undefined) }
  }
  it('첫 장난감의 앨범과 경험은 같은 ID로 한 번만 기록한다', () => {
    const first = doKidAct(ready(), 'make', CONTENT)!.state
    expect(first.life?.experiences['fam:make']?.with).toEqual(['family:child'])
    expect(first.life?.experiences['fam:make']?.first).toBe(60)
    const second = doKidAct(first, 'make', CONTENT)!.state
    expect(second.life?.experiences['fam:make']?.count).toBe(1)
    expect(second.scenes.filter(id => id === 'fam:make')).toHaveLength(1)
  })
  it('옛 앨범의 날짜를 새로 만들어 내지 않는다', () => {
    const s = ready()
    const old = { ...s, flags: { ...s.flags, 'fam:make': 1 } }
    expect(doKidAct(old, 'make', CONTENT)!.state.life?.experiences['fam:make']).toBeUndefined()
  })
  it('마을의 물 긷는 아이를 가족 경험의 참여자로 넣지 않는다', () => {
    expect(doKidAct(ready(), 'make', CONTENT)!.state.life?.memories.child).toBeUndefined()
  })
  it('성장한 아이에게 유아 경험을 새로 기록하지 않는다', () => {
    const s = ready()
    expect(doKidAct({ ...s, child: { ...s.child, born: -40 } }, 'make', CONTENT)).toBeNull()
  })
})

describe('단계에 맞는 첫 경험 (기획 08 §2)', () => {
  // 나이 = day - born. 걷는 아이·돕는 아이 단계는 child.ts의 childStage가 정한다
  function kidAt(age: number, day = 100): GameState {
    const s = newGame(CONTENT)
    return { ...s, scenes: [], clock: { ...s.clock, day, minute: 600 }, child: { ...newChild(day - age, freshStats(), undefined), born: day - age } }
  }
  it('퍼즐·공 놀이의 첫 번은 걷는 아이일 때만 "처음 고른 놀이" — 고른 놀이가 선택으로 남는다', () => {
    const toddler = doKidAct(kidAt(TODDLER_AT + 3), 'puzzle', CONTENT)!.state
    expect(toddler.life!.experiences['fam:play'].choice).toBe(0)
    expect(toddler.scenes).toContain('fam:play')
    expect(doKidAct(kidAt(TODDLER_AT + 3), 'ball', CONTENT)!.state.life!.experiences['fam:play'].choice).toBe(1)
    // 돕는 아이가 되어서야 한 놀이는 그 단계의 첫 경험이 아니므로 기록·앨범이 없다 (손해 표시도 없다)
    const helper = doKidAct(kidAt(HELPER_AT + 3), 'puzzle', CONTENT)!.state
    expect(helper.scenes).not.toContain('fam:play')
    expect(helper.flags['fam:play']).toBeUndefined()
    expect(helper.life?.experiences?.['fam:play']).toBeUndefined()
  })

  it('첫 심부름은 돕는 아이가 실제 이웃을 만나 마쳤을 때만 — 그 이웃이 함께한 기억으로', () => {
    let done = 0
    for (let day = 100; day < 160; day++) {
      const r = doKidAct(kidAt(HELPER_AT + 3, day), 'errand', CONTENT)!
      const exp = r.state.life?.experiences['fam:errand']
      if (!r.who) {
        // 이웃을 만나지 못한 심부름은 앨범을 채우지 않는다
        expect(exp).toBeUndefined()
        expect(r.state.scenes).not.toContain('fam:errand')
        continue
      }
      done++
      expect(exp!.with).toEqual(['family:child', r.who])
      expect(sharedExperience(r.state.life!, r.who, 'fam:errand')).not.toBeNull()
      expect(r.state.scenes).toContain('fam:errand')
    }
    expect(done).toBeGreaterThan(0)
    // 걷는 아이의 심부름은 첫 심부름이 아니다
    const toddler = doKidAct(kidAt(TODDLER_AT + 3), 'errand', CONTENT)!
    expect(toddler.state.life?.experiences?.['fam:errand']).toBeUndefined()
  })

  it('장 구경에서 마주친 이웃만 장 구경 경험의 참여자, 그 이웃은 따로 기억한다', () => {
    for (let day = 100; day < 400; day++) {
      const s = kidAt(TODDLER_AT + 3, day)
      const r = doKidAct(s, 'tour', CONTENT)
      const exp = r?.state.life?.experiences['fam:market']
      if (!exp) continue
      expect(exp.with).toEqual(r!.who ? ['family:child', r!.who] : ['family:child'])
      if (r!.who) expect(sharedExperience(r!.state.life!, r!.who, 'fam:market')).not.toBeNull()
      return
    }
    throw new Error('no market tour')
  })

  it('생일: 장면은 해마다 나오되 경험은 한 항목에 참여한 횟수만 쌓이고 첫 날짜는 그대로', () => {
    const g = newGame(CONTENT)
    const born = 5
    const kid = { ...newChild(born, freshStats(), undefined), born }
    let s: GameState = { ...g, scenes: [], romance: { ...NO_ROMANCE, partner: 'wendell', stage: 'married', marriedDay: 2 }, child: kid, clock: { ...g.clock, day: 0 } }
    const days: number[] = []
    for (let d = born; days.length < 3; d++) if (childBirthday(kid, d)) days.push(d)
    for (const d of days) s = familyMorning({ ...s, clock: { ...s.clock, day: d } })
    const exp = s.life!.experiences['fam:bday:child']
    expect(exp.count).toBe(3)
    expect(exp.first).toBe(days[0])
    expect(exp.last).toBe(days[2])
    expect(exp.with).toEqual(['family:child', 'wendell'])
    // 떠나 사는 아이의 생일은 편지일 뿐 함께한 기록이 아니다
    const far = familyMorning({ ...g, scenes: [], romance: NO_ROMANCE, child: { ...kid, job: 'sailor', left: true }, clock: { ...g.clock, day: days[0] } })
    expect(far.scenes).toEqual(['fam:bdayChildFar'])
    expect(far.life?.experiences?.['fam:bday:child']).toBeUndefined()
  })
})

describe('배우자별 가족 활동 (기획 08 §4)', () => {
  function family(partner: string, minute = 20 * 60): GameState {
    const g = newGame(CONTENT)
    const day = 100
    const toddlerBorn = day - (TODDLER_AT + 3)
    return { ...g, scenes: [], player: { ...g.player, x: HOME_ENTRY.x, y: HOME_ENTRY.y },
      clock: { ...g.clock, day, minute }, romance: { ...NO_ROMANCE, partner, stage: 'married', marriedDay: 3 },
      child: { ...newChild(toddlerBorn, freshStats(), undefined), born: toddlerBorn } }
  }

  it('배우자 열세 명 모두 제 활동·세 가지 고르기·앨범 장면이 있고 금지어가 없다', () => {
    const W = T.family.withSpouse as unknown as { spouses: Record<string, { label: string; choices: string[]; picks: string[] }> }
    expect(Object.keys(W.spouses).sort()).toEqual([...CANDIDATE_IDS].sort())
    for (const id of CANDIDATE_IDS) {
      const def = W.spouses[id]
      expect(def.choices, id).toHaveLength(FAMILY_CHOICES)
      expect(def.picks, id).toHaveLength(FAMILY_CHOICES)
      const sc = SCENES[spouseActId(id)]
      expect(sc.album, id).toBeTruthy()
      for (const t of [def.label, ...def.choices, ...def.picks, sc.title, sc.album!, ...sc.lines.map((l) => l.text)]) expect(forbiddenIn(t), t).toBeNull()
      // 위험한 일·부모의 고민을 아이에게 맡기지 않는다는 말만, 맡기는 말은 없다
      for (const l of sc.lines) expect(l.text, id).not.toMatch(/해결|책임지|부탁했다/)
    }
    expect(forbiddenIn(JSON.stringify(T.family.withSpouse))).toBeNull()
  })

  it('저녁에 집에서 아이가 고르면 한 번 — 경험·앨범이 같은 ID, 가까움만 오르고 능력치는 그대로', () => {
    const s = family('wendell')
    expect(canSpouseAct(s)).toBeNull()
    const r = doSpouseAct(s, 1)!
    const id = spouseActId('wendell')
    expect(r.album).toBe(true)
    expect(r.state.scenes).toEqual([id])
    expect(r.state.life!.experiences[id]).toMatchObject({ kind: 'family', with: ['family:child', 'wendell'], choice: 1, count: 1, first: 100 })
    expect(r.state.child!.close).toBeGreaterThan(s.child!.close ?? 0)
    expect(r.state.child!.stats).toEqual(s.child!.stats)
    expect(r.state.stats).toEqual(s.stats)
    expect(r.state.clock.minute).toBe(s.clock.minute + SPOUSE_ACT_MINUTES)
    // 하루에 한 번
    expect(canSpouseAct(r.state)).toBe('done')
    expect(doSpouseAct(r.state, 0)).toBeNull()
  })

  it('다음 날 또 하면 횟수·최근 날만 갱신하고 첫 날짜와 앨범은 그대로(중복 장면 없음)', () => {
    const r = doSpouseAct(family('poppy'), 0)!
    const next = { ...r.state, clock: { ...r.state.clock, day: 101, minute: 20 * 60 } }
    const r2 = doSpouseAct(next, 2)!
    const id = spouseActId('poppy')
    expect(r2.album).toBe(false)
    expect(r2.state.scenes.filter((x) => x === id)).toHaveLength(1)
    expect(r2.state.life!.experiences[id]).toMatchObject({ count: 2, first: 100, last: 101, choice: 2 })
  })

  it('배우자·집·저녁·아이 단계가 맞지 않으면 열리지 않는다 (아기·다 자란 아이·배움터·낮·집 밖·연인 사이)', () => {
    const s = family('rudy')
    expect(canSpouseAct({ ...s, romance: { ...s.romance, stage: 'dating' } })).toBe('noSpouse')
    expect(canSpouseAct({ ...s, child: null })).toBe('noChild')
    expect(canSpouseAct({ ...s, child: { ...s.child!, born: s.clock.day - 1 } })).toBe('baby')
    expect(canSpouseAct({ ...s, child: { ...s.child!, born: -40 } })).toBe('grown')
    expect(canSpouseAct({ ...s, flags: { ...s.flags, schoolDay: s.clock.day }, clock: { ...s.clock, minute: 17 * 60 + 30 } })).toBe('school')
    expect(canSpouseAct({ ...s, clock: { ...s.clock, minute: 12 * 60 } })).toBe('time')
    expect(canSpouseAct({ ...s, clock: { ...s.clock, minute: 22 * 60 } })).toBe('time')
    expect(canSpouseAct({ ...s, player: { ...s.player, x: 3, y: 3 } })).toBe('notHome')
    expect(doSpouseAct(s, 3)).toBeNull()
    expect(doSpouseAct(s, -1)).toBeNull()
  })

  it('이후 대화: 배우자만 그 활동을 떠올리고(다른 배우자·연인은 아님), 저장 뒤에도 같다', () => {
    const r = doSpouseAct(family('basil'), 0)!
    expect(sharedExperience(r.state.life!, 'basil', spouseActId('basil'))).not.toBeNull()
    expect(sharedExperience(r.state.life!, 'wendell', spouseActId('basil'))).toBeNull()
    expect(CONTENT.neighbors.find((n) => n.id === 'basil')).toBeTruthy()
    const back = deserialize(serialize(r.state), CONTENT)!
    expect(back.life!.experiences[spouseActId('basil')]).toEqual(r.state.life!.experiences[spouseActId('basil')])
    expect(canSpouseAct(back)).toBe('done')
  })

  it('옛 저장에 앨범 표식만 있고 경험 기록이 없으면 첫 날짜를 지어내지 않고 이번부터 적는다', () => {
    const s = family('tilly')
    const old = { ...s, flags: { ...s.flags, [spouseActId('tilly')]: 1 } }
    const r = doSpouseAct(old, 0)!
    expect(r.album).toBe(false)
    expect(r.state.scenes).toEqual([])
    expect(r.state.life!.experiences[spouseActId('tilly')].first).toBe(100)
  })
})

describe('배움터에서 작품 보여 주기 (기획 08 §5)', () => {
  function atSchool(withWork = true): GameState {
    const g = newGame(CONTENT)
    const day = 100
    const born = day - (HELPER_AT + 3)
    const base = { ...g, scenes: [], clock: { ...g.clock, day, minute: 10 * 60 }, coins: 100, child: { ...newChild(born, freshStats(), undefined), born } } as GameState
    const sent = sentTo(base)
    return withWork ? { ...sent, flags: { ...sent.flags, kidMade: 1 } } : sent
  }
  function sentTo(s: GameState): GameState {
    return sendToSchool(s, 'wit') ?? s
  }

  it('돕는 아이를 배움터에 맡긴 날만, 작품이 있어야 발표·그림, 구경은 언제든 (순위·점수·닢 없음)', () => {
    const s = atSchool()
    expect(canShow(s, 'speak')).toBeNull()
    expect(canShow(s, 'draw')).toBeNull()
    expect(canShow(s, 'watch')).toBeNull()
    expect(canShow({ ...s, flags: { ...s.flags, kidMade: 0 } }, 'speak')).toBe('nothing')
    expect(canShow({ ...s, flags: { ...s.flags, kidMade: 0 } }, 'watch')).toBeNull()
    // 맡기지 않은 날·저녁 여섯 시 이후
    expect(canShow({ ...s, flags: { ...s.flags, schoolDay: undefined as never } }, 'speak')).toBe('notAtSchool')
    expect(canShow({ ...s, clock: { ...s.clock, minute: 18 * 60 } }, 'speak')).toBe('notAtSchool')
    // 걷는 아이·아기·어른은 보여 주기를 하지 않는다 (아직 / 이미)
    expect(canShow({ ...s, child: { ...s.child!, born: s.clock.day - 1 } }, 'speak')).toBe('stage')
    expect(canShow({ ...s, child: { ...s.child!, born: -40 } }, 'speak')).toBe('stage')
  })

  it('처음 작품을 보여 주면 앨범 한 장·교실 전시(최근 작품)·참여자는 아이 하나, 이후엔 횟수만', () => {
    const s = atSchool()
    expect(latestWork(s)).toBe('woodToy')
    const r = showAtSchool(s, 'speak')!
    expect(r.album).toBe(true)
    expect(r.item).toBe('woodToy')
    expect(r.state.scenes).toEqual(['fam:show'])
    const e = r.state.life!.experiences['fam:show']
    expect(e).toMatchObject({ with: ['family:child'], choice: 0, count: 1, place: 'classroom', item: 'woodToy' })
    // 같은 날 두 번은 없고, 다음 날 그림으로 보여 주면 횟수·선택만 바뀐다
    expect(showAtSchool(r.state, 'draw')).toBeNull()
    const next = { ...r.state, clock: { ...r.state.clock, day: r.state.clock.day + 1, minute: 10 * 60 }, flags: { ...r.state.flags, schoolDay: r.state.clock.day + 1, kidMade: 2 } }
    const r2 = showAtSchool(next, 'draw')!
    expect(r2.album).toBe(false)
    expect(r2.state.scenes.filter((x) => x === 'fam:show')).toHaveLength(1)
    expect(r2.state.life!.experiences['fam:show']).toMatchObject({ count: 2, first: 100, choice: 1, item: 'clothDoll' })
  })

  it('조용히 구경하기는 앨범·전시 없이 경험만 — 못 해도 손해 표시 없음', () => {
    const s = atSchool(false)
    const r = showAtSchool(s, 'watch')!
    expect(r.album).toBe(false)
    expect(r.state.scenes).toEqual([])
    expect(r.state.life!.experiences['fam:watch']).toMatchObject({ with: ['family:child'], place: 'classroom' })
    expect(r.state.life!.experiences['fam:watch'].item).toBeUndefined()
    expect(r.state.flags['fam:show']).toBeUndefined()
    // 능력치·닢·가까움 변화 없음
    expect(r.state.child!.stats).toEqual(s.child!.stats)
    expect(r.state.coins).toBe(s.coins)
  })

  it('옛 저장에 앨범 표식만 있어도 날짜를 지어내지 않고 이번부터 적는다', () => {
    const s = atSchool()
    const r = showAtSchool({ ...s, flags: { ...s.flags, 'fam:show': 1 } }, 'speak')!
    expect(r.album).toBe(false)
    expect(r.state.scenes).toEqual([])
    expect(r.state.life!.experiences['fam:show'].first).toBe(100)
  })

  it('앨범 장면 글에 금지어가 없고 아이 이름이 들어간다', () => {
    for (const id of ['fam:play', 'fam:errand', 'fam:show']) {
      const sc = SCENES[id]
      expect(sc.album, id).toBeTruthy()
      expect(kidFill(sc.album!, '하늘'), id).toContain('하늘')
      for (const t of [sc.title, sc.album!, ...sc.lines.map((l) => l.text)]) expect(forbiddenIn(t), t).toBeNull()
    }
  })
})
