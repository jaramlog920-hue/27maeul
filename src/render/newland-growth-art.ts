// 새 터 겉모습이 나아갈수록 달라진다 (2026-10-21 사용자가 시안 1·2·3을 골랐다).
// 1) 구약 서고 방을 하나 채울 때마다 서고 앞에 하나씩: 첫 방 우물 · 둘째 방 등불 기둥 둘 · 셋째 방 꽃 화분 · 마지막 방 지붕 깃발
// 2) 새 터에 사는 사람(가족·이웃이 된 손님·꿈터 주인)이 늘수록 큰길 양옆에 꽃과 작은 나무가 조금씩 (새 터 꾸미기 소재 그림 BG_ART)
// 3) 구약을 다 마치면 저녁마다 등불이 켜진다 (서고 앞 둘 + 큰길 끝 둘)
// 모두 걷는 길을 막지 않는 그림뿐이다 (칸을 막지 않는다). 서고 둘레(BUILD_KEEP_ARCHIVE)는 짓지 못하는 곳이라 건물과 겹치지 않는다
import type { GameState } from '../engine/game'
import { ARCHIVE, BUILD_KEEP_ARCHIVE, BUILD_KEEP_ROAD_ROWS } from '../engine/newland-config'
import { buildsOf, areaOf, tilesOf } from '../engine/newland-build'
import { familyHomes } from '../engine/gen-homes'
import { settledGuests } from '../engine/newland-life'
import { OT_ROOMS } from '../engine/ot-books'
import { otBookFinished } from '../engine/books'
import type { Tile } from '../engine/types'

export const GROWTH_PALETTE: Record<string, string> = { S: '#9b958a', s: '#c4bdb0', W: '#7a5a40', w: '#a98563', R: '#b0604a', r: '#cc7d62', B: '#6f9db3', b: '#8a6a4c', L: '#f6dc8a', l: '#4d4038', P: '#b8734f', p: '#d69a74', F: '#e38fa6', f: '#efd27a', G: '#6f9a5e', K: '#e9e2cf' }
export const WELL_ROWS = ['................', '...RRRRRRRRRR...', '..RrrrrrrrrrrR..', '.....W....W.....', '.....W....W.....', '.....W.bb.W.....', '.....W.bb.W.....', '....SSSSSSSS....', '...SssssssssS...', '...SBBBBBBBBS...', '...SssssssssS...', '...SSSSSSSSSS...', '...SsSsSsSsSS...', '...SSSSSSSSSS...', '................', '................']
export const LAMP_LIT_ROWS = ['......llll......', '.....lLLLLl.....', '.....lLLLLl.....', '.....lLLLLl.....', '......llll......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '.......WW.......', '......WWWW......', '.....SSSSSS.....', '................']
export const LAMP_ROWS = LAMP_LIT_ROWS.map((r) => r.replace(/L/g, 'K'))
export const POTS_ROWS = ['................', '................', '..F.F......f.f..', '.FGFGF....fGfGf.', '..GGG......GGG..', '...G........G...', '..PPPP.....PPPP.', '..pPPp.....pPPp.', '..PPPP.....PPPP.', '...PP.......PP..', '................', '................', '................', '................', '................', '................']
export const FLAG_ROWS = ['.W.......', '.WFFFFF..', '.WFFFF...', '.WFFF....', '.W.......', '.W.......', '.W.......', '.W.......']

export type GrowthKind = 'well' | 'lamp' | 'pots' | 'flag' | 'flower' | 'tree'
/** at = 앞뒤를 가르는 칸(그 칸 줄로 기록자와 앞뒤를 정한다), dx·dy = 칸 왼쪽 위에서 그림을 옮기는 픽셀 */
export interface GrowthProp { kind: GrowthKind; at: Tile; dx: number; dy: number; lit?: boolean }

/** 방(범위)마다 책을 다 마쳤나 — 그날 붙는 표식(otRoomScene)이 없는 옛 저장도 실제 읽은 장으로 본다. 진도가 바뀔 때만 다시 센다 */
const finishedCache = new WeakMap<object, boolean[]>()
function roomsDone(s: Pick<GameState, 'flags' | 'otProgress'>): boolean[] {
  const prog = s.otProgress
  let finished = prog ? finishedCache.get(prog) : undefined
  if (!finished) {
    finished = OT_ROOMS.map((r) => r.books.every((b) => otBookFinished(s, b)))
    if (prog) finishedCache.set(prog, finished)
  }
  return OT_ROOMS.map((r, i) => !!s.flags[`otRoomScene:${r.id}`] || finished[i])
}
/** 구약 서른아홉 권을 다 마쳤나 (네 방을 모두 채웠다) */
export const otAllDone = (s: Pick<GameState, 'flags' | 'otProgress'>) => roomsDone(s).every(Boolean)

/** 서고 앞 소품 자리 — 모두 서고 둘레(BUILD_KEEP_ARCHIVE) 안: 우물은 서고 왼쪽 아래, 화분은 오른쪽 아래, 등불은 문 앞 줄 양옆 */
const WELL_AT: Tile = { x: ARCHIVE.x0 - 1, y: ARCHIVE.door.y }
const POTS_AT: Tile = { x: ARCHIVE.x0 + ARCHIVE.w, y: ARCHIVE.door.y }
const LAMPS_AT: Tile[] = [{ x: ARCHIVE.door.x - 2, y: ARCHIVE.front.y }, { x: ARCHIVE.door.x + 2, y: ARCHIVE.front.y }]
/** 큰길 끝 등불 (구약을 다 마친 뒤) — 큰길 윗줄 바로 위 */
const ROAD_ABOVE = BUILD_KEEP_ROAD_ROWS[0] - 1
const ROAD_BELOW = BUILD_KEEP_ROAD_ROWS[BUILD_KEEP_ROAD_ROWS.length - 1] + 1
const ROAD_LAMPS: Tile[] = [{ x: 3, y: ROAD_ABOVE }, { x: 36, y: ROAD_ABOVE }]
/** 서고 둘레 칸 (길가 꽃·나무를 두지 않는다) */
const nearArchive = (t: Tile) => t.x >= BUILD_KEEP_ARCHIVE.x0 && t.x <= BUILD_KEEP_ARCHIVE.x1 && t.y >= BUILD_KEEP_ARCHIVE.y0 && t.y <= BUILD_KEEP_ARCHIVE.y1

/** 새 터에 사는 사람 수 (가족·이웃이 된 손님·이웃 꿈터) */
export function newlandResidents(s: GameState): number {
  return familyHomes(s).length + settledGuests(s).length + buildsOf(s).filter((b) => b.kind === 'kidWork' && b.state === 'done').length
}
/** 큰길 양옆에 꽃·나무가 설 수 있는 칸 — 길 위아래 한 줄씩, 정해진 차례로 흩어진다 (11과 36은 서로소라 겹치는 칸이 없다).
 *  서고 둘레·큰길 끝 등불 칸은 처음부터 뺀다. 짓거나 깐 칸은 그릴 때 건너뛴다 */
const ROADSIDE: Tile[] = Array.from({ length: 36 }, (_, i) => ({ x: 2 + ((i * 11) % 36), y: i % 2 === 0 ? ROAD_ABOVE : ROAD_BELOW }))
  .filter((t) => !nearArchive(t) && !ROAD_LAMPS.some((l) => l.x === t.x && l.y === t.y))
/** 길가에 많아야 몇 개 */
export const ROADSIDE_MAX = 18

/** 지금 새 터에 그릴 겉모습 소품 */
export function newlandGrowthProps(s: GameState, night: boolean): GrowthProp[] {
  const out: GrowthProp[] = []
  const rooms = roomsDone(s)
  const [law, history, poetry] = rooms
  const all = rooms.every(Boolean)
  const lit = night && all
  if (law) out.push({ kind: 'well', at: WELL_AT, dx: 0, dy: 0 })
  if (history) for (const at of LAMPS_AT) out.push({ kind: 'lamp', at, dx: 0, dy: 0, lit })
  if (poetry) out.push({ kind: 'pots', at: POTS_AT, dx: 2, dy: 4 })
  if (all) {
    // 지붕 양쪽 귀퉁이 (서고 그림 맨 윗줄)
    out.push({ kind: 'flag', at: { x: ARCHIVE.x0, y: ARCHIVE.y0 }, dx: 6, dy: 2 }, { kind: 'flag', at: { x: ARCHIVE.x0 + ARCHIVE.w - 1, y: ARCHIVE.y0 }, dx: 2, dy: 2 })
    for (const at of ROAD_LAMPS) out.push({ kind: 'lamp', at, dx: 0, dy: 0, lit })
  }
  // 사는 사람 하나에 길가 하나 (많아야 ROADSIDE_MAX)
  const used = new Set<string>([...buildsOf(s).flatMap((b) => areaOf(b.kind, b.x, b.y, b.size)), ...Object.keys(tilesOf(s)).map((k) => { const [x, y] = k.split(',').map(Number); return { x, y } })].map((t) => `${t.x},${t.y}`))
  const n = Math.min(ROADSIDE_MAX, newlandResidents(s))
  for (let i = 0, placed = 0; i < ROADSIDE.length && placed < n; i++) {
    const at = ROADSIDE[i]
    if (used.has(`${at.x},${at.y}`)) continue
    // 셋째마다 작은 나무 (새 터 꾸미기 소재와 같은 그림, 한 칸 안에 선다), 나머지는 꽃 무더기
    out.push({ kind: placed % 3 === 2 ? 'tree' : 'flower', at, dx: 0, dy: 0 })
    placed++
  }
  return out
}
