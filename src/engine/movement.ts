// 격자 위 이동. 가중치가 없는 4방향 격자라 BFS가 최단 경로를 준다.
import { isWalkable, key, sameTile } from './world'
import type { Facing, Tile } from './types'

const DIRS: readonly Tile[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

/** from에서 to까지의 경로(시작 칸 제외, 도착 칸 포함). 갈 수 없으면 null, 이미 거기면 [] */
export function findPath(from: Tile, to: Tile, blockers: ReadonlySet<string> = new Set()): Tile[] | null {
  if (sameTile(from, to)) return []
  if (!isWalkable(to, blockers)) return null
  const prev = new Map<string, Tile | null>([[key(from), null]])
  const queue: Tile[] = [from]
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i]
    for (const d of DIRS) {
      const n = { x: cur.x + d.x, y: cur.y + d.y }
      const k = key(n)
      if (prev.has(k) || !isWalkable(n, blockers)) continue
      prev.set(k, cur)
      if (sameTile(n, to)) {
        const out: Tile[] = [n]
        let p = cur
        while (!sameTile(p, from)) {
          out.unshift(p)
          p = prev.get(key(p))!
        }
        return out
      }
      queue.push(n)
    }
  }
  return null
}

/** 목표 칸이 막혀 있으면(사람·물건) 그 옆 칸 중 가장 가까운 곳까지의 경로 */
export function pathToward(from: Tile, target: Tile, blockers: ReadonlySet<string> = new Set()): Tile[] | null {
  if (isWalkable(target, blockers)) return findPath(from, target, blockers)
  let best: Tile[] | null = null
  for (const d of DIRS) {
    const n = { x: target.x + d.x, y: target.y + d.y }
    if (!isWalkable(n, blockers)) continue
    const p = findPath(from, n, blockers)
    if (p && (!best || p.length < best.length)) best = p
  }
  return best
}

export interface Actor {
  x: number
  y: number
  path: Tile[]
  facing: Facing
  walkTime: number
}

/** 초당 칸 수 */
export const SPEED = 3.5

export function facingFor(dx: number, dy: number, fallback: Facing): Facing {
  if (dx === 0 && dy === 0) return fallback
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
}

/** 경로를 따라 dt초만큼 걷는다. 도착하면 arrived=true */
export function stepActor(a: Actor, dt: number): { actor: Actor; arrived: boolean } {
  if (a.path.length === 0) return { actor: a, arrived: false }
  let { x, y, facing } = a
  let path = a.path
  let budget = SPEED * dt
  while (budget > 0 && path.length) {
    const next = path[0]
    const dx = next.x - x
    const dy = next.y - y
    facing = facingFor(dx, dy, facing)
    const dist = Math.abs(dx) + Math.abs(dy)
    if (dist <= budget) {
      x = next.x
      y = next.y
      budget -= dist
      path = path.slice(1)
    } else {
      // 가로 먼저, 남으면 세로
      const mx = Math.sign(dx) * Math.min(Math.abs(dx), budget)
      x += mx
      budget -= Math.abs(mx)
      y += Math.sign(dy) * Math.min(Math.abs(dy), budget)
      budget = 0
    }
  }
  return { actor: { x, y, path, facing, walkTime: a.walkTime + dt }, arrived: path.length === 0 }
}
