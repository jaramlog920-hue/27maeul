import {CONTENT} from '../content/catalog'
import {newGenState,type GenPerson} from '../engine/gen'
import {BABY_DAY} from '../engine/stories'
import {sharedBackgroundBakerBaby} from './shared-background-family'
import {withLookDefaults} from '../engine/avatar'
import {newbornArt} from './newborn-art'
import {drawSharedRequestRewardForeground} from './shared-request-reward-art'

it('does not create an infant before birth or turn a grown baker child back into a baby',()=>{
 const gen=newGenState(CONTENT,7,1),at=(day:number)=>({gen,clock:{day,minute:900}})
 expect(sharedBackgroundBakerBaby(at(BABY_DAY-1))).toBeNull()
 expect(sharedBackgroundBakerBaby(at(BABY_DAY))).not.toBeNull()
 expect(sharedBackgroundBakerBaby(at(BABY_DAY+14))).toBeNull()
})
it('uses the current successor household infant and preserves its name, skin and inherited hair',()=>{
 const gen=newGenState(CONTENT,7,100),parent={...gen.persons.baker,id:'g-0001',origin:'born' as const,household:'h-new'}
 const child:GenPerson={id:'g-0002',origin:'born',born:99,stage:'baby',look:'m',name:'현재 아기',avatar:{skin:3,hairFront:5},hair:[30,40,25],parents:[parent.id],spouse:null,household:'h-new'}
 gen.persons[parent.id]=parent;gen.persons[child.id]=child
 gen.retired={baker:{heir:parent.id,day:90}}
 gen.households['h-new']={id:'h-new',home:'baker',members:[parent.id],children:[child.id],since:90,lastBirth:99}
 const before=JSON.stringify(gen),baby=sharedBackgroundBakerBaby({gen,clock:{day:100,minute:900}})!
 expect(baby.avatar).toMatchObject({name:'현재 아기',skin:3,hairColor:[30,40,25],look:'m'})
 baby.avatar!.hairColor![0]=180
 baby.avatar!.eyeColor![0]=180
 expect(JSON.stringify(gen)).toBe(before)
 expect(sharedBackgroundBakerBaby({gen,clock:{day:100,minute:900}})?.avatar?.hairColor).toEqual([30,40,25])
 gen.persons[child.id]={...child,stage:'child'}
 expect(sharedBackgroundBakerBaby({gen,clock:{day:100,minute:900}})).toBeNull()
})
it.each([0,1])('keeps the shared native sleeping baby face outside the cradle rails, adult bodies and reward objects at beat %i',beat=>{
 const baby={avatar:withLookDefaults({name:'아기',look:'m',skin:3}),who:'writer' as const},npc={avatar:withLookDefaults({name:'헤이즐',look:'f',skin:1}),who:'writer' as const}
 const expected=newbornArt(baby.avatar,0,true)
 for(const ground of [83,108,374]){
  const pixels=new Map<string,string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as CanvasRenderingContext2D
  drawSharedRequestRewardForeground(g,'done:baker:2',320,ground,.4,beat,null,npc,baby)
  const bx=250+8,by=ground+6-32+8
  expected.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'&&ch!=='w'&&ch!=='W')expect(pixels.get(`${bx+x*2},${by+y*2}`)).toBe(expected.palette[ch])}))
 }
})
