import { describe,it,expect,afterEach } from 'vitest'
import { createElement } from 'react'
import { render,fireEvent,screen,cleanup,act } from '@testing-library/react'
import { CONTENT } from '../../../src/content/catalog'
import { newGame,trade,TRADES,type GameState } from '../../../src/engine/game'
import { ITEM_TEXT } from '../../../src/content/text'
import { startCook,cookOf,sanitizeCooking } from '../../../src/engine/cooking'
import { serialize,deserialize } from '../../../src/engine/save'
import { featureAccess } from '../../../src/engine/feature-rules'
import { TOOLS,BAG_SLOTS,slotsUsed } from '../../../src/engine/items'
import { tilesFor } from '../../../src/engine/copy-ways'
import { copySpot,copyVerses } from '../../../src/engine/copying'
import { CopyPuzzle } from '../../../src/features/desk/CopyPuzzle'
import { CopyDesk } from '../../../src/features/desk/CopyDesk'
import { FacilityView } from '../../../src/features/newland/FacilityView'
import { useGame } from '../../../src/store/game-store'
import { newChild } from '../../../src/engine/child'
import { ownerJob } from '../../../src/engine/kid-work'
import { mulberry32 } from '../../../src/engine/offers'
import { tripSeed,playTurn,NEW_BOARD,rollDie } from '../../../src/engine/trip-board'

afterEach(()=>{cleanup();localStorage.clear()})
describe('Current snapshot revalidation 2026-10-19',()=>{
  it('E01 resolved: preview cooking is retained on reload',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,inv:{herb:1,water:1},scenes:[],clock:{day:10,minute:600},progress:{...fresh.progress,mt:{completed:Array.from({length:15},(_,i)=>i+1),arrangement:{}}}}
    expect(featureAccess(game,'cooking')).toBe('preview')
    const started=startCook(game,'herbTea',()=>.5)
    expect(cookOf(started).run?.dish).toBe('herbTea')
    expect(sanitizeCooking(started.cooking)?.run?.dish).toBe('herbTea')
    const loaded=deserialize(serialize(started),CONTENT)!
    expect(loaded.cooking?.run?.dish).toBe('herbTea')
    console.log('CURRENT_E01_RESOLVED',JSON.stringify({run:loaded.cooking?.run?.dish,preview:loaded.cooking?.run?.preview}))
  })
  it('E04 resolved: identical tiles accept either copy',()=>{
    const verse=copyVerses('mt',1,CONTENT).find(v=>v.verse===2)!
    const tiles=tilesFor(verse.text,3,0,'mt',1,2)!
    const duplicate=tiles.pieces.findIndex((word,i)=>tiles.pieces.indexOf(word)!==i)
    const expected=tiles.pieces.indexOf(tiles.pieces[duplicate])
    const view=render(createElement(CopyPuzzle,{data:{kind:'tiles',tiles},label:'audit puzzle',onDone:()=>{},onManual:()=>{}}))
    for(let i=0;i<expected;i++)fireEvent.click(screen.getByRole('button',{name:tiles.pieces[i],exact:true}))
    const visible=tiles.order.filter(i=>i>=expected)
    fireEvent.click(view.container.querySelectorAll('button.copy-tile')[visible.indexOf(duplicate)])
    expect(view.container.querySelector('.copy-puzzle')).not.toHaveClass('smudge')
    expect(view.container.querySelector('.copy-puzzle-line')).toHaveTextContent(tiles.pieces.slice(0,expected+1).join(' '))
    console.log('CURRENT_E04_RESOLVED',JSON.stringify({word:tiles.pieces[duplicate],accepted:true}))
  })
  it('E05 resolved: late compositionend does not corrupt next verse draft',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,scenes:[],copy:{book:'mt' as const,at:{mt:{chapter:1,verse:1}},legacy:{}}}
    useGame.setState({game,modal:{kind:'copy',view:'write'},trip:null,toast:null,piecePopups:[],copyResult:null,copySessionStats:null})
    const Wrapper=()=>{const modal=useGame(s=>s.modal);return modal?.kind==='copy'?createElement(CopyDesk,{modal}):null}
    render(createElement(Wrapper))
    const box=screen.getByLabelText('따라 적기') as HTMLTextAreaElement
    fireEvent.compositionStart(box)
    fireEvent.change(box,{target:{value:copySpot(game,'mt',CONTENT)!.verse.text}})
    fireEvent.click(screen.getByRole('button',{name:/다음 절/}))
    expect(copySpot(useGame.getState().game,'mt',CONTENT)!.verse.verse).toBe(2)
    fireEvent.compositionEnd(box,{target:{value:'아'}})
    expect(copySpot(useGame.getState().game,'mt',CONTENT)!.draft).toBe('')
    console.log('CURRENT_E05_RESOLVED',JSON.stringify({verse:2,draft:copySpot(useGame.getState().game,'mt',CONTENT)!.draft}))
  })
  it('E06 resolved: real travel RNG seed yields same board after reload',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,clock:{day:20,minute:600},coins:1000,flags:{...fresh.flags,growthLegacy:1}}
    const loaded=deserialize(serialize(game),CONTENT)!
    const run=(s:GameState)=>{const rnd=mulberry32(tripSeed(s,'harbor'));let board=NEW_BOARD;while(!board.done)board=playTurn(board,rollDie(rnd),rnd,{withChild:false}).board;return board}
    expect(run(loaded)).toEqual(run(game))
    console.log('CURRENT_E06_RESOLVED',JSON.stringify({seedBefore:tripSeed(game,'harbor'),seedAfter:tripSeed(loaded,'harbor')}))
  })
  it('E07 resolved: frame opens pending trip rank after fragment and scenes close',()=>{
    const fresh=newGame(CONTENT)
    const game={...fresh,scenes:[],clock:{day:20,minute:600},coins:1000,flags:{...fresh.flags,growthLegacy:1}}
    useGame.setState({game,modal:{kind:'travel',dest:'harbor',rewards:[]},trip:null,piecePopups:[],copyResult:null})
    useGame.getState().goTrip('harbor',[],[])
    const returned=useGame.getState().game
    expect(returned.rankPopup?.day).toBe(21)
    useGame.setState({game:{...returned,scenes:[],act:null,target:null},modal:null,piecePopups:[],copyResult:null})
    useGame.getState().frame(0)
    expect(useGame.getState().modal?.kind).toBe('rank')
    console.log('CURRENT_E07_RESOLVED',JSON.stringify({popupDay:21,modal:useGame.getState().modal?.kind}))
  })
  it('E08 persists: full bag tool purchase charges coins but loses homeKey',()=>{
    const fresh=newGame(CONTENT)
    const inv=Object.fromEntries(Object.keys(ITEM_TEXT).filter(id=>!TOOLS.includes(id as any)).slice(0,BAG_SLOTS).map(id=>[id,1]))
    expect(slotsUsed(inv)).toBe(50)
    const before={...fresh,coins:10000,inv,clock:{day:7,minute:600}}
    const after=trade(before,TRADES.find(t=>t.id==='homeKey')!)!
    expect(after).not.toBeNull()
    expect(after.coins).toBe(2000)
    expect(after.inv.homeKey).toBeUndefined()
    expect(after.chest?.homeKey).toBeUndefined()
    console.log('CURRENT_E08_CONFIRMED',JSON.stringify({coins:after.coins,homeKey:after.inv.homeKey??null,slots:slotsUsed(after.inv)}))
  })
  it('E02 current remaining issue: sibling workshop UI names and rewards primary child',()=>{
    const fresh=newGame(CONTENT)
    const child={...newChild(1,fresh.stats,'wit'),name:'Primary',job:'cook' as const}
    const sibling={...newChild(2,fresh.stats,'hand'),name:'Sibling',job:'painter' as const}
    const build=(id:string,x:number,owner:string)=>({id,kind:'kidWork' as const,x,y:12,facing:'down' as const,state:'done' as const,orderedDay:1,paid:{coins:1000,items:{}},refunded:false,owner})
    const own=build('b1',4,'me:1'),other=build('b2',12,'me:2')
    const game={...fresh,clock:{day:1000,minute:600},child,siblings:[sibling],newland:{builds:[own,other],tiles:{},nextId:3,settledDay:1000},map:'newland' as const,player:{...fresh.player,x:14,y:16}}
    expect(ownerJob(game,other.owner)).toBe('painter')
    useGame.setState({game,modal:{kind:'facility',id:'kidWork',at:{x:14,y:16}} as any})
    render(createElement(FacilityView,{id:'kidWork',at:{x:14,y:16}}))
    expect(screen.getByRole('heading')).toHaveTextContent('Primary')
    expect(screen.getByRole('heading')).not.toHaveTextContent('Sibling')
    expect(useGame.getState().game.inv.bread??0).toBe((game.inv.bread??0)+1)
    console.log('CURRENT_E02_CONFIRMED',JSON.stringify({buildingOwner:other.owner,actualJob:ownerJob(game,other.owner),title:screen.getByRole('heading').textContent,awardedPrimaryCookBread:true}))
  })
})
