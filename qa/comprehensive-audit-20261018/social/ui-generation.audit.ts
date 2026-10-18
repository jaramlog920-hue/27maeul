import { createElement } from 'react'
import { render,screen,fireEvent,cleanup } from '@testing-library/react'
import { afterEach,describe,it,expect,vi } from 'vitest'
import { CONTENT } from '../../../src/content/catalog'
import { newGenState,BAKER_BABY_ID } from '../../../src/engine/gen'
import { companionsOf } from '../../../src/engine/gen-looks'
import { establishedGame } from '../../../src/engine/growth-test-support'
import { GenTalk } from '../../../src/features/talk/GenTalk'
import { useGame } from '../../../src/store/game-store'
vi.mock('../../../src/features/work/WorkDay',()=>({applyLifeState:(game:any)=>useGame.setState({game})}))
afterEach(cleanup)

describe('social UI and generation reproductions',()=>{
 it('reproduces baker child rendered twice during apprenticeship and once alongside itself after succession',()=>{
  let g=newGenState(CONTENT,1,100)
  g={...g,heirs:{baker:{heir:BAKER_BABY_ID,since:92}}}
  const apprentice=companionsOf(g,'baker',100).map(x=>x.person.id)
  expect(apprentice).toEqual([BAKER_BABY_ID,BAKER_BABY_ID])
  const retired={...g,retired:{baker:{heir:BAKER_BABY_ID,day:132}}}
  expect(companionsOf(retired,'baker',132).map(x=>x.person.id)).toContain(BAKER_BABY_ID)
 })
 it('reproduces wedding preparation gratitude written to generated IDs instead of inherited neighbor slots',()=>{
  let s=establishedGame(CONTENT,200)
  let g=newGenState(CONTENT,5,300)
  const person=(id:string,parent:string,look:'m'|'f')=>({id,origin:'born' as const,born:100,stage:'adult' as const,look,name:id,parents:[parent],spouse:null,household:null})
  g={...g,persons:{...g.persons,'g-0001':person('g-0001','cosmo','m'),'g-0002':person('g-0002','poppy','f')},retired:{cosmo:{heir:'g-0001',day:250},poppy:{heir:'g-0002',day:250}},relations:{'g-0001|g-0002':{id:'g-0001|g-0002',a:'g-0001',b:'g-0002',stage:'preparing',since:299,prep:{tasks:['bread','oil'],done:[],wedding:306}}}}
  s={...s,clock:{day:300,minute:600},scenes:[],gen:g,inv:{...s.inv,bread:2},hearts:{cosmo:10,poppy:10},heartDay:undefined}
  useGame.setState({game:s,modal:null})
  render(createElement(GenTalk,{npc:'g-0001'}))
  fireEvent.click(screen.getByRole('button',{name:'준비 돕기'}))
  const result=useGame.getState().game
  expect(result.inv.bread??0).toBe(0)
  expect(result.gen!.relations['g-0001|g-0002'].prep!.done).toContain('bread')
  expect(result.hearts.cosmo).toBe(10)
  expect(result.hearts.poppy).toBe(10)
  expect(result.hearts['g-0001']).toBeGreaterThan(0)
  expect(result.hearts['g-0002']).toBeGreaterThan(0)
 })
})
