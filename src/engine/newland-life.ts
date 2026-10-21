// 계획 18 남은 것 (사용자 결정 ⑥, 컨트롤러 2026-10-07): 새 터의 손님집·기억 정원·공동 마당·주민의 꿈터.
// 필사와 서로 조건이 아니다. 상태는 모두 flags(숫자)라 저장 정리가 따로 없다.
// - 손님집: 지은 다음 날부터 손님이 사흘 머문다(날 씨앗). 하루 한 번 이야기, 사흘째 이야기 뒤 고유 선물(손님마다 한 번), 떠나면 7일 뒤 다음 손님.
//   입주(2026-10-08): 선물을 남기고 다시 온 손님에게 빈 입주 주택을 내어 주면 그 집 문 옆에서 산다(settledGuests).
// - 기억 정원: 실제로 있었던 일만 날짜와 함께 (날짜가 없으면 "날짜 미상"). 표식은 정원 안에 최근 것부터 여덟이 저절로 선다(renderer).
// - 공동 마당: 하루 한 번 오후에 작은 모임 — 마음이 가까운 이웃(하트 3 이상) 중 그날 나온 이웃만 (game.ts gatherYard).
// - 주민의 꿈터: 페넬로피의 꿈을 들어야 건물 목록에 보인다. 문을 연 뒤 사흘이 지나면 어려움 하나를 함께 고르고, 고른 말이 남는다.
import type { GameState } from './game'
import type { ItemId, NeighborDef, Tile } from './types'
import type { GodFind } from './god-records'
import { addGift } from './items'
import { logGift } from './daybook'
import { NO_NOTEBOOK, noteGot } from './notebook'
import { moveInGift } from './collection-gifts'
import { areaOf, buildsOf, doneHomes, doorOf, standSpotOf, type Build } from './newland-build'
import { isOpenYard } from './newland-sites'
import { childHome, childStage, JOB_GIFTS, type AdultJob } from './child'
import { emptyHomeAt, emptyHomes, familyAt, homeWishes } from './gen-homes'
import { DREAM_JOB_NPCS } from './kid-work'
import { isWalkable, ROOMS } from './world'
/** 첫 마을에 방이 있는 이웃인가 (주택 희망 목록 — 방이 없는 신혼 가구만) */
export const roomOwner = (o: string): boolean => ROOMS.some((r) => r.owner === o)
import { DISHES, type DishId } from './cooking'

type Flags = Record<string, number>
type S = Pick<GameState, 'flags' | 'clock' | 'newland'>

// ── 손님집 ──

export const GUESTS = [
  { id: 'nelly', gift: 'willowBasket' },
  { id: 'morris', gift: 'starChart' },
  { id: 'ivy', gift: 'seedPouch' },
  // 2026-10-21 점검: 손님 셋이 다 이웃이 되면 손님집이 영영 비었다 — 손님 셋을 더 (선물은 있던 물건, 그림은 있던 옷차림으로)
  { id: 'ray', gift: 'shell' },
  { id: 'ada', gift: 'lantern' },
  { id: 'hugo', gift: 'fineThread' },
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

// ── 떠난 아이의 다니러 옴 (2026-10-12 사용자 결정 2): 다른 지역으로 떠난 아이가 가끔 손님집에 사흘 묵는다 ──
/** 다녀간 뒤 다시 오기까지 (사흘 머묾 포함, 대략 세 주에 한 번) */
export const KID_VISIT_GAP = 21
type KidS = S & Partial<Pick<GameState, 'child'>>
/** 떠난 아이가 지금 손님집에 묵고 있나 */
export function kidVisiting(s: KidS): boolean {
  const since = s.flags.kidVisitSince
  return !!since && s.clock.day - since < GUEST_STAY && !!s.child && childHome({ child: s.child, flags: s.flags }) === 'away'
}
/** 떠난 아이와 이야기 (하루 한 번): 몇째 날 이야기인지, 사흘째엔 가족 나들이 짐 — 그 아이 직업의 물건 (JOB_GIFTS) */
export function talkKidVisit<T extends KidS & Pick<GameState, 'inv'>>(s: T): { state: T; line: number; gift?: Partial<Record<ItemId, number>> } | null {
  if (!kidVisiting(s) || s.flags.kidVisitTalkDay === s.clock.day) return null
  const n = (s.flags.kidVisitTalks ?? 0) + 1
  let flags: Flags = { ...s.flags, kidVisitTalkDay: s.clock.day, kidVisitTalks: n }
  let inv = s.inv
  let gift: Partial<Record<ItemId, number>> | undefined
  if (n === GUEST_STAY && s.flags.kidVisitGiftDay !== s.flags.kidVisitSince) {
    gift = (s.child?.job && JOB_GIFTS[s.child.job]) || { bread: 2 }
    inv = addGift(inv, gift)
    flags = { ...flags, kidVisitGiftDay: s.flags.kidVisitSince! }
  }
  return { state: { ...s, flags, inv }, line: Math.min(n, GUEST_STAY) - 1, ...(gift ? { gift } : {}) }
}

/** 아침: 머문 지 사흘이 지난 손님은 떠나고, 빈 손님집에는 때가 되면 새 손님 (선물을 아직 남기지 않은 손님부터) */
/** 함께하지 않는 아이 가운데 지금 손님집에 묵고 있는 아이가 있나 (아침 장면 때문에 잠시 다른 아이가 앞에 선 날) */
export function siblingVisiting(s: Pick<GameState, 'clock'> & Partial<Pick<GameState, 'siblings'>>): boolean {
  return (s.siblings ?? []).some((k) => { const since = k.kidFlags?.kidVisitSince; return !!since && s.clock.day - since < GUEST_STAY })
}

export function guestHouseMorning<T extends S>(s: T): T {
  if (!doneOf(s, 'guest')) return s
  // 묵고 있는 아이가 잠시 뒤에 있으면 손님집은 그대로 (새 손님을 들이지 않는다)
  if (siblingVisiting(s as Partial<Pick<GameState, 'siblings'>> & S)) return s
  const day = s.clock.day
  const flags: Flags = { ...s.flags }
  if (flags.guestNow && day - (flags.guestSince ?? 0) >= GUEST_STAY) {
    flags.guestNow = 0
    flags.guestNext = day + GUEST_GAP
  }
  // 떠난 아이가 사흘 묵고 돌아갔으면 손님집은 다시 손님 차례를 기다린다
  if (flags.kidVisitSince && day - flags.kidVisitSince >= GUEST_STAY) {
    flags.kidVisitSince = 0
    flags.guestNext = Math.max(flags.guestNext ?? 0, day + GUEST_GAP)
  }
  // 빈 손님집에 떠난 아이가 다니러 온다 (손님 차례에 끼어서, 세 주에 한 번꼴) — 오는 날 아침 재회 편지(kidVisitLetter)
  const child = (s as KidS).child
  if (!flags.guestNow && !flags.kidVisitSince && day >= (flags.guestNext ?? 0) && child && childHome({ child, flags }) === 'away' && day >= (flags.kidVisitNext ?? 0)) {
    flags.kidVisitSince = day
    flags.kidVisitNext = day + KID_VISIT_GAP
    flags.kidVisitTalks = 0
    flags.kidVisits = (flags.kidVisits ?? 0) + 1
    flags.kidVisitLetter = day
    return { ...s, flags }
  }
  if (flags.kidVisitSince) return { ...s, flags }
  // 이웃이 된 손님(집이 남아 있는)은 다시 손님으로 오지 않는다 (모두 이웃이 되면 손님집은 빈다). 집이 걷힌 손님은 다시 손님으로 온다
  const living = new Set(settledGuests(s).map((x) => x.id))
  if (!flags.guestNow && day >= (flags.guestNext ?? 0) && GUESTS.some((g) => !living.has(g.id))) {
    const visitors = GUESTS.filter((g) => !living.has(g.id))
    const fresh = visitors.filter((g) => !flags[`guestGift:${g.id}`])
    const pool = fresh.length ? fresh : visitors
    // 가장 오래 안 온 손님부터 (온 날 guestSeen:<id>) — 날로 고르면 늘 같은 손님이 왔다 (2026-10-12 점검 2)
    const seen = (id: string) => flags[`guestSeen:${id}`] ?? -1
    const g = [...pool].sort((a, b) => seen(a.id) - seen(b.id))[0]
    flags.guestNow = GUESTS.indexOf(g as (typeof GUESTS)[number]) + 1
    flags[`guestSeen:${g.id}`] = day
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
  const state = { ...s, flags, inv }
  return { state: gift ? logGift(state, guest, { [gift]: 1 }) : state, guest, line: gifted ? 'again' : Math.min(talks, GUEST_STAY) - 1, ...(gift ? { gift } : {}) }
}

// ── 손님 입주 (2026-10-08, 다른 창 입주 도트 연결) ──
// 선물을 남기고 간 손님이 다시 머무는 동안, 비어 있는 입주 주택이 있으면 집을 내어 줄 수 있다.
// settled:<id> = 그 집 건물 번호(b<n>의 n), settledDay:<id> = 짐을 푼 날. 이웃이 된 손님은 다시 손님으로 오지 않는다.
// (2026-10-08 버그 고침: 방 칸 번호로 적어 두면 집을 걷고 새로 지은 집을 저절로 차지했다 — 건물 번호로, 집이 걷히면 다시 손님으로)

/** 이웃이 된 손님과 그 집 (집이 걷히면 목록에서 빠진다) */
export function settledGuests(s: Pick<GameState, 'flags' | 'newland'>): { id: GuestId; home: Build; day: number | null }[] {
  const out: { id: GuestId; home: Build; day: number | null }[] = []
  for (const g of GUESTS) {
    const v = s.flags[`settled:${g.id}`]
    if (!v) continue
    const home = doneHomes(s).find((b) => b.id === `b${v}`)
    if (home) out.push({ id: g.id, home, day: s.flags[`settledDay:${g.id}`] ?? null })
  }
  return out
}
/** 아직 아무도 살지 않는 완공된 입주 주택 */
export function freeHome(s: Pick<GameState, 'flags' | 'newland'>): Build | undefined {
  // 이웃이 된 손님·새 터로 옮긴 주민 가족이 사는 집은 뺀다 (gen-homes emptyHomes)
  // 주민이 설 칸이 막힌(미리 심은 나무 등) 집은 내어 주지 않는다 — 말을 걸 수 없게 되므로 (2026-10-08 버그 27-A)
  return emptyHomes(s).find((b) => {
    const st = standSpotOf(b)
    return b.slot !== undefined && !!st && isWalkable(st)
  })
}
/**
 * 집을 내어 줄 수 있는 손님: 지난번 머물 때 선물을 남기고 다시 온 손님(이번 머묾 전에 받은 선물 — 2026-10-08 버그 고침:
 * 첫 방문 사흘째 선물을 받자마자 입주가 됐다), 지금 사는 집이 없고, 빈집이 있을 때
 */
export function canInviteGuest(s: S): GuestId | null {
  const g = guestNow(s)
  const gift = g ? s.flags[`guestGift:${g}`] : undefined
  if (!g || gift === undefined || gift >= (s.flags.guestSince ?? 0) || settledGuests(s).some((x) => x.id === g) || !freeHome(s)) return null
  return g
}
export function inviteGuest(s: GameState): GameState {
  const g = canInviteGuest(s)
  const home = freeHome(s)
  if (!g || !home) return s
  const day = s.clock.day
  return moveInGift({ ...s, flags: { ...s.flags, [`settled:${g}`]: Number(home.id.slice(1)), [`settledDay:${g}`]: day, guestNow: 0, guestNext: day + GUEST_GAP } }, g)
}
/** 이웃이 된 손님이 서는 자리 (문 칸과 겹치지 않는 곁 칸 — standSpotOf) */
export function settledSpot(home: Build): Tile | null {
  return standSpotOf(home)
}
/** 이웃이 된 손님이 집 문 옆에 나와 있는 시간 (그림과 말 걸기가 같은 시간을 쓴다) */
export const SETTLED_FROM = 8 * 60
export const SETTLED_TO = 20 * 60
export function settledAt(s: Pick<GameState, 'flags' | 'newland'> & Partial<Pick<GameState, 'clock'>>, t: Tile): GuestId | null {
  // 보이지 않는 시간에는 빈 칸에 말이 걸리지 않는다 (2026-10-11 점검 8)
  if (s.clock && (s.clock.minute < SETTLED_FROM || s.clock.minute >= SETTLED_TO)) return null
  for (const x of settledGuests(s)) {
    const at = settledSpot(x.home)
    if (at && at.x === t.x && at.y === t.y) return x.id
  }
  return null
}
/** 이웃이 된 손님과 이야기: 날마다 다른 한 줄 (줄 수만큼 돈다) */
export function settledLine(s: Pick<GameState, 'clock'>, id: GuestId, lines: number): number {
  return lines > 0 ? (s.clock.day + GUESTS.findIndex((g) => g.id === id)) % lines : 0
}

// ── 자란 아이의 집 겸 일터 (계획 18 B18-7, 2026-10-08) ──
// 어른이 되어 마을에 남은 우리 아이(직업이 정해진)만 건물 목록에 보인다. 이사(독립)는 사건으로만 — 저절로 옮기지 않는다.
// 낮(9–17시)엔 문 옆에서 일하고, 하루 한 번 들르면 이야기 한 줄 — 요리사라면 오늘 만든 것 한 접시(요리 표 DISHES 재사용).

/** 일터를 지을 수 있는 아이의 직업 (어른·마을 안에 삶(집이나 공동주택)·직업 있음 — 다른 지역으로 떠난 아이는 빼고, 2026-10-12 결정 2) */
export function kidWorkJob(s: Pick<GameState, 'child' | 'clock'> & Partial<Pick<GameState, 'flags'>>): AdultJob | null {
  const c = s.child
  if (!c?.job || childHome({ child: c, flags: s.flags ?? {} }) === 'away') return null
  return childStage(c, s.clock.day) === 'adult' ? c.job : null
}
/** 요리사 아이가 날마다 돌아가며 싸 주는 것 */
export const KID_DISHES: readonly DishId[] = ['bread', 'beanDish', 'figPlate', 'herbBeanDish', 'honeyBread']
/** 아이가 서서 일하는 자리: 일터 문 앞 오른쪽 칸 */
export function kidWorkSpot(b: Build): Tile | null {
  return standSpotOf(b)
}
/** 일터에 들르기: 하루 한 번. 요리사면 그날의 한 접시. 오늘 이미 들렀거나 일터·아이가 없으면 null */
/** 일터 후속 (2026-10-08): 들른 횟수가 이만큼이면 그날 한 번 특별한 말 — 첫 단골, 일터가 자리 잡음 (기억 정원에 남는다) */
export const KID_WORK_MILESTONES = [3, 10] as const
export function visitKidWork<T extends S & Pick<GameState, 'inv' | 'child'>>(s: T): { state: T; dish?: ItemId; milestone?: number } | null {
  const job = kidWorkJob(s)
  // 함께하는 아이의 일터여야 한다 (주인 없는 옛 기록은 그 아이 몫) — 이웃 자녀·동생의 일터로 들르거나,
  // 아이를 바꿔 가며 한 채에서 하루 여러 번 접시를 받던 것을 막는다 (2026-10-18 감사 M-5)
  const mine = s.child ? `me:${s.child.born}` : null
  const own = buildsOf(s).some((b) => b.kind === 'kidWork' && b.state === 'done' && (b.owner === undefined || b.owner === mine))
  if (!job || !own || s.flags.kidWorkDay === s.clock.day) return null
  const visits = (s.flags.kidWorkVisits ?? 0) + 1
  const milestone = (KID_WORK_MILESTONES as readonly number[]).includes(visits) ? visits : undefined
  const flags = { ...s.flags, kidWorkDay: s.clock.day, kidWorkVisits: visits, ...(milestone ? { [`kidWorkMile:${milestone}`]: s.clock.day } : {}) }
  if (job !== 'cook') return { state: { ...s, flags }, ...(milestone ? { milestone } : {}) }
  const dish = DISHES[KID_DISHES[s.clock.day % KID_DISHES.length]].item
  return { state: { ...s, flags, inv: addGift(s.inv, { [dish]: 1 }) }, dish, ...(milestone ? { milestone } : {}) }
}

// ── 신약 키워드 계승 (계획 18 B18-6, 2026-10-08) ──
// godRecords(발견 기록)는 원본 그대로 두고 읽기만 한다. 공동 마당에서 돌아보고, 대표 사례 하나(사랑: 다툰 이웃에게 함께 쓰는 자리)를 고른다.
// 키워드를 못 만났어도 고를 수 있다(그 곁에 근거 구절이 보이지 않을 뿐). 결과는 대사·마음·기억에만 — 점수 없음.

/** 돌아보기: 키워드마다 몇 번 만났고 처음 어디서 만났는지 (처음 만난 날 순서) */
export function keywordRecall(finds: readonly GodFind[]): { keyword: string; n: number; first: GodFind }[] {
  const by = new Map<string, { keyword: string; n: number; first: GodFind }>()
  for (const f of finds) {
    const cur = by.get(f.keyword)
    if (!cur) by.set(f.keyword, { keyword: f.keyword, n: 1, first: f })
    else {
      cur.n++
      if (f.day < cur.first.day) cur.first = f
    }
  }
  return [...by.values()].sort((a, b) => a.first.day - b.first.day)
}
/** 다툰 두 이웃: 처음부터 마을에 사는 어른 이웃 중 앞의 둘 (늘 같은 두 사람) */
export function quarrelPair(neighbors: readonly NeighborDef[]): [string, string] | null {
  const ids = neighbors.filter((d) => d.id !== 'child' && !d.joinsAt && d.joinsAtBooks === undefined && !d.joinsWithFamily && !d.avatar).map((d) => d.id)
  return ids.length >= 2 ? [ids[0], ids[1]] : null
}
/** 마음이 오르는 몫 (하트 점수) */
export const MEND_GAIN = 5
export function canMendQuarrel(s: Pick<GameState, 'flags' | 'newland'>): boolean {
  return !!doneOf(s, 'courtyard') && !s.flags.loveCase
}
// 화해 동작은 game.ts의 mendQuarrelWith — 마음은 heartUp으로 (2026-10-11·12 점검: 직접 더하던 함수를 없앴다)

// ── 문 앞·마당 안에 서면 여는 창 ──

export type FacilityKind = 'guest' | 'memorial' | 'courtyard' | 'weaver' | 'gallery' | 'settled' | 'kidWork' | 'family' | 'emptyHome'
/** 이 칸에서 여는 시설 (완공된 것만): 문이 있는 건물은 문·문 앞, 열린 마당은 안쪽 칸 */
/** 이 칸(문·문 앞·서는 칸)의 완성된 집 겸 일터 건물 — 여러 채일 때 누른 그 건물 (2026-10-18 감사, Codex E-02) */
export function kidWorkBuildAt(s: Pick<GameState, 'newland'>, t: Tile): Build | null {
  for (const b of buildsOf(s)) {
    if (b.state !== 'done' || b.kind !== 'kidWork') continue
    const d = doorOf(b.kind, b.x, b.y, b.facing, b.size)
    const st = standSpotOf(b)
    if (d && ((d.door.x === t.x && d.door.y === t.y) || (d.front.x === t.x && d.front.y === t.y) || (st && st.x === t.x && st.y === t.y))) return b
  }
  return null
}

export function facilityAt(s: Pick<GameState, 'newland'>, t: Tile): FacilityKind | null {
  for (const b of buildsOf(s)) {
    if (b.state !== 'done') continue
    if (b.kind === 'guest' || b.kind === 'weaver' || b.kind === 'gallery' || b.kind === 'kidWork') {
      const d = doorOf(b.kind, b.x, b.y, b.facing, b.size)
      const st = standSpotOf(b)
      if (d && ((d.door.x === t.x && d.door.y === t.y) || (d.front.x === t.x && d.front.y === t.y) || (st && st.x === t.x && st.y === t.y))) return b.kind
    } else if (isOpenYard(b.kind) && areaOf(b.kind, b.x, b.y, b.size).some((a) => a.x === t.x && a.y === t.y)) return b.kind as 'memorial' | 'courtyard'
  }
  if (!('flags' in s)) return null
  const full = s as Pick<GameState, 'flags' | 'newland' | 'gen'> & Partial<Pick<GameState, 'clock'>>
  if (settledAt(full, t)) return 'settled'
  // 새 터로 옮긴 주민 가족 / 빈 입주 주택 앞 (주택 희망 목록) — 2026-10-08
  // 가족은 8–20시에만 문 옆에 선다 (아무도 없는 자리에서 말이 걸리지 않게)
  const m = full.clock?.minute
  if ((m === undefined || (m >= 8 * 60 && m < 20 * 60)) && familyAt(full, t)) return 'family'
  return emptyHomeAt(full, t) && homeWishes(full, roomOwner).length > 0 ? 'emptyHome' : null
}

// ── 기억 정원 ──

export interface Memory {
  /** 날짜 (모르면 null — 지어내지 않는다) */
  day: number | null
  kind: 'wedding' | 'childBorn' | 'feast' | 'yard' | 'farewell' | 'gen' | 'settle' | 'reconcile' | 'kidWork'
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
  if (s.flags.loveCase) out.push({ day: s.flags.loveCase, kind: 'reconcile' })
  for (const n of KID_WORK_MILESTONES) if (s.flags[`kidWorkMile:${n}`]) out.push({ day: s.flags[`kidWorkMile:${n}`], kind: 'kidWork', n })
  for (const g of GUESTS) if (s.flags[`settled:${g.id}`]) out.push({ day: s.flags[`settledDay:${g.id}`] ?? null, kind: 'settle', who: g.id })
  for (const l of s.gen?.log ?? []) if (l.kind === 'married' || l.kind === 'birth') out.push({ day: l.day, kind: 'gen', log: { kind: l.kind, who: l.who } })
  return out.sort((a, b) => (b.day ?? -1) - (a.day ?? -1))
}

/** 기억 정원 표식 거두기·세우기 (계획 18 §13): 기억 자체는 남고, 정원에 선 표식만 감춘다 — memoHide:<열쇠> */
export const memoryKey = (m: Memory): string => `${m.kind}:${m.day ?? 'x'}:${m.who ?? m.log?.who.join('+') ?? ''}`
export const markerShown = (s: Pick<GameState, 'flags'>, m: Memory): boolean => !s.flags[`memoHide:${memoryKey(m)}`]
export function toggleMarker<T extends Pick<GameState, 'flags'>>(s: T, m: Memory): T {
  const k = `memoHide:${memoryKey(m)}`
  const flags = { ...s.flags }
  if (flags[k]) delete flags[k]
  else flags[k] = 1
  return { ...s, flags }
}

// ── 주민의 꿈터 (페넬로피 · 틸리) ──
// 꿈마다: 꿈 이야기를 들은 날 dream:<npc>, 문 연 날·고른 방법·챙겨 준 날. 페넬로피는 예전 저장 열쇠 그대로(dreamOpen 등),
// 틸리(2026-10-08 추가)부터는 열쇠 뒤에 :<npc>를 붙인다.

export const DREAMER = 'penelope'
/** 꿈과 그 꿈의 건물 (주민의 꿈터: 직조인의 집 겸 일터 / 그림방 = 주민의 꿈 미술관) */
export const DREAMS = [
  { npc: 'penelope', build: 'weaver' },
  { npc: 'tilly', build: 'gallery' },
] as const satisfies readonly { npc: string; build: Build['kind'] }[]
export type DreamBuild = (typeof DREAMS)[number]['build']
/** 꿈 이야기를 들을 수 있는 마음 (하트 4) */
export const DREAM_HEARTS_POINTS = 40
/** 문을 연 뒤 어려움이 오는 날 */
export const DREAM_TROUBLE_AFTER = 3
/** 공방에서 짠 것을 챙겨 주는 간격 */
export const DREAM_GIFT_GAP = 7

/** 꿈의 저장 열쇠 (페넬로피는 예전 이름) */
export const dreamKey = (base: 'dreamOpen' | 'dreamPick' | 'dreamGiftDay', npc: string = DREAMER): string => (npc === DREAMER ? base : `${base}:${npc}`)
export const dreamOf = (npc: string) => DREAMS.find((d) => d.npc === npc)
export const dreamerOfBuild = (kind: string): string | undefined => DREAMS.find((d) => d.build === kind)?.npc
export const dreamHeard = (s: Pick<GameState, 'flags'>, npc: string = DREAMER): boolean => !!s.flags[`dream:${npc}`]
export function canHearDream(s: Pick<GameState, 'flags' | 'hearts'> & Partial<Pick<GameState, 'gen'>>, npc: string): boolean {
  // 따로 쓴 꿈(페넬로피·틸리) 말고도 일이 정해진 이웃은 모두 꿈터를 꿈꾼다 (2026-10-21 사용자) — 자리를 물려준 이웃은 빼고 (그 자리는 자녀가)
  if (!dreamOf(npc) && s.gen?.retired?.[npc]) return false
  return (!!dreamOf(npc) || DREAM_JOB_NPCS.includes(npc)) && !!s.flags.newlandGift && !dreamHeard(s, npc) && (s.hearts[npc] ?? 0) >= DREAM_HEARTS_POINTS
}
export function hearDream<T extends Pick<GameState, 'flags' | 'clock'>>(s: T, npc: string = DREAMER): T {
  return { ...s, flags: { ...s.flags, [`dream:${npc}`]: s.clock.day } }
}

export type DreamStage = 'open' | 'trouble' | 'after'
/** 꿈터에 들렀을 때: 처음이면 문 연 날을 적는다. 사흘 뒤엔 어려움(고를 때까지), 고른 뒤엔 그 말 */
export function visitDream<T extends S & Pick<GameState, 'inv'> & Partial<Pick<GameState, 'notebook'>>>(s: T, gives: Partial<Record<ItemId, number>>, npc: string = DREAMER): { state: T; stage: DreamStage; gift?: Partial<Record<ItemId, number>> } | null {
  const d = dreamOf(npc)
  if (!d || !doneOf(s, d.build)) return null
  const open = dreamKey('dreamOpen', npc)
  const picked = dreamKey('dreamPick', npc)
  const giftKey = dreamKey('dreamGiftDay', npc)
  let flags: Flags = { ...s.flags }
  if (!flags[open]) flags[open] = s.clock.day
  const stage: DreamStage = flags[picked] ? 'after' : s.clock.day - flags[open] >= DREAM_TROUBLE_AFTER ? 'trouble' : 'open'
  let inv = s.inv
  let gift: Partial<Record<ItemId, number>> | undefined
  if (stage === 'after' && s.clock.day - (flags[giftKey] ?? 0) >= DREAM_GIFT_GAP && Object.keys(gives).length) {
    gift = gives
    inv = addGift(inv, gives)
    flags = { ...flags, [giftKey]: s.clock.day }
  }
  const state = { ...s, flags, inv }
  const received = gift ? Object.entries(gift).filter(([, n]) => (n ?? 0) > 0).map(([id]) => id as ItemId) : []
  return { state: gift ? logGift({ ...state, notebook: noteGot(s.notebook ?? NO_NOTEBOOK, npc, received) }, npc, gift) : state, stage, ...(gift ? { gift } : {}) }
}
/** 어려움에 함께 고른 방법 (1 · 2) — 정답 없음, 한 번 */
export function pickDream<T extends Pick<GameState, 'flags'>>(s: T, pick: 1 | 2, npc: string = DREAMER): T {
  const k = dreamKey('dreamPick', npc)
  if (s.flags[k]) return s
  return { ...s, flags: { ...s.flags, [k]: pick } }
}
