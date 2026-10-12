// 집 안 벽 세우기·허물기 (2026-10-12 사용자: 넓힌 집에서 심즈처럼 방을 나누고 합친다)
// 지도 문자열은 고정이라 world.villageTileAt이 이 값을 덧씌운다 — 게임 상태(homeWalls)와 맞추는 것은 game.ts의 syncHome
// 이 파일은 칸 목록만 들고 있다 (판정은 game.ts — 지도·가구를 함께 봐야 하므로)

export interface HomeWalls {
  /** 바닥에 새로 세운 벽 ('x,y') */
  built: string[]
  /** 허문 방 사이 벽 ('x,y') — 바닥이 된다 */
  removed: string[]
}

export const NO_HOME_WALLS: HomeWalls = { built: [], removed: [] }
/** 벽 한 칸 세우는 값 (닢) */
export const WALL_BUILD_COINS = 8

let built: ReadonlySet<string> = new Set()
let removed: ReadonlySet<string> = new Set()

export function setHomeWalls(w: HomeWalls | undefined): void {
  built = new Set(w?.built ?? [])
  removed = new Set(w?.removed ?? [])
}

/** 이 칸을 덧씌울 글자 ('#' 세운 벽, 'f' 허문 벽) — 없으면 undefined */
export function homeWallOverride(x: number, y: number): '#' | 'f' | undefined {
  const k = `${x},${y}`
  if (built.has(k)) return '#'
  if (removed.has(k)) return 'f'
  return undefined
}

export function isRemovedWall(x: number, y: number): boolean {
  return removed.has(`${x},${y}`)
}

export function isBuiltWall(x: number, y: number): boolean {
  return built.has(`${x},${y}`)
}

/** 옛 저장·깨진 값 → 'x,y' 문자열만, 겹치지 않게 (세운 것과 허문 것이 같은 칸이면 둘 다 버린다) */
export function sanitizeHomeWalls(raw: unknown): HomeWalls | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Partial<HomeWalls>
  const ok = (v: unknown): v is string => typeof v === 'string' && /^\d+,\d+$/.test(v)
  const b = [...new Set(Array.isArray(o.built) ? o.built.filter(ok) : [])]
  const r = [...new Set(Array.isArray(o.removed) ? o.removed.filter(ok) : [])]
  const both = new Set(b.filter((k) => r.includes(k)))
  const out = { built: b.filter((k) => !both.has(k)), removed: r.filter((k) => !both.has(k)) }
  return out.built.length || out.removed.length ? out : undefined
}
