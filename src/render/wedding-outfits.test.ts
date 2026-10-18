import {withLookDefaults} from '../engine/avatar'
import {WEDDING_OUTFITS,weddingOutfitFrame} from './wedding-outfits'
import {weddingGuestPlaces} from './wedding-ceremony-layout'

it.each(WEDDING_OUTFITS)('$name preserves native head, hands, feet and detached avatar colors in every direction',outfit=>{
 for(const facing of ['down','left','right','up'] as const)for(const pose of ['stand','wave'] as const)for(const skin of [0,3,7])for(const hairBack of [0,1,3,5]){
  const avatar=withLookDefaults({name:'기록자',look:outfit.look,hairBack,skin,hairColor:[270,30,32]}),before=JSON.stringify(avatar)
  const {rows,original,palette}=weddingOutfitFrame(avatar,outfit.id,facing,0,pose)
  expect(rows.slice(0,7)).toEqual(original.slice(0,7));expect(rows.at(-1)).toBe(original.at(-1))
  original.forEach((row,y)=>[...row].forEach((ch,x)=>{if('s5!h01'.includes(ch))expect(rows[y][x]).toBe(ch)}))
  expect(rows.length).toBe(original.length);expect(rows.every(row=>row.length===original[0].length)).toBe(true)
  expect(rows.some(row=>/[αβγδε]/.test(row))).toBe(true)
  expect(palette.s).toBe(['#f8dcc0','#d0a078','#5c3c2c'][[0,3,7].indexOf(skin)]);expect(JSON.stringify(avatar)).toBe(before)
 }
})
it('keeps every real guest once, with clear native head/body rectangles and an open ceremony centre',()=>{
 for(const count of [0,1,5,12,22,23]){
  const slots=weddingGuestPlaces(count,320,119)
  expect(slots.map(slot=>slot.index).sort((a,b)=>a-b)).toEqual(Array.from({length:count},(_,i)=>i))
  for(const a of slots){
   expect(a.x).toBeGreaterThanOrEqual(0);expect(a.x+20).toBeLessThanOrEqual(320)
   expect(a.foot-32).toBeGreaterThanOrEqual(0);expect(a.foot).toBeLessThanOrEqual(220)
   for(const b of slots)if(a!==b)expect(a.x+20<=b.x||b.x+20<=a.x||a.foot<=b.foot-28||b.foot<=a.foot-28).toBe(true)
  }
 }
})
it.each(['merchant','smith','postman'] as const)('%s retains its original NPC head and native crouch/walk height in a formal outfit',who=>{
 const av=withLookDefaults({name:'약혼자',look:'m'})
 for(const facing of ['down','right','up','left'] as const)for(const pose of ['stand','wave','crouch'] as const){
  const frame=weddingOutfitFrame(av,'groom-midnight',facing,.9,pose,true,who)
  expect(frame.rows.slice(0,7)).toEqual(frame.original.slice(0,7))
  expect(frame.rows.length).toBe(frame.original.length-(pose==='crouch'?2:0))
  expect(frame.rows.at(-1)).toBe(frame.original.at(-1))
 }
})
