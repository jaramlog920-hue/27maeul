import {withLookDefaults} from '../engine/avatar'
import {spriteRows} from './sprites'
import {firstChapterFrame} from './first-chapter-motion'

const looks=[null,...['m','f'].flatMap(look=>[0,2,3].map(skin=>withLookDefaults({name:'기록자',look:look as 'm'|'f',skin,top:6,hairFront:8}))) ]
it.each(looks)('keeps three original loose sheets and the native short hand in contact throughout collection and placement',avatar=>{
 const av=avatar?withLookDefaults(avatar):undefined
 for(const ground of [83,108,374])for(let tick=0;tick<=55;tick++){
  const t=tick/10,f=firstChapterFrame(320,ground,t,avatar),rows=spriteRows('writer','right',{avatar:av,pose:'stand',frame:f.walk?(Math.floor(t*3)%2?1:2):0,blink:false})
  expect(f.papers.map(p=>p.index)).toEqual([0,1,2])
  expect(Number.isInteger(f.x)).toBe(true)
  for(const paper of f.papers){
   if(paper.held){expect(paper.x-f.hand.x).toBeGreaterThan(0);expect(paper.x-f.hand.x).toBeLessThanOrEqual(4);expect(Math.abs(paper.y-f.hand.y)).toBeLessThanOrEqual(3)}
   rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return
    const px=f.x+x*2,py=ground-rows.length*2+y*2
    expect(px+2>paper.x&&px<paper.x+paper.w&&py+2>paper.y&&py<paper.y+paper.h).toBe(false)
   }))
  }
 }
 const placed=firstChapterFrame(320,108,8,avatar)
 expect(placed.placed).toBe(true);expect(placed.walk).toBe(false)
 expect(placed.papers.every(p=>!p.held&&p.x===placed.shelf.x+2)).toBe(true)
 expect(Math.abs(firstChapterFrame(320,108,4.49,avatar).x-firstChapterFrame(320,108,4.5,avatar).x)).toBeLessThanOrEqual(1)
})
