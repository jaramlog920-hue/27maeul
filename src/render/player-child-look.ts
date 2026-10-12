import type { ChildStage } from '../engine/child'

/** Select existing art and height for the player's child. */
export function playerChildSprite(stage: ChildStage, dressed: boolean) {
  return {
    who: stage === 'toddler' || stage === 'adult' || dressed ? 'writer' as const : 'child' as const,
    short: stage === 'toddler' ? 0 : stage === 'adult' ? undefined : 1,
  }
}
