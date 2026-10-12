import text from '../content/neighbor-moments.json'
import { hallGuestsToday, notYet, shelvedCount, type GameState } from './game'
import { BABY_PARTY_SPOTS, gatheringWindow, HILL_SPOTS } from './bonds'
import { festivalEvening, weddingEvening } from './event-scene'
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { FESTIVAL_SPOTS } from './neighbors'
import { WEDDING_SPOT } from './romance'
import { weddingTodayOf } from './gen-marriage'
import { spotsForAppt } from './plans'
import { HALL_SPOTS } from './places'
import { isReadingDay, READING_FROM, READING_TO, readingRest } from './meetings'
import { unseenTalkPopups } from './talk-popups'
import type { GameContent, Tile } from './types'

/** 화면에 보이기만 하는 이웃이 아니라 실제로 행사 자리에 도착한 참석자만. */
function atSpot(s: GameState, id: string, spot: Tile | undefined): boolean {
  const n = s.npcs[id]
  return !!spot && !!n?.visible && n.path.length === 0 && Math.abs(n.x - spot.x) + Math.abs(n.y - spot.y) <= 1
}

/** 행사 중에는 다른 이야기보다 행사 대화부터. 보상이나 참여 기록은 늘리지 않는다. */
export function eventNeighborLine(s: GameState, id: string, content: Pick<GameContent, 'neighbors'>): string | null {
  if (s.map && s.map !== 'village') return null
  const def = content.neighbors.find(n => n.id === id)
  if (!def || notYet(def, s.flags.villageLevel ?? 0, s.flags) || !s.npcs[id]?.visible) return null
  const minute = s.clock.minute
  for (const a of s.plans?.appts ?? []) {
    if (a.state !== 'running' || a.day !== s.clock.day || minute < a.from || minute >= a.to) continue
    const members = a.startedWith ?? []
    const i = members.indexOf(id)
    if (i < 0 || !atSpot(s, id, spotsForAppt(a)[i])) continue
    const f = s.fests?.find(f => f.apptId === a.id && !f.closed && !f.cancelled)
    if (f && f.kind !== 'festival') return text.events[f.kind]
    if (a.kind === 'club') return text.events.club
  }
  if (minute >= FESTIVAL_FROM && minute < FESTIVAL_TO) {
    const spot = id === s.romance?.partner && weddingEvening(s) ? WEDDING_SPOT : FESTIVAL_SPOTS[id]
    if (atSpot(s, id, spot)) {
      if (weddingEvening(s) || weddingTodayOf(s.gen, s.clock.day)) return text.events.wedding
      if (s.flags.allFeast === 1) return text.events.allFeast
      if (s.flags.gospelFeast === 1) return text.events.gospelFeast
      const festival = festivalEvening(s)
      if (festival) return text.events[festival]
    }
  }
  const gathering = s.today?.gathering
  if (gathering) {
    const [from, to] = gatheringWindow(gathering)
    const spot = (gathering === 'babyParty' ? BABY_PARTY_SPOTS : HILL_SPOTS)[id]
    if (minute >= from && minute < to && !(gathering === 'starNight' && id === 'shepherd') && atSpot(s, id, spot)) return text.events[gathering]
  }
  if (isReadingDay(s.clock.day) && !readingRest(s) && minute >= READING_FROM && minute < READING_TO) {
    const i = hallGuestsToday(s, content).indexOf(id)
    if (i >= 0 && atSpot(s, id, HALL_SPOTS[i])) return text.events.reading
  }
  return null
}

/** 25권에서 이웃마다 열리는 말. 안 읽은 말부터, 읽은 말은 가끔 평소 대화로 다시 들려준다. */
export function oldNeighborLine(s: GameState, id: string, rnd: number): string | null {
  if (shelvedCount(s) < 25) return null
  const ordinary = (text.oldNeighbors as Record<string, string>)[id]
  if (!ordinary) return null
  let line = ordinary
  if (id === 'baker' && s.flags.bakerCribGiven) line = text.memories.crib
  else {
    const memory = Object.values(s.life?.experiences ?? {})
      .filter(e => e.with.includes(id) && e.kind in text.memories)
      .sort((a, b) => (b.last ?? 0) - (a.last ?? 0))[0]
    if (memory) line = (text.memories as Record<string, string>)[memory.kind]
  }
  return unseenTalkPopups(s, id, [line]).length || rnd < 0.2 ? line : null
}
