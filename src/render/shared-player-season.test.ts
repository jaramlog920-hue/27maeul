import {withLookDefaults} from '../engine/avatar'
import {SHARED_BACKGROUND_DRAFT_IDS,drawSharedBackgroundDraft} from './shared-background-draft-art'
import {SHARED_GIFT_IDS} from './shared-gift-art'
import {SHARED_REQUEST_REWARD_IDS} from './shared-request-reward-art'
import {SHARED_RETURN_WALK_IDS,sharedReturnWalkFrame} from './shared-return-walk-art'
import {sharedConversationFrame,type ConversationActorFrame} from './shared-conversation-art'
import {firstChapterLayoutFrame} from './first-chapter-layout'
import {firstChapterViewContext} from './first-chapter-view'
import {storyLocationContext} from './story-location-context'
import {spriteRows,writerPalette} from './sprites'
import {SCENES} from '../content/text'
import {seasonOf,SEASON_DAYS} from '../engine/clock'
import {sharedGiftPlayerArt} from './shared-gift-player'

it.each(SHARED_BACKGROUND_DRAFT_IDS)('%s preserves the native player in all seasons, original phases and viewports',id=>{
 const npc={avatar:withLookDefaults({name:'이웃',look:'m'}),who:'writer' as const}
 for(let seasonIndex=0;seasonIndex<4;seasonIndex++){
 const day=1+seasonIndex*SEASON_DAYS,season=seasonOf(day)
 const c=storyLocationContext({player:{x:20,y:112,facing:'down',path:[],walkTime:0},clock:{day,minute:900},room:[]}),before=JSON.stringify(c)
 for(const avatar of [null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})])for(const h of [180,693,120])for(let beat=0;beat<SCENES[id].lines.length;beat++)for(const t of [0,.6,8]){
  const ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6)
  let f:ConversationActorFrame={x:89,facing:'right',pose:'stand',walk:false},foot=ground
  if(id==='firstChapter'){const chapter=firstChapterLayoutFrame(firstChapterViewContext(c,320,h,ground,avatar),320,ground,t,avatar,h);f={...chapter,pose:'stand'};foot=chapter.ground}
  else if(id==='blanket')f={x:150,facing:'down',pose:'stand',walk:false}
  else if(id==='newlandGift')f={x:112,facing:beat===1?'up':'right',pose:'stand',walk:false}
  else if(SHARED_RETURN_WALK_IDS.includes(id))f=sharedReturnWalkFrame(320,beat,t).player
  else if(!SHARED_GIFT_IDS.includes(id)&&!SHARED_REQUEST_REWARD_IDS.includes(id))f=sharedConversationFrame(id,320,beat,t)!.player
  const av=avatar?withLookDefaults(avatar):undefined,giftPlayer=id==='gift:carpenter:3'?sharedGiftPlayerArt(id,160,ground,t,avatar,season):null
  const rows=giftPlayer?.rows??spriteRows('writer',f.facing,{avatar:av,pose:f.pose,season,frame:f.walk?(Math.floor(t*3)%2?1:2):0,blink:false}),palette=writerPalette(season,av)
  const top=giftPlayer?.y??foot-rows.length*2,pixels=new Map<string,string>()
  if(giftPlayer){f.x=giftPlayer.x;foot=top+rows.length*2}
  const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,height:number){
   for(let yy=Math.max(top,y);yy<Math.min(foot,y+height);yy++)for(let xx=Math.max(f.x,x);xx<Math.min(f.x+rows[0].length*2,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)
  }} as CanvasRenderingContext2D
  drawSharedBackgroundDraft(g,id,320,h,t,avatar,npc,beat,c)
  const expected:string[]=[],actual:string[]=[]
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>{
   if(ch==='.'||!palette[ch])return
   if(id==='blanket'&&y>=rows.length-9&&y<rows.length-4&&x>=3&&x<=6&&!'.ks!5'.includes(ch))return
   expected.push(palette[ch]);actual.push(pixels.get(`${f.x+x*2},${top+y*2}`)??'missing')
  }))
  expect(actual,`${id}/${season}/${beat}/${h}/${t}`).toEqual(expected)
 }
 expect(JSON.stringify(c)).toBe(before)
 }
 expect(npc).not.toHaveProperty('season')
})
