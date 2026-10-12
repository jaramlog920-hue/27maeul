import { heartUp, type GameState } from './game'
import { stageByAge } from './gen-age'
import { CRIB_NEEDS } from './gen-birth'
import { PREP_GAIN } from './gen-marriage'
import { take } from './items'
import { BABY_DAY } from './stories'

/** 이미 태어난 고정 이야기 아기의 부탁. 자율 결혼·추가 출생과는 별개다. */
export function bakerCribWaiting(s: GameState, npc: string): boolean {
  return npc === 'baker' && s.clock.day >= BABY_DAY && stageByAge(BABY_DAY, s.clock.day) === 'baby' && !s.flags.bakerCribGiven
}

/** 재료로 그 자리에서 만들어 건넨다. 재료 부족·중복 전달 때는 아무것도 바꾸지 않는다. */
export function makeBakerCrib(s: GameState): GameState | null {
  if (!bakerCribWaiting(s, 'baker')) return null
  const inv = take(s.inv, CRIB_NEEDS)
  if (!inv) return null
  const recipesKnown = s.recipesKnown.includes('homeCradle') ? s.recipesKnown : [...s.recipesKnown, 'homeCradle' as const]
  return heartUp({ ...s, inv, recipesKnown, flags: { ...s.flags, bakerCribGiven: s.clock.day } }, 'baker', PREP_GAIN)
}
