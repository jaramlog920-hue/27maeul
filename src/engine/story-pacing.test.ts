// 이웃 이야기가 한꺼번에 쏟아지지 않게 (2026-10-19 사용자): 같은 이웃은 하루 하나, 마을 전체 하루 둘 — 남은 것은 다음 날.
// 진행 단계(thread)에 묶인 사건은 며칠 안에 닫히므로 제한하지 않는다
import { CONTENT, PEOPLE } from '../content/catalog'
import { eventNow, openEvent, settle, STORIES_PER_DAY, storiesToday, type GameState } from './game'
import { legacyGame } from './growth-test-support'
import { setPeopleData, type PeopleData, type SceneLine } from './people'
import type { Tile } from './types'

const say = (speaker: string): SceneLine => ({ speaker, text: '…' })
const SHOP: Tile = { x: 6, y: 24 }
const BAKERY: Tile = { x: 1, y: 17 }
const ev = (id: string, at: Tile, extra: object = {}) => ({ id, title: id, stage: 0 as const, at, lines: [say('narration')], ...extra })

const DATA: PeopleData = {
  people: {
    carpenter: { id: 'carpenter', pace: 1, routines: [], lines: [], events: [ev('carpenter:a', SHOP), ev('carpenter:b', SHOP, { req: { seen: ['carpenter:a'] } })] },
    wendell: { id: 'wendell', pace: 1, routines: [], lines: [], events: [ev('wendell:a', BAKERY)] },
    baker: { id: 'baker', pace: 1, routines: [], lines: [], events: [ev('baker:a', { x: 3, y: 17 })] },
    tilly: { id: 'tilly', pace: 1, routines: [], lines: [], events: [ev('tilly:thread', { x: 30, y: 20 }, { req: { thread: { id: 'forge', phase: [0, 1, 2, 3, 4, 5] } } })] },
  },
  threads: [{ id: 'forge', end: 999, phases: [{ day: 1 }] }],
}
beforeEach(() => setPeopleData(DATA))
afterAll(() => setPeopleData(PEOPLE))

const stand = (s: GameState, npc: string, t: Tile): GameState => ({ ...s, npcs: { ...s.npcs, [npc]: { ...s.npcs[npc], x: t.x, y: t.y, visible: true, path: [] } } })
function start(): GameState {
  const s = settle(legacyGame(CONTENT), CONTENT)
  const moved = Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1]))
  return { ...s, flags: { ...s.flags, ...moved, villageLevel: 27 }, clock: { ...s.clock, day: 40, minute: 600 } }
}
const nextDay = (s: GameState): GameState => ({ ...s, clock: { ...s.clock, day: s.clock.day + 1 } })

describe('하루 이야기 수', () => {
  it('같은 이웃의 다음 이야기는 다음 날에 열린다', () => {
    let s = stand(start(), 'carpenter', SHOP)
    s = openEvent(s, 'carpenter')!
    expect(s.scenes).toContain('ev:carpenter:a')
    expect(eventNow(s, 'carpenter')).toBeNull()
    expect(eventNow(nextDay(s), 'carpenter')?.id).toBe('carpenter:b')
  })

  it(`마을 전체로 하루 ${STORIES_PER_DAY}개까지 — 셋째 이웃은 다음 날`, () => {
    let s = stand(stand(stand(start(), 'carpenter', SHOP), 'wendell', BAKERY), 'baker', { x: 3, y: 17 })
    s = openEvent(s, 'carpenter')!
    s = openEvent(s, 'wendell')!
    expect(storiesToday(s)).toBe(2)
    expect(eventNow(s, 'baker')).toBeNull()
    expect(eventNow(nextDay(s), 'baker')?.id).toBe('baker:a')
  })

  it('진행 단계에 묶인 사건은 제한과 상관없이 열리고, 하루 수에 세지 않는다', () => {
    let s = stand(stand(stand(start(), 'carpenter', SHOP), 'wendell', BAKERY), 'tilly', { x: 30, y: 20 })
    s = openEvent(openEvent(s, 'carpenter')!, 'wendell')!
    expect(eventNow(s, 'tilly')?.id).toBe('tilly:thread')
    s = openEvent(s, 'tilly')!
    expect(storiesToday(s)).toBe(2)
  })
})
