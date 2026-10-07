// 이벤트 자산 전용. 게임 이벤트·보상·인물 위치·저장 상태는 연결하지 않는다.
import { withLookDefaults, type FullAvatar } from '../engine/avatar'
import { spriteRows, writerPalette, type SpriteOpts } from './sprites'
import { eventMemoryRows, ARCHIVE_PROP_PALETTE, guestGiftIconRows, type EventMemory } from './archive-followup-art'

export interface EventActorLook { avatar: FullAvatar; short?: number; elder?: boolean }
export const PAIR_EXAMPLE_LOOKS: readonly EventActorLook[] = [
  {avatar:withLookDefaults({look:'f',name:'주는 사람 예시',skin:2,hairFront:8,hairBack:4,top:13,bottom:4})},
  {avatar:withLookDefaults({look:'m',name:'받는 사람 예시',skin:4,hairFront:3,hairBack:0,top:10,bottom:6})},
]
export const PAIRED_GIFTS=['parcel','book','willowBasket'] as const
export type PairedGift=typeof PAIRED_GIFTS[number]
export const PAIRED_GIFT_LABELS:Record<PairedGift,string>={parcel:'꾸러미 주고받기',book:'책 주고받기',willowBasket:'바구니 주고받기'}
export const PAIRED_DIRECTIONS=['right','left'] as const
export type PairDirection=typeof PAIRED_DIRECTIONS[number]
export const PAIRED_EVENT_PALETTE={...ARCHIVE_PROP_PALETTE,J:'#674c3b',P:'#f4e5c5',p:'#c4b491'}
const phaseOf=(frame:number)=>Math.max(0,Math.min(7,Math.trunc(frame)))
function grid(){const p=Array.from({length:32},()=>Array<string>(64).fill('.'));return {p,put(x:number,y:number,c:string){if(p[y]?.[x]!==undefined)p[y][x]=c},rect(x:number,y:number,w:number,h:number,c:string){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c},rows:()=>p.map(r=>r.join(''))}}
function actor(look:EventActorLook,facing:'right'|'left',x:number,crouch:boolean,blink:boolean){
 const b=grid(),opts:SpriteOpts={frame:0,blink,avatar:look.avatar,short:look.short,elder:look.elder,pose:crouch?'crouch':'stand'}
 const rows=spriteRows('writer',facing,opts),y0=22-rows.length
 rows.forEach((r,y)=>[...r].forEach((c,dx)=>{if(c!=='.')b.put(x+dx,y0+y,c)}))
 // 기본 손을 지우고 두 사람이 공유하는 물건 위치로 새 손을 그린다.
 for(let y=y0+7;y<22;y++)for(let xx=x;xx<x+10;xx++)if(['s','5','!','K'].includes(b.p[y][xx]))b.p[y][xx]='.'
 return Object.assign(b,{shoulderY:y0+7,baseX:x})
}
function reach(b:ReturnType<typeof actor>,side:'left'|'right',hx:number,hy:number){
 const edge=side==='left'?b.baseX+10:b.baseX-1,shoulder=side==='left'?b.baseX+7:b.baseX+2,from=Math.min(edge,hx),to=Math.max(edge,hx)
 // 팔꿈치를 얼굴 바깥으로 빼고 어깨에서 손까지 이어 그린다.
 b.rect(Math.min(edge,shoulder),b.shoulderY,Math.abs(edge-shoulder)+1,1,'r')
 b.rect(edge,Math.min(b.shoulderY,hy-1),1,Math.abs(b.shoulderY-(hy-1))+1,'r')
 b.rect(from,hy-1,to-from+1,1,'r');b.rect(hx,hy,2,1,'s');b.rect(hx,hy+1,2,1,'5')
}
function giftRows(gift:PairedGift):string[]{
 if(gift==='willowBasket')return guestGiftIconRows('willowBasket',8)
 return gift==='parcel'?['.WWWWWW.','WCCCCCCW','WCCCwCCW','WCCCwCCW','WwwwwwwW','WCCCwCCW','WCCCCCCW','.WWWWWW.']:['.JJJJJJ.','.JPcccJ.','.JPcccJ.','.JPcccJ.','.JPcccJ.','.JPPPPJ.','.JJJJJJ.','........']
}
function flip(rows:string[]){return rows.map(r=>[...r].reverse().join(''))}

/** 64×32, 두 인물은 별도 팔레트, 물건은 장면 전체에 딱 한 번 그린다. */
export function pairedGiftFrame(gift:PairedGift,frame:number,first=PAIR_EXAMPLE_LOOKS[0],second=PAIR_EXAMPLE_LOOKS[1],direction:PairDirection='right'){
 const f=phaseOf(frame),p=grid()
 const x=[19,22,25,28,28,32,36,40][f],y=[15,15,15,15,15,15,15,15][f]
 const supports=f<3?'first':f<5?'both':'second'
 const firstHand=f<=4?x-2:[26,24,22][f-5],secondHand=f>=3?x+8:[40,39,37][f]
 const a=actor(first,'right',12,false,f===6),b=actor(second,'left',42,false,f===7)
 const hy=Math.max(18,a.shoulderY+1,b.shoulderY+1)
 reach(a,'left',firstHand,hy);reach(b,'right',secondHand,hy)
 giftRows(gift).forEach((r,dy)=>[...r].forEach((c,dx)=>{if(c!=='.')p.put(x+dx,y+dy,c)}))
 return finish(a.rows(),b.rows(),p.rows(),first,second,direction,{x,y,w:8,h:8},supports,{first:{x:firstHand,y:hy},second:{x:secondHand,y:hy}},f===4?'함께 잡기':f===7?'받은 사람 품에':'전달',260)
}

export function pairedMemorialFrame(kind:EventMemory,frame:number,first=PAIR_EXAMPLE_LOOKS[0],second=PAIR_EXAMPLE_LOOKS[1],direction:PairDirection='right'){
 const f=phaseOf(frame),lower=f>=2&&f<=5,a=actor(first,'right',12,lower,f===7),b=actor(second,'left',42,lower,f===7),p=grid()
 const x=24,y=[3,3,4,5,6,7,8,8][f],release=f>=6,hy=release?Math.max(18,a.shoulderY+1,b.shoulderY+1):y+9
 reach(a,'left',release?19:22,hy);reach(b,'right',release?43:40,hy)
 eventMemoryRows(kind,0).forEach((r,dy)=>[...r].forEach((c,dx)=>{if(c!=='.')p.put(x+dx,y+dy,c)}))
 return finish(a.rows(),b.rows(),p.rows(),first,second,direction,{x,y,w:16,h:16},release?'ground':'both',{first:{x:release?19:22,y:hy},second:{x:release?43:40,y:hy}},release?'놓고 손 떼기':'함께 낮추기',300)
}
function finish(firstRows:string[],secondRows:string[],prop:string[],first:EventActorLook,second:EventActorLook,direction:PairDirection,bounds:{x:number;y:number;w:number;h:number},supports:string,hands:{first:{x:number;y:number};second:{x:number;y:number}},beat:string,duration:number){
 const mirrored=direction==='left',mapX=(x:number)=>mirrored?63-x:x
 const mapHand=(hand:{x:number;y:number})=>({x:mirrored?62-hand.x:hand.x,y:hand.y,w:2,h:2})
 return {width:64,height:32,actors:[{id:'first',rows:mirrored?flip(firstRows):firstRows,palette:writerPalette('spring',first.avatar),anchor:{x:mapX(17),y:22}},{id:'second',rows:mirrored?flip(secondRows):secondRows,palette:writerPalette('spring',second.avatar),anchor:{x:mapX(47),y:22}}],propBack:Array<string>(32).fill('.'.repeat(64)),propFront:mirrored?flip(prop):prop,object:{bounds:{...bounds,x:mirrored?64-bounds.x-bounds.w:bounds.x},supports},hands:{first:mapHand(hands.first),second:mapHand(hands.second)},beat,duration,loop:false}
}
