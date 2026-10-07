// 계획 21 R5·R6·R8: 다른 마을 — 지어낸 이름, 줄지 않는 점수, 순위표, 소문 확률·하루 한 번
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { FORBIDDEN, FORBIDDEN_PLACES } from '../content/forbidden'
import { newGame } from './game'
import { rankTable, RUMOR_SPEAKERS, rumorChance, rumorNow, VILLAGES, villageScores } from './villages'

describe('다른 마을', () => {
  it('지어낸 이름 19곳, 겹치지 않고 성경·실제 지명·금지어가 없다', () => {
    expect(VILLAGES).toHaveLength(19)
    expect(new Set(VILLAGES).size).toBe(19)
    for (const v of VILLAGES) for (const re of [...FORBIDDEN, ...FORBIDDEN_PLACES]) expect(re.test(v), `${v} ${re}`).toBe(false)
  })
  it('점수는 날마다 줄지 않고, 앞서는 마을과 뒤처지는 마을이 섞인다', () => {
    for (let d = 1; d < 120; d++) {
      const a = villageScores(5, d), b = villageScores(5, d + 1)
      a.forEach((x, i) => expect(b[i]).toBeGreaterThanOrEqual(x - 1))
    }
    const s = villageScores(5, 100)
    expect(Math.max(...s) - Math.min(...s)).toBeGreaterThan(100)
  })
  it('순위표는 우리 마을 포함 20줄, 점수 순', () => {
    const t = rankTable(5, 30, 40)
    expect(t).toHaveLength(20)
    expect(t.filter((r) => r.name === null)).toHaveLength(1)
    for (let i = 1; i < t.length; i++) expect(t[i - 1].score).toBeGreaterThanOrEqual(t[i].score)
  })
})

describe('소문', () => {
  it('확률은 3%에서 차이가 크면 10%까지', () => {
    expect(rumorChance(0)).toBeCloseTo(0.03)
    expect(rumorChance(10000)).toBe(0.1)
  })
  it('하루 한 번, 소문을 들려주는 이웃만', () => {
    const s = newGame(CONTENT)
    let found = null as ReturnType<typeof rumorNow>
    let day = 1
    for (; day < 400 && !found; day++) found = rumorNow({ ...s, clock: { day, minute: 600 } }, 'baker', 3)
    expect(found).not.toBeNull()
    expect(rumorNow({ ...s, clock: { day: day - 1, minute: 600 }, flags: { ...s.flags, rumorDay: day - 1 } }, 'baker', 3)).toBeNull()
    for (let d = 1; d < 200; d++) expect(rumorNow({ ...s, clock: { day: d, minute: 600 } }, 'grandpa', 3)).toBeNull()
  })
  it('이웃마다 네 상황 문구가 있고, 성경 문장·금지어·지명이 없다', () => {
    const lines = T.rumors as Record<string, Record<string, string>>
    for (const who of RUMOR_SPEAKERS)
      for (const k of ['behind', 'farBehind', 'ahead', 'overtook']) {
        const line = lines[who][k]
        expect(line, `${who} ${k}`).toContain('{village}')
        for (const re of [...FORBIDDEN, ...FORBIDDEN_PLACES]) expect(re.test(line), `${who} ${k} ${re}`).toBe(false)
      }
  })
})
