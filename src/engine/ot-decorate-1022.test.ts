// 2026-10-22 사용자: 구약도 신약처럼 책 꾸미기
import { CONTENT } from '../content/catalog'
import { canDecorateOtBook, decorateOtBook, newGame, type GameState } from './game'
import { otRow } from './ot-books'
import { SPECIAL_COST } from './binding'
import { count } from './items'
import { deserialize, serialize } from './save'

const done = (s: GameState, book: 'rut'): GameState => ({ ...s, otProgress: { ...s.otProgress, [book]: { completed: Array.from({ length: otRow(book).chapters }, (_, i) => i + 1), arrangement: {} } } })
const rich = (s: GameState): GameState => ({ ...s, inv: { ...s.inv, creamPaper: 6, blueDye: 2, fineThread: 4 } })
const choice = { color: 'sky', pattern: 'dots', deco: 'bronze', detail: 'ribbonBookmark' } as const

describe('구약 책 꾸미기', () => {
  it('다 쓴 책만, 재료가 있을 때만 꾸민다', () => {
    const s = newGame(CONTENT)
    expect(canDecorateOtBook(rich(s), 'rut')).toBe('notDone')
    expect(canDecorateOtBook(done(s, 'rut'), 'rut')).toBe('stock')
    expect(canDecorateOtBook(rich(done(s, 'rut')), 'rut')).toBeNull()
  })
  it('재료를 쓰고 고른 모습이 남고, 도감에 색·무늬·장식이 모이며, 다시 꾸밀 수 있다', () => {
    const s = rich(done(newGame(CONTENT), 'rut'))
    const a = decorateOtBook(s, 'rut', choice)
    expect(a.otBound?.rut?.special).toEqual(choice)
    expect(count(a.inv, 'creamPaper')).toBe(6 - SPECIAL_COST.creamPaper!)
    expect(a.bookDesigns).toEqual(expect.arrayContaining(['color:sky', 'pattern:dots', 'deco:bronze', 'detail:ribbonBookmark']))
    const b = decorateOtBook({ ...a, clock: { ...a.clock, day: a.clock.day + 3 } }, 'rut', { ...choice, color: 'sage' })
    expect(b.otBound?.rut?.special.color).toBe('sage')
    expect(b.otBound?.rut?.day).toBe(a.otBound?.rut?.day)
  })
  it('저장하고 불러와도 남고, 다 쓰지 않은 책의 꾸밈은 버린다', () => {
    const a = decorateOtBook(rich(done(newGame(CONTENT), 'rut')), 'rut', choice)
    expect(deserialize(serialize(a), CONTENT)!.otBound?.rut?.special).toEqual(choice)
    const broken = { ...a, otBound: { ...a.otBound, gen: { day: 1, special: choice } } } as GameState
    expect(deserialize(serialize(broken), CONTENT)!.otBound?.gen).toBeUndefined()
  })
})
