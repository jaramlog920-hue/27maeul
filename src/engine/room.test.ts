import { placement, removal, solidTiles, FURNITURE_DEFS, footprint, type Furniture } from './room'
import { findPath } from './movement'
import { HOME_DOOR, PLACES } from './world'
import { LESSON_SPOT } from './stories'

describe('방 꾸미기', () => {
  it('깔개는 3×2, 식탁은 2×1', () => {
    expect(footprint({ item: 'rug', x: 4, y: 4 })).toHaveLength(6)
    expect(footprint({ item: 'table', x: 4, y: 4 })).toHaveLength(2)
    expect(FURNITURE_DEFS.table?.surface).toBe(true)
  })
  it('서는 자리·문·아이 자리에는 길을 막는 가구를 둘 수 없다', () => {
    expect(placement([], 'nightstand', PLACES.desk.stand!)).toBeNull()
    expect(placement([], 'nightstand', LESSON_SPOT)).toBeNull()
    expect(placement([], 'stool', HOME_DOOR)).toBeNull()
    // 깔개는 밟고 지나가므로 서는 자리 위에도 깔린다
    expect(placement([], 'rug', { x: 4, y: 4 })).not.toBeNull()
  })
  it('집 밖이나 벽에 걸치면 둘 수 없다', () => {
    expect(placement([], 'rug', { x: 8, y: 5 })).toBeNull()
    expect(placement([], 'table', { x: 12, y: 12 })).toBeNull()
  })
  it('길을 막아 버리는 자리는 거절한다', () => {
    // 문 바로 위 두 칸을 막으면 집 안으로 들어갈 수 없다
    const room: Furniture[] = [{ item: 'nightstand', x: 5, y: 6 }]
    expect(placement(room, 'nightstand', { x: 7, y: 6 })).not.toBeNull()
    const blocked = placement([{ item: 'table', x: 5, y: 6 }], 'stool', { x: 7, y: 6 })
    if (blocked) {
      const tiles = solidTiles([{ item: 'table', x: 5, y: 6 }, blocked])
      expect(findPath(HOME_DOOR, PLACES.bed.stand!, tiles)).not.toBeNull()
    }
  })
  it('탁자 한 칸에 작은 물건 하나, 탁자가 아니면 빈 바닥에', () => {
    const room: Furniture[] = [{ item: 'table', x: 6, y: 6 }]
    const a = placement(room, 'vase', { x: 6, y: 6 })!
    expect(a.on).toBe(true)
    expect(placement([...room, a], 'jar', { x: 6, y: 6 })).toBeNull()
    expect(placement([...room, a], 'jar', { x: 7, y: 6 })?.on).toBe(true)
    expect(placement([], 'jar', { x: 5, y: 5 })?.on).toBeUndefined()
  })
  it('치울 때 위에 올린 것이 먼저', () => {
    const room: Furniture[] = [{ item: 'rug', x: 5, y: 4 }, { item: 'table', x: 6, y: 5 }, { item: 'candle', x: 6, y: 5, on: true }]
    expect(removal(room, { x: 6, y: 5 })).toEqual([room[2]])
    expect(removal(room.slice(0, 2), { x: 6, y: 5 })).toEqual([room[1]])
    expect(removal(room.slice(0, 1), { x: 6, y: 5 })).toEqual([room[0]])
  })
})
