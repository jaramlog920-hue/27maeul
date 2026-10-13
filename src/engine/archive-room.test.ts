import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { establishedGame } from './growth-test-support'
import { INTERIOR, INTERIOR_DESK, INTERIOR_ENTRY } from './newland-config'
import { ARCHIVE_ROOM_KEY, inBuildingRoom, roomOf, roomTarget, sanitizeRooms } from './newland-rooms'
import { placeFurniture, type GameState } from './game'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'

describe('구약 서고 안 가구 배치 (2026-10-14)', () => {
  it('서고 안에 서 있으면 가구 배치를 할 수 있고, 놓은 가구는 서고 몫으로 남는다', () => {
    setNewlandOpen(true)
    setActiveMap('newland')
    const base = establishedGame(CONTENT, 300)
    const s: GameState = { ...base, map: 'newland', player: { ...base.player, ...INTERIOR_ENTRY, path: [] }, inv: { ...base.inv, stool: 1 } }
    expect(inBuildingRoom(s)).toBe(true)
    expect(roomTarget(s)?.key).toBe(ARCHIVE_ROOM_KEY)
    // 책상 앞(비워 두는 칸)에는 못 놓고, 빈 바닥에는 놓는다
    expect(placeFurniture(s, 'stool', INTERIOR_DESK.stand)).toBeNull()
    const placed = placeFurniture(s, 'stool', { x: INTERIOR.x0 + 6, y: INTERIOR.y0 + 4 })
    expect(placed).not.toBeNull()
    expect(roomOf(placed!).map((f) => f.item)).toEqual(['stool'])
    expect(placed!.rooms?.[ARCHIVE_ROOM_KEY]).toHaveLength(1)
    // 불러오기 정리에서도 서고 몫은 그대로
    expect(sanitizeRooms(placed!.rooms, placed!, {}).rooms?.[ARCHIVE_ROOM_KEY]).toHaveLength(1)
    setActiveMap('village')
  })
})

describe('끼었을 때 (2026-10-14)', () => {
  it('서 있는 칸이 막히면 가장 가까운 걸을 수 있는 칸으로 비켜 선다', async () => {
    const { unstick } = await import('./game')
    const { HOME_FRONT } = await import('./world')
    setActiveMap('village')
    const base = establishedGame(CONTENT, 300)
    const wall = { ...base, player: { ...base.player, x: 0, y: 0, path: [] } }
    const moved = unstick(wall)
    expect(moved.player.x !== 0 || moved.player.y !== 0).toBe(true)
    const fine = { ...base, player: { ...base.player, ...HOME_FRONT, path: [] } }
    expect(unstick(fine)).toBe(fine)
  })
})
