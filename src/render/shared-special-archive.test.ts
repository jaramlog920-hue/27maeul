import {drawSharedSpecial} from './shared-special-art'
import {drawLibraryExterior} from './house-exterior-art'
import {OT_LIBRARY_ROOF} from './library-roof-palette'
import {ARCHIVE} from '../engine/newland-config'
import {withLookDefaults} from '../engine/avatar'

it.each([[320,180],[320,693],[320,120]])('keeps the original seven-tile archive intact in every landmark dialogue at %i × %i',(w,h)=>{
 const ground=Math.round(h>w?h*.54:h<=170?h*.69:h*.6)
 const expected=new Map<string,string>(),dx=w/2+36-ARCHIVE.x0*16,dy=ground-(ARCHIVE.door.y+1)*16
 const paint=(pixels:Map<string,string>)=>({fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){
  for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)if(xx>=0&&xx<w&&yy>=0&&yy<h)pixels.set(`${xx},${yy}`,this.fillStyle)
 }})
 const native={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,width:number,height:number){
  const g=paint(expected);g.fillStyle=this.fillStyle;g.fillRect(x+dx,y+dy,width,height)
 }}
 drawLibraryExterior(native,{x0:ARCHIVE.x0,y0:ARCHIVE.y0,x1:ARCHIVE.x0+ARCHIVE.w-1,y1:ARCHIVE.door.y,doorX:ARCHIVE.door.x},OT_LIBRARY_ROOF)
 expect(Math.min(...[...expected.keys()].map(k=>Number(k.split(',')[1])))).toBeGreaterThanOrEqual(0)
 for(const avatar of [null,withLookDefaults({name:'기록자',look:'f',skin:3})])for(let beat=0;beat<3;beat++)for(const t of [0,.6,8]){
  const actual=new Map<string,string>()
  drawSharedSpecial(paint(actual) as CanvasRenderingContext2D,'newlandGift',w,h,t,avatar,undefined,beat)
  const sample=new Map([...actual].filter(([key])=>expected.has(key)))
  expect(sample).toEqual(expected)
 }
})
