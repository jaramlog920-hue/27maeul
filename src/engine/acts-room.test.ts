// 계획 5 작업 5: 사도행전 방 — 열림, 장을 엮어 카드 얻기, 여정 판 잇기, 완성 뒤 나루의 배, 저장
import { CONTENT, JOURNEY, piecesOf } from '../content/catalog'
import { emptyProgress } from './books'
import { goToSleep, moveJourneyCard, newGame, setArrangement, submitChapter, syncHome, syncJourney, type GameState } from './game'
import { boardInOrder, journeyComplete, placeNewCards, type JourneyCard } from './journey'
import { deserialize, serialize } from './save'
import { ACTS_DOOR, isWalkable, setActsOpen } from './world'

const ALL = Array.from({ length: 28 }, (_, i) => i + 1)
const opened = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2 }, activeBook: 'ac' }
}
/** 사도행전 한 장을 본문 순서로 엮는다 */
function bind(s: GameState, ch: number): GameState {
  const ids = piecesOf('ac').filter((p) => p.chapter === ch).map((p) => p.id)
  s = { ...s, collected: [...s.collected, ...ids], inv: { ...s.inv, papyrus: 1, ink: 1 }, needs: { ...s.needs, fatigue: 0 } }
  s = setArrangement(s, 'ac', ch, ids)
  const r = submitChapter(s, 'ac', ch, CONTENT)
  expect(r.result.kind, `${ch}장`).toBe('done')
  return r.state
}
/** 판을 본문 순서로 맞춘다 (▲만 써서 — 거품 정렬) */
function sortBoard(s: GameState): GameState {
  for (let pass = 0; pass < s.journey.length; pass++)
    for (let i = 1; i < s.journey.length; i++) if (s.journey[i - 1] > s.journey[i]) s = moveJourneyCard(s, i, -1, CONTENT)
  return s
}

afterEach(() => setActsOpen(false))

describe('사도행전 방 열림', () => {
  it('잔치 전·잔치 날에는 서고 문이 막히고, 잔치 다음 날(gospelFeast 2)부터 걸어 들어간다', () => {
    const s = newGame(CONTENT)
    for (const [feast, open] of [[undefined, false], [1, false], [2, true]] as const) {
      syncHome({ ...s, flags: { ...s.flags, ...(feast ? { gospelFeast: feast } : {}) } })
      expect(isWalkable(ACTS_DOOR), String(feast)).toBe(open)
    }
  })

  it('잔치 날 밤을 자고 일어나면 문이 열린다', () => {
    const s = newGame(CONTENT)
    const next = goToSleep({ ...s, flags: { ...s.flags, gospelFeast: 1 } }, CONTENT)
    syncHome(next)
    expect(isWalkable(ACTS_DOOR)).toBe(true)
  })
})

describe('여정 카드 얻기 (장 엮기)', () => {
  it('사도행전 장을 엮으면 그 장의 카드가 판에 들어오고, 복음서 장은 카드를 주지 않는다', () => {
    let s = bind(opened(), 1)
    expect(s.journey).toEqual(JOURNEY.filter((c) => c.chapter === 1).map((c) => c.order))
    s = bind(s, 2)
    const upTo2 = JOURNEY.filter((c) => c.chapter <= 2).map((c) => c.order)
    expect([...s.journey].sort((a, b) => a - b)).toEqual(upTo2)
    const lk = piecesOf('lk').filter((p) => p.chapter === 1).map((p) => p.id)
    const g = setArrangement({ ...s, activeBook: 'lk', collected: [...s.collected, ...lk], inv: { papyrus: 1, ink: 1 } }, 'lk', 1, lk)
    expect(submitChapter(g, 'lk', 1, CONTENT).state.journey).toEqual(s.journey)
  })

  it('다 엮어도 판은 저절로 맞지 않는다 — 새 카드는 판 끝 가까이 끼운다', () => {
    const s = syncJourney({ ...opened(), progress: { ...emptyProgress(), ac: { completed: ALL, arrangement: {} } } }, CONTENT)
    expect(s.journey).toHaveLength(JOURNEY.length)
    expect(new Set(s.journey).size).toBe(JOURNEY.length)
    expect(boardInOrder(s.journey)).toBe(false)
    expect(s.flags.actsShip).toBeUndefined()
  })

  it('placeNewCards: 얻지 않은 카드·겹친 카드는 빼고, 놓아 둔 차례는 지킨다', () => {
    const cards: JourneyCard[] = [1, 2, 3, 4].map((o) => ({ order: o, place: `곳${o}`, ref: `행 ${o}:1`, chapter: o }))
    const out = placeNewCards([3, 3, 9, 1], cards.slice(0, 3))
    expect([...out].sort()).toEqual([1, 2, 3])
    expect(out.filter((o) => o !== 2)).toEqual([3, 1])
    // 같은 판·같은 카드면 늘 같은 자리 (불러오기·다시 계산해도)
    expect(placeNewCards([3, 3, 9, 1], cards.slice(0, 3))).toEqual(out)
    expect(placeNewCards([], [])).toEqual([])
  })
})

describe('여정 판 순서와 완성', () => {
  it('순서 판정: 본문 순서(번호 오름차순)일 때만', () => {
    expect(boardInOrder([1, 2, 5])).toBe(true)
    expect(boardInOrder([2, 1])).toBe(false)
    const orders = JOURNEY.map((c) => c.order)
    expect(journeyComplete(orders, JOURNEY)).toBe(true)
    // 카드가 모자라면 순서가 맞아도 완성이 아니다
    expect(journeyComplete(orders.slice(0, -1), JOURNEY)).toBe(false)
    expect(journeyComplete([...orders.slice(0, -2), orders.at(-1)!, orders.at(-2)!], JOURNEY)).toBe(false)
    expect(journeyComplete([], [])).toBe(false)
  })

  it('일부 카드만 맞게 놓아도 배 표식은 서지 않는다', () => {
    let s = syncJourney({ ...opened(), progress: { ...emptyProgress(), ac: { completed: ALL.slice(0, 20), arrangement: {} } } }, CONTENT)
    s = sortBoard(s)
    expect(boardInOrder(s.journey)).toBe(true)
    expect(s.flags.actsShip).toBeUndefined()
  })

  it('다 모아 본문 순서로 이으면 actsShip 1 → 다음 날 아침 장면 한 번, 그 뒤로는 없다', () => {
    let s = syncJourney({ ...opened(), progress: { ...emptyProgress(), ac: { completed: ALL, arrangement: {} } } }, CONTENT)
    s = sortBoard(s)
    expect(s.journey).toEqual(JOURNEY.map((c) => c.order))
    expect(s.flags.actsShip).toBe(1)
    // 다 이은 판은 더 움직이지 않는다
    expect(moveJourneyCard(s, 3, 1, CONTENT)).toBe(s)
    const day2 = goToSleep({ ...s, scenes: [] }, CONTENT)
    expect(day2.flags.actsShip).toBe(2)
    expect(day2.scenes.filter((x) => x === 'actsShip')).toHaveLength(1)
    const day3 = goToSleep({ ...day2, scenes: [] }, CONTENT)
    expect(day3.scenes).not.toContain('actsShip')
    expect(day3.flags.actsShip).toBe(2)
  })
})

describe('저장과 불러오기', () => {
  it('여정 판과 배 표식이 그대로 돌아온다', () => {
    let s = syncJourney({ ...opened(), progress: { ...emptyProgress(), ac: { completed: [1, 2, 9, 13], arrangement: {} } } }, CONTENT)
    s = { ...s, journey: [...s.journey].reverse(), flags: { ...s.flags, actsShip: 0 } }
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.journey).toEqual(s.journey)
    const shipped = deserialize(serialize({ ...s, flags: { ...s.flags, actsShip: 2 } }), CONTENT)!
    expect(shipped.flags.actsShip).toBe(2)
  })

  it('판이 없던 옛 저장: 빈 판에서 시작하고, 이미 엮은 사도행전 장의 카드는 채운다', () => {
    const o = JSON.parse(serialize(newGame(CONTENT)))
    delete o.journey
    expect(deserialize(JSON.stringify(o), CONTENT)!.journey).toEqual([])
    const bound = { ...o, flags: { ...o.flags, gospelFeast: 2 }, progress: { ...o.progress, ac: { completed: [1], arrangement: {} } } }
    expect(deserialize(JSON.stringify(bound), CONTENT)!.journey).toEqual(JOURNEY.filter((c) => c.chapter === 1).map((c) => c.order))
  })

  it('망가진 판(없는 번호·겹침·엮지 않은 장의 카드)은 걸러진다', () => {
    const o = JSON.parse(serialize({ ...opened(), progress: { ...emptyProgress(), ac: { completed: [1], arrangement: {} } } }))
    const first = JOURNEY.filter((c) => c.chapter === 1).map((c) => c.order)
    o.journey = [...first, first[0], 999, 'x', JOURNEY.at(-1)!.order]
    expect(deserialize(JSON.stringify(o), CONTENT)!.journey).toEqual(first)
  })

  it('불러오면 지도도 이 저장의 방 열림에 맞춘다', () => {
    setActsOpen(true)
    deserialize(serialize(newGame(CONTENT)), CONTENT)
    expect(isWalkable(ACTS_DOOR)).toBe(false)
    deserialize(serialize(opened()), CONTENT)
    expect(isWalkable(ACTS_DOOR)).toBe(true)
  })
})
