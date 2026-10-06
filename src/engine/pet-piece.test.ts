// 2026-10-07 사용자: 데리고 다니는 동물이 가끔 길에서 말씀 조각을 찾아온다
import { CONTENT } from '../content/catalog'
import { petEventText } from '../content/pet-text'
import { adopt } from './companion'
import { newGame, tick, type GameState } from './game'
import { petPieceCheck, PET_PIECE_CHANCE } from './pet-life'
import { pieceFrom } from './fragments'

const road = { x: 12, y: 18 } // 가로 큰길 (산책 기억 자리가 아닌 곳)
const base = (day: number, extra: Partial<GameState> = {}): GameState => {
  const s0 = newGame(CONTENT)
  const pet = { ...adopt('dog', '누렁이', 1, road), stay: false, x: road.x + 1, y: road.y, path: [] }
  return { ...s0, npcs: {}, scenes: [], clock: { day, minute: 10 * 60 }, player: { ...s0.player, x: road.x, y: road.y, path: [] }, companion: pet, ...extra }
}

describe('동물이 길에서 찾은 말씀 조각', () => {
  it('하루 한 번만 살피고, 날마다 찾을지 말지는 정해져 있다 (대략 열에 셋)', () => {
    const days = Array.from({ length: 200 }, (_, i) => i + 2)
    const finds = days.filter((d) => petPieceCheck(base(d), road, true) === 'find').length
    expect(finds / days.length).toBeGreaterThan(PET_PIECE_CHANCE - 0.15)
    expect(finds / days.length).toBeLessThan(PET_PIECE_CHANCE + 0.15)
    expect(petPieceCheck(base(5, { flags: { ...newGame(CONTENT).flags, petPieceDay: 5 } }), road, true)).toBeNull()
  })
  it('길이 아니거나 집에 두었거나 밤이면 살피지 않는다', () => {
    expect(petPieceCheck(base(5), road, false)).toBeNull()
    const s = base(5)
    expect(petPieceCheck({ ...s, companion: { ...s.companion!, stay: true } }, road, true)).toBeNull()
    expect(petPieceCheck({ ...s, clock: { day: 5, minute: 21 * 60 } }, road, true)).toBeNull()
  })
  it('찾는 날 길에 서 있으면 조각 하나가 모이고 동물 쪽 한 줄이 뜬다, 같은 날 두 번은 없다', () => {
    let day = 2
    while (petPieceCheck(base(day), road, true) !== 'find') day++
    const s = base(day)
    // 동물이 곁 자리로 걸어와 멈출 때까지 조금 흐르게 한다
    let r = tick(s, 0.05, () => 0.5, CONTENT)
    const events = [...r.events]
    for (let i = 0; i < 200 && r.state.flags.petPieceDay !== day; i++) {
      r = tick(r.state, 0.05, () => 0.5, CONTENT)
      events.push(...r.events)
    }
    r = { ...r, events }
    expect(r.state.collected.length).toBe(s.collected.length + 1)
    const id = r.state.collected.at(-1)!
    expect(pieceFrom(r.state.pieceLog[id]?.from)).toEqual({ kind: 'pet' })
    const ev = r.events.find((e) => e.type === 'pet' && e.key === 'piece')
    expect(ev).toBeTruthy()
    expect(petEventText({ key: 'piece' }, s.companion!)).toContain('말씀 조각')
    const again = tick(r.state, 0.01, () => 0.5, CONTENT)
    expect(again.state.collected.length).toBe(r.state.collected.length)
  })
})
