import {spriteRows,writerPalette,animalRows,ANIMAL_PALETTE} from './sprites'
import {drawHomeYardEvent,HOME_YARD_EVENT_IDS} from './home-yard-events-art'
import {homeYardEventContext} from './home-yard-event-context'
import {person} from './milestone-moments-art'
import {withLookDefaults} from '../engine/avatar'
import {SCENES} from '../content/text'
const npc={avatar:withLookDefaults({name:'실제 이웃',look:'f',top:5,skin:2}),who:'writer' as const}
const frames=HOME_YARD_EVENT_IDS.flatMap(id=>SCENES[id].lines.flatMap((_,beat)=>[0,.5,.7,1.2,8].flatMap(t=>[170,180,480,693].flatMap(h=>[null,withLookDefaults({name:'기록자',look:'m',top:3,skin:3})].map(av=>({id,beat,t,h,av}))))))
it.each(frames)('$id phase $beat time $t height $h leaves native faces, torsos, short hands and feet intact',({id,beat,t,h,av})=>{
 const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6)+8-(['strays','companionJoined'].includes(id)?18:0),pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-90,y);yy<Math.min(ground+2,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawHomeYardEvent(g,id,320,h,t,av,npc,beat,homeYardEventContext())
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 if(id==='reedRack'){
  const waving=beat>=3&&t<.55,leaving=beat>=3&&t>=.55,nx=Math.round(234+(leaving?Math.min(1,(t-.55)/1.4)*30:0))
  person(p,131,ground,av,'right')
  if(waving){const rows=spriteRows('writer','down',{frame:0,blink:false,pose:'wave',avatar:npc.avatar}),pal=writerPalette('spring',npc.avatar);rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c])p(nx+x*2,ground-rows.length*2+y*2,pal[c],2,2)}))}
  else person(p,nx,ground,npc.avatar,leaving?'right':'left',npc.who,false,leaving&&t<1.95,t)
 }else if(id==='homeMailbox'){
  person(p,125,ground,av,'left');const nx=beat===0?92:beat===1?Math.round(92-Math.min(1,t/.65)*35):57;person(p,nx,ground,npc.avatar,'left',npc.who,beat===1&&t>=.65,beat===1&&t<.65,t)
 }else{
  person(p,125,ground,av,'left');if(id==='companionJoined'&&beat>=1)person(p,270,ground,npc.avatar,'left',npc.who)
 }
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
})

it.each(['cat','dog'].flatMap(kind=>[0,1].flatMap(beat=>[0,.15,.3,.5,.7,1.2,8].map(t=>({kind:kind as 'cat'|'dog',beat,t})))))('$kind adoption phase $beat time $t preserves both separate native pet bodies',({kind,beat,t})=>{
 const ctx=homeYardEventContext(),ground=98,pixels=new Map<string,string>()
 ctx.companion={kind,name:'달콩'};ctx.childPet=kind==='cat'?'dog':'cat'
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-45,y);yy<Math.min(ground+26,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawHomeYardEvent(g,'companionJoined',320,180,t,null,npc,beat,ctx)
 const occupied=new Set<string>()
 for(const animal of ['cat','dog'] as const){
  const owned=animal===kind,start=160+(ctx.strays[animal].x-ctx.front.x)*20,target=owned?150:beat>=1?240:start,movement=owned&&beat>=1?1:Math.min(1,t/1.3),x=Math.round(start+(target-start)*(owned?Math.min(1,movement/.65):movement)),petFloor=Math.round(ground+24-(owned?16*Math.max(0,(movement-.65)/.35):0)),rows=animalRows(animal,'baby',!owned&&beat>=1?'right':'left'),pal=ANIMAL_PALETTE[animal]
  rows.forEach((r,y)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const key=`${x+xx*2+dx},${petFloor-rows.length*2+y*2+dy}`
   expect(occupied.has(key),'The two pets must never overlap').toBe(false);occupied.add(key)
   expect(pixels.get(key),`${animal} ${key}`).toBe(pal[c])
  }}))
 }
})
