// 동물 친구도 새 터에 따라간다 (2026-10-14 사용자)
import { afterEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { adopt } from './companion'
import { newGame, setCompanionStay, syncHome, tick, travel, type GameState } from './game'
import { setActiveMap } from './maps'
import { mulberry32 } from './offers'

afterEach(() => setActiveMap('village'))

function ready(stay: boolean): GameState {
  const g = newGame(CONTENT)
  const at = { x: g.player.x, y: g.player.y + 1 }
  return { ...g, scenes: [], clock: { day: 9, minute: 10 * 60 }, flags: { ...g.flags, newlandGift: 1, newlandRevealed: 1 }, companion: { ...adopt('dog', '바둑', 1, at), stay } }
}

describe('새 터의 동물 친구', () => {
  it('따라다니는 개는 새 터로 함께 건너가 곁에 서고, 걸으면 따라오고, 돌아오면 첫 마을로 함께 온다', () => {
    const s = ready(false)
    syncHome(s)
    const there = travel(s, 'newland', CONTENT)
    expect(there.map).toBe('newland')
    expect(there.companion?.map).toBe('newland')
    const d = Math.abs(there.companion!.x - there.player.x) + Math.abs(there.companion!.y - there.player.y)
    expect(d).toBeLessThanOrEqual(1)
    // 기록자가 멀리 가 있으면 따라 걷는다
    const far = { ...there, player: { ...there.player, x: there.player.x + 3 } }
    const stepped = tick(far, 1, mulberry32(1), CONTENT).state
    expect(stepped.companion!.map).toBe('newland')
    const back = travel(stepped, 'village', CONTENT)
    expect(back.map ?? 'village').toBe('village')
    expect(back.companion?.map).toBeUndefined()
    expect(Math.abs(back.companion!.x - back.player.x) + Math.abs(back.companion!.y - back.player.y)).toBeLessThanOrEqual(1)
  })
  it('집에 둔 동물은 건너가지 않는다', () => {
    const s = ready(true)
    syncHome(s)
    const there = travel(s, 'newland', CONTENT)
    expect(there.companion?.map).toBeUndefined()
    expect(there.companion).toMatchObject({ x: s.companion!.x, y: s.companion!.y, stay: true })
    // 새 터에서 데리고 다니기를 고르면 새 터 곁으로
    const call = setCompanionStay(there, false)
    expect(call.companion?.map).toBe('newland')
  })
})
