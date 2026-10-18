import {drawHillMapTile} from './hill-map-art'
import {MAP,PLACES} from '../engine/world'
import {C} from './world-ground-art'
import type {Season} from '../engine/types'

it('keeps the existing map, hill interaction and approach unchanged in every season',()=>{
 const before=JSON.stringify({MAP,hill:PLACES.hill})
 for(const season of ['spring','summer','autumn','winter'] as Season[]){
  const colors=new Map<string,string>()
  const g={fillStyle:'',fillRect(x:number,y:number,w:number,h:number){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)colors.set(`${xx},${yy}`,this.fillStyle)}}
  for(let y=11;y<=12;y++)for(let x=11;x<=17;x++)drawHillMapTile(g,x,y,season,MAP[y][x])
  for(let x=225;x<238;x++)expect(colors.get(`${x},197`)).not.toBe(C.stoneDark)
 }
 expect(JSON.stringify({MAP,hill:PLACES.hill})).toBe(before)
})
it('confines pixels to the current grass tile, never covering adjacent objects or the road',()=>{
 for(let y=9;y<=14;y++)for(let x=9;x<=19;x++){
  const g={fillStyle:'',fillRect(px:number,py:number,w:number,h:number){expect(px).toBeGreaterThanOrEqual(x*16);expect(py).toBeGreaterThanOrEqual(y*16);expect(px+w).toBeLessThanOrEqual((x+1)*16);expect(py+h).toBeLessThanOrEqual((y+1)*16)}}
  drawHillMapTile(g,x,y,'spring',MAP[y][x])
 }
 for(const ch of [',','R','#','D','l']){
  const g={fillStyle:'',fillRect:vi.fn()};drawHillMapTile(g,12,11,'spring',ch);expect(g.fillRect).not.toHaveBeenCalled()
 }
})
it('keeps seasonal flowers without drawing a stone path or rise',()=>{
 const draw=(season:Season)=>{const colors:string[]=[];const g={fillStyle:'',fillRect(){colors.push(this.fillStyle)}};for(let y=11;y<=12;y++)for(let x=11;x<=17;x++)drawHillMapTile(g,x,y,season,MAP[y][x]);return colors}
 expect(draw('spring')).toContain(C.flower[3])
 for(const c of C.flower)expect(draw('winter')).not.toContain(c)
 for(const season of ['spring','summer','autumn','winter'] as Season[]){
  expect(draw(season)).not.toContain(C.stone)
  expect(draw(season)).not.toContain(C.stoneDark)
 }
})
