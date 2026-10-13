import type { GameState } from './game'
import type { Tile } from './types'
import { isHome } from './world'
import { phaseOf, seasonOf } from './clock'
import { weatherOf } from './calendar'
import { onceKey } from './stories'

/** 실제로 집에 함께 있는 순간만 예약한다. 시간·돈·호감도 보상은 없다. */
export function familyScenicEvents(before: GameState, next: GameState, childAt: Tile | null): GameState {
  if ((next.map ?? 'village') !== 'village' || !isHome(next.player)) return next
  const { day, minute } = next.clock, r = next.romance
  const enqueue = (id: string, key: string) => ({ ...next, scenes: [...next.scenes, id], flags: { ...next.flags, [key]: 1 } })
  if (childAt && isHome(childAt) && next.flags.childFirstHelpPending === day && !next.flags.childFirstHelpScene)
    return enqueue('childFirstHelp', 'childFirstHelpScene')
  if (r.stage !== 'married' || !r.partner) return next
  const spouse = next.npcs[r.partner], old = before.npcs[r.partner]
  if (!spouse?.visible || !isHome(spouse)) return next
  if (r.marriedDay !== null && day === r.marriedDay + 1 && minute < 12 * 60 && !next.flags.firstMorningScene)
    return enqueue('firstMorning', 'firstMorningScene')
  if (minute >= 18 * 60 && old?.visible && !isHome(old) && !next.flags[onceKey('spouseReturn', day)])
    return enqueue('spouseReturn', onceKey('spouseReturn', day))
  if (next.child && childAt && isHome(childAt) && !next.child.left && seasonOf(day) === 'winter' && weatherOf(day) === 'snow' && phaseOf(minute) === 'night' && !next.flags[onceKey('familyWinter', day)])
    return enqueue('familyWinter', onceKey('familyWinter', day))
  return next
}
