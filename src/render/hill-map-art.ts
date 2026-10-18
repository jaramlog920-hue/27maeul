import type {Season} from '../engine/types'
import {C,SEASON_GRASS} from './world-ground-art'

type HillCanvas=Pick<CanvasRenderingContext2D,'fillStyle'|'fillRect'>

/** Grass and flowers around the existing hill bench. Decoration only; no map writes. */
export function drawHillMapTile(g:HillCanvas,x:number,y:number,season:Season,ch:string){
 if(x<11||x>17||y<11||y>12||!['.','B','T'].includes(ch))return
 const left=x*16,top=y*16,[grass,shade]=SEASON_GRASS[season]
 const p=(px:number,py:number,color:string,w=1,h=1)=>{
  const x0=Math.max(left,px),y0=Math.max(top,py),x1=Math.min(left+16,px+w),y1=Math.min(top+16,py+h)
  if(x1>x0&&y1>y0){g.fillStyle=color;g.fillRect(x0,y0,x1-x0,y1-y0)}
 }
 for(let i=0;i<23;i++){
  const px=179+(i*29)%106,py=180+(i*7)%12
  // Leave clear space around the bench, mailbox and tree trunk.
  if(px>=221&&px<=270)continue
  p(px,py,shade,1,3);p(px-1,py+1,grass,3,1)
 }
 if(season!=='winter')for(const [px,py,n] of [[181,180,0],[196,182,1],[211,178,2],[279,182,0],[286,187,1]]){
  if(season==='autumn'&&n!==0)continue
  p(px+1,py+2,shade,1,3)
  p(px,py,season==='autumn'?'#eed584':C.flower[n===0?2:n===1?3:1],3,2)
  p(px+1,py+1,'#dfbe6d')
 }
}
