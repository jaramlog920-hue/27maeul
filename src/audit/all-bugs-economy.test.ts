import { describe, it, expect, afterEach } from 'vitest'
import { createElement } from 'react'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { CONTENT } from '../content/catalog'
import { ITEM_TEXT, T } from '../content/text'
import { newGame, trade, TRADES, useStock, overflows, moveFurniture, syncHome, chestOf, putAway, canTrip, takeTrip, startCopyAgain, writeVerse, goToSleep, type GameState } from '../engine/game'
import { TOOLS, slotsUsed, count } from '../engine/items'
import { stash, stashOverflows } from '../engine/easier'
import { newChild } from '../engine/child'
import { useGame } from '../store/game-store'
import { FacilityView } from '../features/newland/FacilityView'
import { SkillCraftOptions } from '../features/skills/SkillLesson'
import { craftLearned, SKILL_DEFS } from '../engine/skills'
import { placement, type Furniture } from '../engine/room'
import { designateSpace } from '../engine/spaces'
import { canServe, cookOf, serveTable, dinersNear, settleTable } from '../engine/cooking'
import { serialize, deserialize } from '../engine/save'
import { harvest, GARDEN_TILES } from '../engine/garden'
import { mulberry32 } from '../engine/offers'
import { tripSeed, playTurn, rollDie, NEW_BOARD } from '../engine/trip-board'
import { TravelView } from '../features/talk/TravelView'
import { acceptInput, copyVerses } from '../engine/copying'
import { finishBlankQuiz } from '../engine/blank-quiz'

afterEach(() => { cleanup(); localStorage.clear() })
const pool = Object.keys(ITEM_TEXT).filter(id => !TOOLS.includes(id as never))
function bag(n: number, omit: string[] = []) { return Object.fromEntries(pool.filter(id => !omit.includes(id)).slice(0, n).map(id => [id, 1])) }
function world(): GameState { const f = newGame(CONTENT); return { ...f, scenes: [], clock: { day: 7, minute: 600 }, flags: { ...f.flags, growthLegacy: 1 } } }

describe('Current 2026-10-19 round2 economy audit', () => {
  it('old E08 fixed: full bag paid tool purchase is rejected without any charge, 49 slots accepts', () => {
    const t = TRADES.find(t => t.id === 'homeKey')!
    for (const hasChest of [false, true]) {
      const f = world(), full = { ...f, inv: bag(50), coins: 10000, flags: { ...f.flags, ...(hasChest ? { 'unlock:supplyChest': 1 } : {}) } }
      expect(trade(full, t)).toBeNull()
      expect(full.coins).toBe(10000)
      const fits = trade({ ...full, inv: bag(49) }, t)!
      expect(fits.coins).toBe(2000); expect(fits.inv.homeKey).toBe(1)
    }
    console.log('R2_E08_FIXED full50 rejected; free49 tool delivered; chest does not bypass')
  })
  it('old E02 fixed: clicked sibling workshop has sibling title and no primary cook gift; own visit is once', () => {
    const f = world(), child = { ...newChild(1, f.stats, 'wit'), name: 'Primary', job: 'cook' as const }, sibling = { ...newChild(2, f.stats, 'hand'), name: 'Sibling', job: 'painter' as const }
    const b = (id: string, x: number, owner: string) => ({ id, kind: 'kidWork' as const, x, y: 12, facing: 'down' as const, state: 'done' as const, orderedDay: 1, paid: { coins: 1000, items: {} }, refunded: false, owner })
    const game = { ...f, clock: { day: 1000, minute: 600 }, child, siblings: [sibling], newland: { builds: [b('b1', 4, 'me:1'), b('b2', 12, 'me:2')], tiles: {}, nextId: 3, settledDay: 1000 }, map: 'newland' as const, player: { ...f.player, x: 14, y: 16 } }
    useGame.setState({ game, modal: null, piecePopups: [] })
    const r = render(createElement(FacilityView, { id: 'kidWork', at: { x: 14, y: 16 } }))
    expect(screen.getByRole('heading')).toHaveTextContent('Sibling')
    expect(useGame.getState().game.inv.bread).toBe(game.inv.bread)
    r.unmount()
    const own = render(createElement(FacilityView, { id: 'kidWork', at: { x: 6, y: 16 } }))
    const after = useGame.getState().game
    expect(count(after.inv, 'bread')).toBe(count(game.inv, 'bread') + 1)
    own.unmount(); render(createElement(FacilityView, { id: 'kidWork', at: { x: 6, y: 16 } }))
    expect(count(useGame.getState().game.inv, 'bread')).toBe(count(after.inv, 'bread'))
    console.log('R2_E02_FIXED sibling correct/no gift; primary gift exactly once')
  })
  it('stash delivery invariant across boundary bag sizes and chest stacks', () => {
    let probes = 0
    for (const size of [0, 49, 50, 51]) for (const chestSize of [null, 0, 29, 30]) for (const n of [1, 2, 30, 99, 100]) {
      const inv = bag(size, ['herb', 'bean']), chest = chestSize === null ? null : { herb: chestSize, bean: chestSize }
      const gives = { herb: n, bean: 1 }
      const full = stashOverflows(inv, chest, gives), after = stash(inv, chest, gives)
      const allDelivered = Object.entries(gives).every(([id, qty]) => count(after.inv, id as never) + count(after.chest ?? {}, id as never) - count(inv, id as never) - count(chest ?? {}, id as never) === qty)
      expect(full, JSON.stringify({size,chestSize,n})).toBe(!allDelivered); probes++
    }
    console.log('R2_STASH_BOUNDARIES', probes)
  })
  it.each(['carpenterFinish', 'clothColor', 'snackShape', 'basketCare', 'flowerKeep'])('candidate: learned craft %s blocks despite consumed ingredients freeing enough room', (id) => {
    const f = world(), def = SKILL_DEFS[id], ingredients = def.needs!
    const inv = { ...bag(50 - Object.keys(ingredients).length, [def.item, ...Object.keys(ingredients)]), ...ingredients }
    const game = { ...f, inv, skills: { [id]: { day: 1, from: def.teachers[0], picked: def.styles[0] } } }
    expect(slotsUsed(inv)).toBe(50)
    expect(overflows(game, { [def.item]: 1 })).toBe(true)
    const paid = useStock(game, ingredients)!
    expect(overflows(paid, { [def.item]: 1 })).toBe(false)
    expect(craftLearned(game, id).inv[def.item]).toBe(1)
    useGame.setState({ game, modal: null })
    render(createElement(SkillCraftOptions, { at: def.at }))
    const make = T.skill.make.replace('{item}', ITEM_TEXT[def.item].name)
    expect(screen.getByRole('button', { name: make })).toBeEnabled()
    const [remove] = Object.keys(inv).filter(k => !Object.keys(ingredients).includes(k))
    const freed = { ...inv }; delete freed[remove as keyof typeof freed]
    const made = craftLearned({ ...game, inv: freed }, id)
    expect(made.inv[def.item]).toBe(1)
    console.log('R2_CRAFT_FALSE_FULL', JSON.stringify({id,slotsBefore:50,slotsAfterPayment:slotsUsed(paid.inv),rejected:true,controlDelivered:made.inv[def.item]}))
  })
  it('candidate: moving a live served tea space leaves its primary coordinate at the old table', () => {
    const f = world()
    let g: GameState = { ...f, homeLevel: 3, room: [], spaces: [], inv: { beanDish: 2 }, clock: { day: 7, minute: 900 }, player: { ...f.player, x: 22, y: 114, path: [] } }
    let room: Furniture[] = []
    for (const [item, x, y] of [['table', 9, 112], ['chair', 10, 113], ['chair', 11, 113]] as const) {
      syncHome({ ...g, room }); const p = placement(room, item, { x, y }); expect(p, `${item} ${x},${y}`).not.toBeNull(); room.push(p!)
    }
    syncHome({ ...g, room }); const spaces = designateSpace(room, [], room[0], 'tea')!
    expect(spaces).not.toBeNull(); g = { ...g, room, spaces }
    expect(canServe(g)).toBeNull(); g = serveTable(g, 'beanDish', 2); expect(cookOf(g).table?.left).toBe(2)
    for (const [item, oldX, oldY, x, y] of [['table',9,112,11,112]] as const) {
      const p = g.room.find(p => p.item === item && p.x === oldX && p.y === oldY)!
      const moved = moveFurniture(g, p, { x, y }); expect(moved, `${item} -> ${x},${y}`).not.toBeNull(); g = moved!
    }
    g = { ...g, npcs: { ...g.npcs, baker: { ...g.npcs.baker, visible: true, x: 14, y: 112, path: [] } } }
    const settled = settleTable(g)
    expect(settled.cooking?.table?.left).toBe(2)
    const beforeReload = dinersNear(settled).map(d => d.id)
    const loaded = deserialize(serialize(settled), CONTENT)!
    // NPC positions are transient and rebuilt on load. Hold positions equal to isolate the persisted space metadata.
    const afterReload = dinersNear({ ...loaded, npcs: settled.npcs }).map(d => d.id)
    console.log('R2_MOVED_TABLE', JSON.stringify({space:settled.spaces[0],beforeReload,afterReload,loadedAt:loaded.spaces[0]?.at}))
    expect(settled.spaces[0].at).toEqual({x:11,y:112})
    expect(beforeReload).toContain('baker'); expect(afterReload).toContain('baker')
  })
  it('candidate: harvest ignores usable household storage while generic collection delivers to that same chest', () => {
    const f = world(), at = GARDEN_TILES[0]
    const game: GameState = { ...f, homeLevel: 3, inv: bag(50, ['herb']), chest: {}, room: [{item:'breadCupboard',x:10,y:112}], garden: {[`${at.x},${at.y}`]:{crop:'herb',grown:3,wateredDay:7}} }
    syncHome(game)
    expect(chestOf(game)).toEqual({})
    expect(overflows(game,{herb:2})).toBe(false)
    expect(putAway(game,{herb:2}).chest.herb).toBe(2)
    expect(harvest(game,at)!.chest.herb).toBe(2)
    const unlocked=harvest({...game,flags:{...game.flags,'unlock:supplyChest':1}},at)!
    expect(unlocked.chest.herb).toBe(2)
    console.log('R2_GARDEN_STORAGE',JSON.stringify({genericChestUsable:true,genericOverflow:false,harvestRejected:true,withRedundantUnlockDelivered:unlocked.chest.herb}))
  })
  it('candidate: actual seeded travel board item winnings silently vanish in full bag on UI return', () => {
    const f = world()
    // 다시 간 날 이야기를 다 들은 방문(넷째 뒤)이라 판에서 딴 것만 센다 — 둘째–넷째는 이야기 선물이 더해진다 (2026-10-21)
    let game: GameState = { ...f, coins: 1000, flags: { ...f.flags, 'trip:harbor': 4 } }
    let board = NEW_BOARD
    // Select an ordinary calendar day whose actual deterministic board grants a material.
    for(let day=7;day<=40;day++){
      game={...game,clock:{day,minute:600}}
      const rnd = mulberry32(tripSeed(game, 'harbor')); board=NEW_BOARD
      while (!board.done) board = playTurn(board, rollDie(rnd), rnd, { withChild: false }).board
      if(board.rewards.some(r=>r.kind==='items'))break
    }
    const itemWins: Record<string, number> = {}
    for (const r of board.rewards) if (r.kind === 'items') for (const [id,n] of Object.entries(r.items)) itemWins[id]=(itemWins[id]??0)+n!
    expect(Object.keys(itemWins).length).toBeGreaterThan(0)
    game = { ...game, inv: bag(50, Object.keys(itemWins)), chest: {} }
    expect(canTrip(game, 'harbor')).toBeNull()
    expect(canTrip(game, 'harbor', [], true, board.rewards)).toBeNull()
    const normal = takeTrip({ ...game, inv: {} }, CONTENT, 'harbor', [], board.rewards)!
    for (const [id,n] of Object.entries(itemWins)) expect(count(normal.inv,id as never)+count(normal.chest,id as never)).toBe(n)
    useGame.setState({game,modal:{kind:'travel',dest:'harbor',rewards:board.rewards},trip:null,piecePopups:[]})
    render(createElement<NonNullable<Parameters<typeof TravelView>[0]>>(TravelView,{dest:'harbor',rewards:board.rewards}))
    const back = screen.getByRole('button',{name:'하룻밤 묵고 돌아가기'})
    expect(back).not.toBeDisabled(); fireEvent.click(back)
    const after = useGame.getState().game
    const received = Object.fromEntries(Object.keys(itemWins).map(id=>[id,count(after.inv,id as never)+count(after.chest,id as never)]))
    expect(after.clock.day).toBe(game.clock.day+1)
    for (const id of Object.keys(itemWins)) expect(received[id]).toBe(0)
    console.log('R2_TRAVEL_LOOT_LOSS',JSON.stringify({seed:tripSeed(game,'harbor'),itemWins,received,coinsBefore:game.coins,coinsAfter:after.coins,dayAfter:after.clock.day}))
  })
  it('copy input boundaries distinguish normal keyboard bursts from paste; blank quiz payout persists once', () => {
    const target='가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허'
    for(const type of ['insertFromPaste','insertFromDrop','insertReplacementText']) expect(acceptInput('',target,{inputType:type,target})).toBe('')
    expect(acceptInput('',target.slice(0,12),{inputType:'insertText',target})).toBe(target.slice(0,12))
    expect(acceptInput('',target.slice(0,13),{inputType:'insertText',target})).toBe('')
    expect(acceptInput('',target,{inputType:'insertCompositionText',target})).toBe(target)
    const f=world(), g={...f,copy:{...f.copy,copied:{mt:[1]}}}
    const once=finishBlankQuiz(g,{book:'mt',chapter:1},10,10)
    expect(once.coins-g.coins).toBe(110)
    const loaded=deserialize(serialize(once),CONTENT)!
    expect(finishBlankQuiz(loaded,{book:'mt',chapter:1},10,10).coins).toBe(once.coins)
    for(const correct of [-1,11,NaN,1.5])expect(finishBlankQuiz(g,{book:'mt',chapter:1},correct,10)).toBe(g)
    console.log('R2_COPY_INPUT_QUIZ_BOUNDARIES paste/drop/replacement rejected; insertText12 accepted/13 rejected; quiz reward once across reload')
  })
  it('recopy three rounds preserves original progress/statistics/currency and only increments the recopy count', () => {
    const f=world(), completed={...f,progress:{...f.progress,phm:{completed:[1],arrangement:{}}}}
    expect(startCopyAgain(f,'phm',1,CONTENT)).toBe(f)
    let g:GameState=completed
    for(let round=0;round<3;round++){
      g=startCopyAgain(g,'phm',1,CONTENT)
      for(const v of copyVerses('phm',1,CONTENT))g=writeVerse(g,'phm',v.text,CONTENT).state
      const loaded=deserialize(serialize(g),CONTENT)!
      expect(loaded.copy.againDone?.['phm:1']).toBe(round+1)
      expect(loaded.coins).toBe(completed.coins)
      expect(loaded.copyStats).toEqual(completed.copyStats)
      expect(loaded.progress).toEqual(completed.progress)
      g=loaded
    }
    console.log('R2_RECOPY_INVARIANTS',JSON.stringify({rounds:g.copy.againDone?.['phm:1'],coins:g.coins,originalStatsUnchanged:true,progressUnchanged:true}))
  })
  it('observed overflow policy: automatic ink jar spends water without output until its ingredient slot empties',()=>{
    const f=world()
    let g:GameState={...f,inv:{...bag(49,['water','blueDye']),water:3},chest:{},flags:{...f.flags,'unlock:inkJar':1}}
    const observations=[]
    for(let n=0;n<3;n++){
      g=goToSleep(g,CONTENT)
      observations.push({day:g.clock.day,water:count(g.inv,'water'),dye:count(g.inv,'blueDye')+count(g.chest,'blueDye')})
    }
    expect(observations.map(x=>x.water)).toEqual([2,1,0])
    expect(observations.map(x=>x.dye)).toEqual([0,0,1])
    console.log('R2_AUTOPRODUCTION_OVERFLOW',JSON.stringify(observations))
  })
})
