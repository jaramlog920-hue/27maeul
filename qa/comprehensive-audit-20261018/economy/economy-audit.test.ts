import { describe, it, expect } from 'vitest'
import { CONTENT } from '../../../src/content/catalog'
import { newGame, trade, TRADES, type GameState } from '../../../src/engine/game'
import { canCook, startCook, sanitizeCooking, cookOf } from '../../../src/engine/cooking'
import { featureAccess } from '../../../src/engine/feature-rules'
import { serialize, deserialize } from '../../../src/engine/save'
import { visitKidWork } from '../../../src/engine/newland-life'
import { kidWorkOwners, ownerJob } from '../../../src/engine/kid-work'
import { newChild } from '../../../src/engine/child'
import { villageScores } from '../../../src/engine/villages'
import { createElement } from 'react'
import { render, fireEvent, screen, cleanup, act } from '@testing-library/react'
import { CopyPuzzle } from '../../../src/features/desk/CopyPuzzle'
import { CopyDesk } from '../../../src/features/desk/CopyDesk'
import { tilesFor } from '../../../src/engine/copy-ways'
import { copySpot, copyVerses } from '../../../src/engine/copying'
import { useGame } from '../../../src/store/game-store'
import { mulberry32 } from '../../../src/engine/offers'
import { rollDie, NEW_BOARD, playTurn } from '../../../src/engine/trip-board'
import { ITEM_TEXT } from '../../../src/content/text'
import { TOOLS, BAG_SLOTS, slotsUsed } from '../../../src/engine/items'

describe('Comprehensive economy independent reproductions', () => {
  it('preview herb tea loses already paid cooking run after save/load', () => {
    const fresh = newGame(CONTENT)
    const s: GameState = { ...fresh, inv: { herb: 1, water: 1 },
      progress: { ...fresh.progress, mt: { completed: Array.from({length:15},(_,i)=>i+1), arrangement: {} } },
      scenes: [], clock: { day: 10, minute: 600 }, needs: {...fresh.needs,fatigue:0} }
    expect(featureAccess(s,'cooking')).toBe('preview')
    expect(canCook(s,'herbTea')).toBeNull()
    const started = startCook(s,'herbTea',()=>0.5)
    expect(cookOf(started).run?.dish).toBe('herbTea')
    expect(started.inv.herb ?? 0).toBe(0)
    expect(started.inv.water ?? 0).toBe(0)
    expect(sanitizeCooking(started.cooking)?.run).toBeUndefined()
    const loaded = deserialize(serialize(started),CONTENT)!
    expect(loaded).not.toBeNull()
    expect(loaded.cooking?.run).toBeUndefined()
    expect(loaded.inv.herb ?? 0).toBe(0)
    expect(loaded.inv.water ?? 0).toBe(0)
    expect(loaded.inv.herbTea ?? 0).toBe(0)
    console.log('COOKING_REPRO',JSON.stringify({access:featureAccess(s,'cooking'),startedRun:started.cooking?.run?.dish,loadedRun:loaded.cooking?.run??null,loadedInv:loaded.inv}))
  })

  it('sibling/resident workshop visit resolves primary child regardless of building owner', () => {
    const fresh = newGame(CONTENT)
    const main = {...newChild(1,fresh.stats,'wit'), name:'Primary',job:'cook' as const}
    const other = {...newChild(2,fresh.stats,'hand'), name:'Sibling',job:'painter' as const}
    const workshop = {id:'b1',kind:'kidWork' as const,x:4,y:12,facing:'down' as const,state:'done' as const,orderedDay:1,paid:{coins:1000,items:{}},refunded:false,owner:'me:2'}
    const s: GameState = {...fresh, clock:{day:1000,minute:600},child:main,siblings:[other],flags:{...fresh.flags},newland:{builds:[workshop],tiles:{},nextId:2,settledDay:1000}}
    expect(ownerJob(s,workshop.owner)).toBe('painter')
    const result = visitKidWork(s)!
    expect(result).not.toBeNull()
    expect(result.dish).toBeDefined()
    const noMain = {...s,child:null} as GameState
    expect(visitKidWork(noMain)).toBeNull()
    console.log('WORKSHOP_REPRO',JSON.stringify({owner:workshop.owner,ownerJob:ownerJob(s,workshop.owner),returnedDish:result.dish,withoutPrimary:visitKidWork(noMain)}))
  })

  it('neighbor village scores can decrease across days although documented as never decreasing', () => {
    let decrease: unknown = null
    for(let day=1;day<200&&!decrease;day++){
      const prev=villageScores(20261007,day), next=villageScores(20261007,day+1)
      const index=next.findIndex((n,i)=>n<prev[i])
      if(index>=0)decrease={day,index,before:prev[index],after:next[index]}
    }
    expect(decrease).not.toBeNull()
    console.log('VILLAGE_SCORE_DECREASE',JSON.stringify(decrease))
  })

  it('visually identical duplicate word tiles produce a wrong answer',()=>{
    const verse=copyVerses('mt',1,CONTENT).find(v=>v.verse===2)!
    const tiles=tilesFor(verse.text,3,0,'mt',1,2)!
    const index=tiles.pieces.findIndex((text,i)=>tiles.pieces.indexOf(text)!==i)
    expect(index).toBeGreaterThan(0)
    let calls=0
    const view=render(createElement(CopyPuzzle,{data:{kind:'tiles',tiles},label:'audit puzzle',onDone:()=>calls++,onManual:()=>{}}))
    for(let i=0;i<tiles.pieces.indexOf(tiles.pieces[index]);i++){
      fireEvent.click(screen.getAllByRole('button',{name:tiles.pieces[i],exact:true}).find(b=>b.textContent===tiles.pieces[i])!)
    }
    const same=screen.getAllByRole('button',{name:tiles.pieces[index],exact:true})
    expect(same.length).toBeGreaterThan(1)
    // DOM order is shuffled: find the later semantic index in the authored order.
    const visible=tiles.order.filter(i=>i>=tiles.pieces.indexOf(tiles.pieces[index]))
    const wrongButton=Array.from(view.container.querySelectorAll('button.copy-tile'))[visible.indexOf(index)]
    fireEvent.click(wrongButton)
    expect(view.container.querySelector('.copy-puzzle')).toHaveClass('smudge')
    expect(calls).toBe(0)
    console.log('DUPLICATE_TILE_REPRO',JSON.stringify({ref:'마 1:2',pieces:tiles.pieces,wrongIndex:index,word:tiles.pieces[index]}))
    cleanup()
  })

  it('next-verse button during composition lets late compositionend write into next draft',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,scenes:[],copy:{book:'mt' as const,at:{mt:{chapter:1,verse:1}},legacy:{}}}
    useGame.setState({game,modal:{kind:'copy',view:'write'},trip:null,toast:null,piecePopups:[],copyResult:null,copySessionStats:null})
    const Wrapper=()=>{const modal=useGame(s=>s.modal);return modal?.kind==='copy'?createElement(CopyDesk,{modal}):null}
    render(createElement(Wrapper))
    const box=screen.getByLabelText('따라 적기') as HTMLTextAreaElement
    const target=copySpot(game,'mt',CONTENT)!.verse.text
    fireEvent.compositionStart(box)
    fireEvent.change(box,{target:{value:target}})
    fireEvent.click(screen.getByRole('button',{name:/다음 절/}))
    expect(copySpot(useGame.getState().game,'mt',CONTENT)!.verse.verse).toBe(2)
    fireEvent.compositionEnd(box,{target:{value:'아'}})
    expect(copySpot(useGame.getState().game,'mt',CONTENT)!.draft).toBe('아')
    console.log('COMPOSITION_RACE_REPRO',JSON.stringify({verse:2,draft:copySpot(useGame.getState().game,'mt',CONTENT)!.draft}))
    cleanup()
  })

  it('trip departure is persisted without payment/board; reload permits a fresh random board',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,scenes:[],clock:{day:20,minute:600},coins:1000,flags:{...fresh.flags,growthLegacy:1}}
    useGame.setState({game,modal:{kind:'travel'},trip:null,rng:mulberry32(1)})
    useGame.getState().startTripBoard('harbor',false)
    expect(useGame.getState().game).toBe(game)
    const roll1=rollDie(useGame.getState().rng)
    const first=playTurn(NEW_BOARD,roll1,useGame.getState().rng,{withChild:false}).board
    const loaded=deserialize(serialize(useGame.getState().game),CONTENT)!
    useGame.getState().load(loaded)
    expect(useGame.getState().trip).toBeNull()
    expect(loaded.coins).toBe(1000)
    expect(loaded.clock).toEqual(game.clock)
    useGame.setState({rng:mulberry32(999),modal:{kind:'travel'}})
    useGame.getState().startTripBoard('harbor',false)
    const roll2=rollDie(useGame.getState().rng)
    const second=playTurn(NEW_BOARD,roll2,useGame.getState().rng,{withChild:false}).board
    expect(second).not.toEqual(first)
    console.log('TRIP_REROLL_REPRO',JSON.stringify({roll1,roll2,coins:loaded.coins,day:loaded.clock.day}))
  })

  it('returning from trip generates rank popup but never opens it before next sleep clears it',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,scenes:[],clock:{day:20,minute:600},coins:1000,flags:{...fresh.flags,growthLegacy:1}}
    useGame.setState({game,modal:{kind:'travel',dest:'harbor',rewards:[]},trip:null,piecePopups:[],copyResult:null})
    useGame.getState().goTrip('harbor',[],[])
    expect(useGame.getState().game.clock.day).toBe(21)
    expect(useGame.getState().game.rankPopup?.day).toBe(21)
    expect(useGame.getState().modal?.kind).not.toBe('rank')
    console.log('TRIP_RANK_REPRO',JSON.stringify({popupDay:useGame.getState().game.rankPopup?.day,modal:useGame.getState().modal?.kind}))
  })

  it('buying a tool when all bag slots are full consumes money but loses tool',()=>{
    const fresh=newGame(CONTENT)
    const ids=Object.keys(ITEM_TEXT).filter(id=>!TOOLS.includes(id as any)).slice(0,BAG_SLOTS)
    const inv=Object.fromEntries(ids.map(id=>[id,1]))
    expect(slotsUsed(inv)).toBe(BAG_SLOTS)
    const s={...fresh,coins:10000,inv,clock:{day:7,minute:600}}
    const bought=trade(s,TRADES.find(t=>t.id==='homeKey')!)!
    expect(bought).not.toBeNull()
    expect(bought.coins).toBe(2000)
    expect(bought.inv.homeKey).toBeUndefined()
    expect(bought.chest?.homeKey).toBeUndefined()
    console.log('TOOL_LOSS_REPRO',JSON.stringify({beforeCoins:s.coins,afterCoins:bought.coins,slots:slotsUsed(bought.inv),tool:bought.inv.homeKey??null}))
  })
})
