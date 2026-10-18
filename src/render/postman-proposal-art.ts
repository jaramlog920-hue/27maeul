import {drawPostmanBackground} from './postman-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import type {ProposalArtContext} from './dexter-proposal-art'
import {person} from './milestone-moments-art'
import {ICONS,ICON_PALETTE} from './sprites'

/** 수첩에 새 약속을 적는 대신 받은 끈을 짧게 손목에 매는 마일로. */
export function drawPostmanProposal(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,beat:number,context:ProposalArtContext={minute:900,indoors:false,wet:false}){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h*(h>w?.62:.52))
 g.imageSmoothingEnabled=false
 drawPostmanBackground(p,w,h,f,context,t)
 const foot=f+14
 person(p,cx-20,foot,avatar,'right')
 person(p,cx+9,foot,npc.avatar,beat>=1?'down':'left',npc.who)
 if(beat===0)ICONS.promiseCord.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&ICON_PALETTE[c])p(cx+5+x,foot-13+y,ICON_PALETTE[c])}))
 else{
  // 원본 손목은 10행·1열. 손과 팔을 늘리지 않고 피부 한 칸 위에 가는 붉은 띠를 놓는다.
  p(cx+10,foot-8,ICON_PALETTE.r,3,1)
  p(cx+10,foot-7,ICON_PALETTE.N,1,1);p(cx+10,foot-6,ICON_PALETTE.r,1,2)
 }
}
