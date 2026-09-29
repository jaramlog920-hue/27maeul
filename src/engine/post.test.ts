// 계획 7 작업 2: 편지 나르는 이웃이 편지를 장째로 — 하루 두세 통
import { CONTENT, piecesOf } from '../content/catalog'
import { isWet, weatherOf } from './calendar'
import { chooseBook, goToSleep, listen, neighborsPresent, newGame, type GameState } from './game'
import { POSTMAN, postCountOf, postForDay } from './post'
import { deserialize, sanitize, serialize } from './save'
import { LETTERS } from './types'
import { postLine, useGame } from '../store/game-store'

/** 네 복음서·사도행전을 꽂고 로마서–빌레몬서 방이 열린 상태 */
function roomOpenState(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}

/** 그날로 옮겨 새 날을 맞는다 (goToSleep이 하루를 넘긴다) */
function wakeOn(s: GameState, day: number): GameState {
  return goToSleep({ ...s, clock: { ...s.clock, day: day - 1 } }, CONTENT)
}

const chapterOf = (id: string) => Number(id.slice(-3))

describe('postForDay — 아직 받지 않은 장을 장 번호 순서대로 하루 두세 통', () => {
  const rom = piecesOf('rom')

  it('하루 2통 또는 3통, 날마다 둘 다 나온다 — 같은 날은 같은 결과', () => {
    const counts = new Set<number>()
    for (let day = 1; day <= 60; day++) {
      const got = postForDay({ day, book: 'rom', chapters: rom, delivered: [] })
      expect([2, 3], `day ${day}`).toContain(got.length)
      expect(got.length).toBe(postCountOf(day))
      counts.add(got.length)
      expect(postForDay({ day, book: 'rom', chapters: rom, delivered: [] })).toEqual(got)
    }
    expect([...counts].sort()).toEqual([2, 3])
  })

  it('앞에서부터 장 순서대로 — 받은 장은 건너뛴다 (조각 순서가 섞여 있어도)', () => {
    const shuffled = [...rom].reverse()
    const day = [...Array(40).keys()].find((d) => postCountOf(d + 1) === 3)! + 1
    expect(postForDay({ day, book: 'rom', chapters: shuffled, delivered: [] })).toEqual(['rom-001', 'rom-002', 'rom-003'])
    expect(postForDay({ day, book: 'rom', chapters: rom, delivered: ['rom-001', 'rom-002', 'rom-004'] })).toEqual(['rom-003', 'rom-005', 'rom-006'])
  })

  it('남은 장이 적으면 남은 것 전부, 끝 장 다음엔 빈 배열', () => {
    const all = rom.map((p) => p.id)
    for (let day = 1; day <= 10; day++) {
      expect(postForDay({ day, book: 'rom', chapters: rom, delivered: all.slice(0, 15) })).toEqual(['rom-016'])
      expect(postForDay({ day, book: 'rom', chapters: rom, delivered: all })).toEqual([])
    }
  })

  it('빌레몬서(1장)는 한 통에 통째로', () => {
    const phm = piecesOf('phm')
    expect(phm).toHaveLength(1)
    for (let day = 1; day <= 10; day++) expect(postForDay({ day, book: 'phm', chapters: phm, delivered: [] })).toEqual(['phm-001'])
  })

  it('다른 책의 조각은 섞지 않는다', () => {
    expect(postForDay({ day: 3, book: 'gal', chapters: [...piecesOf('rom'), ...piecesOf('gal')], delivered: [] }).every((id) => id.startsWith('gal-'))).toBe(true)
  })
})

describe('편지 나르는 이웃만 편지를 건넨다', () => {
  it('편지 책을 고르면 오늘 편지(post)가 차고, 다른 이웃의 조각(offers)은 없다', () => {
    const s = roomOpenState()
    expect(s.post).toEqual([])
    const rom = chooseBook(s, 'rom', CONTENT)
    expect(rom.offers).toEqual({})
    expect(rom.post).toEqual(postForDay({ day: s.clock.day, book: 'rom', chapters: piecesOf('rom'), delivered: [] }))
    expect(rom.post[0]).toBe('rom-001')
    // 다른 이웃은 아무것도 건네지 않는다
    for (const id of neighborsPresent(rom, CONTENT).filter((x) => x !== POSTMAN)) {
      const r = listen(rom, id, CONTENT)
      expect(r.pieceId, id).toBeNull()
      expect(r.state).toBe(rom)
    }
  })

  it('편지 책이 아니면 post는 비고, 편지 나르는 이웃은 다른 이웃처럼 조각 하나를 건넬 수 있다', () => {
    const s = roomOpenState()
    const mk = chooseBook(s, 'mk', CONTENT)
    expect(mk.post).toEqual([])
    const again = goToSleep(mk, CONTENT)
    expect(again.post).toEqual([])
    // 편지 책에서 복음서로 바꾸면 오늘 편지는 비운다
    expect(chooseBook(chooseBook(s, 'rom', CONTENT), 'mk', CONTENT).post).toEqual([])
  })

  it('새 날마다 이어서 가져온다 — 받은 다음 장부터', () => {
    let s = chooseBook(roomOpenState(), 'rom', CONTENT)
    const seen: number[] = []
    for (let i = 0; i < 12 && s.post.length; i++) {
      expect(s.post.length === 2 || s.post.length === 3 || s.post.length === 16 - seen.length).toBe(true)
      s = listen(s, POSTMAN, CONTENT).state
      expect(s.post).toEqual([])
      seen.push(...s.collected.filter((id) => id.startsWith('rom-')).map(chapterOf).filter((c) => !seen.includes(c)))
      s = goToSleep(s, CONTENT)
    }
    expect(seen).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
    // 끝 장 다음엔 가져올 것이 없다
    expect(s.post).toEqual([])
  })

  it('받지 않고 자면 다음 날 같은 장부터 다시 가져온다', () => {
    const s = chooseBook(roomOpenState(), 'rom', CONTENT)
    const next = goToSleep(s, CONTENT)
    expect(next.post[0]).toBe('rom-001')
  })

  it('비 오는 날에도 나와 있어 편지가 끊기지 않는다', () => {
    const wetDays = [...Array(120).keys()].map((d) => d + 2).filter((d) => isWet(weatherOf(d)))
    expect(wetDays.length).toBeGreaterThan(0)
    const base = chooseBook(roomOpenState(), 'rom', CONTENT)
    for (const day of wetDays.slice(0, 5)) {
      const s = wakeOn(base, day)
      expect(s.clock.day).toBe(day)
      expect(neighborsPresent(s, CONTENT), `day ${day}`).toContain(POSTMAN)
      expect(s.post.length, `day ${day}`).toBeGreaterThan(0)
    }
  })
})

describe('listen(postman) — 한꺼번에 받는다', () => {
  it('post가 모두 collected·todayHeard에 들어가고 post가 빈다', () => {
    const s = chooseBook(roomOpenState(), 'rom', CONTENT)
    const post = s.post
    const r = listen(s, POSTMAN, CONTENT)
    expect(r.pieceIds).toEqual(post)
    expect(r.pieceId).toBe(post[0])
    expect(r.state.post).toEqual([])
    for (const id of post) {
      expect(r.state.collected).toContain(id)
      expect(r.state.todayHeard).toContain(id)
    }
    expect(r.state.listened).toContain(POSTMAN)
    // 두 번 받지 않는다
    const twice = listen(r.state, POSTMAN, CONTENT)
    expect(twice.pieceId).toBeNull()
    expect(twice.state).toBe(r.state)
  })

  it('빌레몬서는 한 통에 통째로 받는다', () => {
    const s = chooseBook(roomOpenState(), 'phm', CONTENT)
    expect(s.post).toEqual(['phm-001'])
    const r = listen(s, POSTMAN, CONTENT)
    expect(r.state.collected).toContain('phm-001')
    expect(goToSleep(r.state, CONTENT).post).toEqual([])
  })

  it('책을 바꿔도 같은 날 또 받지 않는다 (listened)', () => {
    const got = listen(chooseBook(roomOpenState(), 'rom', CONTENT), POSTMAN, CONTENT).state
    expect(chooseBook(got, '1co', CONTENT).post).toEqual([])
    expect(chooseBook(got, 'rom', CONTENT).post).toEqual([])
    // 다음 날에는 다시 온다
    const next = goToSleep(chooseBook(got, '1co', CONTENT), CONTENT)
    expect(next.post[0]).toBe('1co-001')
  })

  it('오늘 복음서 조각을 건넨 뒤 편지 책으로 바꾸면 그날은 편지가 없다', () => {
    const mk = chooseBook(roomOpenState(), 'mk', CONTENT)
    const r = listen(mk, POSTMAN, CONTENT)
    if (r.pieceId) expect(chooseBook(r.state, 'rom', CONTENT).post).toEqual([])
    else expect(chooseBook({ ...mk, listened: [POSTMAN] }, 'rom', CONTENT).post).toEqual([])
  })
})

describe('말 걸기 흐름 — 생활 말로 건넨다', () => {
  it('가져온 편지가 있으면 "편지 n통 가져왔어요", 한 통이면 장 하나, 없으면 null', () => {
    const s = roomOpenState()
    const rom = chooseBook(s, 'rom', CONTENT)
    const last = rom.post.length
    expect(postLine(rom, POSTMAN)).toBe(`편지 ${last}통 가져왔어요. 로마서 1–${last}장이에요.`)
    expect(postLine(chooseBook(s, 'phm', CONTENT), POSTMAN)).toBe('편지 한 통 가져왔어요. 빌레몬서 1장이에요.')
    expect(postLine(rom, 'baker')).toBeNull()
    expect(postLine(chooseBook(s, 'mk', CONTENT), POSTMAN)).toBeNull()
  })

  it('편지 받기: 한꺼번에 받고 창을 닫는다', () => {
    const rom = chooseBook(roomOpenState(), 'rom', CONTENT)
    useGame.getState().load(rom)
    useGame.setState({ modal: { kind: 'talk', neighborId: POSTMAN, line: postLine(rom, POSTMAN)! } })
    useGame.getState().listenTo(POSTMAN)
    const g = useGame.getState().game
    expect(g.post).toEqual([])
    for (const id of rom.post) expect(g.collected).toContain(id)
    expect(useGame.getState().modal).toBeNull()
    expect(useGame.getState().toast?.text).toBe(`편지 ${rom.post.length}통을 받았어요.`)
  })
})

describe('저장과 불러오기', () => {
  it('저장/불러오기 뒤 post가 남고, 없는 id·받은 id·다른 책 id는 걸러진다', () => {
    const s = chooseBook(roomOpenState(), 'rom', CONTENT)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.post).toEqual(s.post)
    const dirty = { ...s, post: ['nope-001', 'rom-001', '1co-001', 'mk-001-01', 'rom-002'], collected: ['rom-001'] }
    expect(sanitize(dirty, CONTENT).post).toEqual(['rom-002'])
  })

  it('편지 책이 아니거나 방이 닫혀 고른 책이 비면 post도 빈다', () => {
    const s = chooseBook(roomOpenState(), 'rom', CONTENT)
    const closed = { ...s, flags: { ...s.flags, 'room:romPhm': 0 } }
    expect(sanitize(closed, CONTENT).post).toEqual([])
    expect(sanitize({ ...s, activeBook: 'mk' }, CONTENT).post).toEqual([])
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

  it('열세 권 모두 첫날 편지는 1장부터', () => {
    const s = roomOpenState()
    for (const b of LETTERS) expect(chooseBook(s, b, CONTENT).post[0], b).toBe(`${b}-001`)
  })
})
