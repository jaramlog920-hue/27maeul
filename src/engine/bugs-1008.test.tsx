// 2026-10-08 사용자가 찾은 버그 여섯 — 다시 생기지 않게
import { CONTENT } from '../content/catalog'
import { newGame, syncHome, tapTile, type GameState } from './game'
import { canPlace, doorOf, standSpotOf, type Build } from './newland-build'
import { canInviteGuest, facilityAt, guestHouseMorning, guestNow, inviteGuest, settledGuests, settledSpot } from './newland-life'
import { deserialize, serialize } from './save'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'
import { OT_BOOKS } from './ot-books'
import { ROOM_SLOTS } from './newland-config'
import { roomKeyFor } from './newland-build'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

const done = (id: string, kind: Build['kind'], x: number, y: number, facing: Build['facing'] = 'down', slot?: number): Build => ({
  id, kind, x, y, facing, state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, ...(slot !== undefined ? { slot } : {}),
})
function land(builds: Build[], flags: Record<string, number> = {}): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 40, minute: 11 * 60 },
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1, ...flags },
    map: 'newland',
    newland: { builds, tiles: {}, nextId: builds.length + 1, settledDay: 40 },
  }
  syncHome(g)
  return g
}

describe('2026-10-08 버그', () => {
  it('구약 길잡이에 쓴 한 줄이 저장·불러오기 뒤에도 남는다', () => {
    const g = newGame(CONTENT)
    const key = `guide:${OT_BOOKS[0]}:1`
    g.myLines[key] = '처음 읽은 날의 한 줄'
    const back = deserialize(serialize(g), CONTENT)!
    expect(back.myLines[key]).toBe('처음 읽은 날의 한 줄')
  })

  it('왼쪽·오른쪽 문 집의 주민 자리는 문 칸이 아니다 (누르면 집이 아니라 주민)', () => {
    for (const facing of ['down', 'left', 'right'] as const) {
      const b = done('b1', 'home', 16, 12, facing, 0)
      const d = doorOf('home', b.x, b.y, facing)!
      const st = standSpotOf(b)!
      expect(st).not.toEqual(d.door)
      expect(st).not.toEqual(d.front)
    }
  })

  it('집을 걷고 새로 지으면 손님이 저절로 차지하지 않고, 다시 손님으로 온다', () => {
    const inn = done('b1', 'guest', 10, 12)
    const first = inviteGuest(land([inn, done('b2', 'home', 16, 12, 'down', 0)], { guestNow: 1, guestSince: 40, 'guestGift:nelly': 20 }))
    expect(settledGuests(first).map((x) => x.id)).toEqual(['nelly'])
    // 집을 걷고 같은 방 칸에 새 집
    const rebuilt: GameState = { ...first, newland: { ...first.newland!, builds: [inn, done('b3', 'home', 16, 12, 'down', 0)], nextId: 4 } }
    expect(settledGuests(rebuilt)).toEqual([])
    const morning = guestHouseMorning({ ...rebuilt, clock: { day: 60, minute: 360 }, flags: { ...rebuilt.flags, guestNow: 0, guestNext: 0 } })
    expect(guestNow(morning)).not.toBeNull()
  })

  it('주민이 서 있는 칸에는 나무를 심을 수 없다', () => {
    const house = done('b1', 'home', 16, 12, 'down', 0)
    const s = inviteGuest(land([done('b0', 'guest', 4, 12), house], { guestNow: 1, guestSince: 40, 'guestGift:nelly': 20 }))
    const st = settledSpot(house)!
    expect(facilityAt(s, st)).toBe('settled')
    const away = { ...s, player: { ...s.player, x: 4, y: 20, path: [] } }
    expect(canPlace(away, 'treeSmall', st.x, st.y)).not.toBeNull()
    expect(canPlace(away, 'flower', st.x, st.y)).toBeNull()
  })

  it('첫 방문에서 선물을 받은 그 머묾에는 집을 내어 줄 수 없고, 다시 왔을 때 된다', () => {
    const house = done('b2', 'home', 16, 12, 'down', 0)
    const firstStay = land([done('b1', 'guest', 10, 12), house], { guestNow: 1, guestSince: 38, 'guestGift:nelly': 40 })
    expect(canInviteGuest(firstStay)).toBeNull()
    const later = land([done('b1', 'guest', 10, 12), house], { guestNow: 1, guestSince: 50, 'guestGift:nelly': 40 })
    expect(canInviteGuest(later)).toBe('nelly')
  })

  it('새 터 집 안: 눌러서 걸어도 탁자를 지나가지 않는다', () => {
    const slot = ROOM_SLOTS[0]
    const house = done('b1', 'home', 16, 12, 'down', 0)
    const from = { ...slot.entry }
    const table = { x: from.x, y: from.y - 1 }
    const base = land([house])
    const s: GameState = { ...base, player: { ...base.player, x: from.x, y: from.y, path: [] }, rooms: { [roomKeyFor('b1')]: [{ item: 'table', x: table.x, y: table.y, facing: 'down' }] } }
    syncHome(s)
    const g = tapTile(s, { x: from.x, y: from.y - 2 })
    expect(g.player.path.some((t) => (t.x === table.x || t.x === table.x + 1) && t.y === table.y)).toBe(false)
  })
})