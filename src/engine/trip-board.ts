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

// ── 여행 판의 동네 (새 장면): 마을과 같은 16픽셀 칸, 같은 그림 ──
// 둘레 길(흙길 한 바퀴) 위에 돌판 24개를 1–2칸씩 띄워 놓는다 — 길 위의 이정표처럼.
// 가운데는 광장(분수 우물·좌판·벤치·나무)으로 비워 두고, 위쪽에 집 셋, 아래는 항구(물·잔교) 또는 언덕 숲

export const TRIP_W = 24
export const TRIP_H = 26
/** 둘레 길 (왼쪽 위 → 시계 방향) */
const RING = { x0: 4, y0: 7, x1: 19, y1: 21 }

export interface TripHouse {
  id: string
  x0: number
  y0: number
  x1: number
  y1: number
  doorX: number
}
export interface TripLayout {
  /** 칸 글자 (마을 지도와 같은 범례) */
  map: string[]
  houses: TripHouse[]
}

/** 둘레 길 칸들 (시계 방향, 왼쪽 위 모서리에서 시작) */
export const RING_TILES: readonly { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = []
  const { x0, y0, x1, y1 } = RING
  for (let x = x0; x <= x1; x++) out.push({ x, y: y0 })
  for (let y = y0 + 1; y <= y1; y++) out.push({ x: x1, y })
  for (let x = x1 - 1; x >= x0; x--) out.push({ x, y: y1 })
  for (let y = y1 - 1; y > y0; y--) out.push({ x: x0, y })
  return out
})()

/** 돌판 i가 놓인 둘레 길의 자리 (고르게 띄워서) */
export function stoneRingIndex(i: number): number {
  return Math.round((i * RING_TILES.length) / BOARD.length) % RING_TILES.length
}
export function stoneTile(i: number): { x: number; y: number } {
  return RING_TILES[stoneRingIndex(i)]
}

const layoutCache = new Map<string, TripLayout>()
/** 여행지의 동네: 항구 마을은 아래가 바다와 잔교, 언덕 너머 마을은 아래가 숲과 양 우리 */
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
  // 테두리 숲
  rect(0, 0, TRIP_W - 1, 0, 'T')
  rect(0, 0, 0, TRIP_H - 1, 'T')
  rect(TRIP_W - 1, 0, TRIP_W - 1, TRIP_H - 1, 'T')
  // 위쪽 집 셋 (보통 집 7×5, 가운데는 작은 집) — 문 아래 앞마당, 앞마당에서 둘레 길로
  const houses: TripHouse[] = [
    { id: dest === 'harbor' ? 'tripA' : 'tripD', x0: 2, y0: 1, x1: 8, y1: 5, doorX: 5 },
    { id: dest === 'harbor' ? 'tripB' : 'tripE', x0: 10, y0: 2, x1: 14, y1: 5, doorX: 12 },
    { id: dest === 'harbor' ? 'tripC' : 'tripF', x0: 16, y0: 1, x1: 22, y1: 5, doorX: 19 },
  ]
  for (const h of houses) {
    rect(h.x0, h.y0, h.x1, h.y1 - 2, 'R')
    rect(h.x0, h.y1 - 1, h.x1, h.y1, '#')
    set(h.doorX, h.y1, 'D')
    set(h.doorX, h.y1 + 1, ',')
    for (const x of [h.x0, h.x1]) set(x, h.y1 + 1, '*')
  }
  // 둘레 길 (흙길 한 바퀴)
  for (const t of RING_TILES) set(t.x, t.y, ',')
  // 가운데 광장: 분수 우물, 좌판 둘, 벤치 둘, 네 귀퉁이 나무, 꽃
  rect(RING.x0 + 3, RING.y0 + 3, RING.x1 - 3, RING.y1 - 3, ',')
  const cx = Math.floor((RING.x0 + RING.x1) / 2)
  const cy = Math.floor((RING.y0 + RING.y1) / 2)
  set(cx, cy, 'w')
  set(RING.x0 + 4, RING.y0 + 4, 'm')
  set(RING.x1 - 4, RING.y0 + 4, 'm')
  set(RING.x0 + 4, RING.y1 - 4, 'B')
  set(RING.x1 - 4, RING.y1 - 4, 'B')
  for (const [x, y] of [[RING.x0 + 2, RING.y0 + 2], [RING.x1 - 2, RING.y0 + 2], [RING.x0 + 2, RING.y1 - 2], [RING.x1 - 2, RING.y1 - 2]]) set(x, y, 'T')
  for (const [x, y] of [[RING.x0 + 2, cy], [RING.x1 - 2, cy], [cx, RING.y0 + 2], [cx + 1, RING.y1 - 2]]) set(x, y, '*')
  // 둘레 길 바깥 옆: 나무를 두 칸마다 (규칙적으로)
  for (let y = RING.y0 + 1; y < RING.y1; y += 3) {
    set(RING.x0 - 2, y, 'T')
    set(RING.x1 + 2, y, 'T')
  }
  // 아래쪽
  if (dest === 'harbor') {
    rect(1, RING.y1 + 2, TRIP_W - 2, TRIP_H - 1, '~')
    rect(1, RING.y1 + 1, TRIP_W - 2, RING.y1 + 1, ',')
    rect(cx, RING.y1 + 2, cx, TRIP_H - 2, '=')
    set(cx + 1, TRIP_H - 2, 'u')
    for (let x = 2; x <= 6; x++) set(x, RING.y1 + 2, 'r')
    for (let x = 17; x <= 21; x++) set(x, RING.y1 + 2, 'r')
  } else {
    rect(0, TRIP_H - 1, TRIP_W - 1, TRIP_H - 1, 'T')
    rect(2, RING.y1 + 2, 8, TRIP_H - 2, 'x')
    rect(3, RING.y1 + 3, 7, TRIP_H - 3, '.')
    rect(11, RING.y1 + 2, 17, TRIP_H - 3, 'y')
    for (let x = 19; x <= 22; x += 2) set(x, RING.y1 + 3, 'T')
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
