import {writeFileSync} from 'node:fs'
import {CONTENT} from '../../../src/content/catalog'
import {newGame,tick,syncHome, type GameState} from '../../../src/engine/game'
import {deserialize,serialize,exportSave} from '../../../src/engine/save'
import {addGift,count} from '../../../src/engine/items'

const out='qa/comprehensive-audit-20261019-round2/root/'
it('bounded malformed-save exploration: accepted data survives another save and one frame',()=>{
 const base=JSON.parse(serialize({...newGame(CONTENT),scenes:[]}))
 const paths=[...Object.keys(base).filter(k=>!['version','clock','player'].includes(k)),
  'clock.day','clock.minute','player.x','player.y','player.path','player.facing','avatar.name','avatar.look','avatar.frontHair',
  'needs.hunger','flags.homeLevel','inv.bread','inv.fig','garden.26,20','today.gathering','today.visitor','journal.0',
  'life.memories','life.recent','life.cool','life.promises','copy.book','copy.at','copy.draft','copy.verses','hearts.baker']
 const values=[null,-1,0,0.5,42,'2','x',[],{},[null]]
 const results:Record<string,unknown>[]=[]
 for(const path of paths)for(const value of values){
  const raw=structuredClone(base)
  const keys=path.split('.');let target=raw
  for(const key of keys.slice(0,-1))target=target[key]??=(/^[0-9]+$/.test(key)?[]:{})
  target[keys.at(-1)!]=value
  const state=deserialize(JSON.stringify(raw),CONTENT)
  if(!state){results.push({path,value,status:'rejected'});continue}
  const result:Record<string,unknown>={path,value,status:'accepted'}
  try{
   const second=deserialize(serialize(state),CONTENT)
   result.reload=second!==null
   syncHome(state);const next=tick(state,0.05,()=>0.5,CONTENT).state
   result.frame='ok';result.finiteCoins=Number.isFinite(next.coins)
  }catch(e){result.error=String(e);result.frame='throws'}
  results.push(result)
 }
 const problems=results.filter(r=>r.error||r.reload===false||r.finiteCoins===false)
 writeFileSync(out+'malformed-save-exploration.json',JSON.stringify({cases:results.length,accepted:results.filter(r=>r.status==='accepted').length,problems,results},null,2))
 expect(results.length).toBeGreaterThan(500)
 expect(problems).toEqual([])
})

it('inspects inventory count normalization at import boundary',()=>{
 const data=JSON.parse(serialize(newGame(CONTENT)))
 data.inv={bread:'2',fig:-1,honey:0.5,barley:3}
 const loaded=deserialize(JSON.stringify(data),CONTENT)!
 expect(loaded).not.toBeNull()
 const gifted=addGift(loaded.inv,{bread:1})
 expect(loaded.inv).toEqual({bread:'2',fig:-1,honey:0.5,barley:3})
 expect(gifted.bread).toBe('21')
 expect(addGift({bread:2},{bread:1}).bread).toBe(3)
 writeFileSync(out+'inventory-boundary.json',JSON.stringify({loaded:loaded.inv,afterGift:gifted,count:count(gifted,'bread')},null,2))
})

it('writes only synthetic fixture for actual browser import/reload',()=>{
 const s={...newGame(CONTENT,{name:'감사가져오기',look:'m'}),clock:{day:7,minute:600},coins:789,scenes:[]} satisfies GameState
 const text=exportSave(s)
 expect(deserialize(JSON.parse(text).save,CONTENT)?.coins).toBe(789)
 writeFileSync(out+'browser-import.json',text)
})
