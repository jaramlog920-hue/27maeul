import {isWeaverHome} from './weaver-home-art'
import {isWeaverSmall} from './weaver-small-art'
import {isWeaverBlue} from './weaver-blue-art'
import {isWeaverChoice} from './weaver-choice-art'
import {drawWeaverEvent,WEAVER_EVENT_IDS,weaverEventPeople} from './weaver-events-art'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import neighbors from '../content/neighbors.json'
import {SCENES} from '../content/text'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:(n.look??'m') as 'm'|'f',...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=WEAVER_EVENT_IDS.filter(id=>!isWeaverChoice(id)&&!isWeaverBlue(id)&&!isWeaverSmall(id)&&!isWeaverHome(id)).flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,reply)=>({id,choice,beat:SCENES[id].lines.length+reply})))])
it.each(frames.flatMap(frame=>[null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})].flatMap(avatar=>[170,180,480,693].map(h=>({...frame,avatar,h})))))('$id 대사 $beat 선택 $choice 높이 $h: 얼굴·머리·몸통·팔·발 보존',({id,beat,choice,avatar,h})=>{
 const pixels=new Map<string,string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const people=weaverEventPeople(id).map(actor),foot=Math.round(h>320?h*(id.endsWith(':4')?.56:.6):h<=170?h*.69:h*.6)+8,third=id.endsWith(':3'),tea=id.endsWith(':4'),seat=tea&&(beat>=2||choice!=null)
 drawWeaverEvent(g,id,320,h,8,avatar,people[0],people.slice(1),beat,choice)
 const actors=[{x:tea?93:95,av:avatar,who:'writer' as const,face:'right' as const},{x:tea?165:178,av:people[0].avatar,who:people[0].who,face:third?'right' as const:'left' as const},...(people[1]?[{x:tea?210:220,av:people[1].avatar,who:people[1].who,face:'left' as const}]:[])]
 for(const a of actors){
  const full=a.av?withLookDefaults(a.av):undefined
  const rows=spriteRows(a.who,a.face,{frame:0,blink:false,avatar:full,pose:seat?'crouch':'stand'}),pal=a.who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<8;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;expect(pixels.get(`${a.x+x*2},${foot-rows.length*2+y*2}`),`${id} face ${a.x} ${c}`).toBe(pal[c])}
  const torso=rows.flatMap((r,y)=>y<8?[]:[...r].flatMap((c,x)=>c==='.'||['h','k','s','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(torso.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${foot-rows.length*2+y*2}`)===pal[c]).length/torso.length).toBeGreaterThanOrEqual(.8)
 }
})
