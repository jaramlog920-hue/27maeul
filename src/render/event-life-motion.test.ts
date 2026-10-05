import { describe,it,expect } from 'vitest'
import { EVENT_ACTIONS,EVENT_STATES,eventMotionFrame } from './event-life-motion'
import { writerPalette } from './sprites'
import { FURNI_PALETTE } from './furniture-art'
describe('additional event motion',()=>{
 it('all adult/child directional layers use bounded pixels and correct palettes',()=>{
  for(const short of [undefined,1])for(const facing of ['down','up','left','right'] as const)for(const action of EVENT_ACTIONS)for(let frame=0;frame<4;frame++){
   const a=eventMotionFrame('writer',facing,action,frame,{frame:0,blink:false,short})
   for(const[rows,palette]of [[a.actor,writerPalette('spring')],[a.propBack,FURNI_PALETTE],[a.propFront,FURNI_PALETTE]] as const){expect(rows).toHaveLength(24);for(const r of rows){expect(r).toHaveLength(24);for(const c of r)if(c!=='.')expect(palette[c]).toBeDefined()}}
  }
 },30000)
 it('candle, gift and reveal actually change their prop layers',()=>{
  for(const action of ['blowCandle','unwrapGift','unveil'] as const){const first=eventMotionFrame('writer','right',action,0,{frame:0,blink:false}),last=eventMotionFrame('writer','right',action,3,{frame:0,blink:false});expect(last.propFront).not.toEqual(first.propFront);expect(last.loop).toBe(false)}
  for(const a of Object.values(EVENT_STATES)){expect(a.rows).toHaveLength(16);for(const r of a.rows)expect(r).toHaveLength(16)}
 })
})
