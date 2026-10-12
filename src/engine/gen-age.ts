import { STAGE_AT } from './gen-config'
import type { GenStage } from './gen'

/** 모든 주민 아이가 공유하는, 출생일부터 센 성장 단계. */
export function stageByAge(born: number, day: number): GenStage {
  const age = day - born
  return age >= STAGE_AT.elder ? 'elder' : age >= STAGE_AT.adult ? 'adult' : age >= STAGE_AT.teen ? 'teen' : age >= STAGE_AT.child ? 'child' : 'baby'
}
