// 계획 14 작업 7: 책상이 살아온 흔적 — 필사한 만큼 책갈피·쓴 펜·종이 묶음·작은 등잔이 하나씩 (그림으로만)
import { CONTENT } from '../content/catalog'
import { DESK_LAMP_CHARS, DESK_PAGES_CHARS, DESK_PEN_CHARS, DESK_TWO_BOOKS, deskTraces, EMPTY_DESK } from './desk-traces'
import { newGame } from './game'
import { deserialize, serialize } from './save'

const stats = (patch: Partial<{ verses: number; chars: number; chapters: number; books: number }> = {}) => ({
  verses: 0,
  chars: 0,
  chapters: 0,
  books: 0,
  firstDay: null,
  ...patch,
})

describe('책상이 살아온 흔적', () => {
  it('새 게임의 책상은 비어 있다', () => {
    expect(deskTraces({ ...newGame(CONTENT), inv: {} })).toEqual(EMPTY_DESK)
  })

  it('처음 한 장을 마치면 책갈피 끈', () => {
    expect(deskTraces({ copyStats: stats({ chars: 300 }), inv: {} }).ribbon).toBe(false)
    expect(deskTraces({ copyStats: stats({ chars: 300, chapters: 1 }), inv: {} }).ribbon).toBe(true)
  })

  it('쓴 글자 수만큼 하나씩: 펜꽂이 → 종이 묶음 → 등잔, 묶음은 세 겹까지 두꺼워진다', () => {
    const at = (chars: number) => deskTraces({ copyStats: stats({ chars, chapters: 1 }), inv: {} })
    expect(at(DESK_PEN_CHARS - 1).penCup).toBe(false)
    expect(at(DESK_PEN_CHARS).penCup).toBe(true)
    expect(at(DESK_PAGES_CHARS[0] - 1).pages).toBe(0)
    expect(at(DESK_PAGES_CHARS[0]).pages).toBe(1)
    expect(at(DESK_PAGES_CHARS[1]).pages).toBe(2)
    expect(at(DESK_PAGES_CHARS[2]).pages).toBe(3)
    expect(at(10_000_000).pages).toBe(3)
    expect(at(DESK_LAMP_CHARS - 1).lamp).toBe(false)
    expect(at(DESK_LAMP_CHARS).lamp).toBe(true)
    // 차례가 거꾸로 되지 않는다: 펜 < 종이 < 등잔
    expect(DESK_PEN_CHARS).toBeLessThan(DESK_PAGES_CHARS[0])
    expect(DESK_PAGES_CHARS[0]).toBeLessThan(DESK_LAMP_CHARS)
  })

  it('한 권을 마치면 등잔이 켜지고 덮어 둔 완성본 한 권, 네 권부터 두 권', () => {
    const one = deskTraces({ copyStats: stats({ chars: 3000, chapters: 4, books: 1 }), inv: {} })
    expect(one.lamp).toBe(true)
    expect(one.books).toBe(1)
    expect(deskTraces({ copyStats: stats({ books: DESK_TWO_BOOKS - 1 }), inv: {} }).books).toBe(1)
    expect(deskTraces({ copyStats: stats({ books: DESK_TWO_BOOKS }), inv: {} }).books).toBe(2)
    expect(deskTraces({ copyStats: stats({ books: 27 }), inv: {} }).books).toBe(2)
  })

  it('좋은 펜·넓은 책상은 가진 사람 책상에 꾸미기로 보인다 (필사량과 상관없이)', () => {
    const d = deskTraces({ copyStats: stats(), inv: { goodPen: 1, wideDesk: 1 } })
    expect(d).toMatchObject({ goodPen: true, wideDesk: true, ribbon: false, pages: 0 })
  })

  it('옛 저장(필사 통계가 없던 때)도 빈 책상으로 불러온다', () => {
    expect(deskTraces({ inv: {} })).toEqual(EMPTY_DESK)
    expect(deskTraces({ copyStats: null, inv: {} })).toEqual(EMPTY_DESK)
    const o = JSON.parse(serialize({ ...newGame(CONTENT), inv: {} }))
    delete o.copyStats
    const back = deserialize(JSON.stringify(o), CONTENT)!
    expect(deskTraces(back)).toEqual(EMPTY_DESK)
  })

  it('레벨업 표시 없이 그림으로만 — 흔적에는 숫자 단계나 이름이 없다', () => {
    const d = deskTraces({ copyStats: stats({ chars: 60_000, chapters: 80, books: 5 }), inv: {} })
    expect(Object.keys(d).sort()).toEqual(['books', 'goodPen', 'lamp', 'pages', 'penCup', 'ribbon', 'wideDesk'])
  })
})
