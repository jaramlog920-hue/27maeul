import type {StoryLocationContext} from './story-location-context'
import {OLD_TERRAIN,OLD_VILLAGE_PALETTE} from './old-village-art'
import {BG_ART,BG_PALETTE} from './bg-materials-art'
import {joinedPathRows,JOIN_PATH_PALETTE,PATH_BITS} from './archive-followup-art'
import {DECOR_FLOORS,type DecorKind} from '../engine/newland-sites'
import {MAP_DECOR_CHAR} from '../engine/newland-sites'
import {NEWLAND_MAP,newlandBounds} from '../engine/newland'
import {NEWLAND_VISIBLE_H,NEWLAND_W} from '../engine/newland-config'
import {drawNativeGround,drawTree} from './world-ground-art'
import {seasonOf} from '../engine/clock'

/** Rasterize the original ground/tree commands with explicit snapshot neighbours. */
export function storyNativeTerrainTile(c:StoryLocationContext,x:number,y:number,kind:'road'|'lawn'|'hedge'){
 const colors:Record<string,string>={},symbols=new Map<string,string>(),grid=Array.from({length:16},()=>Array<string>(16).fill('.'))
 const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
 const symbol=(color:string)=>{let ch=symbols.get(color);if(!ch){ch=chars[symbols.size];symbols.set(color,ch);colors[ch]=color}return ch}
 const g={fillStyle:'',fillRect(this:{fillStyle:string},px:number,py:number,w:number,h:number){
  for(let yy=Math.max(0,py-y*16);yy<Math.min(16,py-y*16+h);yy++)for(let xx=Math.max(0,px-x*16);xx<Math.min(16,px-x*16+w);xx++){
   let color=this.fillStyle
   const rgba=color.match(/^rgba\(([^)]+)\)$/)
   if(rgba){const [r,g,b,a]=rgba[1].split(',').map(Number),under=colors[grid[yy][xx]];color='#'+[r,g,b].map((v,i)=>Math.round(v*a+parseInt(under.slice(1+i*2,3+i*2),16)*(1-a)).toString(16).padStart(2,'0')).join('')}
   grid[yy][xx]=symbol(color)
  }
 }}
 const at=(xx:number,yy:number)=>{
  const placed=MAP_DECOR_CHAR[c.layout?.tiles?.[`${xx},${yy}`] as DecorKind]
  return placed===','||placed==='.'?placed:newlandBounds(c.layout?.newlandRevealed!==false,yy,NEWLAND_MAP[yy]?.[xx]??'T')
 }
 const season=seasonOf(c.day)
 drawNativeGround(g,kind==='road'?',':'.',x,y,season,at,NEWLAND_VISIBLE_H)
 if(kind==='hedge'){
  const edge=x===0||x===NEWLAND_W-1||y===0||y===NEWLAND_VISIBLE_H-1
  drawTree(g,x,y,season,edge&&(x+y)%3!==0?'evergreen':'deciduous')
 }
 return {rows:grid.map(r=>r.join('')),palette:colors}
}

/** Exact user-placed native decor, without changing the active map. */
export function storyNewlandTerrain(c:StoryLocationContext,w:number,ground:number){
 if(c.map!=='newland'||c.indoors||c.layout?.newlandRevealed===false)return []
 const tiles=c.layout?.tiles??{}
 return Object.entries(tiles).flatMap(([key,kind])=>{
  const [x,y]=key.split(',').map(Number)
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x-c.at.x)>12||Math.abs(y-c.at.y)>8)return []
  let rows:readonly string[]|undefined,palette:Record<string,string>,floor=false
  if(kind==='road'||kind==='lawn'||kind==='hedge'){
   const art=storyNativeTerrainTile(c,x,y,kind);rows=art.rows;palette=art.palette;floor=kind!=='hedge'
  }else if(kind==='path'||kind==='garden'){
   rows=(kind==='path'?OLD_TERRAIN.path:OLD_TERRAIN.plantingBed).rows;palette=OLD_VILLAGE_PALETTE;floor=true
  }else if(kind==='sand'||kind==='stone'){
   const same=(dx:number,dy:number)=>tiles[`${x+dx},${y+dy}`]===kind
   const mask=(same(0,-1)?PATH_BITS.north:0)|(same(1,0)?PATH_BITS.east:0)|(same(0,1)?PATH_BITS.south:0)|(same(-1,0)?PATH_BITS.west:0)
   rows=joinedPathRows(kind,mask);palette=JOIN_PATH_PALETTE;floor=true
  }else{
   rows=BG_ART[kind];palette=kind==='bush'?{...BG_PALETTE,b:'#91b07b',c:'#aac38f',e:'#c2d5a6',f:'#779866',g:'#86a573',j:'#acbea0'}:BG_PALETTE
   floor=(DECOR_FLOORS as readonly string[]).includes(kind as DecorKind)
  }
  if(!rows)return []
  const px=Math.round(w/2+(x-c.at.x)*16+(floor?0:8-rows[0].length/2)),py=Math.round(ground+(y-c.at.y)*16-rows.length)
  return [{key,kind,x:px,y:py,rows,palette,floor}]
 }).sort((a,b)=>Number(b.floor)-Number(a.floor)||a.y+a.rows.length-b.y-b.rows.length)
}
export function drawStoryNewlandTerrain(p:(x:number,y:number,color:string,w?:number,h?:number)=>void,w:number,ground:number,c:StoryLocationContext){
 for(const a of storyNewlandTerrain(c,w,ground))a.rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'&&a.palette[ch])p(a.x+x,a.y+y,a.palette[ch])}))
}
