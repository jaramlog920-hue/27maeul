// 가족 생일 (계획 12, 2026-10-04 사용자): 배우자·아이 생일 아침에 작은 장면, 처음 한 번은 가족 앨범에 한 장 (같은 장면이 해마다 다시 나온다).
// 배우자 생일은 이웃 생일(notebook BIRTHDAYS — 이미 이웃 수첩·선물 두 배와 이어져 있다)을 그대로 쓰고, 아이 생일은 태어난 날 기준.
// 미니게임 없음. game.ts의 새 날 아침이 부른다 (이 파일은 game.ts를 부르지 않는다)
import { childMode, type Child } from './child'
import { SEASON_DAYS } from './clock'
import { isBirthday } from './notebook'
import { NO_LIFE, recordExperience, type Life } from './people'
import { weatherOf } from './calendar'
import { seasonOf } from './clock'
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

type MorningState = { clock: { day: number }; child: Child | null; romance: Romance; scenes: string[]; life?: Life }

/** 새 날 아침: 생일 장면 (배우자 fam:bdaySpouse, 아이 fam:bdayChild — 먼 곳에 사는 아이는 fam:bdayChildFar 편지) */
export function familyMorning<S extends MorningState>(s: S): S {
  const day = s.clock.day
  const add: string[] = []
  // 해마다 같은 생일: 장면은 그대로 나오고, 경험은 한 항목에 참여한 횟수·마지막 해만 쌓인다 (첫 날짜 유지)
  const marks: { id: string; with: string[] }[] = []
  const partner = s.romance?.stage === 'married' ? s.romance.partner : null
  if (spouseBirthday(s.romance, day)) {
    add.push('fam:bdaySpouse')
    marks.push({ id: 'fam:bday:spouse', with: [partner!, ...(s.child && childMode(s.child, day) !== 'away' ? ['family:child'] : [])] })
  }
  const c = s.child
  if (c && childBirthday(c, day)) {
    const far = childMode(c, day) === 'away'
    add.push(far ? 'fam:bdayChildFar' : 'fam:bdayChild')
    // 떠나 사는 아이의 생일은 편지로만 — 같은 자리의 참여 기록이 아니다
    if (!far) marks.push({ id: 'fam:bday:child', with: ['family:child', ...(partner ? [partner] : [])] })
  }
  if (!add.length) return s
  let life = s.life ?? NO_LIFE
  for (const m of marks) {
    life = recordExperience(life, { id: m.id, kind: 'family', with: m.with }, { day, minute: 6 * 60, season: seasonOf(day), weather: weatherOf(day) })
  }
  return { ...s, scenes: [...s.scenes, ...add], ...(marks.length ? { life } : {}) }
}
