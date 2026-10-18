// 여러 아이의 집 겸 일터: 누른 일터의 주인 이름을 보이고, 들르기는 함께하는 아이 자기 일터에서만 (2026-10-18 감사, Codex E-02)
import { cleanup, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newChild } from '../../engine/child'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { FacilityView } from './FacilityView'

afterEach(cleanup)

function world() {
  const fresh = newGame(CONTENT)
  const child = { ...newChild(1, fresh.stats, 'wit'), name: '첫째', job: 'cook' as const }
  const sibling = { ...newChild(2, fresh.stats, 'hand'), name: '둘째', job: 'painter' as const }
  const build = (id: string, x: number, owner: string) => ({ id, kind: 'kidWork' as const, x, y: 12, facing: 'down' as const, state: 'done' as const, orderedDay: 1, paid: { coins: 1000, items: {} }, refunded: false, owner })
  const game = { ...fresh, clock: { day: 1000, minute: 600 }, child, siblings: [sibling], newland: { builds: [build('b1', 4, 'me:1'), build('b2', 12, 'me:2')], tiles: {}, nextId: 3, settledDay: 1000 }, map: 'newland' as const, player: { ...fresh.player, x: 14, y: 16 } }
  return game
}

it('둘째의 일터 앞: 제목은 둘째, 첫째의 요리 접시는 주지 않는다', () => {
  const game = world()
  useGame.setState({ game, modal: { kind: 'facility', id: 'kidWork', at: { x: 14, y: 16 } } as never })
  render(<FacilityView id="kidWork" at={{ x: 14, y: 16 }} />)
  expect(screen.getByRole('heading')).toHaveTextContent('둘째')
  expect(useGame.getState().game.inv.bread ?? 0).toBe(game.inv.bread ?? 0)
})

it('첫째의 일터 앞: 제목은 첫째, 요리사라 접시를 받는다', () => {
  const game = world()
  useGame.setState({ game, modal: { kind: 'facility', id: 'kidWork', at: { x: 6, y: 16 } } as never })
  render(<FacilityView id="kidWork" at={{ x: 6, y: 16 }} />)
  expect(screen.getByRole('heading')).toHaveTextContent('첫째')
})
