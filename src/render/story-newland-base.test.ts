import {storyLocationContext} from './story-location-context'
import {storyNewlandBaseAt,storyNewlandBaseTiles,drawStoryNewlandBase} from './story-newland-base'
import {NEWLAND_VISIBLE_H} from '../engine/newland-config'
import {currentMapId} from '../engine/maps'

const context=(x=7,y=14,day=1,revealed=true)=>storyLocationContext({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day,minute:900},map:'newland',flags:{newlandRevealed:revealed?1:0},newland:{builds:[],tiles:{},nextId:1,settledDay:1}})
it('keeps the original two road rows and open land/forest reveal condition',()=>{
 expect(storyNewlandBaseAt(context(),7,8)).toBe(',');expect(storyNewlandBaseAt(context(),7,9)).toBe(',')
 expect(storyNewlandBaseAt(context(),7,14)).toBe('.')
 expect(storyNewlandBaseAt(context(7,14,1,false),7,14)).toBe('T')
})
it.each([[320,180,108],[320,693,374],[320,120,83]])('clips real map cells and keeps hidden interior rooms out of the %i × %i outdoors view', (w,h,ground)=>{
 const c=context(),before=JSON.stringify(c),map=currentMapId(),tiles=storyNewlandBaseTiles(c,w,h,ground)
 expect(tiles.length).toBeGreaterThan(20)
 expect(tiles.every(a=>a.worldY<NEWLAND_VISIBLE_H)).toBe(true)
 expect(tiles.every(a=>a.y+16>ground-48&&a.y<h)).toBe(true)
 expect(new Set(tiles.filter(a=>a.worldY===14).map(a=>a.y))).toEqual(new Set([ground-16]))
 expect(JSON.stringify(c)).toBe(before);expect(currentMapId()).toBe(map)
})
it('does not paint the fixed archive stone block behind its native transparent exterior asset',()=>{
 const tiles=storyNewlandBaseTiles(context(20,7),320,180,108)
 expect(tiles.find(a=>a.worldX===20&&a.worldY===6)?.ch).toBe('.')
})
it.each([[1,'#b0cc94'],[41,'#a8c48c'],[81,'#c8c88c'],[121,'#dfe8dc']] as const)('uses the original native outdoor season palette on day %i', (day,color)=>{
 const pixels:{x:number;y:number;color:string;w:number;h:number}[]=[]
 drawStoryNewlandBase((x,y,color,w=1,h=1)=>pixels.push({x,y,color,w,h}),320,180,108,context(7,14,day))
 expect(pixels[0]).toEqual({x:0,y:60,color,w:320,h:120})
 expect(pixels.every(p=>p.y>=60&&p.y+p.h<=180)).toBe(true)
})
