// 계획 20 2부 작업 D: 주민 결혼 잔치 — 달력에 뜨고, 그날 저녁 두 사람은 모닥불 위에 나란히, 이웃은 둘레에
import { CONTENT } from '../content/catalog'
import { FESTIVAL_FROM } from './calendar'
import { GEN_WEDDING_SIDE, newGame, tick, type GameState } from './game'
import { newGenState, relationId } from './gen'
import { withPairs } from './gen-settle'
import { scheduledEvents } from './events'
import { WEDDING_SPOT } from './romance'
import { isWalkable } from './world'

const RP = relationId('rudy', 'poppy')
const state = (minute: number, wedding = 12): GameState => {
  const s = newGame(CONTENT)
  const g = newGenState(CONTENT, 3, 10, withPairs())
  return {
    ...s,
    scenes: [],
    clock: { day: 12, minute },
    flags: { ...s.flags, ...Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1])) },
    gen: { ...g, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'preparing', since: 5, prep: { tasks: ['bread', 'oil'], done: [], wedding } } } },
  }
}

describe('주민 결혼 잔치', () => {
  it('일정 창에 7일 안의 잔치가 뜬다', () => {
    const ev = scheduledEvents(state(600, 15), CONTENT).find((e) => e.id.includes('genWedding'))
    expect(ev).toMatchObject({ day: 15, title: '파피와 루디 결혼 잔치', location: '광장 모닥불' })
    expect(scheduledEvents(state(600, 30), CONTENT).some((e) => e.id.includes('genWedding'))).toBe(false)
  })
  it('잔치 날 저녁, 두 사람은 모닥불 위에 나란히 선다 (두 번째 칸도 걸을 수 있다)', () => {
    expect(isWalkable(GEN_WEDDING_SIDE)).toBe(true)
    const r = tick(state(FESTIVAL_FROM + 5), 0.01, () => 0.5, CONTENT)
    expect(r.state.npcs.poppy.goal).toEqual(WEDDING_SPOT)
    expect(r.state.npcs.rudy.goal).toEqual(GEN_WEDDING_SIDE)
  })
  it('잔치 날이 아니면 평소 자리', () => {
    const r = tick(state(FESTIVAL_FROM + 5, 13), 0.01, () => 0.5, CONTENT)
    expect(r.state.npcs.poppy.goal).not.toEqual(WEDDING_SPOT)
  })
})
