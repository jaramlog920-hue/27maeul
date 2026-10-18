import {CONTENT} from '../content/catalog'
import {newGenState} from '../engine/gen'
import {SCENES} from '../content/text'
import {withLookDefaults} from '../engine/avatar'
import {SHARED_BACKGROUND_DRAFT_IDS} from './shared-background-draft-art'
import {sharedBackgroundSceneSnapshot,drawSharedBackgroundScene} from './shared-background-scene'
import {SHARED_GIFT_SPECS} from './shared-gift-art'
import {sharedRequestRewardSpec,sharedRequestRewardProps} from './shared-request-reward-art'
import {SHARED_RETURN_WALK_IDS,sharedReturnWalkFrame} from './shared-return-walk-art'
import {sharedConversationFrame,type ConversationActorFrame} from './shared-conversation-art'
import {FURNITURE_ART} from './furniture-art'
import {spriteRows,writerPalette,PALETTE} from './sprites'

const state=()=>{
 const gen=newGenState(CONTENT,7,121),id='g-current-baker'
 gen.persons[id]={id,origin:'born',born:30,stage:'adult',look:'f',name:'현재 빵집 이웃',avatar:{skin:3,top:6,bottom:4,hairFront:8},hair:[30,40,25],parents:['baker'],household:null,spouse:null}
 gen.retired={baker:{heir:id,day:90}}
 return {gen,avatar:withLookDefaults({name:'기록자',look:'f',skin:3}),looks:{rudy:withLookDefaults({name:'실제 옷장',look:'m',skin:3,top:6})},player:{x:24,y:18,facing:'down' as const,path:[],walkTime:0},clock:{day:121,minute:900}}
}
it.each(SHARED_BACKGROUND_DRAFT_IDS)('%s keeps actual NPC faces, bodies, short hands and feet unobscured through every original stage',id=>{
 const s=state(),before=JSON.stringify(s)
 for(const preview of [false,true]){
  const scene=sharedBackgroundSceneSnapshot(s,id,{preview})!,npc=scene.people[0]
  if(!npc)continue
  const av=npc.avatar?withLookDefaults(npc.avatar):undefined,palette=npc.who==='writer'?writerPalette(npc.season??'winter',av):PALETTE
  for(const h of [180,693,120])for(let beat=0;beat<SCENES[id].lines.length;beat++)for(const t of [0,.6,8]){
   const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6)
   let frame:ConversationActorFrame
   let growth=npc.growth
   if(SHARED_GIFT_SPECS[id]){
    const material=Object.keys(SHARED_GIFT_SPECS[id].items).every(item=>!FURNITURE_ART[item])
    frame={x:220,facing:'left',pose:!material&&t<.65?'crouch':'stand',walk:false};growth??=1
   }else if(sharedRequestRewardSpec(id)){
    const props=sharedRequestRewardProps(id,160,ground,t,beat)
    frame={x:220,facing:'left',pose:beat>=1&&props.length===1&&t<.65?'crouch':'stand',walk:false};growth??=1
   }else if(SHARED_RETURN_WALK_IDS.includes(id))frame=sharedReturnWalkFrame(320,beat,t).npc
   else frame=sharedConversationFrame(id,320,beat,t)!.npc
   const rows=spriteRows(npc.who,frame.facing,{avatar:av,pose:frame.pose,short:npc.short,growth,elder:npc.elder,season:npc.season,frame:frame.walk?(Math.floor(t*3)%2?1:2):0,blink:false})
   const top=ground-rows.length*2,pixels=new Map<string,string>()
   const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,height:number){
    for(let yy=Math.max(top,y);yy<Math.min(ground,y+height);yy++)for(let xx=Math.max(frame.x,x);xx<Math.min(frame.x+rows[0].length*2,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)
   }} as CanvasRenderingContext2D
   drawSharedBackgroundScene(g,scene,320,h,t,beat)
   const actual:string[]=[],expected:string[]=[]
   rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'&&palette[ch]){expected.push(palette[ch]);actual.push(pixels.get(`${frame.x+x*2},${top+y*2}`)??'missing')}}))
   expect(actual,`${id}/${h}/${beat}/${t}/${preview}`).toEqual(expected)
  }
 }
 expect(JSON.stringify(s)).toBe(before)
})
