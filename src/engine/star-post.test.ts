// 맑은 밤 언덕 "별 보기"로 편지함에서 말씀 조각 하나를 꺼낸다 (2026-10-06: 27권 전체의 아직 없는 조각 무작위 하나 —
// 예전의 요한계시록 전용 "한 밤 1–2장, 장 순서" 몫은 없앴다)
import { CONTENT, PIECES } from '../content/catalog'
import { hillMailbox, HILL_MAILBOX, LANTERNS } from '../render/decor'
import { HILL_SPOTS } from './bonds'
import { isWet, weatherOf } from './calendar'
import { chooseBook, goToSleep, newGame, stargaze, starsOut, type GameState } from './game'
import { deserialize, serialize } from './save'
import { isWalkable, PLACES, tileAt } from './world'

const clear = (d: number) => !isWet(weatherOf(d)) && weatherOf(d) !== 'fog'
const DAYS = [...Array(200).keys()].map((d) => d + 1)
const CLEAR_DAYS = DAYS.filter(clear)
const WET_DAYS = DAYS.filter((d) => isWet(weatherOf(d)))
const FOG_DAYS = DAYS.filter((d) => weatherOf(d) === 'fog')

/** 새 게임(서고 방은 처음부터 모두 열려 있다), 그날 그 시각 */
function nightState(day: number, minute = 22 * 60): GameState {
  const s = newGame(CONTENT)
  return { ...s, clock: { day, minute } }
}
const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { day, minute } })

describe('starsOut — 별은 저녁 여덟 시부터', () => {
  it('20:00 이후(시간이 멈추는 02:00까지)나 05:00 전', () => {
    expect(starsOut(12 * 60)).toBe(false)
    expect(starsOut(19 * 60 + 59)).toBe(false)
    expect(starsOut(20 * 60)).toBe(true)
    expect(starsOut(23 * 60)).toBe(true)
    expect(starsOut(25 * 60)).toBe(true)
    expect(starsOut(4 * 60)).toBe(true)
    expect(starsOut(6 * 60)).toBe(false)
  })
})

describe('stargaze — 맑은 밤 별 보기로 편지함에서 한 조각을 꺼낸다', () => {
  it('① 맑은 밤 22:00 → 정확히 한 조각, 같은 밤 두 번째는 없음, 같은 날은 같은 조각 (불러와도 그대로)', () => {
    const d = CLEAR_DAYS[0]
    const r = stargaze(nightState(d), CONTENT)
    expect(r.pieceIds).toHaveLength(1)
    const [id] = r.pieceIds
    expect(PIECES.some((p) => p.id === id)).toBe(true)
    expect(r.state.collected).toContain(id)
    expect(r.state.todayHeard).toContain(id)
    expect(r.state.pieceLog[id]).toEqual({ day: d, from: 'stars' })
    // 같은 밤 다시 보면 없다 (쉬기와 20분은 그대로)
    const again = stargaze(r.state, CONTENT)
    expect(again.pieceIds).toEqual([])
    expect(again.state.collected).toEqual(r.state.collected)
    expect(again.state.clock.minute).toBe(r.state.clock.minute + 20)
    // 같은 상태에서 다시 하면 같은 조각 (날 씨앗)
    expect(stargaze(nightState(d), CONTENT).pieceIds).toEqual([id])
  })

  it('② 낮 12:00·19:00에는 없음, 20:30에는 하나, 01:00에도 그 날 몫은 한 번뿐', () => {
    const d = CLEAR_DAYS[0]
    expect(stargaze(nightState(d, 12 * 60), CONTENT).pieceIds).toEqual([])
    expect(stargaze(nightState(d, 19 * 60), CONTENT).pieceIds).toEqual([])
    expect(stargaze(nightState(d, 20 * 60 + 30), CONTENT).pieceIds).toHaveLength(1)
    // 22:00에 받았으면 01:00(아직 같은 날)에는 없다
    const took = stargaze(nightState(d), CONTENT).state
    expect(stargaze(at(took, d, 25 * 60), CONTENT).pieceIds).toEqual([])
    // 받지 않았으면 01:00에도 받는다
    expect(stargaze(nightState(d, 25 * 60), CONTENT).pieceIds).toHaveLength(1)
  })

  it('③ 비·눈·안개 날 밤에는 없음 — 궂은 밤 몫은 쌓이지 않는다', () => {
    expect(WET_DAYS.length).toBeGreaterThan(0)
    expect(FOG_DAYS.length).toBeGreaterThan(0)
    for (const d of [...WET_DAYS.slice(0, 5), ...FOG_DAYS.slice(0, 3)]) {
      const r = stargaze(nightState(d), CONTENT)
      expect(r.pieceIds, `day ${d}`).toEqual([])
      expect(r.state.collected).toEqual([])
    }
    // 궂은 밤 뒤 맑은 밤: 밀린 몫 없이 그 밤 한 조각만
    const wet = WET_DAYS[0]
    const nextClear = CLEAR_DAYS.find((d) => d > wet)!
    expect(stargaze(nightState(nextClear), CONTENT).pieceIds).toHaveLength(1)
  })

  it('④ 지금 고른 책이 무엇이든(없든) 같다 — 27권 중 아직 없는 조각 하나', () => {
    const d = CLEAR_DAYS[0]
    const none = stargaze(nightState(d), CONTENT).pieceIds
    for (const book of ['mt', 'rom', 'rev'] as const) {
      const picked = chooseBook(nightState(d), book, CONTENT)
      expect(picked.activeBook).toBe(book)
      expect(stargaze(picked, CONTENT).pieceIds, book).toEqual(none)
    }
  })

  it('⑤ 요한계시록 방과 상관없이 새 게임에서도 받고, 맑은 밤마다 다른 조각 (이미 받은 조각은 다시 오지 않는다)', () => {
    let s = nightState(1)
    const seen = new Set<string>()
    for (const d of CLEAR_DAYS.slice(0, 40)) {
      s = at(s, d, 22 * 60)
      const r = stargaze(s, CONTENT)
      expect(r.pieceIds, `day ${d}`).toHaveLength(1)
      expect(seen.has(r.pieceIds[0]), `dup ${r.pieceIds[0]}`).toBe(false)
      seen.add(r.pieceIds[0])
      s = r.state
    }
    // 여러 책에서 나온다 (복음서·사도행전·편지·요한계시록 어느 조각이든 될 수 있다)
    expect(new Set([...seen].map((id) => id.split('-')[0])).size).toBeGreaterThan(5)
  })

  it('⑥ 27권 조각을 다 모았으면 아무것도 받지 않고, 별 장면·20분은 그대로 (오류 없음)', () => {
    const all = nightState(CLEAR_DAYS[0])
    const full = { ...all, collected: PIECES.map((p) => p.id) }
    const r = stargaze(full, CONTENT)
    expect(r.pieceIds).toEqual([])
    expect(r.state.collected).toEqual(full.collected)
    expect(r.state.clock.minute).toBe(full.clock.minute + 20)
    expect(r.state.scenes).toContain('stars')
  })

  it('맑은 밤 stars 장면은 전처럼 한 번 (조각을 받은 밤에도 함께)', () => {
    const r = stargaze(nightState(CLEAR_DAYS[0]), CONTENT)
    expect(r.state.scenes).toContain('stars')
    expect(stargaze(r.state, CONTENT).state.scenes.filter((x) => x === 'stars')).toHaveLength(1)
  })
})

describe('⑦ 낮의 편지 나르는 이웃은 별 편지함 일을 하지 않는다', () => {
  it('별 보기로 받은 조각은 편지 바구니(post)를 건드리지 않고, 자도 post는 말씀 조각 날에만 하나', () => {
    const s = nightState(CLEAR_DAYS[0], 10 * 60)
    expect(s.post).toEqual([])
    expect(s.offers).toEqual({})
    const slept = goToSleep(s, CONTENT)
    expect(slept.post.length).toBeLessThanOrEqual(1)
  })
})

describe('⑧ 저장과 불러오기', () => {
  it('받은 조각이 남고, 같은 밤 다시 받지 않는다', () => {
    const r = stargaze(nightState(CLEAR_DAYS[0]), CONTENT)
    const back = deserialize(serialize(r.state), CONTENT)!
    for (const id of r.pieceIds) expect(back.collected).toContain(id)
    expect(stargaze(back, CONTENT).pieceIds).toEqual([])
  })
})

describe('언덕 편지함 그림 자리', () => {
  it('벤치 곁 빈 풀 한 칸 — 언덕 자리·모임 자리·등불·길과 겹치지 않고 막지 않는다', () => {
    const hill = [...PLACES.hill.tiles, PLACES.hill.stand!]
    const same = (a: { x: number; y: number }) => a.x === HILL_MAILBOX.x && a.y === HILL_MAILBOX.y
    expect(hill.some(same)).toBe(false)
    expect(Object.values(HILL_SPOTS).some(same)).toBe(false)
    expect(LANTERNS.some(same)).toBe(false)
    expect(tileAt(HILL_MAILBOX.x, HILL_MAILBOX.y)).toBe('.')
    expect(isWalkable(HILL_MAILBOX)).toBe(true)
    // 벤치와 맞닿은 칸
    const bench = PLACES.hill.tiles[0]
    expect(Math.abs(bench.x - HILL_MAILBOX.x) + Math.abs(bench.y - HILL_MAILBOX.y)).toBe(1)
  })

  it('요한계시록 방과 상관없이 새 게임에서도 보인다', () => {
    const s = newGame(CONTENT)
    expect(hillMailbox(s)).toEqual(HILL_MAILBOX)
  })
})
