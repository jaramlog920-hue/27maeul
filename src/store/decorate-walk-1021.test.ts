// 2026-10-21 사용자: 꾸미는 동안에도 걸으며 시점이 따라오게 — 검토: 마당 밖으로·문으로는 나가지 않는다
import { CONTENT } from '../content/catalog'
import { newGame, syncHome } from '../engine/game'
import { isOutdoorEditing } from '../engine/outdoor'
import { useGame } from './game-store'

it('마당을 꾸미다 마당 밖으로는 걸어 나가지 않고, 안에서는 걷는다', () => {
  const s = newGame(CONTENT)
  const game = { ...s, map: 'village' as const, player: { ...s.player, x: 17, y: 5, path: [], facing: 'right' as const } }
  syncHome(game)
  expect(isOutdoorEditing(game)).toBe(true)
  useGame.setState({ game, modal: null, decorating: 'pick', decorMoving: false })
  useGame.getState().walk(1, 0)
  expect(useGame.getState().game.player.path).toHaveLength(0)
  useGame.getState().walk(-1, 0)
  expect(useGame.getState().game.player.path.length).toBeGreaterThan(0)
  useGame.setState({ decorating: null })
})
