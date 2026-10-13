// 기능 있는 가구를 누르면 그 기능으로 (2026-10-13 사용자: 서늘한 찬장·수납 가구를 눌러도 아무것도 안 떴다)
import { CONTENT } from '../content/catalog'
import { chestOf, functionalAt, isStorage, tapTile, tick } from './game'
import { legacyGame } from './growth-test-support'
import { HOME_ENTRY } from './world'
import type { GameState } from './game'

const home = (): GameState => {
  const s = legacyGame(CONTENT)
  return { ...s, scenes: [], homeLevel: 0, player: { ...s.player, ...HOME_ENTRY, path: [] },
    room: [...s.room, { item: 'supplyChest', x: 22, y: 111 }, { item: 'homeCoolCupboard', x: 22, y: 113 }, { item: 'wardrobe', x: 19, y: 111 }, { item: 'inkJar', x: 21, y: 113 }],
    flags: { ...s.flags, 'unlock:supplyChest': 1, 'unlock:homeCoolCupboard': 1, 'unlock:inkJar': 1 } }
}
const arrive = (s: GameState) => {
  let g = s
  for (let i = 0; i < 400; i++) {
    const r = tick(g, 0.05, () => 0.5, CONTENT)
    g = r.state
    const e = r.events.find((x) => x.type === 'arrived')
    if (e) return e
  }
  return null
}

it('수납 가구·저절로 만드는 가구는 누르면 곁으로 걸어가 도착 신호를 낸다', () => {
  const s = home()
  for (const [item, x, y] of [['supplyChest', 22, 111], ['homeCoolCupboard', 22, 113], ['wardrobe', 19, 111], ['inkJar', 21, 113]] as const) {
    expect(functionalAt(s, { x, y })?.item, item).toBe(item)
    const tapped = tapTile(s, { x, y })
    expect(tapped.target, item).toMatchObject({ kind: 'furniture', item })
    const e = arrive(tapped)
    expect(e, item).toMatchObject({ type: 'arrived', target: { kind: 'furniture', item } })
  }
  expect(isStorage('wardrobe')).toBe(true)
  expect(isStorage('inkJar')).toBe(false)
})

it('여닫는 생활 가구만 있어도 물건을 넣어 두는 칸이 생긴다', () => {
  const s = legacyGame(CONTENT)
  expect(chestOf(s)).toBeNull()
  expect(chestOf({ ...s, room: [...s.room, { item: 'wardrobe', x: 19, y: 111 }] })).toEqual({})
})
