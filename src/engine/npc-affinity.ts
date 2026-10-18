import { featureAccess } from './feature-rules'
import type { GrowthState } from './progression'

/** Before NPC autonomous relationships unlock, positive mutual gains accrue at one fifth. */
export function npcAffinityScale(s: Partial<GrowthState>): number {
  return featureAccess(s, 'autonomy') === 'full' ? 1 : 0.2
}
