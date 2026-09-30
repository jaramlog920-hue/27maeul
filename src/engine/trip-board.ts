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

// ── 축제 정원 (여행 판 전용 장소, 2026-09-30 사용자 설계) ──
// 마을 지도를 옮겨 쓰지 않는다: 세로로 긴 정원(휴대폰 세로 화면에 맞춤) 둘레를 모서리가 둥근 판석 길이 한 바퀴 돈다.
// 보드 칸은 그 판석 길의 일부(문양을 새긴 큰 돌판). 가운데는 잔디 정원과 꽃밭, 한가운데 분수(항구) 또는 큰 나무(언덕).
// 바깥 둘레는 생울타리, 같은 간격의 축제 등불, 맨 위 깃발 아치. 아래는 물가(항구) 또는 풀밭(언덕).
// 범례(이 장소만): @ 판석 길 · c 돌바닥 · & 생울타리 · ^ 꽃밭 · ! 등불 기둥 · F 분수(2×2) · O 큰 나무(2×2) · A 입구 아치 기둥
//   그 밖에는 마을과 같은 그림: . 풀 · T 나무 · B 벤치 · * 꽃 · ~ 물 · = 잔교 · u 배 · x 울타리 · r 갈대

export const TRIP_W = 16
export const TRIP_H = 34
/**
 * 판석 길은 두 칸 폭. 길 위의 자리는 2×2 칸 덩이의 왼쪽 위 칸으로 센다 (한 칸씩 나아간다).
 * 보드 칸은 이 덩이만 한 큼직한 돌판(2×2 칸), 돌판 사이에는 판석 길 한 칸
 */
const RING = { x0: 1, y0: 4, x1: 13, y1: 28 }

export interface TripLayout {
  /** 칸 글자 */
  map: string[]
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
  // 판석 길 띠 (2×2 덩이를 모두 칠한다): 바깥 x 1–14, y 4–29
  const x0 = RING.x0
  const y0 = RING.y0
  const x1 = RING.x1 + 1
  const y1 = RING.y1 + 1
  const cx = (x0 + x1) / 2
  const cy = Math.floor((y0 + y1) / 2)
  // 맨 위: 숲 한 줄, 입구 아치(기둥 둘, 깃발은 그림), 아치에서 판석 길로 들어오는 돌바닥
  rect(0, 0, TRIP_W - 1, 1, 'T')
  set(Math.floor(cx) - 1, 2, 'A')
  set(Math.ceil(cx) + 1, 2, 'A')
  rect(Math.floor(cx), 2, Math.ceil(cx), y0 - 1, 'c')
  // 바깥 생울타리 (정원을 감싼다), 입구만 트고
  for (let y = 2; y <= y1 + 1; y++) {
    set(0, y, '&')
    set(TRIP_W - 1, y, '&')
  }
  for (let x = 1; x < TRIP_W - 1; x++) if (g[3][x] === '.') set(x, 3, '&')
  for (const t of RING_TILES) rect(t.x, t.y, t.x + 1, t.y + 1, '@')
  // 안쪽 정원 (x 3–12, y 6–27): 돌바닥 띠 → 잔디 → 꽃밭(좌우 대칭) → 한가운데 분수 또는 큰 나무
  const ix0 = x0 + 2
  const iy0 = y0 + 2
  const ix1 = x1 - 2
  const iy1 = y1 - 2
  rect(ix0, iy0, ix1, iy1, 'c')
  rect(ix0 + 1, iy0 + 1, ix1 - 1, iy1 - 1, '.')
  for (const yy of [iy0 + 3, iy1 - 4]) {
    rect(ix0 + 2, yy, ix0 + 3, yy + 1, '^')
    rect(ix1 - 3, yy, ix1 - 2, yy + 1, '^')
  }
  // 가운데 세로 산책길, 한가운데 분수(항구) 또는 큰 나무(언덕)
  rect(Math.floor(cx), iy0 + 1, Math.ceil(cx), iy1 - 1, 'c')
  rect(Math.floor(cx) - 2, cy - 2, Math.ceil(cx) + 1, cy + 1, 'c')
  rect(Math.floor(cx), cy - 1, Math.ceil(cx), cy, dest === 'harbor' ? 'F' : 'O')
  // 등불 기둥: 정원 가장자리에 다섯 줄마다 좌우 대칭
  for (let y = iy0 + 2; y < iy1; y += 5) {
    set(ix0 + 1, y, '!')
    set(ix1 - 1, y, '!')
  }
  // 벤치 넷 (분수·나무를 바라보게), 나무 넷 (정원 네 귀퉁이)
  for (const yy of [cy - 3, cy + 2]) {
    set(ix0 + 2, yy, 'B')
    set(ix1 - 2, yy, 'B')
  }
  for (const [x, y] of [[ix0 + 1, iy0 + 1], [ix1 - 1, iy0 + 1], [ix0 + 1, iy1 - 1], [ix1 - 1, iy1 - 1]]) set(x, y, 'T')
  // 아래 (y 30–33): 항구는 물가와 잔교, 언덕은 풀밭과 양 울타리
  if (dest === 'harbor') {
    rect(0, y1 + 2, TRIP_W - 1, TRIP_H - 1, '~')
    rect(1, y1 + 2, 4, y1 + 2, 'r')
    rect(11, y1 + 2, 14, y1 + 2, 'r')
    rect(Math.floor(cx), y1 + 1, Math.floor(cx), y1 + 1, 'c')
    rect(Math.floor(cx), y1 + 2, Math.floor(cx), TRIP_H - 1, '=')
    set(Math.floor(cx) + 1, TRIP_H - 1, 'u')
  } else {
    rect(0, TRIP_H - 1, TRIP_W - 1, TRIP_H - 1, 'T')
    rect(2, y1 + 1, 6, TRIP_H - 2, 'x')
    rect(3, y1 + 2, 5, TRIP_H - 3, '.')
    for (const x of [9, 11, 13]) set(x, y1 + 2, 'T')
  }
  const layout = { map: g.map((r) => r.join('')) }
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
