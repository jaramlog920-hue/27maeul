// 막내 판정은 함께하는 아이와 상관없이 가장 늦게 태어난 아이로 (2026-10-18 감사 M-22)
import { CONTENT } from '../content/catalog'
import { legacyGame as newGame } from './growth-test-support'
import type { GameState } from './game'
import { babyBlock, swapKid } from './siblings'
import { freshStats } from './stats'

const kid = (name: string, born: number) => ({ name, look: 'girl' as const, born, stats: freshStats(), lean: null, close: 0 })

it('함께하는 아이를 둘째(아기)로 바꿔도 막내가 아직 어리면 다음 아기를 바랄 수 없다', () => {
  const b = newGame(CONTENT)
  const s: GameState = { ...b, clock: { ...b.clock, day: 300 }, homeLevel: 2, romance: { ...b.romance, stage: 'married', partner: 'wendell' }, child: kid('첫째', 200), siblings: [kid('둘째', 299)] }
  expect(babyBlock(s)).toBe('youngest')
  const swapped = swapKid(s, 0)
  expect(swapped.child?.name).toBe('둘째')
  expect(babyBlock(swapped)).toBe('youngest')
})
