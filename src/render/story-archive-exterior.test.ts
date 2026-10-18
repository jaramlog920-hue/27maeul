import {storyLocationContext} from './story-location-context'
import {drawStoryNewlandBuildings,storyNewlandBuildings} from './story-layout-art'
import {drawLibraryExterior} from './house-exterior-art'
import {OT_LIBRARY_ROOF} from './library-roof-palette'
import {ARCHIVE,NEWLAND_PORTAL} from '../engine/newland-config'
import {drawStoryNewlandBase} from './story-newland-base'
import {OLD_TERRAIN,OLD_VILLAGE_PALETTE} from './old-village-art'

const location=(x=20,y=8,revealed=true)=>storyLocationContext({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:1,minute:900},map:'newland',flags:{newlandRevealed:revealed?1:0},newland:{builds:[],tiles:{},nextId:1,settledDay:1}})
it.each([[320,108],[320,374],[320,83]])('uses exactly the live seven-tile archive walls, arch windows, door and gray roof at %i × floor %i',(w,ground)=>{
 const c=location(),actual:unknown[][]=[],expected:unknown[][]=[],before=JSON.stringify(c)
 drawStoryNewlandBuildings((x,y,color,width=1,height=1)=>actual.push([x,y,color,width,height]),w,ground,c)
 const dx=Math.round(w/2-c.at.x*16),dy=Math.round(ground-(c.at.y+1)*16)
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){expected.push([x+dx,y+dy,this.fillStyle,width,height])}}
 drawLibraryExterior(g,{x0:ARCHIVE.x0,y0:ARCHIVE.y0,x1:ARCHIVE.x0+ARCHIVE.w-1,y1:ARCHIVE.door.y,doorX:ARCHIVE.door.x},OT_LIBRARY_ROOF)
 expect(actual).toEqual(expected)
 expect(actual.some(r=>r[2]===OT_LIBRARY_ROOF[0])).toBe(true)
 expect(JSON.stringify(c)).toBe(before)
 expect(storyNewlandBuildings(c,w,ground)).toEqual([])
})
it('keeps the original fixed archive before land reveal while suppressing placed buildings',()=>{
 const c=location(20,8,false),colors:string[]=[]
 drawStoryNewlandBuildings((_x,_y,color)=>colors.push(color),320,108,c)
 expect(colors).toContain(OT_LIBRARY_ROOF[0])
})
it('uses the original portal sign pixels at their fixed map coordinates without placing a second archive',()=>{
 const c=location(NEWLAND_PORTAL.x,NEWLAND_PORTAL.y),pixels=new Map<string,string>()
 drawStoryNewlandBase((x,y,color,width=1,height=1)=>{for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)pixels.set(`${xx},${yy}`,color)},320,180,108,c)
 OLD_TERRAIN.mapWaySign.rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.')expect(pixels.get(`${160+x},${92+y}`)).toBe((OLD_VILLAGE_PALETTE as Record<string,string>)[ch])}))
})
