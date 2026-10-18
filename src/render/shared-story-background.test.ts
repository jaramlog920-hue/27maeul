import {sharedBackgroundKey,drawSharedStoryBackground} from './shared-story-background'
import {storyLocationContext,type StoryLocationContext} from './story-location-context'
import {ROOMS,PLACES} from '../engine/world'
import {drawForgeBellows} from './forge-room-background'
import {drawOilPressHandle} from './oil-room-background'

it.each([[320,180],[320,693],[320,120]])('attaches the real unlocked grip to the relocated oil press at %i × %i',(w,h)=>{
 const c=storyLocationContext({player:{...PLACES.press.stand!,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},flags:{'unlock:pressHandle':1}})
 const before=JSON.stringify(c),commands=(ctx:typeof c)=>{
  const rows:unknown[][]=[]
  const g={fillStyle:'',fillRect(this:{fillStyle:string},...args:number[]){rows.push([this.fillStyle,...args])}} as CanvasRenderingContext2D
  return {rows,result:drawSharedStoryBackground(g,w,h,0,ctx)}
 }
 expect(sharedBackgroundKey(c)).toBe('oil')
 const on=commands(c),off=commands({...c,layout:{...c.layout!,unlocks:{}}}),extra:unknown[][]=[]
 drawOilPressHandle((x,y,color,a=1,b=1)=>extra.push([color,x,y,a,b]),w,on.result.ground-44)
 expect(on.rows).toEqual([...off.rows,...extra])
 expect(extra).toHaveLength(2)
 // The short original grip stays on the press, above the actor's head band.
 expect(extra.every(row=>Number(row[2])+Number(row[4])<on.result.ground-36)).toBe(true)
 expect(JSON.stringify(c)).toBe(before)
})

it.each([[320,180],[320,693],[320,120]])('adds bellows only at the unlocked actual forge at %i × %i',(w,h)=>{
 const c=storyLocationContext({player:{...PLACES.anvil.stand!,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},flags:{'unlock:bigBellows':1}})
 const before=JSON.stringify(c),commands=(ctx:typeof c)=>{
  const rows:unknown[][]=[]
  const g={fillStyle:'',fillRect(this:{fillStyle:string},...args:number[]){rows.push([this.fillStyle,...args])}} as CanvasRenderingContext2D
  return {rows,result:drawSharedStoryBackground(g,w,h,0,ctx)}
 }
 expect(sharedBackgroundKey(c)).toBe('forge')
 const on=commands(c),off=commands({...c,layout:{...c.layout!,unlocks:{}}}),extra:unknown[][]=[]
 drawForgeBellows((x,y,color,a=1,b=1)=>extra.push([color,x,y,a,b]),w,on.result.ground)
 expect(on.rows).toEqual([...off.rows,...extra])
 expect(extra.every(row=>Number(row[1])+Number(row[3])<w/2-71)).toBe(true)
 expect(JSON.stringify(c)).toBe(before)
})

it.each([[14,11],[14,12],[15,12],[12,12],[16,12]])('keeps the real hill landmark out of the square at %i,%i',(x,y)=>{
 const c=storyLocationContext(undefined,{preview:{at:{x,y}}}),before=JSON.stringify(c)
 expect(sharedBackgroundKey(c)).toBe('hill')
 expect(sharedBackgroundKey({...c,minute:1300})).toBe('hill')
 expect(sharedBackgroundKey({...c,map:'newland'})).toBe('newland-ground')
 expect(JSON.stringify(c)).toBe(before)
})
it.each([[17,12],[15,13],[24,18]])('retains the square outside the hill approach at %i,%i',(x,y)=>{
 expect(sharedBackgroundKey(storyLocationContext(undefined,{preview:{at:{x,y}}}))).toBe('square')
})
it.each([[320,180],[320,693],[320,120]])('uses the original hill bench at its map offset at %i × %i',(w,h)=>{
 const c={...storyLocationContext(undefined,{preview:{at:{x:15,y:12}}}),weather:'sunny' as const},before=JSON.stringify(c)
 const pixels:{color:string;x:number;y:number;w:number;h:number}[]=[]
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){pixels.push({color:this.fillStyle,x,y,w,h})}} as CanvasRenderingContext2D
 const {ground,key}=drawSharedStoryBackground(g,w,h,0,c)
 expect(key).toBe('hill')
 expect(pixels).toContainEqual({color:'#b17640',x:w/2-16+1,y:ground-32+7,w:14,h:3})
 expect(pixels.some(p=>p.color==='#d7dfc8')).toBe(true)
 expect(JSON.stringify(c)).toBe(before)
})

it.each([
 ['baker','bakery'],['carpenter','carpenter'],['weaver','weaver'],
 ['library','library'],['hall','hall'],['teahouse','tea-room'],
 ['grandpa','grandpa'],['postman','postman'],
] as const)('uses the actual %s room for any speaker', (owner,key)=>{
 const room=ROOMS.find(r=>r.owner===owner)!
 const c=storyLocationContext({player:{...room.sit,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900}})
 expect(sharedBackgroundKey(c)).toBe(key)
})
it.each([['tea','tea-front'],['sunset','sunset'],['walk','pasture']] as const)('retains the actual %s outing when returning', (datePlace,key)=>{
 const c=storyLocationContext(undefined,{datePlace})
 expect(sharedBackgroundKey(c,true)).toBe(key)
 expect(sharedBackgroundKey(c,false)).toBe('square')
})
it('does not turn an unknown return location into a sunset scene',()=>{
 expect(sharedBackgroundKey(storyLocationContext(),true)).toBe('square')
})
it('keeps empty newland outdoors and separates its archive and occupied home',()=>{
 const c=storyLocationContext(undefined,{preview:{map:'newland',at:{x:4,y:5}}})
 expect(sharedBackgroundKey({...c,indoors:false,room:null})).toBe('newland-ground')
 expect(sharedBackgroundKey({...c,indoors:true,room:{kind:'newland-archive',owner:'library'}})).toBe('library')
 expect(sharedBackgroundKey({...c,indoors:true,room:{kind:'newland-home',owner:'g-0042',slot:0,buildingId:'b3'}})).toBe('newland-room')
})
it.each([[320,180],[320,693],[320,120]])('draws weather and time from a detached context at %i × %i', (w,h)=>{
 const c:StoryLocationContext={...storyLocationContext(),minute:1300,weather:'snow'}
 const before=JSON.stringify(c),pixels:{color:string;x:number;y:number;w:number;h:number}[]=[]
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){pixels.push({color:this.fillStyle,x,y,w,h})}} as CanvasRenderingContext2D
 const result=drawSharedStoryBackground(g,w,h,.35,c)
 expect(result).toEqual({ground:Math.round(h>w?h*.54:h<=170?h*.69:h*.6),key:'square'})
 expect(pixels.length).toBeGreaterThan(20)
 expect(pixels.every(p=>[p.x,p.y,p.w,p.h].every(Number.isFinite))).toBe(true)
 expect(JSON.stringify(c)).toBe(before)
})
