import {it} from 'vitest'
import {writeFileSync} from 'node:fs'
import {CONTENT} from '../../src/content/catalog'
import {establishedGame} from '../../src/engine/growth-test-support'
import {tick,settle} from '../../src/engine/game'
import {weatherOf} from '../../src/engine/calendar'
import * as movement from '../../src/engine/movement'
import {key} from '../../src/engine/world'
it('실제 비오는 날 목장 위치별 실패 경로 기록',()=>{
 const days=[1,Array.from({length:35},(_,i)=>i+3).find(d=>weatherOf(d)==='rain')!]
 const original=movement.findWarpRoute, failures:any[]=[]
 let context:any={}
 const spy=vi.spyOn(movement,'findWarpRoute').mockImplementation((from,to,blockers)=>{
  const result=original(from,to,blockers)
  if(!result)failures.push({...context,from,to,playerBlocked:!!blockers?.has(key(context.player)),blocked:[...(blockers??[])].filter(k=>Number(k.split(',')[1])<34)})
  return result
 })
 for(const day of days)for(const minute of [399, 9*60,12*60,1079,1199])for(const player of [{x:10,y:30},{x:5,y:27},{x:5,y:28}]){
  let s=establishedGame(CONTENT,14)
  s=settle({...s,scenes:[],clock:{day,minute},player:{...s.player,...player,path:[]}},CONTENT)
  s={...s,scenes:[]}
  context={day,minute,weather:weatherOf(day),player}
  for(let i=0;i<40;i++)s=tick(s,.1,()=>.5,CONTENT).state
 }
 spy.mockRestore()
 writeFileSync('artifacts/scenery/pasture-actual-failures.json',JSON.stringify({days,failures},null,2))
},120000)
