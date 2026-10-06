// 모임 안의 주민 개성과 지난 회차 이야기 (계획 16 작업 15).
// 주민마다·활동마다 하는 일(does)과 처음·끝 말이 다르다 (src/content/club-lines.json). 같은 동작을 모두 똑같이 되풀이하지 않는다.
// 후속 말은 실제 있었던 회차(플레이어가 참여해 기록이 남은 것)에서만, 불참한 회차는 실제 모인 주민이 한 일만 전한다.
import LINES from '../content/club-lines.json'
import lifeText from '../content/life-text.json'
import type { GameState } from './game'
import type { Appt } from './plans'
import type { ClubActivity } from './clubs'

type Voice = 'polite' | 'sir' | 'old' | 'casual' | 'child'
export interface ClubPerson { does: string; start: string; finish: string }
const VOICES = LINES.voices as Record<string, Voice>
const PEOPLE = LINES.lines as Record<string, Record<ClubActivity, ClubPerson>>

export const clubVoice = (npc: string): Voice => VOICES[npc] ?? 'polite'
/** 이 주민이 이 활동에서 하는 일과 말 (없는 주민은 null) */
export const clubPerson = (npc: string, activity: ClubActivity): ClubPerson | null => PEOPLE[npc]?.[activity] ?? null

const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

/** 그 모임의 지난 회차들 중 플레이어가 함께해 기록이 남은 것, 오래된 순 */
function attendedBefore(s: GameState, clubId: string, current: Appt): { appt: Appt; run: NonNullable<GameState['clubSessions'][string]> }[] {
  return s.plans.appts
    .filter((a) => a.clubId === clubId && a.state === 'done' && a.attended && a.id !== current.id && a.day < current.day)
    .sort((a, b) => a.day - b.day)
    .flatMap((appt) => {
      const run = s.clubSessions?.[appt.id]
      return run && run.step === 'done' ? [{ appt, run }] : []
    })
}

/**
 * 지난 회차를 떠올리는 말 한 줄 — 실제 있었던 일이 있을 때만.
 * 방석을 만들었으면 그 방석(집에 둠/모임 자리에 남김), 아니면 지난번에 고른 것. 그때 함께한 이웃 한 사람이 말한다.
 */
export function clubFollowUp(s: GameState, current: Appt): { npc: string; text: string } | null {
  if (!current.clubId) return null
  const past = attendedBefore(s, current.clubId, current)
  const last = past[past.length - 1]
  if (!last) return null
  const here = current.startedWith ?? current.members
  const who = here.find((id) => (last.appt.startedWith ?? []).includes(id))
  if (!who) return null
  const voice = lifeText.clubs.follow[clubVoice(who)]
  const color = (lifeText.clubs.colorWord as Record<string, string>)[last.run.picked ?? ''] ?? last.run.picked ?? ''
  if (last.run.made && last.appt.activity === 'sew') {
    const left = last.run.result === 'club' && s.clubWorks?.[current.clubId]
    return { npc: who, text: fill(left ? voice.cushionClub : voice.cushionHome, { color }) }
  }
  if (last.run.picked && !['sew'].includes(last.appt.activity ?? '')) return { npc: who, text: fill(voice.again, { picked: last.run.picked }) }
  return null
}

/**
 * 플레이어가 없던 지난 회차 (이레 안): 실제 모인 주민이 한 일만, 불참을 탓하는 말 없이.
 * 모임이 열리지 않은 회차(쉼·건너뜀)나 플레이어가 함께한 회차는 없다.
 */
export function clubMissed(s: GameState, clubId: string): { day: number; items: { npc: string; does: string }[] } | null {
  const a = s.plans.appts
    .filter((x) => x.clubId === clubId && x.state === 'done' && !x.attended && (x.startedWith ?? []).length > 0 && s.clock.day - x.day >= 0 && s.clock.day - x.day <= 7 && x.activity)
    .sort((x, y) => y.day - x.day)[0]
  if (!a) return null
  const items = (a.startedWith ?? []).flatMap((npc) => {
    const p = clubPerson(npc, a.activity as ClubActivity)
    return p ? [{ npc, does: p.does }] : []
  })
  return items.length ? { day: a.day, items } : null
}

/** 가장 최근에 함께 만들어 집으로 가져간 방석 (목록 상세용) */
export function clubLastHomeWork(s: GameState, clubId: string): { color: string } | null {
  const done = s.plans.appts.filter((a) => a.clubId === clubId && a.state === 'done' && a.attended).sort((a, b) => b.day - a.day)
  for (const a of done) {
    const run = s.clubSessions?.[a.id]
    if (run?.made) return run.result === 'home' ? { color: run.picked ?? '' } : null
  }
  return null
}
