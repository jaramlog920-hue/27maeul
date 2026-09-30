// 살림과 서고 (계획 13): 기록 설비 단계와 정성 들인 장.
// 돈 자체가 목표가 아니라 "생활해서 마련함 → 기록자의 일을 계속함 → 서고가 자란다".
// 설비는 필사를 빠르게 하지 않는다(계획 11 원칙) — 좋아지는 것은 정성(책등 금테·봉인)과 덜 번거로움(잉크·기름).
import { count, type Inventory } from './items'
import type { ItemId } from './types'

type Items = Partial<Record<ItemId, number>>

export type FixtureLine = 'desk' | 'lamp' | 'shelf' | 'inkStand'
export const FIXTURE_LINES: readonly FixtureLine[] = ['desk', 'lamp', 'shelf', 'inkStand']

/** 설비 한 단계: 누구에게 부탁하는지, 닢, 재료 (부탁한 다음 날 아침 설치) */
export interface FixtureStep {
  line: FixtureLine
  tier: 1 | 2
  coins: number
  needs: Items
  maker: 'carpenter' | 'smith'
}

/**
 * 기록대: 낡은 책상 → 넓은 기록대 → 장인의 기록대
 * 등잔: 작은 등잔 → 두 심지 등잔 → 밝은 청동 등잔
 * 서가: 낡은 나무 선반 → 벽면 서가 → 완성된 서고 (서고 모습이 바뀐다, 완성된 서고엔 희귀품 진열)
 * 잉크 제조대: 없음 → 있음 (한 번에 세 병)
 */
export const FIXTURE_STEPS: readonly FixtureStep[] = [
  { line: 'desk', tier: 1, coins: 80, needs: {}, maker: 'carpenter' },
  { line: 'desk', tier: 2, coins: 300, needs: { bronzeOrnament: 1 }, maker: 'carpenter' },
  { line: 'lamp', tier: 1, coins: 60, needs: {}, maker: 'smith' },
  { line: 'lamp', tier: 2, coins: 250, needs: { bronzeOrnament: 1 }, maker: 'smith' },
  { line: 'shelf', tier: 1, coins: 200, needs: {}, maker: 'carpenter' },
  { line: 'shelf', tier: 2, coins: 500, needs: { purpleCloth: 1, bronzeOrnament: 1 }, maker: 'carpenter' },
  { line: 'inkStand', tier: 1, coins: 120, needs: {}, maker: 'carpenter' },
]

/** 지금 단계 (예전에 장날에서 산 넓은 책상·밝은 등잔은 1단계로 친다) */
export function fixtureTier(s: { flags: Record<string, number>; inv: Inventory }, line: FixtureLine): number {
  const bought = s.flags[`fix:${line}`] ?? 0
  const old = (line === 'desk' && count(s.inv, 'wideDesk') > 0) || (line === 'lamp' && count(s.inv, 'brightLamp') > 0) ? 1 : 0
  return Math.max(bought, old)
}

/** 다음 단계 (없으면 null) */
export function nextFixture(s: { flags: Record<string, number>; inv: Inventory }, line: FixtureLine): FixtureStep | null {
  const t = fixtureTier(s, line)
  return FIXTURE_STEPS.find((x) => x.line === line && x.tier === t + 1) ?? null
}

/** 잉크 한 번 만들 때 병 수: 기본 1, 좋은 펜 +1, 잉크 제조대 +2 */
export function inkYield(s: { flags: Record<string, number>; inv: Inventory }): number {
  return 1 + (count(s.inv, 'goodPen') > 0 ? 1 : 0) + (fixtureTier(s, 'inkStand') >= 1 ? 2 : 0)
}

/** 등잔 기름 한 병으로 켜는 밤 수: 작은 등잔 1, 두 심지 2, 청동 3 */
export function lampNightsPerOil(s: { flags: Record<string, number>; inv: Inventory }): number {
  return 1 + fixtureTier(s, 'lamp')
}

// ── 정성 들인 장 ──

/** 희귀품 (장날 희귀 좌판·이웃 이벤트·여행에서만) */
export const RARE_ITEMS: readonly ItemId[] = ['finePapyrus', 'sealWax', 'purpleCloth', 'perfumeOil', 'bronzeOrnament']

export interface CareInput {
  /** 좋은 파피루스로 썼는가 */
  fine: boolean
  /** 오늘 무언가를 먹었고 배고프지 않은가 (집중) */
  focused: boolean
  /** 낮이거나, 밤이면 두 심지 이상 등잔 */
  goodLight: boolean
  deskTier: number
}

/** 정성 점수: 좋은 파피루스·집중·좋은 빛·장인의 기록대 한 점씩. 둘 이상이면 정성 들인 장 */
export function careScore(c: CareInput): number {
  return (c.fine ? 1 : 0) + (c.focused ? 1 : 0) + (c.goodLight ? 1 : 0) + (c.deskTier >= 2 ? 1 : 0)
}
export const CAREFUL_AT = 2

/** 한 권의 반 이상이 정성 들인 장이면 책등에 금테 */
export function goldTrim(careful: readonly number[] | undefined, chapters: number): boolean {
  return chapters > 0 && (careful?.length ?? 0) * 2 >= chapters
}
