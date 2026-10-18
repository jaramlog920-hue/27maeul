// 마을 사건 단계 창 × 시각·요일·날씨 (2026-10-18 감사 H-5·L-55)
// 마을 사건(thread)에 묶인 이야기는 단계 창과 열리는 때가 겹치는 날이 있어야 한다. 웬델의 3단계 문턱은 사건이 끝난 뒤에도 열려야 한다
import { CONTENT } from '../content/catalog'
import { weatherOf } from './calendar'
import { seasonOf } from './clock'
import { eventNow, newGame, stageWith, type GameState } from './game'
import { peopleData, threadPhase, whenMatches, type When } from './people'

const dryDay = (from: number) => {
  let d = from
  while (['rain', 'snow'].includes(weatherOf(d))) d++
  return d
}

describe('마을 사건 단계 창', () => {
  it('사건에 묶인 이야기·목격·말·일과는 1~400일 중 열릴 수 있는 날이 하루는 있다', () => {
    const d = peopleData()
    const never: string[] = []
    const check = (id: string, when: When | undefined, thread: string, phases: number[]) => {
      const t = d.threads.find((x) => x.id === thread)
      if (!t) return never.push(`${id}: 없는 사건 ${thread}`)
      for (let day = 1; day <= 400; day++) {
        if (!phases.includes(threadPhase(t, day))) continue
        for (let m = 360; m < 1560; m += 10) if (whenMatches(when, { day, minute: m % 1440, weather: weatherOf(day), season: seasonOf(day) })) return
      }
      never.push(id)
    }
    for (const p of Object.values(d.people)) {
      for (const e of p.events ?? []) if (e.req?.thread) check(e.id, e.when, e.req.thread.id, e.req.thread.phase)
      for (const s of p.sightings ?? []) if (s.req?.thread) check(s.id, s.when, s.req.thread.id, s.req.thread.phase)
      for (const l of p.lines) if (l.req?.thread) check(`line ${l.id}`, l.when, l.req.thread.id, l.req.thread.phase)
    }
    expect(never).toEqual([])
  })

  it('웬델의 3단계 문턱(과자 연구)은 빵 사건이 끝난 뒤(24일 이후)에도 열린다', () => {
    const s0 = newGame(CONTENT)
    const day = dryDay(30)
    const s: GameState = { ...s0, clock: { ...s0.clock, day, minute: 690 }, hearts: { ...s0.hearts, wendell: 29 }, life: { ...s0.life, seen: [...s0.life.seen, 'wendell:first'] } }
    expect(stageWith(s, 'wendell')).toBe(2)
    expect(eventNow(s, 'wendell')?.id).toBe('wendell:research')
  })
})
