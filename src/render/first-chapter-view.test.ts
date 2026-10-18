import {storyLocationContext} from './story-location-context'
import {storyLayoutObjects} from './story-layout-art'
import {firstChapterViewContext} from './first-chapter-view'
import {firstChapterLayoutFrame} from './first-chapter-layout'
import {withLookDefaults} from '../engine/avatar'

it.each([[180,108],[693,374],[120,83]])('frames real moved furniture at height %i without zooming, animation panning or state writes',(h,ground)=>{
 for(const avatar of [null,withLookDefaults({name:'기록자',look:'f',skin:3})])for(const reverse of [false,true]){
  const c=storyLocationContext({player:{x:20,y:110,facing:'down',path:[],walkTime:0},clock:{day:121,minute:900},room:[{item:'homeDesk',x:reverse?22:17,y:114,facing:reverse?'left':'right'},{item:'homeShelf',x:reverse?18:23,y:111}]})
  const before=JSON.stringify(c),view=firstChapterViewContext(c,320,h,ground,avatar),base=storyLayoutObjects(c,320,ground),moved=storyLayoutObjects(view,320,ground),offset=view.layout?.viewOffset??{x:0,y:0}
  expect(view.at).toEqual(c.at);expect(view.layout?.furniture).toEqual(c.layout?.furniture)
  moved.forEach((item,i)=>{expect(item.x-base[i].x).toBe(offset.x);expect(item.y-base[i].y).toBe(offset.y);expect(item.rows).toEqual(base[i].rows)})
  for(const t of [0,.6,1.6,3.6,4.49,4.5,8])expect(firstChapterLayoutFrame(view,320,ground,t,avatar,h).available).toBe(true)
  expect(firstChapterLayoutFrame(view,320,ground,8,avatar,h).placed).toBe(true)
  expect(firstChapterViewContext(view,320,h,ground,avatar)).toBe(view)
  expect(JSON.stringify(c)).toBe(before)
 }
})
it('keeps missing furniture missing and reports no invented placement',()=>{
 const c=storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},room:[]})
 const view=firstChapterViewContext(c,320,120,83,null)
 expect(view).toBe(c);expect(view.layout?.furniture).toEqual([])
 expect(firstChapterLayoutFrame(view,320,83,8,null,120).placed).toBe(false)
})
it.each(['down','up','left','right'] as const)('preserves the actual bookcase and accepts only exposed support when facing %s',facing=>{
 for(const [h,ground] of [[180,108],[693,374],[120,83]]){
  const c=storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:121,minute:900},room:[{item:'homeDesk',x:17,y:114,facing},{item:'bookcase',x:23,y:111,facing}]})
  const view=firstChapterViewContext(c,320,h,ground,null),f=firstChapterLayoutFrame(view,320,ground,4.5,null,h),shelf=storyLayoutObjects(view,320,ground).find(o=>o.id==='bookcase')!
  expect(shelf.facing).toBe(facing)
  expect(shelf.viewFacing).toBe('down')
  expect(view.at).toEqual(c.at);expect(view.layout?.furniture).toEqual(c.layout?.furniture)
  if(facing!=='down'){
   expect(view.layout?.viewCamera).toBe(facing)
   expect(shelf.y+shelf.rows.length).toBe(ground-42+(view.layout?.viewOffset?.y??0)+4)
  }
  for(const t of [0,1.6,3.6,4.49,4.5,8]){
   const frame=firstChapterLayoutFrame(view,320,ground,t,null,h)
   expect(frame.ground).toBeGreaterThanOrEqual(ground-42+(view.layout?.viewOffset?.y??0))
   expect(frame.available).toBe(true)
  }
  expect(f.available).toBe(true);expect(f.placed).toBe(true)
  expect(f.papers[0].y+3).toBe(f.target!.y)
  const support=shelf.rows[f.target!.y-shelf.y].slice(f.target!.x-shelf.x,f.target!.x-shelf.x+10)
  expect(['l'.repeat(10),'k'.repeat(10)]).toContain(support)
  expect(Math.min(Math.abs(f.papers[0].x-f.hand.x),Math.abs(f.papers[0].x+9-f.hand.x))).toBeLessThanOrEqual(4)
 }
})
