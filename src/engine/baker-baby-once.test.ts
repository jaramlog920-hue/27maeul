// 빵집 아이는 견습 중에도 은퇴 뒤에도 한 번만 그려진다 (2026-10-18 감사 L-62, Codex SOC-03)
import { CONTENT } from '../content/catalog'
import { BAKER_BABY_ID, newGenState } from './gen'
import { companionsOf } from './gen-looks'

it('견습 중 곁에 한 번, 이어받은 뒤에는 곁에 없다', () => {
  let g = newGenState(CONTENT, 1, 100)
  g = { ...g, heirs: { baker: { heir: BAKER_BABY_ID, since: 92 } } }
  expect(companionsOf(g, 'baker', 100).map((c) => c.person.id).filter((id) => id === BAKER_BABY_ID)).toHaveLength(1)
  const retired = { ...g, retired: { baker: { heir: BAKER_BABY_ID, day: 132 } } }
  expect(companionsOf(retired, 'baker', 132).map((c) => c.person.id)).not.toContain(BAKER_BABY_ID)
})
