import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { petEventText } from '../content/pet-text'
import { adopt } from './companion'
import { newGame, setCompanionStay, tick, type GameState } from './game'
import { petPieceCheck } from './pet-life'
import { pieceFrom } from './fragments'
import { deserialize, serialize } from './save'
import { HOME_ENTRY, isHome, PET_HOME } from './world'
import { useGame } from '../store/game-store'
import { FollowMenu } from '../features/companion/FollowMenu'
import { gotLabel } from '../features/word/Word'

const road = { x: 12, y: 18 }
const base = (day = 5): GameState => {
  const s = newGame(CONTENT)
  return { ...s, npcs: {}, scenes: [], clock: { day, minute: 600 }, player: { ...s.player, ...HOME_ENTRY, path: [] }, companion: adopt('cat', '나비', 1, road) }
}

describe('집에서만 지내는 고양이', () => {
  it('입양·외출 명령·옛 저장 복원에서 모두 집에 머무른다', () => {
    const s = base()
    expect(s.companion).toMatchObject({ stay: true, ...PET_HOME })
    expect(setCompanionStay(s, false).companion).toMatchObject({ stay: true, ...PET_HOME })
    const legacy = { ...s, companion: { ...s.companion!, stay: false, ...road, path: [road] } }
    const back = deserialize(serialize(legacy), CONTENT)!
    expect(back.companion).toMatchObject({ stay: true, path: [] })
    expect(isHome(back.companion!)).toBe(true)
    const moving = tick({ ...legacy, player: { ...s.player, ...road } }, .05, () => .5, CONTENT).state
    expect(moving.companion?.stay).toBe(true)
    expect(isHome({ x: Math.round(moving.companion!.x), y: Math.round(moving.companion!.y) })).toBe(true)
  })
  it('고양이 메뉴에는 데리고 다니기가 없고 강아지는 그대로 있다', () => {
    useGame.setState({ game: base() })
    const { unmount } = render(<FollowMenu who="pet" />)
    expect(screen.queryByRole('button', { name: '데리고 다니기' })).toBeNull()
    expect(screen.getByText('고양이는 집에서 지내요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '쓰다듬기' })).toBeInTheDocument()
    unmount()
    useGame.setState({ game: { ...base(), companion: { ...adopt('dog', '누렁이', 1, road), stay: true } } })
    render(<FollowMenu who="pet" />)
    fireEvent.click(screen.getByRole('button', { name: '데리고 다니기' }))
    expect(useGame.getState().game.companion?.stay).toBe(false)
  })
  it('집에 함께 있을 때만 낮에 하루 한 번 조각을 살핀다', () => {
    const s = base()
    expect(petPieceCheck(s, HOME_ENTRY, false)).not.toBeNull()
    expect(petPieceCheck({ ...s, player: { ...s.player, ...road } }, road, true)).toBeNull()
    expect(petPieceCheck({ ...s, flags: { ...s.flags, petPieceDay: 5 } }, HOME_ENTRY, false)).toBeNull()
    expect(petPieceCheck({ ...s, clock: { day: 5, minute: 21 * 60 } }, HOME_ENTRY, false)).toBeNull()
  })
  it('실제로 집에서 조각을 얻고 알림·도감·저장에 집에서 얻은 출처를 남긴다', () => {
    let day = 2
    while (petPieceCheck(base(day), HOME_ENTRY, false) !== 'find') day++
    const before = base(day)
    let result = tick(before, .05, () => .5, CONTENT)
    const events = [...result.events]
    for (let i = 0; i < 500 && result.state.flags.petPieceDay !== day; i++) {
      result = tick(result.state, .05, () => .5, CONTENT)
      events.push(...result.events)
    }
    const id = result.state.collected.at(-1)!
    expect(result.state.collected).toHaveLength(before.collected.length + 1)
    expect(pieceFrom(result.state.pieceLog[id].from)).toEqual({ kind: 'petHome' })
    expect(events).toContainEqual({ type: 'pet', key: 'homePiece' })
    expect(petEventText({ key: 'homePiece' }, before.companion!)).toContain('집 안에서 말씀 조각')
    expect(gotLabel(result.state.pieceLog, id)).toContain('고양이가 집에서 찾아 준 조각')
    const back = deserialize(serialize(result.state), CONTENT)!
    expect(back.pieceLog[id].from).toBe('petHome')
    expect(tick(back, .05, () => .5, CONTENT).state.collected).toHaveLength(result.state.collected.length)
  })
})
