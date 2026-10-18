import {homeYardEventContext} from './home-yard-event-context'
import {adopt,STRAY_SPOTS} from '../engine/companion'
import {YARD_DEFAULT} from '../engine/yard'

it('uses explicit preview data without turning an unadopted real game into a cat adoption',()=>{
 expect(homeYardEventContext()).toMatchObject({mode:'preview',companion:{kind:'cat'},childPet:'dog'})
 expect(homeYardEventContext({companion:null,flags:{},yard:undefined})).toMatchObject({mode:'game',companion:null,childPet:null,rackPlaced:false})
})
it.each(['cat','dog'] as const)('reads the saved %s adoption and the other pet without mutating either',kind=>{
 const companion=adopt(kind,'저장된 이름',2,STRAY_SPOTS[kind]),flags={childPet:kind==='cat'?2:1,'unlock:reedRack':1},yard={reedRack:{x:10,y:11}}
 const state={companion,flags,yard},before=JSON.stringify(state),ctx=homeYardEventContext(state)
 expect(ctx.companion).toEqual({kind,name:'저장된 이름'});expect(ctx.childPet).toBe(kind==='cat'?'dog':'cat')
 expect(ctx.reedRack).toEqual(yard.reedRack);expect(ctx.reedRack).not.toBe(yard.reedRack)
 ctx.reedRack.x=99;ctx.strays.cat.x=99
 expect(JSON.stringify(state)).toBe(before);expect(STRAY_SPOTS.cat.x).toBe(1)
})
it('preserves moved rack coordinates and the stowed flag instead of creating another rack',()=>{
 const ctx=homeYardEventContext({companion:null,flags:{'unlock:reedRack':1,'yardOff:reedRack':1},yard:{reedRack:{x:2,y:12}}})
 expect(ctx.reedRack).toEqual({x:2,y:12});expect(ctx.rackPlaced).toBe(false)
 const preview=homeYardEventContext();expect(preview.reedRack).toEqual(YARD_DEFAULT.reedRack);expect(preview.reedRack).not.toBe(YARD_DEFAULT.reedRack)
})
