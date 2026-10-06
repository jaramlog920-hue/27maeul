// 계획 20 2부 작업 B: 이웃의 자유 시간 (D34·P4·P4-1).
// 하루는 일 시간(일과표의 일터 칸 — 그대로)과 자유 시간(갈 곳을 스스로 고름)으로 나뉜다.
// 자유 시간은 "아무 특별한 일과가 없는 평범한 쉬는 칸"만 대신한다: 약속·행사·이야기·근황·함께하는 일과·벗어나는 날은 그대로.
// 고르기는 저장된 씨앗 + 사람 id + 두 시간 칸으로 결정적(다시 접속해도 같다), 한 자리에는 한 사람.
import { genRng, type GenState } from './gen'
import { PARTNER_WORK, type CandidateId } from './romance'
import type { Routine } from './people'
import type { Tile } from './types'

/**
 * 쉬는 자리: 가로로 붙은 두 칸씩 (친한 둘이 나란히 서서 만날 수 있게).
 * 모두 풀밭·벤치 곁·넓은 광장 벤치 옆 — 길 위·문 칸·문 바로 앞이 아니고, 다른 자리와 위아래·대각선으로 붙지 않는다 (사용자 2026-10-07: 동선을 막지 않게)
 */
export const FREE_SPOTS: readonly (readonly [Tile, Tile])[] = [
  [{ x: 12, y: 11 }, { x: 13, y: 11 }], // 언덕 벤치 왼쪽
  [{ x: 3, y: 12 }, { x: 4, y: 12 }], // 빵집 뒤 풀밭
  [{ x: 32, y: 12 }, { x: 33, y: 12 }], // 배움터 뒤 풀밭
  [{ x: 21, y: 21 }, { x: 22, y: 21 }], // 광장 서쪽 벤치 곁
  [{ x: 27, y: 21 }, { x: 28, y: 21 }], // 광장 동쪽 벤치 곁
  [{ x: 22, y: 15 }, { x: 23, y: 15 }], // 우물가
  [{ x: 11, y: 19 }, { x: 12, y: 19 }], // 편지 집 뒤 풀밭
  [{ x: 33, y: 19 }, { x: 34, y: 19 }], // 베 짜는 집 뒤 풀밭
  [{ x: 16, y: 30 }, { x: 17, y: 30 }], // 정자 곁
  [{ x: 32, y: 29 }, { x: 33, y: 29 }], // 약방 곁 풀밭
  [{ x: 26, y: 13 }, { x: 27, y: 13 }], // 광장 위쪽
]

/** 자유 시간이 열리는 때 (그 밖에는 일과표 그대로) */
export const FREE_FROM = 8 * 60
export const FREE_TO = 20 * 60
/** 갈 곳을 다시 고르는 간격 (분) */
export const FREE_SLOT = 120

/** 쉬는 일 (일과의 doing) — 그 사람의 일이면(찻집의 파피·배달 길의 마일로) 쉬는 것이 아니다 */
const FREE_DOING = new Set(['rest', 'music', 'cat', 'wait', 'tea'])

/** 이 일과가 자유 시간으로 바꿔도 되는 평범한 쉬는 칸인가 (P4) */
export function isFreeRoutine(npc: string, r: Routine | null | undefined): boolean {
  if (!r || r.req || r.with || r.away || r.news) return false
  if (!r.doing || !FREE_DOING.has(r.doing)) return false
  return PARTNER_WORK[npc as CandidateId] !== r.doing
}

export const freeSlotOf = (minute: number): number => Math.floor(minute / FREE_SLOT)

let memo: { key: string; affinity: GenState['affinity']; spots: Record<string, Tile> } | null = null

/**
 * 이 두 시간 칸에 사람마다 갈 자리 (겹치지 않게). 사람은 씨앗으로 섞은 순서로 하나씩 고르고,
 * 이미 자리를 고른 친한 사람(호감도 30 이상) 곁의 자리를 조금 더 잘 고른다 — 가중 = 1 + min(1, 호감도/100).
 * 자리보다 사람이 많으면 남은 사람은 고르지 않는다 (일과표 그대로)
 */
export function freeSpotsFor(g: GenState, day: number, minute: number, ids: readonly string[]): Record<string, Tile> {
  const slot = freeSlotOf(minute)
  const key = `${g.seed}|${day}|${slot}|${ids.join(',')}`
  if (memo && memo.key === key && memo.affinity === g.affinity) return memo.spots
  const seats: (string | null)[][] = FREE_SPOTS.map(() => [null, null])
  const out: Record<string, Tile> = {}
  // 고르는 순서도 두 시간마다 섞는다 — 이름 순이면 늘 뒤 사람만 친구 덤을 받는다
  const order = [...ids].sort()
  const mix = genRng(g.seed, 'freeOrder', [], day * 24 + slot)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(mix() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (const id of order) {
    const rnd = genRng(g.seed, 'free', [id], day * 24 + slot)
    const weights = FREE_SPOTS.map((_, i) => {
      if (!seats[i].includes(null)) return 0
      let w = 1
      for (const other of seats[i]) {
        if (!other) continue
        const a = g.affinity[id < other ? `${id}|${other}` : `${other}|${id}`] ?? 0
        // 친구 곁 덤은 많아야 1 (다른 자리의 두 배까지) — 친한 쌍만 계속 만나 굳어지지 않게 (사용자 2026-10-07)
        if (a >= 30) w += Math.min(1, a / 100)
      }
      return w
    })
    const total = weights.reduce((a, b) => a + b, 0)
    if (total <= 0) break
    let r = rnd() * total
    let pick = weights.findIndex((w) => (r -= w) < 0)
    if (pick < 0) pick = weights.findIndex((w) => w > 0)
    const seat = seats[pick].indexOf(null)
    seats[pick][seat] = id
    out[id] = FREE_SPOTS[pick][seat]
  }
  memo = { key, affinity: g.affinity, spots: out }
  return out
}

/** 지금 자유 시간을 쓸 수 있나: 자율 생활이 켜져 있고, 맑은 날, 낮 */
export function freeTimeOpen(g: GenState | undefined, minute: number, wet: boolean): g is GenState {
  return !!g?.on && !wet && minute >= FREE_FROM && minute < FREE_TO
}
