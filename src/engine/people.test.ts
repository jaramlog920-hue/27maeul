// 계획 6b: 살아 움직이는 사람들 — 일과·목격·마을 사건·기억·말·사이 단계·조건 이벤트
import { CONTENT, PEOPLE } from '../content/catalog'
import { isWet, weatherOf } from './calendar'
import { chooseInEvent, eventNow, goToSleep, greetNeighbor, newGame, personLine, routineOf, stageWith, tick, type GameState } from './game'
import {
  depthOf,
  hasMemory,
  isOffDay,
  pickLine,
  routineNow,
  setPeopleData,
  stageOfPoints,
  STAGE_POINTS,
  threadPhase,
  topColor,
  whenMatches,
  NO_LIFE,
  type PeopleData,
  type Person,
} from './people'

const zero = () => 0
const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { ...s.clock, day, minute } })

/** 시험용 사람: 틸리 자리에 (틸리는 이미 이웃으로 있다 — 대장간 집안, 문 46,23) */
const TEST: Person = {
  id: 'tilly',
  pace: 1,
  dislikes: ['fig'],
  routines: [
    { at: { x: 32, y: 26 }, when: { from: 420, to: 1140 }, doing: 'hammer', mutter: ['쇠는 달궜을 때.'] },
    { at: { x: 21, y: 32 }, when: { from: 420, to: 1140, weather: ['wet'] }, doing: 'rest' },
    { at: { x: 27, y: 16 }, when: { from: 420, to: 1140, days: [0] }, doing: 'wait' },
  ],
  lines: [
    { id: 'a', text: '처음 말', depth: 0 },
    { id: 'b', text: '둘째 말', depth: 0 },
    { id: 'rain', text: '이런 날씨면 그날 생각나요.', depth: 1, when: { weather: ['wet'] }, req: { memory: ['rain'] } },
    { id: 'deep', text: '깊은 말', depth: 2 },
    { id: 'cold', text: '…네.', depth: 0, cool: true },
  ],
  sightings: [{ id: 'bird', title: '밤의 대장간', at: { x: 34, y: 27 }, when: { from: 1320, to: 1380 }, lines: [{ speaker: 'narration', text: '새' }], memory: 'saw:bird' }],
  events: [
    {
      id: 'first',
      title: '풀무',
      stage: 1,
      at: { x: 32, y: 26 },
      when: { from: 600, to: 900 },
      lines: [{ speaker: 'tilly', text: '밟아 볼래요?' }],
      choices: [
        { label: '밟는다', color: 'warm', memory: 'bellows', reply: [{ speaker: 'tilly', text: '잘하네요!' }] },
        { label: '웃는다', color: 'tease', reply: [{ speaker: 'tilly', text: '뭐가 웃겨요!' }], promise: { id: 'lake', at: { x: 21, y: 32 }, from: 1080, to: 1200 } },
      ],
      gain: 6,
      opens: 3,
    },
  ],
}
const DATA: PeopleData = {
  people: { tilly: TEST },
  threads: [{ id: 'quarrel', end: 20, phases: [{ day: 10, routines: { tilly: [{ at: { x: 22, y: 32 }, when: { from: 1080, to: 1260 }, doing: 'rest' }] } }, { day: 13 }] }],
}

beforeEach(() => setPeopleData(DATA))
afterAll(() => setPeopleData(PEOPLE))

describe('조건과 단계 (people.ts)', () => {
  it('때·요일·날씨·계절 — 자정을 넘기는 창도', () => {
    const m = { day: 7, minute: 23 * 60, weather: 'rain' as const, season: 'spring' as const }
    expect(whenMatches({ from: 22 * 60, to: 60 }, m)).toBe(true)
    expect(whenMatches({ days: [0], weather: ['wet'] }, m)).toBe(true)
    expect(whenMatches({ weather: ['dry'] }, m)).toBe(false)
    expect(whenMatches({ season: ['winter'] }, m)).toBe(false)
  })
  it('사이 단계: 점수로 여섯 단계, 말의 깊이는 넷', () => {
    expect(STAGE_POINTS).toEqual([0, 5, 15, 30, 55, 75])
    expect(stageOfPoints(0)).toBe(0)
    expect(stageOfPoints(30)).toBe(3)
    expect(stageOfPoints(100)).toBe(5)
    expect(depthOf(0, false)).toBe(0)
    expect(depthOf(3, false)).toBe(1)
    expect(depthOf(4, false)).toBe(2)
    expect(depthOf(1, true)).toBe(3)
  })
  it('일과: 마을 사건 > 평소, 평소 중엔 조건이 구체적인 것 (비 오는 날·장날)', () => {
    const m = { day: 2, minute: 600, weather: 'sunny' as const, season: 'spring' as const }
    expect(routineNow(TEST, m, DATA.threads)?.doing).toBe('hammer')
    expect(routineNow(TEST, { ...m, weather: 'rain' }, DATA.threads)?.doing).toBe('rest')
    expect(routineNow(TEST, { ...m, day: 7 }, DATA.threads)?.doing).toBe('wait')
    expect(routineNow(TEST, { ...m, day: 11, minute: 1100 }, DATA.threads)?.at).toEqual({ x: 22, y: 32 })
    expect(threadPhase(DATA.threads[0], 9)).toBe(-1)
    expect(threadPhase(DATA.threads[0], 14)).toBe(1)
    expect(threadPhase(DATA.threads[0], 20)).toBe(2)
  })
  it('벗어나는 날은 날 씨앗으로 가끔', () => {
    const p = { ...TEST, offDays: { chance: 0.2, routines: [] } }
    const n = [...Array(300).keys()].filter((d) => isOffDay(p, d)).length
    expect(n).toBeGreaterThan(30)
    expect(n).toBeLessThan(100)
  })
  it('말 고르기: 최근 한 말은 건너뛰고, 기억·날씨가 맞는 말을 먼저, 서먹할 땐 서먹한 말만', () => {
    const m = { day: 3, minute: 600, weather: 'rain' as const, season: 'spring' as const }
    const base = { life: NO_LIFE, npc: 'tilly', day: 3, lover: false, suitor: true, threads: [], m, depth: 1, cool: false, here: { x: 0, y: 0 } }
    expect(pickLine(TEST, base, 0)?.id).not.toBe('rain')
    const withRain = { ...NO_LIFE, memories: { tilly: [{ tag: 'rain', day: 1, weather: 'rain' as const, season: 'spring' as const }] } }
    expect(pickLine(TEST, { ...base, life: withRain }, 0)?.id).toBe('rain')
    expect(pickLine(TEST, { ...base, life: { ...withRain, recent: { tilly: ['rain'] } } }, 0)?.id).not.toBe('rain')
    expect(pickLine(TEST, { ...base, cool: true }, 0)?.id).toBe('cold')
  })
})

describe('게임 안에서 (game.ts)', () => {
  const joined = (s: GameState) => s // 틸리 집안(대장간)은 처음부터

  it('말을 걸기 전에도 일과 자리로 걸어가 일한다 (머리 위 그림은 routineOf)', () => {
    let s = joined(at(newGame(CONTENT), 2, 600))
    for (let i = 0; i < 1500 && !(Math.round(s.npcs.tilly.x) === 32 && Math.round(s.npcs.tilly.y) === 26); i++) {
      s = tick(s, 0.1, zero, CONTENT).state
      s = { ...s, clock: { ...s.clock, minute: 600 } }
    }
    expect({ x: Math.round(s.npcs.tilly.x), y: Math.round(s.npcs.tilly.y) }).toEqual({ x: 32, y: 26 })
    expect(routineOf(s, 'tilly')?.doing).toBe('hammer')
  })

  it('가까이 지나가면 혼잣말이 하루 한 번 들린다', () => {
    const base = at(newGame(CONTENT), 2, 600)
    const s = { ...base, npcs: { ...base.npcs, tilly: { ...base.npcs.tilly, x: 32, y: 26, visible: true, path: [] } }, player: { ...base.player, x: 32, y: 27, path: [] } }
    const r = tick(s, 0.02, zero, CONTENT)
    expect(r.events).toContainEqual({ type: 'mutter', npc: 'tilly', text: '쇠는 달궜을 때.' })
    expect(tick(r.state, 0.02, zero, CONTENT).events.some((e) => e.type === 'mutter')).toBe(false)
  })

  it('이벤트: 사이·자리·때가 맞으면 곁에 갔을 때 열린다 — 고른 말은 기억·색·약속으로 남는다 (정답 없음)', () => {
    const base = { ...at(newGame(CONTENT), 2, 700), hearts: { tilly: 10 } }
    expect(eventNow(base, 'tilly')?.id).toBe('first')
    expect(eventNow({ ...base, hearts: {} }, 'tilly')).toBeNull()
    const s = { ...base, npcs: { ...base.npcs, tilly: { ...base.npcs.tilly, x: 32, y: 26, visible: true, path: [] } }, player: { ...base.player, x: 33, y: 27, path: [] } }
    const r = tick(s, 0.02, zero, CONTENT).state
    expect(r.scenes).toContain('ev:first')
    expect(r.life.seen).toContain('first')
    expect(r.hearts.tilly).toBe(16)
    const warm = chooseInEvent(r, 'first', 0)
    expect(hasMemory(warm.life, 'tilly', 'bellows')).toBe(true)
    expect(topColor(warm.life, 'tilly')).toBe('warm')
    const tease = chooseInEvent(r, 'first', 1)
    expect(topColor(tease.life, 'tilly')).toBe('tease')
    expect(tease.life.promises).toHaveLength(1)
  })

  it('약속: 다음 날 그 시각 그 자리에 가면 지킨 것, 잊으면 며칠 서먹 — 서먹할 땐 마음이 반만 오른다', () => {
    const base = { ...at(newGame(CONTENT), 2, 700), hearts: { tilly: 16 } }
    const promised = chooseInEvent({ ...base, life: { ...NO_LIFE, seen: ['first'] } }, 'first', 1)
    // 지킨다
    const kept = tick({ ...at(promised, 3, 1100), player: { ...promised.player, x: 21, y: 32, path: [] } }, 0.02, zero, CONTENT)
    expect(kept.events).toContainEqual({ type: 'promiseKept', npc: 'tilly' })
    expect(hasMemory(kept.state.life, 'tilly', 'kept:lake')).toBe(true)
    // 잊는다
    const forgot = goToSleep(at(promised, 3, 23 * 60), CONTENT)
    expect(hasMemory(forgot.life, 'tilly', 'forgot:lake')).toBe(true)
    expect(forgot.life.cool.tilly).toBeGreaterThanOrEqual(forgot.clock.day)
    const before = forgot.hearts.tilly ?? 0
    const greeted = greetNeighbor(forgot, 'tilly')
    expect((greeted.hearts.tilly ?? 0) - before).toBe(1)
  })

  it('문턱: 친구가 되려면 그 사람의 이벤트를 겪어야 한다 — 인사만으로는 문턱 바로 아래에서 멈춘다', () => {
    let s: GameState = { ...at(newGame(CONTENT), 2, 700), hearts: { tilly: 28 } }
    for (let d = 0; d < 10; d++) s = greetNeighbor({ ...s, talked: [] }, 'tilly')
    expect(s.hearts.tilly).toBe(STAGE_POINTS[3] - 1)
    expect(stageWith(s, 'tilly')).toBe(2)
    const opened = { ...s, life: { ...s.life, seen: ['first'] } }
    expect(stageWith(greetNeighbor({ ...opened, talked: [] }, 'tilly'), 'tilly')).toBe(3)
  })

  it('목격: 그 사람은 보든 안 보든 그 시각 그 자리에 가고, 곁에 있으면 엿보게 된다 — 기억이 남는다', () => {
    const base = at(newGame(CONTENT), 2, 1330)
    const s = { ...base, npcs: { ...base.npcs, tilly: { ...base.npcs.tilly, x: 34, y: 27, visible: true, path: [] } }, player: { ...base.player, x: 33, y: 29, path: [] } }
    const r = tick(s, 0.02, zero, CONTENT).state
    expect(r.scenes).toContain('saw:bird')
    expect(hasMemory(r.life, 'tilly', 'saw:bird')).toBe(true)
  })

  it('비 오는 날 말을 걸면 그날이 기억에 남고, 싫어하는 선물은 웃음거리로 남는다', () => {
    const wetDay = [...Array(60).keys()].map((d) => d + 1).find((d) => isWet(weatherOf(d)))!
    const s = { ...at(newGame(CONTENT), wetDay, 700), hearts: { tilly: 6 } }
    expect(hasMemory(greetNeighbor(s, 'tilly').life, 'tilly', 'rain')).toBe(true)
    const line = personLine({ ...greetNeighbor(s, 'tilly'), hearts: { tilly: 20 } }, 'tilly', 0)
    expect(line?.text).toBe('이런 날씨면 그날 생각나요.')
    expect(line?.state.life.recent.tilly).toContain('rain')
  })
})
