// 27권 완필 축하 전용 도트. 실제 완필 판정·보상·연결은 별도.
import { withLookDefaults } from '../engine/avatar'
import type { EventActorLook } from './paired-event-art'
import { PAIR_EXAMPLE_LOOKS } from './paired-event-art'
import { eventMotionFrame } from './event-life-motion'
import { spriteRows,writerPalette } from './sprites'
import { FURNI_PALETTE } from './furniture-art'

export const COMPLETION_PALETTE={...FURNI_PALETTE,J:'#604a3a',P:'#efdfbd',p:'#ba9f79',Q:'#d9bd77',q:'#a4834b',v:'#a78ba6',n:'#8ca7b4'}
export const COMPLETION_EXAMPLE_LOOKS:readonly EventActorLook[]=[...PAIR_EXAMPLE_LOOKS,{avatar:withLookDefaults({look:'f',name:'축하 이웃 예시',skin:1,hairFront:5,hairBack:6,top:14,bottom:0})}]
export const COMPLETION_BEATS=['마지막 책 들기','선반으로 손 뻗기','마지막 빈칸 앞','책 꽂기','스물일곱 책등 완성','완성 책 보여주기','함께 박수','축하 인사'] as const
function grid(){const p=Array.from({length:56},()=>Array<string>(128).fill('.'));return {p,put(x:number,y:number,c:string){if(p[y]?.[x]!==undefined)p[y][x]=c},rect(x:number,y:number,w:number,h:number,c:string){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c},rows:()=>p.map(r=>r.join(''))}}
function paste(b:ReturnType<typeof grid>,rows:string[],x:number,y:number){rows.forEach((r,dy)=>[...r].forEach((c,dx)=>{if(c!=='.')b.put(x+dx,y+dy,c)}))}
export function completionSceneFrame(frame:number,looks:readonly EventActorLook[]=COMPLETION_EXAMPLE_LOOKS){
 if(looks.length!==3)throw new Error('완필 장면에는 기록자와 축하 이웃 두 명의 외형이 필요합니다')
 const f=Math.max(0,Math.min(7,Math.trunc(frame))),back=grid(),front=grid(),r=back.rect
 r(4,2,120,1,'W');for(let x=10;x<122;x+=14){r(x,3,6,4,x%3===0?'b':'p');r(x+1,3,4,1,'c')}
 r(39,6,49,27,'W');r(41,8,45,23,'w');for(const y of [15,23,31])r(41,y,45,1,'l')
 // 마지막 책은 맨 아래 줄 가운데. 나머지 26권은 처음부터 꽂혀 있다.
 const slots=[] as {x:number;y:number}[]
 for(let row=0;row<3;row++)for(let col=0;col<9;col++)slots.push({x:42+col*5,y:9+row*8})
 const last=slots[22]
 const colors=['C','b','g','p','r','n','v']
 for(const [i,slot]of slots.entries())if(i!==22||f>=4){r(slot.x,slot.y,3,6,i===22?'p':colors[i%colors.length]);r(slot.x,slot.y,1,6,'c');r(slot.x,slot.y+1,3,1,i===22?'Q':'l')}
 r(94,14,17,9,'W');r(95,15,15,7,'P')
 const two=['qqq','..q','qqq','q..','qqq'],seven=['qqq','..q','..q','.q.','.q.']
 two.forEach((s,y)=>[...s].forEach((c,x)=>{if(c!=='.')back.put(97+x,16+y,c)}));seven.forEach((s,y)=>[...s].forEach((c,x)=>{if(c!=='.')back.put(104+x,16+y,c)}))
 const bookX=[60,61,62,62],bookY=[38,34,29,25]
 const actors=looks.map((look,i)=>{
  const a=grid(),opts={frame:0 as const,blink:f===7,avatar:look.avatar,short:look.short,elder:look.elder}
  if(i===0){
   const rows=spriteRows('writer',f<5?'up':'down',opts),y=47-rows.length
   paste(a,rows,57,y)
   if(f<5){
    for(let yy=y+7;yy<47;yy++)for(let x=57;x<67;x++)if(['s','5','!','K'].includes(a.p[yy][x]))a.p[yy][x]='.'
    const hy=f===4?40:bookY[f]+4,lx=f===4?57:bookX[f]-2,rx=f===4?65:bookX[f]+3
    for(const [edge,hx]of [[56,lx],[67,rx]]){
     a.rect(edge,Math.min(40,hy-1),1,Math.abs(40-(hy-1))+1,'r')
     a.rect(Math.min(edge,hx),hy-1,Math.abs(edge-hx)+1,1,'r')
     a.rect(hx,hy,2,1,'s');a.rect(hx,hy+1,2,1,'5')
    }
   }else{
    a.rect(57,41,2,1,'s');a.rect(65,41,2,1,'s')
   }
  }else{
   const layers=eventMotionFrame('writer','down',f>=4?'clap':'smile',f%4,opts)
   paste(a,layers.actor,i===1?10:85,47-layers.anchor.y)
  }
  return {id:i===0?'writer':`guest${i}`,rows:a.rows(),palette:writerPalette('spring',look.avatar),anchor:{x:i===0?62:i===1?22:97,y:47}}
 })
 if(f<4){const x=bookX[f],y=bookY[f];front.rect(x,y,3,6,'p');front.rect(x,y,1,6,'c');front.rect(x,y+1,3,1,'Q')}
 if(f>=5){front.rect(58,39,8,9,'J');front.rect(59,40,6,6,'P');front.rect(60,41,4,1,'q');front.rect(59,47,6,1,'p')}
 // 완성 뒤에만 종이 조각을 떨어뜨린다. 마지막 자세에서는 그대로 멈춘다.
 if(f>=4)for(const [i,x]of [19,29,38,92,102,111].entries()){
  const y=17+(f-4)*4+(i%3)*3,c=['Q','n','v'][i%3]
  front.rect(x+(f%2?1:0),y,2,1,c);front.put(x,y+1,'c')
 }
 return {width:128,height:56,propBack:back.rows(),actors,propFront:front.rows(),duration:360,loop:false,beat:COMPLETION_BEATS[f],shelfBookCount:f<4?26:27,lastBook:{slot:last,owner:f<4?'writer':'shelf'},completed:f>=4}
}
