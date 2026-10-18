import {storyRoomFurnitureArt} from './story-room-furniture'
import {facingArt} from './furniture-facing'
import {firstChapterLayoutFrame} from './first-chapter-layout'
import {storyLocationContext} from './story-location-context'

it.each(['homeDesk','homeWorkbench','homeShelf','bookcase','homeBed','homeHearth','chair'])('%s has separate front, rear and side elevations',id=>{
 const views=['down','up','left','right'].map(f=>storyRoomFurnitureArt(id,f as 'down')!.rows)
 expect(new Set(views.map(v=>v.join('\n'))).size).toBeGreaterThanOrEqual(3)
 expect(views[2]).toEqual(views[3].map(row=>[...row].reverse().join('')))
 expect(views[2][0].length).not.toBe(views[0][0].length)
})
it.each(['homeShelf','bookcase'])('%s rear and side preserve closed native panels instead of front-facing books',id=>{
 for(const facing of ['up','left','right'] as const){
  const native=facingArt(id,facing)!.rows.join(''),event=storyRoomFurnitureArt(id,facing)!.rows.join('')
  expect(native).not.toMatch(/[bcCr]/)
  expect(event).not.toMatch(/[bcCr]/)
 }
})
it.each(['down','up','left','right'] as const)('does not mistake the %s-facing cabinet brace for an exposed shelf',facing=>{
 const c=storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day:121,minute:900},room:[{item:'homeDesk',x:17,y:114,facing},{item:'bookcase',x:23,y:111,facing}]})
 for(const t of [0,3.6,4.5,8]){
  const frame=firstChapterLayoutFrame(c,320,108,t,null,180)
  expect(frame.available).toBe(facing==='down')
  if(facing!=='down'){
   expect(frame.target).toBeNull()
   expect(frame.placed).toBe(false)
   expect(frame.papers.every(p=>p.held)).toBe(true)
  }
  expect(frame.ground).toBeGreaterThanOrEqual(108-42)
 }
})
