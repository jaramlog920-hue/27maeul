import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, settle, syncHome } from './game'
import { findPath } from './movement'
import { route } from './neighbors'
import { solidTiles } from './room'
import { HOME_FRONT, HOME_ENTRY, isHome, tileAt } from './world'
import { SPOUSE_ROOM, SPOUSE_ROOM_DOOR, SPOUSE_ROOM_STAND } from './spouse-room'
import designs from '../content/spouse-rooms.json'

describe('증축한 뒤쪽 배우자방', () => {
  it('결혼 전에도 증축하면 빈 방으로 걸어 들어간다', () => {
    const s = newGame(CONTENT)
    syncHome(s)
    expect(tileAt(SPOUSE_ROOM_DOOR.x, SPOUSE_ROOM_DOOR.y)).toBe('#')
    syncHome({ ...s, homeLevel: 1 })
    expect(tileAt(SPOUSE_ROOM_DOOR.x, SPOUSE_ROOM_DOOR.y)).toBe('D')
    expect(findPath(HOME_ENTRY, SPOUSE_ROOM_STAND, solidTiles(s.room))).not.toBeNull()
    expect(isHome(SPOUSE_ROOM_STAND)).toBe(true)
  })
  it.each(designs)('$id의 방으로 집 안과 마을에서 왕복한다', d => {
    const base = newGame(CONTENT)
    const s = settle({ ...base, homeLevel: 1, romance: { ...base.romance, partner: d.id, stage: 'married' } }, CONTENT)
    const blockers = solidTiles(s.room)
    expect(s.room.filter(f => f.item.startsWith('spouse:'))).toHaveLength(d.placements.length)
    expect(Object.keys(s.inv).filter(id => id.startsWith('spouse:'))).toEqual([])
    expect(tileAt(SPOUSE_ROOM.x0 + d.window.x, SPOUSE_ROOM.y0)).toBe('N')
    expect(findPath(HOME_ENTRY, SPOUSE_ROOM_STAND, blockers)).not.toBeNull()
    expect(route(HOME_FRONT, SPOUSE_ROOM_STAND, blockers)).not.toBeNull()
    expect(route(SPOUSE_ROOM_STAND, HOME_FRONT, blockers)).not.toBeNull()
  })
})
