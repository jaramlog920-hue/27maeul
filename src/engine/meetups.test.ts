// 계획 16 작업 3: 일과 조건과 주민끼리 만나는 시간 — 둘 다 있을 때만 함께, 궂은 날 대체 자리, 잔치·모임이 먼저
import { CONTENT, neighborById, PEOPLE } from '../content/catalog'
import { fill, T } from '../content/text'
import { festivalOf, FESTIVAL_FROM, isMarketDay, isWet, weatherOf } from './calendar'
import { hallGuestsToday, mutterPartner, mutterWaiting, newGame, routineOf, settle, type GameState } from './game'
import { FESTIVAL_SPOTS } from './neighbors'
import { isOffDay, personOf, setPeopleData, threadPhase, type PeopleData } from './people'
import { deserialize, serialize } from './save'

const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { ...s.clock, day, minute } })
const goalOf = (s: GameState, id: string) => settle(s, CONTENT).npcs[id]?.goal ?? null
const quiet = (day: number, ids: string[]) =>
  !festivalOf(day) && ids.every((id) => !isOffDay(personOf(id)!, day)) && PEOPLE.threads.every((t) => { const p = threadPhase(t, day); return p < 0 || p >= t.phases.length })
/** 조건에 맞는 날 (사건이 다 끝난 뒤, 잔치 없고 둘 다 평소인 날) */
const dayWhere = (ids: string[], pred: (d: number) => boolean) => {
  for (let d = 60; d < 600; d++) if (quiet(d, ids) && pred(d)) return d
  throw new Error('맞는 날이 없다')
}
const dry = (d: number) => !isWet(weatherOf(d)) && weatherOf(d) !== 'fog'
const wet = (d: number) => isWet(weatherOf(d))
/** 이사 온 집안 (코스모 = 어부 집안, 바질 = 약방 집안, 페넬로피 = 베 짜는 집안) */
const MOVED = { 'movedIn:fisher': 1, 'movedIn:apothecary': 1, 'movedIn:weaver': 1, 'movedIn:carpenter': 1, 'movedIn:beekeeper': 1 }
const base = (flags: Record<string, number> = MOVED): GameState => { const s = newGame(CONTENT); return { ...s, flags: { ...s.flags, ...flags } } }

describe('주민끼리 만나는 시간 (실제 내용)', () => {
  it('둘 다 있을 때만 함께 자리 — 틸리·웬델 점심', () => {
    const d = dayWhere(['tilly', 'wendell'], (d) => dry(d) && !isMarketDay(d))
    const s = at(base(), d, 730)
    expect(routineOf(s, 'tilly')?.with).toBe('wendell')
    expect(routineOf(s, 'wendell')?.with).toBe('tilly')
    expect(goalOf(s, 'tilly')).toEqual({ x: 2, y: 17 })
    expect(goalOf(s, 'wendell')).toEqual({ x: 1, y: 17 })
  })

  it('한쪽이 벗어나는 날이면 다른 쪽도 기다리지 않는다', () => {
    let d = 60
    while (!(isOffDay(personOf('tilly')!, d) && dry(d) && !festivalOf(d) && !isOffDay(personOf('wendell')!, d))) d++
    const s = at(base(), d, 730)
    expect(routineOf(s, 'tilly')?.with).toBeUndefined()
    expect(routineOf(s, 'wendell')?.with).toBeUndefined()
  })

  it('한쪽이 이사 오기 전이면 둘 다 평소 시간표 — 코스모 없는 덱스터', () => {
    const d = dayWhere(['cosmo', 'dexter'], (d) => dry(d))
    const before = at(base({}), d, 730)
    expect(routineOf(before, 'dexter')?.with).toBeUndefined()
    expect(goalOf(before, 'cosmo')).toBeNull()
    expect(goalOf(before, 'dexter')).not.toEqual({ x: 27, y: 22 })
    const after = at(base(), d, 730)
    expect(goalOf(after, 'dexter')).toEqual({ x: 27, y: 22 })
    expect(goalOf(after, 'cosmo')).toEqual({ x: 28, y: 22 })
  })

  it('비 오는 날은 대체 자리에서 함께 (양쪽 모두)', () => {
    for (const [a, b] of [['tilly', 'wendell'], ['cosmo', 'dexter']]) {
      const d = dayWhere([a, b], wet)
      const s = at(base(), d, 730)
      const ra = routineOf(s, a)
      const rb = routineOf(s, b)
      expect(ra?.with, a).toBe(b)
      expect(rb?.with, b).toBe(a)
      expect(ra!.when?.weather).toContain('wet')
      const ga = goalOf(s, a)!
      const gb = goalOf(s, b)!
      expect(Math.abs(ga.x - gb.x) + Math.abs(ga.y - gb.y)).toBeLessThanOrEqual(2)
    }
  })

  it('바질은 찻집 안 파피 곁에서 (비가 와도)', () => {
    for (const w of [dry, wet]) {
      const d = dayWhere(['basil', 'poppy'], (d) => w(d) && !isMarketDay(d))
      const s = at(base(), d, 730)
      expect(routineOf(s, 'basil')?.with).toBe('poppy')
      const g = goalOf(s, 'basil')!
      const p = goalOf(s, 'poppy')!
      expect(Math.abs(g.x - p.x) + Math.abs(g.y - p.y)).toBeLessThanOrEqual(2)
    }
  })

  it('잔치 날 저녁엔 만남 대신 모닥불', () => {
    let d = 60
    while (!(festivalOf(d) && dry(d))) d++
    const s = at(base(), d, FESTIVAL_FROM + 10)
    expect(goalOf(s, 'penelope')).toEqual(FESTIVAL_SPOTS.penelope)
    expect(goalOf(s, 'poppy')).toEqual(FESTIVAL_SPOTS.poppy)
  })

  it('상대가 사랑방 저녁 손님이면 찻집에서 기다리지 않는다 — 페넬로피와 파피', () => {
    const d = dayWhere(['penelope', 'poppy'], (d) => hallGuestsToday(at(base(), d, 1090), CONTENT).includes('poppy') && !hallGuestsToday(at(base(), d, 1090), CONTENT).includes('penelope'))
    const s = at(base(), d, 1090)
    expect(routineOf(s, 'penelope')?.with).toBeUndefined()
    expect(goalOf(s, 'penelope')).not.toEqual({ x: 42, y: 62 })
    // 손님이 아닌 날은 찻집에서 함께
    const d2 = dayWhere(['penelope', 'poppy'], (d) => { const g = hallGuestsToday(at(base(), d, 1090), CONTENT); return !g.includes('poppy') && !g.includes('penelope') })
    expect(routineOf(at(base(), d2, 1090), 'penelope')?.with).toBe('poppy')
  })

  it('저장·불러오기 뒤에도 같은 자리', () => {
    const d = dayWhere(['tilly', 'wendell', 'cosmo', 'dexter'], (d) => dry(d) && !isMarketDay(d))
    const s = settle(at(base(), d, 730), CONTENT)
    const back = settle(deserialize(serialize(s), CONTENT)!, CONTENT)
    for (const id of ['tilly', 'wendell', 'cosmo', 'dexter', 'basil', 'poppy']) expect(back.npcs[id].goal, id).toEqual(s.npcs[id].goal)
  })
})

describe('일과 조건과 상대 (시험용 내용)', () => {
  const lunch = (who: string, other: string, x: number) => ({ at: { x, y: 17 }, when: { from: 720, to: 780 }, doing: 'bread' as const, with: other, mutter: [`${who} 점심`] })
  const DATA: PeopleData = {
    people: {
      tilly: {
        id: 'tilly',
        pace: 1,
        routines: [
          { at: { x: 41, y: 22 }, when: { from: 420, to: 700 }, doing: 'hammer' },
          // 이야기 뒤 생긴 일과 (같은 때의 평소 일과를 덮는다)
          { at: { x: 37, y: 26 }, when: { from: 420, to: 700 }, doing: 'rest', req: { story: [{ id: 'tillyHook' }] } },
          lunch('tilly', 'wendell', 2),
        ],
        lines: [],
      },
      wendell: {
        id: 'wendell',
        pace: 1,
        routines: [
          { at: { x: 1, y: 17 }, when: { from: 360, to: 700 }, doing: 'bread', req: { notStory: ['wendellPath'] } },
          lunch('wendell', 'tilly', 1),
        ],
        lines: [],
        events: [{ id: 'wTest', title: '시험', stage: 0, at: { x: 6, y: 18 }, when: { from: 700, to: 800 }, req: { memory: ['never'] }, lines: [{ speaker: 'wendell', text: '…' }] }],
      },
    },
    threads: [],
  }
  beforeEach(() => setPeopleData(DATA))
  afterAll(() => setPeopleData(PEOPLE))

  const d = dayWhere(['tilly', 'wendell'], (d) => dry(d) && !isMarketDay(d))

  it('req가 맞지 않는 일과는 고르지 않는다 — 이야기 뒤 생긴 일과·사라진 일과', () => {
    const s = at(base(), d, 600)
    expect(routineOf(s, 'tilly')?.doing).toBe('hammer')
    expect(routineOf({ ...s, flags: { ...s.flags, 'story:tillyHook': 1 } }, 'tilly')?.doing).toBe('rest')
    expect(routineOf(s, 'wendell')?.doing).toBe('bread')
    expect(routineOf({ ...s, flags: { ...s.flags, 'story:wendellPath': 1 } }, 'wendell')).toBeNull()
  })

  it('상대가 이야기(이벤트) 자리에 가 있으면 함께하는 일과를 건너뛴다', () => {
    const s = at(base(), d, 730)
    expect(routineOf(s, 'tilly')?.with).toBe('wendell')
    // 웬델에게 이벤트가 열리면 웬델은 이벤트 자리로 — 틸리는 혼자 기다리지 않는다
    const life = { ...s.life, memories: { wendell: [{ tag: 'never', day: 1, weather: 'sunny' as const, season: 'spring' as const }] } }
    const busy = { ...s, life }
    expect(goalOf(busy, 'wendell')).toEqual({ x: 6, y: 18 })
    expect(routineOf(busy, 'tilly')?.with).toBeUndefined()
    expect(goalOf(busy, 'tilly')).toEqual({ x: 41, y: 22 })
  })

  it('곁에 상대가 있으면 첫마디는 둘의 한 줄 (상대 이름과 함께)', () => {
    const s = settle(at(base(), d, 730), CONTENT)
    expect(mutterWaiting(s, 'tilly')).toBe('tilly 점심')
    expect(mutterPartner(s, 'tilly')).toBe('wendell')
    // 화면 한 줄: 상대 이름(역할 이름)과 함께
    expect(fill(T.people.together, { other: neighborById('wendell')!.role, text: 'tilly 점심' })).toBe(`${neighborById('wendell')!.role}, tilly 점심`)
    // 상대가 자리에 없으면 혼잣말 그대로
    const gone = { ...s, npcs: { ...s.npcs, wendell: { ...s.npcs.wendell, visible: false } } }
    expect(mutterPartner(gone, 'tilly')).toBeNull()
  })
})
