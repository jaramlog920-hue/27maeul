import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame, pickupGroundFragment, tick, type GameState } from './game'
import { groundFragment, GROUND_FRAGMENT_CHANCE } from './ground-fragments'
import { pieceFrom } from './fragments'
import { findPath } from './movement'
import { OT_PIECES } from './ot-pieces'
import { deserialize, serialize } from './save'
import { HOME_FRONT, MAP } from './world'

function rareDay() {
  // 첫 프레임은 주민 세계의 씨앗을 만든다. 화면에 표시된 뒤 이동하는
  // 흐름을 검사하려면 그 씨앗이 있는 상태에서 오늘 조각을 찾아야 한다.
  const base = { ...tick(newGame(CONTENT), 0, () => 0.5, CONTENT).state, scenes: [] }
  for (let day = 1; day < 1000; day++) {
    const state = { ...base, clock: { ...base.clock, day } }
    const fragment = groundFragment(state, CONTENT.pieces)
    if (fragment) return { state, fragment }
  }
  throw new Error('희귀 조각이 나타나지 않음')
}

describe('길에 드물게 떨어진 말씀 조각', () => {
  it('5% 확률로만 나타나고 날짜·저장마다 같은 자리와 조각이며 걸어갈 수 있는 흙길이다', () => {
    expect(GROUND_FRAGMENT_CHANCE).toBe(0.05)
    const base = { ...newGame(CONTENT), scenes: [] }
    let appeared = 0
    for (let day = 1; day <= 1000; day++) {
      const state = { ...base, clock: { ...base.clock, day } }
      const fragment = groundFragment(state, CONTENT.pieces)
      if (!fragment) continue
      appeared++
      expect(MAP[fragment.at.y][fragment.at.x]).toBe(',')
      expect(findPath(HOME_FRONT, fragment.at)).not.toBeNull()
      expect(groundFragment(state, CONTENT.pieces)).toEqual(fragment)
    }
    expect(appeared).toBeGreaterThan(25)
    expect(appeared).toBeLessThan(80)
    const { state, fragment } = rareDay()
    expect(state.gen).toBeDefined()
    expect(groundFragment(deserialize(serialize(state), CONTENT)!, CONTENT.pieces)).toEqual(fragment)
  })
  it('위로 걸어가면 실제로 줍고 획득 이력·도감·그날 주운 표식이 함께 남는다', () => {
    const { state, fragment } = rareDay()
    const before = { ...state, player: { ...state.player, x: fragment.at.x, y: fragment.at.y } }
    const found = pickupGroundFragment(before, CONTENT)!
    expect(found.pieceId).toBe(fragment.id)
    expect(found.state.collected).toContain(fragment.id)
    expect(found.state.pieceLog[fragment.id]).toEqual({ day: state.clock.day, from: 'ground' })
    expect(pieceFrom('ground')).toEqual({ kind: 'ground' })
    expect(pickupGroundFragment(found.state, CONTENT)).toBeNull()
    expect(groundFragment(deserialize(serialize(found.state), CONTENT)!, CONTENT.pieces)).toBeNull()
    const result = tick({ ...before, player: { ...before.player, path: [fragment.at] }, target: { kind: 'ground' } }, 0.05, () => 0.5, CONTENT)
    expect(result.state.gen?.seed).toBe(before.gen?.seed)
    expect(result.events).toContainEqual({ type: 'groundPiece', id: fragment.id })
    expect(result.state.collected).toContain(fragment.id)
  })
  it('다 모았거나 다른 지도에 있으면 생기지 않고, 남은 한 조각만 받을 수 있다', () => {
    const { state, fragment } = rareDay()
    const missing = CONTENT.pieces[0].id
    const almost = { ...state, collected: CONTENT.pieces.filter(piece => piece.id !== missing).map(piece => piece.id), post: [], offers: {} }
    expect(groundFragment(almost, CONTENT.pieces)?.id).toBe(missing)
    expect(groundFragment({ ...almost, collected: CONTENT.pieces.map(piece => piece.id) }, CONTENT.pieces)).toBeNull()
    expect(groundFragment({ ...state, map: 'newland' }, CONTENT.pieces)).toBeNull()
    expect(pickupGroundFragment({ ...state, player: { ...state.player, x: fragment.at.x + 1, y: fragment.at.y } }, CONTENT)).toBeNull()
  })
  it('초기화된 세계에서 흙길 경로로 접근하면 조각을 한 번 줍는다', () => {
    const { state, fragment } = rareDay()
    const path = findPath(HOME_FRONT, fragment.at)!
    let current: GameState = { ...state, player: { ...state.player, ...HOME_FRONT, path } }
    let pickups = 0
    for (let step = 0; step < 2000 && current.player.path.length; step++) {
      const result = tick(current, 0.1, () => 0.5, CONTENT)
      current = result.state
      pickups += result.events.filter(e => e.type === 'groundPiece').length
    }
    expect(current.player.path).toEqual([])
    expect(pickups).toBe(1)
    expect(current.collected).toContain(fragment.id)
    expect(current.flags.groundPieceDay).toBe(state.clock.day)
    expect(groundFragment(current, CONTENT.pieces)).toBeNull()
  })
  it('새 터를 받은 뒤에는 아직 없는 구약 조각도 줍고 중복 없이 저장된다', () => {
    const { state } = rareDay()
    const missing = OT_PIECES[0].id
    const before = { ...state, flags: { ...state.flags, newlandGift: 1 }, collected: CONTENT.pieces.map(piece => piece.id), otCollected: OT_PIECES.filter(piece => piece.id !== missing).map(piece => piece.id) }
    const fragment = groundFragment(before, CONTENT.pieces)!
    expect(fragment.id).toBe(missing)
    const found = pickupGroundFragment({ ...before, player: { ...before.player, ...fragment.at } }, CONTENT)!
    expect(found.state.otCollected).toHaveLength(OT_PIECES.length)
    expect(found.state.collected).not.toContain(missing)
    expect(deserialize(serialize(found.state), CONTENT)?.otCollected).toContain(missing)
  })
})
