// 새 터: 두 번째 마을의 지도 (계획 20 작업 3). 지도는 코드로 짓는다 — 폭이 어긋나는 실수를 막기 위해 (첫 마을과 같은 방식).
// 범례는 world.ts와 같다: T 나무 · . 풀 · , 길 · S 돌벽 · D 문 · # 벽 · f 집 안 바닥 · E 문깔개 · d 책상 · s 선반 · * 꽃 · _ 빈 곳
// 새 글자 하나: > 왕래 표식 (밟을 수 있는 칸, 누르면 건너가는 창)
// world.ts의 tileAt/isWalkable/isIndoor가 새 터에 있을 때 이 파일의 칸 함수로 맡긴다.
import { BOOKS, type Tile } from './types'
import type { GameState } from './game'
import { currentMapId, type MapId } from './maps'
import {
  ARCHIVE, INTERIOR, INTERIOR_DESK, INTERIOR_ENTRY, INTERIOR_EXIT, INTERIOR_SHELF, NEWLAND_H, NEWLAND_PORTAL, NEWLAND_PORTAL_FRONT, NEWLAND_VISIBLE_H, PREVIEW_LAST_ROW, NEWLAND_W, VILLAGE_PORTAL, VILLAGE_PORTAL_FRONT,
} from './newland-config'

function build(): string[] {
  const g: string[][] = Array.from({ length: NEWLAND_H }, (_, y) => Array<string>(NEWLAND_W).fill(y < NEWLAND_VISIBLE_H ? '.' : '_'))
  const set = (x: number, y: number, c: string) => {
    g[y][x] = c
  }
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
  }
  // 가장자리 숲 (기존 T)
  rect(0, 0, NEWLAND_W - 1, 0, 'T')
  rect(0, NEWLAND_VISIBLE_H - 1, NEWLAND_W - 1, NEWLAND_VISIBLE_H - 1, 'T')
  rect(0, 0, 0, NEWLAND_VISIBLE_H - 1, 'T')
  rect(NEWLAND_W - 1, 0, NEWLAND_W - 1, NEWLAND_VISIBLE_H - 1, 'T')
  // 가로 길 두 줄 (왕래 표식에서 동쪽 끝까지) — 서고 문 앞 한 칸이 위에서 이어진다
  rect(1, 8, NEWLAND_W - 2, 9, ',')
  // 서고 바깥: 돌벽, 문은 아랫줄 가운데 (자산 footprint 4×3 — newland-config ARCHIVE)
  rect(ARCHIVE.x0, ARCHIVE.y0 + 1, ARCHIVE.x0 + ARCHIVE.w - 1, ARCHIVE.y0 + ARCHIVE.h, 'S')
  set(ARCHIVE.door.x, ARCHIVE.door.y, 'D')
  set(ARCHIVE.front.x, ARCHIVE.front.y, ',')
  // 서고 둘레 꽃 (걸을 수 있다)
  for (const [x, y] of [[17, 7], [22, 7], [16, 5], [23, 5]]) set(x, y, '*')
  // 바깥쪽 가장자리의 나무 몇 그루 (건축 가능 구역 밖)
  for (const [x, y] of [[2, 12], [3, 18], [2, 24], [37, 13], [36, 19], [37, 25]]) set(x, y, 'T')
  // 왕래 표식
  set(NEWLAND_PORTAL.x, NEWLAND_PORTAL.y, '>')
  // 서고 안 방: 벽 둘레, 바닥, 아랫벽 가운데 문깔개, 책상·책장 칸 (작업 5가 연결)
  rect(INTERIOR.x0, INTERIOR.y0, INTERIOR.x0 + INTERIOR.w - 1, INTERIOR.y0 + INTERIOR.h - 1, '#')
  rect(INTERIOR.x0 + 1, INTERIOR.y0 + 1, INTERIOR.x0 + INTERIOR.w - 2, INTERIOR.y0 + INTERIOR.h - 2, 'f')
  set(INTERIOR_EXIT.x, INTERIOR_EXIT.y, 'E')
  set(INTERIOR_DESK.tile.x, INTERIOR_DESK.tile.y, 'd')
  set(INTERIOR_SHELF.tile.x, INTERIOR_SHELF.tile.y, 's')
  return g.map((r) => r.join(''))
}

export const NEWLAND_MAP: readonly string[] = build()

/**
 * 땅이 드러나기 전에는 서고와 빈 땅 첫머리만 보이고, 그 아래 바깥 칸은 숲(T)으로 돌려준다 (계획 20 D8).
 * 드러난 뒤에는 칸을 그대로. 서고 안 방(보이지 않는 줄)과 가장자리 숲은 건드리지 않는다.
 */
export function newlandBounds(revealed: boolean, y: number, c: string): string {
  return !revealed && y > PREVIEW_LAST_ROW && y < NEWLAND_VISIBLE_H - 1 ? 'T' : c
}

/** 새 터의 바탕 한 칸 (지도 밖은 숲, 지은 것·깐 길은 아직 없는 모습). 땅이 드러나기 전에는 newlandBounds가 바깥을 가린다 */
export function newlandGroundAt(x: number, y: number): string {
  return newlandBounds(revealedOn, y, NEWLAND_MAP[y]?.[x] ?? 'T')
}

/**
 * 지은 것·깐 길이 덧씌우는 칸 ('x,y' → 글자, 계획 20 작업 6). 막히는 칸은 S, 걸을 수 있는 칸은 길(,)·풀(.).
 * 게임 상태와 맞추는 것은 syncHome이 한다 (newland-build.ts의 overlayFor)
 */
let overlay: ReadonlyMap<string, string> = new Map()
export function setNewlandOverlay(m: ReadonlyMap<string, string>): void {
  overlay = m
}

/** 새 터의 한 칸 — 바탕에 지은 것을 덧씌운 것. 땅이 드러나기 전에는 덧씌우지 않는다 */
export function newlandTileAt(x: number, y: number): string {
  const base = newlandGroundAt(x, y)
  return revealedOn && overlay.size > 0 ? (overlay.get(`${x},${y}`) ?? base) : base
}

/** 서고 문 → 서고 안, 서고 안 문깔개 → 서고 문 앞 (좌표 문자열 'x,y' → 칸) */
const WARPS: ReadonlyMap<string, Tile> = new Map<string, Tile>([
  [`${ARCHIVE.door.x},${ARCHIVE.door.y}`, { ...INTERIOR_ENTRY }],
  [`${INTERIOR_EXIT.x},${INTERIOR_EXIT.y}`, { ...ARCHIVE.front }],
])
export function newlandWarp(t: Tile): Tile | undefined {
  return WARPS.get(`${t.x},${t.y}`)
}

/** 서고 안 방 안인가 (벽 포함) — 카메라가 방 하나로 좁혀 보여 준다 */
export function inArchiveRoom(t: Tile): boolean {
  return t.x >= INTERIOR.x0 && t.x < INTERIOR.x0 + INTERIOR.w && t.y >= INTERIOR.y0 && t.y < INTERIOR.y0 + INTERIOR.h
}

// ── 왕래 표식 ──

let open = false
let revealedOn = true
/** 새 터가 열렸는가 — 게임 상태(flags.newlandGift)와 맞추는 것은 엔진 입구(game.ts의 syncHome)가 한다 */
export function setNewlandOpen(on: boolean): void {
  open = on
}
export function newlandOpen(): boolean {
  return open
}

/** 이 칸이 지금 지도의 왕래 표식이면 건너갈 곳. 첫 마을의 표식은 새 터가 열린 뒤에만 있다 */
export function portalAt(t: Tile): MapId | null {
  if (currentMapId() === 'newland') return t.x === NEWLAND_PORTAL.x && t.y === NEWLAND_PORTAL.y ? 'village' : null
  return open && t.x === VILLAGE_PORTAL.x && t.y === VILLAGE_PORTAL.y ? 'newland' : null
}

/** 그 지도의 입구 앞 칸 (건너오면 서는 곳이자, 잘못된 자리에서 시작하지 않게 돌려놓는 곳) */
export function entryFront(id: MapId): Tile {
  return id === 'newland' ? { ...NEWLAND_PORTAL_FRONT } : { ...VILLAGE_PORTAL_FRONT }
}

/** 땅이 드러났는가 — 게임 상태(flags.newlandRevealed)와 맞추는 것은 syncHome이 한다. 기본은 드러난 상태(칸 함수를 직접 읽는 곳을 위해) */
export function setNewlandRevealed(on: boolean): void {
  revealedOn = on
}
export function newlandRevealedOn(): boolean {
  return revealedOn
}

// ── 완필 보상과 첫 방문 (계획 20 작업 4) ──

/** locked 아직 · gift 조건이 맞았으나 아직 못 받음 · open 받았다 */
export type NewlandStatus = 'locked' | 'gift' | 'open'
type GiftBase = Pick<GameState, 'shelved' | 'flags'>

/** 개방 조건 (D7): 27권 모두 꽂힘 + 스물일곱 권 잔치가 지났다(allFeast 2) */
function conditionMet(s: GiftBase): boolean {
  return BOOKS.every((b) => s.shelved[b] !== undefined) && s.flags.allFeast === 2
}

export function newlandStatus(s: GiftBase): NewlandStatus {
  if (s.flags.newlandGift) return 'open'
  return conditionMet(s) ? 'gift' : 'locked'
}

/**
 * 보상을 한 번 받는다: 플래그 하나(newlandGift)와 장면 하나. 이미 받았거나 조건이 안 맞으면 false.
 * 잠자기(goToSleep)와 불러온 뒤 첫 기회(settle)가 같은 이 함수를 부른다 — 중복 방지는 플래그 하나다.
 * 받을 때 flags·scenes를 직접 고친다 (goToSleep은 만드는 중인 flags·scenes를 쓴다)
 */
export function claimNewland(shelved: GiftBase['shelved'], flags: Record<string, number>, scenes: string[]): boolean {
  if (newlandStatus({ shelved, flags }) !== 'gift') return false
  flags.newlandGift = 1
  scenes.push('newlandGift')
  return true
}

/** 상태 하나로 받는 꼴 (불러온 뒤 첫 기회) */
export function grantNewland<T extends Pick<GameState, 'shelved' | 'flags' | 'scenes'>>(s: T): T {
  const flags = { ...s.flags }
  const scenes = [...s.scenes]
  return claimNewland(s.shelved, flags, scenes) ? { ...s, flags, scenes } : s
}

/** 땅을 드러낸다 (첫 구약 절을 적었을 때 — 작업 5 — 또는 "땅 둘러보기"). 이미 드러났으면 그대로 */
export function revealNewland<T extends Pick<GameState, 'flags'>>(s: T): T {
  return s.flags.newlandRevealed ? s : { ...s, flags: { ...s.flags, newlandRevealed: 1 } }
}
export const newlandRevealed = (s: Pick<GameState, 'flags'>): boolean => !!s.flags.newlandRevealed
