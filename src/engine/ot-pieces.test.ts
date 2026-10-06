// 구약 말씀 조각: 장 하나가 조각 하나, 새 터에서 하루 한 번, 신약과 섞지 않는다 + 방별 책장 채움
import { CONTENT, PIECES } from '../content/catalog'
import { drawFragment, roomPieceRatio, shelfFillSteps, SHELF_FILL } from './fragments'
import { goToSleep, newGame, syncHome, tick, travel, walkDirection, type GameEvent, type GameState } from './game'
import { setActiveMap } from './maps'
import { setNewlandOpen } from './newland'
import { ARCHIVE } from './newland-config'
import { OT_BOOK_TABLE } from './ot-books'
import { drawOtPiece, isOtPieceId, OT_PIECE_COUNT, OT_PIECES, otPieceById, sanitizeOtCollected } from './ot-pieces'
import { deserialize, serialize } from './save'
import { SHELF_ROOMS } from './shelf-rooms'
import { bookcaseTiles, tileAt } from './world'

afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
})

const zero = () => 0

describe('구약 조각 목록', () => {
  it('39권 929개, id 유일, 신약 조각 id와 겹치지 않고, 이름은 책 이름+장', () => {
    expect(OT_PIECE_COUNT).toBe(929)
    expect(OT_PIECES).toHaveLength(OT_BOOK_TABLE.reduce((n, r) => n + r.chapters, 0))
    expect(new Set(OT_PIECES.map((p) => p.id)).size).toBe(929)
    const nt = new Set(PIECES.map((p) => p.id))
    expect(OT_PIECES.some((p) => nt.has(p.id))).toBe(false)
    expect(otPieceById('ot:gen:1')?.name).toBe('창세기 1장')
    expect(otPieceById('ot:psa:150')?.name).toBe('시편 150장')
    expect(isOtPieceId('ot:gen:51')).toBe(false)
  })
  it('드로우: 같은 날 같은 결과, 이미 가진 것은 빼고, 다 모으면 null', () => {
    expect(drawOtPiece([], 7)).toBe(drawOtPiece([], 7))
    const first = drawOtPiece([], 7)!
    expect(drawOtPiece([first], 7)).not.toBe(first)
    expect(drawOtPiece(OT_PIECES.map((p) => p.id), 7)).toBeNull()
  })
  it('신약 무작위 뽑기에는 구약이 들어가지 않는다', () => {
    for (let seed = 1; seed < 200; seed++) expect(drawFragment(PIECES, [], seed)!.startsWith('ot:')).toBe(false)
  })
})

describe('새 터 서고에서 하루 한 번', () => {
  function atDoor(day: number, extra: Partial<GameState> = {}, gift = true): GameState {
    const base = newGame(CONTENT)
    const open: GameState = { ...base, scenes: [], clock: { day, minute: 10 * 60 }, flags: { ...base.flags, ...(gift ? { newlandGift: 1 } : {}) }, ...extra }
    syncHome(open)
    const there = travel(open, 'newland', CONTENT)
    syncHome(there)
    return { ...there, player: { ...there.player, x: ARCHIVE.front.x, y: ARCHIVE.front.y, path: [], facing: 'up' } }
  }
  function stepIn(s: GameState): { s: GameState; events: GameEvent[] } {
    const events: GameEvent[] = []
    let g = walkDirection(s, 0, -1)
    for (let i = 0; i < 40; i++) {
      const r = tick(g, 0.05, zero, CONTENT)
      g = r.state
      events.push(...r.events)
    }
    return { s: g, events }
  }
  const got = (e: GameEvent[]) => e.filter((x) => x.type === 'otPiece')

  it('처음 들어서면 한 조각, 알림 사건 하나, 신약 조각은 그대로', () => {
    const before = atDoor(5)
    const { s, events } = stepIn(before)
    expect(got(events)).toHaveLength(1)
    expect(s.otCollected).toHaveLength(1)
    expect(isOtPieceId(s.otCollected![0])).toBe(true)
    expect(s.collected).toEqual(before.collected)
    expect(s.inv).toEqual(before.inv)
  })
  it('같은 날 나갔다 다시 들어가도 더 주지 않는다', () => {
    const first = stepIn(atDoor(5)).s
    const out = { ...first, player: { ...first.player, x: ARCHIVE.front.x, y: ARCHIVE.front.y, path: [] } }
    const again = stepIn(out)
    expect(got(again.events)).toHaveLength(0)
    expect(again.s.otCollected).toHaveLength(1)
  })
  it('다음 날에는 또 하나, 재접속(저장·불러오기)해도 같은 조각', () => {
    const a = stepIn(atDoor(5)).s
    const b = stepIn(atDoor(6, { otCollected: a.otCollected }, true)).s
    expect(b.otCollected).toHaveLength(2)
    const again = stepIn(atDoor(6, { otCollected: a.otCollected }, true)).s
    expect(again.otCollected).toEqual(b.otCollected)
    const back = deserialize(serialize(b), CONTENT)!
    expect(back.otCollected).toEqual(b.otCollected)
    expect(back.flags.otPieceDay).toBe(6)
  })
  it('다 모았으면 더 주지 않는다', () => {
    const { s, events } = stepIn(atDoor(5, { otCollected: OT_PIECES.map((p) => p.id) }))
    expect(got(events)).toHaveLength(0)
    expect(s.otCollected).toHaveLength(929)
  })
  it('newlandGift 전에는 없다', () => {
    const g = atDoor(5, {}, false)
    expect(g.otCollected).toBeUndefined()
  })
})

describe('저장', () => {
  it('왕복: 모은 구약 조각이 그대로, 모르는 id·중복은 버려진다, 옛 저장은 칸이 없다', () => {
    const base = newGame(CONTENT)
    const s: GameState = { ...base, flags: { ...base.flags, newlandGift: 1 }, otCollected: ['ot:gen:1', 'ot:rev:1', 'ot:gen:1', 'ot:exo:99'] }
    expect(sanitizeOtCollected(s.otCollected)).toEqual(['ot:gen:1'])
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.otCollected).toEqual(['ot:gen:1'])
    expect(back.collected.some((id) => id.startsWith('ot:'))).toBe(false)
    expect(sanitizeOtCollected(undefined)).toEqual([])
    const old = deserialize(serialize(base), CONTENT)!
    expect(old.otCollected).toBeUndefined()
  })
})

describe('방별 책장 채움', () => {
  const got = (books: readonly string[], n: number) => PIECES.filter((p) => books.includes(p.book)).slice(0, n).map((p) => p.id)
  it('방의 조각 비율은 그 방 책들만 센다', () => {
    const acts = SHELF_ROOMS.find((r) => r.id === 'acts')!.books
    const all = PIECES.filter((p) => acts.includes(p.book)).length
    expect(roomPieceRatio(PIECES, [], acts)).toEqual({ got: 0, total: all })
    expect(roomPieceRatio(PIECES, got(acts, all), acts)).toEqual({ got: all, total: all })
    // 다른 방 조각은 이 방 비율에 들지 않는다
    const rev = SHELF_ROOMS.find((r) => r.id === 'rev')!.books
    expect(roomPieceRatio(PIECES, got(rev, 99), acts).got).toBe(0)
    expect(roomPieceRatio(PIECES, [], undefined).total).toBe(PIECES.length)
  })
  it('책장 칸 수에 맞춰 나눈다 (여섯·셋·하나)', () => {
    const per = SHELF_FILL.rows * SHELF_FILL.perRow
    for (const shelves of [6, 3, 1]) {
      expect(shelfFillSteps(0, 100, shelves)).toBe(0)
      expect(shelfFillSteps(100, 100, shelves)).toBe(shelves * per)
      expect(shelfFillSteps(50, 100, shelves)).toBe((shelves * per) / 2)
      expect(shelfFillSteps(1, 100000, shelves)).toBe(1)
    }
  })
  it('책장 타일은 모두 책장(s)이고 방마다 개수가 맞다', () => {
    expect(bookcaseTiles('library')).toHaveLength(6)
    for (const room of ['acts', 'romPhm', 'hebJud', 'rev'] as const) {
      const tiles = bookcaseTiles(room)
      expect(tiles).toHaveLength(3)
      for (const t of tiles) expect(tileAt(t.x, t.y)).toBe('s')
    }
    for (const t of bookcaseTiles('library')) expect(tileAt(t.x, t.y)).toBe('s')
  })
  it('goToSleep 같은 다른 흐름은 구약 칸을 건드리지 않는다', () => {
    const base = newGame(CONTENT)
    const s = goToSleep({ ...base, otCollected: ['ot:gen:1'] }, CONTENT)
    expect(s.otCollected).toEqual(['ot:gen:1'])
  })
})
