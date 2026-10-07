// 주민 가족 생활 (2026-10-08): 한 집 생활 · 새 터 주택 희망 목록
import { render, screen, fireEvent } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { newGame, syncHome, type GameState } from './game'
import { newGenState, type GenPerson, type GenState } from './gen'
import { withPairs } from './gen-settle'
import { emptyHomes, familyHomes, giveFamilyHome, homeWishes, sharedHomeOf } from './gen-homes'
import { standSpotOf, type Build } from './newland-build'
import { facilityAt, roomOwner } from './newland-life'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

const person = (id: string, name: string, spouse: string | null, household: string | null): GenPerson => ({
  id, origin: 'born', born: 1, stage: 'adult', look: 'f', name, avatar: { skin: 2, hairFront: 3, hairBack: 1, top: 2, bottom: 1 }, parents: [], spouse, household,
})
function gen(): GenState {
  const g = newGenState(CONTENT, 7, 1, withPairs())
  return {
    ...g,
    persons: {
      ...g.persons,
      baker: { ...g.persons.baker, spouse: 'grandpa', household: 'h-1' },
      grandpa: { ...g.persons.grandpa, spouse: 'baker', household: 'h-1' },
      'g-0001': person('g-0001', '루시', 'g-0002', 'h-2'),
      'g-0002': person('g-0002', '토비', 'g-0001', 'h-2'),
    },
    households: {
      ...g.households,
      'h-1': { id: 'h-1', home: 'baker', members: ['baker', 'grandpa'], children: [], lastBirth: null, since: 5 },
      'h-2': { id: 'h-2', home: 'g-0001', members: ['g-0001', 'g-0002'], children: [], lastBirth: null, since: 9 },
    },
  } as GenState
}
const house: Build = { id: 'b1', kind: 'home', x: 16, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 }
function land(): GameState {
  const base = newGame(CONTENT)
  const g: GameState = { ...base, clock: { day: 40, minute: 600 }, gen: gen(), flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 }, map: 'newland', newland: { builds: [house], tiles: {}, nextId: 2, settledDay: 40 } }
  syncHome(g)
  return g
}

describe('주민 가족 생활', () => {
  it('결혼한 이웃은 가구의 집(배우자 집)으로, 집 주인은 제 집 그대로', () => {
    const g = gen()
    expect(sharedHomeOf(g, 'grandpa', roomOwner)).toBe('baker')
    expect(sharedHomeOf(g, 'baker', roomOwner)).toBeNull()
    expect(sharedHomeOf(g, 'smith', roomOwner)).toBeNull()
  })

  it('주택 희망: 방이 없는 신혼 가구만, 집을 내어 주면 목록에서 빠지고 그 집은 빈집이 아니다', () => {
    const s = land()
    expect(homeWishes(s, roomOwner).map((h) => h.id)).toEqual(['h-2'])
    const t = giveFamilyHome(s, 'h-2', house, roomOwner)
    expect(familyHomes(t).map((x) => x.household.id)).toEqual(['h-2'])
    expect(homeWishes(t, roomOwner)).toEqual([])
    expect(emptyHomes(t)).toEqual([])
    expect(facilityAt(t, standSpotOf(house)!)).toBe('family')
  })

  it('빈집 앞에 서면 희망 목록 — 고르면 그 집에 산다', () => {
    const s = land()
    const st = standSpotOf(house)!
    expect(facilityAt(s, st)).toBe('emptyHome')
    useGame.setState({ game: { ...s, player: { ...s.player, x: st.x, y: st.y, path: [] } }, modal: { kind: 'facility', id: 'emptyHome' } as never })
    render(<ModalLayer />)
    fireEvent.click(screen.getByRole('button', { name: /루시·토비/ }))
    expect(familyHomes(useGame.getState().game).map((x) => x.household.id)).toEqual(['h-2'])
  })
})
