import { CONTENT } from '../content/catalog'
import { legacyGame } from './growth-test-support'
import { petFurniturePlace, CHILD_FURNITURE, PET_FURNITURE } from './family-furniture'
import { placeFurniture, syncHome, tick } from './game'
import { adopt } from './companion'
import { HOME_ENTRY, key } from './world'
import { deserialize, serialize } from './save'
import type { Furniture } from './room'

function base() {
  const s = legacyGame(CONTENT)
  const result = { ...s, scenes: [], clock: { day: 30, minute: 13 * 60 + 5 }, player: { ...s.player, ...HOME_ENTRY, path: [] } }
  syncHome(result)
  return result
}
const at = { x: 22, y: 113 }

it('all ten family pieces can be placed and survive save/load without adding a pet or child', () => {
  for (const item of [...PET_FURNITURE, ...CHILD_FURNITURE]) {
    const s = base(), placed = placeFurniture({ ...s, inv: { ...s.inv, [item]: 1 } }, item, at)
    expect(placed, item).not.toBeNull()
    const loaded = deserialize(serialize(placed!), CONTENT)!
    expect(loaded.room.some(f => f.item === item && f.x === at.x && f.y === at.y), item).toBe(true)
    expect(loaded.companion).toBeFalsy()
    expect(loaded.child).toBeFalsy()
  }
})

it('uses installed pet beds, water and play pieces only during their routines, and rejects blocked/removed pieces', () => {
  const s = base()
  for (const item of PET_FURNITURE) {
    const room: Furniture[] = [...s.room, { item, ...at }]
    const pose = item === 'wovenPetBed' || item === 'coolingPetMat' ? 'nap' : item === 'petBowlStation' ? 'wait' : 'play'
    const minute = item === 'petBowlStation' ? 12 * 60 + 2 : 12 * 60 + 20
    expect(petFurniturePlace(room, minute, pose)?.item, item).toBe(item)
    expect(petFurniturePlace(room, minute, pose, new Set([key(at)])), item).toBeNull()
    expect(petFurniturePlace(s.room, minute, pose), item).toBeNull()
  }
})

it('an actual staying dog walks to its installed bed when napping', () => {
  let s = base()
  s = { ...s, companion: { ...adopt('dog', '보리', 1, { x: 21, y: 113 }), stay: true }, room: [...s.room, { item: 'wovenPetBed', ...at }] }
  for (let i = 0; i < 70; i++) s = tick(s, 0.1, () => 0.5, CONTENT).state as typeof s
  expect(s.companion!.x).toBe(at.x)
  expect(s.companion!.y).toBe(at.y)
})
