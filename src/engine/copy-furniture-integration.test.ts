import { COPY_FURNITURE, copyFurnitureFlag, copyFurnitureReward } from './copy-furniture'
import { COPY_FURNITURE_DEFS } from './copy-furniture-defs'
import { MARKET_ADDITION_IDS, additionsOnMarket } from './furniture-additions'
import { CONTENT } from '../content/catalog'
import { newGame, startCopy, writeVerse, TRADES, useAddition, placeFurniture, removeFurniture, rotateFurniture } from './game'
import { legacyGame } from './growth-test-support'
import { copySpot } from './copying'
import { serialize, deserialize } from './save'
import { withLookDefaults } from './avatar'
import { newGenState } from './gen'
import { HOME_RECT, HOME_ENTRY, tileAt } from './world'
import { placement, footprint, rotation, sizeOf } from './room'
import { FURNITURE_DEFS } from './furniture-defs'
import { itemName } from '../content/text'
import { ICONS } from '../render/sprites'
import { COLLECTIBLE_ITEMS, GIFT_ITEMS } from './collection-gifts'
import { copyFurnitureFacings, copyFurnitureFacing } from './copy-furniture-views'

it('awards only a first actual chapter completion, persists reward and never rerolls on load', () => {
  let seed=0;while(!copyFurnitureReward({},'phm',1,seed))seed++
  const base=newGame(CONTENT,withLookDefaults({look:'f',name:'필사자'}))
  let s=startCopy({...base,gen:newGenState(CONTENT,seed,base.clock.day),scenes:[]},'phm',CONTENT)
  let result=writeVerse(s,'phm',copySpot(s,'phm',CONTENT)!.verse.text,CONTENT)
  expect(result.result.kind).toBe('verse')
  expect(COPY_FURNITURE.some(i=>result.state.inv[i.id])).toBe(false)
  while(result.result.kind==='verse')result=writeVerse(result.state,'phm',copySpot(result.state,'phm',CONTENT)!.verse.text,CONTENT)
  expect(result.result.kind).toBe('chapter')
  if(result.result.kind!=='chapter')throw Error('Expected chapter')
  const id=result.result.collectibleFurniture!
  // 아이가 없는 새 게임이라 아기·어린이 물건은 뒤로 미룬다 (2026-10-27 플레이 점검)
  expect(['infant','child']).not.toContain(COPY_FURNITURE.find(i=>i.id===id)?.category)
  expect(result.state.inv[id]).toBe(1)
  expect(result.state.flags[copyFurnitureFlag(id)]).toBe(1)
  const loaded=deserialize(serialize(result.state),CONTENT)!
  expect(loaded.inv[id]).toBe(1);expect(loaded.flags[copyFurnitureFlag(id)]).toBe(1)
  // Simulate a repeated copying entry while retaining the permanent completed-chapter record.
  s=startCopy({...loaded,scenes:[],progress:{...loaded.progress,phm:{...loaded.progress.phm,completed:[]}},copy:{...loaded.copy,at:{...loaded.copy.at,phm:{chapter:1,verse:25}}}},'phm',CONTENT)
  const before={...s.inv},at=copySpot(s,'phm',CONTENT)
  expect(at).not.toBeNull()
  const repeated=writeVerse(s,'phm',at!.verse.text,CONTENT)
  expect(repeated.result.kind).toBe('chapter')
  if(repeated.result.kind==='chapter')expect(repeated.result.collectibleFurniture).toBeUndefined()
  expect(COPY_FURNITURE.map(i=>repeated.state.inv[i.id])).toEqual(COPY_FURNITURE.map(i=>before[i.id]))
})

it('keeps exclusive rewards out of shops and the original 68-item market schedule', () => {
  expect(MARKET_ADDITION_IDS).toHaveLength(68)
  for(const item of COPY_FURNITURE){
    expect(TRADES.some(t=>t.get?.[item.id])).toBe(false)
    expect(COLLECTIBLE_ITEMS).toContain(item.id)
    expect(GIFT_ITEMS).not.toContain(item.id)
    expect(MARKET_ADDITION_IDS).not.toContain(item.id)
    expect(itemName(item.id)).toBe(item.name)
    expect(ICONS[item.id]).toBeDefined()
    expect(FURNITURE_DEFS[item.id]).toBeDefined()
  }
  for(let week=0;week<100;week++)expect(additionsOnMarket(week*7)).toEqual(Array.from({length:8},(_,i)=>MARKET_ADDITION_IDS[(week*8+i)%68]))
})

it('places, rotates, uses, saves and removes all 40 pieces without losing collection progress', () => {
  const base=legacyGame(CONTENT)
  const s={...base,scenes:[],player:{...base.player,...HOME_ENTRY,path:[]}}
  for(const {id} of COPY_FURNITURE){
    const def=COPY_FURNITURE_DEFS[id]
    let placed:ReturnType<typeof placeFurniture>=null
    for(let y=HOME_RECT.y0;y<=HOME_RECT.y1&&!placed;y++)for(let x=HOME_RECT.x0;x<=HOME_RECT.x1&&!placed;x++){
      const bagged={...s,inv:{[id]:1},room:[],flags:{...s.flags,[copyFurnitureFlag(id)]:1}}
      placed=placeFurniture(bagged,id,{x,y},'down')
    }
    expect(placed,`${id}: legal placement`).not.toBeNull()
    if(!placed)continue
    expect(placed.inv[id]??0).toBe(0)
    let f=placed.room.find(f=>f.item===id)!
    expect(footprint(f)).toHaveLength(def.w)
    const saved=deserialize(serialize(placed),CONTENT)!
    expect(saved.room.some(p=>p.item===id)).toBe(true)
    const used=useAddition(saved,f)
    expect(used.act).toMatchObject({kind:'use',use:'copyFurniture',spot:{item:id}})
    // Rotation is checked against the same collision rules; search a clear position for wide pieces.
    if(copyFurnitureFacings(id).length>1){
      const ctx={isFloor:(p:{x:number;y:number})=>tileAt(p.x,p.y)==='f',inside:(p:{x:number;y:number})=>tileAt(p.x,p.y)==='f',keepClear:()=>[],entry:HOME_ENTRY,reach:[]}
      let piece:ReturnType<typeof placement>=null
      for(let y=HOME_RECT.y0;y<HOME_RECT.y1&&!piece;y++)for(let x=HOME_RECT.x0;x<HOME_RECT.x1&&!piece;x++){
        if(![{x,y},{x:x+1,y},{x,y:y+1},{x:x+1,y:y+1}].every(ctx.isFloor))continue
        piece=placement([],id,{x,y},'down',ctx)
      }
      expect(piece,`${id}: clear 2x2 rotation site`).not.toBeNull()
      for(let turn=0;turn<4;turn++){const next=rotation([piece!],piece!,ctx);expect(next,`${id}: turn ${turn}`).not.toBeNull();piece=next;expect(footprint(piece!)).toHaveLength(def.w)}
    }else{
      if(def.layer==='wall')expect(tileAt(f.x,f.y)).toBe('#')
      const turned=rotateFurniture(saved,saved.room.find(p=>p.item===id)!)
      expect(turned).toBeNull()
    }
    const cleared=removeFurniture(saved,f)
    expect(cleared.inv[id]).toBe(1)
    expect(cleared.flags[copyFurnitureFlag(id)]).toBe(1)
    expect(sizeOf(id,'left')).toEqual(copyFurnitureFacing(id,'left')==='right'?{w:1,h:def.w}:{w:def.w,h:1})
  }
})
