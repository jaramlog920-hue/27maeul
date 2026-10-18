// 해산한 모임이 저장에 남아도 활성 모임이 잘리지 않는다 (2026-10-18 감사 H-3)
import { establishedGame as newGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { type GameState } from './game'
import { CLUB_HISTORY_MAX, createClub, dissolveClub, sanitizeClubs, type ClubInput } from './clubs'
import { deserialize, serialize } from './save'

function ready(day = 2, minute = 480): GameState {
  const s = newGame(CONTENT)
  return {
    ...s,
    clock: { day, minute },
    scenes: [],
    notebook: { ...s.notebook, met: CONTENT.neighbors.map((n) => n.id) },
    flags: { ...s.flags, villageLevel: 10, ...Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1])) },
    life: { ...s.life, seen: Object.values(PEOPLE.people).flatMap((p) => (p.events ?? []).map((e) => e.id)) },
  }
}
const config: ClubInput = { name: '작은 차 모임', place: 'hallTable', members: ['baker'], weekday: 2, slot: 'morning', activity: 'tea', alt: 'hallTable' }
function add(s: GameState, weekday: number, name: string): GameState {
  const r = createClub(s, { ...config, weekday, name }, CONTENT)
  expect(r.error).toBeUndefined()
  return r.state
}
const activeIds = (s: GameState) => s.clubs.filter((c) => c.active).map((c) => c.id)

describe('소모임 저장 — 해산 기록', () => {
  it('하나를 해산하고 새로 만들어도 저장·불러오기 뒤 활성 모임 셋이 그대로', () => {
    let s = add(add(add(ready(), 1, '월 모임'), 2, '화 모임'), 3, '수 모임')
    s = dissolveClub(s, 'club:1')
    s = add(s, 4, '목 모임')
    expect(activeIds(s)).toEqual(['club:2', 'club:3', 'club:4'])
    const loaded = deserialize(serialize(s), CONTENT)!
    expect(activeIds(loaded)).toEqual(['club:2', 'club:3', 'club:4'])
    expect(loaded.clubs.find((c) => c.id === 'club:1')?.active).toBe(false)
  })

  it('해산과 생성을 거듭해도 활성 모임이 남고, 남은 약속이 쓰던 번호는 다시 쓰지 않는다', () => {
    let s = ready()
    for (let i = 0; i < 3; i++) {
      s = add(s, 1 + i, `모임 ${i}`)
      s = dissolveClub(s, s.clubs.at(-1)!.id)
    }
    s = add(s, 5, '남는 모임')
    const loaded = deserialize(serialize(s), CONTENT)!
    expect(activeIds(loaded)).toEqual(['club:4'])
    // 약속 목록에만 남은 번호 (club:9)가 있으면 그다음 번호를 쓴다
    const withOld = { ...loaded, plans: { ...loaded.plans, appts: [...loaded.plans.appts, { ...loaded.plans.appts[0], id: 'club:9:day:1', clubId: 'club:9' }] } }
    expect(add(withOld, 6, '새 모임').clubs.at(-1)!.id).toBe('club:10')
  })

  it('정리: 활성은 셋까지, 해산 기록은 최근 것만, 이름이 글자가 아니면 버린다', () => {
    const club = (i: number, active: boolean, name: unknown = `모임${i}`) => ({ id: `club:${i}`, name, activity: 'tea', place: 'hallTable', members: ['baker'], weekday: 1, slot: 'morning', active, paused: false })
    const raw = [
      ...Array.from({ length: CLUB_HISTORY_MAX + 5 }, (_, i) => club(i + 1, false)),
      club(100, true),
      club(101, true, 7),
      club(102, true),
      club(103, true),
      club(104, true),
    ]
    const out = sanitizeClubs(raw)
    expect(out.filter((c) => c.active).map((c) => c.id)).toEqual(['club:100', 'club:102', 'club:103'])
    expect(out.filter((c) => !c.active)).toHaveLength(CLUB_HISTORY_MAX)
    expect(out.find((c) => c.id === 'club:1')).toBeUndefined()
  })
})
