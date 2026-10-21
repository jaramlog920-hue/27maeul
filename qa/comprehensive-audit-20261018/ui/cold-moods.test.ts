import { expect, it, vi } from 'vitest'

it('reproduces permanent empty mood cache after a saved piece is inspected before its NT chapter loads', async () => {
  // setupTests preloads all books; a fresh production module graph represents a reload,
  // with retained save IDs but no book content fetched yet.
  vi.resetModules()
  const catalog = await import('../../../src/content/catalog')
  const loader = await import('../../../src/content/nt-loader')
  const moods = await import('../../../src/content/piece-moods')
  const engine = await import('../../../src/engine/game')
  const id = 'php-004'
  expect(loader.ntLoaded('php')).toBe(false)
  expect(moods.pieceFacts([],id).moods).toEqual([])
  await loader.ensureNtBook('php')
  const actual = moods.moodsOfText(catalog.versesOf(catalog.pieceById(id).ref).map(v=>v.text).join(' '))
  expect(actual.some(m=>engine.LOVE_VERSE_MOODS.includes(m))).toBe(true)
  const cached = moods.pieceFacts([],id)
  expect(cached.moods).toEqual([])
  const base=engine.newGame(catalog.CONTENT)
  const game={...base,collected:[id],romance:{...base.romance,partner:'wendell',stage:'dating' as const,since:1},flags:{...base.flags,growthLegacy:1},clock:{day:30,minute:600}}
  expect(engine.giveLoveVerse(game,id,cached)!.hit).toBe(false)
  expect(engine.giveLoveVerse(game,id,{...cached,moods:actual})!.hit).toBe(true)
  console.log('COLD_MOODS_PROBE',JSON.stringify({piece:id,actual,cached:cached.moods,wrongHit:false,expectedHit:true}))
}, 120000)
