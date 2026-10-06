// 주민들의 작은 근황 (계획 16 작업 24, 기획 10): 긴 이야기를 시작하지 않아도 마을을 걷다 보면 눈에 들어오는 작은 생활 변화.
// 날(씨앗)마다 마을 전체에서 두세 건만 — 같은 날은 언제 다시 접속해도 같은 근황(저장하지 않는다: 날짜·이사 온 이웃·완료 표식에서 매번 같게 다시 계산).
// 규칙: 이야기·약속·행사·모임·잔치가 먼저(여기는 일과 위, 그것들 아래), 벗어나는 날·마을 사건 단계·이야기 뒤에 바뀐 일과가 있는 이웃은 쉬어 간다.
// 물건·닢 보상 없음, 놓친 목록·확인 표시 없음, 큰 이야기를 근황으로만 시작하게 하지 않는다. 필사·책상·서고와 무관.
// 문구는 life-text.json `news` 절 하나 — 말을 걸면 첫마디로, 수첩 "요즘"에 본 모습으로.
import { isWet, weatherOf } from './calendar'
import { idSeed, type Activity, type Req } from './people'
import { FACILITY_IDS, SITES, type FacilityId } from './village-sites'
import lifeText from '../content/life-text.json'
import type { Season, Tile, Weather } from './types'

/** 하루에 마을 전체에서 보이는 근황 수 (기획 기본값 2~3건 — 반복과 화면 밀도를 보고 조정) */
export const NEWS_PER_DAY = { min: 2, max: 3 } as const
/** 수첩 "요즘"에 본 모습을 이 날 수 안에서만 보여 준다 (오래된 것은 더는 '요즘'이 아니다) */
export const NEWS_RECENT_DAYS = 10

export type NewsKind = 'work' | 'rest' | 'meet' | 'season' | 'after'

export interface NewsWho {
  npc: string
  at: Tile
  doing?: Activity
}

export interface NewsDef {
  id: string
  kind: NewsKind
  /** 한 사람 또는 만나는 두 사람(둘 다 이사 와 있고 평소 함께하는 사이 — 일과의 with와 같은 관계) */
  who: readonly NewsWho[]
  /** 이 때에만 (시각, 낮 동안만 — 저녁 사랑방·모임·잔치와 겹치지 않는다) */
  from: number
  to: number
  /** 비·눈·안개가 아닌 날만 (바깥 자리) */
  dry?: boolean
  seasons?: readonly Season[]
  weathers?: readonly Weather[]
  /** 이 주민 쪽 조건 (이야기 완료 표식 등) — 첫 번째 사람 기준 */
  req?: Req
  /** 근황 동안만 놓이는 작은 소품 (assets/furniture/expansion/props 도트 id, 길 막지 않는 한 칸). 여럿이면 날마다 번갈아 */
  prop?: { art: readonly string[]; at: Tile }
}

const W = (npc: string, x: number, y: number, doing?: Activity): NewsWho => ({ npc, at: { x, y }, ...(doing ? { doing } : {}) })

/**
 * 근황 목록. 자리는 모두 그 주민의 일과·시간표에 이미 있는 걸을 수 있는 칸(테스트가 다시 확인).
 * 같은 일을 하는 날의 변화(작업), 잠깐 쉬는 날(휴식), 평소 함께하는 둘이 나누는 오후(만남), 계절, 끝난 이야기·완성한 시설의 후속.
 */
export const NEWS: readonly NewsDef[] = [
  // 작업
  { id: 'bakerTray', kind: 'work', who: [W('baker', 2, 17, 'bread')], from: 540, to: 600, prop: { art: ['snackPlate'], at: { x: 2, y: 19 } } },
  { id: 'carpenterOwn', kind: 'work', who: [W('carpenter', 6, 24, 'wood')], from: 780, to: 840, req: { notStory: ['carpenterChair'] }, prop: { art: ['planeTool'], at: { x: 3, y: 24 } } },
  { id: 'penelopeCloth', kind: 'work', who: [W('penelope', 39, 24, 'weave')], from: 840, to: 900, dry: true, seasons: ['spring', 'summer', 'autumn'], prop: { art: ['clothRose', 'clothBlue'], at: { x: 38, y: 24 } } },
  // 휴식
  { id: 'smithBreak', kind: 'rest', who: [W('smith', 43, 22, 'rest')], from: 780, to: 840 },
  { id: 'presserPause', kind: 'rest', who: [W('presser', 46, 21, 'rest')], from: 960, to: 1020 },
  { id: 'fisherBreak', kind: 'rest', who: [W('fisher', 24, 36, 'rest')], from: 840, to: 900, dry: true },
  // 만남 (평소 함께하는 사이)
  { id: 'poppyPenelope', kind: 'meet', who: [W('poppy', 44, 62, 'tea'), W('penelope', 43, 62, 'tea')], from: 840, to: 900 },
  { id: 'juniperDexter', kind: 'meet', who: [W('juniper', 23, 15, 'book'), W('dexter', 22, 14, 'rest')], from: 960, to: 1020, dry: true, seasons: ['spring', 'summer', 'autumn'] },
  // 계절
  { id: 'juniperBloom', kind: 'season', who: [W('juniper', 27, 11, 'book')], from: 840, to: 900, dry: true, seasons: ['spring'], prop: { art: ['flowerDrawing'], at: { x: 26, y: 11 } } },
  { id: 'juniperLeaves', kind: 'season', who: [W('juniper', 27, 11, 'book')], from: 840, to: 900, dry: true, seasons: ['autumn'], prop: { art: ['seasonalLeaves'], at: { x: 27, y: 8 } } },
  { id: 'marigoldBasket', kind: 'season', who: [W('marigold', 39, 11, 'grape')], from: 840, to: 900, dry: true, seasons: ['autumn'], prop: { art: ['basketEmpty'], at: { x: 38, y: 11 } } },
  { id: 'penelopeWinter', kind: 'season', who: [W('penelope', 6, 53, 'weave')], from: 840, to: 900, seasons: ['winter'] },
  // 완료 후속 (끝난 이야기·완성한 시설)
  { id: 'carpenterSit', kind: 'after', who: [W('carpenter', 7, 84, 'rest')], from: 780, to: 840, req: { story: [{ id: 'carpenterChair' }] } },
  { id: 'shadeRest', kind: 'after', who: [W('grandpa', 29, 7, 'rest')], from: 780, to: 840, dry: true, weathers: ['sunny', 'hot'], req: { story: [{ id: 'village:shade' }], exp: ['project:shade'] } },
]

export const NEWS_BY_ID: ReadonlyMap<string, NewsDef> = new Map(NEWS.map((n) => [n.id, n]))

// ── 하루 배정 (날 씨앗, 저장 없음) ──

function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

/** 오늘 보이는 근황 수 (2 또는 3 — 날 씨앗) */
export function newsCountOf(day: number): number {
  return hash(day * 53 + 17) < 0.5 ? NEWS_PER_DAY.min : NEWS_PER_DAY.max
}

const sameTile = (a: Tile, b: Tile) => a.x === b.x && a.y === b.y

/**
 * 오늘의 근황: 조건이 맞는 것(ok)을 날 씨앗 순서로 훑어 하루 수만큼. 한 사람은 하루 한 건, 같은 칸에 두 건이 서지 않는다.
 * 같은 상태·같은 날이면 늘 같은 결과 (재접속해도 바뀌지 않는다)
 */
export function newsOfDay(day: number, ok: (n: NewsDef) => boolean): NewsDef[] {
  const want = newsCountOf(day)
  const ranked = NEWS.filter(ok)
    .map((n) => ({ n, score: hash(day * 977 + idSeed(n.id)) }))
    .sort((a, b) => a.score - b.score || (a.n.id < b.n.id ? -1 : 1))
  const out: NewsDef[] = []
  const used = new Set<string>()
  for (const { n } of ranked) {
    if (out.length >= want) break
    if (n.who.some((w) => used.has(w.npc) || out.some((o) => o.who.some((x) => sameTile(x.at, w.at))))) continue
    out.push(n)
    for (const w of n.who) used.add(w.npc)
  }
  return out
}

/** 날씨·계절·시각 조건 (이웃·이야기 조건은 game.ts) */
export function newsWeatherOk(d: Pick<NewsDef, 'dry' | 'weathers'>, w: Weather): boolean {
  if (d.dry && (isWet(w) || w === 'fog')) return false
  if (d.weathers && !d.weathers.includes(w)) return false
  return true
}
export const newsSeasonOk = (d: Pick<NewsDef, 'seasons'>, season: Season) => !d.seasons || d.seasons.includes(season)
export const newsWeatherOfDay = (day: number): Weather => weatherOf(day)

// ── 글 (life-text.json news 절) ──

interface NewsText {
  /** 말을 걸면 첫마디로 (사람별) */
  mutter: Record<string, string[]>
  /** 수첩 "요즘"에 적는 본 모습 (사람별, 한 줄) */
  seen: Record<string, string>
}
const TEXT = lifeText.news as unknown as { items: Record<string, NewsText>; habits: Record<string, string>; seenOn: string; seenToday: string; title: string }
export const NEWS_TEXT = TEXT

export const newsMutter = (id: string, npc: string): string[] => TEXT.items[id]?.mutter[npc] ?? []
export const newsSeenText = (id: string, npc: string): string | null => TEXT.items[id]?.seen[npc] ?? null

/** 근황 동안 놓이는 소품 그림 (날마다 번갈아) */
export const newsPropArt = (d: NewsDef, day: number): string | null => (d.prop ? d.prop.art[day % d.prop.art.length] : null)

// ── 요즘의 모습 (수첩): 이야기가 끝났거나 시설이 완성됐을 때 이어지는 생활 — 지금 사실인 것만 ──

export interface Habit {
  id: string
  npc: string
  req: Req
}

/** 사실로 남은 변화: 끝난 이야기가 놓은 것, 함께 지은 시설을 쓰는 이웃 */
export const HABITS: readonly Habit[] = [
  { id: 'carpenterChair', npc: 'carpenter', req: { story: [{ id: 'carpenterChair' }] } },
  { id: 'bakerRest', npc: 'baker', req: { story: [{ id: 'bakerRest' }] } },
  { id: 'grandpaShelter', npc: 'grandpa', req: { story: [{ id: 'grandpaShelter' }] } },
  ...FACILITY_IDS.flatMap((f: FacilityId) =>
    SITES[f].interested.map((npc) => ({ id: `facility.${f}`, npc, req: { story: [{ id: `village:${f}` }], exp: [`project:${f}`] } })),
  ),
]

export const habitText = (id: string): string | null => TEXT.habits[id] ?? null
