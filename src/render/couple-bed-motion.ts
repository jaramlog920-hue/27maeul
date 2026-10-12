import {pixels} from './home-space-art'
import {motionBodyRows} from './motion-body'
import type {SpriteOpts,Who} from './sprites'
import type {Facing} from '../engine/types'
import {COUPLE_BED_DIRECTIONS} from './couple-bed-art'

/** Separate adult layers preserve both appearances. The shared cover goes over their bodies. */
export function coupleBedRestFrame(first:Who,second:Who,facing:Facing,phase:number,firstOpts:SpriteOpts,secondOpts:SpriteOpts):{bed:string[];first:string[];second:string[];cover:string[];duration:number}{
  const p=((Math.trunc(phase)%4)+4)%4,side=facing==='right'||facing==='left',rear=facing==='up'
  if(facing==='left'){
    const r=coupleBedRestFrame(first,second,'right',p,firstOpts,secondOpts)
    const flip=(a:string[])=>a.map(row=>[...row].reverse().join(''))
    return {...r,bed:flip(r.bed),first:flip(r.first),second:flip(r.second),cover:flip(r.cover)}
  }
  const people=[first,second].map((who,i)=>{
    const source=motionBodyRows(who,side?'right':'down',{...(i?secondOpts:firstOpts),frame:0,blink:true})
    const grid=Array.from({length:32},()=>Array<string>(32).fill('.'))
    source.forEach((row,y)=>[...row].forEach((c,x)=>{
      if(c==='.')return
      const px=side?5+y:5+i*12+x,py=side?6+i*11+9-x:rear?26-y:5+y
      if(px<32&&py<32&&py>=0)grid[py][px]=c
    }))
    return grid.map(row=>row.join(''))
  })
  const cover=pixels(2,2,side?
    [['b',12,5,17,22],['c',12,5,1,22],['B',26,5,3,22]]:
    rear?[['b',4,5,24,14],['B',4,5,24,3],['c',4,18,24,1]]:
    [['b',4,13+(p===2?1:0),24,14-(p===2?1:0)],['c',4,13+(p===2?1:0),24,1],['B',4,24,24,3]])
  return {bed:COUPLE_BED_DIRECTIONS[facing].rows,first:people[0],second:people[1],cover:cover.rows,duration:[600,600,700,600][p]}
}
