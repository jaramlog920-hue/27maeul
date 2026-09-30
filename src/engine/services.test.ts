// 집마다 직업 → 주고받기: 하루 한 번씩, 닢·재료를 내고 그 집 솜씨를 받는다
import { CONTENT } from '../content/catalog'
import { dayOf } from './calendar'
import { canService, doService, newGame, type GameState } from './game'
import { SERVICES, servicesOf } from './services'

const svc = (id: string) => SERVICES.find((x) => x.id === id)!
const on = (s: GameState, day: number): GameState => ({ ...s, clock: { ...s.clock, day, minute: 600 } })

describe('주고받기', () => {
  it('직업 있는 이웃 집마다 한 가지 이상', () => {
    for (const id of ['baker', 'shepherd', 'weaver', 'beekeeper', 'fisher', 'presser', 'grandpa', 'child', 'postman', 'smith', 'apothecary', 'carpenter'])
      expect(servicesOf(id).length, id).toBeGreaterThan(0)
    for (const x of SERVICES) expect(CONTENT.neighbors.some((n) => n.id === x.npc), x.id).toBe(true)
  })

  it('닢을 내고 사고, 하루에 한 번', () => {
    const s = { ...newGame(CONTENT), coins: 10 }
    const r = doService(s, svc('shepherdWool'))!
    expect(r.coins).toBe(5)
    expect(r.inv.wool).toBe((s.inv.wool ?? 0) + 1)
    expect(canService(r, svc('shepherdWool'))).toBe('done')
    expect(canService(on(r, r.clock.day + 1), svc('shepherdWool'))).toBeNull()
  })

  it('재료를 맡기면 만들어 주고, 모자라면 못 한다', () => {
    const s = { ...newGame(CONTENT), inv: { olive: 3 } }
    expect(canService({ ...s, inv: { olive: 2 } }, svc('presserOil'))).toBe('need')
    const r = doService(s, svc('presserOil'))!
    expect(r.inv.olive ?? 0).toBe(0)
    expect(r.inv.oil).toBe(1)
  })

  it('팔면 닢을 받는다', () => {
    const s = { ...newGame(CONTENT), coins: 0, inv: { reed: 3 } }
    expect(doService(s, svc('fisherReeds'))!.coins).toBe(6)
  })

  it('포도는 포도 철에만', () => {
    const s = { ...newGame(CONTENT), coins: 10 }
    expect(canService(on(s, 1), svc('grandpaGrapes'))).toBe('season')
    expect(canService(on(s, dayOf('autumn', 3)), svc('grandpaGrapes'))).toBeNull()
  })
})
