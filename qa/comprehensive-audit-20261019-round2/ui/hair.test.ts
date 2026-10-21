import {expect,it} from 'vitest'
import {spriteRows,writerPalette} from '../../../src/render/sprites'
import {HAIR_FRONTS,HAIR_BACKS,withLookDefaults} from '../../../src/engine/avatar'
it('draws every front/back hair combination in all directions, elder and blink states without malformed rows or input mutation',()=>{
 let cases=0
 for(let hairFront=0;hairFront<HAIR_FRONTS.length;hairFront++)for(let hairBack=0;hairBack<HAIR_BACKS.length;hairBack++)for(const facing of ['down','up','left','right'] as const)for(const elder of [false,true])for(const blink of [false,true]){
  const avatar=withLookDefaults({look:'f',name:'감사',hairFront,hairBack,hairColor:[170,80,30],acc:0}),before=JSON.stringify(avatar)
  const rows=spriteRows('writer',facing,{avatar,elder,blink,frame:0}),pal=writerPalette('spring',avatar)
  expect(rows.length).toBeGreaterThan(10)
  for(const row of rows){expect(row.length,`${hairFront}/${hairBack}/${facing}`).toBe(10);for(const ch of row)expect(ch==='.'||ch in pal,`palette ${ch}`).toBe(true)}
  expect(JSON.stringify(avatar)).toBe(before);cases++
 }
 console.log('ROUND2_HAIR_ROWS',JSON.stringify({fronts:HAIR_FRONTS.length,backs:HAIR_BACKS.length,cases,checks:'row size/palette/immutability; no pixel appearance assertion'}))
})
