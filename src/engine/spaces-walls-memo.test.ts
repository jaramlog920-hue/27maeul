// 자리 판정 캐시는 벽이 바뀌면 다시 따진다 (2026-10-18 감사 L-52 — 벽을 세운 직후에도 막힌 자리가 살아 있는 자리로 남았다)
import { legacyGame as newGame } from './growth-test-support'
import { CONTENT, PEOPLE } from '../content/catalog'
import { buildWall, canBuildWall, settle, syncHome, type GameState } from './game'
import { setPeopleData } from './people'
import { placement, solidTiles, type Furniture } from './room'
import { setSpace } from './space-life'
import { liveSpaces, seatSlots } from './spaces'
import { HOME_ENTRY } from './world'

beforeEach(() => setPeopleData(PEOPLE))

it('의자 곁 서는 칸을 벽으로 막으면 그 자리는 바로 살아 있는 자리에서 빠진다', () => {
  const s0 = settle(newGame(CONTENT), CONTENT)
  const s: GameState = { ...s0, homeLevel: 1, coins: 500, flags: { ...s0.flags, growthLegacy: 1 }, player: { ...s0.player, ...HOME_ENTRY }, scenes: [] }
  syncHome(s)
  let g: GameState | null = null
  outer: for (let y = 108; y <= 117; y++)
    for (let x = 6; x <= 30; x++) {
      const f = placement(s.room, 'stool', { x, y }, 'down')
      if (!f) continue
      const t = { ...s, room: [...s.room, f] as Furniture[] }
      syncHome(t)
      const n = setSpace(t, f, 'family')
      if (!n) continue
      syncHome(n)
      if (seatSlots(f, solidTiles(n.room)).length !== 1) continue
      g = n
      break outer
    }
  expect(g).not.toBeNull()
  let w = g!
  const stool = w.room[w.room.length - 1]
  expect(liveSpaces(w)).toHaveLength(1)
  for (const t of [{ x: stool.x, y: stool.y + 1 }, { x: stool.x - 1, y: stool.y }, { x: stool.x + 1, y: stool.y }, { x: stool.x, y: stool.y - 1 }])
    if (canBuildWall(w, t) === null) w = buildWall(w, t)!
  syncHome(w)
  // 같은 room 참조로 다시 물어도 새로 따진 결과와 같다
  expect(liveSpaces(w).length).toBe(liveSpaces({ ...w, room: [...w.room] }).length)
})
