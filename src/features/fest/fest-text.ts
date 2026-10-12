import { featureHint } from '../../engine/feature-rules'
import { T } from '../../content/text'
import type { FestKind } from '../../engine/fest'

const FEST = T.fest.errors as Record<string, string>
const CLUB = T.clubs.errors as Record<string, string>

/** 이웃이 그때 바쁜 까닭 (plans.availability의 busy — 소모임과 같은 말) */
export const festBusyText = (e: string) => CLUB[e] ?? FEST[e] ?? T.fest.errors.time

/**
 * 행사 만들기·미루기 오류. 'festival'은 잔치 준비 역할에서는 "잔치 날이 아님", 다른 행사에서는 이웃이 잔치와 겹침
 * (2026-10-11 점검 4 — 앞의 것이 뒤의 경우에도 나왔다)
 */
export function festErrorText(e: string, kind?: FestKind): string {
  if (e === 'locked') return featureHint('events')
  if (e === 'festival' && kind !== 'festival') return festBusyText(e)
  return FEST[e] ?? CLUB[e] ?? T.fest.errors.time
}
