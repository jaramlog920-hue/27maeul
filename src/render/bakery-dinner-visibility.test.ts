import {drawBakeryDinner} from './bakery-dinner-art'
import {person} from './milestone-moments-art'
import {newbornArt} from './newborn-art'
import {withLookDefaults} from '../engine/avatar'
const npc={avatar:withLookDefaults({name:'현재 빵집 주인',look:'f',skin:2,top:5,hairFront:8}),who:'writer' as const}
const infant={avatar:withLookDefaults({name:'실제 아기',look:'m',skin:3,hairFront:2}),who:'writer' as const}
const frames=[0,1].flatMap(beat=>[0,.35,.7,1.2,8].flatMap(t=>[170,180,480,693].flatMap(h=>[null,withLookDefaults({name:'기록자',look:'m',top:3,skin:3})].map(av=>({beat,t,h,av})))))
it.each(frames)('page $beat time $t height $h keeps native adults and the shared baby fully visible',({beat,t,h,av})=>{
 const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-90,y);yy<Math.min(ground+20,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawBakeryDinner(g,320,h,t,av,npc,[infant],beat)
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 person(p,112,ground,av,'right','writer',true)
 person(p,204,ground,npc.avatar,'left','writer',true)
 const baby=newbornArt(infant.avatar,Math.floor(t*2)),bx=161+Math.round(Math.sin(Math.min(t,1.2)*3)*2),by=ground+10-baby.rows.length*2
 baby.rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&baby.palette[c])p(bx+x*2,by+y*2,baby.palette[c],2,2)}))
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
})
