import {expect,it,vi} from 'vitest'
it('rechecks UI06: early unloaded inspection can recover and grants the correct verse mood',async()=>{
 vi.resetModules()
 const c=await import('../../../src/content/catalog'),l=await import('../../../src/content/nt-loader'),m=await import('../../../src/content/piece-moods'),e=await import('../../../src/engine/game')
 const id='php-004';expect(l.ntLoaded('php')).toBe(false)
 expect(m.pieceFacts([],id).moods).toEqual([])
 await l.ensureNtBook('php')
 const actual=m.moodsOfText(c.versesOf(c.pieceById(id).ref).map(v=>v.text).join(' ')),facts=m.pieceFacts([],id)
 expect(facts.moods).toEqual(actual);expect(actual.some(x=>e.LOVE_VERSE_MOODS.includes(x))).toBe(true)
 const b=e.newGame(c.CONTENT),g={...b,collected:[id],romance:{...b.romance,partner:'wendell',stage:'dating' as const,since:1},flags:{...b.flags,growthLegacy:1},clock:{day:30,minute:600}}
 expect(e.giveLoveVerse(g,id,facts)!.hit).toBe(true)
 console.log('ROUND2_COLD_MOOD',JSON.stringify({piece:id,loadedAfterEarlyMiss:true,moods:actual,hit:true}))
})
