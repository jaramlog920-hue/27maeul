// 계획 16 작업 4: 이야기 이후의 변화 — 완료 표식 하나(story:<id> + 갈래)로 소품·일과·행동·말이 함께, 손일 함께하기
import { CONTENT, PEOPLE } from '../content/catalog'
import {
  chooseInEvent,
  eventNow,
  finishStoryMini,
  newGame,
  openEvent,
  personLine,
  routineOf,
  settle,
  storyPropsNow,
  storyResume,
  storyWaiting,
  type GameState,
} from './game'
import { count } from './items'
import { hasMemory, NO_LIFE, reqMet, sanitizeLife, setPeopleData, type PeopleData, type SceneLine } from './people'
import type { Tile } from './types'
import { deserialize, serialize } from './save'
import { isWet, weatherOf } from './calendar'
import { seasonOf } from './clock'
import { HOME_FRONT, propFootprint, propSpotProblem, ROOMS, tileAt, VILLAGE_H, WIDTH } from './world'

const say = (speaker: string, text = '…'): SceneLine => ({ speaker, text })
const SHOP: Tile = { x: 6, y: 24 }
const CHAIR: Tile = { x: 8, y: 84 }
const BAKERY: Tile = { x: 1, y: 17 }

/** 시험용 이야기 둘: 목수(손일을 함께하는 두 사건 → 완료), 웬델(갈래 둘) */
const DATA: PeopleData = {
  people: {
    carpenter: {
      id: 'carpenter',
      pace: 1,
      routines: [
        { at: SHOP, when: { from: 420, to: 1140 }, doing: 'wood' },
        { at: { x: 7, y: 84 }, when: { from: 1140, to: 1200 }, doing: 'rest', req: { story: [{ id: 'tChair' }] } },
      ],
      lines: [
        { id: 'plain', text: '평소 말', depth: 0 },
        { id: 'after', text: '의자 뒤 말', depth: 0, req: { story: [{ id: 'tChair' }] } },
      ],
      events: [
        {
          id: 'carpenter:story:1', title: '의자', stage: 0, at: SHOP, lines: [say('carpenter')],
          choices: [
            { label: '구경', color: 'quiet', reply: [say('carpenter')] },
            { label: '같이', color: 'warm', mini: 'hold', reply: [say('rudy')] },
          ],
        },
        {
          id: 'carpenter:story:2', title: '완성', stage: 0, at: SHOP, req: { seen: ['carpenter:story:1'] }, completes: 'tChair', keepsake: 'stool',
          lines: [say('carpenter'), say('rudy'), say('narration')],
          choices: [
            { label: '곁에', color: 'quiet', reply: [say('carpenter')] },
            { label: '같이 다듬기', color: 'warm', mini: 'order', reply: [say('smith')] },
          ],
        },
      ],
      props: [{ id: 'tChairProp', room: 'carpenter', at: CHAIR, item: 'chair', req: { story: [{ id: 'tChair' }] } }],
    },
    wendell: {
      id: 'wendell',
      pace: 1,
      routines: [],
      lines: [
        { id: 'w0', text: '빵 갈래 말', depth: 0, req: { story: [{ id: 'tPath', outcome: 0 }] } },
        { id: 'w1', text: '바깥 갈래 말', depth: 0, req: { story: [{ id: 'tPath', outcome: 1 }] } },
      ],
      events: [
        {
          id: 'wendell:story:1', title: '길', stage: 0, at: BAKERY, completes: 'tPath', lines: [say('wendell')],
          choices: [
            { label: '듣기', color: 'quiet', outcome: 0, reply: [say('wendell')] },
            { label: '묻기', color: 'honest', outcome: 1, reply: [say('wendell')] },
          ],
        },
      ],
      props: [
        { id: 'tray', at: { x: 2, y: 18 }, art: 'breadTray', req: { story: [{ id: 'tPath', outcome: 0 }] } },
        { id: 'sched', at: { x: 2, y: 18 }, art: 'schedule', req: { story: [{ id: 'tPath', outcome: 1 }] } },
      ],
    },
  },
  threads: [],
}

beforeEach(() => setPeopleData(DATA))
afterAll(() => setPeopleData(PEOPLE))

const MOVED = { 'movedIn:carpenter': 1 }
const at = (s: GameState, minute: number): GameState => ({ ...s, clock: { ...s.clock, minute } })
/** 이웃을 그 칸에 세운다 (말을 걸 수 있게) */
const stand = (s: GameState, npc: string, t: Tile): GameState => ({ ...s, npcs: { ...s.npcs, [npc]: { ...s.npcs[npc], x: t.x, y: t.y, visible: true, path: [] } } })
function start(): GameState {
  const s = settle(newGame(CONTENT), CONTENT)
  return { ...s, flags: { ...s.flags, ...MOVED }, clock: { ...s.clock, day: 40, minute: 600 } }
}
const open = (s: GameState, npc: string, t: Tile) => openEvent(stand(s, npc, t), npc)!
const ids = (s: GameState) => storyPropsNow(s).map((p) => p.id)

/** 목수 이야기를 끝까지 (첫 사건은 구경, 마지막은 함께 다듬기 → 손일 끝) */
function finishChair(s: GameState): GameState {
  let g = chooseInEvent(open(s, 'carpenter', SHOP), 'carpenter:story:1', 0)
  g = chooseInEvent(open(g, 'carpenter', SHOP), 'carpenter:story:2', 1)
  return finishStoryMini(g)
}

describe('완료 표식 하나로 함께 바뀐다', () => {
  it('완료 → 같은 날 소품·일과·말이 함께 바뀐다, 완료 전에는 소품·말·일과 모두 없다', () => {
    const s = start()
    expect(ids(s)).toEqual([])
    expect(routineOf(at(s, 1150), 'carpenter')?.doing).not.toBe('rest')
    expect(personLine(s, 'carpenter', 0)?.text).toBe('평소 말')
    const done = finishChair(s)
    expect(done.flags['story:tChair']).toBe(1)
    expect(ids(done)).toEqual(['tChairProp'])
    expect(routineOf(at(done, 1150), 'carpenter')?.doing).toBe('rest')
    expect(personLine(done, 'carpenter', 0)?.text).toBe('의자 뒤 말')
  })

  it('참여한 주민(장면에 실제로 나온 이웃)에게만 경험 story:<id> — 해설·나오지 않은 이웃은 없음', () => {
    const done = finishChair(start())
    expect(done.life.experiences['story:tChair']).toMatchObject({ kind: 'story', count: 1, first: 40 })
    // 마지막 사건: 목수·루디가 장면에, 고른 대답에 대장장이
    expect(done.life.experiences['story:tChair'].with.sort()).toEqual(['carpenter', 'rudy', 'smith'])
    expect(hasMemory(done.life, 'rudy', 'exp:story:tChair')).toBe(true)
    expect(hasMemory(done.life, 'wendell', 'exp:story:tChair')).toBe(false)
  })

  it('남는 물건은 가방에 하나 (장식이 아니라 — 집 꾸미기로 놓는다)', () => {
    const s = start()
    expect(count(finishChair(s).inv, 'stool') - count(s.inv, 'stool')).toBe(1)
  })

  it('저장·불러오기 뒤에도 소품·일과·말이 그대로', () => {
    const back = deserialize(serialize(finishChair(start())), CONTENT)!
    expect(back.flags['story:tChair']).toBe(1)
    expect(ids(back)).toEqual(['tChairProp'])
    expect(routineOf(at(back, 1150), 'carpenter')?.doing).toBe('rest')
    expect(personLine(back, 'carpenter', 0)?.text).toBe('의자 뒤 말')
  })

  it('주인이 이사 오기 전이면 표식이 있어도 소품이 보이지 않는다', () => {
    const done = finishChair(start())
    expect(ids({ ...done, flags: { ...done.flags, 'movedIn:carpenter': 0 } })).toEqual([])
  })
})

describe('손일을 함께하는 사건 (Choice.mini)', () => {
  it('고르면 손일이 남고, 끝나기 전에는 다음 사건이 열리지 않는다 — 끝나면(잘했든 못했든) 다음으로', () => {
    const s = chooseInEvent(open(start(), 'carpenter', SHOP), 'carpenter:story:1', 1)
    expect(storyResume(s, 'carpenter')).toEqual({ event: 'carpenter:story:1', mini: 'hold' })
    expect(eventNow(s, 'carpenter')).toBeNull()
    // 놀이는 점수를 넘기지 않는다 — 끝나기만 하면 된다 (실패해도)
    const after = finishStoryMini(s)
    expect(after.life.storyWait).toBeNull()
    expect(eventNow(after, 'carpenter')?.id).toBe('carpenter:story:2')
  })

  it('놀이 도중 나가면 다시 말을 걸 때 그 사건 앞에서 이어 간다 (마음·장면은 다시 오르지 않는다)', () => {
    const s = chooseInEvent(open(start(), 'carpenter', SHOP), 'carpenter:story:1', 1)
    // 저장하고 나갔다 와도
    const back = stand(deserialize(serialize(s), CONTENT)!, 'carpenter', { x: 20, y: 20 })
    expect(storyResume(back, 'carpenter')?.mini).toBe('hold')
    expect(storyWaiting(back, 'carpenter')).toBe(true)
    expect(back.scenes.filter((x) => x === 'ev:carpenter:story:1')).toHaveLength(1)
    // 이어 갈 자리는 하나 — 다른 이웃의 이어 갈 사건은 이것을 마친 뒤에 열린다 (덮어써서 잃지 않게)
    expect(eventNow(stand(back, 'wendell', BAKERY), 'wendell')).toBeNull()
    expect(eventNow(stand(finishStoryMini(back), 'wendell', BAKERY), 'wendell')?.id).toBe('wendell:story:1')
  })

  it('놀이 실패해도 완료 — 마지막 사건의 손일이 끝나야 표식, 그 전에는 소품도 없다', () => {
    let g = finishStoryMini(chooseInEvent(open(start(), 'carpenter', SHOP), 'carpenter:story:1', 1))
    g = chooseInEvent(open(g, 'carpenter', SHOP), 'carpenter:story:2', 1)
    expect(g.flags['story:tChair']).toBeUndefined()
    expect(ids(g)).toEqual([])
    g = finishStoryMini(g)
    expect(g.flags['story:tChair']).toBe(1)
    expect(ids(g)).toEqual(['tChairProp'])
  })

  it('고를 말이 남은 채 나가면(창을 닫기 전 재접속) 장면을 다시 열어 고를 수 있다', () => {
    const s = open(start(), 'wendell', BAKERY)
    const back = stand(deserialize(serialize(s), CONTENT)!, 'wendell', BAKERY)
    expect(storyResume(back, 'wendell')).toEqual({ event: 'wendell:story:1' })
    const done = chooseInEvent(back, 'wendell:story:1', 1)
    expect(done.flags['story:tPath']).toBe(2)
    expect(storyResume(done, 'wendell')).toBeNull()
  })
})

describe('갈래와 덮어쓰기', () => {
  it('갈래 둘은 서로 다른 모습만 (소품·말이 섞이지 않는다)', () => {
    const s = start()
    const a = chooseInEvent(open(s, 'wendell', BAKERY), 'wendell:story:1', 0)
    const b = chooseInEvent(open(s, 'wendell', BAKERY), 'wendell:story:1', 1)
    expect(a.flags['story:tPath']).toBe(1)
    expect(b.flags['story:tPath']).toBe(2)
    expect(ids(a)).toEqual(['tray'])
    expect(ids(b)).toEqual(['sched'])
    expect(personLine(a, 'wendell', 0)?.text).toBe('빵 갈래 말')
    expect(personLine(b, 'wendell', 0)?.text).toBe('바깥 갈래 말')
  })

  it('한 번 끝난 이야기의 결과는 다시 바뀌지 않는다 (같은 표식 하나, 경험도 한 번)', () => {
    const a = chooseInEvent(open(start(), 'wendell', BAKERY), 'wendell:story:1', 0)
    const again = chooseInEvent(a, 'wendell:story:1', 1)
    expect(again.flags['story:tPath']).toBe(1)
    expect(again.life.experiences['story:tPath'].count).toBe(1)
  })

  it('한 주민의 이야기 결과가 다른 주민의 결과(표식·해금·사건 단계·본 사건)를 덮어쓰지 않는다', () => {
    const s0 = start()
    const before: Record<string, number> = { 'story:tPath': 2, 'unlock:lanterns': 1, 'done:friends': 1, 'story:other': 1 }
    const s = { ...s0, flags: { ...s0.flags, ...before }, life: { ...s0.life, seen: ['wendell:story:1', 'tilly:quarrel'] } }
    const done = finishChair(s)
    for (const [k, v] of Object.entries(before)) expect(done.flags[k], k).toBe(v)
    expect(done.life.seen).toEqual(expect.arrayContaining(['wendell:story:1', 'tilly:quarrel']))
    const changed = Object.keys(done.flags).filter((k) => done.flags[k] !== s.flags[k])
    expect(changed).toEqual(['story:tChair'])
  })
})

describe('옛 저장', () => {
  it('이어 갈 사건(storyWait)·완료 표식이 없는 옛 저장도 그대로 열린다', () => {
    const s = start()
    const raw = JSON.parse(serialize({ ...s, life: { ...NO_LIFE, seen: ['carpenter:story:1'] } }))
    delete raw.life.storyWait
    delete raw.life.experiences
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(back.life.storyWait).toBeNull()
    expect(back.life.seen).toEqual(['carpenter:story:1'])
    // 옛 저장에서 이미 본 첫 사건은 다 본 것 — 다음 사건이 열린다
    expect(eventNow(stand(back, 'carpenter', SHOP), 'carpenter')?.id).toBe('carpenter:story:2')
  })

  it('모양이 틀린 storyWait는 버린다', () => {
    expect(sanitizeLife({ ...NO_LIFE, storyWait: { event: 3 } }).storyWait).toBeNull()
    expect(sanitizeLife({ ...NO_LIFE, storyWait: { event: 'a', npc: 'b', mini: 'hold' } }).storyWait).toBeNull()
    expect(sanitizeLife({ ...NO_LIFE, storyWait: { event: 'a', npc: 'b', mini: 'hold', choice: 1 } }).storyWait).toEqual({ event: 'a', npc: 'b', mini: 'hold', choice: 1 })
  })
})

describe('소품 자리 검사 (propSpotProblem)', () => {
  const room = ROOMS.find((r) => r.owner === 'carpenter')!
  it('그 집 방 맨바닥은 된다', () => {
    expect(propSpotProblem(propFootprint(CHAIR, 'chair'), 'carpenter')).toBeNull()
  })
  it('들어와 서는 칸·주인 자리·가구 칸·다른 집 방은 안 된다', () => {
    expect(propSpotProblem([room.entry], 'carpenter')).toBe('entryOrSeat')
    expect(propSpotProblem([room.sit], 'carpenter')).toBe('entryOrSeat')
    expect(propSpotProblem([{ x: room.x0 + 3, y: room.y0 + 4 }], 'carpenter')).toBe('notFloor')
    expect(propSpotProblem(propFootprint(CHAIR, 'chair'), 'baker')).toBe('notFloor')
  })
  it('방을 가로막아 어떤 바닥에 닿지 못하게 하면 안 된다', () => {
    // 목수 방 셋째 줄을 가로로 다 막으면 맨 윗줄 바닥에 닿지 못한다
    const row = Array.from({ length: room.w - 2 }, (_, i) => ({ x: room.x0 + 1 + i, y: room.y0 + 2 }))
    expect(row.every((t) => tileAt(t.x, t.y) === 'f')).toBe(true)
    expect(propSpotProblem(row, 'carpenter')).toBe('blocksWay')
  })
  it('바깥: 길·문 곁·누르는 곳은 안 된다', () => {
    let path: Tile | null = null
    for (let y = 1; y < VILLAGE_H && !path; y++) for (let x = 1; x < WIDTH && !path; x++) if (tileAt(x, y) === ',') path = { x, y }
    expect(propSpotProblem([path!])).toBe('onWay')
    expect(propSpotProblem([{ x: ROOMS[0].door.x + 1, y: ROOMS[0].door.y }])).not.toBeNull()
    expect(propSpotProblem([HOME_FRONT])).not.toBeNull()
  })
})

describe('화면 흐름 (game-store)', () => {
  it('손일을 고른 장면을 닫으면 바로 그 놀이가 열리고, 도중에 나가도 이어 갈 사건은 남는다', async () => {
    const { useGame } = await import('../store/game-store')
    const s = chooseInEvent(open(start(), 'carpenter', SHOP), 'carpenter:story:1', 1)
    useGame.setState({ game: s, modal: { kind: 'scene', id: 'ev:carpenter:story:1', chosen: 1 } })
    useGame.getState().nextScene()
    const m = useGame.getState().modal
    expect(m?.kind).toBe('mini')
    expect(m?.kind === 'mini' && m.pending).toEqual({ kind: 'story', event: 'carpenter:story:1', npc: 'carpenter' })
    useGame.getState().quitMini()
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().game.life.storyWait?.mini).toBe('hold')
  })
})

describe('목수의 자기 의자 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const step = (s: GameState, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, 'carpenter', t)
  const ready = (): GameState => ({ ...start(), hearts: { carpenter: 20 }, life: { ...NO_LIFE } })

  it('발견부터 손일까지, 다음 날 차와 완료 흔적, 저장 뒤 재방문까지 이어진다', () => {
    let s = ready()
    expect(storyPropsNow(s).some((p) => p.id === 'carpenterChair')).toBe(false)
    s = chooseInEvent(openEvent(step(s, 38, 980, SHOP), 'carpenter')!, 'carpenter:story:1', 0)
    s = chooseInEvent(openEvent(step(s, 39, 800, SHOP), 'carpenter')!, 'carpenter:story:2', 1)
    const forge = { x: 44, y: 23 }
    s = step(s, 39, 980, forge) // day % 7 = 4
    expect(eventNow(stand(stand(s, 'smith', { x: 20, y: 20 }), 'rudy', { x: 44, y: 22 }), 'carpenter')).toBeNull()
    expect(eventNow(stand(stand(s, 'smith', { x: 43, y: 22 }), 'rudy', { x: 20, y: 20 }), 'carpenter')).toBeNull()
    s = stand(stand(s, 'smith', { x: 43, y: 22 }), 'rudy', { x: 44, y: 22 })
    expect(eventNow(s, 'carpenter')?.id).toBe('carpenter:story:3')
    s = chooseInEvent(openEvent(s, 'carpenter')!, 'carpenter:story:3', 0)
    expect(s.life.storyWait?.mini).toBe('hold')
    s = finishStoryMini(s) // 성공 점수 조건 없이
    expect(s.life.experiences['choice:carpenter:story:3'].with.sort()).toEqual(['carpenter', 'rudy', 'smith'])
    s = step(s, 39, 1150, { x: 7, y: 84 })
    s = stand(s, 'rudy', { x: 7, y: 85 })
    expect(eventNow(s, 'carpenter')).toBeNull() // 같은 날 완성 장면이 끼어들지 않는다
    s = step(s, 40, 1150, { x: 7, y: 84 })
    s = chooseInEvent(openEvent(s, 'carpenter')!, 'carpenter:story:4', 2)
    expect(s.flags['story:carpenterChair']).toBe(1)
    expect(storyPropsNow(s).some((p) => p.id === 'carpenterChair')).toBe(true)
    expect(s.life.experiences['story:carpenterChair'].with.sort()).toEqual(['carpenter', 'rudy'])
    expect(s.life.experiences['story:carpenterChair'].count).toBe(1)
    // 사랑방 손님·잔치에 가는 날은 함께하는 일과가 양보한다. 둘 다 한가한 저녁에는 같은 방에서 쉰다.
    const free = Array.from({ length: 30 }, (_, i) => step(s, 41 + i, 1150, { x: 7, y: 84 })).find((g) => routineOf(g, 'carpenter')?.with === 'rudy')
    expect(free).toBeDefined()
    expect(routineOf(free!, 'carpenter')?.doing).toBe('tea')
    expect(routineOf(free!, 'rudy')?.with).toBe('carpenter')
    const back = deserialize(serialize(s), CONTENT)!
    expect(storyPropsNow(back).some((p) => p.id === 'carpenterChair')).toBe(true)
    expect(personLine(step(back, 41, 1150, { x: 7, y: 84 }), 'carpenter', 0)?.text).toBe('새 부탁은 내일 살펴보겠소. 오늘은 내 의자에서 쉬는 시간이오.')
  })

  it('날짜 미상 옛 선택은 이미 본 사건을 보존하고, 남은 사건을 이어 간다', () => {
    const life = { ...NO_LIFE, seen: ['carpenter:story:3'] }
    const ctx = { life, npc: 'carpenter', day: 40, threads: [], lover: false, suitor: false }
    expect(reqMet({ after: { event: 'carpenter:story:3', days: 1 } }, ctx)).toBe(true)
    expect(reqMet({ after: { event: 'carpenter:story:2', days: 1 } }, ctx)).toBe(false)
  })
})

describe('빵 굽는 이웃의 쉬는 오후 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const bakery = { x: 6, y: 43 }, tea = { x: 45, y: 62 }
  const step = (s: GameState, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, 'baker', t)
  it('시식은 다음 날, 실제 교대 참여자만 기억하며, 쉬는 오후에 표지와 간식이 남는다', () => {
    let s: GameState = { ...start(), hearts: { baker: 40 } }
    s = chooseInEvent(openEvent(step(s, 36, 930, bakery), 'baker')!, 'baker:story:1', 0)
    expect(eventNow(step(s, 36, 800, bakery), 'baker')).toBeNull()
    s = chooseInEvent(openEvent(step(s, 37, 800, bakery), 'baker')!, 'baker:story:2', 1)
    s = step(s, 38, 500, bakery)
    expect(eventNow(stand(s, 'wendell', { x: 20, y: 20 }), 'baker')).toBeNull()
    s = stand(s, 'wendell', { x: 5, y: 43 })
    s = finishStoryMini(chooseInEvent(openEvent(s, 'baker')!, 'baker:story:3', 0))
    expect(s.life.experiences['choice:baker:story:3'].with.sort()).toEqual(['baker', 'wendell'])
    expect(s.flags['story:bakerRest']).toBeUndefined()
    s = stand(step(s, 45, 900, tea), 'poppy', { x: 44, y: 62 })
    s = chooseInEvent(openEvent(s, 'baker')!, 'baker:story:4', 0)
    expect(s.flags['story:bakerRest']).toBe(1)
    expect(s.life.experiences['story:bakerRest'].with.sort()).toEqual(['baker', 'poppy'])
    expect(storyPropsNow(s).filter((p) => p.npc === 'baker').map((p) => p.id).sort()).toEqual(['bakerRestSign', 'bakerSnack1'])
    expect(routineOf(s, 'baker')?.doing).toBe('tea')
    const back = deserialize(serialize(s), CONTENT)!
    expect(storyPropsNow(step(back, 46, 900, bakery)).some((p) => p.id === 'bakerRestSign')).toBe(false)
    expect(storyPropsNow(back).some((p) => p.id === 'bakerSnack1')).toBe(true)
  })
})

describe('일반 주민의 남는 이야기 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const ready = (npc: string): GameState => ({ ...start(), hearts: { [npc]: 40 }, flags: { ...start().flags, 'movedIn:weaver': 1 } })
  const step = (s: GameState, npc: string, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, npc, t)
  const dry = (from: number, weekday?: number) => Array.from({ length: 100 }, (_, i) => from + i).find((d) => !isWet(weatherOf(d)) && (weekday === undefined || d % 7 === weekday))!

  it('물 긷는 아이 사건은 우리 아이가 없어도 이어지고, 우리 아이 상태와 표식을 바꾸지 않는다', () => {
    let s = ready('child')
    const day = dry(70)
    s = chooseInEvent(openEvent(step(s, 'child', day, 650, { x: 8, y: 9 }), 'child')!, 'child:story:1', 2)
    const meeting = day + (3 - day % 7 + 7) % 7
    s = step(s, 'child', meeting, 930, { x: 7, y: 24 })
    expect(eventNow({ ...s, flags: { ...s.flags, 'movedIn:carpenter': 0 } }, 'child')?.id).not.toBe('child:story:2')
    s = stand(s, 'carpenter', { x: 6, y: 24 })
    s = finishStoryMini(chooseInEvent(openEvent(s, 'child')!, 'child:story:2', 0))
    s = chooseInEvent(openEvent(step(s, 'child', meeting, 1000, { x: 19, y: 46 }), 'child')!, 'child:story:3', 0)
    s = chooseInEvent(openEvent(step(s, 'child', meeting + 1, 1000, { x: 19, y: 46 }), 'child')!, 'child:story:4', 1)
    expect(s.child).toBeNull()
    expect(s.flags['story:childShelf']).toBe(1)
    expect(s.life.experiences['story:childShelf'].with).toEqual(['child'])
    expect(storyPropsNow(s).filter((p) => p.npc === 'child')).toHaveLength(1)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.child).toBeNull()
    expect(back.flags['story:childShelf']).toBe(1)
  })

  it('쉼터 이야기는 기존 벤치와 메리골드 사건을 보존하며, 참여한 목수와 실제 쉬는 사람의 기억을 나눈다', () => {
    let s = ready('grandpa')
    s = { ...s, flags: { ...s.flags, 'unlock:grandpaBench': 1 }, life: { ...s.life, seen: ['marigold:ledgerNew'] } }
    let day = dry(70)
    s = chooseInEvent(openEvent(step(s, 'grandpa', day, 930, { x: 41, y: 7 }), 'grandpa')!, 'grandpa:story:1', 0)
    s = stand(step(s, 'grandpa', day, 780, { x: 43, y: 9 }), 'marigold', { x: 43, y: 10 })
    s = chooseInEvent(openEvent(s, 'grandpa')!, 'grandpa:story:2', 0)
    day = dry(day + 1, 5)
    s = stand(step(s, 'grandpa', day, 930, { x: 41, y: 7 }), 'carpenter', { x: 40, y: 7 })
    s = finishStoryMini(chooseInEvent(openEvent(s, 'grandpa')!, 'grandpa:story:3', 0))
    s = stand(step(s, 'grandpa', dry(day + 1), 1040, { x: 41, y: 7 }), 'marigold', { x: 40, y: 7 })
    s = chooseInEvent(openEvent(s, 'grandpa')!, 'grandpa:story:4', 2)
    expect(s.flags['unlock:grandpaBench']).toBe(1)
    expect(s.life.seen).toContain('marigold:ledgerNew')
    expect(s.life.experiences['choice:grandpa:story:3'].with.sort()).toEqual(['carpenter', 'grandpa'])
    expect(s.life.experiences['story:grandpaShelter'].with.sort()).toEqual(['grandpa', 'marigold'])
    expect(storyPropsNow(s).filter((p) => p.npc === 'grandpa').map((p) => p.id)).toEqual(['grandpaShelterChair'])
  })

  it('상인은 네 장날을 따로 보내고, 개인 상자는 거래 재고가 되지 않으며 장날 외 소품이 없다', () => {
    let s = ready('merchant')
    const stall = { x: 21, y: 14 }
    s = chooseInEvent(openEvent(step(s, 'merchant', 70, 500, stall), 'merchant')!, 'merchant:story:1', 0)
    expect(eventNow(step(s, 'merchant', 70, 800, stall), 'merchant')?.id).not.toBe('merchant:story:2')
    s = chooseInEvent(openEvent(step(s, 'merchant', 77, 800, stall), 'merchant')!, 'merchant:story:2', 0)
    s = stand(step(s, 'merchant', 84, 730, stall), 'weaver', { x: 20, y: 14 })
    s = finishStoryMini(chooseInEvent(openEvent(s, 'merchant')!, 'merchant:story:3', 0))
    const inventory = s.inv
    s = stand(step(s, 'merchant', 91, 1100, { x: 45, y: 62 }), 'poppy', { x: 44, y: 62 })
    s = chooseInEvent(openEvent(s, 'merchant')!, 'merchant:story:4', 0)
    expect(s.inv).toEqual(inventory)
    expect(storyPropsNow(s).filter((p) => p.npc === 'merchant')).toHaveLength(2)
    expect(storyPropsNow(step(s, 'merchant', 92, 500, stall)).filter((p) => p.npc === 'merchant')).toHaveLength(0)
    expect(eventNow(step(s, 'merchant', 92, 500, stall), 'merchant')).toBeNull()
  })
})

describe('일반 주민 2 — 대장장이·양치기·기름 짜는 이웃·베 짜는 이웃 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const WEAVER_IN = { 'movedIn:weaver': 1 }
  const ready = (npc: string, flags: Record<string, number> = WEAVER_IN): GameState => ({ ...start(), hearts: { [npc]: 40 }, flags: { ...start().flags, ...flags } })
  const step = (s: GameState, npc: string, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, npc, t)
  const dry = (from: number, weekday?: number) => Array.from({ length: 200 }, (_, i) => from + i).find((d) => !isWet(weatherOf(d)) && (weekday === undefined || d % 7 === weekday))!
  const npcProps = (s: GameState, npc: string) => storyPropsNow(s).filter((p) => p.npc === npc).map((p) => p.id).sort()
  const lineReq = (npc: string, id: string) => PEOPLE.people[npc].lines.find((l) => l.id === id)!.req
  const ctxOf = (s: GameState, npc: string) => ({ life: s.life, npc, day: s.clock.day, threads: [], lover: false, suitor: false, flags: s.flags, stage: 3 as const })
  /** 함께하는 일과는 상대가 한가한 날에만 — 사랑방 손님·이야기가 없는 날을 찾는다 */
  const freeDay = (s: GameState, npc: string, from: number, minute: number, ok: (d: number) => boolean) =>
    Array.from({ length: 120 }, (_, i) => from + i).filter(ok).map((d) => ({ ...s, clock: { ...s.clock, day: d, minute } })).find((g) => routineOf(g, npc)?.with)

  it('대장장이: 대장간 다툼이 끝난 뒤 도안 → 목수와 고리 시험(손일 실패해도) → 쓸모와 모양, 도안 판·장식 고리와 겨울 저녁 지켜보기', () => {
    let s = ready('smith')
    const forge = { x: 43, y: 22 }
    // 다툼이 끝나기 전(날 18 전)에는 열리지 않는다 — 새 다툼을 만들지 않는 후속
    expect(eventNow(stand(step(s, 'smith', 12, 800, forge), 'tilly', { x: 41, y: 22 }), 'smith')?.id).not.toBe('smith:story:1')
    let day = dry(70)
    s = step(s, 'smith', day, 800, forge)
    expect(eventNow(stand(s, 'tilly', { x: 20, y: 20 }), 'smith')?.id).not.toBe('smith:story:1')
    s = chooseInEvent(openEvent(stand(s, 'tilly', { x: 41, y: 22 }), 'smith')!, 'smith:story:1', 0)
    expect(npcProps(s, 'smith')).toEqual([])
    day = dry(day + 1, 4)
    s = step(s, 'smith', day, 980, forge)
    // 목수는 함께하는 일과의 상대를 기다리지 않고 제 발로 대장간 앞에 온다
    expect(routineOf(s, 'carpenter')?.at).toEqual({ x: 44, y: 23 })
    expect(eventNow(stand(s, 'tilly', { x: 41, y: 22 }), 'smith')?.id).not.toBe('smith:story:2')
    s = stand(stand(s, 'tilly', { x: 41, y: 22 }), 'carpenter', { x: 44, y: 23 })
    s = chooseInEvent(openEvent(s, 'smith')!, 'smith:story:2', 0)
    expect(s.life.storyWait?.mini).toBe('hold')
    s = finishStoryMini(s)
    expect(s.life.experiences['choice:smith:story:2'].with.sort()).toEqual(['carpenter', 'smith', 'tilly'])
    expect(eventNow(step(s, 'smith', day, 1100, forge), 'smith')).toBeNull() // 같은 날 이어지지 않는다
    s = chooseInEvent(openEvent(step(s, 'smith', day + 1, 1100, forge), 'smith')!, 'smith:story:3', 2)
    expect(s.flags['story:smithHook']).toBe(1)
    expect(s.life.experiences['story:smithHook'].with).toEqual(['smith'])
    expect(npcProps(s, 'smith')).toEqual(['smithBoard', 'smithRing'])
    // 틸리·목수 뒷말은 실제로 함께한 장면이 있을 때만
    expect(reqMet(lineReq('tilly', 'tilly:smithHook'), ctxOf(s, 'tilly'))).toBe(true)
    expect(reqMet(lineReq('carpenter', 'carpenter:smithHook'), ctxOf(s, 'carpenter'))).toBe(true)
    const noCarpenter = { ...s, life: { ...s.life, experiences: { ...s.life.experiences, 'choice:smith:story:2': { ...s.life.experiences['choice:smith:story:2'], with: ['smith', 'tilly'] } } } }
    expect(reqMet(lineReq('carpenter', 'carpenter:smithHook'), ctxOf(noCarpenter, 'carpenter'))).toBe(false)
    const winter = freeDay(s, 'smith', day + 2, 1100, (d) => seasonOf(d) === 'winter')!
    expect(routineOf(winter, 'smith')?.with).toBe('tilly')
    expect(routineOf(winter, 'tilly')?.with).toBe('smith')
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'smith')).toEqual(['smithBoard', 'smithRing'])
  })

  it('양치기: 뒤섞인 자리 → 앞치마 주머니 → 덱스터와 담당 → 함께 쓰는 자리, 걸이·앞치마와 교대 — 양이 없어지는 말은 없다', () => {
    let s = ready('shepherd', {})
    const day = dry(70)
    s = chooseInEvent(openEvent(step(s, 'shepherd', day, 800, { x: 6, y: 28 }), 'shepherd')!, 'shepherd:story:1', 0)
    expect(eventNow(step(s, 'shepherd', day, 650, { x: 6, y: 28 }), 'shepherd')?.id).not.toBe('shepherd:story:2')
    s = finishStoryMini(chooseInEvent(openEvent(step(s, 'shepherd', day + 1, 650, { x: 6, y: 28 }), 'shepherd')!, 'shepherd:story:2', 0))
    expect(s.life.storyWait).toBeNull()
    // 덱스터가 우리에 있을 때만
    s = step(s, 'shepherd', day + 2, 800, { x: 5, y: 29 })
    expect(eventNow(stand(s, 'dexter', { x: 20, y: 20 }), 'shepherd')?.id).not.toBe('shepherd:story:3')
    s = chooseInEvent(openEvent(stand(s, 'dexter', { x: 4, y: 29 }), 'shepherd')!, 'shepherd:story:3', 1)
    expect(s.life.experiences['choice:shepherd:story:3'].with.sort()).toEqual(['dexter', 'shepherd'])
    s = stand(step(s, 'shepherd', day + 3, 860, { x: 4, y: 28 }), 'dexter', { x: 4, y: 29 })
    s = chooseInEvent(openEvent(s, 'shepherd')!, 'shepherd:story:4', 0)
    expect(s.flags['story:shepherdTools']).toBe(1)
    expect(s.life.experiences['story:shepherdTools'].with.sort()).toEqual(['dexter', 'shepherd'])
    expect(npcProps(s, 'shepherd')).toEqual(['shepherdApron', 'shepherdRack'])
    const swap = freeDay(s, 'shepherd', day + 4, 800, () => true)!
    expect(routineOf(swap, 'shepherd')).toMatchObject({ with: 'dexter', doing: 'rest' })
    expect(routineOf(swap, 'dexter')).toMatchObject({ with: 'shepherd', doing: 'sheep' })
    expect(reqMet(lineReq('dexter', 'dexter:shepherdTools'), ctxOf(s, 'dexter'))).toBe(true)
    // 새 앞치마(베 짜는 이웃과 함께)는 베 짜는 이웃이 서고 7권으로 이사 온 뒤에만
    const apron = step(s, 'shepherd', dry(day + 5), 650, { x: 36, y: 24 })
    expect(eventNow(stand(apron, 'weaver', { x: 37, y: 24 }), 'shepherd')?.id).not.toBe('shepherd:small:newApron')
    const moved = stand({ ...apron, flags: { ...apron.flags, ...WEAVER_IN } }, 'weaver', { x: 37, y: 24 })
    expect(eventNow(moved, 'shepherd')?.id).toBe('shepherd:small:newApron')
    const all = JSON.stringify(PEOPLE.people.shepherd)
    for (const w of ['없어', '잃', '찾았', '밤 언덕']) expect(all, w).not.toContain(w)
  })

  it('기름 짜는 이웃: 배치 → 목수와 시험 → 본인이 고른 높이 → 할아버지 손님 의자, 쉬는 시간 자리가 바뀐다', () => {
    let s = ready('presser')
    const press = { x: 46, y: 21 }
    let day = dry(70)
    // 이야기 전: 할아버지와 쉬는 시간은 할아버지 쪽에서
    const before = freeDay(s, 'presser', day, 860, (d) => !isWet(weatherOf(d)))!
    expect(routineOf(before, 'presser')?.at).toEqual({ x: 43, y: 10 })
    s = finishStoryMini(chooseInEvent(openEvent(step(s, 'presser', day, 500, press), 'presser')!, 'presser:story:1', 1))
    day = dry(day + 1, 2)
    s = step(s, 'presser', day, 930, press)
    expect(routineOf(s, 'carpenter')?.at).toEqual({ x: 45, y: 22 })
    s = stand(s, 'carpenter', { x: 45, y: 22 })
    s = finishStoryMini(chooseInEvent(openEvent(s, 'presser')!, 'presser:story:2', 0))
    expect(s.life.experiences['choice:presser:story:2'].with.sort()).toEqual(['carpenter', 'presser'])
    s = chooseInEvent(openEvent(step(s, 'presser', day + 1, 650, press), 'presser')!, 'presser:story:3', 0)
    expect(npcProps(s, 'presser')).toEqual([])
    day = dry(day + 2)
    s = step(s, 'presser', day, 860, { x: 45, y: 17 })
    expect(routineOf(s, 'grandpa')?.at).toEqual({ x: 44, y: 17 })
    s = stand(s, 'grandpa', { x: 44, y: 17 })
    s = chooseInEvent(openEvent(s, 'presser')!, 'presser:story:4', 0)
    expect(s.flags['story:presserBench']).toBe(1)
    expect(s.life.experiences['story:presserBench'].with.sort()).toEqual(['grandpa', 'presser'])
    expect(npcProps(s, 'presser')).toEqual(['presserChair', 'presserJar'])
    const after = freeDay(s, 'grandpa', day + 1, 860, (d) => !isWet(weatherOf(d)))!
    expect(routineOf(after, 'grandpa')).toMatchObject({ with: 'presser', at: { x: 44, y: 17 } })
    expect(routineOf(after, 'presser')).toMatchObject({ with: 'grandpa', at: { x: 45, y: 17 } })
    expect(reqMet(lineReq('grandpa', 'grandpa:presserBench'), ctxOf(s, 'grandpa'))).toBe(true)
    // 할아버지의 쉼터 이야기·메리골드 결과는 건드리지 않는다
    expect(s.flags['story:grandpaShelter']).toBeUndefined()
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'presser')).toEqual(['presserChair', 'presserJar'])
  })

  it('베 짜는 이웃: 서고 7권 이사 뒤 빈 자리 → 내 색 → 페넬로피와 다른 무늬 → 셋째 날 깔개 위 차, 페넬로피 고민은 그대로', () => {
    let s = ready('weaver', {})
    const room = { x: 4, y: 52 }
    let day = dry(70)
    // 이사 전: 소품 없음 (표식이 있어도)
    expect(storyPropsNow({ ...s, flags: { ...s.flags, 'story:weaverRug': 1 } }).filter((p) => p.npc === 'weaver')).toHaveLength(0)
    s = { ...s, flags: { ...s.flags, ...WEAVER_IN }, life: { ...s.life, seen: ['penelope:unpickTalk'] } }
    s = chooseInEvent(openEvent(step(s, 'weaver', day, 950, room), 'weaver')!, 'weaver:story:1', 0)
    s = chooseInEvent(openEvent(step(s, 'weaver', day + 1, 500, room), 'weaver')!, 'weaver:story:2', 2)
    s = step(s, 'weaver', dry(day + 2), 950, { x: 37, y: 24 })
    expect(eventNow(stand(s, 'penelope', { x: 20, y: 20 }), 'weaver')?.id).not.toBe('weaver:story:3')
    s = finishStoryMini(chooseInEvent(openEvent(stand(s, 'penelope', { x: 39, y: 24 }), 'weaver')!, 'weaver:story:3', 1))
    expect(s.life.experiences['choice:weaver:story:3'].with.sort()).toEqual(['penelope', 'weaver'])
    day = s.clock.day + 1 + ((3 - ((s.clock.day + 1) % 7) + 7) % 7)
    s = step(s, 'weaver', day, 1120, room)
    expect(routineOf(s, 'penelope')?.at).toEqual({ x: 6, y: 52 })
    s = chooseInEvent(openEvent(stand(s, 'penelope', { x: 6, y: 52 }), 'weaver')!, 'weaver:story:4', 0)
    expect(s.flags['story:weaverRug']).toBe(1)
    expect(s.life.seen).toContain('penelope:unpickTalk')
    expect(npcProps(s, 'weaver')).toEqual(['weaverRug', 'weaverTea'])
    expect(npcProps({ ...s, clock: { ...s.clock, day: day + 1 } }, 'weaver')).toEqual(['weaverRug'])
    const tea = freeDay(s, 'weaver', day + 7, 1120, (d) => d % 7 === 3)!
    expect(routineOf(tea, 'weaver')?.with).toBe('penelope')
    expect(routineOf(tea, 'penelope')?.with).toBe('weaver')
    expect(reqMet(lineReq('penelope', 'penelope:weaverRug'), ctxOf(s, 'penelope'))).toBe(true)
    // 옛 저장(경험 기록이 없음)에서도 이어 간다
    const raw = JSON.parse(serialize({ ...s, flags: { ...s.flags, 'story:weaverRug': 0 }, life: { ...s.life, seen: s.life.seen.filter((x) => x !== 'weaver:story:4') } }))
    delete raw.life.experiences
    const old = deserialize(JSON.stringify(raw), CONTENT)!
    expect(old.life.experiences).toEqual({})
    expect(eventNow(stand(step(old, 'weaver', day, 1120, room), 'penelope', { x: 6, y: 52 }), 'weaver')?.id).toBe('weaver:story:4')
  })
})

describe('일반 주민 3 — 벌 치는 이웃·편지 나르는 이웃·약방 주인·어부, 목수의 작은 이야기 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const ready = (npc: string, flags: Record<string, number> = {}): GameState => ({ ...start(), hearts: { [npc]: 40 }, flags: { ...start().flags, ...flags } })
  const step = (s: GameState, npc: string, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, npc, t)
  const dry = (from: number, weekday?: number) => Array.from({ length: 200 }, (_, i) => from + i).find((d) => !isWet(weatherOf(d)) && (weekday === undefined || d % 7 === weekday))!
  const wet = (from: number, weekday?: number) => Array.from({ length: 400 }, (_, i) => from + i).find((d) => isWet(weatherOf(d)) && (weekday === undefined || d % 7 === weekday))!
  const npcProps = (s: GameState, npc: string) => storyPropsNow(s).filter((p) => p.npc === npc).map((p) => p.id).sort()
  const lineReq = (npc: string, id: string) => PEOPLE.people[npc].lines.find((l) => l.id === id)!.req
  const ctxOf = (s: GameState, npc: string) => ({ life: s.life, npc, day: s.clock.day, threads: [], lover: false, suitor: false, flags: s.flags, stage: 3 as const })
  const freeDay = (s: GameState, npc: string, from: number, minute: number, ok: (d: number) => boolean) =>
    Array.from({ length: 120 }, (_, i) => from + i).filter(ok).map((d) => ({ ...s, clock: { ...s.clock, day: d, minute } })).find((g) => routineOf(g, npc)?.with)
  const scenesOf = (npc: string, prefix: string) => JSON.stringify((PEOPLE.people[npc].events ?? []).filter((e) => e.id.startsWith(prefix)))

  it('벌 치는 이웃: 서고 6권 이사 뒤 다름 듣기 → 주니퍼와 풀밭 → 장날 시식판(손일) → 찻집에 한 장, 공책 자리와 주니퍼와 관찰', () => {
    const IN = { 'movedIn:beekeeper': 1 }
    // 이사 전: 완료 표식이 있어도 소품이 없다
    expect(npcProps(ready('beekeeper', { 'story:beekeeperNotes': 1 }), 'beekeeper')).toEqual([])
    let s = ready('beekeeper', IN)
    const hive = { x: 41, y: 27 }
    let day = dry(70)
    s = chooseInEvent(openEvent(step(s, 'beekeeper', day, 1000, hive), 'beekeeper')!, 'beekeeper:story:1', 1)
    expect(eventNow(stand(step(s, 'beekeeper', day, 800, { x: 28, y: 11 }), 'juniper', { x: 27, y: 11 }), 'beekeeper')?.id).not.toBe('beekeeper:story:2') // 같은 날 이어지지 않는다
    day = dry(day + 1)
    s = step(s, 'beekeeper', day, 800, { x: 28, y: 11 })
    expect(routineOf(s, 'beekeeper')?.at).toEqual({ x: 28, y: 11 })
    expect(eventNow(stand(s, 'juniper', { x: 20, y: 20 }), 'beekeeper')?.id).not.toBe('beekeeper:story:2')
    s = chooseInEvent(openEvent(stand(s, 'juniper', { x: 27, y: 11 }), 'beekeeper')!, 'beekeeper:story:2', 1)
    expect(s.life.experiences['choice:beekeeper:story:2'].with.sort()).toEqual(['beekeeper', 'juniper'])
    // 장날, 빵 굽는 이웃이 좌판에 와 있을 때
    day = dry(day + 1, 0)
    s = step(s, 'beekeeper', day, 860, { x: 21, y: 18 })
    expect(routineOf(s, 'baker')?.at).toEqual({ x: 20, y: 17 })
    expect(eventNow(stand(s, 'baker', { x: 2, y: 17 }), 'beekeeper')?.id).not.toBe('beekeeper:story:3')
    s = chooseInEvent(openEvent(stand(s, 'baker', { x: 20, y: 17 }), 'beekeeper')!, 'beekeeper:story:3', 0)
    expect(s.life.storyWait?.mini).toBe('mash')
    s = finishStoryMini(s)
    expect(s.life.experiences['choice:beekeeper:story:3'].with.sort()).toEqual(['baker', 'beekeeper'])
    // 다음 날 찻집: 주니퍼는 그림 곁 자리로 온다
    s = step(s, 'beekeeper', day + 1, 930, { x: 44, y: 63 })
    expect(routineOf(s, 'juniper')?.at).toEqual({ x: 44, y: 64 })
    s = stand(stand(s, 'juniper', { x: 44, y: 64 }), 'poppy', { x: 44, y: 62 })
    s = chooseInEvent(openEvent(s, 'beekeeper')!, 'beekeeper:story:4', 1)
    expect(s.flags['story:beekeeperNotes']).toBe(1)
    expect(s.life.experiences['story:beekeeperNotes'].with.sort()).toEqual(['beekeeper', 'juniper', 'poppy'])
    expect(npcProps(s, 'beekeeper')).toEqual(['beekeeperDrawing', 'beekeeperNotebook'])
    // 공책 자리는 서고가 아니라 벌 치는 집 방
    expect(storyPropsNow(s).filter((p) => p.npc === 'beekeeper').every((p) => p.room === 'beekeeper')).toBe(true)
    const walk = freeDay(s, 'beekeeper', day + 2, 800, (d) => !isWet(weatherOf(d)))!
    expect(routineOf(walk, 'beekeeper')).toMatchObject({ with: 'juniper', at: { x: 28, y: 11 } })
    expect(routineOf(walk, 'juniper')?.with).toBe('beekeeper')
    const market = freeDay(s, 'baker', day + 2, 860, (d) => d % 7 === 0 && !isWet(weatherOf(d)))!
    expect(routineOf(market, 'baker')?.with).toBe('beekeeper')
    expect(routineOf(market, 'beekeeper')?.with).toBe('baker')
    for (const [npc, id] of [['juniper', 'juniper:beekeeperNotes'], ['baker', 'baker:beekeeperBoard'], ['poppy', 'poppy:beekeeperNotes']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'beekeeper')).toEqual(['beekeeperDrawing', 'beekeeperNotebook'])
  })

  it('편지 나르는 이웃: 닳은 끈 → 본인이 덮개를 남김 → 목수에게 직접 부탁 → 우물 곁 쉼, 수선 가방과 쉬는 일과 — 편지 내용은 말하지 않는다', () => {
    let s = ready('postman')
    let day = dry(70)
    s = chooseInEvent(openEvent(step(s, 'postman', day, 920, { x: 22, y: 8 }), 'postman')!, 'postman:story:1', 1)
    expect(npcProps(s, 'postman')).toEqual([])
    s = step(s, 'postman', day + 1, 1100, { x: 16, y: 83 })
    expect(routineOf(s, 'postman')?.at).toEqual({ x: 16, y: 83 })
    s = chooseInEvent(openEvent(s, 'postman')!, 'postman:story:2', 0)
    expect(npcProps(s, 'postman')).toEqual(['postmanBagWorn'])
    day = day + 2 + ((1 - ((day + 2) % 7) + 7) % 7)
    s = step(s, 'postman', day, 930, { x: 7, y: 25 })
    expect(routineOf(s, 'carpenter')?.at).toEqual({ x: 6, y: 24 })
    expect(eventNow(stand(s, 'carpenter', { x: 20, y: 20 }), 'postman')?.id).not.toBe('postman:story:3')
    s = chooseInEvent(openEvent(stand(s, 'carpenter', { x: 6, y: 24 }), 'postman')!, 'postman:story:3', 2)
    expect(s.life.storyWait?.mini).toBe('hold')
    s = finishStoryMini(s)
    expect(s.life.experiences['choice:postman:story:3'].with.sort()).toEqual(['carpenter', 'postman'])
    day = dry(day + 1)
    s = chooseInEvent(openEvent(step(s, 'postman', day, 1040, { x: 27, y: 14 }), 'postman')!, 'postman:story:4', 0)
    expect(s.flags['story:postmanBag']).toBe(1)
    expect(s.life.experiences['story:postmanBag'].with).toEqual(['postman'])
    expect(npcProps(s, 'postman')).toEqual(['postmanBagRepaired'])
    expect(routineOf(step(s, 'postman', dry(day + 1), 1040, { x: 27, y: 14 }), 'postman')).toMatchObject({ doing: 'rest', at: { x: 27, y: 14 } })
    expect(routineOf(step(s, 'postman', wet(day + 1), 1040, { x: 15, y: 24 }), 'postman')).toMatchObject({ doing: 'rest', at: { x: 15, y: 24 } })
    expect(reqMet(lineReq('carpenter', 'carpenter:postmanBag'), ctxOf(s, 'carpenter'))).toBe(true)
    // 넓은 어깨끈은 베 짜는 이웃이 서고 7권으로 이사 온 뒤에만
    const strap = stand(step(s, 'postman', day + 1, 980, { x: 36, y: 24 }), 'weaver', { x: 37, y: 24 })
    expect(eventNow(strap, 'postman')?.id).not.toBe('postman:small:newStrap')
    expect(eventNow({ ...strap, flags: { ...strap.flags, 'movedIn:weaver': 1 } }, 'postman')?.id).toBe('postman:small:newStrap')
    const all = JSON.stringify(PEOPLE.people.postman)
    for (const w of ['말씀', '조각 편지', '편지에는', '편지 내용']) expect(all, w).not.toContain(w)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'postman')).toEqual(['postmanBagRepaired'])
  })

  it('약방 주인: 서고 2권 이사 뒤 시든 화분 → 할아버지에게 묻기 → 바질과 물 주는 날 표(손일) → 파피가 고른 창가, 번갈아 쉬는 일과 — 치료·약효 문장 없음', () => {
    expect(npcProps(ready('apothecary', { 'story:apothecaryPot': 1 }), 'apothecary')).toEqual([])
    let s = ready('apothecary', { 'movedIn:apothecary': 1 })
    const shop = { x: 37, y: 32 }
    let day = dry(70)
    s = chooseInEvent(openEvent(step(s, 'apothecary', day, 900, shop), 'apothecary')!, 'apothecary:story:1', 2)
    expect(npcProps(s, 'apothecary')).toEqual(['apothecaryPotWilted'])
    day = dry(day + 1)
    s = step(s, 'apothecary', day, 980, { x: 40, y: 8 })
    expect(routineOf(s, 'apothecary')?.at).toEqual({ x: 40, y: 8 })
    expect(eventNow(stand(s, 'grandpa', { x: 20, y: 20 }), 'apothecary')?.id).not.toBe('apothecary:story:2')
    s = chooseInEvent(openEvent(stand(s, 'grandpa', { x: 41, y: 7 }), 'apothecary')!, 'apothecary:story:2', 0)
    expect(s.life.experiences['choice:apothecary:story:2'].with.sort()).toEqual(['apothecary', 'grandpa'])
    s = step(s, 'apothecary', day + 1, 980, shop)
    expect(routineOf(s, 'basil')?.at).toEqual({ x: 38, y: 32 })
    s = chooseInEvent(openEvent(stand(s, 'basil', { x: 38, y: 32 }), 'apothecary')!, 'apothecary:story:3', 0)
    expect(s.life.storyWait?.mini).toBe('order')
    s = finishStoryMini(s)
    expect(s.life.experiences['choice:apothecary:story:3'].with.sort()).toEqual(['apothecary', 'basil'])
    s = stand(step(s, 'apothecary', day + 2, 930, { x: 43, y: 62 }), 'poppy', { x: 44, y: 62 })
    s = chooseInEvent(openEvent(s, 'apothecary')!, 'apothecary:story:4', 1)
    expect(s.flags['story:apothecaryPot']).toBe(1)
    expect(s.life.experiences['story:apothecaryPot'].with.sort()).toEqual(['apothecary', 'poppy'])
    expect(npcProps(s, 'apothecary')).toEqual(['apothecaryCan', 'apothecaryPotLeaf'])
    // 둘째·다섯째 날은 약방 주인이 찻집에서 쉬고 바질이 물을, 셋째·여섯째 날은 약방 주인이 물을
    const rest = { ...s, clock: { ...s.clock, day: day + 3 + ((2 - ((day + 3) % 7) + 7) % 7), minute: 930 } }
    expect(routineOf(rest, 'apothecary')).toMatchObject({ doing: 'tea', at: { x: 43, y: 62 } })
    expect(routineOf(rest, 'basil')).toMatchObject({ doing: 'herb', at: { x: 34, y: 32 } })
    const water = { ...rest, clock: { ...rest.clock, day: rest.clock.day + 1 } }
    expect(routineOf(water, 'apothecary')).toMatchObject({ doing: 'herb', at: shop })
    for (const [npc, id] of [['grandpa', 'grandpa:apothecaryPot'], ['basil', 'basil:apothecaryPot'], ['poppy', 'poppy:apothecaryPot']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    const all = JSON.stringify(PEOPLE.people.apothecary) + PEOPLE.people.basil.lines.find((l) => l.id === 'basil:apothecaryPot')!.text + PEOPLE.people.grandpa.lines.find((l) => l.id === 'grandpa:apothecaryPot')!.text
    for (const w of ['치료', '약효', '효능', '효과', '진단', '처방', '낫', '나을', '아픈', '병']) expect(all, w).not.toContain(w)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'apothecary')).toEqual(['apothecaryCan', 'apothecaryPotLeaf'])
  })

  it('어부: 서고 3권 이사 뒤 만들다 만 조각 → 목수와 바닥(손일 실패해도) → 코스모가 받은 돛 → 쉬는 날 상자, 장난감과 저녁 차 — 그물 가득 같은 장면 없음', () => {
    expect(npcProps(ready('fisher', { 'story:fisherToy': 1 }), 'fisher')).toEqual([])
    let s = ready('fisher', { 'movedIn:fisher': 1 })
    const front = { x: 28, y: 32 }
    let day = dry(70)
    s = step(s, 'fisher', day, 980, front)
    expect(routineOf(s, 'fisher')?.at).toEqual(front)
    s = chooseInEvent(openEvent(s, 'fisher')!, 'fisher:story:1', 2)
    day = dry(day + 1, 2)
    s = step(s, 'fisher', day, 1040, { x: 24, y: 35 })
    expect(routineOf(s, 'carpenter')?.at).toEqual({ x: 24, y: 34 })
    expect(eventNow(stand(s, 'carpenter', { x: 6, y: 24 }), 'fisher')?.id).not.toBe('fisher:story:2')
    s = chooseInEvent(openEvent(stand(s, 'carpenter', { x: 24, y: 34 }), 'fisher')!, 'fisher:story:2', 0)
    s = finishStoryMini(s) // 잘하든 못하든
    expect(s.life.experiences['choice:fisher:story:2'].with.sort()).toEqual(['carpenter', 'fisher'])
    day = dry(day + 1)
    s = step(s, 'fisher', day, 650, { x: 24, y: 34 })
    expect(eventNow(stand(s, 'cosmo', { x: 30, y: 32 }), 'fisher')?.id).not.toBe('fisher:story:3')
    s = chooseInEvent(openEvent(stand(s, 'cosmo', { x: 25, y: 33 }), 'fisher')!, 'fisher:story:3', 1)
    expect(s.life.experiences['choice:fisher:story:3'].with.sort()).toEqual(['cosmo', 'fisher'])
    day = dry(day + 1, 1)
    s = chooseInEvent(openEvent(step(s, 'fisher', day, 700, front), 'fisher')!, 'fisher:story:4', 0)
    expect(s.flags['story:fisherToy']).toBe(1)
    expect(s.life.experiences['story:fisherToy'].with).toEqual(['fisher'])
    expect(npcProps(s, 'fisher')).toEqual(['fisherToy', 'fisherWood'])
    expect(routineOf(step(s, 'fisher', dry(day + 1, 1), 700, front), 'fisher')).toMatchObject({ doing: 'wood', at: front })
    expect(routineOf(step(s, 'fisher', wet(day + 1, 1), 700, front), 'fisher')).toMatchObject({ doing: 'wood', at: { x: 39, y: 86 } })
    expect(routineOf(step(s, 'fisher', dry(day + 1), 980, front), 'fisher')).toMatchObject({ doing: 'tea', at: { x: 24, y: 35 } })
    for (const [npc, id] of [['carpenter', 'carpenter:fisherToy'], ['cosmo', 'cosmo:fisherToy']]) expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    // 코스모의 이야기 결과는 건드리지 않는다
    expect(s.flags['story:cosmoDock']).toBeUndefined()
    const scenes = scenesOf('fisher', 'fisher:') + PEOPLE.people.fisher.lines.filter((l) => !/^fisher\d$/.test(l.id)).map((l) => l.text).join()
    for (const w of ['가득', '밤새', '한 마리도', '오른편', '건너편', '물 위를', '폭풍', '떡', '나누어 먹']) expect(scenes, w).not.toContain(w)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'fisher')).toEqual(['fisherToy', 'fisherWood'])
  })

  it('목수: 의자 뒤 작업대 정돈(손일) → 연장 걸이, 아이 상자·어부 장난감은 같은 사건을 함께 쓴다', () => {
    let s = ready('carpenter', { 'story:carpenterChair': 1 })
    expect(npcProps(s, 'carpenter')).toEqual(['carpenterChair'])
    s = step(s, 'carpenter', 75, 500, { x: 6, y: 24 })
    expect(eventNow({ ...s, flags: { ...s.flags, 'story:carpenterChair': 0 } }, 'carpenter')?.id).not.toBe('carpenter:small:benchTidy')
    s = finishStoryMini(chooseInEvent(openEvent(s, 'carpenter')!, 'carpenter:small:benchTidy', 0))
    expect(npcProps(s, 'carpenter')).toEqual(['carpenterChair', 'carpenterToolRack'])
    // 함께 쓰는 사건은 한 사람 파일에만
    const owners = Object.values(PEOPLE.people).flatMap((p) => (p.events ?? []).map((e) => e.id))
    for (const id of ['child:story:2', 'fisher:story:2']) expect(owners.filter((x) => x === id)).toHaveLength(1)
    expect(PEOPLE.people.fisher.events!.find((e) => e.id === 'fisher:story:2')!.with).toEqual(['carpenter'])
  })
})

describe('연애 후보 1 — 웬델·틸리·파피의 이후 생활 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const NEW = /:(story|small|short):/
  /** 기존 사건·목격은 다 본 것으로 (새 이야기만 시험한다 — 고백·연인 사건은 조건이 아니다) */
  const oldSeen = (npc: string) => [...(PEOPLE.people[npc].events ?? []).map((e) => e.id), ...(PEOPLE.people[npc].sightings ?? []).map((w) => w.id)].filter((id) => !NEW.test(id))
  const ready = (hearts: Record<string, number>, seen: string[], flags: Record<string, number> = {}): GameState =>
    ({ ...start(), hearts, flags: { ...start().flags, ...flags }, life: { ...NO_LIFE, seen } })
  const step = (s: GameState, npc: string, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, npc, t)
  const dry = (from: number, ok: (d: number) => boolean = () => true) => Array.from({ length: 300 }, (_, i) => from + i).find((d) => !isWet(weatherOf(d)) && ok(d))!
  const npcProps = (s: GameState, npc: string) => storyPropsNow(s).filter((p) => p.npc === npc).map((p) => p.id).sort()
  const lineReq = (npc: string, id: string) => PEOPLE.people[npc].lines.find((l) => l.id === id)!.req
  const ctxOf = (s: GameState, npc: string, romance: 'dating' | 'married' | null = null) =>
    ({ life: s.life, npc, day: s.clock.day, threads: [], lover: !!romance, suitor: false, flags: s.flags, stage: 4 as const, romance })
  const weekday = (d: number) => d % 7 !== 0
  const BAKERY = { x: 1, y: 17 }, TEA = { x: 44, y: 62 }, FORGE = { x: 41, y: 22 }

  it('웬델: 편지와 가마 나눔 뒤 본인이 고른다 — 새 빵 갈래는 진열대·시험 굽는 아침, 다른 갈래 모습은 없다', () => {
    const seen = [...oldSeen('wendell'), 'baker:story:3']
    // 편지 이야기를 아직 안 들었으면 열리지 않는다
    expect(eventNow(step(ready({ wendell: 60 }, seen.filter((x) => x !== 'wendell:letterTalk')), 'wendell', 70, 1100, BAKERY), 'wendell')?.id).not.toBe('wendell:story:1')
    let s = step(ready({ wendell: 60, baker: 40 }, seen), 'wendell', 70, 1100, BAKERY)
    expect(eventNow(s, 'wendell')?.id).toBe('wendell:story:1')
    s = chooseInEvent(openEvent(s, 'wendell')!, 'wendell:story:1', 0)
    expect(s.flags['story:wendellPath']).toBe(1)
    expect(s.life.experiences['story:wendellPath'].with).toEqual(['wendell'])
    expect(npcProps(s, 'wendell')).toEqual(['wendellBread'])
    expect(eventNow(step(s, 'wendell', 70, 500, BAKERY), 'wendell')).toBeNull() // 같은 날 이어지지 않는다
    const day = dry(71, weekday)
    s = step(s, 'wendell', day, 500, BAKERY)
    expect(eventNow(stand(s, 'baker', { x: 20, y: 20 }), 'wendell')?.id).not.toBe('wendell:story:2')
    s = chooseInEvent(openEvent(stand(s, 'baker', { x: 2, y: 17 }), 'wendell')!, 'wendell:story:2', 0)
    expect(s.life.experiences['choice:wendell:story:2'].with.sort()).toEqual(['baker', 'wendell'])
    // 바깥 갈래의 아침·일정표·말은 보이지 않는다
    expect(eventNow(step(s, 'wendell', dry(day + 1, (d) => d % 7 === 2), 330, { x: 4, y: 17 }), 'wendell')?.id).not.toBe('wendell:story:2b')
    const tuesday = { ...s, clock: { ...s.clock, day: day + 1 + ((2 - ((day + 1) % 7) + 7) % 7), minute: 300 } }
    expect(routineOf(tuesday, 'wendell')).toMatchObject({ doing: 'bread', at: BAKERY })
    expect(routineOf({ ...tuesday, clock: { ...tuesday.clock, minute: 400 } }, 'wendell')?.away).toBeUndefined()
    expect(reqMet(lineReq('wendell', 'wendell:path:bread'), ctxOf(s, 'wendell'))).toBe(true)
    expect(reqMet(lineReq('wendell', 'wendell:path:out'), ctxOf(s, 'wendell'))).toBe(false)
    expect(reqMet(lineReq('baker', 'baker:wendellBread'), ctxOf(s, 'baker'))).toBe(true)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'wendell')).toEqual(['wendellBread'])
  })

  it('웬델: 바깥 일 갈래 — 둘째 날 새벽 길목까지, 점심 전까지는 마을에 없고 가마는 어머니가, 점심엔 틸리와', () => {
    let s = step(ready({ wendell: 60, baker: 40, tilly: 40 }, [...oldSeen('wendell'), ...oldSeen('tilly'), 'baker:story:3', 'wendell:short:lunchSwap']), 'wendell', 70, 1100, BAKERY)
    s = chooseInEvent(openEvent(s, 'wendell')!, 'wendell:story:1', 1)
    expect(s.flags['story:wendellPath']).toBe(2)
    expect(npcProps(s, 'wendell')).toEqual(['wendellSchedule'])
    const day = dry(71, (d) => d % 7 === 2)
    s = step(s, 'wendell', day, 330, { x: 4, y: 17 })
    expect(routineOf(s, 'wendell')?.at).toEqual({ x: 4, y: 17 })
    s = chooseInEvent(openEvent(s, 'wendell')!, 'wendell:story:2b', 2)
    const morning = { ...s, clock: { ...s.clock, minute: 400 } }
    expect(routineOf(morning, 'wendell')?.away).toBe(true)
    expect(settle(morning, CONTENT).npcs.wendell.visible).toBe(false)
    expect(routineOf(morning, 'baker')?.mutter?.[0]).toContain('웬델 이야기')
    const lunch = settle({ ...s, clock: { ...s.clock, minute: 730 } }, CONTENT)
    expect(lunch.npcs.wendell.visible).toBe(true)
    expect(routineOf(lunch, 'wendell')?.with).toBe('tilly')
    // 다른 날 아침은 그대로 가게에
    expect(settle({ ...s, clock: { ...s.clock, day: day + 1, minute: 400 } }, CONTENT).npcs.wendell.visible).toBe(true)
    expect(reqMet(lineReq('wendell', 'wendell:path:out'), ctxOf(s, 'wendell'))).toBe(true)
    expect(reqMet(lineReq('wendell', 'wendell:path:bread'), ctxOf(s, 'wendell'))).toBe(false)
    // "사흘" 말은 연인 사건을 본 경우만
    expect(reqMet(lineReq('wendell', 'wendell:path:trip'), ctxOf(s, 'wendell'))).toBe(true) // 기존 사건을 모두 본 저장
    const noTrip = { ...s, life: { ...s.life, seen: s.life.seen.filter((x) => x !== 'wendell:trip') } }
    expect(reqMet(lineReq('wendell', 'wendell:path:trip'), ctxOf(noTrip, 'wendell'))).toBe(false)
  })

  it('웬델·틸리 점심: 기존 점심 자리에서 둘이 함께일 때만, 틸리는 함께한 경우에만 뒷말', () => {
    const lunchDay = dry(70)
    let s = step(ready({ wendell: 40, tilly: 40 }, [...oldSeen('wendell'), ...oldSeen('tilly')]), 'wendell', lunchDay, 730, BAKERY)
    expect(eventNow(stand(s, 'tilly', { x: 20, y: 20 }), 'wendell')?.id).not.toBe('wendell:short:lunchSwap')
    s = chooseInEvent(openEvent(stand(s, 'tilly', { x: 2, y: 17 }), 'wendell')!, 'wendell:short:lunchSwap', 2)
    expect(s.life.experiences['choice:wendell:short:lunchSwap'].with.sort()).toEqual(['tilly', 'wendell'])
    expect(reqMet(lineReq('tilly', 'tilly:lunchSwap'), ctxOf(s, 'tilly'))).toBe(true)
    expect(reqMet(lineReq('tilly', 'tilly:lunchSwap'), ctxOf(ready({}, []), 'tilly'))).toBe(false)
  })

  it('틸리: 대장간 고리 뒤 페넬로피와 색 → 아버지와 마을에 건다, 이름 고리와 본인 작업 시간 — 대장장이 결과는 그대로', () => {
    const IN = { 'story:smithHook': 1, 'movedIn:weaver': 1 }
    // 대장장이 고리 이야기 전에는 열리지 않는다
    const tue = dry(70, (d) => d % 7 === 2)
    const before = stand(step(ready({ tilly: 40 }, oldSeen('tilly'), { 'movedIn:weaver': 1 }), 'tilly', tue, 800, FORGE), 'penelope', { x: 40, y: 22 })
    expect(eventNow(before, 'tilly')?.id).not.toBe('tilly:story:3')
    let s = step(ready({ tilly: 40 }, oldSeen('tilly'), IN), 'tilly', tue, 800, FORGE)
    expect(routineOf(s, 'penelope')?.at).toEqual({ x: 40, y: 22 }) // 페넬로피가 제 발로 온다
    expect(eventNow(stand(s, 'penelope', { x: 20, y: 20 }), 'tilly')?.id).not.toBe('tilly:story:3')
    s = chooseInEvent(openEvent(stand(s, 'penelope', { x: 40, y: 22 }), 'tilly')!, 'tilly:story:3', 1)
    expect(s.life.experiences['choice:tilly:story:3'].with.sort()).toEqual(['penelope', 'tilly'])
    expect(npcProps(s, 'tilly')).toEqual([])
    expect(eventNow(stand(step(s, 'tilly', tue, 1100, FORGE), 'smith', { x: 43, y: 22 }), 'tilly')?.id).not.toBe('tilly:story:4') // 같은 날 이어지지 않는다
    s = stand(step(s, 'tilly', dry(tue + 1), 1100, FORGE), 'smith', { x: 43, y: 22 })
    s = chooseInEvent(openEvent(s, 'tilly')!, 'tilly:story:4', 1)
    expect(s.flags['story:tillyHook']).toBe(1)
    expect(s.flags['story:smithHook']).toBe(1)
    expect(s.life.experiences['story:tillyHook'].with.sort()).toEqual(['smith', 'tilly'])
    expect(npcProps(s, 'tilly')).toEqual(['tillyHook'])
    const work = { ...s, clock: { ...s.clock, day: s.clock.day + 1, minute: 800 } }
    expect(routineOf(work, 'tilly')?.mutter?.[0]).toContain('고리 시간')
    expect(routineOf(work, 'penelope')?.at).not.toEqual({ x: 40, y: 22 })
    for (const [npc, id] of [['tilly', 'tilly:after'], ['tilly', 'tilly:fireStill'], ['smith', 'smith:tillyHook'], ['penelope', 'penelope:tillyHook']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'tilly')).toEqual(['tillyHook'])
  })

  it('파피: 문 닫은 찻집 뒤 자리 이름 → 웬델·페넬로피와 간식·받침 → 제 뜻으로 부르는 자리, 찻잔·표지와 저녁 자리 (연애와 상관없이)', () => {
    let s = step(ready({ poppy: 60 }, oldSeen('poppy'), { 'movedIn:weaver': 1 }), 'poppy', 70, 1115, TEA)
    expect(eventNow(s, 'poppy')?.id).toBe('poppy:story:1')
    s = chooseInEvent(openEvent(s, 'poppy')!, 'poppy:story:1', 2)
    const day = dry(71, (d) => d % 7 === 1 || d % 7 === 6)
    s = step(s, 'poppy', day, 930, TEA)
    expect(routineOf(s, 'wendell')?.at).toEqual({ x: 45, y: 62 })
    expect(routineOf(s, 'penelope')?.at).toEqual({ x: 43, y: 62 })
    expect(eventNow(stand(s, 'wendell', { x: 1, y: 17 }), 'poppy')?.id).not.toBe('poppy:story:2')
    s = stand(stand(s, 'wendell', { x: 45, y: 62 }), 'penelope', { x: 43, y: 62 })
    s = chooseInEvent(openEvent(s, 'poppy')!, 'poppy:story:2', 2)
    expect(s.life.experiences['choice:poppy:story:2'].with.sort()).toEqual(['penelope', 'poppy', 'wendell'])
    expect(npcProps(s, 'poppy')).toEqual([])
    const next = Array.from({ length: 3 }, (_, i) => day + 1 + i).find(weekday)!
    s = chooseInEvent(openEvent(step(s, 'poppy', next, 1100, TEA), 'poppy')!, 'poppy:story:3', 1)
    expect(s.flags['story:poppyCorner']).toBe(1)
    expect(s.romance?.partner ?? null).toBeNull()
    expect(s.life.experiences['story:poppyCorner'].with).toEqual(['poppy'])
    expect(npcProps(s, 'poppy')).toEqual(['poppyCup', 'poppySign'])
    expect(storyPropsNow(s).filter((p) => p.npc === 'poppy').every((p) => p.room === 'teahouse')).toBe(true)
    const evening = { ...s, clock: { ...s.clock, day: next + 1 + (((next + 1) % 7 === 0) ? 1 : 0), minute: 1100 } }
    expect(routineOf(evening, 'poppy')?.mutter?.[0]).toContain('제 자리')
    for (const [npc, id] of [['poppy', 'poppy:after'], ['poppy', 'poppy:fearStill'], ['wendell', 'wendell:poppyCorner'], ['penelope', 'penelope:poppyCorner']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'poppy')).toEqual(['poppyCup', 'poppySign'])
  })

  it('친구·연인·배우자는 서로 다른 말과 먼저 하는 제안 — 배우자의 집 습관은 고른 뒤 기억으로, 차 취향은 말에서 알게 된다', () => {
    const s = ready({}, [])
    for (const npc of ['wendell', 'tilly', 'poppy']) {
      const rel = (romance: 'dating' | 'married' | null) => ['friend', 'lover', 'spouse'].filter((r) => reqMet(lineReq(npc, `${npc}:rel:${r}`), ctxOf(s, npc, romance)))
      expect(rel(null), npc).toEqual(['friend'])
      expect(rel('dating'), npc).toEqual(['lover'])
      expect(rel('married'), npc).toEqual(['spouse'])
      const habit = PEOPLE.people[npc].events!.find((e) => e.id === `${npc}:short:spouseHabit`)!
      expect(habit.req?.rel).toEqual(['spouse'])
      expect(habit.opens).toBeUndefined()
      expect(habit.confess).toBeUndefined()
    }
    // 틸리·파피는 차를 좋아한다고 직접 말한다 → 수첩의 차 약속 제안(작업 13)이 열릴 수 있다
    for (const npc of ['tilly', 'poppy']) expect(PEOPLE.people[npc].lines.some((l) => l.reveals === 'activity.tea'), npc).toBe(true)
    // 새 이야기는 고백·문턱을 만들지 않는다
    for (const npc of ['wendell', 'tilly', 'poppy'])
      for (const e of PEOPLE.people[npc].events!.filter((x) => NEW.test(x.id))) {
        expect(e.opens, e.id).toBeUndefined()
        expect(e.confess, e.id).toBeUndefined()
        expect(e.req?.lover, e.id).toBeUndefined()
      }
    // 성경 이야기를 떠올리는 소재 없음 (웬델 바깥 갈래: 몫·탕진·잔치 구도, 등불: 됫박·빛)
    const text = ['wendell', 'tilly', 'poppy'].map((npc) => JSON.stringify(PEOPLE.people[npc].events!.filter((x) => NEW.test(x.id))) + PEOPLE.people[npc].lines.filter((l) => l.id.includes(':')).map((l) => l.text).join()).join()
    for (const w of ['잔치', '탕진', '됫박', '누룩', '효모', '등불', '빛', '필사가님', '치료', '약효']) expect(text, w).not.toContain(w)
  })
})

describe('연애 후보 2 — 코스모·루디·덱스터·주니퍼의 이후 생활 (실제 내용)', () => {
  beforeEach(() => setPeopleData(PEOPLE))
  const NEW = /:(story|small|short):/
  const FOUR = ['cosmo', 'rudy', 'dexter', 'juniper']
  /** 기존 사건·목격은 다 본 것으로 (새 이야기만 시험한다 — 고백·연인 사건은 조건이 아니다) */
  const oldSeen = (npc: string) => [...(PEOPLE.people[npc].events ?? []).map((e) => e.id), ...(PEOPLE.people[npc].sightings ?? []).map((w) => w.id)].filter((id) => !NEW.test(id))
  const ready = (hearts: Record<string, number>, seen: string[], flags: Record<string, number> = {}): GameState =>
    ({ ...start(), hearts, flags: { ...start().flags, ...flags }, life: { ...NO_LIFE, seen } })
  const step = (s: GameState, npc: string, day: number, minute: number, t: Tile) => stand({ ...s, clock: { ...s.clock, day, minute } }, npc, t)
  const CLEAR: string[] = ['sunny', 'wind', 'hot']
  const days = (from: number) => Array.from({ length: 400 }, (_, i) => from + i)
  const clear = (from: number, ok: (d: number) => boolean = () => true) => days(from).find((d) => CLEAR.includes(weatherOf(d)) && ok(d))!
  const dry = (from: number, ok: (d: number) => boolean = () => true) => days(from).find((d) => !isWet(weatherOf(d)) && ok(d))!
  const wet = (from: number, ok: (d: number) => boolean = () => true) => days(from).find((d) => isWet(weatherOf(d)) && ok(d))!
  const npcProps = (s: GameState, npc: string) => storyPropsNow(s).filter((p) => p.npc === npc).map((p) => p.id).sort()
  const lineReq = (npc: string, id: string) => PEOPLE.people[npc].lines.find((l) => l.id === id)!.req
  const ctxOf = (s: GameState, npc: string, romance: 'dating' | 'married' | null = null) =>
    ({ life: s.life, npc, day: s.clock.day, threads: [], lover: !!romance, suitor: false, flags: s.flags, stage: 4 as const, romance })
  const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { ...s.clock, day, minute } })
  const newText = (npc: string) =>
    JSON.stringify(PEOPLE.people[npc].events!.filter((x) => NEW.test(x.id))) +
    PEOPLE.people[npc].lines.filter((l) => l.id.includes(':')).map((l) => l.text).join() +
    JSON.stringify(PEOPLE.people[npc].routines.filter((r) => r.req))
  const IN = { 'movedIn:fisher': 1, 'movedIn:beekeeper': 1 }
  const DOCK = { x: 25, y: 33 }, RUDY_DOCK = { x: 24, y: 33 }, SHOP = { x: 6, y: 24 }, LIB = { x: 24, y: 9 }
  const HILL = { x: 13, y: 9 }, VIEW = { x: 22, y: 14 }, JUN = { x: 23, y: 15 }, SHELF = { x: 18, y: 53 }

  it('코스모: 배·안개 뒤 본인이 고른 쉬는 자리 → 루디와 보관대(손일 실패해도) → 먼저 청한 말없는 저녁, 보관대·장식과 다섯째 날 루디 — 안개 낀 날은 그대로', () => {
    const seen = oldSeen('cosmo')
    // 배 사건이 끝나기 전(날 30 전)에는 열리지 않는다
    const early = clear(21)
    expect(early).toBeLessThan(30)
    expect(eventNow(step(ready({ cosmo: 40 }, seen, IN), 'cosmo', early, 1050, DOCK), 'cosmo')?.id).not.toBe('cosmo:story:1')
    // 안개 장면을 안 봤으면 열리지 않는다
    expect(eventNow(step(ready({ cosmo: 40 }, seen.filter((x) => x !== 'cosmo:fogWalk'), IN), 'cosmo', clear(70), 1050, DOCK), 'cosmo')?.id).not.toBe('cosmo:story:1')
    let s = step(ready({ cosmo: 40 }, seen, IN), 'cosmo', clear(70), 1050, DOCK)
    expect(eventNow(s, 'cosmo')?.id).toBe('cosmo:story:1')
    s = chooseInEvent(openEvent(s, 'cosmo')!, 'cosmo:story:1', 1)
    expect(npcProps(s, 'cosmo')).toEqual([])
    const fri = clear(s.clock.day + 1, (d) => d % 7 === 5)
    s = step(s, 'cosmo', fri, 980, DOCK)
    expect(routineOf(s, 'rudy')?.at).toEqual(RUDY_DOCK) // 루디가 제 발로 나루에
    expect(eventNow(stand(s, 'rudy', SHOP), 'cosmo')?.id).not.toBe('cosmo:story:2')
    s = chooseInEvent(openEvent(stand(s, 'rudy', RUDY_DOCK), 'cosmo')!, 'cosmo:story:2', 0)
    expect(s.life.storyWait?.mini).toBe('hold')
    s = finishStoryMini(s) // 잘하든 못하든
    expect(s.life.experiences['choice:cosmo:story:2'].with.sort()).toEqual(['cosmo', 'rudy'])
    expect(eventNow(step(s, 'cosmo', fri, 1100, DOCK), 'cosmo')?.id).not.toBe('cosmo:story:3') // 같은 날 이어지지 않는다
    const eve = clear(fri + 1)
    s = chooseInEvent(openEvent(step(s, 'cosmo', eve, 1100, DOCK), 'cosmo')!, 'cosmo:story:3', 0)
    expect(s.flags['story:cosmoDock']).toBe(1)
    expect(s.romance?.partner ?? null).toBeNull()
    expect(s.life.experiences['story:cosmoDock'].with).toEqual(['cosmo'])
    expect(npcProps(s, 'cosmo')).toEqual(['cosmoCharm', 'cosmoRack'])
    // R36 다섯째 날 루디와 보관대, 비 오면 사랑방
    const fifth = at(s, clear(eve + 1, (d) => d % 7 === 5), 980)
    expect(routineOf(fifth, 'cosmo')).toMatchObject({ with: 'rudy', at: DOCK })
    expect(routineOf(fifth, 'rudy')).toMatchObject({ with: 'cosmo', at: RUDY_DOCK })
    // (비 오는 날 끈 장식 장면이 남아 있으면 코스모는 그 장면 자리로 — 본 뒤의 일과)
    const rain = at({ ...s, life: { ...s.life, seen: [...s.life.seen, 'cosmo:small:rainCraft'] } }, wet(eve + 1, (d) => d % 7 === 5), 980)
    expect(routineOf(rain, 'cosmo')).toMatchObject({ with: 'rudy', at: { x: 10, y: 75 } })
    expect(routineOf(rain, 'rudy')).toMatchObject({ with: 'cosmo', at: { x: 10, y: 74 } })
    // 저녁엔 나루에서 조용히 — 안개 낀 날은 나루에 가지 않는다
    expect(routineOf(at(s, clear(eve + 1), 1100), 'cosmo')).toMatchObject({ doing: 'rest', at: DOCK })
    const fog = days(eve + 1).find((d) => weatherOf(d) === 'fog')!
    expect(routineOf(at(s, fog, 1100), 'cosmo')?.at).not.toEqual(DOCK)
    for (const [npc, id] of [['cosmo', 'cosmo:after'], ['cosmo', 'cosmo:fearStill'], ['cosmo', 'cosmo:fogStill'], ['cosmo', 'cosmo:memory'], ['rudy', 'rudy:cosmoDock']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    // 어부 장난감 이야기 결과는 건드리지 않는다
    expect(s.flags['story:fisherToy']).toBeUndefined()
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'cosmo')).toEqual(['cosmoCharm', 'cosmoRack'])
  })

  it('루디: 서고 문 앞 뒤 표지 모양 → 목수와 책 받침(손일) → 본인이 고른 서고 앞 한 시간, 목수 집에 받침·표지 — 서고 권수와 무관, 읽기를 고치는 보상 없음', () => {
    const seen = oldSeen('rudy')
    const weekday = (d: number) => d % 7 !== 0
    let day = dry(70, weekday)
    expect(eventNow(step(ready({ rudy: 40 }, seen.filter((x) => x !== 'rudy:library' && x !== 'rudy:shelf')), 'rudy', day, 800, SHOP), 'rudy')?.id).not.toBe('rudy:story:1')
    let s = step(ready({ rudy: 40 }, seen), 'rudy', day, 800, SHOP)
    expect(eventNow(s, 'rudy')?.id).toBe('rudy:story:1')
    s = chooseInEvent(openEvent(s, 'rudy')!, 'rudy:story:1', 2)
    day = dry(day + 1, (d) => [1, 2, 3, 5, 6].includes(d % 7))
    s = step(s, 'rudy', day, 1000, SHOP)
    expect(routineOf(s, 'carpenter')?.at).toEqual(SHOP)
    expect(eventNow(stand(s, 'carpenter', { x: 20, y: 20 }), 'rudy')?.id).not.toBe('rudy:story:2')
    s = chooseInEvent(openEvent(stand(s, 'carpenter', SHOP), 'rudy')!, 'rudy:story:2', 0)
    expect(s.life.storyWait?.mini).toBe('hold')
    s = finishStoryMini(s)
    expect(s.life.experiences['choice:rudy:story:2'].with.sort()).toEqual(['carpenter', 'rudy'])
    s = chooseInEvent(openEvent(step(s, 'rudy', dry(day + 1), 1100, LIB), 'rudy')!, 'rudy:story:3', 1)
    expect(s.flags['story:rudyStand']).toBe(1)
    expect(s.life.experiences['story:rudyStand'].with).toEqual(['rudy'])
    expect(npcProps(s, 'rudy')).toEqual(['rudyMark', 'rudyStand'])
    expect(storyPropsNow(s).filter((p) => p.npc === 'rudy').every((p) => p.room === 'carpenter')).toBe(true)
    // 책을 한 권도 꽂지 않은 저장에서도 해 질 무렵 서고 앞
    expect(Object.values(s.shelved).filter((g) => g !== undefined)).toHaveLength(0)
    expect(routineOf(at(s, dry(day + 2), 1100), 'rudy')).toMatchObject({ doing: 'book', at: LIB })
    for (const [npc, id] of [['rudy', 'rudy:after'], ['rudy', 'rudy:slowStill'], ['rudy', 'rudy:memory'], ['carpenter', 'carpenter:rudyStand']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    // 아버지 의자 곁 말은 목수 의자 이야기가 끝난 경우만
    expect(reqMet(lineReq('rudy', 'rudy:standChair'), ctxOf(s, 'rudy'))).toBe(false)
    expect(reqMet(lineReq('rudy', 'rudy:standChair'), ctxOf({ ...s, flags: { ...s.flags, 'story:carpenterChair': 1 } }, 'rudy'))).toBe(true)
    // 길 표지: 편지 나르는 이웃과 함께한 경우에만 그 이웃이 말한다
    expect(reqMet(lineReq('postman', 'postman:rudySign'), ctxOf(s, 'postman'))).toBe(false)
    s = step(s, 'rudy', dry(day + 2, weekday), 950, { x: 23, y: 8 })
    expect(routineOf(s, 'postman')?.at).toEqual({ x: 22, y: 8 })
    s = chooseInEvent(openEvent(stand(s, 'postman', { x: 22, y: 8 }), 'rudy')!, 'rudy:small:signPost', 1)
    expect(s.life.experiences['choice:rudy:small:signPost'].with.sort()).toEqual(['postman', 'rudy'])
    expect(reqMet(lineReq('postman', 'postman:rudySign'), ctxOf(s, 'postman'))).toBe(true)
    for (const w of ['빨리 읽', '빨라졌', '안 느려', '술술', '고쳐졌']) expect(newText('rudy'), w).not.toContain(w)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'rudy')).toEqual(['rudyMark', 'rudyStand'])
  })

  it('덱스터·주니퍼: 남길 모양 → 주니퍼와 비교 → 첫째 날 작은 보기 모임(말할지 그림일지는 주니퍼) → 주니퍼 제 방 선반, 관찰 종이와 첫째 날 보기 — 서고와 따로', () => {
    const seen = [...oldSeen('dexter'), ...oldSeen('juniper')]
    let day = clear(70)
    let s = step(ready({ dexter: 40, juniper: 60 }, seen, IN), 'dexter', day, 650, HILL)
    expect(eventNow(s, 'dexter')?.id).toBe('dexter:story:1')
    s = chooseInEvent(openEvent(s, 'dexter')!, 'dexter:story:1', 0)
    day = clear(day + 1)
    // 주니퍼가 이사 오기 전에는 비교 장면이 열리지 않는다
    const noJ = { ...step(s, 'dexter', day, 1040, VIEW), flags: { ...s.flags, 'movedIn:beekeeper': 0 } }
    expect(eventNow(stand(noJ, 'juniper', JUN), 'dexter')?.id).not.toBe('dexter:story:2')
    s = step(s, 'dexter', day, 1040, VIEW)
    expect(routineOf(s, 'juniper')?.at).toEqual(JUN)
    s = chooseInEvent(openEvent(stand(s, 'juniper', JUN), 'dexter')!, 'dexter:story:2', 1)
    expect(s.life.experiences['choice:dexter:story:2'].with.sort()).toEqual(['dexter', 'juniper'])
    // 주니퍼가 보여 줄 그림을 고른다
    s = chooseInEvent(openEvent(step(s, 'juniper', day, 1100, JUN), 'juniper')!, 'juniper:story:1', 0)
    expect(npcProps(s, 'juniper')).toEqual([])
    const mon = clear(day + 1, (d) => d % 7 === 1)
    s = chooseInEvent(openEvent(stand(step(s, 'dexter', mon, 1040, VIEW), 'juniper', JUN), 'dexter')!, 'dexter:story:3', 0)
    expect(s.flags['story:dexterViewing']).toBe(1)
    expect(s.life.experiences['story:dexterViewing'].with.sort()).toEqual(['dexter', 'juniper'])
    expect(npcProps(s, 'dexter')).toEqual(['dexterPaper'])
    // 주니퍼가 말할지 그림일지는 장면 안에서 주니퍼가 — 플레이어 고를 말은 반응뿐 (갈래 없음)
    expect(PEOPLE.people.dexter.events!.find((e) => e.id === 'dexter:story:3')!.choices!.every((c) => c.outcome === undefined)).toBe(true)
    expect(eventNow(step(s, 'juniper', mon, 980, SHELF), 'juniper')?.id).not.toBe('juniper:story:4') // 같은 날 아님
    s = chooseInEvent(openEvent(step(s, 'juniper', mon + 1, 980, SHELF), 'juniper')!, 'juniper:story:4', 1)
    expect(s.flags['story:juniperShow']).toBe(1)
    expect(npcProps(s, 'juniper')).toEqual(['juniperDrawing', 'juniperNotebook'])
    expect(storyPropsNow(s).filter((p) => p.npc === 'juniper').every((p) => p.room === 'beekeeper')).toBe(true)
    // R37 첫째 날 해 지기 전 언덕, 비 오면 사랑방
    const nextMon = at(s, clear(mon + 2, (d) => d % 7 === 1), 1040)
    expect(routineOf(nextMon, 'dexter')).toMatchObject({ with: 'juniper', at: VIEW })
    expect(routineOf(nextMon, 'juniper')).toMatchObject({ with: 'dexter', at: JUN })
    const wetMon = at(s, wet(mon + 2, (d) => d % 7 === 1), 1040)
    expect(routineOf(wetMon, 'dexter')).toMatchObject({ with: 'juniper', at: { x: 11, y: 74 } })
    expect(routineOf(wetMon, 'juniper')).toMatchObject({ with: 'dexter', at: { x: 12, y: 74 } })
    expect(routineOf(at(s, days(mon + 2).find((d) => d % 7 === 3)!, 980), 'juniper')).toMatchObject({ doing: 'book', at: SHELF })
    for (const [npc, id] of [['dexter', 'dexter:after'], ['dexter', 'dexter:quietOk'], ['juniper', 'juniper:after'], ['juniper', 'juniper:shelf'], ['juniper', 'juniper:wordsStill'], ['juniper', 'juniper:dexterViewing'], ['dexter', 'dexter:compared']])
      expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    // 창작 공책·그림은 말씀 서고와 따로 (사용자 결정 2: 옛 대사도 제 방 선반으로)
    expect(JSON.stringify(PEOPLE.people.juniper)).not.toContain('서고')
    expect(PEOPLE.people.juniper.events!.find((e) => e.id === 'juniper:book')!.lines[0].text).toContain('제 방 선반')
    // 양 이야기: 없어지거나 찾는 말, 백 마리 세기 숫자가 없다
    for (const w of ['없어졌', '찾았', '찾아', '잃', '아흔', '백 ', '모자라']) expect(newText('dexter') + newText('juniper'), w).not.toContain(w)
    const back = deserialize(serialize(s), CONTENT)!
    expect(npcProps(back, 'juniper')).toEqual(['juniperDrawing', 'juniperNotebook'])
    expect(npcProps(back, 'dexter')).toEqual(['dexterPaper'])
  })

  it('구름 모양·벌 운세: 점심·광장 자리에 제 발로 와 있고, 함께한 이웃만 뒷말', () => {
    const seen = [...oldSeen('dexter'), ...oldSeen('cosmo'), ...oldSeen('juniper'), 'juniper:story:1']
    const LUNCH = { x: 27, y: 22 }, COSMO_LUNCH = { x: 28, y: 22 }
    const sunny = days(70).find((d) => ['sunny', 'wind'].includes(weatherOf(d)))!
    let s = step(ready({ dexter: 40, cosmo: 40, juniper: 60 }, seen, IN), 'dexter', sunny, 730, LUNCH)
    expect(routineOf(s, 'cosmo')?.at).toEqual(COSMO_LUNCH)
    expect(reqMet(lineReq('cosmo', 'cosmo:cloudShapes'), ctxOf(s, 'cosmo'))).toBe(false)
    s = chooseInEvent(openEvent(stand(s, 'cosmo', COSMO_LUNCH), 'dexter')!, 'dexter:small:cloudShapes', 1)
    expect(s.life.experiences['choice:dexter:small:cloudShapes'].with.sort()).toEqual(['cosmo', 'dexter'])
    expect(reqMet(lineReq('cosmo', 'cosmo:cloudShapes'), ctxOf(s, 'cosmo'))).toBe(true)
    // 본 뒤에는 다시 둘이 함께하는 점심
    expect(routineOf(at(s, clear(sunny + 1), 730), 'cosmo')?.with).toBe('dexter')
    const laughDay = clear(sunny + 1)
    s = step(s, 'juniper', laughDay, 1040, { x: 21, y: 22 })
    expect(routineOf(s, 'cosmo')?.at).toEqual({ x: 21, y: 21 })
    s = chooseInEvent(openEvent(stand(s, 'cosmo', { x: 21, y: 21 }), 'juniper')!, 'juniper:short:laugh', 0)
    expect(s.life.experiences['choice:juniper:short:laugh'].with.sort()).toEqual(['cosmo', 'juniper'])
    for (const [npc, id] of [['cosmo', 'cosmo:juniperLaugh'], ['juniper', 'juniper:laugh']]) expect(reqMet(lineReq(npc, id), ctxOf(s, npc)), id).toBe(true)
    // 이야기 뒷말은 실제로 함께한 이웃만: 보관대는 루디, 받침은 목수, 보기 모임은 주니퍼
    const readers = (sid: string) => Object.values(PEOPLE.people).filter((p) => p.lines.some((l) => l.req?.story?.some((x) => x.id === sid))).map((p) => p.id).sort()
    expect(readers('cosmoDock')).toEqual(['cosmo', 'rudy'])
    expect(readers('rudyStand')).toEqual(['carpenter', 'rudy'])
    expect(readers('dexterViewing')).toEqual(['dexter', 'juniper'])
    expect(readers('juniperShow')).toEqual(['juniper'])
  })

  it('친구·연인·배우자는 서로 다른 말과 먼저 하는 제안 — 배우자는 낮에 제 일과, 새 이야기는 고백·문턱을 만들지 않는다', () => {
    const s = ready({}, [])
    for (const npc of FOUR) {
      const rel = (romance: 'dating' | 'married' | null) => ['friend', 'lover', 'spouse'].filter((r) => reqMet(lineReq(npc, `${npc}:rel:${r}`), ctxOf(s, npc, romance)))
      expect(rel(null), npc).toEqual(['friend'])
      expect(rel('dating'), npc).toEqual(['lover'])
      expect(rel('married'), npc).toEqual(['spouse'])
      const habit = PEOPLE.people[npc].events!.find((e) => e.id === `${npc}:short:spouseHabit`)!
      expect(habit.req?.rel).toEqual(['spouse'])
      for (const e of PEOPLE.people[npc].events!.filter((x) => NEW.test(x.id))) {
        expect(e.opens, e.id).toBeUndefined()
        expect(e.confess, e.id).toBeUndefined()
        expect(e.req?.lover, e.id).toBeUndefined()
      }
      // 배우자여도 낮 일과는 그대로 (연애 조건이 걸린 일과가 없다)
      expect(PEOPLE.people[npc].routines.some((r) => r.req?.rel || r.req?.lover), npc).toBe(false)
    }
    // 연인일 때 먼저 말하는 곳: 코스모는 물가가 아닌 정자
    expect(PEOPLE.people.cosmo.lines.find((l) => l.id === 'cosmo:rel:lover')!.text).toContain('정자')
    // 생활 취향은 말에서 직접 알게 된다
    for (const [npc, key] of [['cosmo', 'time.evening'], ['rudy', 'size.small'], ['dexter', 'place.hill'], ['juniper', 'activity.observe']])
      expect(PEOPLE.people[npc].lines.some((l) => l.reveals === key), npc).toBe(true)
    const text = FOUR.map(newText).join()
    for (const w of ['잔치', '등불', '등잔', '빛', '필사가님', '치료', '약효', '폭풍', '가득', '밤새', '물 위를', '건져']) expect(text, w).not.toContain(w)
  })
})
