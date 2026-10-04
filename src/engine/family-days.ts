// 가족 생일 (계획 12, 2026-10-04 사용자): 배우자·아이 생일 아침에 작은 장면, 처음 한 번은 가족 앨범에 한 장 (같은 장면이 해마다 다시 나온다).
// 배우자 생일은 이웃 생일(notebook BIRTHDAYS — 이미 이웃 수첩·선물 두 배와 이어져 있다)을 그대로 쓰고, 아이 생일은 태어난 날 기준.
// 미니게임 없음. game.ts의 새 날 아침이 부른다 (이 파일은 game.ts를 부르지 않는다)
import { childMode, type Child } from './child'
import { SEASON_DAYS } from './clock'
import { isBirthday } from './notebook'
import type { Romance } from './romance'

/** 한 해 = 네 철 */
export const YEAR_DAYS = SEASON_DAYS * 4

/** 아이의 생일인가: 태어난 날에서 한 해씩 지난 날 */
export function childBirthday(c: Pick<Child, 'born'>, day: number): boolean {
  const age = day - c.born
  return age > 0 && age % YEAR_DAYS === 0
}

/** 배우자의 생일인가 (부부일 때만) */
export function spouseBirthday(r: Romance | null | undefined, day: number): boolean {
  return r?.stage === 'married' && !!r.partner && isBirthday(r.partner, day)
}

type MorningState = { clock: { day: number }; child: Child | null; romance: Romance; scenes: string[] }

/** 새 날 아침: 생일 장면 (배우자 fam:bdaySpouse, 아이 fam:bdayChild — 먼 곳에 사는 아이는 fam:bdayChildFar 편지) */
export function familyMorning<S extends MorningState>(s: S): S {
  const day = s.clock.day
  const add: string[] = []
  if (spouseBirthday(s.romance, day)) add.push('fam:bdaySpouse')
  const c = s.child
  if (c && childBirthday(c, day)) add.push(childMode(c, day) === 'away' ? 'fam:bdayChildFar' : 'fam:bdayChild')
  return add.length ? { ...s, scenes: [...s.scenes, ...add] } : s
}
