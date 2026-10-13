// 비상 탈출 (2026-10-14 사용자: 따라오던 동물 친구가 끼인 자리에 남았다)
import { describe, expect, it, vi } from 'vitest'
import { CONTENT } from '../content/catalog'
import { adopt } from '../engine/companion'
import { newGame } from '../engine/game'
import { HOME_FRONT } from '../engine/world'
import { useGame } from './game-store'

vi.mock('../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))

describe('비상 탈출', () => {
  it('따라오던 동물 친구도 집 앞 곁으로 오고, 집에 둔 동물은 그대로', () => {
    const g = newGame(CONTENT)
    const pet = { ...adopt('dog', '바둑', 1, { x: 40, y: 30 }), stay: false }
    useGame.setState({ game: { ...g, companion: pet }, modal: null })
    useGame.getState().escapeStuck()
    const c = useGame.getState().game.companion!
    expect(Math.abs(c.x - HOME_FRONT.x) + Math.abs(c.y - HOME_FRONT.y)).toBeLessThanOrEqual(1)
    const home = { ...pet, stay: true }
    useGame.setState({ game: { ...g, companion: home }, modal: null })
    useGame.getState().escapeStuck()
    expect(useGame.getState().game.companion).toMatchObject({ x: home.x, y: home.y, stay: true })
  })
})
