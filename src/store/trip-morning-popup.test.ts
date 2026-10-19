// 여행에서 돌아온 아침의 이사 편지 (2026-10-18 감사 M-15 — 잠자리를 거치지 않아 다음 잠에 지워졌다)
import { CONTENT } from '../content/catalog'
import { goToSleep, newGame } from '../engine/game'
import { useGame } from './game-store'

function withFarewell() {
  const g = newGame(CONTENT)
  const gen = g.gen ?? goToSleep(g, CONTENT).gen
  return { ...g, coins: 1000, gen: { ...gen!, retired: { baker: { heir: 'x', day: 1, moved: 1 } } } } as typeof g
}

// 2026-10-19 사용자: 이사 편지는 저절로 열지 않고 집 앞 편지함에 둔다 — 귀환한 아침에도 편지가 지워지지 않고 남는다
it('여행에서 돌아온 뒤 이사 편지는 창으로 뜨지 않고 편지함에 남는다', () => {
  useGame.getState().load(withFarewell())
  useGame.setState({ modal: { kind: 'travel', dest: 'harbor', rewards: [], withChild: false } as never, piecePopups: [] })
  useGame.getState().goTrip('harbor', [], [])
  expect(useGame.getState().game.farewellPopup).toBeTruthy()
  useGame.setState({ modal: null, piecePopups: [], game: { ...useGame.getState().game, scenes: [] } })
  useGame.getState().frame(0.016)
  expect(useGame.getState().modal?.kind).not.toBe('farewell')
  expect(useGame.getState().game.farewellPopup).toBeTruthy()
})
