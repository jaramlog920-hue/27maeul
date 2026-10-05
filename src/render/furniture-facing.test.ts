// 가구 방향 그림과 엔진 크기·옛 방향이 맞는가 (계획 17 작업 2)
import { FACINGS, facingOf, FURNITURE, sizeOf } from '../engine/room'
import { FURNITURE_ART } from './furniture-art'
import { facingArt, hasFacingArt } from './furniture-facing'
import { HOME_SPACE_LEGACY_FACING } from './home-space-directions'

describe('가구 방향 그림', () => {
  it('놓을 수 있는 가구는 모두 네 방향 그림이 있고, 그림 크기 = 엔진 칸 크기', () => {
    for (const item of FURNITURE.filter(id => !id.startsWith('home') && !id.startsWith('spouse:'))) {
      expect(hasFacingArt(item)).toBe(true)
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
