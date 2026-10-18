// 아이 셋 (2026-10-13 사용자: 플레이어는 아이 셋까지 — 첫째부터 잠자리에서 "아이를 갖자고 얘기해 보기"를 눌러야 생기고,
// 막내가 어린이(돕는 아이)가 되면 다음 아이를 가질 수 있다. 셋 다 배움터·함께 보내는 시간·진로·편지를 할 수 있어야 한다).
// game.child = 지금 '함께하는 아이' (모든 아이 활동이 이 아이와), game.siblings = 나머지 아이들.
// 함께할 아이를 바꾸면 아이별 표식(kidFlags)과 옷장 모습(wardrobe)을 맞바꾼다. 아침에 생기는 일(자라기·돕기·진로·편지)은 아이마다.
import { childStage, newChild, type Child } from './child'
import { featureAccess } from './feature-rules'
import { safeHomeSpot, type GameState } from './game'
import { helperSpot } from './child'
import type { GameContent, Tile } from './types'
import { HOME_ENTRY } from './world'

/** 플레이어의 아이는 모두 셋까지 */
export const MAX_KIDS = 3

export const siblingsOf = (s: Pick<GameState, 'siblings'>): Child[] => s.siblings ?? []
/** 첫째부터 태어난 차례로 */
export const allKids = (s: Pick<GameState, 'child' | 'siblings'>): Child[] => (s.child ? [s.child, ...siblingsOf(s)] : [])

export type BabyBlock = 'married' | 'home' | 'full' | 'youngest' | 'waiting' | 'locked'

/** 아이마다 따로인 표식 (자라는 장면·돕기·배움터·심부름·편지·방문 등) — 아이 이름 정하기·아이 갖기 표식은 집안 것 */
export const isKidFlag = (key: string): boolean => /^(child(?!Naming)|kid|school|deskKid|babyCare|babySleepScene|lodging:playerChild)/.test(key)

/**
 * 함께하는 아이를 siblings[i]와 맞바꾼다 (아이별 표식·옷장 모습도 함께). 같은 i로 다시 부르면 원래대로 돌아온다
 */
export function swapKid(s: GameState, i: number): GameState {
  const list = siblingsOf(s)
  const incoming = list[i]
  if (!s.child || !incoming) return s
  const flags: Record<string, number> = {}
  const outFlags: Record<string, number> = {}
  for (const [k, v] of Object.entries(s.flags)) (isKidFlag(k) ? outFlags : flags)[k] = v
  Object.assign(flags, incoming.kidFlags ?? {})
  const looks = { ...(s.looks ?? {}) }
  const outLook = looks.child
  delete looks.child
  if (incoming.wardrobe) looks.child = incoming.wardrobe as never
  const { kidFlags: _f, wardrobe: _w, ...inKid } = incoming
  void _f
  void _w
  const outKid: Child = { ...s.child, kidFlags: outFlags, ...(outLook ? { wardrobe: outLook as unknown as Record<string, unknown> } : {}) }
  return { ...s, child: inKid, siblings: list.map((k, j) => (j === i ? outKid : k)), flags, looks }
}

/** 함께할 아이를 고른다 (태어난 날로) */
export function selectKid(s: GameState, born: number): GameState {
  const i = siblingsOf(s).findIndex((k) => k.born === born)
  return i < 0 ? s : swapKid(s, i)
}

/** 아이를 갖자고 얘기할 수 있는가 (못 하면 그 까닭) */
export function babyBlock(s: GameState): BabyBlock | null {
  if (featureAccess(s, 'childBirth') !== 'full') return 'locked'
  if (s.romance?.stage !== 'married') return 'married'
  // 아이는 아이방(집 2단계)이 있어야 온다
  if ((s.homeLevel ?? 0) < 2) return 'home'
  if (s.flags.babyWish) return 'waiting'
  if (!s.child) return null
  const kids = allKids(s)
  if (kids.length >= MAX_KIDS) return 'full'
  // 막내는 가장 늦게 태어난 아이 — 함께하는 아이를 바꾸면 목록 순서가 바뀌므로 순서로 고르지 않는다 (2026-10-18 감사 M-22)
  const youngest = kids.reduce((y, k) => (k.born > y.born ? k : y))
  const st = childStage(youngest, s.clock.day)
  if (st !== 'helper' && st !== 'adult') return 'youngest'
  return null
}

/** 아기를 기다리는 날 수 (2026-10-14 사용자: 자고 나면 바로 생기지 않게 — 나흘쯤 기다렸다가) */
export const PREGNANCY_DAYS = 4
/** 얘기했다 — 다음 날 아침 아기 소식(장면 pregnancy), 얘기한 날로부터 PREGNANCY_DAYS째 아침에 태어난다 */
export function askBaby(s: GameState): GameState {
  if (babyBlock(s)) return s
  return { ...s, flags: { ...s.flags, babyWish: s.clock.day } }
}

/** 아침: 얘기한 다음 날 아기 소식, PREGNANCY_DAYS째 아침에 아기가 태어난다 (이름은 정하는 창이 뜬다) */
export function siblingMorning(s: GameState, content: Pick<GameContent, 'neighbors'>): GameState {
  if (!s.flags.babyWish) return s
  // 기다리는 동안: 첫 아침에 아기 소식 한 번 (2026-10-14 사용자: 임신과 출산 장면)
  if (s.clock.day < s.flags.babyWish + PREGNANCY_DAYS) {
    if (s.flags.babyNews === s.flags.babyWish || allKids(s).length >= MAX_KIDS || s.romance?.stage !== 'married') return s
    return { ...s, flags: { ...s.flags, babyNews: s.flags.babyWish }, scenes: [...s.scenes, 'pregnancy'] }
  }
  const flags = { ...s.flags }
  delete flags.babyWish
  delete flags.babyNews
  // 얘기한 뒤 사정이 바뀌었으면(아이가 셋 등) 아무 일도 없다
  if (allKids(s).length >= MAX_KIDS || s.romance?.stage !== 'married') return { ...s, flags }
  const day = s.clock.day
  const spouse = content.neighbors.find((d) => d.id === s.romance.partner)
  // 첫째: 지금까지의 첫 아이와 같은 아침 (장면·이름 정하기)
  if (!s.child) return { ...s, child: newChild(day, s.stats, spouse?.stat), flags: { ...flags, childNaming: 1 }, scenes: [...s.scenes, 'childBorn'] }
  let baby = newChild(day + 7 * (siblingsOf(s).length + 1), s.stats, spouse?.stat)
  baby = { ...baby, born: day }
  // 형제끼리 같은 이름은 피한다
  const taken = new Set(allKids(s).map((k) => k.name))
  if (taken.has(baby.name)) baby = { ...baby, name: `${baby.name}${siblingsOf(s).length + 2}` }
  const siblings = [...siblingsOf(s), baby]
  return { ...s, siblings, flags: { ...flags, siblingNaming: siblings.length }, scenes: [...s.scenes, 'siblingBorn'] }
}

/** 이름 정하기 (siblingNaming = 몇 번째 동생인지, 1부터) */
export function nameSibling(s: GameState, name: string): GameState {
  const i = (s.flags.siblingNaming ?? 0) - 1
  const list = siblingsOf(s)
  if (i < 0 || !list[i]) return s
  const flags = { ...s.flags }
  delete flags.siblingNaming
  return { ...s, siblings: list.map((k, j) => (j === i ? { ...k, name: name.trim().slice(0, 8) || k.name } : k)), flags }
}

/** 동생이 지금 있는 칸: 아기는 요람, 걷는 아이는 집 안, 돕는 아이·어른은 첫째처럼 마을을 다닌다 (한 칸씩 비켜서) */
export function siblingTile(s: Pick<GameState, 'clock' | 'room'>, kid: Child, index: number): Tile {
  const st = childStage(kid, s.clock.day)
  const crib = s.room?.find((f) => f.item === 'homeCradle')
  const home = crib ? { x: crib.x, y: crib.y } : HOME_ENTRY
  if (st === 'baby') return home
  if (st === 'toddler') {
    const hour = Math.floor(s.clock.minute / 60)
    const near = { x: home.x + ((hour + index) % 3) - 1, y: home.y - ((hour + index) % 2) }
    return safeHomeSpot(near, s.room ?? [])
  }
  const at = helperSpot(s.clock.minute + 45 * (index + 1))
  return { x: at.x + index + 1, y: at.y }
}

/** 불러올 때: 둘까지, 모양이 맞는 아이만 */
export function sanitizeSiblings(raw: unknown, clean: (x: unknown) => Child | null): Child[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out = raw.map(clean).filter((k): k is Child => !!k).slice(0, MAX_KIDS - 1)
  return out.length ? out : undefined
}
