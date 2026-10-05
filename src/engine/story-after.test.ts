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
