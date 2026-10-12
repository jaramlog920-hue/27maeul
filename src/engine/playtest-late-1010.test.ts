// 2026-10-10 중후반 플레이 점검(docs/playtest-late-2026-10-10.md)에서 찾은 버그의 회귀 검사
import { describe, expect, it } from 'vitest'
import people from '../content/people.json'
import { CONTENT } from '../content/catalog'
import { goToSleep, lessonTime, newGame, tick, WEDDING_GATHER, type GameState } from './game'
import { DAY_START } from './clock'
import { FESTIVAL_FROM } from './calendar'
import { planGathering } from './bonds'
import { scheduledEvents } from './events'
import { FIRE } from './neighbors'
import { NO_ROMANCE } from './romance'
import { LESSON_FROM } from './stories'

const zero = () => 0

describe('이야기 사건 시간', () => {
  it('하루가 시작되기(06:00) 전에만 열리는 사건이 없다', () => {
    const bad: string[] = []
    for (const p of Object.values((people as { people: Record<string, { events?: { id: string; when?: { from?: number; to?: number } }[] }> }).people))
      for (const e of p.events ?? []) {
        const w = e.when
        if (w?.from !== undefined && w.to !== undefined && w.from < w.to && w.to <= DAY_START) bad.push(e.id)
      }
    expect(bad).toEqual([])
  })
})

/** 약혼해 오늘이 결혼 잔치 날인 상태 */
function weddingDay(day: number, extra: Partial<GameState> = {}): GameState {
  const g = newGame(CONTENT)
  return {
    ...g,
    clock: { day, minute: 17 * 60 },
    hearts: { ...g.hearts, tilly: 100, child: 100 },
    flags: { ...g.flags, childAsked: 1 },
    romance: { ...NO_ROMANCE, partner: 'tilly', stage: 'engaged', since: day - 10, weddingDay: day },
    ...extra,
  }
}

describe('결혼 잔치 날 저녁', () => {
  it('글자 공부가 잡히지 않는다 (약혼만 한 다른 날은 그대로)', () => {
    let day = 30
    while (!lessonTime({ ...weddingDay(day), romance: NO_ROMANCE, clock: { day, minute: LESSON_FROM } })) day++
    expect(lessonTime({ ...weddingDay(day), clock: { day, minute: LESSON_FROM } })).toBe(false)
  })

  it('일정표에 내 결혼 잔치가 나오고, 글자 공부는 없다', () => {
    const s = weddingDay(40)
    const today = scheduledEvents(s, CONTENT).filter((e) => e.day === 40)
    expect(today.some((e) => e.id === '40:wedding' && e.title.includes('틸리') && e.from === FESTIVAL_FROM)).toBe(true)
    expect(today.some((e) => e.id === '40:lesson')).toBe(false)
  })

  it('별 보는 밤을 잡지 않는다', () => {
    let day = 30
    while (planGathering(day, 3, {}) !== 'starNight') day++
    const night = (romance: GameState['romance']): GameState => {
      const s = weddingDay(day - 1, { romance })
      const hearts = Object.fromEntries(Object.keys(s.npcs).map((id) => [id, 100]))
      return { ...s, hearts, clock: { day: day - 1, minute: 22 * 60 }, flags: { ...s.flags, villageLevel: 3 }, scenes: [] }
    }
    const control = goToSleep(night(NO_ROMANCE), CONTENT)
    // 대조: 결혼 잔치가 없으면 그날 별 보는 밤이 잡힌다
    expect(control.today.gathering).toBe('starNight')
    const s = goToSleep(night({ ...NO_ROMANCE, partner: 'tilly', stage: 'engaged', since: day - 10, weddingDay: day }), CONTENT)
    expect(s.today.gathering).not.toBe('starNight')
    expect(s.today.inviter).toBeNull()
  })

  it('장면은 이웃이 모여든 뒤(시작 30분 뒤)에 열린다', () => {
    const at = (minute: number) => {
      const s = weddingDay(40)
      return tick({ ...s, clock: { day: 40, minute }, player: { ...s.player, x: FIRE.x + 2, y: FIRE.y, path: [] } }, 0.05, zero, CONTENT).state
    }
    expect(at(FESTIVAL_FROM).romance.stage).toBe('engaged')
    expect(at(FESTIVAL_FROM + WEDDING_GATHER).romance.stage).toBe('married')
  })
})
