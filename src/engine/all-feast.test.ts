// 계획 9 작업 5: 스물일곱 권 잔치 — 요한계시록이 꽂히고 일곱 교회 판을 다 놓은 날 밤에 자면, 다음 날 아침 잔치
import bible from '../content/nt-krv.json'
import { CONTENT } from '../content/catalog'
import { ALBUM_IDS, JOURNAL_NOTES, SCENES } from '../content/text'
import { planGathering, villageLevel } from './bonds'
import { FESTIVAL_FROM, FESTIVAL_TO, festivalOf, isWet, weatherOf } from './calendar'
import { scheduledEvents } from './events'
import { goToSleep, lessonTime, newGame, sceneSeen, tick, type GameState } from './game'
import { allShelved, feastToday } from './library'
import { FESTIVAL_SPOTS } from './neighbors'
import { BOOKS } from './types'

const zero = () => 0
const at = (s: GameState, minute: number, day = s.clock.day): GameState => ({ ...s, clock: { day, minute } })
const eve = (s: GameState, minute: number) => tick(at(s, minute), 0.05, zero, CONTENT)

const ALL = Object.fromEntries(BOOKS.map((b) => [b, 1])) as GameState['shelved']
const OPEN = { gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1, 'room:rev': 1 }

/** day일째 밤 — 요한계시록 방이 열린 뒤, shelved·판 상태를 준다 */
function night(day: number, shelved: GameState['shelved'], churchesDone: boolean, extra: Partial<GameState> = {}): GameState {
  const s = newGame(CONTENT)
  return {
    ...s,
    clock: { day, minute: 22 * 60 },
    shelved,
    flags: { ...s.flags, ...OPEN, ...(churchesDone ? { churchesDone: 1 } : {}) },
    ...extra,
  }
}
const sleep = (s: GameState) => goToSleep({ ...s, scenes: [], clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)

describe('스물일곱 권 잔치 — 조건과 한 번뿐', () => {
  it('allShelved: 스물일곱 권이 모두 꽂혀야', () => {
    expect(allShelved({ shelved: ALL })).toBe(true)
    const noRev = { ...ALL }
    delete noRev.rev
    expect(allShelved({ shelved: noRev })).toBe(false)
  })
  it('① 요한계시록만 꽂고 판 미완 → 없음, 판만 완성·안 꽂음 → 없음', () => {
    const a = goToSleep(night(2, ALL, false), CONTENT)
    expect(a.scenes).not.toContain('allFeast')
    expect(a.flags.allFeast).toBeUndefined()
    const noRev = { ...ALL }
    delete noRev.rev
    const b = goToSleep(night(2, noRev, true), CONTENT)
    expect(b.scenes).not.toContain('allFeast')
    expect(b.flags.allFeast).toBeUndefined()
  })
  it('① 둘 다 된 날 밤에 자면 다음 날 아침 잔치, 그다음 잠에서 2, 다시 나오지 않는다', () => {
    const s = goToSleep(night(2, ALL, true), CONTENT)
    expect(s.clock.day).toBe(3)
    expect(s.scenes.filter((x) => x === 'allFeast')).toHaveLength(1)
    expect(s.flags.allFeast).toBe(1)
    expect(feastToday(s)).toBe(true)
    // 복음서 방 잔치는 그대로 지난 것
    expect(s.flags.gospelFeast).toBe(2)
    const s2 = sleep(s)
    expect(s2.scenes).not.toContain('allFeast')
    expect(s2.flags.allFeast).toBe(2)
    expect(feastToday(s2)).toBe(false)
    const s3 = sleep(s2)
    expect(s3.scenes).not.toContain('allFeast')
    expect(s3.flags.allFeast).toBe(2)
  })
  it('② 아기 잔치 날과 겹치면 하루 미룬다', () => {
    expect(isWet(weatherOf(22))).toBe(false)
    const baby = goToSleep(night(21, ALL, true), CONTENT)
    expect(baby.today.gathering).toBe('babyParty')
    expect(baby.scenes).not.toContain('allFeast')
    expect(baby.flags.allFeast).toBeUndefined()
    const feast = sleep(baby)
    expect(feast.clock.day).toBe(23)
    expect(feast.scenes.filter((x) => x === 'allFeast')).toHaveLength(1)
    expect(feast.flags.allFeast).toBe(1)
  })
  it('② 마을 행사 날과 겹치면 하루 미룬다 — 그날 일정에 잔치가 같이 뜨지 않는다', () => {
    expect(festivalOf(20)).toBe('grapes')
    const fest = goToSleep(night(19, ALL, true), CONTENT)
    expect(fest.scenes).not.toContain('allFeast')
    expect(fest.flags.allFeast).toBeUndefined()
    const todays = scheduledEvents(fest, CONTENT).filter((e) => e.day === 20)
    expect(todays.some((e) => e.id.endsWith(':allFeast'))).toBe(false)
    const feast = sleep(fest)
    expect(feast.clock.day).toBe(21)
    expect(feast.flags.allFeast).toBe(1)
    const ev = scheduledEvents(feast, CONTENT).find((e) => e.id === '21:allFeast')!
    expect(ev).toMatchObject({ title: '스물일곱 권 잔치', location: '장터 모닥불 · 특별 장면은 18:30부터', from: FESTIVAL_FROM, to: FESTIVAL_TO })
  })
})

describe('스물일곱 권 잔치 — 저녁 모닥불', () => {
  it('③ 잔치 날 저녁 이사 온 이웃이 모두 광장 자리로, 비가 와도 (목수·약방 주인도 와 있다)', () => {
    const s = goToSleep(night(2, ALL, true), CONTENT)
    expect(isWet(weatherOf(3))).toBe(true)
    expect(s.flags['movedIn:carpenter']).toBe(1)
    expect(s.flags['movedIn:apothecary']).toBe(1)
    const e = eve(s, FESTIVAL_FROM + 1).state
    const joined = CONTENT.neighbors.filter((d) => d.joinsAt === undefined)
    for (const d of joined) expect(e.npcs[d.id].goal, d.id).toEqual(FESTIVAL_SPOTS[d.id])
    expect(eve(s, FESTIVAL_TO + 1).state.npcs.merchant.goal).toBeNull()
  })
  it('③ 18:30 광장에서 allFeastFire 한 번 (비 오는 날에도), 복음서 방 모닥불 장면은 아니다', () => {
    let s = goToSleep(night(2, ALL, true), CONTENT)
    s = { ...s, scenes: [], player: { ...s.player, x: 24, y: 19, path: [] } }
    expect(eve(s, FESTIVAL_FROM + 5).events).toEqual([])
    const r = eve(s, FESTIVAL_FROM + 31)
    expect(r.events).toContainEqual({ type: 'moment', id: 'allFeastFire' })
    expect(r.events).not.toContainEqual({ type: 'moment', id: 'feastFire' })
    expect(eve({ ...r.state, scenes: [] }, FESTIVAL_FROM + 40).events).toEqual([])
  })
  it('④ 잔치 날에는 별 보는 밤 모임을 잡지 않는다', () => {
    const hearts = Object.fromEntries(CONTENT.neighbors.map((d) => [d.id, 99]))
    const level = villageLevel(hearts)
    const flags = { ...OPEN, 'done:picnic': 1 }
    let d = 2
    while (planGathering(d + 1, level, flags) !== 'starNight') d++
    const extra = { hearts }
    const plain = goToSleep({ ...night(d, ALL, false, extra), flags: { ...night(d, ALL, false).flags, 'done:picnic': 1 } }, CONTENT)
    expect(plain.today.gathering).toBe('starNight')
    const feast = goToSleep({ ...night(d, ALL, true, extra), flags: { ...night(d, ALL, true).flags, 'done:picnic': 1 } }, CONTENT)
    expect(feast.flags.allFeast).toBe(1)
    expect(feast.today.gathering).toBeNull()
    expect(feast.scenes).not.toContain('notice:starNight')
  })
  it('④ 잔치 날에는 저녁 초대가 없다', () => {
    const hearts = Object.fromEntries(CONTENT.neighbors.map((d) => [d.id, 99]))
    let found = false
    for (let d = 2; d < 60 && !found; d++) {
      const plain = goToSleep(night(d, ALL, false, { hearts }), CONTENT)
      if (!plain.today.inviter || plain.today.gathering || festivalOf(d + 1)) continue
      found = true
      const feast = goToSleep(night(d, ALL, true, { hearts }), CONTENT)
      expect(feast.flags.allFeast).toBe(1)
      expect(feast.today.inviter).toBeNull()
    }
    expect(found).toBe(true)
  })
  it('④ 잔치 날에는 아이 글자 공부를 쉰다', () => {
    const base = { ...night(3, ALL, true), clock: { day: 4, minute: 18 * 60 + 10 } }
    expect(isWet(weatherOf(4))).toBe(false)
    const flags = { ...base.flags, childAsked: 1, childLetters: 0 }
    expect(lessonTime({ ...base, flags })).toBe(true)
    expect(lessonTime({ ...base, flags: { ...flags, allFeast: 1 } })).toBe(false)
    expect(lessonTime({ ...base, flags: { ...flags, allFeast: 2 } })).toBe(true)
  })
})

describe('스물일곱 권 잔치 — 앨범과 그 뒤', () => {
  it('⑤ 앨범에 allFeast 한 장, 저녁 모닥불 장면은 그 칸의 사진', () => {
    expect(ALBUM_IDS).toContain('allFeast')
    expect(ALBUM_IDS).not.toContain('allFeastFire')
    expect(SCENES.allFeast.album).toBe('스물일곱 권이 다 꽂힌 날')
    expect(SCENES.allFeastFire.photoFor).toBe('allFeast')
    const s = goToSleep(night(2, ALL, true), CONTENT)
    let seen = sceneSeen(s, 'allFeast', ALBUM_IDS)
    seen = sceneSeen({ ...seen, scenes: ['allFeast'] }, 'allFeast', ALBUM_IDS)
    expect(seen.album.filter((a) => a.id === 'allFeast')).toHaveLength(1)
  })
  it('⑥ 잔치 뒤에도 하루가 그대로 이어진다 — 결말 장면 없음, 모닥불 자리로 모이지 않는다', () => {
    let s = goToSleep(night(2, ALL, true), CONTENT)
    for (let i = 0; i < 4; i++) {
      s = sleep(s)
      expect(s.flags.allFeast).toBe(2)
      expect(s.scenes.some((x) => x.startsWith('allFeast'))).toBe(false)
      const e = eve(s, FESTIVAL_FROM + 1).state
      if (!festivalOf(s.clock.day)) expect(e.npcs.baker.goal).not.toEqual(FESTIVAL_SPOTS.baker)
      s = eve(s, 10 * 60).state
    }
    expect(s.clock.day).toBe(7)
  })
})

describe('스물일곱 권 잔치 — 문구', () => {
  const ids = ['allFeast', 'allFeastFire'] as const
  const texts = () => [
    ...ids.flatMap((id) => [SCENES[id].title, SCENES[id].album ?? '', ...SCENES[id].lines.map((l) => l.text)]),
    ...ids.map((id) => JOURNAL_NOTES[id]),
  ]
  it('장면 문구가 브리프 그대로 있고, 일지 줄이 있다', () => {
    expect(SCENES.allFeast.title).toBe('서고가 다 찼다')
    expect(SCENES.allFeastFire.title).toBe('광장 모닥불 잔치')
    expect(SCENES.allFeast.lines.map((l) => l.speaker)).toEqual(['narration', 'grandpa', 'carpenter', 'postman', 'narration'])
    expect(SCENES.allFeastFire.lines.map((l) => l.speaker)).toEqual(['narration', 'baker', 'child', 'apothecary', 'narration'])
    expect(JOURNAL_NOTES.allFeast).toBe(' 서고에 스물일곱 권이 다 꽂혔다.')
    expect(JOURNAL_NOTES.allFeastFire).toBe(' 스물일곱 권 잔치 모닥불 곁에 앉았다.')
  })
  it('말하는 이웃은 잔치 날 모두 마을에 와 있다', () => {
    const s = goToSleep(night(2, ALL, true), CONTENT)
    for (const id of ids)
      for (const l of SCENES[id].lines) {
        if (l.speaker === 'narration') continue
        const d = CONTENT.neighbors.find((n) => n.id === l.speaker)!
        expect(d.joinsAt, l.speaker).toBeUndefined()
        if (d.joinsAtBooks !== undefined) expect(s.flags[`movedIn:${d.id}`], l.speaker).toBe(1)
      }
  })
  it('⑦ 정경 형성을 암시하는 말이 없다', () => {
    for (const t of texts()) expect(t).not.toMatch(/정경|완성|모였다|한 권으로|신약/)
  })
  it('⑦ 성경 본문의 한 절 조각(띄어쓰기 뺀 14자 이상)이 장면 문구에 없다', () => {
    const squash = (x: string) => x.replace(/\s+/g, '')
    const all = Object.values(bible as Record<string, string[][]>)
      .flatMap((book) => book.flat())
      .map(squash)
      .join('\n')
    for (const t of texts()) {
      const q = squash(t)
      for (let i = 0; i + 14 <= q.length; i++) expect(all.includes(q.slice(i, i + 14)), q.slice(i, i + 14)).toBe(false)
    }
  })
})
