// 2026-10-11 시간·행사·저장 점검(docs/playtest-시간행사저장-2026-10-11.md)에서 찾은 버그의 회귀 검사
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { festivalOf } from './calendar'
import { scheduledEvents } from './events'
import { goToSleep, newGame, rankMorning, type GameState } from './game'
import { deserialize, serialize } from './save'
import { legacyGame } from './growth-test-support'
import { canRead, isReadingDay, READING_FROM } from './meetings'
import { NO_ROMANCE } from './romance'
import { HILL_SPOTS } from './bonds'
import { findPath } from './movement'
import { isWalkable, PLACES, tileAt } from './world'

const k = (t: { x: number; y: number }) => `${t.x},${t.y}`

describe('1. 언덕 의자 자리에서 소풍·별 보는 밤 동안 갇히지 않는다', () => {
  it('모든 이웃이 언덕 자리에 서도 의자 자리에서 마을로, 마을에서 의자 자리로 길이 있다', () => {
    const map: string[] = []
    for (let y = 8; y <= 15; y++) { let row = ''; for (let x = 7; x <= 20; x++) row += Object.values(HILL_SPOTS).some((t) => t.x === x && t.y === y) ? '@' : PLACES.hill.stand!.x === x && PLACES.hill.stand!.y === y ? '*' : isWalkable({ x, y }) ? '.' : tileAt(x, y); map.push(row) }
    const blockers = new Set(Object.values(HILL_SPOTS).map(k))
    const well = PLACES.well.stand!
    expect(findPath(PLACES.hill.stand!, well, blockers), map.join('\n')).not.toBeNull()
    expect(findPath(well, PLACES.hill.stand!, blockers), map.join('\n')).not.toBeNull()
  })
})

describe('2. 잔치 날은 읽기 모임을 쉰다', () => {
  const festDay = (() => { let d = 1; while (!(festivalOf(d) && isReadingDay(d))) d++; return d })()
  const at = (day: number, extra: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), clock: { day, minute: READING_FROM + 10 }, ...extra })
  it('마을 잔치와 겹친 읽기 모임 날에는 열리지 않고 일정표에도 없다', () => {
    expect(festDay).toBe(110)
    expect(canRead(at(festDay))).toBe('feast')
    expect(scheduledEvents(at(festDay), CONTENT).some((e) => e.id === `${festDay}:reading`)).toBe(false)
    // 다른 읽기 모임 날은 그대로
    expect(canRead(at(festDay + 7))).toBeNull()
  })
  it('복음서 방 잔치·내 결혼 잔치·주민 결혼 잔치 날도 쉰다', () => {
    const d = 12
    expect(canRead(at(d))).toBeNull()
    expect(canRead(at(d, { flags: { gospelFeast: 1 } }))).toBe('feast')
    expect(canRead(at(d, { romance: { ...NO_ROMANCE, partner: 'tilly', stage: 'engaged', since: 1, weddingDay: d } }))).toBe('feast')
    const g = at(d)
    const gen = { ...(g.gen ?? {}), relations: { r: { id: 'r', a: 'basil', b: 'poppy', stage: 'preparing', prep: { wedding: d } } } } as never
    expect(canRead({ ...g, gen })).toBe('feast')
    // 앞날의 일정표: 결혼 잔치 날의 읽기 모임은 빠진다
    expect(scheduledEvents({ ...at(d - 3), romance: { ...NO_ROMANCE, partner: 'tilly', stage: 'engaged', since: 1, weddingDay: d } }, CONTENT).some((e) => e.id === `${d}:reading`)).toBe(false)
  })
})

describe('3. 닫지 않은 순위 창은 다음 날 아침 다시 뜨지 않는다', () => {
  it('순위 날 창을 닫기 전에 저장·불러오기를 하고 하루 자도 지난 순위 창이 남지 않는다', () => {
    const s = rankMorning({ ...legacyGame(CONTENT), clock: { day: 21, minute: 6 * 60 } }, CONTENT)
    expect(s.rankPopup?.day).toBe(21)
    const loaded = deserialize(serialize(s), CONTENT)!
    const next = goToSleep({ ...loaded, clock: { day: 21, minute: 22 * 60 } }, CONTENT)
    expect(next.clock.day).toBe(22)
    expect(next.rankPopup).toBeUndefined()
  })
  it('이사 편지 창도 같다', () => {
    const g = newGame(CONTENT)
    const s = { ...g, clock: { day: 30, minute: 22 * 60 }, farewellPopup: { npc: 'baker', day: 29, letter: 0, gift: {} } } as GameState
    expect(goToSleep(s, CONTENT).farewellPopup).toBeUndefined()
  })
})
