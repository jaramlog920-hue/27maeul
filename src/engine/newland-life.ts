// 계획 18 남은 것 (사용자 결정 ⑥, 컨트롤러 2026-10-07): 새 터의 손님집·기억 정원·공동 마당·주민의 꿈터.
// 필사와 서로 조건이 아니다. 상태는 모두 flags(숫자)라 저장 정리가 따로 없다.
// - 손님집: 지은 다음 날부터 손님이 사흘 머문다(날 씨앗). 하루 한 번 이야기, 사흘째 이야기 뒤 고유 선물(손님마다 한 번), 떠나면 7일 뒤 다음 손님.
//   입주(빈집 초대)는 손님 고유 도트·일과가 생긴 뒤로 미룬다 — 지금은 머물다 가는 손님.
// - 기억 정원: 실제로 있었던 일만 날짜와 함께 (날짜가 없으면 "날짜 미상"). 기념물 배치는 미룬다.
// - 공동 마당: 하루 한 번 오후에 작은 모임 — 마음이 가까운 이웃(하트 3 이상) 중 그날 나온 이웃만 (game.ts gatherYard).
// - 주민의 꿈터: 페넬로피의 꿈을 들어야 건물 목록에 보인다. 문을 연 뒤 사흘이 지나면 어려움 하나를 함께 고르고, 고른 말이 남는다.
import type { GameState } from './game'
import type { ItemId, Tile } from './types'
import { addGift } from './items'
import { areaOf, buildsOf, doorOf, type Build } from './newland-build'
import { isOpenYard } from './newland-sites'

type Flags = Record<string, number>
type S = Pick<GameState, 'flags' | 'clock' | 'newland'>

// ── 손님집 ──

export const GUESTS = [
  { id: 'nelly', gift: 'willowBasket' },
  { id: 'morris', gift: 'starChart' },
  { id: 'ivy', gift: 'seedPouch' },
] as const satisfies readonly { id: string; gift: ItemId }[]
export type GuestId = (typeof GUESTS)[number]['id']
export const GUEST_STAY = 3
export const GUEST_GAP = 7

const doneOf = (s: Pick<GameState, 'newland'>, kind: Build['kind']): Build | undefined => buildsOf(s).find((b) => b.kind === kind && b.state === 'done')

/** 지금 머무는 손님 (없으면 null) */
export function guestNow(s: Pick<GameState, 'flags' | 'clock'>): GuestId | null {
  const i = s.flags.guestNow ?? 0
  if (!i || !GUESTS[i - 1]) return null
  return s.clock.day - (s.flags.guestSince ?? 0) < GUEST_STAY ? GUESTS[i - 1].id : null
}

/** 아침: 머문 지 사흘이 지난 손님은 떠나고, 빈 손님집에는 때가 되면 새 손님 (선물을 아직 남기지 않은 손님부터) */
export function guestHouseMorning<T extends S>(s: T): T {
  if (!doneOf(s, 'guest')) return s
  const day = s.clock.day
  const flags: Flags = { ...s.flags }
  if (flags.guestNow && day - (flags.guestSince ?? 0) >= GUEST_STAY) {
    flags.guestNow = 0
    flags.guestNext = day + GUEST_GAP
  }
  if (!flags.guestNow && day >= (flags.guestNext ?? 0)) {
    const fresh = GUESTS.filter((g) => !flags[`guestGift:${g.id}`])
    const pool = fresh.length ? fresh : GUESTS
    const g = pool[(day * 7 + 3) % pool.length]
    flags.guestNow = GUESTS.indexOf(g as (typeof GUESTS)[number]) + 1
    flags.guestSince = day
    flags.guestTalks = 0
  }
  return { ...s, flags }
}

/** 손님과 이야기 (하루 한 번): 이야기 줄 번호, 처음이면 사흘째에 선물. 손님이 없거나 오늘 이미 했으면 null */
export function talkGuest<T extends S & Pick<GameState, 'inv'>>(s: T): { state: T; guest: GuestId; line: number | 'again'; gift?: ItemId } | null {
  const guest = guestNow(s)
  if (!guest || s.flags.guestTalkDay === s.clock.day) return null
  const def = GUESTS.find((g) => g.id === guest)!
  const talks = (s.flags.guestTalks ?? 0) + 1
  const gifted = !!s.flags[`guestGift:${guest}`]
  let flags: Flags = { ...s.flags, guestTalkDay: s.clock.day, guestTalks: talks }
  let inv = s.inv
  let gift: ItemId | undefined
  if (!gifted && talks >= GUEST_STAY) {
    gift = def.gift
    inv = addGift(inv, { [gift]: 1 })
    flags = { ...flags, [`guestGift:${guest}`]: s.clock.day }
  }
  return { state: { ...s, flags, inv }, guest, line: gifted ? 'again' : Math.min(talks, GUEST_STAY) - 1, ...(gift ? { gift } : {}) }
}

// ── 문 앞·마당 안에 서면 여는 창 ──

export type FacilityKind = 'guest' | 'memorial' | 'courtyard' | 'weaver'
/** 이 칸에서 여는 시설 (완공된 것만): 문이 있는 건물은 문·문 앞, 열린 마당은 안쪽 칸 */
export function facilityAt(s: Pick<GameState, 'newland'>, t: Tile): FacilityKind | null {
  for (const b of buildsOf(s)) {
    if (b.state !== 'done') continue
    if (b.kind === 'guest' || b.kind === 'weaver') {
      const d = doorOf(b.kind, b.x, b.y, b.facing)
      if (d && ((d.door.x === t.x && d.door.y === t.y) || (d.front.x === t.x && d.front.y === t.y))) return b.kind
    } else if (isOpenYard(b.kind) && areaOf(b.kind, b.x, b.y).some((a) => a.x === t.x && a.y === t.y)) return b.kind as 'memorial' | 'courtyard'
  }
  return null
}

// ── 기억 정원 ──

export interface Memory {
  /** 날짜 (모르면 null — 지어내지 않는다) */
  day: number | null
  kind: 'wedding' | 'childBorn' | 'feast' | 'yard' | 'farewell' | 'gen'
  /** 글에 넣을 사람(역할 이름·계보 id)이나 수 */
  who?: string
  n?: number
  /** gen 소식이면 그 기록 */
  log?: { kind: string; who: string[] }
}

/** 실제로 있었던 일만: 결혼 잔치·아이 출생·스물일곱 권 잔치·마당 모임·이사 편지·주민 결혼과 출생. 최근 것부터 */
export function memoriesOf(s: Pick<GameState, 'flags' | 'romance' | 'child' | 'farewells' | 'gen'>): Memory[] {
  const out: Memory[] = []
  const r = s.romance
  if (r?.stage === 'married' && r.partner) out.push({ day: r.marriedDay ?? null, kind: 'wedding', who: r.partner })
  if (s.child) out.push({ day: s.child.born, kind: 'childBorn' })
  if (s.flags.allFeast === 2) out.push({ day: s.flags.allFeastDay ?? null, kind: 'feast' })
  for (const [k, v] of Object.entries(s.flags)) {
    const m = /^yardMemo:(\d+)$/.exec(k)
    if (m) out.push({ day: Number(m[1]), kind: 'yard', n: v })
  }
  for (const f of s.farewells ?? []) out.push({ day: f.day, kind: 'farewell', who: f.npc })
  for (const l of s.gen?.log ?? []) if (l.kind === 'married' || l.kind === 'birth') out.push({ day: l.day, kind: 'gen', log: { kind: l.kind, who: l.who } })
  return out.sort((a, b) => (b.day ?? -1) - (a.day ?? -1))
}

// ── 주민의 꿈터 (페넬로피) ──

export const DREAMER = 'penelope'
/** 꿈 이야기를 들을 수 있는 마음 (하트 4) */
export const DREAM_HEARTS_POINTS = 40
/** 문을 연 뒤 어려움이 오는 날 */
export const DREAM_TROUBLE_AFTER = 3
/** 공방에서 짠 것을 챙겨 주는 간격 */
export const DREAM_GIFT_GAP = 7

export const dreamHeard = (s: Pick<GameState, 'flags'>): boolean => !!s.flags[`dream:${DREAMER}`]
export function canHearDream(s: Pick<GameState, 'flags' | 'hearts'>, npc: string): boolean {
  return npc === DREAMER && !!s.flags.newlandGift && !dreamHeard(s) && (s.hearts[npc] ?? 0) >= DREAM_HEARTS_POINTS
}
export function hearDream<T extends Pick<GameState, 'flags' | 'clock'>>(s: T): T {
  return { ...s, flags: { ...s.flags, [`dream:${DREAMER}`]: s.clock.day } }
}

export type DreamStage = 'open' | 'trouble' | 'after'
/** 공방에 들렀을 때: 처음이면 문 연 날을 적는다. 사흘 뒤엔 어려움(고를 때까지), 고른 뒤엔 그 말 */
export function visitDream<T extends S & Pick<GameState, 'inv'>>(s: T, gives: Partial<Record<ItemId, number>>): { state: T; stage: DreamStage; gift?: Partial<Record<ItemId, number>> } | null {
  if (!doneOf(s, 'weaver')) return null
  let flags: Flags = { ...s.flags }
  if (!flags.dreamOpen) flags.dreamOpen = s.clock.day
  const stage: DreamStage = flags.dreamPick ? 'after' : s.clock.day - flags.dreamOpen >= DREAM_TROUBLE_AFTER ? 'trouble' : 'open'
  let inv = s.inv
  let gift: Partial<Record<ItemId, number>> | undefined
  if (stage === 'after' && s.clock.day - (flags.dreamGiftDay ?? 0) >= DREAM_GIFT_GAP && Object.keys(gives).length) {
    gift = gives
    inv = addGift(inv, gives)
    flags = { ...flags, dreamGiftDay: s.clock.day }
  }
  return { state: { ...s, flags, inv }, stage, ...(gift ? { gift } : {}) }
}
/** 어려움에 함께 고른 방법 (1 천천히 한 줄씩 · 2 색을 두 가지만) — 정답 없음, 한 번 */
export function pickDream<T extends Pick<GameState, 'flags'>>(s: T, pick: 1 | 2): T {
  if (s.flags.dreamPick) return s
  return { ...s, flags: { ...s.flags, dreamPick: pick } }
}
