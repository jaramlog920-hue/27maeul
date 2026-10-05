// 가구 방향 돌리기 (계획 17 작업 2)
import { CONTENT } from '../content/catalog'
import { newGame, rotateFurniture, syncHome } from './game'
import { deserialize, serialize } from './save'
import { facingOf, footprint, placement, refitRoom, rotation, sizeOf, type Furniture } from './room'
import { HOME_RECT } from './world'

beforeEach(() => syncHome({ ...newGame(CONTENT), room: [] }))
const h = (x: number, y: number) => ({ x: x + HOME_RECT.x0 - 2, y: y + HOME_RECT.y0 - 2 })

describe('가구 방향', () => {
  it('방향이 없으면 옛 그림 쪽: 의자·나무 장난감은 오른쪽, 주전자는 왼쪽, 나머지는 앞', () => {
    expect(facingOf({ item: 'chair' })).toBe('right')
    expect(facingOf({ item: 'woodToy' })).toBe('right')
    expect(facingOf({ item: 'teapot' })).toBe('left')
    expect(facingOf({ item: 'table' })).toBe('down')
    expect(facingOf({ item: 'chair', facing: 'up' })).toBe('up')
  })
  it('옆을 보면 가로·세로가 바뀐다', () => {
    expect(sizeOf('table', 'down')).toEqual({ w: 2, h: 1 })
    expect(sizeOf('table', 'left')).toEqual({ w: 1, h: 2 })
    expect(sizeOf('rug', 'right')).toEqual({ w: 2, h: 3 })
    expect(footprint({ item: 'table', ...h(5, 5), facing: 'right' })).toEqual([h(5, 5), h(5, 6)])
  })
  it('돌리기는 앞 → 오른쪽 → 뒤 → 왼쪽 → 앞', () => {
    const stool: Furniture = { item: 'stool', ...h(5, 5) }
    const seen: string[] = []
    let room: Furniture[] = [stool]
    for (let i = 0; i < 4; i++) {
      const next = rotation(room, room[0])!
      seen.push(next.facing!)
      room = [next]
    }
    expect(seen).toEqual(['right', 'up', 'left', 'down'])
    expect(room[0]).toMatchObject({ x: stool.x, y: stool.y })
  })
  it('크기가 바뀌는 가구는 돌린 뒤에도 놓을 수 있을 때만 돌린다', () => {
    const ok = placement([], 'table', h(5, 5))!
    expect(rotation([ok], ok)).toMatchObject({ item: 'table', ...h(5, 5), facing: 'right' })
    // 아래가 벽이면 세로로 못 돌린다
    const edge = placement([], 'table', h(7, 6))!
    expect(edge).not.toBeNull()
    expect(rotation([edge], edge)).toBeNull()
    // 돌린 자리에 다른 가구가 있으면 못 돌린다
    const stool = placement([ok], 'stool', h(5, 6))!
    expect(stool).not.toBeNull()
    expect(rotation([ok, stool], ok)).toBeNull()
  })
  it('위에 물건을 올린 탁자는 돌리지 않는다, 올린 물건은 돌린다', () => {
    const table = placement([], 'table', h(5, 5))!
    const vase = placement([table], 'vase', h(5, 5))!
    expect(vase.on).toBe(true)
    expect(rotation([table, vase], table)).toBeNull()
    expect(rotation([table, vase], vase)).toMatchObject({ on: true, facing: 'right' })
  })
  it('돌린 탁자 위에는 세로 두 칸에 올릴 수 있다', () => {
    const flat = placement([], 'table', h(5, 5))!
    const table = rotation([flat], flat)!
    expect(placement([table], 'vase', h(5, 6))).toMatchObject({ on: true })
    expect(placement([table], 'vase', h(6, 5))?.on).toBeFalsy()
  })
  it('rotateFurniture: 못 돌리면 null, 돌리면 방 순서·가방은 그대로', () => {
    const table = placement([], 'table', h(5, 5))!
    const s = { ...newGame(CONTENT), room: [table], inv: { vase: 2 } }
    const next = rotateFurniture(s, s.room[0])!
    expect(next.room).toEqual([{ ...table, facing: 'right' }])
    expect(next.inv).toBe(s.inv)
    const edge = placement([], 'table', h(7, 6))!
    expect(rotateFurniture({ ...s, room: [edge] }, edge)).toBeNull()
  })
  it('집 모양 맞추기는 방향을 지킨다', () => {
    const table = { ...placement([], 'table', h(5, 5))!, facing: 'left' as const }
    expect(refitRoom([table], {}).room).toEqual([table])
  })
})

describe('가구 방향 저장', () => {
  const withRoom = (room: unknown[]) => {
    const s = newGame(CONTENT)
    return { ...s, flags: { ...s.flags, homeRoom: 1 }, room } as unknown as ReturnType<typeof newGame>
  }
  it('맞는 방향은 저장·불러오기 뒤에도 그대로', () => {
    const table = { ...placement([], 'table', h(5, 5))!, facing: 'right' as const }
    const back = deserialize(serialize(withRoom([table])), CONTENT)!
    expect(back.room).toEqual([table])
  })
  it('잘못된 방향 값은 버리고 가구는 남긴다', () => {
    const chair = { ...placement([], 'chair', h(5, 5))! }
    const back = deserialize(serialize(withRoom([{ ...chair, facing: 'sideways' }])), CONTENT)!
    expect(back.room).toEqual([chair])
    expect(facingOf(back.room[0])).toBe('right')
  })
  it('방향이 없는 옛 저장은 그대로 불러온다', () => {
    const table = placement([], 'table', h(5, 5))!
    const back = deserialize(serialize(withRoom([table])), CONTENT)!
    expect(back.room).toEqual([table])
    expect(back.room[0].facing).toBeUndefined()
  })
})
