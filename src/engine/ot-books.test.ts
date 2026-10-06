import books from '../content/books.json'
import { OT_BOOK_TABLE, OT_BOOKS, OT_ROOMS, isOtBook, otRoomOf, testamentOf } from './ot-books'
import { BOOKS } from './types'

const STANDARD_ORDER =
  'gen exo lev num deu jos jdg rut 1sa 2sa 1ki 2ki 1ch 2ch ezr neh est job psa pro ecc sng isa jer lam ezk dan hos jol amo oba jon mic nam hab zep hag zec mal'

describe('구약 책 표 (D1)', () => {
  it('39권이고 id가 겹치지 않는다', () => {
    expect(OT_BOOK_TABLE).toHaveLength(39)
    expect(new Set(OT_BOOKS).size).toBe(39)
  })
  it('순서가 표준이다 (창세기 → 말라기)', () => {
    expect(OT_BOOKS.join(' ')).toBe(STANDARD_ORDER)
    expect(OT_BOOK_TABLE[0].name).toBe('창세기')
    expect(OT_BOOK_TABLE[38].name).toBe('말라기')
  })
  it('장 합계가 929다', () => {
    expect(OT_BOOK_TABLE.reduce((n, r) => n + r.chapters, 0)).toBe(929)
    expect(OT_BOOK_TABLE.find((r) => r.id === 'psa')!.chapters).toBe(150)
    expect(OT_BOOK_TABLE.find((r) => r.id === 'oba')!.chapters).toBe(1)
  })
  it('신약 BOOKS·신약 본문 id(books.json)와 겹치지 않는다', () => {
    const nt = new Set<string>([...BOOKS, ...books.map((b) => b.id)])
    for (const id of OT_BOOKS) expect(nt.has(id), id).toBe(false)
  })
  it('약칭이 66권 안에서 유일하다 (books.json 약칭 포함)', () => {
    const abbrs = [...OT_BOOK_TABLE.map((r) => r.abbr), ...books.map((b) => b.abbr)]
    expect(abbrs).toHaveLength(66)
    expect(new Set(abbrs).size).toBe(66)
  })
  it('한글 이름이 66권 안에서 유일하다', () => {
    const names = [...OT_BOOK_TABLE.map((r) => r.name), ...books.map((b) => b.name)]
    expect(new Set(names).size).toBe(66)
  })
  it('개역한글 약칭이 알려진 표와 같다', () => {
    const want = '창 출 레 민 신 수 삿 룻 삼상 삼하 왕상 왕하 대상 대하 스 느 에 욥 시 잠 전 아 사 렘 애 겔 단 호 욜 암 옵 욘 미 나 합 습 학 슥 말'
    expect(OT_BOOK_TABLE.map((r) => r.abbr).join(' ')).toBe(want)
  })
})

describe('구약 판정', () => {
  it('isOtBook·testamentOf는 구약과 신약을 가른다', () => {
    expect(isOtBook('gen')).toBe(true)
    expect(isOtBook('mt')).toBe(false)
    expect(isOtBook('mat')).toBe(false)
    expect(isOtBook(null)).toBe(false)
    expect(isOtBook(3)).toBe(false)
    expect(testamentOf('psa')).toBe('ot')
    expect(testamentOf('rev')).toBe('nt')
    for (const b of BOOKS) expect(testamentOf(b)).toBe('nt')
    for (const b of OT_BOOKS) expect(testamentOf(b)).toBe('ot')
  })
})

describe('구약 방 (D11)', () => {
  it('방은 넷이고 이름은 책 범위다', () => {
    expect(OT_ROOMS.map((r) => r.label)).toEqual(['창세기–신명기', '여호수아–에스더', '욥기–아가', '이사야–말라기'])
  })
  it('분류 이름을 화면 이름에 쓰지 않는다', () => {
    for (const r of OT_ROOMS) for (const w of ['율법', '역사', '시가', '예언']) expect(r.label.includes(w), r.label).toBe(false)
  })
  it('네 방이 39권을 빠짐없이 한 번씩, 순서대로 덮는다', () => {
    expect(OT_ROOMS.flatMap((r) => [...r.books])).toEqual([...OT_BOOKS])
    expect(OT_ROOMS.map((r) => r.books.length)).toEqual([5, 12, 5, 17])
  })
  it('방 이름의 처음과 끝이 실제 책 이름이다', () => {
    const name = (id: string) => OT_BOOK_TABLE.find((r) => r.id === id)!.name
    for (const r of OT_ROOMS) expect(r.label).toBe(`${name(r.books[0])}–${name(r.books[r.books.length - 1])}`)
  })
  it('otRoomOf는 그 책의 방을 돌려준다', () => {
    expect(otRoomOf('gen').id).toBe('law')
    expect(otRoomOf('est').id).toBe('history')
    expect(otRoomOf('sng').id).toBe('poetry')
    expect(otRoomOf('mal').id).toBe('prophets')
    for (const b of OT_BOOKS) expect(otRoomOf(b).books).toContain(b)
  })
})

describe('신약 회귀 — 구약을 더해도 신약 전용 판정은 그대로', () => {
  it('BOOKS는 여전히 27권이다', () => {
    expect(BOOKS).toHaveLength(27)
  })
})
