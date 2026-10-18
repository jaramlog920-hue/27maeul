import {drawSmithEvent,isSmithEvent,smithEventPeople} from './smith-events-art'
import {hasAuthoredStory} from './authored-story-art'
import {person} from './milestone-moments-art'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import '../content/catalog'
import {allSightings} from '../engine/people'
import {SCENES} from '../content/text'

const looks=[null,withLookDefaults({name:'실제 기록자',look:'f',skin:3,top:6})]
const neighbors=[{avatar:null,who:'smith'}, {avatar:withLookDefaults({name:'다음 세대 이웃',look:'f',skin:2,top:4,hairFront:8}),who:'writer'}] as FinalePerson[]
it('registers the complete remaining forge group without changing its original runtime trigger or narration',()=>{
 expect(isSmithEvent('saw:forge:handle')).toBe(true);expect(hasAuthoredStory('saw:forge:handle')).toBe(true)
 expect(smithEventPeople('saw:forge:handle')).toEqual(['smith'])
 const event=allSightings().find(s=>s.id==='forge:handle')!
 expect(event.at).toEqual({x:6,y:125});expect(event.when).toEqual({from:300,to:390})
 expect(SCENES['saw:forge:handle'].lines).toHaveLength(3)
 expect(SCENES['saw:forge:handle'].choices??[]).toHaveLength(0)
})
const frames=[170,180,480,693].flatMap(h=>[0,1,2].flatMap(beat=>[0,.45,1.1,1.8,8].flatMap(t=>looks.flatMap(av=>neighbors.map(npc=>({h,beat,t,av,npc}))))))
it.each(frames)('preserves whole native actors, feet and the separate window handle at $h / $beat / $t',({h,beat,t,av,npc})=>{
 const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6)+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=Math.max(ground-100,y);yy<Math.min(ground+2,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(320,x+a);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawSmithEvent(g,'saw:forge:handle',320,h,t,av,npc,[],beat)
 const expected=new Map<string,string>(),p=(x:number,y:number,c:string,a=1,b=1)=>{for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)expected.set(`${xx},${yy}`,c)}
 if(beat<2)person(p,beat===0?120:170,ground,npc.avatar,'left',npc.who,beat===0,false,0,1,npc.short)
 else{
  person(p,48,ground,av,'right')
  person(p,Math.round(218-Math.max(0,Math.min(1,(t-.45)/1.3))*40),ground,npc.avatar,'left',npc.who,false,t>.45&&t<1.75,t,1,npc.short)
 }
 expect(expected.size).toBeGreaterThan(80)
 for(const [position,color] of expected)expect(pixels.get(position),position).toBe(color)
 if(beat<2){expect(pixels.get(`113,${ground-2}`)).toBe('#dec49a');expect(pixels.get(`114,${ground-18}`)).toBe('#8b714c')}
})
