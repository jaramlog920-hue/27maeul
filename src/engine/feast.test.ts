import { CONTENT } from '../content/catalog'
import { feastFoods, feastGivers, feastGuests, feastLines, feastOf, readFeastLine, shareFeastFood } from './feast'
import { legacyGame } from './growth-test-support'
import { deserialize, serialize } from './save'
import { eventPropsNow, feastEvening } from './event-scene'
import { FESTIVAL_FROM } from './calendar'

const base = () => {
  const s = legacyGame(CONTENT)
  return { ...s, scenes: [], flags: { ...s.flags, gospelFeast: 1 }, clock: { day: 40, minute: FESTIVAL_FROM + 40 } }
}

describe('서고 잔치 모닥불 (2026-10-13)', () => {
  it('오늘 열리는 잔치와 손님', () => {
    expect(feastOf(base())).toBe('gospelFeast')
    expect(feastOf({ flags: {} })).toBeNull()
    expect(feastGuests(base(), CONTENT).length).toBeGreaterThan(3)
  })
  it('음식을 내놓으면 하나 줄고, 좋아하는 이웃만 마음이 오른다', () => {
    const s = { ...base(), inv: { honey: 2 } }
    expect(feastFoods(s)).toEqual(['honey'])
    const r = shareFeastFood(s, 'honey', CONTENT)
    expect(r.state.inv.honey).toBe(1)
    expect(r.glad.length).toBeGreaterThan(0)
    for (const id of r.glad) expect(CONTENT.neighbors.find((d) => d.id === id)!.likes).toContain('honey')
    for (const id of r.glad) expect(r.state.hearts[id] ?? 0).toBeGreaterThan(s.hearts[id] ?? 0)
    // 없는 음식은 아무것도 바뀌지 않는다
    expect(shareFeastFood({ ...s, inv: {} }, 'honey', CONTENT).state.inv).toEqual({})
  })
  it('조각을 건넨 이웃은 잔치의 책에 든 조각만, 사람마다 하나, 최대 셋', () => {
    const mt = CONTENT.pieces.filter((p) => p.book === 'mt')
    const ac = CONTENT.pieces.find((p) => p.book === 'ac')!
    const s = { ...base(), pieceLog: { [mt[0].id]: { day: 3, from: 'npc:baker' }, [mt[1].id]: { day: 5, from: 'npc:baker' }, [ac.id]: { day: 9, from: 'npc:grandpa' }, [mt[2].id]: { day: 7, from: 'post' } } }
    const g = feastGivers(s, 'gospelFeast', CONTENT)
    expect(g).toEqual([{ npc: 'baker', piece: mt[1] }])
    expect(feastGivers(s, 'allFeast', CONTENT).map((x) => x.npc)).toEqual(['grandpa', 'baker'])
  })
  it('낭독할 줄은 잔치의 책에 적어 둔 나의 한 줄, 읽은 줄은 저장된다', () => {
    const s = { ...base(), myLines: { 'book:mt': '첫 줄', 'book:ac': '사도행전 줄', 'book:lk': '  ' } }
    expect(feastLines(s, 'gospelFeast')).toEqual([{ book: 'mt', text: '첫 줄' }])
    const read = readFeastLine(s, 'gospelFeast', '첫 줄')
    expect(deserialize(serialize(read), CONTENT)!.feastLines).toEqual({ gospelFeast: '첫 줄' })
  })
  it('잔치 저녁에는 광장에 안내판·걸개·등불이 선다', () => {
    expect(feastEvening(base())).toBe(true)
    expect(eventPropsNow(base()).map((p) => p.art)).toEqual(expect.arrayContaining(['feastBoard', 'springGarland', 'winterLantern']))
    expect(feastEvening({ ...base(), clock: { day: 40, minute: FESTIVAL_FROM - 10 } })).toBe(false)
  })
})
