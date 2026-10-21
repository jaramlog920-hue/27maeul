import { featureAccess } from './feature-rules'
import type { GrowthState } from './progression'

/**
 * 주민끼리 만남·소모임으로 오르는 호감의 배수: 자율 생활(75장)이 열리기 전엔 다섯에 하나, 열린 뒤엔 두 배
 * (2026-10-22 중후반 점검: 한 배로는 자율 생활이 열리고도 70일 넘게 주민 연인이 생기지 않았다)
 */
export function npcAffinityScale(s: Partial<GrowthState>): number {
  return featureAccess(s, 'autonomy') === 'full' ? 2 : 0.2
}
