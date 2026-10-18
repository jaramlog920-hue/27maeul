import {SHARED_GIFT_IDS,SHARED_GIFT_SPECS,sharedGiftProps,drawSharedGiftForeground} from './shared-gift-art'
import {MILESTONE_GIFTS} from '../engine/stories'
import {SCENES} from '../content/text'
import {person} from './milestone-moments-art'
import {withLookDefaults} from '../engine/avatar'
import {FURNITURE_ART} from './furniture-art'
import {COOKING_PROPS} from './cooking-art'

const npc={avatar:withLookDefaults({name:'현재 세대',look:'f',skin:2,top:5,hairFront:8}),who:'writer' as const}
it.each(SHARED_GIFT_IDS)('%s retains every original gift item, quantity and line',id=>{
 const [,who,level]=id.split(':'),spec=SHARED_GIFT_SPECS[id]
 expect(spec.items).toEqual(MILESTONE_GIFTS[who][Number(level) as 3|6|9])
 expect(spec.original).toEqual(SCENES[id].lines.map(l=>l.text))
 expect(sharedGiftProps(id,160,108,8)).toHaveLength(Object.values(spec.items).reduce((a,b)=>a+b,0))
})
const variants=SHARED_GIFT_IDS.flatMap(id=>[0,.35,.8,8].flatMap(t=>[180,693].flatMap(h=>[null,withLookDefaults({name:'실제 기록자',look:'m',skin:3,top:6})].map(av=>({id,t,h,av})))))
it.each(variants)('$id time $t height $h keeps native bodies and every gift separate',({id,t,h,av})=>{
 const ground=Math.round(h>320?h*.54:h*.6),pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawSharedGiftForeground(g,id,320,ground,t,av,npc)
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 // The explicit stool invitation uses the native seated motion, verified separately.
 if(id!=='gift:carpenter:3')person(p,89,ground,av,'right')
 const material=Object.keys(SHARED_GIFT_SPECS[id].items).every(item=>!FURNITURE_ART[item])
 person(p,220,ground,npc.avatar,'left','writer',!material&&t<.65)
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
 for(const prop of sharedGiftProps(id,160,ground,t))prop.rows.forEach((r,y)=>[...r].forEach((c,x)=>{
  if(c!=='.'&&prop.palette[c])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)expect(expected.has(`${prop.x+x*2+dx},${prop.y+y*2+dy}`),`${id} gift must not intersect either native body`).toBe(false)
 }))
})
it('uses the original empty cooking pot for the apothecary and a plant pot for the child',()=>{
 expect(sharedGiftProps('gift:apothecary:6',160,108,8)[0].rows).toEqual(COOKING_PROPS.potEmpty.rows)
 expect(sharedGiftProps('gift:child:6',160,108,8)[0].rows).toEqual(FURNITURE_ART.pot.rows)
})
it.each(['gift:merchant:9','gift:weaver:6','gift:baker:6'])('%s keeps the gifted rug folded at floor level instead of installing an upright full carpet',id=>{
 const rug=sharedGiftProps(id,160,108,8)[0]
 expect(rug.rows.length*rug.scale).toBeLessThanOrEqual(16)
 expect(rug.y).toBeGreaterThanOrEqual(98)
})
