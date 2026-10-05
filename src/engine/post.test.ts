// 편지 나르는 이웃과 편지 바구니. 계획 14 작업 5부터 편지는 드문 말씀 조각(fragments.ts)이고,
// 2026-10-06부터 27권 전체의 아직 없는 조각 하나다 (하루 2~3통·장 순서 배달은 없다)
import { CONTENT } from '../content/catalog'
import { isWet, weatherOf } from './calendar'
import { chooseBook, goToSleep, listen, neighborsPresent, newGame, type GameState } from './game'
import { fragmentWayOf } from './fragments'
import { POSTMAN } from './post'
import { deserialize, sanitize, serialize } from './save'
import { T } from '../content/text'
import { postLine, useGame } from '../store/game-store'

/** 네 복음서·사도행전을 꽂고 로마서–빌레몬서·히브리서–유다서 방이 열린 상태 */
function roomOpenState(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}

/** 그날로 옮겨 새 날을 맞는다 (goToSleep이 하루를 넘긴다) */
function wakeOn(s: GameState, day: number): GameState {
  return goToSleep({ ...s, clock: { ...s.clock, day: day - 1 } }, CONTENT)
}

describe('편지는 드물게 — 말씀 조각 하나 (계획 14 작업 5)', () => {
  it('편지 책을 골라도 편지가 차지 않는다 — 편지는 고른 책과 묶지 않는다', () => {
    const s = roomOpenState()
    expect(s.post).toEqual([])
    const rom = chooseBook(s, 'rom', CONTENT)
    expect(rom.post).toEqual([])
    expect(rom.offers).toEqual({})
  })

  it('편지 날에만 편지 한 통(조각 하나)이 오고, 한 주에 몇 번뿐이다', () => {
    let s = roomOpenState()
    let letters = 0
    for (let i = 0; i < 28; i++) {
      s = goToSleep(s, CONTENT)
      expect(s.post.length, `day ${s.clock.day}`).toBeLessThanOrEqual(1)
      if (fragmentWayOf(s.clock.day) === null) expect(s.post).toEqual([])
      letters += s.post.length
    }
    expect(letters).toBeGreaterThan(0)
    expect(letters).toBeLessThanOrEqual(4 * 3)
  })

  it('비 오는 날에도 편지 날이면 편지가 온다 (문 앞 편지 바구니)', () => {
    const wetLetterDays = [...Array(300).keys()].map((d) => d + 2).filter((d) => isWet(weatherOf(d)) && fragmentWayOf(d) === 'letter')
    expect(wetLetterDays.length).toBeGreaterThan(0)
    for (const day of wetLetterDays.slice(0, 3)) expect(wakeOn(roomOpenState(), day).post, `day ${day}`).toHaveLength(1)
  })

  it('편지 나르는 이웃은 오늘 나와 있어도 특별한 대화의 조각(offers)을 맡지 않는다', () => {
    let s = roomOpenState()
    for (let i = 0; i < 60; i++) {
      s = goToSleep(s, CONTENT)
      expect(s.offers[POSTMAN]).toBeUndefined()
    }
  })
})

describe('listen(postman) — 오늘 온 편지를 받는다', () => {
  const withPost = (ids: string[]): GameState => ({ ...roomOpenState(), post: ids })

  it('post가 collected·todayHeard에 들어가고 post가 빈다, 받은 기록은 편지로', () => {
    const s = withPost(['rom-001'])
    const r = listen(s, POSTMAN, CONTENT)
    expect(r.pieceIds).toEqual(['rom-001'])
    expect(r.pieceId).toBe('rom-001')
    expect(r.state.post).toEqual([])
    expect(r.state.collected).toContain('rom-001')
    expect(r.state.todayHeard).toContain('rom-001')
    expect(r.state.pieceLog['rom-001']).toEqual({ day: s.clock.day, from: 'letter' })
    expect(r.state.listened).toContain(POSTMAN)
    // 두 번 받지 않는다
    const twice = listen(r.state, POSTMAN, CONTENT)
    expect(twice.pieceId).toBeNull()
    expect(twice.state).toBe(r.state)
  })

  it('빌레몬서는 한 통에 통째로 받는다', () => {
    const r = listen(withPost(['phm-001']), POSTMAN, CONTENT)
    expect(r.state.collected).toContain('phm-001')
  })

  it('편지가 없는 날 편지 나르는 이웃에게 말을 걸어도 받을 것이 없다', () => {
    const s = withPost([])
    const r = listen(s, POSTMAN, CONTENT)
    expect(r.pieceId).toBeNull()
  })

  it('받은 뒤 책을 바꿔도 그날 또 오지 않는다', () => {
    const got = listen(withPost(['rom-001']), POSTMAN, CONTENT).state
    expect(chooseBook(got, '1co', CONTENT).post).toEqual([])
  })
})

describe('말 걸기 흐름 — 생활 말로 건넨다', () => {
  it('편지가 왔으면 "편지가 한 통 왔어요", 다른 이웃이나 편지 없는 날은 null', () => {
    const s = { ...roomOpenState(), post: ['rom-001'] }
    expect(postLine(s, POSTMAN)).toBe(T.word.letterBring)
    expect(postLine(s, 'baker')).toBeNull()
    expect(postLine({ ...s, post: [] }, POSTMAN)).toBeNull()
  })

  it('말을 걸면 편지를 바로 받는다 — 편지 책의 장은 대화 창에 편지 말 한 줄, 말씀 탭에 담겼다는 알림', () => {
    const s = { ...roomOpenState(), post: ['phm-001'] }
    useGame.getState().load(s)
    useGame.getState().talkTo(POSTMAN)
    const g = useGame.getState().game
    expect(g.post).toEqual([])
    expect(g.collected).toContain('phm-001')
    expect(useGame.getState().modal).toMatchObject({ kind: 'talk', neighborId: POSTMAN, letter: T.word.letterBring })
    expect(useGame.getState().toast?.text).toContain('말씀 탭에 담겼어요')
  })
})

describe('저장과 불러오기', () => {
  it('저장/불러오기 뒤 post가 남고, 없는 id·받은 id는 걸러진다 (고른 책과 상관없이)', () => {
    const s = { ...chooseBook(roomOpenState(), 'rom', CONTENT), post: ['mk-001-001'] }
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.post).toEqual(['mk-001-001'])
    const dirty = { ...s, post: ['nope-001', 'rom-001', '1co-001', 'rom-002'], collected: ['rom-001'] }
    expect(sanitize(dirty, CONTENT).post).toEqual(['1co-001', 'rom-002'])
  })

  it('post 칸이 없는 옛 저장도 빈 편지로 열린다', () => {
    const o = JSON.parse(serialize(newGame(CONTENT)))
    delete o.post
    const back = deserialize(JSON.stringify(o), CONTENT)!
    expect(back).not.toBeNull()
    expect(back.post).toEqual([])
    const bad = deserialize(JSON.stringify({ ...o, post: 'rom-001' }), CONTENT)!
    expect(bad.post).toEqual([])
  })

  it('편지 나르는 이웃은 그날 나와 있다 (편지 날의 바구니와 같은 편지)', () => {
    const s = roomOpenState()
    expect(neighborsPresent(s, CONTENT)).toContain(POSTMAN)
  })
})
