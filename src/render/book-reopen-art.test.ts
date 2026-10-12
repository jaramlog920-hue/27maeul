import {expect,it} from 'vitest'
import {COVER_COLORS,COVER_PATTERNS,SPINE_DECOS} from '../engine/binding'
import {libraryBookRows,libraryPalette} from './library-art'
import {bookReopenRows,BOOK_REOPEN_DURATIONS} from './book-reopen-art'

it('reopening shows the exact saved decorative cover before opening it',()=>{
  for(const color of COVER_COLORS)for(const pattern of COVER_PATTERNS)for(const deco of SPINE_DECOS){
    const binding={day:0,special:{color,pattern,deco}}
    const cover=libraryBookRows('mt',binding,2,false,true)
    const reveal=bookReopenRows('mt',2,binding,2)
    expect(reveal.slice(8,40).map(r=>r.slice(30,54))).toEqual(cover)
    expect(bookReopenRows('mt',3,binding,2)).toEqual(reveal)
    expect(BOOK_REOPEN_DURATIONS[3]).toBeGreaterThanOrEqual(1000)
  }
})
it('all phases are in bounds, use the book palette, and finish open with the original accent ribbon',()=>{
  const binding={day:0,special:{color:'sage' as const,pattern:'diamonds' as const,deco:'bronze' as const}}
  const palette=libraryPalette('mt',binding,2)
  const frames=Array.from({length:10},(_,f)=>bookReopenRows('mt',f,binding,2,true))
  expect(new Set(frames.map(r=>r.join('\n'))).size).toBeGreaterThanOrEqual(8)
  for(const rows of frames){expect(rows.length).toBe(48);expect(rows.every(r=>r.length===64&&[...r].every(c=>c==='.'||c in palette))).toBe(true)}
  const final=frames[9]
  expect(final[42][32]).toBe('d')
  expect(final[18][14]).not.toBe('c')
  expect(final[18][37]).not.toBe('c')
  expect(bookReopenRows('mt',99,binding,2,true)).toEqual(final)
})
