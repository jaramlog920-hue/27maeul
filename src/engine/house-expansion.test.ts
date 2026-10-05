import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { canOrderHome, canGiveCord, furnishSpouse, goToSleep, moveFurniture, newGame, nextHomeStage, orderHome, placeFurniture, removeFurniture, settle, syncHome, type GameState } from './game'
import { BABY_ROOM, FIXTURES, LIVING_ROOM, PARTNER_DOOR, PARTNER_ROOM, WORKSHOP } from './home-layout'
import { HOME_ENTRY, HOME_FRONT, isHome, isWalkable, PLACES, setHomeLevel, tileAt } from './world'
import { findPath } from './movement'
import { deserialize, serialize } from './save'
import { solidTiles, spouseFurniture } from './room'
import designs from '../content/spouse-rooms.json'
import { route } from './neighbors'

const rich = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, coins: 2000, inv: { ...s.inv, olive: 30, papyrus: 20 }, flags: { ...s.flags, 'movedIn:carpenter': 1 } }
}
const build = (s: GameState) => goToSleep(orderHome(s)!, CONTENT)
beforeEach(() => newGame(CONTENT))

describe('세 차례 집 증축', () => {
  it('각 방을 순서대로 주문하고 다음 날 완성하며 세 번 뒤 주문을 끝낸다', () => {
    let s = rich()
    for (const level of [1, 2, 3]) {
      expect(nextHomeStage(s)?.level).toBe(level)
      const ordered = orderHome(s)!
      expect(ordered.homeLevel).toBe(level - 1)
      expect(canOrderHome(ordered)).toBe('ordered')
      s = goToSleep(ordered, CONTENT)
      expect(s.homeLevel).toBe(level)
      expect(s.scenes).toContain(`home:${level}`)
    }
    expect(nextHomeStage(s)).toBeNull()
    expect(canOrderHome(s)).toBe('done')
    expect(orderHome(s)).toBeNull()
  })
  it('1단계는 뒤쪽의 빈 배우자방이며 오른쪽 아기방과 왼쪽 생활방은 아직 없다', () => {
    const s = build(rich())
    expect(s.room.filter(f => f.item.startsWith('spouse:'))).toHaveLength(0)
    expect(PARTNER_ROOM.y1).toBe(WORKSHOP.y0)
    expect(BABY_ROOM.x0).toBe(WORKSHOP.x1)
    expect(LIVING_ROOM.x1).toBe(WORKSHOP.x0)
    expect(tileAt(PARTNER_DOOR.x, PARTNER_DOOR.y)).toBe('D')
    expect(findPath(HOME_ENTRY, { x: 21, y: 107 }, solidTiles(s.room))).not.toBeNull()
    expect(isHome({ x: 26, y: 112 })).toBe(false)
    expect(isHome({ x: 10, y: 112 })).toBe(false)
  })
  it('증축된 모든 방으로 걸어가며 단계가 낮으면 미건축 방에 가구를 놓지 못한다', () => {
    let s = rich()
    for (const [level, at] of [[1, { x: 21, y: 107 }], [2, { x: 28, y: 113 }], [3, { x: 10, y: 113 }]] as const) {
      expect(placeFurniture({ ...s, inv: { chair: 1 } }, 'chair', at)).toBeNull()
      s = build(s)
      expect(s.homeLevel).toBe(level)
      expect(isHome(at)).toBe(true)
      expect(findPath(HOME_ENTRY, at, solidTiles(s.room))).not.toBeNull()
      expect(route(HOME_FRONT, at, solidTiles(s.room))).not.toBeNull()
    }
  })
  it('배우자방 증축 전에는 청혼할 수 없다', () => {
    const s = rich()
    const def = CONTENT.neighbors.find(n => n.id === 'tilly')!
    const ready = { ...s, hearts: { tilly: 100 }, romance: { ...s.romance, stage: 'dating' as const, partner: 'tilly', since: -100 }, inv: { promiseCord: 1 } }
    expect(canGiveCord(ready, def)).toBe('room')
    expect(canGiveCord({ ...ready, homeLevel: 1 }, def)).not.toBe('room')
  })
})

describe('모든 방의 가구 재배치', () => {
  it('침대·필사 책상·화덕·선반·작업대를 다른 방으로 옮겨도 기능 위치가 같이 이동한다', () => {
    let s = build(build(build(rich())))
    for (const [index, [item, def]] of Object.entries(FIXTURES).entries()) {
      const f = s.room.find(f => f.item === item)!
      const at = { x: 8 + index, y: 110 }
      s = moveFurniture(s, f, at)!
      expect(s).not.toBeNull()
      expect(PLACES[def.place].tiles).toEqual([at])
      expect(findPath(HOME_ENTRY, PLACES[def.place].stand!, solidTiles(s.room))).not.toBeNull()
    }
    const loaded = deserialize(serialize(s), CONTENT)!
    expect(loaded.room).toEqual(s.room)
    expect(goToSleep(loaded, CONTENT).player).toMatchObject(PLACES.bed.stand!)
  })
  it('탁자와 위의 물건은 함께 움직이고 막힌 위치로의 이동은 배치를 보존한다', () => {
    let s = build(build(build(rich())))
    s = placeFurniture({ ...s, inv: { table: 1, vase: 1 } }, 'table', { x: 27, y: 113 })!
    s = placeFurniture(s, 'vase', { x: 28, y: 113 })!
    const table = s.room.find(f => f.item === 'table')!
    expect(moveFurniture(s, table, PARTNER_DOOR)).toBeNull()
    const moved = moveFurniture(s, table, { x: 8, y: 113 })!
    expect(moved.room.find(f => f.item === 'vase')).toMatchObject({ x: 9, y: 113, on: true })
    expect(moved.inv).toBe(s.inv)
  })
  it.each(designs)('$id의 고유 가구는 결혼 시 한 번만 지급하고 다른 방으로 옮길 수 있다', d => {
    let s = build(build(build(rich())))
    s = furnishSpouse({ ...s, romance: { ...s.romance, partner: d.id, stage: 'married' } })
    const all = spouseFurniture(d.id)
    expect(all.length).toBeGreaterThan(0)
    expect(s.room.filter(f => f.item.startsWith('spouse:')).length + Object.entries(s.inv).filter(([id]) => id.startsWith('spouse:')).reduce((n, [,v]) => n + (v ?? 0), 0)).toBe(all.length)
    const f = s.room.find(f => f.item.startsWith('spouse:'))!
    expect(f).toBeDefined()
    s = moveFurniture(s, f, { x: 8, y: 110 })!
    expect(s).not.toBeNull()
    const again = furnishSpouse(s)
    expect(again).toBe(s)
    const saved = deserialize(serialize(s), CONTENT)!
    expect(saved.room).toEqual(s.room)
    expect(saved.inv).toEqual(s.inv)
  })
  it('가구를 회수한 상태로 다시 불러와도 중복 생성하지 않는다', () => {
    const s = rich()
    const removed = removeFurniture(s, s.room.find(f => f.item === 'homeDesk')!)
    const loaded = deserialize(serialize(removed), CONTENT)!
    expect(loaded.room.some(f => f.item === 'homeDesk')).toBe(false)
    expect(loaded.inv.homeDesk).toBe(1)
    expect(PLACES.desk.tiles).toEqual([])
  })
})

describe('집 저장 호환', () => {
  it('지금 배치 전 저장은 옮기지 않고 붙박이를 새로 놓고, 옛 가구는 가방으로, 기록자는 집 안 문 앞에서', () => {
    const s = rich()
    const { homeLayout: _old, ...flags } = s.flags
    void _old
    const old = { ...s, flags, homeLevel: 1, room: [{ item: 'chair', x: 25, y: 64 }], player: { ...s.player, x: 25, y: 63 } }
    const loaded = deserialize(JSON.stringify(old), CONTENT)!
    expect(loaded.player).toMatchObject(HOME_ENTRY)
    expect(loaded.room.find(f => f.item === 'chair')).toBeUndefined()
    expect(loaded.inv.chair).toBe((s.inv.chair ?? 0) + 1)
    expect(loaded.room.filter(f => f.item.startsWith('home'))).toHaveLength(5)
    expect(deserialize(serialize(loaded), CONTENT)!.room).toEqual(loaded.room)
  })
  it('3단계와 3단계 주문을 저장하며 새 게임은 다시 작업실만 남긴다', () => {
    const two = build(build(rich()))
    const ordered = orderHome(two)!
    expect(deserialize(serialize(ordered), CONTENT)!.flags.homeOrder).toBe(3)
    const three = build(two)
    expect(deserialize(serialize(three), CONTENT)!.homeLevel).toBe(3)
    setHomeLevel(0)
    syncHome(three)
    expect(isWalkable({ x: 10, y: 112 })).toBe(true)
    settle(newGame(CONTENT), CONTENT)
    expect(isHome({ x: 10, y: 112 })).toBe(false)
  })
})
