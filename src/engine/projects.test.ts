// 계획 16 작업 20: 주민이 함께 바꾸는 마을 — 시설 자리·완성·옛 저장
import { CONTENT, PEOPLE } from '../content/catalog'
import { newGame, type GameState } from './game'
import { PROJECT_NEED, advanceVillage, builtFlag, completeProject, isBuilt, pickProject, sanitizeVillage, villageOf } from './projects'
import { FACILITY_IDS, SITES } from './village-sites'
import { MAP, VILLAGE_H, isWalkable, lockedZones, propSpotProblem, roomAt, tileAt, zoneAt } from './world'
import { deserialize, serialize } from './save'

const key = (t: { x: number; y: number }) => `${t.x},${t.y}`

describe('공동 시설 자리', () => {
  it('시설 칸은 풀밭이고 길·문·집·잠긴 구역과 겹치지 않으며 서로 겹치지 않는다', () => {
    const doors = new Set(CONTENT.neighbors.map((n) => key(n.door)))
    const seen = new Set<string>()
    for (const id of FACILITY_IDS) {
      for (const t of SITES[id].tiles) {
        expect(t.y < VILLAGE_H && !roomAt(t), `${id} ${key(t)} 바깥`).toBe(true)
        expect(tileAt(t.x, t.y), `${id} ${key(t)} 풀밭`).toBe('.')
        expect(doors.has(key(t)), `${id} ${key(t)} 문`).toBe(false)
        expect(zoneAt(t), `${id} ${key(t)} 구역`).toBeNull()
        expect(propSpotProblem([t]), `${id} ${key(t)}`).toBeNull()
        expect(seen.has(key(t)), `${id} ${key(t)} 겹침`).toBe(false)
        seen.add(key(t))
      }
      for (const t of [...SITES[id].crew, SITES[id].stand, ...SITES[id].seats]) {
        expect(isWalkable(t), `${id} ${key(t)} 걸을 수 있다`).toBe(true)
        expect(doors.has(key(t))).toBe(false)
      }
    }
    expect(lockedZones(0).length).toBeGreaterThan(0)
    expect(MAP.length).toBeGreaterThan(0)
  })
  it('이웃이 놓은 이야기 소품·일과 칸과 시설 칸이 겹치지 않는다', () => {
    const taken = new Set<string>()
    for (const id of FACILITY_IDS) for (const t of SITES[id].tiles) taken.add(key(t))
    for (const p of Object.values(PEOPLE.people)) for (const pr of p.props ?? []) expect(taken.has(key(pr.at)), pr.id).toBe(false)
  })
})

describe('사업 완성', () => {
  const settle = (): GameState => { const g = newGame(CONTENT); return { ...g, flags: { ...g.flags, villageLevel: 99 } } }
  it('완성은 표식 하나만 남기고 두 번 완성돼도 달라지지 않는다 — 말씀 조각·필사는 건드리지 않는다', () => {
    let s = settle()
    const before = { ...s.flags }
    s = completeProject(s, 'longBench', s.clock.day)
    expect(isBuilt(s.flags, 'longBench')).toBe(true)
    expect(s.flags[builtFlag('longBench')]).toBe(1)
    for (const [k, v] of Object.entries(before)) expect(s.flags[k], k).toBe(v)
    expect(completeProject(s, 'longBench', s.clock.day)).toBe(s)
  })
  it('주민 공급분만으로도 끝난다 (플레이어가 거들지 않아도, 날짜 제한 없이)', () => {
    let s = settle()
    s = pickProject(s, 'longBench', CONTENT)
    expect(villageOf(s).active).toBe('longBench')
    for (let i = 1; i <= 12 && !isBuilt(s.flags, 'longBench'); i++) s = advanceVillage({ ...s, clock: { ...s.clock, day: s.clock.day + 1 } }, CONTENT)
    expect(isBuilt(s.flags, 'longBench')).toBe(true)
    expect(villageOf(s).projects.longBench!.units).toBeLessThanOrEqual(PROJECT_NEED)
  })
})

describe('옛 저장', () => {
  it('마을 정보가 없는 저장도 열리고, 이미 있던 해금 표식은 그대로다', () => {
    const s = newGame(CONTENT)
    const old: GameState = { ...s, flags: { ...s.flags, 'story:bakeryBench': 1, 'story:village:signPost': 1 }, village: undefined }
    const back = deserialize(serialize(old), CONTENT)!
    expect(back.flags['story:bakeryBench']).toBe(1)
    expect(back.flags['story:village:signPost']).toBe(1)
    expect(sanitizeVillage(undefined, back.flags, 1)).toBeUndefined()
    expect(sanitizeVillage({ projects: { nonsense: { need: 3 } }, active: 'nonsense' }, {}, 1)?.active).toBeUndefined()
  })
})
