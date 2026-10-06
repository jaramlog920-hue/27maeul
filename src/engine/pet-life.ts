// 반려동물이 마을에서 사는 모습 (계획 16 작업 21): 집에서의 습관, 함께 걸은 곳의 기억, 이웃·아이와 마주침.
// 모든 것은 자세·이동·작은 소리로만 그린다(속마음 설명 없음). 보상·재료·관계 점수·벌이 없고, 돌보지 않아도 달라지는 것이 없다.
// 필사·책상·서고와 아무 관계도 없다 — 이 파일은 필사 쪽 어떤 상태도 읽지 않는다.
import { comesToPlayer, favoriteSpot, petHabit, petHomeGoal, petSpotSafe, petWays, walkPlaceAt, type Companion, type PetMotion } from './companion'
import { FESTIVAL_FROM, festivalOf, weatherOf } from './calendar'
import { seasonOf } from './clock'
import { childMode, childStage } from './child'
import { isNear, npcTile } from './neighbors'
import { NO_LIFE, recordExperience } from './people'
import { petSpaceTile } from './spaces'
import { isHome, isIndoor, roomAt } from './world'
import type { GameEvent, GameState } from './game'
import type { Tile } from './types'

/** 동물 쪽에서 보이는 반응 한 줄의 종류 (글은 life-text pet.events) */
export interface PetEvent { key: string; place?: string; npc?: string; kid?: boolean }

const ADJ: readonly Tile[] = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }]
const tileOf = (c: Companion): Tile => ({ x: Math.round(c.x), y: Math.round(c.y) })
const dist = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/**
 * 이웃마다 동물을 대하는 방식 (취향). slow = 천천히 기다려 가까이 오는 사람: 첫 만남엔 서로 기다리고,
 * 다음 날엔 코를 가까이 대고, 세 번째 만남부터 꼬리를 흔든다. 나머지는 하루 한 번 곁에서 하는 작은 일.
 */
export const PET_NEIGHBORS: Record<string, { slow?: boolean; motion?: PetMotion }> = {
  shepherd: { slow: true },
  dexter: { slow: true },
  juniper: { motion: 'sniff' },
  baker: { motion: 'sniff' },
  carpenter: { motion: 'sniff' },
  grandpa: { motion: 'wait' },
  fisher: { motion: 'wag' },
}

/** 데리고 다니는 동물이 길에서 말씀 조각을 찾아오는 날의 몫 (2026-10-07 사용자: 가끔) */
export const PET_PIECE_CHANCE = 0.3
export const PET_PIECE_FROM = 8 * 60
export const PET_PIECE_TO = 18 * 60

/**
 * 오늘 동물이 길에서 조각을 찾을 차례인가: 데리고 다니는 동물이 바깥 길(모래 길) 위 기록자 곁에서 가만히 있을 때,
 * 낮에 하루 한 번만 살핀다(flags.petPieceDay). 찾을지는 날 씨앗으로 정해 다시 불러와도 같다.
 * 'roll' = 오늘 살폈고 찾지 못함, 'find' = 찾음, null = 아직 살필 때가 아님
 */
export function petPieceCheck(s: GameState, now: Tile, onRoad: boolean): 'find' | 'roll' | null {
  const c = s.companion
  if (!c || c.stay || c.motion || c.path.length) return null
  const day = s.clock.day, m = s.clock.minute
  if (s.flags.petPieceDay === day || m < PET_PIECE_FROM || m >= PET_PIECE_TO || sceneBusy(s)) return null
  if (isIndoor(now) || !onRoad || dist(tileOf(c), now) > 2) return null
  let h = (day * 2654435761) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 2246822519) >>> 0
  return (h % 1000) / 1000 < PET_PIECE_CHANCE ? 'find' : 'roll'
}

/** 모임·잔치·결혼 같은 장면이 있는 때에는 동물이 아무것도 시작하지 않는다 */
function sceneBusy(s: GameState): boolean {
  return s.scenes.length > 0 || !!s.today?.gathering || (!!festivalOf(s.clock.day) && s.clock.minute >= FESTIVAL_FROM - 60)
}

/** 집에 둔 동물이 지금 가고 싶은 칸 — 저녁에 친숙해진 동물은 기록자 곁, 아니면 습관 자리. 갈 수 없는 자리는 안전한 다른 칸 */
export function petStayGoal(s: GameState, c: Companion, occupied: ReadonlySet<string>, now: Tile): Tile {
  const m = s.clock.minute
  if (isHome(now) && m >= 18 * 60 && m < 22 * 60 && comesToPlayer(c, s.clock.day) && s.player.path.length === 0 && s.idle.seconds > 3) {
    for (const d of ADJ) {
      const t = { x: now.x + d.x, y: now.y + d.y }
      if (petSpotSafe(t, occupied)) return t
    }
  }
  const spot = petHabit(c, s.clock.day, m, weatherOf(s.clock.day)).spot
  // 동물 쉼터를 정해 뒀으면 낮잠·놀이 자리는 거기로 (작업 23) — 쉼터가 쉬고 있거나 막히면 기존 자리
  if (spot === 'blanket' || spot === 'toy') {
    const corner = petSpaceTile(s, occupied)
    if (corner) return corner
  }
  return petHomeGoal(c, occupied, spot)
}

/**
 * 한 번 흐를 때마다: 함께 걸은 곳 기억, 좋아하는 자리 알아보기, 먼저 옆에 온 날, 이웃·아이와 마주침.
 * 같은 장소에 실제로 함께 있을 때만 일어나고, 하루·몇 시간에 한 번으로 제한한다.
 */
export function petLife(s: GameState, now: Tile, events: GameEvent[], kidAt: Tile | null): GameState {
  const c0 = s.companion
  if (!c0) return s
  let c = c0
  const day = s.clock.day, minute = s.clock.minute, t = day * 1440 + minute
  const pet = tileOf(c)
  const found = new Set(c.found ?? [])
  const say = (e: PetEvent) => events.push({ type: 'pet', ...e })
  const motion = (action: PetMotion) => { c = { ...c, motion: { action, left: 4 } } }
  const idle = !c.motion && c.path.length === 0

  // 1) 함께 걸은 곳 — 따라다니는 동안 바깥의 낯익은 자리에 닿으면 코를 대 보고, 다음에 다시 오면 걸음을 늦춘다
  if (!c.stay && idle && !isIndoor(now) && dist(pet, now) <= 2) {
    const place = walkPlaceAt(now)
    if (place) {
      const walked = c.walked ?? {}
      if (!(place in walked)) {
        const first = !found.has('walk')
        found.add('walk')
        c = { ...c, walked: { ...walked, [place]: day }, moments: { ...c.moments, walk: c.moments?.walk ?? day }, lastWalkReact: t }
        motion('sniff')
        say({ key: first ? 'firstWalk' : 'newPlace', place })
      } else if (t - (c.lastWalkReact ?? -99999) >= 360) {
        c = { ...c, lastWalkReact: t }
        motion(c.kind === 'dog' ? 'wag' : 'sniff')
        say({ key: 'knownPlace', place })
      }
    }
  }

  // 2) 집에 둔 동물이 낮잠 자리에서 쉬는 모습을 곁에서 보면 좋아하는 자리를 알게 된다
  if (c.stay && idle && isHome(now) && dist(pet, now) <= 4 && !found.has('spot')) {
    const h = petHabit(c, day, minute, weatherOf(day))
    if (h.pose === 'nap' && h.spot === favoriteSpot(c)) {
      found.add('spot')
      c = { ...c, moments: { ...c.moments, spot: c.moments?.spot ?? day } }
      say({ key: 'foundSpot' })
    }
  }

  // 3) 친숙해진 동물이 저녁에 먼저 옆으로 온 첫날
  if (c.stay && idle && isHome(now) && dist(pet, now) === 1 && minute >= 18 * 60 && minute < 22 * 60 && comesToPlayer(c, day) && !found.has('came')) {
    found.add('came')
    c = { ...c, moments: { ...c.moments, came: c.moments?.came ?? day } }
    motion('rest')
    say({ key: 'came' })
  }

  let life = s.life
  // 4) 이웃과 마주침 — 같은 곳(같은 방·같은 바깥)에서 두 칸 안, 기록자가 가까이 있을 때 하루 한 번
  if (!sceneBusy(s) && !c.motion && dist(pet, now) <= 6) {
    const moment = { day, minute, weather: weatherOf(day), season: seasonOf(day) }
    for (const [id, n] of Object.entries(s.npcs)) {
      const taste = PET_NEIGHBORS[id]
      if (!taste || !n.visible) continue
      const nt = npcTile(n)
      if (!isNear(nt, pet, 2) || isIndoor(nt) !== isIndoor(pet) || roomAt(nt) !== roomAt(pet) || isIndoor(now) !== isIndoor(pet)) continue
      const met = c.met?.[id]
      if (met?.last === day) continue
      const count = met?.n ?? 0
      c = { ...c, met: { ...c.met, [id]: { n: count + 1, last: day } } }
      motion(taste.slow ? (['wait', 'sniff', 'wag'] as const)[Math.min(count, 2)] : taste.motion ?? 'wait')
      life = recordExperience(life ?? NO_LIFE, { id: `pet:meet:${id}`, kind: 'pet', with: [id] }, moment)
      say({ key: taste.slow ? (count === 0 ? 'slowFirst' : count === 1 ? 'slowAgain' : 'slowKnown') : count === 0 ? 'neighborFirst' : 'neighborAgain', npc: id })
      break
    }
  }

  // 5) 우리 아이 — 단계에 맞춰: 걷는 아이 곁에서는 가만히 기다리고, 돕는 아이와는 짧게 논다 (하루 한 번)
  if (!sceneBusy(s) && !c.motion && kidAt && s.child && dist(pet, kidAt) <= 2 && dist(pet, now) <= 6 && isIndoor(kidAt) === isIndoor(pet)) {
    const mode = childMode(s.child, day), stage = childStage(s.child, day)
    const met = c.met?.kid
    if (mode !== 'cradle' && mode !== 'away' && stage !== 'baby' && met?.last !== day) {
      c = { ...c, met: { ...c.met, kid: { n: (met?.n ?? 0) + 1, last: day } } }
      const small = stage === 'toddler'
      motion(small ? 'wait' : petWays(c).energy > 0 ? 'play' : 'wag')
      say({ key: small ? 'kidSmall' : 'kidHelper', kid: true })
    }
  }

  if (c === c0 && life === s.life) return s
  c = { ...c, found: [...found] }
  return { ...s, companion: c, life: life ?? s.life }
}
