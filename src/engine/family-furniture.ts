import { petSpotSafe } from './companion'
import { findPath } from './movement'
import { keepClear, solidTiles, type Furniture } from './room'
import { HOME_ENTRY, key, sameTile } from './world'

export const PET_FURNITURE = ['wovenPetBed', 'coolingPetMat', 'petBowlStation', 'petTugMat', 'petPuzzleTray'] as const
export const CHILD_FURNITURE = ['toddlerRockingHorse', 'childBlockMat', 'childDrawingTable', 'childBookSeat', 'toddlerDrumMat'] as const
export type PetFurnitureId = typeof PET_FURNITURE[number]
export type ChildFurnitureId = typeof CHILD_FURNITURE[number]
export const petFurnitureAction = (id: string): 'sleep' | 'drink' | 'tug' | 'puzzle' | null =>
  id === 'wovenPetBed' || id === 'coolingPetMat' ? 'sleep' : id === 'petBowlStation' ? 'drink' : id === 'petTugMat' ? 'tug' : id === 'petPuzzleTray' ? 'puzzle' : null

// No saved ownership/use state: removing or moving a piece immediately changes the routine.
function usable(room: readonly Furniture[], ids: readonly string[], occupied: ReadonlySet<string>): Furniture[] {
  const blocked = new Set([...solidTiles(room), ...occupied])
  return room.filter(f => ids.includes(f.item) && !f.on && !blocked.has(key(f)) &&
    !keepClear().some(t => sameTile(t, f)) && petSpotSafe(f, blocked) && !!findPath(HOME_ENTRY, f, blocked))
}

export function petFurniturePlace(room: readonly Furniture[], minute: number, pose: string, occupied: ReadonlySet<string> = new Set()): Furniture | null {
  const ids = pose === 'nap' ? PET_FURNITURE.slice(0, 2) : minute % 60 < 8 ? ['petBowlStation'] : pose === 'play' || pose === 'fetch' ? PET_FURNITURE.slice(3) : []
  const choices = usable(room, ids, occupied)
  return choices[Math.floor(minute / 60) % Math.max(1, choices.length)] ?? null
}

