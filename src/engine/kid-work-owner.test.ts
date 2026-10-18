// 집 겸 일터 들르기는 함께하는 아이의 일터에서만 (2026-10-18 감사 M-5)
import { CONTENT } from '../content/catalog'
import { ADULT_AT, newChild } from './child'
import type { GameState } from './game'
import { establishedGame } from './growth-test-support'
import { visitKidWork } from './newland-life'
import { swapKid } from './siblings'

const adult = (born: number, name: string, job: 'cook' | 'painter') => ({ ...newChild(born, establishedGame(CONTENT, 10).stats, undefined), born, name, job, jobConfirmed: true })
const build = (id: string, owner?: string) => ({ id, kind: 'kidWork', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, ...(owner ? { owner } : {}) })
const DAY = 400

function world(builds: ReturnType<typeof build>[]): GameState {
  const base = establishedGame(CONTENT, 300)
  const A = adult(DAY - ADULT_AT - 30, 'A', 'cook')
  const B = adult(DAY - ADULT_AT - 10, 'B', 'cook')
  return { ...base, clock: { day: DAY, minute: 600 }, child: A, siblings: [B], newland: { builds, tiles: {}, nextId: 9 } as never }
}

describe('집 겸 일터 들르기', () => {
  it('일터가 첫째 것 하나뿐이면, 둘째로 바꿔 같은 날 다시 접시를 받을 수 없다', () => {
    const s = world([build('b1', `me:${DAY - ADULT_AT - 30}`)])
    const r1 = visitKidWork(s)!
    expect(r1.dish).toBeTruthy()
    expect(visitKidWork(swapKid(r1.state, 0))).toBeNull()
  })
  it('이웃 자녀의 일터만 있으면 내 아이로 들를 수 없다', () => {
    expect(visitKidWork(world([build('b1', 'g-0001')]))).toBeNull()
  })
  it('주인 없는 옛 일터는 함께하는 아이 몫으로 들를 수 있다', () => {
    expect(visitKidWork(world([build('b1')]))).not.toBeNull()
  })
  it('둘째도 제 일터가 있으면 둘째로 들를 수 있다', () => {
    const s = world([build('b1', `me:${DAY - ADULT_AT - 30}`), build('b2', `me:${DAY - ADULT_AT - 10}`)])
    const r1 = visitKidWork(s)!
    expect(visitKidWork(swapKid(r1.state, 0))).not.toBeNull()
  })
})
