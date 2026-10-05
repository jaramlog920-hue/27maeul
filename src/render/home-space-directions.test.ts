import { HOME_SPACE_ART } from './home-space-art'
import { HOME_SPACE_DIRECTIONS, HOME_SPACE_LEGACY_FACING, FURNITURE_FACINGS } from './home-space-directions'
import { FURNI_PALETTE } from './furniture-art'

it('20종 모두 네 방향 도트와 방향별 배치 크기가 있고 팔레트 밖 색이 없다', () => {
  expect(Object.keys(HOME_SPACE_DIRECTIONS)).toEqual(Object.keys(HOME_SPACE_ART))
  for (const [id, views] of Object.entries(HOME_SPACE_DIRECTIONS)) {
    expect(FURNITURE_FACINGS).toContain(HOME_SPACE_LEGACY_FACING[id])
    for (const facing of FURNITURE_FACINGS) {
      const art = views[facing]
      expect(art.rows).toHaveLength(art.h * 16)
      for (const row of art.rows) {
        expect(row).toHaveLength(art.w * 16)
        for (const c of row) if (c !== '.') expect(FURNI_PALETTE[c], `${id}/${facing}/${c}`).toBeDefined()
      }
      const legacy = HOME_SPACE_ART[id]
      const side = facing === 'left' || facing === 'right'
      expect([art.w,art.h]).toEqual(side ? [legacy.h,legacy.w] : [legacy.w,legacy.h])
    }
  }
})

it('세워진 가구의 뒷면은 앞면과 구분되고 의자 좌우는 정상적으로 거울상이다', () => {
  for (const id of ['chair','cupboard','longBench','daybed','bookcase','lectern','nightstand','chest'])
    expect(HOME_SPACE_DIRECTIONS[id].up.rows, id).not.toEqual(HOME_SPACE_DIRECTIONS[id].down.rows)
  const chair = HOME_SPACE_DIRECTIONS.chair
  expect(chair.left.rows).toEqual(chair.right.rows.map(row => [...row].reverse().join('')))
})
