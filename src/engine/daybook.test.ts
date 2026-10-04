// 계획 14 작업 6: 잠들기 전 오늘의 기록
import { CONTENT } from '../content/catalog'
import { VISIT_FROM, VISIT_GIFTS } from './bonds'
import { copySpot } from './copying'
import { emptyDayLog, isFamilyNote, logGift, logOf, sanitizeDayLog, todayDiary } from './daybook'
import { goToSleep, newGame, NO_TODAY, receiveVisit, writeVerse, type GameState } from './game'
import { deserialize, serialize } from './save'
import type { Book } from './types'

const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), scenes: [], ...patch })

function writeChapter(s: GameState, book: Book) {
  let r = writeVerse(s, book, copySpot(s, book, CONTENT)!.verse.text, CONTENT)
  while (r.result.kind === 'verse') r = writeVerse(r.state, book, copySpot(r.state, book, CONTENT)!.verse.text, CONTENT)
  return r
}

describe('오늘의 기록 — 그날 있었던 일만', () => {
  it('아무 일도 없던 날은 일기가 없다 (null)', () => {
    expect(todayDiary(fresh())).toBeNull()
  })

  it('필사로 마친 장은 그날 기록에 남는다 — 책 순서, 장 순서', () => {
    let s = fresh()
    s = writeChapter(s, 'jn').state
    s = writeChapter(s, 'mt').state
    s = writeChapter(s, 'mt').state
    expect(logOf(s).chapters).toEqual(['jn:1', 'mt:1', 'mt:2'])
    expect(todayDiary(s)!.chapters).toEqual([
      { book: 'mt', chapters: [1, 2] },
      { book: 'jn', chapters: [1] },
    ])
  })

  it('절만 쓰고 장을 마치지 않았으면 적지 않는다', () => {
    const s = writeVerse(fresh(), 'mt', copySpot(fresh(), 'mt', CONTENT)!.verse.text, CONTENT).state
    expect(todayDiary(s)).toBeNull()
  })

  it('아침에 들른 이웃이 두고 간 것은 받은 선물로 남는다', () => {
    const visitor = Object.keys(VISIT_GIFTS)[0]
    const s = fresh({ clock: { day: 3, minute: VISIT_FROM + 10 }, today: { ...NO_TODAY, visitor } })
    const got = receiveVisit(s, visitor)!
    expect(todayDiary(got.state)!.gifts).toEqual([{ from: visitor, items: VISIT_GIFTS[visitor] }])
  })

  it('같은 이웃의 선물은 한 줄에 모은다', () => {
    let s = fresh()
    s = logGift(s, 'baker', { bread: 1 })
    s = logGift(s, 'baker', { bread: 2, fig: 1 })
    s = logGift(s, 'shepherd', { wool: 1 })
    expect(logOf(s).gifts).toEqual([
      { from: 'baker', items: { bread: 3, fig: 1 } },
      { from: 'shepherd', items: { wool: 1 } },
    ])
  })

  it('오늘 받은 말씀 조각 (받은 기록의 날짜로) — 지난 날 조각은 빼고', () => {
    const s = fresh({ clock: { day: 5, minute: 600 }, pieceLog: { 'mk-001-001': { day: 5, from: 'letter' }, 'mt-001-001': { day: 4, from: 'letter' } } })
    expect(todayDiary(s)!.pieces).toEqual(['mk-001-001'])
  })

  it('가족 일만 고른다 (아이·동반 동물·혼인·둘의 나들이) — 무지개·이웃 아이는 가족 일이 아니다', () => {
    const s = fresh({ todayNotes: ['rainbow', 'childBorn', 'kidMail:gift', 'childAsks', 'babyBorn', 'dateTea', 'wedding:basil'] })
    expect(todayDiary(s)!.family).toEqual(['childBorn', 'kidMail:gift', 'dateTea', 'wedding:basil'])
    expect(isFamilyNote('firstLetter')).toBe(false)
    expect(todayDiary(fresh({ todayNotes: ['rainbow', 'stars'] }))).toBeNull()
  })

  it('잠들면 새 날의 빈 기록 — 지난 날 기록은 읽지 않는다', () => {
    let s = writeChapter(fresh(), 'mt').state
    expect(todayDiary(s)).not.toBeNull()
    s = goToSleep(s, CONTENT)
    expect(logOf(s)).toEqual(emptyDayLog(s.clock.day))
    expect(todayDiary({ ...s, todayNotes: [] })).toBeNull()
    // 날이 바뀌었는데 지난 기록이 남아 있어도(어떤 길로든) 오늘 것으로 읽지 않는다
    expect(logOf({ clock: { day: 9 }, dayLog: { day: 8, chapters: ['mt:1'], gifts: [] } }).chapters).toEqual([])
  })
})

describe('오늘의 기록 — 저장', () => {
  it('저장했다 불러와도 그대로', () => {
    let s = writeChapter(fresh(), 'mk').state
    s = logGift(s, 'baker', { bread: 2 })
    const back = deserialize(serialize(s), CONTENT)!
    expect(logOf(back)).toEqual(logOf(s))
  })

  it('옛 저장(칸이 없던 때)도 불러온다 — 빈 기록', () => {
    const raw = JSON.parse(serialize(fresh({ clock: { day: 12, minute: 600 } })))
    delete raw.dayLog
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(back).not.toBeNull()
    expect(logOf(back)).toEqual(emptyDayLog(12))
  })

  it('모양이 틀린 값은 버린다', () => {
    expect(sanitizeDayLog(null, 3)).toEqual(emptyDayLog(3))
    expect(sanitizeDayLog({ day: 3, chapters: ['mt:1', 7, 'mt:1', 'bad'], gifts: [{ from: 'baker', items: { bread: 2, fig: -1, wool: 'x' } }, { from: 1 }] }, 3)).toEqual({
      day: 3,
      chapters: ['mt:1'],
      gifts: [{ from: 'baker', items: { bread: 2 } }],
    })
  })
})
