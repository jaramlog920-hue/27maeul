import {afterAll,afterEach,expect,it,vi} from 'vitest'
import {writeFileSync} from 'node:fs'
import {CONTENT} from '../../../src/content/catalog'
import {newGame,syncHome,type GameState} from '../../../src/engine/game'
import {newChild,childStage} from '../../../src/engine/child'
import {withLookDefaults} from '../../../src/engine/avatar'
import {setActiveMap} from '../../../src/engine/maps'
import {siblingTile,swapKid} from '../../../src/engine/siblings'
import {ownerJob} from '../../../src/engine/kid-work'
import {kidWorkSpot} from '../../../src/engine/newland-life'
import {createRenderer,createTripRenderer} from '../../../src/render/renderer'
import {playerChildAvatar,playerChildSprite} from '../../../src/render/player-child-look'
import {spriteRows} from '../../../src/render/sprites'
import * as furnitureMotion from '../../../src/render/furniture-use-motion'
import type {Build} from '../../../src/engine/newland-build'
type Trace={images:unknown[][];pixels:unknown[][];ctx:CanvasRenderingContext2D}
const observations:unknown[]=[]
afterAll(()=>writeFileSync('qa/comprehensive-audit-20261019-round2/ui/renderer-observations.json',JSON.stringify(observations,null,2)))
function canvasTrace(){
 const traces=new WeakMap<HTMLCanvasElement,Trace>()
 const make=(canvas?:HTMLCanvasElement):Trace=>{
  const images:unknown[][]=[],pixels:unknown[][]=[]
  const target={canvas:canvas??{width:320,height:180},fillStyle:'',imageSmoothingEnabled:false}
  const ctx=new Proxy(target,{get(t,k){if(k==='drawImage')return(...a:unknown[])=>images.push(a);if(k==='fillRect')return(...a:unknown[])=>{if(a.some(n=>typeof n==='number'&&!Number.isFinite(n)))throw Error('nonfinite');pixels.push([t.fillStyle,...a])};if(k==='measureText')return()=>({width:12});if(String(k).startsWith('create'))return()=>({addColorStop(){}});return k in t?Reflect.get(t,k):()=>undefined},set(t,k,v){Reflect.set(t,k,v);return true}}) as unknown as CanvasRenderingContext2D
  return{images,pixels,ctx}
 }
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(function(this:HTMLCanvasElement){if(!traces.has(this))traces.set(this,make(this));return traces.get(this)!.ctx} as never)
 return{make,traces}
}
afterEach(()=>{vi.restoreAllMocks();setActiveMap('village')})
const wardrobeA=withLookDefaults({name:'옷입은아이',look:'f',top:4,bottom:4,hairFront:21,hairBack:20,hairColor:[170,90,25]})
const wardrobeB=withLookDefaults({name:'다른옷',look:'m',top:1,bottom:1,hairFront:0,hairBack:0,hairColor:[10,90,25]})
it('confirms UI-R2-01: trip child sprite ignores both an adult stage and equipped wardrobe',()=>{
 const {make}=canvasTrace(),b=newGame(CONTENT),child={...newChild(1,b.stats,null),born:1,name:'어른아이',look:'girl' as const,job:'scribe' as const,left:false}
 const state={...b,child,clock:{day:100,minute:600},looks:{child:wardrobeA}}
 expect(childStage(child,100)).toBe('adult');expect(playerChildSprite('adult',true).who).toBe('writer')
 const me={x:5,y:5,facing:'down' as const,walking:false},kid={x:5,y:8,facing:'down' as const,walking:false}
 const a=make(),r=createTripRenderer(a.ctx);r.draw('harbor',state,me,kid,8,0)
 const drawnA=a.images.at(-1)![0] as HTMLCanvasElement
 a.images.length=0;r.draw('harbor',{...state,looks:{child:wardrobeB}},me,kid,8,0)
 const drawnB=a.images.at(-1)![0] as HTMLCanvasElement
 expect(drawnA).toBe(drawnB)
 const adultA=spriteRows('writer','down',{avatar:playerChildAvatar(state),frame:0}),adultB=spriteRows('writer','down',{avatar:playerChildAvatar({...state,looks:{child:wardrobeB}}),frame:0})
 expect(adultA).not.toEqual(adultB);expect(drawnA.height).toBeLessThan(adultA.length)
 observations.push({finding:'UI-R2-01',stage:'adult',drawnHeight:drawnA.height,adultHeight:adultA.length,changingWardrobeReusesSameCanvas:true})
})
it('confirms UI-R2-02: deselecting a dressed child stores wardrobe but village siblings ignore it and still draw departed adults',()=>{
 const {make}=canvasTrace(),b=newGame(CONTENT),older={...newChild(1,b.stats,null),born:1,name:'큰아이',look:'girl' as const,job:'scribe' as const,left:false},younger={...newChild(2,b.stats,null),born:2,name:'둘째',look:'boy' as const,left:false}
 const s=swapKid({...b,clock:{day:100,minute:600},child:older,siblings:[younger],looks:{child:wardrobeA}},0)
 expect(s.siblings![0].wardrobe).toMatchObject(wardrobeA)
 setActiveMap('village');syncHome(s)
 const draw=(g:GameState)=>{const out=make();createRenderer(out.ctx,CONTENT).draw(g,8,0);const at=siblingTile(g,g.siblings![0],0),x=Math.round(at.x*16+(16-10)/2);const image=out.images.find(a=>(a[0] as HTMLCanvasElement).width===10&&a[1]===x&&typeof a[2]==='number'&&Math.abs((a[2] as number)-(at.y*16))<24);expect(image,JSON.stringify({at,x})).toBeDefined();return image![0] as HTMLCanvasElement}
 const a=draw(s),changed={...s,siblings:[{...s.siblings![0],wardrobe:wardrobeB}]},c=draw(changed)
 expect(a).toBe(c)
 const departed=draw({...s,siblings:[{...s.siblings![0],left:true}]});expect(departed).toBe(a)
 observations.push({finding:'UI-R2-02',storedWardrobe:true,stage:childStage(s.siblings![0],100),changingWardrobeReusesSameCanvas:true,departedStillDrawn:true,at:siblingTile(s,s.siblings![0],0)})
})
it('confirms UI-R2-03: only the first workplace renders a worker using the selected child rather than its owner',()=>{
 const {make}=canvasTrace(),b=newGame(CONTENT),child={...newChild(1,b.stats,null),born:1,name:'선택아이',job:'woodworker' as const,left:false},sib={...newChild(2,b.stats,null),born:2,name:'요리사형제',job:'cook' as const,left:false}
 const build=(id:string,x:number,owner:string,slot:number):Build=>({id,x,y:14,owner,kind:'kidWork',facing:'down',state:'done',orderedDay:1,paid:{coins:0,items:{}},refunded:false,slot})
 const first=build('b1',4,'me:2',0),second=build('b2',12,'me:1',1)
 const s={...b,map:'newland' as const,child,siblings:[sib],clock:{day:100,minute:600},flags:{...b.flags,growthLegacy:1,newlandGift:1,newlandRevealed:1},newland:{builds:[first,second],tiles:{},nextId:3,settledDay:100}}
 expect(ownerJob(s,first.owner)).toBe('cook');expect(ownerJob(s,second.owner)).toBe('woodworker')
 const spy=vi.spyOn(furnitureMotion,'furnitureUseFrame');setActiveMap('newland');syncHome(s)
 const g=make();createRenderer(g.ctx,CONTENT).draw(s,8,0)
 const crafts=spy.mock.calls.filter(a=>a[0]==='writer'&&a[2]==='craft'&&a[4]?.avatar?.name===child.name)
 expect(crafts).toHaveLength(1)
 const motion=g.images.filter(a=>(a[0] as HTMLCanvasElement).width===24&&(a[0] as HTMLCanvasElement).height===24),spot1=kidWorkSpot(first)!,spot2=kidWorkSpot(second)!
 expect(motion.some(a=>Math.abs((a[1] as number)-spot1.x*16)<24)).toBe(true)
 expect(motion.some(a=>Math.abs((a[1] as number)-spot2.x*16)<12)).toBe(false)
 observations.push({finding:'UI-R2-03',firstOwner:first.owner,firstOwnerJob:'cook',actualWorker:child.name,actualJob:'craft',workplaces:2,selectedChildWorkerCalls:crafts.length,spots:[spot1,spot2]})
})
