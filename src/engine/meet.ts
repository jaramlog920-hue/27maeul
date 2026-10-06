// 계획 20 2부 작업 B: 쉬는 시간에 이웃 둘이 만나면 (D29·P2·P3).
// 같은 지도·보이는 두 이웃이 맞닿은 칸(가로·세로 한 칸)에 있고 둘 다 쉬는 중이면, 1분마다 한 번 살핀다:
// 같은 쌍은 하루 세 번까지, 두 만남 사이 30분 이상. 결과는 저장된 씨앗 + 쌍 + 날·횟수로 뽑고 취향이 맞을수록 좋은 쪽.
// 머리 위 이모티콘은 화면 상태만 (저장하지 않는다), 실제 시간 약 2초.
import { MEET_GAP_MIN } from './gen-config'
import { addAffinity, canMeetMore, genRng, meetsToday, relationId, stageOf, type GenState } from './gen'
import { quietAfterBreakup } from './gen-relations'
import { peopleData } from './people'
import type { Tile } from './types'

export type EmoteKind = 'heart' | 'laugh' | 'talk' | 'sweat' | 'angry'
export interface Emote {
  npc: string
  kind: EmoteKind
  /** 남은 실제 시간 (초) */
  left: number
}
export const EMOTE_SECONDS = 2

/** 결과마다 호감도 (D29) */
export const MEET_GAIN: Record<EmoteKind, number> = { laugh: 2, talk: 1, heart: 3, sweat: 0, angry: -2 }

/** 두 사람의 취향이 맞는 정도 0–3: 좋아하는 물건·좋아하는 활동·장소가 겹치는 수 */
export function fitOf(a: string, b: string, likes: (id: string) => readonly string[]): number {
  const pa = peopleData().people[a]?.tastes, pb = peopleData().people[b]?.tastes
  let n = likes(a).filter((x) => likes(b).includes(x)).length
  for (const k of ['activity', 'place'] as const) {
    const ta = Object.keys((pa?.[k] ?? {}) as Record<string, number>), tb = Object.keys((pb?.[k] ?? {}) as Record<string, number>)
    n += ta.filter((x) => tb.includes(x)).length
  }
  return Math.min(3, n)
}

/** 만남 하나의 결과 (P2): 웃음 35 / 이야기 30 / 하트 15(친한 사이 이상만) / 머쓱 12 / 화남 8, 취향 1당 화남 −3·하트 +3. 헤어진 지 7일 안은 이야기·머쓱만 */
export function meetResult(g: GenState, a: string, b: string, day: number, n: number, fit: number): EmoteKind {
  const quiet = quietAfterBreakup(g, a, b, day)
  const close = stageOf(g, a, b) !== 'neighbor'
  const w: [EmoteKind, number][] = quiet
    ? [['talk', 30], ['sweat', 12]]
    : [['laugh', 35], ['talk', 30], [close ? 'heart' : 'laugh', 15 + fit * 3], ['sweat', 12], ['angry', Math.max(0, 8 - fit * 3)]]
  const total = w.reduce((s, [, x]) => s + x, 0)
  let r = genRng(g.seed, 'meet', [a, b], day * 10 + n)() * total
  for (const [k, x] of w) if ((r -= x) < 0) return k
  return 'talk'
}

/**
 * 1분마다: 맞닿은 쉬는 이웃 쌍마다 만남을 살피고 호감도를 더한다. 이모티콘은 draw가 참일 때만 (필사 중·새 터에서는 계산만).
 * 한 사람은 한 번에 한 만남만 (같은 분에 둘과 만나지 않는다)
 */
export function checkMeets(
  g: GenState,
  at: Record<string, Tile>,
  free: ReadonlySet<string>,
  day: number,
  minute: number,
  likes: (id: string) => readonly string[],
): { g: GenState; emotes: Emote[] } {
  const ids = Object.keys(at).filter((id) => free.has(id)).sort()
  const busy = new Set<string>()
  const emotes: Emote[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j]
      if (busy.has(a) || busy.has(b)) continue
      const ta = at[a], tb = at[b]
      if (Math.abs(ta.x - tb.x) + Math.abs(ta.y - tb.y) !== 1) continue
      if (!canMeetMore(g, a, b, day)) continue
      const m = meetsToday(g, a, b, day)
      if (minute - m.last < MEET_GAP_MIN) continue
      const kind = meetResult(g, a, b, day, m.n, fitOf(a, b, likes))
      g = addAffinity(g, a, b, MEET_GAIN[kind])
      g = { ...g, meets: { ...g.meets, [relationId(a, b)]: { day, n: m.n + 1, last: minute } } }
      busy.add(a)
      busy.add(b)
      emotes.push({ npc: a, kind, left: EMOTE_SECONDS }, { npc: b, kind, left: EMOTE_SECONDS })
    }
  }
  return { g, emotes }
}

/** 이모티콘 시간 흐르기 (실제 초) */
export function tickEmotes(list: readonly Emote[] | undefined, dt: number): Emote[] | undefined {
  if (!list?.length) return list as Emote[] | undefined
  const next = list.map((e) => ({ ...e, left: e.left - dt })).filter((e) => e.left > 0)
  return next.length ? next : undefined
}
