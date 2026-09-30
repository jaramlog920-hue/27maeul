// 계획 9 작업 2: 별 보는 밤에 받는 장 — 맑은 밤 언덕 "별 보기"로 편지함에서 요한계시록을 한두 장씩
import { CONTENT, piecesOf } from '../content/catalog'
import { T } from '../content/text'
import { hillMailbox, HILL_MAILBOX, LANTERNS } from '../render/decor'
import { HILL_SPOTS } from './bonds'
import { isWet, weatherOf } from './calendar'
import { chooseBook, goToSleep, listen, newGame, stargaze, starsOut, type GameState } from './game'
import { POSTMAN, postCountOf, starPostCountOf, starPostFor } from './post'
import { deserialize, sanitize, serialize } from './save'
import { isWalkable, PLACES, tileAt } from './world'
import { postLine, starPostHint } from '../store/game-store'

const REV = piecesOf('rev')
const clear = (d: number) => !isWet(weatherOf(d)) && weatherOf(d) !== 'fog'
const DAYS = [...Array(200).keys()].map((d) => d + 1)
const CLEAR_DAYS = DAYS.filter(clear)
const WET_DAYS = DAYS.filter((d) => isWet(weatherOf(d)))
const FOG_DAYS = DAYS.filter((d) => weatherOf(d) === 'fog')
const chapterOf = (id: string) => Number(id.slice(-3))

/** 요한계시록 방까지 열리고 요한계시록을 고른 상태, 그날 그 시각 */
function revState(day: number, minute = 22 * 60): GameState {
  const s = newGame(CONTENT)
  const open = { ...s, clock: { day, minute }, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1, 'room:rev': 1 } }
  return chooseBook(open, 'rev', CONTENT)
}
const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { day, minute } })

describe('starPostFor — 아직 받지 않은 장을 장 순서대로 한 밤 1–2장', () => {
  it('한 밤 1장 또는 2장, 둘 다 나오고 같은 날은 같은 결과, 낮 편지 수와 곱수가 다르다', () => {
    const counts = new Set<number>()
    let differs = false
    for (const day of DAYS.slice(0, 60)) {
      const got = starPostFor({ day, book: 'rev', chapters: REV, delivered: [] })
      expect(got.length).toBe(starPostCountOf(day))
      expect(got).toEqual(REV.slice(0, got.length).map((p) => p.id))
      counts.add(got.length)
      if (got.length !== postCountOf(day)) differs = true
    }
    expect([...counts].sort()).toEqual([1, 2])
    expect(differs).toBe(true)
  })

  it('받은 장은 건너뛰고, 끝 장 다음엔 빈 배열', () => {
    const all = REV.map((p) => p.id)
    expect(starPostFor({ day: 1, book: 'rev', chapters: REV, delivered: all.slice(0, 21) })).toEqual(['rev-022'])
    expect(starPostFor({ day: 1, book: 'rev', chapters: REV, delivered: all })).toEqual([])
  })
})

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

describe('stargaze — 맑은 밤 별 보기로 편지함에서 꺼낸다', () => {
  it('① 맑은 밤 22:00 → 1장부터 1–2장, 같은 밤 두 번째는 없음, 다음 맑은 밤에 이어서', () => {
    const [d1, d2] = CLEAR_DAYS
    const r = stargaze(revState(d1), CONTENT)
    expect(r.pieceIds).toEqual(REV.slice(0, starPostCountOf(d1)).map((p) => p.id))
    for (const id of r.pieceIds) {
      expect(r.state.collected).toContain(id)
      expect(r.state.todayHeard).toContain(id)
      expect(r.state.progress.rev.arrangement[chapterOf(id)]).toEqual([id])
    }
    // 같은 밤 다시 보면 없다 (쉬기와 20분은 그대로)
    const again = stargaze(r.state, CONTENT)
    expect(again.pieceIds).toEqual([])
    expect(again.state.collected).toEqual(r.state.collected)
    expect(again.state.clock.minute).toBe(r.state.clock.minute + 20)
    // 다음 맑은 밤: 받은 다음 장부터
    const next = goToSleep(at(r.state, d2 - 1, 22 * 60), CONTENT)
    const r2 = stargaze(at(next, d2, 22 * 60), CONTENT)
    const n = r.pieceIds.length
    expect(r2.pieceIds).toEqual(REV.slice(n, n + starPostCountOf(d2)).map((p) => p.id))
  })

  it('② 낮 12:00·19:00에는 없음, 20:30에는 있음, 01:00에도 그 날 몫은 한 번뿐', () => {
    const d = CLEAR_DAYS[0]
    expect(stargaze(revState(d, 12 * 60), CONTENT).pieceIds).toEqual([])
    expect(stargaze(revState(d, 19 * 60), CONTENT).pieceIds).toEqual([])
    expect(stargaze(revState(d, 20 * 60 + 30), CONTENT).pieceIds.length).toBeGreaterThan(0)
    // 22:00에 받았으면 01:00(아직 같은 날)에는 없다
    const took = stargaze(revState(d), CONTENT).state
    expect(stargaze(at(took, d, 25 * 60), CONTENT).pieceIds).toEqual([])
    // 받지 않았으면 01:00에도 받는다
    expect(stargaze(revState(d, 25 * 60), CONTENT).pieceIds.length).toBeGreaterThan(0)
  })

  it('③ 비·눈·안개 날 밤에는 없음 — 궂은 밤 몫은 쌓이지 않는다', () => {
    expect(WET_DAYS.length).toBeGreaterThan(0)
    expect(FOG_DAYS.length).toBeGreaterThan(0)
    for (const d of [...WET_DAYS.slice(0, 5), ...FOG_DAYS.slice(0, 3)]) {
      const r = stargaze(revState(d), CONTENT)
      expect(r.pieceIds, `day ${d}`).toEqual([])
      expect(r.state.collected.some((id) => id.startsWith('rev-'))).toBe(false)
    }
    // 궂은 밤 뒤 맑은 밤: 밀린 몫 없이 그 밤 몫만
    const wet = WET_DAYS[0]
    const nextClear = CLEAR_DAYS.find((d) => d > wet)!
    const r = stargaze(revState(nextClear), CONTENT)
    expect(r.pieceIds.length).toBe(starPostCountOf(nextClear))
  })

  it('④ 지금 책이 다른 책이면 없음, 방이 닫혔으면 없음', () => {
    const d = CLEAR_DAYS[0]
    const rom = chooseBook(revState(d), 'rom', CONTENT)
    expect(rom.activeBook).toBe('rom')
    expect(stargaze(rom, CONTENT).pieceIds).toEqual([])
    const closed = revState(d)
    expect(stargaze({ ...closed, flags: { ...closed.flags, 'room:rev': 0 } }, CONTENT).pieceIds).toEqual([])
    // 방이 닫혀 있으면 요한계시록을 고를 수도 없다
    const s = newGame(CONTENT)
    expect(chooseBook(s, 'rev', CONTENT).activeBook).toBeNull()
  })

  it('맑은 밤 stars 장면은 전처럼 한 번 (편지를 받은 밤에도 함께)', () => {
    const d = CLEAR_DAYS[0]
    const r = stargaze(revState(d), CONTENT)
    expect(r.state.scenes).toContain('stars')
    expect(stargaze(r.state, CONTENT).state.scenes.filter((x) => x === 'stars')).toHaveLength(1)
  })
})

describe('⑤ 낮의 편지 나르는 이웃은 요한계시록을 건네지 않는다', () => {
  it('post가 비고, 편지 받기 말도 없고, 받을 것도 없다 — 대신 언덕 편지함 안내 한 줄', () => {
    const s = revState(CLEAR_DAYS[0], 10 * 60)
    expect(s.post).toEqual([])
    expect(s.offers).toEqual({})
    expect(postLine(s, POSTMAN)).toBeNull()
    const r = listen(s, POSTMAN, CONTENT)
    expect(r.pieceId).toBeNull()
    expect(goToSleep(s, CONTENT).post).toEqual([])
    expect(starPostHint(s, POSTMAN)).toBe(T.post.revHint)
    expect(starPostHint(s, 'baker')).toBeNull()
    // 다 받았으면 안내도 없다
    expect(starPostHint({ ...s, collected: REV.map((p) => p.id) }, POSTMAN)).toBeNull()
    // 다른 편지 책이면 안내 없음
    expect(starPostHint(chooseBook(s, 'rom', CONTENT), POSTMAN)).toBeNull()
  })

  it('저장에 요한계시록 post가 끼어 있어도 불러오면 빈다', () => {
    const s = revState(CLEAR_DAYS[0], 10 * 60)
    expect(sanitize({ ...s, post: ['rev-001', 'rev-002'] }, CONTENT).post).toEqual([])
  })
})

describe('⑥ 저장과 불러오기', () => {
  it('받은 장이 남고, 같은 밤 다시 받지 않는다', () => {
    const r = stargaze(revState(CLEAR_DAYS[0]), CONTENT)
    const back = deserialize(serialize(r.state), CONTENT)!
    for (const id of r.pieceIds) expect(back.collected).toContain(id)
    expect(back.activeBook).toBe('rev')
    expect(stargaze(back, CONTENT).pieceIds).toEqual([])
  })
})

/** 방이 열린 날부터 매일 밤 22:00 언덕에서 별 보기 → 22장을 다 받는 날 */
function daysToCollectAll(start: number): { days: number; clearNights: number } {
  let s = revState(start)
  let clearNights = 0
  for (let i = 0; i < 400; i++) {
    const day = start + i
    s = at(s, day, 22 * 60)
    const r = stargaze(s, CONTENT)
    if (r.pieceIds.length) clearNights++
    s = r.state
    if (REV.every((p) => s.collected.includes(p.id))) return { days: i + 1, clearNights }
    s = goToSleep(s, CONTENT)
  }
  throw new Error('never')
}

describe('⑦ 시뮬레이션 — 매일 밤 별을 보면 22장을 다 받는 날 수', () => {
  // 잰 값(2026-09-30): 1일에 열리면 맑은 밤 15번·16일. 1–112일(네 해 계절 한 바퀴씩) 어느 날에 열려도 맑은 밤 12–15번, 15–24일 (평균 약 20일)
  it('1일에 열리면 맑은 밤 15번·16일째에 22장을 다 받는다', () => {
    expect(daysToCollectAll(1)).toEqual({ days: 16, clearNights: 15 })
  })

  it('방이 열린 날이 1–112일 어느 날이어도 맑은 밤 12–15번, 24일 안에', () => {
    const runs = DAYS.slice(0, 112).map(daysToCollectAll)
    for (const r of runs) {
      expect(r.clearNights).toBeGreaterThanOrEqual(12)
      expect(r.clearNights).toBeLessThanOrEqual(15)
      expect(r.days).toBeGreaterThanOrEqual(15)
      expect(r.days).toBeLessThanOrEqual(24)
    }
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

  it('요한계시록 방이 열린 뒤부터 보인다', () => {
    const s = newGame(CONTENT)
    expect(hillMailbox(s)).toBeNull()
    expect(hillMailbox({ ...s, flags: { ...s.flags, 'room:rev': 1 } })).toEqual(HILL_MAILBOX)
  })
})
