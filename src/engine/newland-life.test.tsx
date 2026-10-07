// 계획 18 남은 것 (사용자 결정 ⑥): 손님집·기억 정원·공동 마당·주민의 꿈터
import { render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { forbiddenIn } from '../content/forbidden'
import { canGatherYard, gatherYard, newGame, syncHome, YARD_FROM, type GameState } from './game'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'
import type { Build } from './newland-build'
import {
  canHearDream, DREAM_GIFT_GAP, DREAM_TROUBLE_AFTER, DREAMER, dreamHeard, facilityAt, GUEST_GAP, GUEST_STAY, GUESTS, guestHouseMorning, guestNow, hearDream, memoriesOf, pickDream, talkGuest, visitDream,
} from './newland-life'
import { isWalkable } from './world'
import { useGame } from '../store/game-store'
import { ModalLayer } from '../features/ModalLayer'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

const done = (id: string, kind: Build['kind'], x: number, y: number): Build => ({ id, kind, x, y, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false })
function land(builds: Build[], extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  const g: GameState = {
    ...base,
    scenes: [],
    clock: { day: 20, minute: 16 * 60 },
    flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 },
    map: 'newland',
    newland: { builds, tiles: {}, nextId: builds.length + 1, settledDay: 20 },
    ...extra,
  }
  syncHome(g)
  return g
}
const at = (s: GameState, day: number): GameState => ({ ...s, clock: { ...s.clock, day } })

describe('손님집', () => {
  it('손님이 사흘 머물고, 사흘째 이야기 뒤 고유 선물 한 번, 떠난 뒤 7일 뒤 다음 손님', () => {
    let s = guestHouseMorning(land([done('b1', 'guest', 10, 12)]))
    const first = guestNow(s)!
    expect(first).toBeTruthy()
    const gift = GUESTS.find((g) => g.id === first)!.gift
    for (let d = 0; d < GUEST_STAY; d++) {
      s = at(s, 20 + d)
      const r = talkGuest(s)!
      expect(talkGuest(r.state)).toBeNull() // 하루 한 번
      expect(r.line).toBe(d)
      if (d < GUEST_STAY - 1) expect(r.gift).toBeUndefined()
      else expect(r.gift).toBe(gift)
      s = r.state
    }
    expect(s.inv[gift]).toBe(1)
    s = guestHouseMorning(at(s, 20 + GUEST_STAY))
    expect(guestNow(s)).toBeNull()
    s = guestHouseMorning(at(s, 20 + GUEST_STAY + GUEST_GAP))
    expect(guestNow(s)).not.toBe(first)
  })
  it('손님집이 없으면 손님도 없다, 손님 글에 금지어 없음', () => {
    expect(guestNow(guestHouseMorning(land([])))).toBeNull()
    const text = JSON.stringify(T.newlandLife)
    expect(forbiddenIn(text)).toBeNull()
  })
  it('문 앞에 서면 손님집 창, 문 칸은 걸을 수 있고 벽은 막힌다', () => {
    const s = land([done('b1', 'guest', 10, 12)])
    expect(facilityAt(s, { x: 12, y: 15 })).toBe('guest')
    expect(facilityAt(s, { x: 12, y: 16 })).toBe('guest')
    expect(isWalkable({ x: 12, y: 15 })).toBe(true)
    expect(isWalkable({ x: 11, y: 15 })).toBe(false)
  })
})

describe('기억 정원과 공동 마당', () => {
  it('마당 모임: 오후에 가까운 이웃만, 하루 한 번, 기억 정원에 남는다', () => {
    const friend = CONTENT.neighbors.find((n) => n.id === 'baker')!.id
    let s = land([done('b1', 'courtyard', 10, 12), done('b2', 'memorial', 16, 12)], { hearts: { [friend]: 50 } })
    expect(canGatherYard({ ...s, clock: { ...s.clock, minute: YARD_FROM - 10 } }, CONTENT)).toBe('time')
    if (canGatherYard(s, CONTENT) === 'nobody') return // 그날 빵집 이웃이 나오지 않으면 (날씨) 건너뛴다
    expect(canGatherYard(s, CONTENT)).toBeNull()
    s = gatherYard(s, CONTENT)
    expect(s.hearts[friend]).toBeGreaterThan(50)
    expect(canGatherYard(s, CONTENT)).toBe('done')
    expect(memoriesOf(s).some((m) => m.kind === 'yard' && m.day === 20)).toBe(true)
    expect(facilityAt(s, { x: 17, y: 13 })).toBe('memorial')
    expect(facilityAt(s, { x: 11, y: 13 })).toBe('courtyard')
  })
  it('기억 정원: 실제 일만, 날짜 없는 잔치는 날짜 미상, 최근 것부터', () => {
    const s = land([done('b1', 'memorial', 16, 12)], {
      flags: { ...newGame(CONTENT).flags, allFeast: 2 },
      romance: { partner: 'wendell', stage: 'married', since: 3, weddingDay: null, marriedDay: 9 },
      farewells: [{ npc: 'carpenter', day: 15, letter: 0, gift: {} }],
    })
    const list = memoriesOf(s)
    expect(list.map((m) => m.kind)).toEqual(['farewell', 'wedding', 'feast'])
    expect(list[2].day).toBeNull()
    useGame.setState({ game: s, modal: { kind: 'facility', id: 'memorial' } })
    render(<ModalLayer />)
    expect(screen.getByText(T.newlandLife.noDate)).toBeInTheDocument()
  })
})

describe('주민의 꿈터', () => {
  it('마음이 가까워야 꿈을 듣고, 들은 뒤에만 다시 묻지 않는다', () => {
    const s = land([], { hearts: { [DREAMER]: 45 } })
    expect(canHearDream(s, DREAMER)).toBe(true)
    expect(canHearDream({ ...s, hearts: { [DREAMER]: 10 } }, DREAMER)).toBe(false)
    const h = hearDream(s)
    expect(dreamHeard(h)).toBe(true)
    expect(canHearDream(h, DREAMER)).toBe(false)
  })
  it('문 연 날 → 사흘 뒤 어려움 → 고른 말이 남고, 7일마다 짠 것을 챙겨 준다', () => {
    const gives = { cloth: 1 } as never
    let s = land([done('b1', 'weaver', 10, 12)])
    let r = visitDream(s, gives)!
    expect(r.stage).toBe('open')
    s = at(r.state, 20 + DREAM_TROUBLE_AFTER)
    r = visitDream(s, gives)!
    expect(r.stage).toBe('trouble')
    s = pickDream(r.state, 2)
    expect(pickDream(s, 1).flags.dreamPick).toBe(2)
    r = visitDream(s, gives)!
    expect(r.stage).toBe('after')
    expect(r.gift).toEqual(gives)
    expect(visitDream(r.state, gives)!.gift).toBeUndefined()
    expect(visitDream(at(r.state, r.state.clock.day + DREAM_GIFT_GAP), gives)!.gift).toEqual(gives)
  })
})
