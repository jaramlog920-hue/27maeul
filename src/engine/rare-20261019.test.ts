// 2026-10-19 감사 드문 상황: 결혼 준비 주민에게 다발(L-22), 벽걸이 아래 벽(L-23), 이어받은 자녀의 새 터 집(L-27)
import { CONTENT, PEOPLE } from '../content/catalog'
import { buildWall, canBuildWall, giveBouquet, newGame, placeFurniture, settle, syncHome, type GameState } from './game'
import { newGenState, relationId } from './gen'
import { withPairs } from './gen-settle'
import { livesInNewland } from './gen-homes'
import { establishedGame, legacyGame } from './growth-test-support'
import { BABY_ROOM } from './home-layout'
import { setPeopleData } from './people'

beforeEach(() => setPeopleData(PEOPLE))

describe('결혼 준비 중인 주민에게 들꽃 다발 (L-22)', () => {
  it('사귀기 시작한 그 자리에서 주민과의 결혼 준비가 풀린다 — 그날 저녁 주민 결혼식에 서지 않는다', () => {
    const s = establishedGame(CONTENT, 17)
    const RP = relationId('rudy', 'poppy')
    const g = newGenState(CONTENT, 3, 10, withPairs())
    const ready: GameState = {
      ...s,
      life: { ...s.life, seen: PEOPLE.people.poppy.events?.map((e) => e.id) ?? [] },
      hearts: { poppy: 80 },
      inv: { bouquet: 1 },
      gen: { ...g, relations: { [RP]: { id: RP, a: 'poppy', b: 'rudy', stage: 'preparing', since: 5, prep: { tasks: ['bread', 'oil'], done: [], wedding: s.clock.day } } } },
    }
    const dating = giveBouquet(ready, CONTENT.neighbors.find((n) => n.id === 'poppy')!)
    expect(dating.romance.partner).toBe('poppy')
    expect(dating.gen?.relations[RP]).toBeUndefined()
  })
})

describe('벽걸이 바로 아래에 벽 세우기 (L-23)', () => {
  it('아래가 바닥이 아니게 된 벽걸이는 가방으로 돌아간다', () => {
    const base = settle(legacyGame(CONTENT, { look: 'f', name: '하늘' } as never), CONTENT)
    const s: GameState = { ...base, homeLevel: 3, coins: 100, flags: { ...base.flags, growthLegacy: 1 }, inv: { ...base.inv, spiceShelf: 1 } }
    syncHome(s)
    const wall = { x: BABY_ROOM.x0 + 2, y: BABY_ROOM.y0 }
    const hung = placeFurniture(s, 'spiceShelf', wall)!
    expect(hung).not.toBeNull()
    expect(hung.inv.spiceShelf ?? 0).toBe(0)
    const below = { x: wall.x, y: wall.y + 1 }
    expect(canBuildWall(hung, below)).toBeNull()
    const built = buildWall(hung, below)!
    expect(built.room.some((f) => f.item === 'spiceShelf')).toBe(false)
    expect(built.inv.spiceShelf).toBe(1)
  })
})

describe('자리를 이어받은 자녀 가족의 새 터 집 (L-27)', () => {
  it('이웃 자리 id로 물어도 그 자리에 선 자녀가 새 터 집 가구에 있으면 새 터에 산다', () => {
    const s = newGame(CONTENT)
    const g = newGenState(CONTENT, 3, 10, withPairs())
    const heir = 'heir-1'
    const build = { id: 'b1', kind: 'home' as const, x: 4, y: 12, facing: 'down' as const, state: 'done' as const, orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
    const state = {
      ...s,
      flags: { ...s.flags, 'familyHome:1': 1 },
      newland: { builds: [build], tiles: {}, nextId: 2, settledDay: 1 },
      gen: { ...g, retired: { merchant: { heir, day: 1 } }, households: { 'h-1': { id: 'h-1', home: 'merchant', members: [heir] } } },
    } as unknown as GameState
    expect(livesInNewland(state, heir)).toBe(true)
    expect(livesInNewland(state, 'merchant')).toBe(true)
    expect(livesInNewland(state, 'baker')).toBe(false)
  })
})
