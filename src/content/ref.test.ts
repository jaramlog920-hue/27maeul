import bible from './nt-krv.json'
import books from './books.json'
import { expandRef, countsFrom } from './ref'

const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const counts = countsFrom(bible as Record<string, string[][]>)

describe('ref', () => {
  it('누가복음은 24장, 15장은 32절', () => {
    expect(counts.luk.length).toBe(24)
    expect(counts.luk[14]).toBe(32)
  })
  it('눅 15:8-10은 세 절로 펼쳐진다', () => {
    expect(expandRef('눅 15:8-10', byAbbr, counts).map((k) => k.verse)).toEqual([8, 9, 10])
  })
})
