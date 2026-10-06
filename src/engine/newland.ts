// 새 터: 두 번째 마을의 지도 (계획 20 작업 3). 지도는 코드로 짓는다 — 폭이 어긋나는 실수를 막기 위해 (첫 마을과 같은 방식).
// 범례는 world.ts와 같다: T 나무 · . 풀 · , 길 · S 돌벽 · D 문 · # 벽 · f 집 안 바닥 · E 문깔개 · d 책상 · s 선반 · * 꽃 · _ 빈 곳
// 새 글자 하나: > 왕래 표식 (밟을 수 있는 칸, 누르면 건너가는 창)
// world.ts의 tileAt/isWalkable/isIndoor가 새 터에 있을 때 이 파일의 칸 함수로 맡긴다.
import type { Tile } from './types'
import { currentMapId, type MapId } from './maps'
import {
  ARCHIVE, INTERIOR, INTERIOR_DESK, INTERIOR_ENTRY, INTERIOR_EXIT, INTERIOR_SHELF, NEWLAND_H, NEWLAND_PORTAL, NEWLAND_PORTAL_FRONT, NEWLAND_VISIBLE_H, NEWLAND_W, VILLAGE_PORTAL, VILLAGE_PORTAL_FRONT,
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

/** 새 터의 한 칸 (지도 밖은 숲) */
export function newlandTileAt(x: number, y: number): string {
  return NEWLAND_MAP[y]?.[x] ?? 'T'
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
