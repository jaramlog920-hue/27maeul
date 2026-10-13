import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { isWalkable } from '../engine/world'
import { kidWalk } from './renderer'

it('자식은 부모 곁이 아니라 마을 곳곳을 걸어 다닌다 (2026-10-13)', () => {
  newGame(CONTENT)
  const baker = CONTENT.neighbors.find((d) => d.id === 'baker')!
  const spots = new Set<string>()
  let far = 0, moving = 0
  for (let m = 8 * 60; m < 18 * 60; m += 3) {
    const w = kidWalk('baker-baby', baker, CONTENT.neighbors, 7, 30, m)
    expect(isWalkable({ x: Math.round(w.x), y: Math.round(w.y) })).toBe(true)
    if (!w.moving) spots.add(`${w.x},${w.y}`)
    else moving++
    if (Math.abs(w.x - baker.door.x) + Math.abs(w.y - baker.door.y) > 6) far++
  }
  expect(spots.size).toBeGreaterThan(5)
  expect(moving).toBeGreaterThan(10)
  expect(far).toBeGreaterThan(20)
})
