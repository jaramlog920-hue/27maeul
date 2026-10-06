// 계획 20 작업 5: 구약 필사 — 신약과 같은 엔진, 보상·막힘 없음, 새 터 서고 책상·책장
import { CONTENT, chapterGuide, copySourceFor } from '../content/catalog'
import { ensureOtBook } from '../content/ot-catalog'
import { SCENES } from '../content/text'
import { useGame } from '../store/game-store'
import { bookDone, chaptersOf, otBookFinished, progressOf } from './books'
import { copySpot, copyVerses, isCopiedChapter, sanitizeCopy } from './copying'
import { goToSleep, newGame, playerTile, saveCopyDraft, startCopy, syncHome, tapTile, tick, travel, writeVerse, type GameEvent, type GameState } from './game'
import { setActiveMap } from './maps'
import { findPath } from './movement'
import { newlandRevealedOn, newlandTileAt, setNewlandOpen, setNewlandRevealed } from './newland'
import { INTERIOR_DESK, INTERIOR_ENTRY, INTERIOR_SHELF } from './newland-config'
import { OT_BOOKS, otRow } from './ot-books'
import { deserialize, serialize } from './save'
import { PLACES, placeAt } from './world'

const zero = () => 0

/** 새 터를 받은 저장 (구약 칸이 열린다) */
function gifted(extra: Partial<GameState> = {}): GameState {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], flags: { ...s.flags, newlandGift: 1 }, ...extra }
}
/** 지금 자리의 한 절을 맞게 써서 기록한다 */
function writeOne(s: GameState, book: Parameters<typeof writeVerse>[1]) {
  const spot = copySpot(s, book, CONTENT)!
  return writeVerse(s, book, spot.verse.text, CONTENT)
}
/** 그 책의 지금 장을 끝까지 쓴다 (마지막 결과도 함께) */
function writeChapter(s: GameState, book: Parameters<typeof writeVerse>[1]) {
  let g = s
  const first = copySpot(g, book, CONTENT)!.chapter
  let result: ReturnType<typeof writeVerse>['result'] = { kind: 'none' }
  for (let i = 0; i < 2000; i++) {
    const spot = copySpot(g, book, CONTENT)
    if (!spot || spot.chapter !== first) break
    const r = writeOne(g, book)
    g = r.state
    result = r.result
  }
  return { state: g, result }
}

beforeAll(async () => {
  await Promise.all((['gen', 'oba', 'rut'] as const).map((b) => ensureOtBook(b)))
})
afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
  setNewlandRevealed(true)
})

describe('구약 필사 — 한 절씩', () => {
  it('안 불러온 구약 책은 장도 절도 빈 목록이다 (책상이 먼저 불러온다) — 이 파일에서 lam은 전수 테스트 전까지 안 불러온다', () => {
    expect(chaptersOf('lam', CONTENT)).toEqual([])
    expect(copyVerses('lam', 1, CONTENT)).toEqual([])
    expect(copySpot(gifted(), 'lam', CONTENT)).toBeNull()
    expect(startCopy(gifted(), 'lam', CONTENT).copy.book).toBeNull()
  })

  it('새 터를 받은 뒤 구약 책을 고르고 한 절을 쓰면 다음 절로 넘어간다', () => {
    const s = startCopy(gifted(), 'gen', CONTENT)
    expect(s.copy.book).toBe('gen')
    const first = copySpot(s, 'gen', CONTENT)!
    expect([first.chapter, first.verse.verse]).toEqual([1, 1])
    const r = writeOne(s, 'gen')
    expect(r.result).toEqual({ kind: 'verse', chapter: 1, verse: 1 })
    const next = copySpot(r.state, 'gen', CONTENT)!
    expect([next.chapter, next.verse.verse]).toEqual([1, 2])
    expect(r.state.otCopyStats).toMatchObject({ verses: 1 })
    expect(r.state.copyStats.verses).toBe(0)
  })

  it('틀린 입력은 기록하지 않고 쓰다 만 입력만 저장, 붙여넣기는 받지 않는다 (신약과 같은 코드)', () => {
    const s = startCopy(gifted(), 'gen', CONTENT)
    const bad = writeVerse(s, 'gen', '태초에 하나님이 하늘을', CONTENT)
    expect(bad.result.kind).toBe('notYet')
    expect(copySpot(bad.state, 'gen', CONTENT)!.draft).toBe('태초에 하나님이 하늘을')
    expect(bad.state.otCopyStats).toBeUndefined()
    // 붙여넣은 입력(정답 전체)도 받지 않는다 — 앞의 쓰다 만 입력 그대로
    const text = copySpot(s, 'gen', CONTENT)!.verse.text
    const pasted = writeVerse(bad.state, 'gen', text, CONTENT, true)
    expect(pasted.result.kind).toBe('notYet')
    expect(copySpot(pasted.state, 'gen', CONTENT)!.verse.verse).toBe(1)
    expect(pasted.state.otCopyStats).toBeUndefined()
  })

  it('초안 저장·복구: 나갔다 와도 그 절, 그 입력부터', () => {
    let s = startCopy(gifted(), 'gen', CONTENT)
    s = saveCopyDraft(s, 'gen', '태초에', CONTENT)
    expect(s.copy.at.gen).toEqual({ chapter: 1, verse: 1, draft: '태초에' })
    const back = deserialize(serialize(s), CONTENT)!
    expect(copySpot(back, 'gen', CONTENT)!.draft).toBe('태초에')
    // 붙여넣기 표식이 있으면 초안도 바꾸지 않는다
    expect(copySpot(saveCopyDraft(s, 'gen', '태초에 하나님이 천지를 창조하시니라', CONTENT, true), 'gen', CONTENT)!.draft).toBe('태초에')
  })

  it('장을 마치면 otProgress에 들어가고, 책을 다 마치면 책 완료 표시 (책장 전시용)', () => {
    const s = startCopy(gifted(), 'oba', CONTENT)
    expect(otBookFinished(s, 'oba')).toBe(false)
    const r = writeChapter(s, 'oba')
    expect(r.result).toMatchObject({ kind: 'chapter', chapter: 1, bookDone: true, next: null, finds: [], gains: { wit: 0, hand: 0 } })
    expect(r.state.otProgress?.oba?.completed).toEqual([1])
    expect(progressOf(r.state, 'oba').completed).toEqual([1])
    expect(r.state.progress).toEqual(s.progress) // 신약 27키는 그대로
    expect(Object.keys(r.state.progress)).toHaveLength(27)
    expect(bookDone(r.state, 'oba', CONTENT)).toBe(true)
    expect(otBookFinished(r.state, 'oba')).toBe(true)
    expect(isCopiedChapter(r.state.copy, 'oba', 1)).toBe(true)
    expect(r.state.copy.days?.oba).toMatchObject({ start: s.clock.day, end: s.clock.day })
    expect(r.state.otCopyStats).toMatchObject({ chapters: 1, books: 1 })
    expect(copySpot(r.state, 'oba', CONTENT)).toBeNull()
  })

  it('여러 장 책(룻기): 한 장을 마치면 다음 장 첫 절로, 책은 아직 끝나지 않았다', () => {
    const s = startCopy(gifted(), 'rut', CONTENT)
    const r = writeChapter(s, 'rut')
    expect(r.result).toMatchObject({ kind: 'chapter', chapter: 1, bookDone: false, next: 2 })
    expect(copySpot(r.state, 'rut', CONTENT)).toMatchObject({ chapter: 2, index: 0 })
    expect(otBookFinished(r.state, 'rut')).toBe(false)
  })

  it('구약 첫 절을 쓰면 새 터의 땅이 드러나고, 지도 칸도 바로 맞춰진다', () => {
    const s = startCopy(gifted(), 'gen', CONTENT)
    setNewlandRevealed(false)
    expect(s.flags.newlandRevealed).toBeUndefined()
    const r = writeOne(s, 'gen')
    expect(r.state.flags.newlandRevealed).toBe(1)
    expect(newlandRevealedOn()).toBe(true)
    // 신약 한 절은 땅을 드러내지 않는다
    expect(writeOne(startCopy(gifted(), 'mt', CONTENT), 'mt').state.flags.newlandRevealed).toBeUndefined()
  })
})

describe('구약 필사 — 보상 없음, 시간·피로만 신약과 같다', () => {
  it('장을 마쳐도 닢·가방·상자·능력치·하나님 기록·장면·신약 기록이 변하지 않는다', () => {
    const base = startCopy(gifted({ coins: 17, inv: { olive: 2 } }), 'oba', CONTENT)
    const r = writeChapter(base, 'oba')
    const a = r.state
    expect(a.coins).toBe(base.coins)
    expect(a.inv).toEqual(base.inv)
    expect(a.chest).toEqual(base.chest)
    expect(a.stats).toEqual(base.stats)
    expect(a.godRecords).toEqual(base.godRecords)
    expect(a.scenes).toEqual(base.scenes)
    expect(a.copyStats).toEqual(base.copyStats)
    expect(a.dayLog).toEqual(base.dayLog)
    expect(a.found).toEqual(base.found)
    expect(a.shelved).toEqual(base.shelved)
    expect(a.bound).toEqual(base.bound)
    // 장면 문구에 구약 필사 장면이 없다
    expect(a.scenes.some((id) => id === 'firstChapter' || id === 'bookBound')).toBe(false)
    expect(Object.keys(SCENES)).toContain('firstChapter')
  })

  it('시간과 피로는 같은 크기의 신약 장과 똑같이 흐른다', () => {
    const start = gifted()
    const ot = writeChapter(startCopy(start, 'oba', CONTENT), 'oba').state
    // 신약 한 장짜리 책: 유다서
    const nt = writeChapter(startCopy(start, 'jud', CONTENT), 'jud').state
    expect(ot.clock).toEqual(nt.clock)
    expect(ot.needs).toEqual(nt.needs)
    expect(ot.clock.minute).toBeGreaterThan(start.clock.minute)
    expect(ot.needs.fatigue).toBeGreaterThan(start.needs.fatigue)
    // 신약은 경험치·하나님 기록이 변한다 (비교용 확인)
    expect(nt.stats).not.toEqual(start.stats)
  })
})

describe('구약 필사 — 막힘 없음', () => {
  it('닢 0·기름 0·재료 0·피로 최대·건물 0채·새 터에 한 번도 안 가도 집 책상 상태로 쓸 수 있다', () => {
    const s = startCopy(gifted({ coins: 0, inv: {}, chest: {}, needs: { hunger: 100, fatigue: 100, cold: 100, heat: 100 } }), 'gen', CONTENT)
    expect(s.map).toBeUndefined()
    expect(s.flags.newlandVisited).toBeUndefined()
    const r = writeOne(s, 'gen')
    expect(r.result.kind).toBe('verse')
    expect(r.state.coins).toBe(0)
    const done = writeChapter(startCopy(gifted({ coins: 0, inv: {}, needs: { hunger: 100, fatigue: 100, cold: 100, heat: 100 } }), 'oba', CONTENT), 'oba')
    expect(done.result.kind).toBe('chapter')
    expect(done.state.needs.fatigue).toBe(100)
  })

  it('밤·비 오는 날에도 쓸 수 있다 (등잔·기름을 쓰지 않는다)', () => {
    const s = startCopy(gifted({ clock: { day: 3, minute: 23 * 60 }, inv: {} }), 'gen', CONTENT)
    const r = writeOne(s, 'gen')
    expect(r.result.kind).toBe('verse')
    expect(r.state.inv).toEqual({})
  })
})

describe('구약 개방 전', () => {
  it('새 터를 받기 전에는 구약 책을 고를 수 없다 (엔진)', () => {
    const s = newGame(CONTENT)
    expect(startCopy(s, 'gen', CONTENT)).toBe(s)
  })

  it('받기 전 저장에 구약 책이 골라져 있으면 불러올 때 비운다 (자리는 남는다)', () => {
    const s = gifted()
    const withBook = { ...s, copy: { ...s.copy, book: 'gen' as const, at: { gen: { chapter: 2, verse: 3 } } } }
    const closed = { ...withBook, flags: { ...withBook.flags, newlandGift: 0 } }
    const back = deserialize(serialize(closed), CONTENT)!
    expect(back.copy.book).toBeNull()
    expect(back.copy.at.gen).toEqual({ chapter: 2, verse: 3 })
    // 받은 뒤라면 그대로
    expect(deserialize(serialize(withBook), CONTENT)!.copy.book).toBe('gen')
  })
})

describe('저장·불러오기·옛 저장', () => {
  it('otProgress·otCopyStats·구약 자리가 저장을 거쳐도 그대로', () => {
    const r = writeChapter(startCopy(gifted(), 'rut', CONTENT), 'rut')
    const back = deserialize(serialize(r.state), CONTENT)!
    expect(back.otProgress?.rut?.completed).toEqual([1])
    expect(back.otCopyStats).toEqual(r.state.otCopyStats)
    expect(back.copy.at.rut).toEqual(r.state.copy.at.rut)
    expect(back.copy.copied?.rut).toEqual([1])
    expect(back.copy.days?.rut?.start).toBe(r.state.clock.day)
  })

  it('옛 저장(otProgress·otCopyStats 없음)은 빈 구약 진행으로 읽힌다 — 신약은 그대로', () => {
    const old = gifted()
    expect('otProgress' in old).toBe(false)
    const back = deserialize(serialize(old), CONTENT)!
    expect(back.otProgress).toBeUndefined()
    expect(back.otCopyStats).toBeUndefined()
    expect(progressOf(back, 'gen').completed).toEqual([])
    expect(Object.keys(back.progress)).toHaveLength(27)
    expect(back.copyStats).toEqual(old.copyStats)
  })

  it('잘못된 구약 진행은 걸러낸다: 장 수 밖·중복·모르는 책', () => {
    const s = gifted()
    const raw = JSON.parse(serialize(s))
    raw.otProgress = { oba: { completed: [1, 1, 2, 0, -1, 'x'] }, gen: { completed: [3, 1, 99, 3] }, zzz: { completed: [1] }, exo: 'bad' }
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(back.otProgress).toEqual({ oba: { completed: [1], arrangement: {} }, gen: { completed: [1, 3], arrangement: {} } })
  })

  it('필사 정리: 구약에는 예전에 엮은 장(legacy)이 없다', () => {
    const progress = newGame(CONTENT).progress
    const c = sanitizeCopy({ book: 'gen', at: {}, legacy: { gen: [1], mt: [] }, copied: { gen: [1] } }, progress, { gen: { completed: [1], arrangement: {} } })
    expect(c.legacy).toEqual({})
    expect(c.copied).toEqual({ gen: [1] })
    expect(c.book).toBe('gen')
  })
})

describe('구약 본문 전수', () => {
  it('모든 구약 책의 장 수가 불러온 데이터와 같고, 모든 장에 필사할 절이 있다 (시편 119편 포함)', async () => {
    let total = 0
    for (const b of OT_BOOKS) {
      await ensureOtBook(b)
      const chapters = chaptersOf(b, CONTENT)
      expect(chapters, b).toHaveLength(otRow(b).chapters)
      expect(copySourceFor(b).chapters, b).toHaveLength(otRow(b).chapters)
      for (const c of chapters) {
        const v = copyVerses(b, c, CONTENT)
        expect(v.length, `${b} ${c}`).toBeGreaterThan(0)
        total++
      }
    }
    expect(total).toBe(929)
    expect(copyVerses('psa', 119, CONTENT)).toHaveLength(176)
  }, 60_000)

  it('chapterGuide(구약, n)은 전부 null — 안내 상자가 나오지 않는다', () => {
    for (const b of OT_BOOKS) for (let c = 1; c <= otRow(b).chapters; c++) expect(chapterGuide(b, c)).toBeNull()
  })
})

describe('빈칸 오답 보기: 66권 전체를 본다 (해시 목록)', () => {
  it('구약 책의 countAnywhere가 다른 구약 책·신약의 실제 본문을 센다 — 그 책 안(countVerse)에는 없어도', async () => {
    await ensureOtBook('psa')
    const psa = copyVerses('psa', 23, CONTENT)[0].text
    const gen = copySourceFor('gen')
    expect(gen.countVerse(psa)).toBe(0)
    expect(gen.countAnywhere(psa)).toBeGreaterThan(0)
    // 신약 본문도 (마태복음 1:1)
    const mt = copyVerses('mt', 1, CONTENT)[0].text
    expect(gen.countVerse(mt)).toBe(0)
    expect(gen.countAnywhere(mt)).toBeGreaterThan(0)
    // 어디에도 없는 글은 0
    expect(gen.countAnywhere('이 문장은 어느 책에도 없다 하나 둘 셋')).toBe(0)
  })

  it('신약 쪽 결과는 그대로: 신약 책의 countAnywhere는 신약만 센다', () => {
    const psa = copyVerses('psa', 23, CONTENT)[0].text
    expect(copySourceFor('mt').countAnywhere(psa)).toBe(0)
  })
})

describe('새 터 서고 안 책상·책장', () => {
  /** 서고 안 문 앞에 서 있는 상태 */
  function inside(): GameState {
    const g = gifted({ clock: { day: 5, minute: 10 * 60 } })
    const there = travel(g, 'newland', CONTENT)
    syncHome(there)
    return { ...there, player: { ...there.player, x: INTERIOR_ENTRY.x, y: INTERIOR_ENTRY.y, path: [], facing: 'up' } }
  }

  it('서고 입구에서 책상 앞·책장 앞까지 길이 있고, 칸은 책상·책장으로 읽힌다', () => {
    const s = inside()
    syncHome(s)
    expect(placeAt(INTERIOR_DESK.tile)).toBe('otDesk')
    expect(placeAt(INTERIOR_SHELF.tile)).toBe('otShelf')
    expect(findPath(INTERIOR_ENTRY, INTERIOR_DESK.stand)).not.toBeNull()
    expect(findPath(INTERIOR_ENTRY, INTERIOR_SHELF.stand)).not.toBeNull()
    expect(PLACES.otDesk.stand).toEqual(INTERIOR_DESK.stand)
  })

  it('첫 마을에서는 같은 좌표가 책상이 아니다 (새 터에서만 켜진다)', () => {
    syncHome(newGame(CONTENT))
    expect(placeAt(INTERIOR_DESK.tile)).not.toBe('otDesk')
    expect(placeAt(INTERIOR_SHELF.tile)).not.toBe('otShelf')
  })

  it('책상을 누르면 걸어가 닿고 arrived(otDesk)가 온다', () => {
    let g = tapTile(inside(), INTERIOR_DESK.tile)
    expect(g.target).toMatchObject({ kind: 'place', id: 'otDesk' })
    const events: GameEvent[] = []
    for (let i = 0; i < 400 && !events.some((e) => e.type === 'arrived'); i++) {
      const r = tick(g, 0.05, zero, CONTENT)
      g = r.state
      events.push(...r.events)
    }
    expect(events.find((e) => e.type === 'arrived')).toMatchObject({ target: { kind: 'place', id: 'otDesk' } })
    expect(playerTile(g)).toEqual(INTERIOR_DESK.stand)
  })

  it('화면: 책상은 구약 칸의 필사 책상, 책장은 작은 책장 창을 연다', () => {
    useGame.setState({ game: inside(), modal: null, rng: zero, decorating: null, toast: null })
    useGame.getState().tap(INTERIOR_DESK.tile)
    for (let i = 0; i < 400 && !useGame.getState().modal; i++) useGame.getState().frame(0.05)
    expect(useGame.getState().modal).toEqual({ kind: 'copy', view: 'pick', tab: 'ot' })
    useGame.setState({ modal: null })
    useGame.getState().tap(INTERIOR_SHELF.tile)
    for (let i = 0; i < 400 && !useGame.getState().modal; i++) useGame.getState().frame(0.05)
    expect(useGame.getState().modal).toEqual({ kind: 'otShelf' })
  })

  it('땅 둘러보기(lookAround)도 칸 그림을 바로 맞춘다', () => {
    useGame.setState({ game: inside(), modal: null, rng: zero })
    setNewlandRevealed(false)
    expect(newlandTileAt(20, 20)).toBe('T')
    useGame.getState().lookAround()
    expect(useGame.getState().game.flags.newlandRevealed).toBe(1)
    expect(newlandRevealedOn()).toBe(true)
    expect(newlandTileAt(20, 20)).not.toBe('T')
  })

  it('필사와 건축·새 터 방문은 서로의 조건이 아니다: 잠자기를 거쳐도 구약 자리가 그대로', () => {
    const r = writeOne(startCopy(gifted(), 'gen', CONTENT), 'gen')
    const slept = goToSleep({ ...r.state, clock: { ...r.state.clock, minute: 22 * 60 } }, CONTENT)
    expect(copySpot(slept, 'gen', CONTENT)).toMatchObject({ chapter: 1, verse: { verse: 2 } })
  })
})
