import { expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { moveFurniture, newGame, placeFurniture, rotateFurniture, syncHome } from './game'
import { placement } from './room'
import { deserialize, serialize } from './save'
import { HOME_ENTRY } from './world'

function setup() {
  const base = newGame(CONTENT)
  // 배치 규칙 검사는 집 꾸미기가 정식으로 열린 상태에서 한다.
  base.progress.phm.completed = [1]
  const s = { ...base, room: [], flags: { ...base.flags }, inv: {}, player: { ...base.player, ...HOME_ENTRY } }
  syncHome(s)
  const table = placement([], 'table', { x: 19, y: 113 })!
  expect(table).not.toBeNull()
  const vase = placement([table], 'vase', table)!
  return { s, table, vase }
}

it('cannot place solid furniture on the player, but can put a rug underfoot',()=>{
  const {s}=setup()
  const state={...s,inv:{table:1,rug:1},player:{...s.player,x:19,y:113}}
  expect(placeFurniture(state,'table',{x:19,y:113})).toBeNull()
  expect(state.inv.table).toBe(1)
  expect(placeFurniture(state,'rug',{x:19,y:113})).not.toBeNull()
})

it('cannot move or rotate a table into the player',()=>{
  const {s,table}=setup()
  const moving={...s,room:[table],player:{...s.player,x:19,y:112}}
  expect(moveFurniture(moving,table,{x:19,y:112})).toBeNull()
  const turning={...s,room:[table],player:{...s.player,x:19,y:114}}
  expect(rotateFurniture(turning,table)).toBeNull()
  expect(turning.room).toEqual([table])
})

it('moving a tabletop vase to empty floor clears its tabletop flag and survives reload', () => {
  const { s, table, vase } = setup()
  const moved = moveFurniture({ ...s, room: [table, vase] }, vase, { x: 22, y: 114 })!
  expect(moved).not.toBeNull()
  const back = deserialize(serialize(moved), CONTENT)!
  expect({ on: !!moved.room.find(f => f.item === 'vase')?.on, afterReload: back.room.some(f => f.item === 'vase') })
    .toEqual({ on: false, afterReload: true })
})

it('moving a rug underneath a table leaves tabletop objects on that table', () => {
  const { s, table, vase } = setup()
  const rug = placement([table, vase], 'rug', { x: 19, y: 113 })!
  expect(rug).not.toBeNull()
  const moved = moveFurniture({ ...s, room: [rug, table, vase] }, rug, { x: 18, y: 112 })!
  expect(moved).not.toBeNull()
  expect(moved.room.find(f => f.item === 'vase')).toEqual(vase)
})

it('moving a table still carries its vase and preserves its finish through reload', () => {
  const { s, table, vase } = setup()
  const finished = { ...vase, finish: 'test-finish' }
  const moved = moveFurniture({ ...s, room: [table, finished] }, table, { x: 19, y: 112 })!
  expect(moved).not.toBeNull()
  expect(moved.room.find(f => f.item === 'vase')).toEqual({ ...finished, x: 19, y: 112 })
  expect(deserialize(serialize(moved), CONTENT)!.room).toEqual(moved.room)
})

it('moving a floor vase onto a table sets the tabletop flag', () => {
  const { s, table } = setup()
  const vase = placement([table], 'vase', { x: 22, y: 114 })!
  const moved = moveFurniture({ ...s, room: [table, vase] }, vase, table)!
  expect(moved.room.find(f => f.item === 'vase')).toMatchObject({ x: table.x, y: table.y, on: true })
  expect(deserialize(serialize(moved), CONTENT)!.room).toEqual(moved.room)
})

it('a blocked move keeps the original room and inventory unchanged', () => {
  const { s, table, vase } = setup()
  const original = { ...s, room: [table, vase] }
  const before = serialize(original)
  expect(moveFurniture(original, table, { x: 0, y: 0 })).toBeNull()
  expect(serialize(original)).toBe(before)
})
