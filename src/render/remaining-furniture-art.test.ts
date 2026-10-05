import { FURNITURE_DEFS } from '../engine/furniture-defs'
import type { ItemId } from '../engine/types'
import { HOME_SPACE_ART } from './home-space-art'
import { FURNITURE_ART, FURNI_PALETTE, iconFromArt } from './furniture-art'
import { REMAINING_FURNITURE_ART, REMAINING_FURNITURE_DIRECTIONS, REMAINING_FIXTURE_DIRECTIONS } from './remaining-furniture-art'

it('기존에 만든 20종을 건드리지 않고 나머지 배치 가구를 모두 제공한다', () => {
  const expected=Object.keys(FURNITURE_DEFS).filter(id=>!HOME_SPACE_ART[id] && !id.startsWith('home') && !id.startsWith('spouse:'))
  expect(Object.keys(REMAINING_FURNITURE_ART).sort()).toEqual(expected.sort())
  for(const [id,a] of Object.entries(HOME_SPACE_ART)) expect(FURNITURE_ART[id]).toBe(a)
  for(const [id,a] of Object.entries(REMAINING_FURNITURE_ART)) {
    const def=FURNITURE_DEFS[id as ItemId]!
    expect([a.w,a.h]).toEqual([def.w,def.h])
    expect(FURNITURE_ART[id]).toBe(a)
    for(const row of iconFromArt(a)) expect(row).toHaveLength(8)
  }
})

it('남은 가구와 고정 가구는 모두 네 방향이며 도트 크기와 팔레트가 유효하다', () => {
  for(const collection of [REMAINING_FURNITURE_DIRECTIONS,REMAINING_FIXTURE_DIRECTIONS])
    for(const [id,views] of Object.entries(collection)) {
      expect(Object.keys(views).sort()).toEqual(['down','left','right','up'])
      for(const [facing,a] of Object.entries(views)) {
        expect(a.rows,`${id}/${facing}`).toHaveLength(a.h*16)
        for(const row of a.rows) {
          expect(row).toHaveLength(a.w*16)
          for(const c of row) if(c!=='.') expect(FURNI_PALETTE[c]).toBeDefined()
        }
        const side=facing==='left'||facing==='right'
        expect([a.w,a.h]).toEqual(side?[views.down.h,views.down.w]:[views.down.w,views.down.h])
      }
    }
})

it('물레와 베틀·책상·침대·요람의 뒷면은 앞면과 구분된다', () => {
  expect(REMAINING_FURNITURE_DIRECTIONS.wheel.up.rows).not.toEqual(REMAINING_FURNITURE_DIRECTIONS.wheel.down.rows)
  for(const id of ['loom','desk','bed','cradle','workbench','hearth'])
    expect(REMAINING_FIXTURE_DIRECTIONS[id].up.rows).not.toEqual(REMAINING_FIXTURE_DIRECTIONS[id].down.rows)
})
