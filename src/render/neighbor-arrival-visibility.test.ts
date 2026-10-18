import {drawNeighborArrival,NEIGHBOR_ARRIVAL_IDS} from './neighbor-arrival-art'
import {person} from './milestone-moments-art'
import {spriteRows,writerPalette} from './sprites'
import {withLookDefaults} from '../engine/avatar'
import {SCENES} from '../content/text'
const npc={avatar:withLookDefaults({name:'다음 세대 이웃',look:'f',skin:2,top:5,hairFront:8}),who:'writer' as const}
const frames=NEIGHBOR_ARRIVAL_IDS.flatMap(id=>SCENES[id].lines.flatMap((_,beat)=>[0,.35,.6,.8,8].flatMap(t=>[170,180,480,693].flatMap(h=>[null,withLookDefaults({name:'기록자',look:'m',top:3,skin:3})].map(av=>({id,beat,t,h,av}))))))
it.each(frames)('$id page $beat time $t height $h preserves the entire native bodies',({id,beat,t,h,av})=>{
 const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-90,y);yy<Math.min(ground+4,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawNeighborArrival(g,id,320,h,t,av,npc,beat)
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 person(p,112,ground,av,'right')
 const arriving=id==='movedIn:weaver'&&beat===0,progress=arriving?Math.min(1,t/.8):1,nx=185+Math.round((1-progress)*20)
 if(!arriving&&t<.55){const rows=spriteRows('writer','left',{frame:0,blink:false,avatar:npc.avatar,pose:'wave'}),pal=writerPalette('spring',npc.avatar);rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c])p(nx+x*2,ground-rows.length*2+y*2,pal[c],2,2)}))}
 else person(p,nx,ground,npc.avatar,'left','writer',false,arriving&&progress<1,t)
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
})
