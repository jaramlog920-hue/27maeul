import {REQUESTS} from '../engine/bonds'
import {SCENES} from '../content/text'
import {withLookDefaults} from '../engine/avatar'
import {person} from './milestone-moments-art'
import {SHARED_REQUEST_REWARD_IDS,sharedRequestRewardSpec,sharedRequestRewardProps,drawSharedRequestRewardForeground} from './shared-request-reward-art'

it('covers the whole original request reward set without adding a new unlock or reward',()=>{
 expect(SHARED_REQUEST_REWARD_IDS).toHaveLength(16)
 for(const r of REQUESTS){const spec=sharedRequestRewardSpec(`done:${r.id}`)!;expect(spec.request).toBe(r);expect(spec.original).toEqual(SCENES[`done:${r.id}`].lines)}
})
it.each(SHARED_REQUEST_REWARD_IDS)('%s presents every reward only when the original thank-you line reaches it',id=>{
 const before=JSON.stringify(REQUESTS),spec=sharedRequestRewardSpec(id)!
 expect(sharedRequestRewardProps(id,160,108,8,0)).toEqual([])
 const items=Object.entries(spec.request.reward).flatMap(([item,n])=>Array.from({length:n??0},()=>item))
 expect(sharedRequestRewardProps(id,160,108,8,1).map(a=>a.item)).toEqual(items)
 expect(JSON.stringify(REQUESTS)).toBe(before)
})
it.each(SHARED_REQUEST_REWARD_IDS)('%s keeps every native body and every reward separate across stages, time and aspect ratios',id=>{
 const npc={avatar:withLookDefaults({name:'현재 이웃',look:'f',skin:2,top:5}),who:'writer' as const}
 for(const h of [120,180,693])for(const beat of [0,1,2])for(const t of [0,.35,.8,8])for(const av of [null,withLookDefaults({name:'실제 기록자',look:'m',skin:3,top:6})]){
  const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),body=new Set<string>(),pixels=new Map<string,string>()
  const p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++){body.add(`${xx},${yy}`);pixels.set(`${xx},${yy}`,c)}}
  const props=sharedRequestRewardProps(id,160,ground,t,beat)
  person(p,89,ground,av,'right');person(p,220,ground,npc.avatar,'left','writer',beat>=1&&props.length===1&&t<.65)
  const expected=new Map(pixels)
  const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
  drawSharedRequestRewardForeground(g,id,320,ground,t,beat,av,npc)
  for(const [pos,c] of expected)expect(pixels.get(pos)).toBe(c)
  const occupied=new Set<string>()
  for(const a of props)a.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'&&a.palette[ch])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const pos=`${a.x+x*2+dx},${a.y+y*2+dy}`
   expect(body.has(pos)).toBe(false);expect(occupied.has(pos)).toBe(false);occupied.add(pos)
  }}))
 }
})
