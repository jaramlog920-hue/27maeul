import type { CopyFurnitureId } from './copy-furniture'
import type { Facing } from './types'

/** Only the long sleeping mat and divider need a second installation axis.
 * Round basins, floor games, wall displays and open workstations keep their authored front. */
export const copyFurnitureFacings = (id: CopyFurnitureId): readonly Facing[] =>
  id === 'copyBabyNap' || id === 'copyChangingScreen' ? ['down', 'right'] : ['down']

export function copyFurnitureFacing(id: CopyFurnitureId, facing: Facing = 'down'): Facing {
  return copyFurnitureFacings(id).length === 1 ? 'down' : facing === 'left' || facing === 'right' ? 'right' : 'down'
}

export const copyFurnitureChildStage = (id: CopyFurnitureId): 'baby' | 'toddler' | 'helper' =>
  id === 'copyBabyWash' || id === 'copyBabyNap' ? 'baby' : id.startsWith('copyBaby') ? 'toddler' : 'helper'
