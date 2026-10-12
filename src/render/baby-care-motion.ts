import type { Facing } from '../engine/types'
import { motionBodyRows } from './motion-body'
import { writerPalette, type SpriteOpts, type Who } from './sprites'
import { FURNI_PALETTE } from './furniture-art'

export const BABY_BEDS = ['wood', 'basket', 'canopy'] as const
export type BabyBed = typeof BABY_BEDS[number]
export const BABY_BED_NAMES = { wood:'나무 아기침대', basket:'흔들 요람', canopy:'천 지붕 아기침대' }
export const BABY_CARE_ACTIONS = ['hold', 'soothe', 'lay', 'tuck'] as const
export type BabyCareAction = typeof BABY_CARE_ACTIONS[number]
export const BABY_CARE_NAMES = { hold:'아기 안고 눈 맞추기', soothe:'안아 살살 달래기', lay:'머리 받쳐 침대에 눕히기', tuck:'이불 올리고 토닥이기' }
type Grid = string[][]
const grid = ():Grid => Array.from({length:48},()=>Array<string>(48).fill('.'))
const rows = (g:Grid)=>g.map(r=>r.join(''))
function dot(g:Grid,x:number,y:number,c:string){
  if(x<0||x>=48||y<0||y>=48)throw Error(`Baby care pixel outside canvas: ${x},${y}`)
  g[y][x]=c
}
function rect(g:Grid,x:number,y:number,w:number,h:number,c:string){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)dot(g,xx,yy,c)}
function line(g:Grid,x:number,y:number,tx:number,ty:number,c:string){const n=Math.max(Math.abs(tx-x),Math.abs(ty-y));for(let i=0;i<=n;i++)dot(g,Math.round(x+(tx-x)*i/(n||1)),Math.round(y+(ty-y)*i/(n||1)),c)}

/** Separate mattress and near rail keep the newborn inside the cot, never on its rim. */
export function babyBedLayers(kind:BabyBed,facing:Facing,x=16,y=25,phase=0):{back:string[];front:string[];origin:{x:number;y:number}}{
  if(facing==='left'){
    const r=babyBedLayers(kind,'right',x,y,phase),flip=(a:string[])=>a.map(row=>[...row].reverse().join(''))
    return {...r,back:flip(r.back),front:flip(r.front),origin:{x:47-r.origin.x-21,y:r.origin.y}}
  }
  const back=grid(),front=grid(),side=facing==='right'
  const shift=kind==='basket'?[0,1,0,-1][phase%4]:0
  x+=shift
  rect(back,x+2,y+17,18,1,'z')
  rect(back,x+2,y+3,18,12,kind==='basket'?'w':'k')
  rect(back,x+3,y+4,16,9,'c');rect(back,x+4,y+5,14,7,'C')
  rect(back,x+4,y+5,4,6,'c') // pillow, with space around the newborn
  if(kind==='basket'){
    rect(front,x+3,y+12,16,3,'w');rect(front,x+3,y+12,16,1,'l')
    for(let xx=x+4;xx<x+19;xx+=2)dot(front,xx,y+14,'l')
    line(front,x+1,y+17,x+20,y+17,'W');dot(front,x+1,y+16,'W');dot(front,x+20,y+16,'W')
  }else{
    rect(front,x+2,y+12,18,1,'l');rect(front,x+2,y+14,18,1,'w')
    for(let xx=x+3;xx<x+20;xx+=3)rect(front,xx,y+13,1,2,'k')
    rect(front,x+2,y+3,1,12,'k');rect(front,x+19,y+3,1,12,'k')
    rect(front,x+3,y+15,2,3,'W');rect(front,x+17,y+15,2,3,'W')
  }
  if(side){rect(back,x+18,y+4,2,8,'w');rect(front,x+19,y+4,1,11,'l')}
  if(facing==='up'){
    rect(back,x+3,y+3,16,1,'l')
    for(let xx=x+4;xx<x+19;xx+=3)dot(back,xx,y+4,'k')
  }
  if(kind==='canopy'){
    rect(back,x+2,y-5,1,9,'k');rect(back,x+19,y-5,1,9,'k')
    rect(back,x+3,y-7,16,1,'b');rect(back,x+1,y-6,20,2,'b')
    rect(back,x+2,y-4,3,3,'B');rect(back,x+17,y-4,3,3,'B')
    line(back,x+11,y-4,x+11,y-1,'c');dot(back,x+11,y,'y')
  }
  return {back:rows(back),front:rows(front),origin:{x,y}}
}

/** A round, nearly bald newborn face and short bundled body, rather than a scaled adult. */
export interface BabyCareFrame {
  actor:string[];babyBack:string[];babyFront:string[];furnitureBack:string[];furnitureFront:string[];blanket:string[]
  actorPalette:Record<string,string>;babyPalette:Record<string,string>;furniturePalette:Record<string,string>
  duration:number;feet:{x:number;y:number};babyPosition:{x:number;y:number}
}
export function babyCareFrame(who:Who,facing:Facing,action:BabyCareAction,kind:BabyBed,frame:number,opts:SpriteOpts):BabyCareFrame{
  const p=((Math.trunc(frame)%4)+4)%4
  if(facing==='left'){
    const r=babyCareFrame(who,'right',action,kind,p,opts)
    const flip=(a:string[])=>a.map(row=>[...row].reverse().join(''))
    return {...r,actor:flip(r.actor),babyBack:flip(r.babyBack),babyFront:flip(r.babyFront),furnitureBack:flip(r.furnitureBack),furnitureFront:flip(r.furnitureFront),blanket:flip(r.blanket),feet:{x:47-r.feet.x,y:r.feet.y},babyPosition:{x:47-r.babyPosition.x-8,y:r.babyPosition.y}}
  }
  const side=facing==='right',rear=facing==='up',caring=action==='lay'||action==='tuck'
  const actor=grid(),baby=grid(),blanket=grid()
  const ax=19,floor=rear?40:side?38:34
  const body=motionBodyRows(who,facing,{...opts,frame:0,pose:'stand'}),ay=floor-body.length
  body.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')dot(actor,ax+x,ay+y,c)}))
  const silhouette=actor.map(r=>[...r])
  const bedX=rear||side?26:13,bedY=rear?24:27
  const bed=babyBedLayers(kind,facing,bedX,bedY,0)
  const heldX=rear?29:side?25:19,heldY=ay+7
  const restingX=bedX+4,restingY=bedY+5
  const progress=action==='lay'?p/3:action==='tuck'?1:0
  const sway=action==='soothe'?[0,1,0,-1][p]:0
  const bx=Math.round(heldX+(restingX-heldX)*progress)+sway
  const by=Math.round(heldY+(restingY-heldY)*progress)+(action==='hold'&&p===2?1:0)
  const sleeping=action==='tuck'||action==='lay'&&p===3||action==='soothe'&&p>=2||action==='hold'&&p===1
  const babyRows=[
    '.hss.ww..',
    'nsssswwww',
    sleeping?'nseswwWww':'nsoswwWww',
    '.s+sswWww',
    '..ss.wWww',
    '......ww.',
  ]
  babyRows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')dot(baby,bx+x,by+y,c)}))
  const sleeve=body[8]?.[side?4:2]||'r'
  const arm=(sx:number,sy:number,hx:number,hy:number)=>{
    const g=grid();line(g,sx,sy,hx,hy,sleeve==='.'?'r':sleeve)
    rect(g,hx,hy,2,1,'s');rect(g,hx,hy+1,2,1,'5')
    g.forEach((row,y)=>row.forEach((c,x)=>{if(c!=='.'&&(!rear||silhouette[y][x]==='.'))dot(actor,x,y,c)}))
    // Gripping fingers are foreground; only erase the actual visible hand pixels.
    for(let y=hy;y<=hy+1;y++)for(let x=hx;x<=hx+1;x++)if(actor[y][x]==='s'||actor[y][x]==='5')baby[y][x]='.'
  }
  const sy=ay+8
  if(side)arm(ax+6,sy,Math.min(ax+10,bx+2),Math.min(sy+4,by+5))
  else if(rear){arm(ax+8,sy,Math.min(ax+12,bx+2),Math.min(sy+4,by+5));arm(ax+1,sy,ax+1,sy+1)}
  else{arm(ax+1,sy,bx,Math.min(sy+4,by+5));arm(ax+8,sy,bx+6,Math.min(sy+4,by+5))}
  if(action==='tuck'){
    const start=restingX+[6,5,4,4][p]
    rect(blanket,start,restingY+1,restingX+8-start,4,'b');rect(blanket,start,restingY+1,restingX+8-start,1,'c')
    if(p>=2){const hx=side||rear?ax+10:ax+8,hy=sy+2+(p===3?1:0);arm(side?ax+6:rear?ax+8:ax+8,sy,hx,hy)}
  }
  if(rear)baby.forEach((row,y)=>row.forEach((c,x)=>{if(c!=='.'&&silhouette[y][x]!=='.')baby[y][x]='.'}))
  const empty=rows(grid())
  // Held babies travel in front of the near rail; resting babies lie behind it.
  const resting=action==='tuck'||action==='lay'&&p>=2
  if(caring&&!rear&&!side){
    // The far-side parent stands behind the cot; legs must not cover the mattress or baby.
    for(let y=bedY+3;y<48;y++)for(let x=bedX+2;x<=bedX+19;x++)if(silhouette[y][x]!=='.'&&actor[y][x]===silhouette[y][x])actor[y][x]='.'
  }
  const babyPalette={h:'#c9a477',s:'#f7cba9',n:'#e3af8e',o:'#845f4d',e:'#bb866b','+':'#e9918b',w:'#dcece3',W:'#abcfc0'}
  return {actor:rows(actor),babyBack:resting?rows(baby):empty,babyFront:resting?empty:rows(baby),furnitureBack:caring?bed.back:empty,furnitureFront:caring?bed.front:empty,blanket:rows(blanket),actorPalette:writerPalette(opts.season??'spring',opts.avatar),babyPalette,furniturePalette:{...FURNI_PALETTE,z:'#d1c4ae'},duration:action==='lay'?[420,340,340,800][p]:action==='tuck'?[400,340,420,800][p]:[420,420,420,420][p],feet:{x:ax+5,y:floor},babyPosition:{x:bx,y:by}}
}
