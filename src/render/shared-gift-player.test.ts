import {withLookDefaults} from '../engine/avatar'
import {spriteRows,writerPalette} from './sprites'
import {furnitureUseFrame} from './furniture-use-motion'
import {sharedGiftPlayerArt} from './shared-gift-player'
import {drawSharedGiftForeground,sharedGiftProps} from './shared-gift-art'

it.each([null,withLookDefaults({name:'기록자',look:'f',skin:3}),withLookDefaults({name:'기록자',look:'m',skin:1})])('uses the original seated body on the actual gifted stool without covering the head or hands',avatar=>{
 for(const season of ['spring','summer','autumn','winter'] as const)for(const ground of [108,374,83]){
  const av=avatar?withLookDefaults(avatar):undefined,palette=writerPalette(season,av)
  const native=furnitureUseFrame('writer','right','sit',0,{avatar:av,season,frame:0,blink:false}),end=sharedGiftPlayerArt('gift:carpenter:3',160,ground,8,avatar,season)
  expect(end.seat).toEqual({x:160,y:ground-14})
  expect(end.x+native.anchor.x*2).toBe(end.seat!.x);expect(end.y+native.anchor.y*2).toBe(end.seat!.y)
  const prop=sharedGiftProps('gift:carpenter:3',160,ground,8)[0]
  expect(prop.y+6*prop.scale).toBe(end.seat!.y)
  const original=spriteRows('writer','right',{avatar:av,season,pose:'stand',frame:0,blink:false})
  const originalSkin=new Set<string>()
  original.forEach((row,y)=>[...row].forEach((ch,x)=>{if('s5'.includes(ch))originalSkin.add(`${x+7},${y+4}`)}))
  native.actor.forEach((row,y)=>[...row].forEach((ch,x)=>{if(!originalSkin.has(`${x},${y}`))expect(end.rows[y][x]).toBe(ch)}))
  // The existing seated pose bends the last three leg rows upward by two rows.
  // The head, upper torso and original skin pixels stay intact above/beside the lap.
  for(let y=0;y<original.length-5;y++)for(let x=0;x<original[y].length;x++)if(original[y][x]!=='.')expect(end.rows[4+y][7+x]).toBe(original[y][x])
  original.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='s')expect(end.rows[4+y][7+x]).toBe(ch)}))
  for(const t of [0,.6,1.49,1.5,1.65,1.85,8]){
   const f=sharedGiftPlayerArt('gift:carpenter:3',160,ground,t,avatar,season),pixels=new Map<string,string>()
   const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
   drawSharedGiftForeground(g,'gift:carpenter:3',320,ground,t,avatar,{avatar:null,who:'carpenter'},season)
   f.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'&&palette[ch])expect(pixels.get(`${f.x+x*2},${f.y+y*2}`)).toBe(palette[ch])}))
  }
  const approach=sharedGiftPlayerArt('gift:carpenter:3',160,ground,1.49,avatar,season),sit=sharedGiftPlayerArt('gift:carpenter:3',160,ground,1.5,avatar,season)
  // Compare visible head origins; the native seated canvas includes its own padding.
  expect(Math.abs(approach.x-(sit.x+14))).toBeLessThanOrEqual(1)
  expect(Math.abs(approach.y-(sit.y+8))).toBeLessThanOrEqual(2)
 }
})
