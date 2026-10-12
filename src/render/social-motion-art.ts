import type { Facing } from '../engine/types'
import type { SocialAction, SocialProp } from '../engine/social-scene'
import { spriteRows, type SpriteOpts, type Who } from './sprites'
import { motionBodyRows } from './motion-body'

export const SOCIAL_PROP_ROWS:Record<SocialProp,readonly string[]>={
 teapot:['..WW...','..cc...','.yyyyw.','wyyyy.w','.yyyyw.','..WW...'],
 cup:['.WWWW..','.yyyyw.','.yCCy.w','.yyyyw.','..WW...'],
 cloth:['WWWWWWWWW','WbbbbbbbW','WbCbCbCbW','WbbbbbbbW','WWWWWWWWW'],
 seed:['.wwwww.','.wCCCw.','.wggCw.','.wCgCw.','.wwwww.'],
 water:['..w....','wwwwww.','wbbbbwg','wbbbbw.','.wwww..'],
 book:['WWWWWWWWW','WcccWcccW','WcWcWcWcW','WcccWcccW','WWWWWWWWW'],
 copy:['.CCCCCCC.','.CWWCCCW.','.CCCCCCC.','.CWWWWCC.','.CCCCCCC.','.CWWWCCC.','.CCCCCCC.'],
 dough:['........','..CCCC..','.CCccCC.','CCCCCCCC','.WWWWWW.'],
 bowl:['..g.y...','.CCgCCC.','WCCCCCCW','.wCCCCw.','..wwww..'],
 food:['..yyyy..','..yCCy..','.CCCCCC.','WWWWWWWW','.CCCCCC.'],
 picture:['WWWWWWWWW','WCbbbCCCW','WCbbgCCCW','WCCggCCCW','WCCCCCCyW','WWWWWWWWW'],
 instrument:['..WW..','..wW..','..wW..','.wCCC.','wCCCCw','wCWCCw','.wwww.'],
 gift:['.WWWWWW.','WCCCwCCW','WCCCwCCW','WwwwwwwW','WCCCwCCW','.WWWWWW.'],
 tray:['.CCCCCCC.','WCCCCCCCW','WWWWWWWWW'],
 decor:['..y.y..','.bbybb.','..bbb..','...w...','...w...'],
}
/** 공통 동작 15개가 마을의 몸·옷·픽셀 크기와 손 구조를 함께 쓴다. */
export function socialMotionFrame(who:Who,facing:Facing,action:SocialAction,prop:SocialProp|undefined,frame:number,opts:SpriteOpts){
 const f=((Math.trunc(frame)%8)+8)%8,phase=[0,1,2,3,3,2,1,0][f]
 const seated=['stitch','read'].includes(action),crouch=['dig','sow','water'].includes(action)
 const body=motionBodyRows(who,facing,{...opts,frame:0,pose:seated||crouch?'crouch':'stand'})
 const standHeight=spriteRows(who,facing,{...opts,frame:0,pose:'stand'}).length
 const y0=4+standHeight-body.length
 const a=Array.from({length:24},()=>Array<string>(24).fill('.')),front=Array.from({length:24},()=>Array<string>(24).fill('.')),back=Array.from({length:24},()=>Array<string>(24).fill('.'))
 const put=(layer:string[][],x:number,y:number,c:string)=>{if(layer[y]?.[x]!==undefined)layer[y][x]=c}
 const rect=(layer:string[][],x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(layer,xx,yy,c)}
 body.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')put(a,7+x,y0+y,c)}))
 if(seated){rect(back,7,21,10,2,'w');rect(back,8,23,2,1,'W');rect(back,14,23,2,1,'W')}
 const left=facing==='left',side=left||facing==='right',dir=left?-1:1
 const torso=seated||crouch?7:8
 const sleeve=body[torso]?.[4]??'r'
 const shoulderX=side?left?9:14:9,shoulderY=y0+torso
 let hx=side?shoulderX+dir*3:10,hy=y0+11
 if(action==='wave'){hx=side?shoulderX+dir*3:16;hy=shoulderY-3+phase%2}
 if(action==='point'){hx=shoulderX+dir*(4+phase);hy=shoulderY}
 if(action==='show'){hy=shoulderY+1-phase;hx=side?shoulderX+dir*4:10}
 if(action==='offer'){hx=side?shoulderX+dir*(2+phase):10;hy=shoulderY+3}
 if(action==='drink'){hy=shoulderY+3-phase;hx=side?shoulderX+dir*3:10}
 if(action==='pour'){hy=shoulderY+2;hx=side?shoulderX+dir*3:10}
 if(['dig','sow','water'].includes(action)){hy=shoulderY+5+phase%2;hx=side?shoulderX+dir*4:10}
 if(['prepare','stitch','tidy','play'].includes(action)){hy=shoulderY+4-phase%2;hx=side?shoulderX+dir*(2+phase%2):10+phase%2}
 // 어깨부터 소매와 손을 이어 그려 몸과 떨어져 보이지 않게 한다.
 const steps=Math.max(Math.abs(hx-shoulderX),Math.abs(hy-shoulderY))
 for(let i=0;i<=steps;i++){const x=Math.round(shoulderX+(hx-shoulderX)*i/Math.max(1,steps)),y=Math.round(shoulderY+(hy-shoulderY)*i/Math.max(1,steps));rect(a,x,y,2,2,i<steps-1?sleeve:'s')}
 rect(a,hx,hy+1,2,1,'5')
 const rows=prop?SOCIAL_PROP_ROWS[prop]:undefined
 if(rows){
  const px=side?left?Math.max(0,hx-rows[0].length):Math.min(24-rows[0].length,hx+1):8
  const py=Math.max(3,Math.min(24-rows.length,hy-1))
  const layer=facing==='up'?back:front
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')put(layer,px+(left?row.length-1-x:x),py+y,c)}))
  if(action==='pour'&&phase>=1){rect(front,left?px:Math.min(22,px+rows[0].length),py+3,1,phase+1,'b')}
  if(action==='water'&&phase>=1)for(let i=0;i<3;i++)put(front,Math.max(0,Math.min(23,hx+dir*(i+2))),Math.min(23,hy+i),'b')
  if(action==='stitch')rect(front,Math.max(0,Math.min(22,hx)),Math.min(22,hy-2),1,2,'S')
  if(action==='prepare'&&prop==='picture')rect(front,Math.max(0,Math.min(22,hx)),Math.min(22,hy-2),1,3,'w')
 }
 return {actor:a.map(r=>r.join('')),propBack:back.map(r=>r.join('')),propFront:front.map(r=>r.join('')),anchor:{x:12,y:4+standHeight},duration:250,loop:true}
}
