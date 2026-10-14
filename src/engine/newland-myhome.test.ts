// 새 터의 내 집 (2026-10-14 사용자): 입주 주택 하나를 내 집으로, 평상에서 자고 그 자리에서 깬다
import { afterEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { goToSleep, syncHome, tapTile, type GameState } from './game'
import { emptyHomes } from './gen-homes'
import { legacyGame } from './growth-test-support'
import { setActiveMap } from './maps'
import { roomKeyFor, type Build } from './newland-build'
import { ROOM_SLOTS } from './newland-config'
import { canClaimHome, claimHome, inMyNewHome, newBedAt } from './newland-myhome'

afterEach(() => setActiveMap('village'))

const house: Build = { id: 'b1', kind: 'home', x: 16, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 } as Build
const slot = ROOM_SLOTS[0]
const bed = { x: slot.x0 + 2, y: slot.y0 + 2 }

function inside(): GameState {
  const g = legacyGame(CONTENT)
  return {
    ...g, scenes: [], map: 'newland', clock: { day: 120, minute: 22 * 60 },
    flags: { ...g.flags, newlandGift: 1, newlandRevealed: 1 },
    newland: { ...g.newland, tiles: {}, nextId: 2, builds: [house] } as GameState['newland'],
    rooms: { [roomKeyFor('b1')]: [{ item: 'daybed', x: bed.x, y: bed.y, facing: 'down' }] } as GameState['rooms'],
    player: { ...g.player, x: bed.x, y: bed.y + 1, path: [] },
  }
}

describe('새 터의 내 집', () => {
  it('다 지은 빈 입주 주택을 내 집으로 정하면 빈 집 목록에서 빠지고, 그만 쓰면 돌아온다', () => {
    const s = inside()
    expect(canClaimHome(s, house)).toBeNull()
    const mine = claimHome(s, house)
    expect(canClaimHome(mine, house)).toBe('mine')
    expect(emptyHomes(mine).map((b) => b.id)).not.toContain('b1')
    expect(emptyHomes(claimHome(mine, null)).map((b) => b.id)).toContain('b1')
    // 가족이 사는 집은 정할 수 없다
    expect(canClaimHome({ ...s, flags: { ...s.flags, 'familyHome:1': 1 } }, house)).toBe('taken')
  })
  it('내 집 평상을 누르면 잠자리로 가고, 자면 새 터 그 자리에서 다음 날 깬다', () => {
    const s = claimHome(inside(), house)
    syncHome(s)
    expect(inMyNewHome(s)).toBe(true)
    expect(newBedAt(s, bed)).toBeTruthy()
    // 내 집이 아니면 평상은 잠자리가 아니다
    expect(newBedAt(inside(), bed)).toBeUndefined()
    const tapped = tapTile(s, bed)
    expect(tapped.target).toMatchObject({ kind: 'furniture', item: 'daybed' })
    const woke = goToSleep(s, CONTENT)
    expect(woke.clock.day).toBe(121)
    expect(woke.map).toBe('newland')
    expect({ x: woke.player.x, y: woke.player.y }).toEqual({ x: bed.x, y: bed.y + 1 })
  })
  it('내 집이 아닌 새 터에서 잠들면 예전처럼 첫 마을에서 깬다', () => {
    const s = inside()
    syncHome(s)
    expect(goToSleep(s, CONTENT).map ?? 'village').toBe('village')
  })
})
