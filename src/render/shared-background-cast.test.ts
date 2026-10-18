import {CONTENT} from '../content/catalog'
import {newGenState} from '../engine/gen'
import {genAvatar} from '../engine/gen-looks'
import {withLookDefaults} from '../engine/avatar'
import {sharedBackgroundActor,sharedBackgroundCast} from './shared-background-cast'
import {SHARED_BACKGROUND_DRAFT_IDS,sharedBackgroundDraftPeople} from './shared-background-draft-art'
import {drawConversationActor} from './shared-conversation-art'
import {spriteRows,writerPalette,PALETTE} from './sprites'

const state=(day=1)=>({gen:newGenState(CONTENT,7,day),clock:{day,minute:900},looks:{}})
it('resolves the original cast of every one of the 118 events without invented fallback actors or state writes',()=>{
 const s=state(100),before=JSON.stringify(s)
 for(const id of SHARED_BACKGROUND_DRAFT_IDS){
  const c=sharedBackgroundCast(s,id)!
  expect(c.people.map(p=>p?.role)).toEqual(sharedBackgroundDraftPeople(id))
  expect(c.people.every(Boolean)).toBe(true)
  if(id!=='done:baker:2')expect(c.baby).toBeNull()
 }
 expect(sharedBackgroundCast(s,'unknown')).toBeNull()
 expect(sharedBackgroundActor(s,'unknown')).toBeNull()
 expect(JSON.stringify(s)).toBe(before)
})
it('uses the actual successor name, inherited skin/hair and own clothes rather than the retired role outfit',()=>{
 const s=state(100),id='g-0001'
 s.gen.persons[id]={id,origin:'born',born:30,stage:'adult',look:'f',name:'이어받은 이웃',avatar:{skin:3,top:6,bottom:4,hairFront:8},hair:[30,40,25],parents:['baker'],household:null,spouse:null}
 s.gen.retired={baker:{heir:id,day:90}}
 const a=sharedBackgroundActor(s,'baker')!
 expect(a.id).toBe(id);expect(a.who).toBe('writer');expect(a.elder).toBe(false)
 expect(a.avatar).toEqual(genAvatar(s.gen.persons[id]))
 expect(a.avatar).toMatchObject({name:'이어받은 이웃',skin:3,top:6,bottom:4,hairColor:[30,40,25]})
 const before=JSON.stringify(s)
 a.avatar!.hairColor![0]=180
 expect(JSON.stringify(s)).toBe(before)
 expect(sharedBackgroundActor(s,'baker')?.avatar?.hairColor).toEqual([30,40,25])
})
it('detaches every wardrobe color tuple without changing the selected appearance',()=>{
 const wardrobe=withLookDefaults({name:'옷장 모습',look:'m',skin:3,accColor:[10,20,30]}),s={...state(),looks:{wendell:wardrobe}},before=JSON.stringify(s)
 const avatar=sharedBackgroundActor(s,'wendell')!.avatar!
 expect(avatar).toEqual(wardrobe)
 for(const key of ['eyeColor','hairColor','bottomColor','accColor'] as const){
  expect(avatar[key]).not.toBe(wardrobe[key])
  avatar[key]![0]=180
 }
 expect(JSON.stringify(s)).toBe(before)
})
it('keeps native elders, original child growth and actual fixed-neighbor wardrobe priority',()=>{
 expect(sharedBackgroundActor(state(),'grandpa')?.elder).toBe(true)
 expect(sharedBackgroundActor(state(),'child')?.growth).toBe(0)
 expect(sharedBackgroundActor(state(22),'child')?.growth).toBe(3)
 const s={...state(),looks:{wendell:withLookDefaults({name:'옷장 모습',look:'m',skin:3,top:7})}}
 expect(sharedBackgroundActor(s,'wendell')?.avatar).toMatchObject({skin:3,top:7})
 expect(sharedBackgroundActor(state(121),'smith')?.season).toBe('winter')
})
it.each(['grandpa','child','smith','wendell'])('draws the original %s head, hands and feet with elder/growth/winter metadata intact',role=>{
 const actor=sharedBackgroundActor(state(121),role)!,av=actor.avatar?withLookDefaults(actor.avatar):undefined
 const rows=spriteRows(actor.who,'left',{avatar:av,elder:actor.elder,growth:actor.growth,season:actor.season,pose:'stand',frame:0,blink:false})
 const palette=actor.who==='writer'?writerPalette(actor.season!,av):PALETTE,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
 drawConversationActor(g,actor,{x:100,facing:'left',pose:'stand',walk:false},108,0)
 rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'&&palette[ch])expect(pixels.get(`${100+x*2},${108-rows.length*2+y*2}`)).toBe(palette[ch])}))
})
