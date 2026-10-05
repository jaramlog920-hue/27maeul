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
import { hasMemory, NO_LIFE, sanitizeLife, setPeopleData, type PeopleData, type SceneLine } from './people'
import type { Tile } from './types'
import { deserialize, serialize } from './save'
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
