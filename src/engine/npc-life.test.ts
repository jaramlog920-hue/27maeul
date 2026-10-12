import { CONTENT } from '../content/catalog'
import { newGame, settle, tick } from './game'
import { newGenState, relationId } from './gen'
import { allSightings, peopleData } from './people'
import { wanderGoal } from './npc-life'
import { HOME_ENTRY, isWalkable, key, PLACES, roomAt, WARPS } from './world'

describe('주민의 산책과 마주 보는 대화', () => {
  it('주민마다 서로 다른 짧은 산책을 고르고 문·작업 자리·점유 칸·다른 방을 피한다', () => {
    const anchor = { x: 12, y: 11 }, blocked = new Set<string>(), occupied = new Set(['13,11'])
    const destinations = new Set<string>()
    for (let minute = 600; minute < 680; minute++) {
      const at = wanderGoal('baker', anchor, 11, 1, minute, blocked, occupied)
      expect(isWalkable(at)).toBe(true)
      expect(WARPS.has(key(at))).toBe(false)
      expect(occupied.has(key(at))).toBe(false)
      expect(Object.values(PLACES).some(p => p.stand && key(p.stand) === key(at))).toBe(false)
      expect(roomAt(at)).toBe(roomAt(anchor))
      expect(Math.abs(at.x-anchor.x)+Math.abs(at.y-anchor.y)).toBeLessThanOrEqual(2)
      destinations.add(key(at))
    }
    expect(destinations.size).toBeGreaterThan(2)
  })

  function village() {
    const s = newGame(CONTENT)
    const seen = [...Object.values(peopleData().people).flatMap(p => (p.events ?? []).map(e => e.id)), ...allSightings().map(w => w.id)]
    return settle({ ...s, scenes: [], clock: { day: 1, minute: 600 }, player: { ...s.player, ...HOME_ENTRY },
      flags: { ...s.flags, villageLevel: 3, ...Object.fromEntries(CONTENT.neighbors.map(n => [`movedIn:${n.id}`, 1])) },
      life: { ...s.life!, seen },
    }, CONTENT)
  }

  it('첫날부터 초기화되고, 일정 변경 시간이 아니어도 여러 주민이 실제로 걸어 움직인다', () => {
    let s = village()
    expect(s.gen).toBeUndefined()
    const first = Object.fromEntries(Object.entries(s.npcs).map(([id,n]) => [id,key({x:Math.round(n.x),y:Math.round(n.y)})]))
    const moved = new Set<string>()
    for (let i = 0; i < 100; i++) {
      s = tick(s, .5, () => .5, CONTENT).state
      for (const[id,n]of Object.entries(s.npcs))if(n.visible&&key({x:Math.round(n.x),y:Math.round(n.y)})!==first[id])moved.add(id)
    }
    expect(s.gen?.on).toBe(true)
    expect(moved.size).toBeGreaterThan(4)
  })

  it('서 있는 이웃 둘은 떠나기 전에 마주 보고 대화하고, 끝나면 다시 길을 고른다', () => {
    const base = village()
    const a = { ...base.npcs.shepherd, x: 12, y: 11, visible: true, path: [], facing: 'down' as const }
    const b = { ...base.npcs.weaver, x: 13, y: 11, visible: true, path: [], facing: 'down' as const }
    const s = { ...base, clock: { day: 1, minute: 599.9 }, gen: newGenState(CONTENT, 11, 1), npcs: { shepherd: a, weaver: b } }
    const talking = tick(s, .2, () => .5, CONTENT).state
    expect(talking.emotes).toContainEqual(expect.objectContaining({ npc: 'shepherd', partner: 'weaver' }))
    expect(talking.npcs.shepherd.facing).toBe('right')
    expect(talking.npcs.weaver.facing).toBe('left')
    expect(talking.npcs.shepherd.x).toBe(12)
    expect(talking.npcs.weaver.x).toBe(13)
    expect(talking.gen!.meets[relationId('shepherd','weaver')].n).toBe(1)
    const after = tick(talking, 6, () => .5, CONTENT).state
    expect(after.emotes?.some(e=>e.npc==='shepherd'&&e.partner==='weaver') ?? false).toBe(false)
    expect(after.npcs.shepherd.path.length + after.npcs.weaver.path.length).toBeGreaterThan(0)
  })
})
