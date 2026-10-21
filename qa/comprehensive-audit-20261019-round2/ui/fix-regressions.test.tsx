import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { CONTENT } from '../../../src/content/catalog'
import { newGame, syncHome, canBuildWall, buildWall, placeFurniture } from '../../../src/engine/game'
import { ARCHIVE_CTX, slotCtx } from '../../../src/engine/newland-rooms'
import { INTERIOR_ENTRY, ROOM_SLOTS } from '../../../src/engine/newland-config'
import { NEWLAND_MAP } from '../../../src/engine/newland'
import { setActiveMap } from '../../../src/engine/maps'
import { placement } from '../../../src/engine/room'
import { drawVillageMap } from '../../../src/render/renderer'
import { WIDTH, HEIGHT, TILE } from '../../../src/engine/world'
import { ControlDeck } from '../../../src/features/play/ControlDeck'
import { ScheduleDialog } from '../../../src/features/play/EventSchedule'
import { TradeBoard } from '../../../src/features/talk/TradeBoard'
import { useGame } from '../../../src/store/game-store'
import { scheduledEvents } from '../../../src/engine/events'
import { WEDDING_ATTIRE } from '../../../src/engine/wedding-attire'
import { T } from '../../../src/content/text'

afterEach(()=>{cleanup();vi.restoreAllMocks();setActiveMap('village')})

it('current tree installs all four wall collections in archive and both home contexts',()=>{
 const base=newGame(CONTENT)
 const state={...base,map:'newland' as const,homeLevel:3 as const,flags:{...base.flags,growthLegacy:1,newlandGift:1,newlandRevealed:1},player:{...base.player,...INTERIOR_ENTRY}}
 syncHome(state)
 const walls=(ctx:typeof ARCHIVE_CTX)=>NEWLAND_MAP.flatMap((row,y)=>[...row].flatMap((ch,x)=>ch==='#'&&ctx.isFloor({x,y:y+1})?[{x,y}]:[]))
 for(const item of ['copyClothesNiche','copySpringFlowers','copySummerShells','copyAutumnLeaves'] as const){
  for(const ctx of [ARCHIVE_CTX,...ROOM_SLOTS.map(slotCtx)]){
   expect(walls(ctx).length).toBeGreaterThan(0)
   expect(walls(ctx).some(t=>placement([],item,t,'down',ctx)!==null)).toBe(true)
  }
  expect(walls(ARCHIVE_CTX).some(t=>placeFurniture({...state,inv:{...state.inv,[item]:1}},item,t)!==null)).toBe(true)
 }
})

it('current map cache evicts an old layout after thirteen unique legal layouts',()=>{
 const base=newGame(CONTENT)
 let state={...base,homeLevel:3 as const,coins:5000,flags:{...base.flags,growthLegacy:1}}
 syncHome(state)
 const contexts=new WeakMap<HTMLCanvasElement,CanvasRenderingContext2D>()
 let large=0
 const make=()=>new Proxy({fillStyle:''},{get(t,k){return k in t?t[k as keyof typeof t]:()=>undefined},set(t,k,v){Reflect.set(t,k,v);return true}}) as unknown as CanvasRenderingContext2D
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(function(this:HTMLCanvasElement){
  if(!contexts.has(this)){contexts.set(this,make());if(this.width===WIDTH*TILE&&this.height===HEIGHT*TILE)large++}
  return contexts.get(this)!
 } as never)
 const states=[state]
 for(let i=0;i<12;i++){
  const tile=Array.from({length:14},(_,y)=>Array.from({length:26},(_,x)=>({x:x+6,y:y+104}))).flat().find(t=>canBuildWall(state,t)===null)!
  expect(tile).toBeDefined();state=buildWall(state,tile)! as typeof state;states.push(state)
 }
 const g=make()
 for(const s of states){syncHome(s);drawVillageMap(g,s)}
 expect(large).toBe(13)
 syncHome(states[0]);drawVillageMap(g,states[0])
 expect(large).toBe(14)
})

it('current default deck and schedule share appointments and own wedding',()=>{
 const base=newGame(CONTENT)
 const appt={id:'appt:1',kind:'event' as const,activity:'tea' as const,title:'감사 재현 차 모임',day:1,from:600,to:660,place:'hallTable' as const,members:['grandpa'],state:'planned' as const,rewarded:false,remembered:false}
 const game={...base,clock:{day:1,minute:590},today:{},plans:{appts:[appt],nextId:2}}
 useGame.setState({game,modal:null,deck:true})
 let view=render(<ControlDeck/>);expect(view.container.querySelector('.deck-next')!.textContent).toContain(appt.title);view.unmount()
 const weddingState={...base,clock:{day:7,minute:1079},today:{},romance:{...base.romance,stage:'engaged' as const,partner:'wendell',weddingDay:7}}
 const wedding=scheduledEvents(weddingState,CONTENT).find(e=>e.id==='7:wedding')!
 expect(wedding).toBeDefined();useGame.setState({game:weddingState,modal:null,deck:true})
 view=render(<ScheduleDialog/>);expect(view.getByText(wedding.title)).toBeDefined()
})

it('current wedding attire trade cards and selected title have names',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
 const base=newGame(CONTENT);useGame.setState({game:{...base,clock:{day:7,minute:600},coins:5000},modal:null})
 const view=render(<TradeBoard/>),section=[...view.container.querySelectorAll('.icon-grid')].find(e=>e.getAttribute('aria-label')==='결혼 예복')!
 const buttons=[...section.querySelectorAll<HTMLButtonElement>('.bag-grid button')];expect(buttons).toHaveLength(4)
 for(let i=0;i<WEDDING_ATTIRE.length;i++){expect((T.trades as Record<string,string>)[WEDDING_ATTIRE[i].item]).toBe(WEDDING_ATTIRE[i].name);expect(buttons[i].getAttribute('aria-label')).toBe(WEDDING_ATTIRE[i].name)}
 fireEvent.click(buttons[0]);expect(section.querySelector('.bag-detail strong')!.textContent).toBe(WEDDING_ATTIRE[0].name)
})
