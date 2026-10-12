import { expect, it } from 'vitest'
import { petMotionRows } from './pet-art'
import { kitchenFrame, KITCHEN_ACTIONS } from './kitchen-pet-art'
import { furnitureUseFrame } from './furniture-use-motion'
import { withLookDefaults } from '../engine/avatar'

it('baby following keeps the paws fixed while the upper body breathes gently', () => {
  for (const kind of ['cat','dog'] as const) for (const facing of ['down','up','left','right'] as const) {
    const frames=Array.from({length:4},(_,f)=>petMotionRows(kind,facing,'walk',f,true))
    frames.forEach(rows=>expect(rows.slice(13)).toEqual(frames[0].slice(13)))
    expect(frames[1]).toEqual(frames[0])
    expect(frames[2]).not.toEqual(frames[0])
    if(facing!=='up')expect(frames[3].join('')).not.toContain('e')
  }
})

it('new cooking motions preserve the dressed body and use no extended hand strips', () => {
  const avatar=withLookDefaults({look:'f',name:'',skin:2,top:13,bottom:4})
  const opts={avatar,frame:0 as const,blink:false}
  const base=furnitureUseFrame('writer','down','craft',0,opts,false).actor
  for(const action of Object.keys(KITCHEN_ACTIONS) as (keyof typeof KITCHEN_ACTIONS)[])for(let f=0;f<4;f++) {
    const frame=kitchenFrame('down',action,f,opts)
    for(let y=11;y<=13;y++)for(let x=9;x<=14;x++)expect(frame.actor[y][x]).toBe(base[y][x])
    expect(frame.hands.flatMap(r=>[...r]).filter(c=>c!=='.').length).toBe(4)
  }
})
