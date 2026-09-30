// 여행 주사위 보드게임 (2026-09-30 사용자 요청): 이웃 마을에 가면 그 마을 둘레를 도는 주사위 판이 열린다.
// 스무 번 안에 한 바퀴를 돌면 끝. 칸마다 성경 조각(이웃을 찾아가지 않아도 지금 책의 다음 조각)·재료·능력치·이벤트·상자.
// 아이를 데려가면 능력치 칸에서 아이도 자란다. 얻은 것은 돌아올 때 한꺼번에 받는다 (여행은 도중에 저장되지 않는다).
import { RARE_ITEMS } from './fixtures'
import { STAT_IDS, type StatId } from './stats'
import type { ItemId } from './types'

export type Cell = 'start' | 'plain' | 'book' | 'item' | 'star' | 'event' | 'chest'

/** 판 둘레 24칸 (7×7 판의 가장자리, 왼쪽 위에서 시계 방향). 성경 칸은 네 군데 */
export const BOARD: readonly Cell[] = [
  'start', 'plain', 'book', 'item', 'plain', 'event', 'star',
  'plain', 'item', 'book', 'plain', 'chest', 'event',
  'plain', 'star', 'item', 'book', 'plain', 'event',
  'plain', 'item', 'book', 'star', 'chest',
]
export const TRIP_TURNS = 20

export type TripReward =
  | { kind: 'piece'; id: string }
  | { kind: 'stat'; who: 'me' | 'child'; stat: StatId; xp: number }
  | { kind: 'items'; items: Partial<Record<ItemId, number>> }
  | { kind: 'coins'; n: number }

export interface BoardState {
  pos: number
  turn: number
  done: boolean
  /** 한 바퀴를 다 돌았는가 (스무 번 안에) */
  lapped: boolean
  lastRoll: number | null
  rewards: TripReward[]
}

export const NEW_BOARD: BoardState = { pos: 0, turn: 0, done: false, lapped: false, lastRoll: null, rewards: [] }

/** 이벤트 칸의 일 (문구는 life-text.json tripBoard.events) */
export const TRIP_EVENTS: readonly { id: string; child?: boolean; rewards: TripReward[] }[] = [
  { id: 'sharedBread', rewards: [{ kind: 'items', items: { bread: 2 } }] },
  { id: 'lostCoin', rewards: [{ kind: 'coins', n: 8 }] },
  { id: 'helpCart', rewards: [{ kind: 'stat', who: 'me', stat: 'strength', xp: 10 }, { kind: 'coins', n: 5 }] },
  { id: 'storyteller', rewards: [{ kind: 'stat', who: 'me', stat: 'wit', xp: 8 }] },
  { id: 'sing', rewards: [{ kind: 'stat', who: 'me', stat: 'charm', xp: 8 }] },
  { id: 'shower', rewards: [{ kind: 'stat', who: 'me', stat: 'luck', xp: 4 }] },
  { id: 'kidFriends', child: true, rewards: [{ kind: 'stat', who: 'child', stat: 'charm', xp: 10 }] },
  { id: 'kidRace', child: true, rewards: [{ kind: 'stat', who: 'child', stat: 'strength', xp: 10 }] },
]

const ITEM_CELL: readonly ItemId[] = ['reed', 'olive', 'wool', 'fig', 'honey', 'herb', 'papyrus']

export interface Landing {
  cell: Cell
  /** 알림 한 줄의 열쇠 (tripBoard.say.*, 이벤트면 tripBoard.events.*) */
  say: string
  rewards: TripReward[]
}

/**
 * 주사위 한 번: 굴린 수만큼 가서 칸의 일을 한다. nextPiece는 지금 책의 다음 조각(이미 이번 여행에서 받은 것은 빼고)을 준다.
 * 판 끝(시작 칸)을 지나면 한 바퀴 — 끝. 스무 번째에도 끝
 */
export function playTurn(b: BoardState, roll: number, rnd: () => number, ctx: { withChild: boolean; nextPiece: (taken: string[]) => string | null }): { board: BoardState; landing: Landing } {
  const to = b.pos + roll
  const lapped = to >= BOARD.length
  const pos = lapped ? 0 : to
  const turn = b.turn + 1
  const cell = BOARD[pos]
  let landing: Landing
  if (lapped) landing = { cell: 'start', say: 'lap', rewards: [{ kind: 'coins', n: 10 }] }
  else landing = land(cell, rnd, ctx, b.rewards)
  const board: BoardState = { pos, turn, lastRoll: roll, lapped: b.lapped || lapped, done: lapped || turn >= TRIP_TURNS, rewards: [...b.rewards, ...landing.rewards] }
  return { board, landing }
}

function land(cell: Cell, rnd: () => number, ctx: { withChild: boolean; nextPiece: (taken: string[]) => string | null }, got: readonly TripReward[]): Landing {
  const pick = <T>(list: readonly T[]) => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))]
  switch (cell) {
    case 'book': {
      const taken = got.flatMap((r) => (r.kind === 'piece' ? [r.id] : []))
      const id = ctx.nextPiece(taken)
      // 지금 책의 다음 조각이 없으면(책을 고르지 않았거나 이 장을 다 모았으면) 읽은 만큼 지능이 오른다
      return id ? { cell, say: 'book', rewards: [{ kind: 'piece', id }] } : { cell, say: 'bookNone', rewards: [{ kind: 'stat', who: 'me', stat: 'wit', xp: 6 }] }
    }
    case 'item': {
      const item = pick(ITEM_CELL)
      return { cell, say: 'item', rewards: [{ kind: 'items', items: { [item]: 1 + Math.floor(rnd() * 2) } }] }
    }
    case 'star': {
      const rewards: TripReward[] = [{ kind: 'stat', who: 'me', stat: pick(STAT_IDS), xp: 8 }]
      if (ctx.withChild) rewards.push({ kind: 'stat', who: 'child', stat: pick(STAT_IDS), xp: 8 })
      return { cell, say: 'star', rewards }
    }
    case 'event': {
      const e = pick(TRIP_EVENTS.filter((x) => !x.child || ctx.withChild))
      return { cell, say: `event:${e.id}`, rewards: e.rewards }
    }
    case 'chest':
      return rnd() < 0.25
        ? { cell, say: 'chestRare', rewards: [{ kind: 'items', items: { [pick(RARE_ITEMS)]: 1 } }] }
        : { cell, say: 'chestCoins', rewards: [{ kind: 'coins', n: 10 + Math.floor(rnd() * 16) }] }
    default:
      return { cell, say: 'plain', rewards: [] }
  }
}

/** 주사위 1–6 */
export function rollDie(rnd: () => number): number {
  return 1 + Math.min(5, Math.floor(rnd() * 6))
}

// ── 여행 판: 작은 마을 한 바퀴 (2026-09-30 사용자 설계) ──
// 마을을 먼저 짓고, 그 마을을 한 바퀴 도는 두 칸 폭 판석 길 위에 보드 규칙을 얹는다.
// 구간마다 풍경이 다르다: 위 — 집 앞 골목(작은 집 둘, 가운데 입구 아치), 왼쪽 — 울타리와 꽃화단 길,
// 오른쪽 — 작은 장터 앞(좌판·나무), 아래 — 벤치와 나무로 마감한 광장 끝. 가운데는 좌우 대칭 정원과 분수.
// 범례(이 장소만): @ 판석 길 · c 돌바닥 · ^ 꽃화단 · ! 등불 기둥 · F 분수(2×2) · A 입구 아치 기둥
//   그 밖에는 마을과 같은 그림: . 풀 · T 나무 · B 벤치 · * 꽃 · m 좌판 · x 울타리 · R/# 집

export const TRIP_W = 16
export const TRIP_H = 36
/**
 * 판석 길은 두 칸 폭. 길 위의 자리는 2×2 칸 덩이의 왼쪽 위 칸으로 센다 (한 칸씩 나아간다).
 * 보드 칸은 이 덩이만 한 돌판, 돌판 사이에는 판석 길 한 칸
 */
const RING = { x0: 2, y0: 4, x1: 12, y1: 30 }

export interface TripHouse {
  id: string
  x0: number
  y0: number
  x1: number
  y1: number
  doorX: number
}
export interface TripLayout {
  /** 칸 글자 */
  map: string[]
  houses: TripHouse[]
}

/** 판석 길의 자리들 (2×2 덩이의 왼쪽 위 칸, 시계 방향, 왼쪽 위에서 시작) */
export const RING_TILES: readonly { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = []
  const { x0, y0, x1, y1 } = RING
  for (let x = x0; x <= x1; x++) out.push({ x, y: y0 })
  for (let y = y0 + 1; y <= y1; y++) out.push({ x: x1, y })
  for (let x = x1 - 1; x >= x0; x--) out.push({ x, y: y1 })
  for (let y = y1 - 1; y > y0; y--) out.push({ x: x0, y })
  return out
})()

/** 돌판 i가 놓인 판석 길의 자리 (고르게 띄워서) */
export function stoneRingIndex(i: number): number {
  return Math.round((i * RING_TILES.length) / BOARD.length) % RING_TILES.length
}
/** 돌판 i의 왼쪽 위 칸 (돌판은 2×2 칸) */
export function stoneTile(i: number): { x: number; y: number } {
  return RING_TILES[stoneRingIndex(i)]
}

const layoutCache = new Map<string, TripLayout>()
export function tripLayout(dest: 'harbor' | 'hillTown'): TripLayout {
  const hit = layoutCache.get(dest)
  if (hit) return hit
  const g = Array.from({ length: TRIP_H }, () => Array<string>(TRIP_W).fill('.'))
  const set = (x: number, y: number, c: string) => {
    if (y >= 0 && y < TRIP_H && x >= 0 && x < TRIP_W) g[y][x] = c
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  // 판석 길 띠: 바깥 x 2–13, y 4–31
  const bx0 = RING.x0
  const by0 = RING.y0
  const bx1 = RING.x1 + 1
  const by1 = RING.y1 + 1
  const cy = Math.floor((by0 + by1) / 2)
  // ── 위: 집 앞 골목 — 작은 집 둘, 가운데 입구 아치와 돌바닥 ──
  const houses: TripHouse[] = [
    { id: dest === 'harbor' ? 'tripA' : 'tripD', x0: 1, y0: 0, x1: 5, y1: 3, doorX: 3 },
    { id: dest === 'harbor' ? 'tripB' : 'tripE', x0: 10, y0: 0, x1: 14, y1: 3, doorX: 12 },
  ]
  for (const h of houses) {
    rect(h.x0, h.y0, h.x1, h.y1 - 2, 'R')
    rect(h.x0, h.y1 - 1, h.x1, h.y1, '#')
    set(h.doorX, h.y1, 'D')
  }
  rect(6, 0, 9, 0, 'T')
  set(6, 2, 'A')
  set(9, 2, 'A')
  rect(7, 1, 8, by0 - 1, 'c')
  // ── 판석 길 한 바퀴 ──
  for (const t of RING_TILES) rect(t.x, t.y, t.x + 1, t.y + 1, '@')
  // ── 왼쪽: 울타리와 꽃화단이 번갈아 (네 줄마다 같은 무늬) ──
  for (let y = by0 + 2; y <= by1 - 2; y++) {
    const k = (y - by0 - 2) % 4
    set(0, y, k === 3 ? '!' : 'x')
    set(1, y, k === 0 || k === 1 ? '^' : '.')
  }
  // ── 오른쪽: 작은 장터 앞 — 좌판과 나무가 번갈아 ──
  for (let y = by0 + 2; y <= by1 - 2; y++) {
    const k = (y - by0 - 2) % 5
    set(14, y, k === 0 ? 'm' : k === 2 ? 'T' : k === 4 ? '!' : '.')
    set(15, y, k === 1 || k === 3 ? 'T' : '.')
  }
  // ── 아래: 광장 끝 — 돌바닥, 벤치 둘, 나무, 낮은 울타리로 마감 ──
  rect(0, by1 + 1, TRIP_W - 1, TRIP_H - 2, 'c')
  set(4, by1 + 2, 'B')
  set(11, by1 + 2, 'B')
  for (const x of [1, 14]) set(x, by1 + 2, 'T')
  rect(0, TRIP_H - 1, TRIP_W - 1, TRIP_H - 1, 'x')
  for (const x of [6, 9]) set(x, TRIP_H - 1, 'T')
  // ── 가운데 정원 (x 4–11, y 6–29): 돌바닥 띠 → 잔디 → 꽃화단(좌우 대칭) → 분수 광장 ──
  const ix0 = bx0 + 2
  const iy0 = by0 + 2
  const ix1 = bx1 - 2
  const iy1 = by1 - 2
  rect(ix0, iy0, ix1, iy1, 'c')
  rect(ix0 + 1, iy0 + 1, ix1 - 1, iy1 - 1, '.')
  for (const yy of [iy0 + 3, iy1 - 4]) {
    rect(ix0 + 1, yy, ix0 + 2, yy + 1, '^')
    rect(ix1 - 2, yy, ix1 - 1, yy + 1, '^')
  }
  rect(7, iy0 + 1, 8, iy1 - 1, 'c')
  // 분수 광장: 분수(7–8)를 가운데 두고 좌우 두 칸씩 똑같이
  rect(5, cy - 2, 10, cy + 1, 'c')
  rect(7, cy - 1, 8, cy, 'F')
  for (const x of [5, 10]) {
    set(x, cy - 2, 'B')
    set(x, cy + 1, 'B')
  }
  for (const [x, y] of [[ix0 + 1, iy0 + 1], [ix1 - 1, iy0 + 1], [ix0 + 1, iy1 - 1], [ix1 - 1, iy1 - 1]]) set(x, y, 'T')
  for (const y of [iy0 + 7, iy1 - 7]) {
    set(ix0 + 1, y, '!')
    set(ix1 - 1, y, '!')
  }
  const layout = { map: g.map((r) => r.join('')), houses }
  layoutCache.set(dest, layout)
  return layout
}

/** 돌판 사이를 걸어가는 길: 지금 돌판에서 n칸 앞 돌판까지의 둘레 길 칸들 (한 바퀴를 넘으면 시작 돌판에서 멈춘다) */
export function walkPath(fromStone: number, roll: number): { x: number; y: number }[] {
  const from = stoneRingIndex(fromStone)
  const lapped = fromStone + roll >= BOARD.length
  const toStone = lapped ? 0 : fromStone + roll
  let to = stoneRingIndex(toStone)
  if (to <= from) to += RING_TILES.length
  const out: { x: number; y: number }[] = []
  for (let i = from + 1; i <= to; i++) out.push(RING_TILES[i % RING_TILES.length])
  return out
}
