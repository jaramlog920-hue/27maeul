import { expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { CONTENT } from '../content/catalog'
import { newGame, restAt, finishGather, canSchool, sendToSchool, heartUp, goToSleep, type GameState } from './game'
import { MINUTE_CAP } from './clock'
import { freshStats } from './stats'
import { newChild } from './child'
import { BOOKS } from './types'
import { NT_CHAPTER_COUNTS } from './progression'
import { FEATURE_RULES } from './feature-rules'
import { peopleData } from './people'

const results: Record<string, unknown> = {}
const complete = (s: GameState, n: number): GameState => ({ ...s, progress: Object.fromEntries(BOOKS.map((b, i) => [b, { completed: i < n ? Array.from({ length: NT_CHAPTER_COUNTS[b] }, (_, j) => j + 1) : [], arrangement: {} }])) as GameState['progress'] })

it('audit: clock cap permits repeated gathering and recovery without another day', () => {
  let s = newGame(CONTENT)
  s = { ...s, clock: { day: 1, minute: MINUTE_CAP }, needs: { hunger: 20, fatigue: 90, cold: 0, heat: 0 } }
  for (let i = 0; i < 25; i++) { s = restAt(s); s = finishGather(s, 'olive') }
  expect(s.clock).toEqual({ day: 1, minute: MINUTE_CAP })
  expect(s.inv.olive).toBeGreaterThanOrEqual(50)
  results.clockCap = { clock: s.clock, olive: s.inv.olive, hunger: s.needs.hunger, fatigue: s.needs.fatigue }
})

// 2026-10-21 점검: 함께하기처럼 배움터도 다 자란 아이는 맡기지 않는다 ('grown')
it('audit: an adult child living at home is no longer sent to school', () => {
  let s = complete(newGame(CONTENT), 24)
  s = { ...s, coins: 100, clock: { day: 100, minute: 600 }, child: { ...newChild(1, freshStats(), 'wit'), name: 'audit', job: 'scribe', left: false } }
  expect(canSchool(s)).toBe('grown')
  expect(sendToSchool(s, 'wit')).toBeNull()
  results.adultSchool = { allowed: false, age: 99, fee: 0 }
})

// 2026-10-13 해금을 장 수로 바꾸며 고침: 플레이어 연애(60장)가 주민 자율 생활(75장)보다 먼저 열린다
it('audit: player dating opens before NPC family autonomy', () => {
  expect(FEATURE_RULES.dating.full.chapters).toBeLessThan(FEATURE_RULES.autonomy.full.chapters)
  results.autonomy = { playerDating: '60 chapters', npcAutonomy: '75 chapters' }
})

it('audit: friendship pacing after story gates are seen', () => {
  const data = peopleData()
  results.friendship = CONTENT.neighbors.map(n => {
    const person = data.people[n.id]
    let s = newGame(CONTENT)
    s = { ...s, life: { ...s.life, seen: person?.events?.map(e => e.id) ?? [] } }
    let day = 0
    while ((s.hearts[n.id] ?? 0) < 100 && day < 200) {
      day++
      s = { ...s, clock: { day, minute: 600 } }
      s = heartUp(heartUp(heartUp(s, n.id, 2), n.id, 3), n.id, 5)
    }
    return { npc: n.id, pace: person?.pace ?? 1, daysFor100: day, theoretical: 'Daily talk+help+liked gift; zero charm; all event gates already seen; availability and acquisition excluded.' }
  })
})

it('audit: starving sleep is a morning recovery rather than lasting debt', () => {
  const s = { ...newGame(CONTENT), clock: { day: 1, minute: 1200 }, needs: { hunger: 100, fatigue: 100, cold: 0, heat: 0 } }
  const next = goToSleep(s, CONTENT, { read: false })
  expect(next.clock.minute).toBe(600)
  expect(next.needs.hunger).toBe(20)
  results.sickRecovery = { wake: next.clock.minute, needs: next.needs }
  // 감사 당시의 자료를 일반 회귀 검사로 덮어쓰지 않는다. 재측정할 때만 명시적으로 저장한다.
  if (process.env.BALANCE_AUDIT_CAPTURE === '1') writeFileSync('docs/audits/balance-2026-10-13/runtime-probes.json', JSON.stringify(results, null, 2))
})
