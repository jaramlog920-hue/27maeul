import {storyLocationContext} from './story-location-context'
import {storyNewlandTerrain,storyNativeTerrainTile} from './story-terrain-art'
import {storyNewlandBuildings} from './story-layout-art'
import {C} from './world-ground-art'
import {currentMapId} from '../engine/maps'

const context=(tiles:Record<string,'road'|'lawn'|'hedge'>,day=1,revealed=true)=>storyLocationContext({player:{x:7,y:14,facing:'down',path:[],walkTime:0},clock:{day,minute:900},map:'newland',flags:{newlandRevealed:revealed?1:0},newland:{builds:[],tiles,nextId:1,settledDay:1}})
const color=(a:ReturnType<typeof storyNativeTerrainTile>,x:number,y:number)=>a.palette[a.rows[y][x]]
it('uses the native sandy road palette and floor anchoring rather than a replacement stone asset',()=>{
 const c=context({'7,14':'road'}),a=storyNewlandTerrain(c,320,108)[0]
 expect(a).toMatchObject({kind:'road',x:160,y:92,floor:true})
 expect(new Set(Object.values(a.palette))).toEqual(new Set([C.path,C.path2]))
 expect(a.rows).toHaveLength(16);expect(a.rows.every(r=>r.length===16)).toBe(true)
})
it('connects placed lawns to their actual neighbouring roads, including original base-map roads',()=>{
 const c=context({'7,14':'lawn','8,14':'road'}),a=storyNativeTerrainTile(c,7,14,'lawn')
 expect(color(a,15,5)).toBe('#a6c48a')
 const base=storyNativeTerrainTile(context({'7,10':'lawn'}),7,10,'lawn')
 expect(color(base,5,0)).toBe('#a6c48a')
})
it.each([[1,'#b0cc94'],[41,'#a8c48c'],[81,'#c8c88c'],[121,'#dfe8dc']] as const)('preserves the original season on day %i', (day,grass)=>{
 const a=storyNativeTerrainTile(context({'7,14':'lawn'},day),7,14,'lawn')
 expect(Object.values(a.palette)).toContain(grass)
})
it('keeps the original deciduous hedge winter branches and blends its shadow over its native lawn',()=>{
 const c=context({'7,14':'hedge'},121),a=storyNativeTerrainTile(c,7,14,'hedge')
 expect(color(a,7,10)).toBe('#8a6040')
 expect(Object.values(a.palette)).toContain('#a27a58')
 expect(Object.values(a.palette).some(v=>v.startsWith('rgba'))).toBe(false)
 expect(color(a,3,13)).not.toBe('#dfe8dc')
 expect(storyNewlandTerrain(c,320,108)[0]).toMatchObject({floor:false,x:160,y:92})
})
it('keeps border evergreen trees green during winter without reading the active map',()=>{
 const c=context({'0,14':'hedge'},121),before=JSON.stringify(c),map=currentMapId(),a=storyNativeTerrainTile(c,0,14,'hedge')
 expect(Object.values(a.palette)).toContain('#4e8050')
 expect(JSON.stringify(c)).toBe(before);expect(currentMapId()).toBe(map)
})
it('does not reveal placed terrain or buildings before the original land-reveal condition',()=>{
 const c=context({'7,14':'road'},1,false)
 expect(storyNewlandTerrain(c,320,108)).toEqual([])
 expect(storyNewlandBuildings(c,320,108)).toEqual([])
})
