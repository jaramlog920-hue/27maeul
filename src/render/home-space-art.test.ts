import { HOME_SPACE_ART, HOME_FIXTURE_ART } from './home-space-art'
import { FURNITURE_ART, FURNI_PALETTE, iconFromArt, ICON_CHAR } from './furniture-art'
import { FURNITURE_DEFS } from '../engine/furniture-defs'
import type { ItemId } from '../engine/types'

it('집 공간 도트가 기존 배치 크기·팔레트와 가방 아이콘 규격에 맞는다', () => {
  expect(Object.keys(HOME_SPACE_ART)).toHaveLength(20)
  for (const [id, art] of Object.entries(HOME_SPACE_ART)) {
    const def = FURNITURE_DEFS[id as ItemId]!
    expect(def, id).toBeDefined()
    expect([art.w, art.h], id).toEqual([def.w, def.h])
    expect(FURNITURE_ART[id]).toBe(art)
    expect(art.rows).toHaveLength(art.h * 16)
    for (const row of art.rows) {
      expect(row).toHaveLength(art.w * 16)
      for (const c of row) if (c !== '.') expect(FURNI_PALETTE[c], `${id}: ${c}`).toBeDefined()
    }
    const icon = iconFromArt(art)
    expect(icon).toHaveLength(8)
    for (const row of icon) {
      expect(row).toHaveLength(8)
      for (const c of row) if (c !== '.') expect(Object.values(ICON_CHAR)).toContain(c)
    }
  }
})

it('고정 탁자·벤치·빈 선반은 기존 한 칸 안에 맞고 진행 전 책이 생기지 않는다', () => {
  expect(Object.keys(HOME_FIXTURE_ART)).toEqual(['n', 'B', 's'])
  for (const art of Object.values(HOME_FIXTURE_ART)) {
    expect([art.w, art.h]).toEqual([1, 1])
    expect(art.rows).toHaveLength(16)
    for (const row of art.rows) {
      expect(row).toHaveLength(16)
      for (const c of row) if (c !== '.') expect(FURNI_PALETTE[c]).toBeDefined()
    }
  }
  expect(HOME_FIXTURE_ART.s.rows.join('')).toMatch(/^[.zkWwl]+$/)
})
