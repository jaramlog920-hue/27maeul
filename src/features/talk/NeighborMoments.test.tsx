import { act, render } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import text from '../../content/neighbor-moments.json'
import { newGame, type GameState } from '../../engine/game'
import { BOOKS } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { FESTIVAL_SPOTS } from '../../engine/neighbors'

function ready(): GameState {
  const s = newGame(CONTENT)
  // 이미 만난 이웃 (처음 만나면 첫인사부터 — 2026-10-14)
  return { ...s, notebook: { ...s.notebook, met: ['baker'] }, scenes: [], offers: {}, clock: { day: 3, minute: 600 },
    shelved: Object.fromEntries(BOOKS.slice(0, 25).map(b => [b, 2 as const])),
    player: { ...s.player, x: 4, y: 17, path: [] },
    npcs: { baker: { ...s.npcs.baker, x: 3, y: 17, visible: true, path: [] } },
    target: { kind: 'neighbor', id: 'baker', tries: 0, talk: true },
  }
}
beforeEach(() => {
  localStorage.clear()
  useGame.getState().load(ready())
  useGame.setState({ rng: () => 0, trip: null })
})
it('실제 말 걸기에서 25권 대화는 빨간 창, 같은 말을 다시 들으면 평소 창', () => {
  const { container } = render(<ModalLayer />)
  act(() => useGame.getState().frame(0))
  expect(useGame.getState().modal).toMatchObject({ kind: 'talk', line: text.oldNeighbors.baker, popup: [text.oldNeighbors.baker] })
  expect(container.querySelector('.talk-popup-line')).toHaveTextContent(text.oldNeighbors.baker)
  act(() => useGame.getState().closeModal())
  act(() => {
    useGame.setState({ game: { ...useGame.getState().game, target: { kind: 'neighbor', id: 'baker', tries: 0, talk: true } } })
    useGame.getState().frame(0)
  })
  expect(container.querySelector('.talk-popup')).toBeNull()
  expect(container.querySelector('.talk-line')).toHaveTextContent(text.oldNeighbors.baker)
})
it('행사 중에는 25권 대화보다 행사 대화가 먼저 나오며 행사 참석·보상을 대신 처리하지 않는다', () => {
  const s = ready()
  useGame.getState().load({ ...s, clock: { day: 3, minute: 1100 }, flags: { ...s.flags, gospelFeast: 1 },
    player: { ...s.player, x: FESTIVAL_SPOTS.baker.x, y: FESTIVAL_SPOTS.baker.y + 1 },
    npcs: { baker: { ...s.npcs.baker, ...FESTIVAL_SPOTS.baker, visible: true, path: [] } },
  })
  render(<ModalLayer />)
  act(() => useGame.getState().frame(0))
  expect(useGame.getState().modal).toMatchObject({ kind: 'talk', line: text.events.gospelFeast })
  expect(useGame.getState().game.flags.gospelFeast).toBe(1)
  expect(useGame.getState().game.life.experiences).toEqual(s.life.experiences)
})
