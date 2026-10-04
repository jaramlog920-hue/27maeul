// 계획 14 작업 4: 제본(그대로·특별하게)과 완성본, 바로 꽂기, 책마다 다른 책등, 옛 저장
import { CONTENT, piecesOf } from '../content/catalog'
import { chaptersOf, roomOpen } from './books'
import { COVER_HEX, DECO_HEX, finishedCopies, sanitizeBindings, SPECIAL_COST, SPINE_DESIGN, spineLook, type SpecialChoice } from './binding'
import { bindBook, canBind, decorateBook, newGame, type GameState } from './game'
import { canShelve, shelveNow } from './library'
import { deserialize, serialize } from './save'
import { BOOKS, type Book } from './types'

function done(book: Book, s: GameState = { ...newGame(CONTENT), scenes: [] }): GameState {
  return { ...s, progress: { ...s.progress, [book]: { completed: chaptersOf(book, CONTENT), arrangement: {} } } }
}
const choice: SpecialChoice = { color: 'sky', pattern: 'diamonds', deco: 'bronze' }
const rich = (s: GameState): GameState => ({ ...s, inv: { ...s.inv, papyrus: 5, ink: 2, wool: 3 } })

describe('책마다 다른 책등', () => {
  it('스물일곱 권 모두 책등이 있고, 같은 모습(색·무늬)이 둘 없다', () => {
    expect(Object.keys(SPINE_DESIGN).sort()).toEqual([...BOOKS].sort())
    const keys = BOOKS.map((b) => `${SPINE_DESIGN[b].color}|${SPINE_DESIGN[b].mark}`)
    expect(new Set(keys).size).toBe(27)
  })
  it('그대로 제본·제본 기록 없는 옛 책은 그 책의 책등, 특별 제본은 고른 색·무늬·장식', () => {
    expect(spineLook('mt')).toEqual(SPINE_DESIGN.mt)
    expect(spineLook('mt', { day: 3 })).toEqual(SPINE_DESIGN.mt)
    expect(spineLook('mt', { day: 3, special: choice })).toEqual({ color: COVER_HEX.sky, accent: DECO_HEX.bronze, mark: 'diamond' })
    expect(spineLook('mt', { day: 3, special: { ...choice, pattern: 'plain' } }).mark).toBe('none')
  })
})

describe('제본', () => {
  it('다 필사한 책만 제본한다', () => {
    const s = { ...newGame(CONTENT), scenes: [] }
    expect(canBind(s, 'mk', CONTENT)).toBe('notDone')
    expect(bindBook(s, 'mk', CONTENT)).toBe(s)
    expect(canBind(done('mk'), 'mk', CONTENT)).toBeNull()
  })

  it('그대로 제본하기는 무료 — 재료가 하나도 없어도 완성본이 가방에 들어간다', () => {
    const s = { ...done('mk'), inv: {} }
    const t = bindBook(s, 'mk', CONTENT)
    expect(t.bound.mk).toEqual({ day: s.clock.day })
    expect(t.inv).toEqual({})
    expect(finishedCopies(t)).toEqual(['mk'])
    expect(canBind(t, 'mk', CONTENT)).toBe('bound')
    // 두 번 제본하지 않는다
    expect(bindBook(t, 'mk', CONTENT)).toBe(t)
  })

  it('특별하게 제본하기: 파피루스 3 · 잉크 1 · 양털 2를 쓰고 고른 모습이 남는다. 모자라면 그대로', () => {
    expect(SPECIAL_COST).toEqual({ papyrus: 3, ink: 1, wool: 2 })
    const poor = { ...done('mk'), inv: { papyrus: 3, ink: 1, wool: 1 } }
    expect(bindBook(poor, 'mk', CONTENT, choice)).toBe(poor)
    const t = bindBook(rich(done('mk')), 'mk', CONTENT, choice)
    expect(t.bound.mk).toEqual({ day: t.clock.day, special: choice })
    expect(t.inv).toMatchObject({ papyrus: 2, ink: 1, wool: 1 })
  })

  it('궤짝에 있는 재료도 쓴다', () => {
    const s = { ...done('mk'), inv: {}, chest: { papyrus: 3, ink: 1, wool: 2 }, flags: { ...done('mk').flags, 'unlock:supplyChest': 1 } }
    const t = bindBook(s, 'mk', CONTENT, choice)
    expect(t.bound.mk?.special).toEqual(choice)
  })

  it('제본하면 기다리던 "한 권을 다 필사했다" 장면 하나를 거둔다 (제본 창이 그 장면이다)', () => {
    const s = { ...done('mk'), scenes: ['bookBound', 'welcome'] }
    expect(bindBook(s, 'mk', CONTENT).scenes).toEqual(['welcome'])
  })

  it('닫힌 서고 방의 책을 제본하면 그 방이 열린다 (복음서 방은 늘 열려 있다)', () => {
    const jn2 = bindBook(done('2jn'), '2jn', CONTENT)
    expect(roomOpen('hebJud', jn2.flags)).toBe(true)
    expect(jn2.scenes).toContain('roomOpen:hebJud')
    const ac = bindBook(done('ac'), 'ac', CONTENT)
    expect(roomOpen('acts', ac.flags)).toBe(true)
    const mk = bindBook(done('mk'), 'mk', CONTENT)
    expect(mk.flags).toEqual(done('mk').flags)
    // 이미 열린 방은 장면을 다시 띄우지 않는다
    const open = done('2jn', { ...newGame(CONTENT), scenes: [], flags: { ...newGame(CONTENT).flags, 'room:hebJud': 1 } })
    expect(bindBook(open, '2jn', CONTENT).scenes).not.toContain('roomOpen:hebJud')
  })

  it('나중에 재료가 생기면 다시 꾸민다 — 완성본도, 이미 꽂은 책도(옛 저장 포함), 등급은 그대로', () => {
    const bound = bindBook(done('mk'), 'mk', CONTENT)
    expect(decorateBook(bound, 'mk', choice)).toBe(bound)
    const t = decorateBook(rich(bound), 'mk', choice)
    expect(t.bound.mk).toEqual({ day: bound.bound.mk!.day, special: choice })
    // 옛 저장: 제본 기록 없이 꽂힌 책
    const old = rich({ ...done('lk'), shelved: { lk: 1 } })
    const u = decorateBook(old, 'lk', choice)
    expect(u.bound.lk?.special).toEqual(choice)
    expect(u.shelved.lk).toBe(1)
    // 다 마치지 않은 책은 꾸미지 않는다
    const none = rich({ ...newGame(CONTENT), scenes: [] })
    expect(decorateBook(none, 'mk', choice)).toBe(none)
  })
})

describe('완성본을 서고에 꽂기', () => {
  it('제본한 완성본만 꽂는다 (다 필사했어도 제본 전에는 꽂지 않는다)', () => {
    expect(canShelve({ ...newGame(CONTENT), scenes: [] }, 'mk', CONTENT)).toBe('notDone')
    expect(canShelve(done('mk'), 'mk', CONTENT)).toBe('notBound')
    expect(canShelve(bindBook(done('mk'), 'mk', CONTENT), 'mk', CONTENT)).toBeNull()
  })

  it('바로 꽂기: 퀴즈 없이 맨 책으로 꽂히고 다시 읽을 구절도 늘지 않는다 — 불이익 없음', () => {
    const s = bindBook(done('mk'), 'mk', CONTENT)
    const t = shelveNow(s, 'mk', CONTENT)
    expect(t.shelved.mk).toBe(0)
    expect(t.rereads).toEqual(s.rereads)
    expect(t.scenes).toContain('firstShelved')
    expect(finishedCopies(t)).toEqual([])
    expect(shelveNow(t, 'mk', CONTENT)).toBe(t)
    // 제본 전에는 꽂지 않는다
    expect(shelveNow(done('lk'), 'lk', CONTENT)).toEqual(done('lk'))
  })
})

describe('저장', () => {
  it('제본·완성본은 저장되고 불러온다', () => {
    const s = bindBook(rich(done('mk')), 'mk', CONTENT, choice)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.bound.mk).toEqual(s.bound.mk)
  })

  it('옛 저장(제본 칸이 없던 때): 이미 꽂은 책은 등급 그대로, 제본 기록은 비어 있다', () => {
    const s = { ...done('mk'), shelved: { mk: 2 as const } } as GameState
    const raw = JSON.parse(serialize(s))
    delete raw.bound
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(back.shelved.mk).toBe(2)
    expect(back.bound).toEqual({})
  })

  it('모양이 틀린 제본·다 마치지 않은 책의 제본은 버린다', () => {
    const isDone = (b: Book) => b === 'mk'
    expect(sanitizeBindings(null, isDone)).toEqual({})
    expect(
      sanitizeBindings(
        { mk: { day: 4, special: { color: 'red', pattern: 'lines', deco: 'navy' } }, lk: { day: 2 }, xx: { day: 1 }, jn: 'x' },
        isDone,
      ),
    ).toEqual({ mk: { day: 4 } })
    expect(sanitizeBindings({ mk: { day: 4, special: choice } }, isDone)).toEqual({ mk: { day: 4, special: choice } })
  })

  it('piecesOf로 만든 옛 시험판 저장도 그대로 (조각 수집과 무관)', () => {
    const s = { ...done('mk'), collected: piecesOf('mk').map((p) => p.id) }
    expect(bindBook(s, 'mk', CONTENT).collected).toEqual(s.collected)
  })
})
