import {sheepCount} from './decor'

/** Original village pen positions, rest timing and count; no game state is changed. */
export function villageSheepFrames(flags:Record<string,number>,t:number){
 const spots=[[4,28],[6,29],[5,27.5],[4,29.5],[6.5,27.5]]
 return spots.slice(0,sheepCount({flags})).map(([sx,sy],i)=>{
  const cycle=t+i*2.7,resting=cycle%12>=9,travel=Math.floor(cycle/12)*9+Math.min(cycle%12,9)
  const x=sx+Math.sin(travel*.3+i*2)*.6,y=sy+Math.cos(travel*.23+i)*.5
  const side=Math.cos(travel*.3+i*2)>=0?'right' as const:'left' as const
  const action=resting?'graze' as const:'walk' as const,frame=Math.floor(cycle*(resting?3:6))%4
  return {x,y,side,action,frame}
 })
}
