import { owns } from './easier'
import { ADDITION_FURNITURE, isAddition } from './furniture-additions'
import type { GameState } from './game'

/** All systems use the same access rule; a storage cabinet also opens the shared chest. */
export function storageChest(s: Pick<GameState, 'flags' | 'chest'> & Partial<Pick<GameState, 'room'>>) {
  return owns(s.flags, 'supplyChest') || s.room?.some(f => isAddition(f.item) && ADDITION_FURNITURE[f.item].use === 'open')
    ? s.chest ?? {} : null
}
