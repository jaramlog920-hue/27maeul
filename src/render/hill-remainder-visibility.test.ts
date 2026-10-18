import {drawHillEvent,hillEventPeople,isHillEvent} from './hill-events-art'
import {HILL_REMAINDER_IDS} from './hill-remainder-art'
import {person} from './milestone-moments-art'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import neighbors from '../content/neighbors.json'
import {CANDIDATE_IDS,WALK_MINUTES,DATE_GAIN} from '../engine/romance'
import '../content/catalog'
import {allSightings} from '../engine/people'
import {SCENES} from '../content/text'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const replacement:FinalePerson={avatar:withLookDefaults({name:'다음 세대',look:'m',top:5,skin:3,hairFront:8}),who:'writer'}
const frames=HILL_REMAINDER_IDS.flatMap(id=>SCENES[id].lines.flatMap((_,beat)=>[0,.4,.7,1.2,8].flatMap(t=>[170,180,480,693].flatMap(h=>[null,withLookDefaults({name:'실제 기록자',look:'f',top:6,skin:2})].flatMap(av=>(id==='date:walk:1'?[...CANDIDATE_IDS.map(actor),replacement]:[actor('tilly'),replacement]).map(npc=>({id,beat,t,h,av,npc})))))))
it('registers the complete two-scene hill remainder and preserves the original sighting and date rules',()=>{
 for(const id of HILL_REMAINDER_IDS){expect(isHillEvent(id)).toBe(true);expect(SCENES[id].choices??[]).toHaveLength(0)}
 expect(hillEventPeople('saw:tilly:flower')).toEqual(['tilly'])
 const event=allSightings().find(s=>s.id==='tilly:flower')!
 expect(event.at).toEqual({x:12,y:32});expect(event.when).toEqual({from:1140,to:1200,weather:['dry'],season:['autumn','summer']})
 expect(event.stage).toBe(3);expect(event.memory).toBe('saw:ironFlower');expect(WALK_MINUTES).toBe(40);expect(DATE_GAIN).toBe(5)
})
it.each(frames)('$id phase $beat time $t height $h keeps every native face, hand, body and foot visible',({id,beat,t,h,av,npc})=>{
 const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6)+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-100,y);yy<Math.min(ground+2,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawHillEvent(g,id,320,h,t,av,npc,[],beat)
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 if(id==='date:walk:1'){
  person(p,140,ground,av,'right');person(p,185,ground,npc.avatar,'left',npc.who,beat===0&&t<.6,false,0,1,npc.short)
 }else{
  const leaving=beat>=3,x=Math.round(185+(leaving?Math.max(0,Math.min(1,(t-.35)/1.4)):0)*35)
  person(p,105,ground,av,'right');person(p,x,ground,npc.avatar,leaving&&t>=.35?'right':'left',npc.who,false,leaving&&t>=.35&&t<1.75,t,1,npc.short)
 }
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
 const metal=[...pixels.values()].includes('#d4d8ca')
 if(id==='saw:tilly:flower')expect(metal).toBe(beat<3||t<.35)
})
