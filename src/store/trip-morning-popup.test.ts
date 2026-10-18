// 여행에서 돌아온 아침에도 순위표·이사 편지 창이 뜬다 (2026-10-18 감사 M-15 — 잠자리를 거치지 않아 열리지 않고 다음 잠에 지워졌다)
import { CONTENT } from '../content/catalog'
import { goToSleep, newGame } from '../engine/game'
import { useGame } from './game-store'

function withFarewell() {
  const g = newGame(CONTENT)
  const gen = g.gen ?? goToSleep(g, CONTENT).gen
  return { ...g, coins: 1000, gen: { ...gen!, retired: { baker: { heir: 'x', day: 1, moved: 1 } } } } as typeof g
}

it('여행에서 돌아온 뒤, 조각 창·장면을 닫으면 이사 편지 창이 열린다', () => {
  useGame.getState().load(withFarewell())
  useGame.setState({ modal: { kind: 'travel', dest: 'harbor', rewards: [], withChild: false } as never, piecePopups: [] })
  useGame.getState().goTrip('harbor', [], [])
  expect(useGame.getState().game.farewellPopup).toBeTruthy()
  // 조각 알림이 남아 있는 동안은 열지 않는다
  useGame.setState({ modal: null, game: { ...useGame.getState().game, scenes: [] } })
  useGame.getState().frame(0.016)
  if (useGame.getState().piecePopups.length) expect(useGame.getState().modal?.kind).not.toBe('farewell')
  // 귀환 직후의 창(조각 알림·본문)을 모두 닫는다
  useGame.setState({ modal: null, piecePopups: [] })
  useGame.getState().frame(0.016)
  expect(useGame.getState().modal?.kind).toBe('farewell')
})
