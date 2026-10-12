import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { deserialize, serialize } from '../engine/save'
import { HOUSES, tileAt } from '../engine/world'
import { grassTrails } from './ground-trails'

it('집이 생긴 옛 잔디의 누런 흔적은 지붕·벽·문에 그리지 않고 실제 풀밭에만 남긴다', () => {
  const base = newGame(CONTENT)
  const trails = { '42,19': 50, '43,22': 50, '43,24': 40, '37,3': 50, '42,17': 30, '42,18': 30, '12,11': 40, '13,11': 11 }
  const back = deserialize(serialize({ ...base, trails }), CONTENT)!
  expect(back.trails).toEqual(trails)
  expect(grassTrails(back.trails)).toEqual([{ x: 42, y: 17, n: 30 }, { x: 12, y: 11, n: 40 }])
  for (const h of HOUSES) for (let y = h.y0; y <= h.y1; y++) for (let x = h.x0; x <= h.x1; x++) {
    if (tileAt(x, y) !== '.') expect(grassTrails({ [`${x},${y}`]: 80 })).toEqual([])
  }
  expect(grassTrails({ 'bad': 50, '-1,0': 50 })).toEqual([])
})
