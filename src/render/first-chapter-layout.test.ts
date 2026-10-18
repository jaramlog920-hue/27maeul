import {withLookDefaults} from '../engine/avatar'
import {storyLocationContext} from './story-location-context'
import {firstChapterLayoutFrame,firstChapterShelfSurface} from './first-chapter-layout'
import {facingArt} from './furniture-facing'
import {FURNITURE_ART} from './furniture-art'
import {spriteRows} from './sprites'
import {storyLayoutObjects} from './story-layout-art'

const looks=[null,...['m','f'].flatMap(look=>[0,2,3].map(skin=>withLookDefaults({name:'기록자',look:look as 'm'|'f',skin,top:6,hairFront:8})))]
const context=(reverse=false)=>storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},homeLevel:0,room:[{item:'homeDesk',x:reverse?22:17,y:114,facing:reverse?'left':'right'},{item:'homeShelf',x:reverse?18:23,y:111}]})
it.each([false,true])('stands beside the desk and shelf when reverse layout is %s',reverse=>{
 for(const avatar of looks){
  const c=context(reverse),objects=storyLayoutObjects(c,320,108)
  for(const [id,t] of [['homeDesk',0],['homeShelf',4.5]] as const){
   const item=objects.find(o=>o.id===id)!,f=firstChapterLayoutFrame(c,320,108,t,avatar)
   const rows=spriteRows('writer',f.facing,{avatar:avatar??undefined,pose:'stand',frame:0,blink:false})
   // Ignore transparent padding and the touching hand. A narrow native arm/body
   // edge may touch the end, but the torso must stay out of the central panel.
   const body=rows.flatMap((row,y)=>y>=Math.floor(rows.length/2)?[...row].flatMap((ch,x)=>ch!=='.'&&ch!=='s'?[f.x+x*2,f.x+x*2+1]:[]):[])
   if(f.facing==='left')expect(Math.min(...body)).toBeGreaterThanOrEqual(item.x+item.rows[0].length-6)
   else expect(Math.max(...body)).toBeLessThanOrEqual(item.x+6)
  }
 }
})
it.each(['down','up','left','right'] as const)('only accepts the exposed shelf of a %s-facing bookcase',facing=>{
 const art=facingArt('bookcase',facing)!,shelf={x:100,y:50,rows:art.rows,facing},surface=firstChapterShelfSurface(shelf)
 if(facing!=='down'){expect(surface).toBeNull();return}
 expect(surface).not.toBeNull()
 const support=art.rows[surface!.y-shelf.y].slice(surface!.x-shelf.x,surface!.x-shelf.x+10)
 expect(['l'.repeat(10),'k'.repeat(10)]).toContain(support)
})
it('uses the existing bottom shelf board and rejects a shape without horizontal support',()=>{
 expect(firstChapterShelfSurface({x:100,y:50,rows:FURNITURE_ART.homeShelf.rows})).toEqual({x:103,y:62})
 expect(firstChapterShelfSurface({x:100,y:50,rows:['...k...','...k...']})).toBeNull()
})
it.each(looks)('uses existing short hands, actual moved furniture and all three sheets at every native size',avatar=>{
 for(const reverse of [false,true])for(const ground of [83,108,374]){
  const c=context(reverse),before=JSON.stringify(c)
  for(let tick=0;tick<=55;tick++){
   const t=tick/10,f=firstChapterLayoutFrame(c,320,ground,t,avatar)
   expect(f.available).toBe(true);expect(f.facing).toBe(reverse?'left':'right')
   const rows=spriteRows('writer',f.facing,{avatar:avatar??undefined,pose:'stand',frame:f.walk?(Math.floor(t*3)%2?1:2):0,blink:false})
   expect(f.papers.map(p=>p.index)).toEqual([0,1,2])
   for(const paper of f.papers){
    if(paper.held){expect(Math.min(Math.abs(paper.x-f.hand.x),Math.abs(paper.x+paper.w-1-f.hand.x))).toBeLessThanOrEqual(4);expect(Math.abs(paper.y-f.hand.y)).toBeLessThanOrEqual(3)}
    rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return
     const px=f.x+x*2,py=f.ground-rows.length*2+y*2
     expect(px+2>paper.x&&px<paper.x+paper.w&&py+2>paper.y&&py<paper.y+paper.h,JSON.stringify({reverse,ground,t,paper,px,py})).toBe(false)
    }))
   }
  }
  const end=firstChapterLayoutFrame(c,320,ground,8,avatar)
  expect(end.placed).toBe(true);expect(end.walk).toBe(false)
  expect(end.papers[0].y+end.papers[0].h).toBe(end.target!.y)
  for(const a of ['x','ground'] as const)expect(Math.abs(firstChapterLayoutFrame(c,320,ground,4.49,avatar)[a]-firstChapterLayoutFrame(c,320,ground,4.5,avatar)[a])).toBeLessThanOrEqual(1)
  expect(JSON.stringify(c)).toBe(before)
 }
})
it('keeps removed furniture absent and holds loose pages when no actual shelf is available',()=>{
 const c=storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},room:[]}),f=firstChapterLayoutFrame(c,320,108,8,null)
 expect(f.source).toBeNull();expect(f.target).toBeNull();expect(f.available).toBe(false);expect(f.placed).toBe(false)
 expect(f.papers.every(p=>p.held)).toBe(true);expect(c.layout?.furniture).toEqual([])
})
it('keeps the native body and pages visible when a moved desk would be outside a thumbnail',()=>{
 const c=context(),offscreen={...c,layout:{...c.layout!,viewOffset:{x:0,y:80}}},f=firstChapterLayoutFrame(offscreen,320,83,8,null,120)
 expect(f.available).toBe(false);expect(f.placed).toBe(false);expect(f.ground).toBe(83)
 expect(f.papers.every(p=>p.held&&p.y>=0&&p.y+p.h<120)).toBe(true)
})
it.each(looks)('collates the approved no-shelf pages beside the native body without inventing placement (%j)',avatar=>{
 const c=storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},room:[]}),before=JSON.stringify(c)
 for(const [h,ground] of [[180,108],[693,374],[120,83]]){
  const start=firstChapterLayoutFrame(c,320,ground,0,avatar,h),end=firstChapterLayoutFrame(c,320,ground,8,avatar,h)
  expect(start.organized).toBe(false);expect(end.organized).toBe(true)
  expect(new Set(start.papers.map(p=>p.x)).size).toBe(3)
  expect(new Set(end.papers.map(p=>p.x)).size).toBe(1)
  for(const t of [0,1.6,3,8]){
   const f=firstChapterLayoutFrame(c,320,ground,t,avatar,h)
   expect(f.placed).toBe(false);expect(f.walk).toBe(false);expect(f.ground).toBe(ground)
   const rows=spriteRows('writer',f.facing,{avatar:avatar??undefined,pose:'stand',frame:0,blink:false})
   for(const paper of f.papers){
    expect(paper.held).toBe(true);expect(paper.y).toBeGreaterThanOrEqual(0);expect(paper.y+paper.h).toBeLessThan(h)
    rows.forEach((row,y)=>[...row].forEach((ch,x)=>{
     if(ch==='.')return
     const px=f.x+x*2,py=f.ground-rows.length*2+y*2
     expect(px+2>paper.x&&px<paper.x+paper.w&&py+2>paper.y&&py<paper.y+paper.h).toBe(false)
    }))
   }
  }
 }
 expect(JSON.stringify(c)).toBe(before)
})
