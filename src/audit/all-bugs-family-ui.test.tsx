import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { withLookDefaults } from '../engine/avatar'
import { newGenState, type GenState } from '../engine/gen'
import { legacyGame } from '../engine/growth-test-support'
import { Family } from '../features/family/Family'
import { useGame } from '../store/game-store'
import { scheduledEvents } from '../engine/events'

afterEach(cleanup)
it('family wardrobe entry uses the current heir name and opens the same spouse wardrobe',()=>{
  const b=legacyGame(CONTENT),g=newGenState(CONTENT,1,300)
  const gen:GenState={...g,persons:{...g.persons,'g-1':{id:'g-1',origin:'born',born:100,stage:'adult',look:'f',name:'새봄',parents:['cosmo'],spouse:null,household:null}},retired:{cosmo:{heir:'g-1',day:250}}}
  useGame.getState().load({...b,gen,avatar:withLookDefaults({look:'m',name:'검사'}),romance:{...b.romance,stage:'married',partner:'cosmo'},scenes:[]})
  useGame.setState({modal:{kind:'family'}})
  render(<Family />)
  fireEvent.click(screen.getByRole('button',{name:'새봄 옷장'}))
  expect(useGame.getState().modal).toEqual({kind:'wardrobe',who:'spouse'})
})
it('an actual retired parent wedding keeps the parent name while a slot-based player wedding uses its heir',()=>{
  const b=legacyGame(CONTENT),g=newGenState(CONTENT,1,300)
  const gen:GenState={...g,persons:{...g.persons,cosmo:{...g.persons.cosmo,name:'부모'},'g-1':{id:'g-1',origin:'born',born:100,stage:'adult',look:'f',name:'후계',parents:['cosmo'],spouse:null,household:null}},retired:{cosmo:{heir:'g-1',day:250}},relations:{r:{id:'r',a:'cosmo',b:'poppy',stage:'preparing',since:290,prep:{tasks:[],done:[],wedding:301}}}}
  const events=scheduledEvents({...b,gen,clock:{day:300,minute:600},romance:{...b.romance,stage:'engaged',partner:'cosmo',weddingDay:301}},CONTENT)
  expect(events.find(e=>e.id.includes('genWedding'))?.title).toContain('부모')
  expect(events.find(e=>e.id.endsWith(':wedding'))?.title).toContain('후계')
})
