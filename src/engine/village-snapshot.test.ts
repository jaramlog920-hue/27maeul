// 첫 마을 칸 고정 (계획 20 작업 3): 두 맵 왕래를 넣기 전 지도 내용을 못 박는다. 이 테스트는 이후 한 줄도 바뀌지 않아야 한다.
// 집 단계 0–3 × 열린 서고 문 조합마다 tileAt·isWalkable·isIndoor 전체, 한 번의 zoneAt·treeKind 전체.
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { isIndoor, isWalkable, setHomeLevel, setOpenDoors, tileAt, treeKind, zoneAt } from './world'

const W = 48
const H = 120
const rows = (f: (x: number, y: number) => string): string[] => {
  const out: string[] = []
  for (let y = 0; y < H; y++) {
    let r = ''
    for (let x = 0; x < W; x++) r += f(x, y)
    out.push(r)
  }
  return out
}
const hash = (lines: string[]) => createHash('sha256').update(lines.join('\n')).digest('hex')

const DOOR_SETS: number[][] = [[], [0], [0, 1, 2, 3]]

describe('첫 마을 칸 스냅샷', () => {
  for (const level of [0, 1, 2, 3]) {
    for (const doors of DOOR_SETS) {
      it(`집 ${level}단계 · 열린 문 [${doors.join(',')}]`, () => {
        setHomeLevel(level)
        setOpenDoors(doors)
        try {
          expect(rows((x, y) => tileAt(x, y)).join('\n')).toMatchSnapshot('tiles')
          expect(hash(rows((x, y) => (isWalkable({ x, y }) ? '1' : '0')))).toMatchSnapshot('walkable')
          expect(hash(rows((x, y) => (isIndoor({ x, y }) ? '1' : '0')))).toMatchSnapshot('indoor')
        } finally {
          setHomeLevel(0)
          setOpenDoors([])
        }
      })
    }
  }

  it('구역과 나무 종류', () => {
    setHomeLevel(0)
    setOpenDoors([])
    expect(rows((x, y) => zoneAt({ x, y })?.id[0] ?? '.').join('\n')).toMatchSnapshot('zones')
    expect(rows((x, y) => (tileAt(x, y) === 'T' || tileAt(x, y) === 'o' ? { deciduous: 'd', fruit: 'f', evergreen: 'e' }[treeKind(x, y)] : '.')).join('\n')).toMatchSnapshot('trees')
  })

  it('칸 밖은 숲', () => {
    expect(tileAt(-1, 0)).toBe('T')
    expect(tileAt(0, H)).toBe('T')
    expect(tileAt(W, 0)).toBe('T')
  })
})
