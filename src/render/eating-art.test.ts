import {expect,it} from 'vitest'
import {eatingFrame,EAT_DURATIONS} from './eating-art'
import {furnitureUseFrame} from './furniture-use-motion'
import {withLookDefaults} from '../engine/avatar'
import {newGame,eatBread,ACT_SECONDS} from '../engine/game'
import {CONTENT} from '../content/catalog'
import {eatDish} from '../engine/cooking'

it('eating preserves the dressed chest while food rises to the mouth and takes a bite',()=>{
 for(const look of ['f','m'] as const){
  const opts={avatar:withLookDefaults({look,name:'',skin:2,top:13,bottom:4}),frame:0 as const,blink:false}
  const base=furnitureUseFrame('writer','down','craft',0,opts,false).actor
  const frames=Array.from({length:6},(_,f)=>eatingFrame('writer','down',f,opts))
  for(const a of frames)for(let y=11;y<=13;y++)for(let x=9;x<=14;x++)expect(a.actor[y][x]).toBe(base[y][x])
  expect(new Set(frames.map(a=>a.propFront.join(''))).size).toBeGreaterThan(3)
 }
 expect(EAT_DURATIONS.reduce((sum,n)=>sum+n,0)).toBe(ACT_SECONDS.eat*1000)
})
it('eating a snack or cooked dish starts the one-shot motion and consumes exactly one item',()=>{
 const s={...newGame(CONTENT),inv:{bread:2,beanDish:2},needs:{hunger:80,fatigue:0,cold:0,heat:0}}
 const bread=eatBread(s)!
 expect(bread.act).toMatchObject({kind:'eat',food:'bread',total:1.9})
 expect(bread.inv.bread).toBe(1)
 expect(bread.needs.hunger).toBe(30)
 const dish=eatDish(s,'beanDish')
 expect(dish.act).toMatchObject({kind:'eat',food:'beanDish'})
 expect(dish.inv.beanDish).toBe(1)
 expect(eatBread({...s,inv:{}})).toBeNull()
})
