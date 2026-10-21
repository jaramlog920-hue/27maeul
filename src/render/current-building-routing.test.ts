import { BUILDING_FACINGS, PROFESSION_BUILDINGS, professionBuildingArt, BUILDING_ART_PALETTE } from './newland-building-art'
import { OLD_BUILDINGS, OLD_CONSTRUCTION, OLD_VILLAGE_PALETTE } from './old-village-art'
import { drawNewlandHouse } from './newland-house-art'
import { OLD_VILLAGE_PALETTE as SHARED_PALETTE } from './village-shared-art'

it('all eighteen workplace exteriors use the current approved artwork in every direction',()=>{
 for(const job of PROFESSION_BUILDINGS)for(const facing of BUILDING_FACINGS){
  const colors=(rows:string[],palette:Record<string,string>)=>rows.map(row=>[...row].map(ch=>ch==='.'?'':palette[ch]))
  expect(colors(OLD_BUILDINGS[job][facing].rows,OLD_VILLAGE_PALETTE)).toEqual(colors(professionBuildingArt(job,facing).rows,BUILDING_ART_PALETTE))
  expect(OLD_BUILDINGS[job][facing].rows).toEqual(OLD_BUILDINGS.home[facing].rows)
 }
 for(const [key,color] of Object.entries(SHARED_PALETTE))expect(OLD_VILLAGE_PALETTE[key]).toBe(color)
})
it('house icons use the same native house and guest sign as the map, with no old brick-house fallback',()=>{
 for(const kind of ['home','guest','family','gallery'] as const)for(const facing of BUILDING_FACINGS){
  const expected=Array.from({length:64},()=>Array<string>(64).fill(''))
  const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(expected[yy]?.[xx]!==undefined)expected[yy][xx]=this.fillStyle
  }} as CanvasRenderingContext2D
  drawNewlandHouse(g,kind==='family'?'home':kind,facing)
  const actual=OLD_BUILDINGS[kind][facing].rows.map(row=>[...row].map(ch=>ch==='.'?'':OLD_VILLAGE_PALETTE[ch]))
  expect(actual).toEqual(expected)
 }
})
it('all published completed and construction sprites have valid colors, without browser APIs',()=>{
 for(const set of [OLD_BUILDINGS,OLD_CONSTRUCTION])for(const views of Object.values(set))for(const art of Object.values(views)){
  expect(art.rows).toHaveLength(64)
  expect(art.rows.every(r=>r.length===64)).toBe(true)
  expect([...new Set(art.rows.join(''))].filter(c=>c!=='.'&&!OLD_VILLAGE_PALETTE[c])).toEqual([])
 }
})
