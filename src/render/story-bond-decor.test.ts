import {storyLocationContext} from './story-location-context'
import {storyBondDecor} from './story-bond-decor'

const context=(x:number,y:number,flags:Record<string,number>={},minute=900)=>storyLocationContext({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:3,minute},flags})

it.each([108,374,83])('keeps far-away flowers, loom and kite outside the event footprint at ground %i',ground=>{
 const square={...context(24,18,{'unlock:childGarden':1,'unlock:kite':1}),weather:'sunny' as const}
 expect(storyBondDecor(square,320,ground,0)).toEqual([])
 const garden=context(32,14,{'unlock:childGarden':1,villageLevel:4})
 const pixels=storyBondDecor(garden,320,ground,0)
 expect(pixels).toHaveLength(9)
 expect(pixels.every(p=>p.y>=ground-40&&p.y<ground+20)).toBe(true)
})
it.each([108,374,83])('culls by ground anchor while retaining the complete nearby kite at ground %i',ground=>{
 const c={...context(15,12,{'unlock:kite':1}),weather:'sunny' as const}
 const pixels=storyBondDecor(c,320,ground,0)
 expect(pixels.some(p=>p.color==='#d6677b')).toBe(true)
 expect(pixels.some(p=>p.color==='rgba(80,60,40,0.6)'&&p.y>=ground-12)).toBe(true)
 expect(Math.min(...pixels.map(p=>p.y))).toBeLessThan(ground-50)
})

it.each([
 ['bakeryBench',1,13],['childGarden',32,14],['grapeTrellis',42,9],['grandpaBench',31,8],
 ['stallAwning',20,13],['oliveGrove',41,11],
 ['lanterns',23,11],['kite',15,12],
] as const)('shows %s only from its real unlock flag, without altering state', (flag,x,y)=>{
 const c={...context(x,y,{[`unlock:${flag}`]:1}),weather:'sunny' as const},before=JSON.stringify(c)
 expect(storyBondDecor(context(x,y),320,108,.6)).toHaveLength(0)
 const pixels=storyBondDecor(c,320,108,.6)
 expect(pixels.length).toBeGreaterThan(0)
 expect(pixels.every(p=>[p.x,p.y,p.w,p.h].every(Number.isInteger))).toBe(true)
 expect(JSON.stringify(c)).toBe(before)
})
it('does not project the overhead forge roof strip onto the event-cut floor',()=>{
 const c=context(42,20,{'unlock:bigBellows':1}),before=JSON.stringify(c)
 expect(storyBondDecor(c,320,108,0)).toEqual([])
 expect(JSON.stringify(c)).toBe(before)
})
it('does not leave a detached press grip at the old outdoor station',()=>{
 const c=context(45,21,{'unlock:pressHandle':1}),before=JSON.stringify(c)
 expect(storyBondDecor(c,320,108,0)).toEqual([])
 expect(JSON.stringify(c)).toBe(before)
})
it('keeps the original native bench below the actor head and anchored to the real world tile',()=>{
 const pixels=storyBondDecor(context(1,13,{'unlock:bakeryBench':1}),320,108,0)
 expect(pixels.find(p=>p.color==='#b17640')).toEqual({x:161,y:99,w:14,h:3,color:'#b17640'})
})
it('honors the original loom village-level gate and awning unlock separately',()=>{
 const c=context(38,24,{'unlock:loomAwning':1})
 expect(storyBondDecor(c,320,108,0)).toHaveLength(0)
 const built=context(38,24,{'unlock:loomAwning':1,villageLevel:2})
 expect(built.layout?.villageLevel).toBe(2)
 expect(storyBondDecor(built,320,108,0).some(p=>p.color==='#8153b0')).toBe(true)
 expect(storyBondDecor(context(38,24,{villageLevel:2}),320,108,0).length).toBeLessThan(storyBondDecor(built,320,108,0).length)
})
it('adds the original extra hives only at village level four and does not fly bees in rain',()=>{
 const c=context(44,27,{'unlock:moreHives':1,villageLevel:4})
 const count=(rain:boolean)=>storyBondDecor({...c,weather:rain?'rain':'sunny'},320,108,0)
 // Two base hives already belong to the shared bee-field backdrop; add only the unlocked pair.
 expect(count(false).filter(p=>p.color==='#d4ab60')).toHaveLength(2)
 expect(storyBondDecor(context(44,27,{villageLevel:4}),320,108,0).filter(p=>p.color==='#d4ab60')).toHaveLength(0)
 expect(count(false).some(p=>p.color==='#322020')).toBe(true)
 expect(count(true).some(p=>p.color==='#322020')).toBe(false)
})
it('uses the original day/weather kite conditions and night lantern colors',()=>{
 const c=context(15,12,{'unlock:kite':1})
 expect(storyBondDecor({...c,weather:'rain'},320,108,0)).toHaveLength(0)
 expect(storyBondDecor({...c,minute:1300},320,108,0)).toHaveLength(0)
 expect(storyBondDecor({...c,minute:1050,weather:'sunny'},320,108,0)).toHaveLength(0)
 expect(storyBondDecor({...c,minute:1500,weather:'sunny'},320,108,0)).toHaveLength(0)
 expect(storyBondDecor(context(23,11,{'unlock:lanterns':1},1300),320,108,0).some(p=>p.color==='#eed584')).toBe(true)
})
it('never puts village facilities inside rooms, newland, or an explicitly different outing backdrop',()=>{
 const c=context(1,13,{'unlock:bakeryBench':1})
 for(const other of [{...c,indoors:true},{...c,map:'newland' as const}])expect(storyBondDecor(other,320,108,0)).toHaveLength(0)
 expect(storyBondDecor({...c,datePlace:'tea'},320,108,0,true)).toHaveLength(0)
})
it('detaches flags and village level from live state and clips far-away facilities',()=>{
 const flags={'unlock:bakeryBench':1,villageLevel:2},c=context(1,13,flags)
 flags['unlock:bakeryBench']=0;flags.villageLevel=4
 expect(c.layout?.unlocks['unlock:bakeryBench']).toBe(1)
 expect(c.layout?.villageLevel).toBe(2)
 expect(storyBondDecor(context(49,45,{'unlock:bakeryBench':1}),320,108,0)).toHaveLength(0)
})
