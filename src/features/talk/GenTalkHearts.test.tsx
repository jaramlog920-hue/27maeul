// 후계자 주민의 결혼 준비를 도우면 마음은 이어받은 이웃 자리에 쌓인다 (2026-10-18 감사 L-49)
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGenState } from '../../engine/gen'
import { establishedGame } from '../../engine/growth-test-support'
import { useGame } from '../../store/game-store'
import { GenTalk } from './GenTalk'

vi.mock('../work/WorkDay', () => ({ applyLifeState: (game: unknown) => useGame.setState({ game: game as never }) }))
afterEach(cleanup)

it('준비 돕기 → 코스모·파피 자리의 마음이 오르고, 사람 id에는 쌓이지 않는다', () => {
  let s = establishedGame(CONTENT, 200)
  let g = newGenState(CONTENT, 5, 300)
  const person = (id: string, parent: string, look: 'm' | 'f') => ({ id, origin: 'born' as const, born: 100, stage: 'adult' as const, look, name: id, parents: [parent], spouse: null, household: null })
  g = {
    ...g,
    persons: { ...g.persons, 'g-0001': person('g-0001', 'cosmo', 'm'), 'g-0002': person('g-0002', 'poppy', 'f') },
    retired: { cosmo: { heir: 'g-0001', day: 250 }, poppy: { heir: 'g-0002', day: 250 } },
    relations: { 'g-0001|g-0002': { id: 'g-0001|g-0002', a: 'g-0001', b: 'g-0002', stage: 'preparing', since: 299, prep: { tasks: ['bread', 'oil'], done: [], wedding: 306 } } },
  } as never
  s = { ...s, clock: { day: 300, minute: 600 }, scenes: [], gen: g, inv: { ...s.inv, bread: 2 }, hearts: { cosmo: 10, poppy: 10 }, heartDay: undefined }
  useGame.setState({ game: s, modal: null })
  render(<GenTalk npc="g-0001" />)
  fireEvent.click(screen.getByRole('button', { name: '준비 돕기' }))
  const result = useGame.getState().game
  expect(result.hearts.cosmo).toBeGreaterThan(10)
  expect(result.hearts.poppy).toBeGreaterThan(10)
  expect(result.hearts['g-0001']).toBeUndefined()
  expect(result.hearts['g-0002']).toBeUndefined()
})
