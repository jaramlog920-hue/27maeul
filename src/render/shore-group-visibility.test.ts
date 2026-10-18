import {SHORE_EVENT_IDS,shoreEventPeople,drawShoreEvent} from './shore-events-art'
import {SHORE_FISHER_IDS} from './shore-fisher-art'
import {SHORE_BOAT_IDS} from './shore-boat-art'
import {SHORE_PERSONAL_IDS} from './shore-personal-art'
import {SHORE_LETTER_IDS} from './shore-letter-art'
import {SHORE_QUIET_IDS} from './shore-quiet-art'
import {SHORE_STONES_IDS} from './shore-stones-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const inList=(ids:readonly string[],id:string)=>ids.includes(id)
const frames=SHORE_EVENT_IDS.filter(id=>!['ev:cosmo:story:3','ev:cosmo:home:2'].includes(id)).flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,reply)=>({id,choice,beat:SCENES[id].lines.length+reply})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})].flatMap(av=>[170,180,480,693].map(h=>({...v,av,h})))))('$id 대사 $beat 선택 $choice 높이 $h: 실제 얼굴·머리·몸통·짧은 팔·발',({id,beat,choice,av,h})=>{
 const pixels=new Map<string,string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const people=shoreEventPeople(id).map(actor),f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,selected=choice!=null
 drawShoreEvent(g,id,320,h,8,av,people[0],beat,choice,people.slice(1))
 type A={x:number;a:FinalePerson|null;face:'right'|'left';seat:boolean;walk?:boolean}
 let layout:A[]=[{x:75,a:null,face:'right',seat:false},{x:215,a:people[0],face:'left',seat:false}]
 if(id==='saw:boat:argue')layout=[{x:44,a:null,face:'right',seat:false},{x:beat>=3?136:112,a:people[1],face:'right',seat:false},{x:218,a:people[0],face:'left',seat:false}]
 if(inList(SHORE_FISHER_IDS,id)){
  const pair=people.length>1,tea=id.endsWith('duskTea'),px=selected&&choice===0&&id.endsWith(':2')?128:pair?45:75
  layout=[{x:px,a:null,face:'right',seat:tea&&selected&&choice===0},{x:id.endsWith(':2')&&beat>=2?150:pair?78:215,a:people[0],face:pair?'right':'left',seat:tea}];if(pair)layout.push({x:id.endsWith(':2')?204:235,a:people[1],face:'left',seat:false})
 }else if(inList(SHORE_BOAT_IDS,id)){
  if(id==='actsShip')layout=[{x:25,a:null,face:'right',seat:false},{x:65,a:people[0],face:'right',seat:false},...people.slice(1).map((a,i)=>({x:105+i*40,a,face:'right' as const,seat:false}))]
  if(id==='saw:boat:launch')layout=[{x:48,a:null,face:'right',seat:false},{x:164,a:people[0],face:'left',seat:true},{x:beat>=2?134:198,a:people[1],face:'left',seat:beat>=2}]
  if(id==='ev:cosmo:rowTogether'){const d=choice===0?Math.round(Math.sin(8)*3):0;layout=[{x:133+d,a:null,face:'right',seat:true},{x:164+d,a:people[0],face:'left',seat:true}]}
  if(id==='ev:cosmo:story:2')layout=[{x:selected&&choice===0&&beat>=5?118:45,a:null,face:'right',seat:false},{x:204,a:people[0],face:'left',seat:false},{x:78,a:people[1],face:'right',seat:false}]
  if(id==='ev:cosmo:boat')layout.forEach(a=>a.seat=choice===1)
 }else if(inList(SHORE_PERSONAL_IDS,id)){
  if(id==='saw:cosmo:froze'&&beat===1)layout[1].x=213
  if(id==='ev:cosmo:story:1'){layout[0].seat=choice===0;layout[1].seat=beat>=2||selected}
  if(id==='ev:cosmo:home:1'&&choice===1)layout.forEach(a=>a.walk=true)
  if(id==='ev:cosmo:weather'&&choice===1)layout.push({x:252,a:people[1],face:'left',seat:false})
 }else if(inList(SHORE_LETTER_IDS,id)){
  const travel=id==='ev:wendell:trip',leave=travel&&choice===1&&beat>=4||id==='saw:wendell:letter'&&beat>=3||id==='saw:poppy:letter'&&beat>=2
  layout[1].x=leave?237:215;layout[1].face=leave?'right':'left';layout[1].walk=leave;layout[1].seat=id==='saw:poppy:letter'&&beat<2
 }else if(inList(SHORE_QUIET_IDS,id)){const sit=id.includes('freeAfternoon');layout[0].seat=sit&&choice===0;layout[1].seat=sit;if(id.includes(':walk')&&choice===0)layout.forEach(a=>a.walk=true)}
 else if(inList(SHORE_STONES_IDS,id)){layout[0].seat=id==='ev:tilly:quarrel'&&choice===2;layout[1].seat=id==='ev:tilly:quarrel'&&choice!==1}
 for(const a of layout){
  const full=(a.a?a.a.avatar:av)?withLookDefaults((a.a?a.a.avatar:av)!):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:a.walk?2:0,blink:false,avatar:full,pose:a.seat?'crouch':'stand',growth:1}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<Math.min(7,rows.length);y++)for(let x=0;x<rows[y].length;x++){
   const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue
   for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${ground-rows.length*2+y*2+yy}`),`${id} ${a.x} 얼굴 ${c}`).toBe(pal[c])
  }
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} ${a.x} 몸통`).toBeGreaterThanOrEqual(.8)
 }
})
