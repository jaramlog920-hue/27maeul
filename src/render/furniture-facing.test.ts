import { SPOUSE_FURNITURE } from '../engine/furniture-defs'
import { SPOUSE_ROOM_VIEWS } from './spouse-room-art'
import { HOME_SPACE_DIRECTIONS } from './home-space-directions'
// 가구 방향 그림과 엔진 크기·옛 방향이 맞는가 (계획 17 작업 2)
import { FACINGS, facingOf, FURNITURE, sizeOf } from '../engine/room'
import { FURNITURE_ART } from './furniture-art'
import { facingArt, hasFacingArt } from './furniture-facing'
import { HOME_SPACE_LEGACY_FACING } from './home-space-directions'
import { isCopyFurniture } from '../engine/copy-furniture'
import { copyFurnitureFacings } from '../engine/copy-furniture-views'

describe('가구 방향 그림', () => {
  it('놓을 수 있는 가구는 모두 네 방향 그림이 있고, 그림 크기 = 엔진 칸 크기', () => {
    for (const item of FURNITURE.filter(id => !id.startsWith('home') && !id.startsWith('spouse:'))) {
      expect(hasFacingArt(item)).toBe(!isCopyFurniture(item)||copyFurnitureFacings(item).length>1)
      for (const f of FACINGS) {
        const a = facingArt(item, f)!
        expect({ item, f, w: a.w, h: a.h }).toEqual({ item, f, ...sizeOf(item, f) })
      }
    }
  })
  it('엔진의 옛 방향 = 그림 원본의 옛 방향, 그 방향 그림 = 지금 그림', () => {
    for (const item of FURNITURE.filter(id => !id.startsWith('home') && !id.startsWith('spouse:'))) {
      expect({ item, f: facingOf({ item }) }).toEqual({ item, f: HOME_SPACE_LEGACY_FACING[item] ?? 'down' })
      expect(facingArt(item, facingOf({ item }))!.rows).toEqual(FURNITURE_ART[item].rows)
    }
  })
  it('방향 그림이 없는 것은 없다고 한다', () => {
    expect(hasFacingArt('bread')).toBe(false)
    expect(facingArt('bread', 'down')).toBeUndefined()
  })
})


it('첫 장 보상 작은 의자는 실제로 구분되는 네 방향 그림을 사용한다', () => {
  const views = FACINGS.map(f => facingArt('stool', f)!)
  expect(new Set(views.map(a => a.rows.join('\n'))).size).toBe(4)
  expect(facingArt('stool', 'down')!.rows).toEqual(FURNITURE_ART.stool.rows)
  for (const a of views) {
    expect(a.w).toBe(1)
    expect(a.h).toBe(1)
    expect(a.rows).toHaveLength(16)
    expect(a.rows.every(row => row.length === 16)).toBe(true)
  }
})


it('집 가구와 네 방향 원본이 있는 배우자 가구도 회전 연결에서 빠지지 않는다', () => {
  const directional = FURNITURE.filter(item => {
    if(isCopyFurniture(item))return copyFurnitureFacings(item).length>1
    const p = SPOUSE_FURNITURE[item]
    return !p || !!SPOUSE_ROOM_VIEWS[p.id] || !!HOME_SPACE_DIRECTIONS[p.id]
  })
  expect(directional.filter(item => !hasFacingArt(item))).toEqual([])
  for (const item of directional) {
    expect(hasFacingArt(item), item).toBe(true)
    for (const facing of FACINGS) expect(facingArt(item, facing)?.rows.length, `${item}/${facing}`).toBeGreaterThan(0)
  }
})
