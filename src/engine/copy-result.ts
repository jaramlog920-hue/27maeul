import { STAT_IDS, statScore, totalXp, type StatId, type Stats } from './stats'

export interface CopyStatGain {
  id: StatId
  before: number
  after: number
  xp: number
}

/** 화면 점수가 반올림되어 같아도 실제로 얻은 경험치는 남긴다. */
export function copyStatGains(before: Stats, after: Stats): CopyStatGain[] {
  return STAT_IDS.flatMap(id => {
    const xp = Math.round((totalXp(after[id]) - totalXp(before[id])) * 100) / 100
    return xp > 0 ? [{ id, before: statScore(before[id]), after: statScore(after[id]), xp }] : []
  })
}
