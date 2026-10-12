// 2026-10-11 살림·경제 점검 버그 7(글 두 줄) — 상인 팔기 알림의 조사, 겨울 들 약초 안내
import { beforeEach, expect, it, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { gatherInfo, newGame, sellPrice } from '../engine/game'
import { useGame } from './game-store'

vi.mock('../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))

beforeEach(() => {
  const g = newGame(CONTENT)
  useGame.setState({ game: { ...g, clock: { day: 7, minute: 10 * 60 }, inv: { wool: 2, olive: 2 } }, toast: null, modal: null })
})

it('팔기 알림은 낱말에 맞는 조사를 쓴다 (양털을 / 올리브를)', () => {
  const price = sellPrice(useGame.getState().game, 'wool')
  useGame.getState().sellItem('wool')
  expect(useGame.getState().toast?.text).toBe(`양털을 ${price}닢에 팔았어요.`)
  useGame.getState().sellItem('olive')
  expect(useGame.getState().toast?.text).toMatch(/^올리브를 \d+닢에 팔았어요\.$/)
})

it('겨울 들 약초는 "익지 않았다"가 아니라 겨울 안내', () => {
  const g = useGame.getState().game
  const winter = { ...g, clock: { day: 125, minute: 10 * 60 } }
  expect(gatherInfo(winter, 'wildHerb')).toEqual({ blocked: 'winter' })
  expect(T.herbs.winter).toMatch(/겨울/)
  expect(T.ui.notRipe).toMatch(/어요\.$/)
})

it('8. 양 우리 안에서 나가는 길이 이웃에게만 막히면 기다리라는 안내가 뜬다', () => {
  const g = useGame.getState().game
  const npcs = { ...g.npcs, shepherd: { ...g.npcs.shepherd, x: 5, y: 28, visible: true, path: [] } }
  const inPen = { ...g, npcs, player: { ...g.player, x: 5, y: 30, path: [] } }
  useGame.setState({ game: inPen, toast: null })
  useGame.getState().tap({ x: 24, y: 20 })
  expect(useGame.getState().game.player.path).toEqual([])
  expect(T.ui.waitPass).toMatch(/비켜/)
  expect(useGame.getState().toast?.text).toBe(T.ui.waitPass)
  // 이웃이 비키면 그대로 걸어 나간다
  useGame.setState({ game: { ...inPen, npcs: { ...npcs, shepherd: { ...npcs.shepherd, x: 3, y: 29 } } }, toast: null })
  useGame.getState().tap({ x: 24, y: 20 })
  expect(useGame.getState().game.player.path.length).toBeGreaterThan(0)
})
