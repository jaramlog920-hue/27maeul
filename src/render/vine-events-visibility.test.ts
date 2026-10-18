import {VINE_EVENT_IDS,vineEventPeople,drawVineEvent} from './vine-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=VINE_EVENT_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].map(h=>({...v,av,h})))))('$id beat $beat choice $choice height $h: faces and bodies remain visible',({id,beat,choice,av,h})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-45,y);yy<Math.min(ground+1,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(300,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=vineEventPeople(id).map(actor);drawVineEvent(g,id,320,h,8,av,cast[0],cast.slice(1),beat,choice)
 const rain=id==='ev:marigold:rainTea'||id.endsWith('costSheet'),room=rain||id.endsWith('oldTools')||id==='dinner:grandpa',night=id==='saw:marigold:ledger',stairs=night||id==='ev:marigold:ledgerTalk'||id==='ev:marigold:ledgerNew'||id==='ev:marigold:grandpaIll'&&choice===1,prune=id==='ev:marigold:prune',rest=id==='ev:marigold:story:3'&&choice===1&&beat>=4
 const grandpaMain=id.startsWith('ev:grandpa:')||id==='dinner:grandpa',sit=grandpaMain&&!id.endsWith('oldTools')||night||id==='ev:marigold:ledgerTalk'&&choice===1||id==='ev:marigold:tooMuch'&&choice===0&&beat>=3||id==='ev:marigold:story:3'||rain||stairs&&id==='ev:marigold:grandpaIll'
 const psit=room||id==='ev:marigold:ledgerTalk'&&choice===1||id==='ev:grandpa:story:4'&&choice===0||rest,illGone=id==='ev:marigold:grandpaIll'&&choice===1,close=id==='ev:marigold:grandpaIll'||id==='ev:marigold:juice'&&choice===0&&beat>=2||id==='ev:marigold:rainTea'&&choice===1
 const ox=160+(close?47:85),showOther=!!cast[1]&&!illGone&&(!prune||choice===0&&beat>=2),os=(id!=='ev:grandpa:story:3'&&id!=='ev:marigold:grandpaIll'&&id!=='ev:marigold:prune'&&id!=='ev:marigold:juice'),sleep=id==='ev:marigold:tooMuch'&&choice===0&&beat>=3
 type A={x:number;a:FinalePerson|null;face:'right'|'left'|'down';sit:boolean;stroke?:boolean;walk?:boolean;blink?:boolean}
 const actors:A[]=[{x:105,a:null,face:'right',sit:psit},{x:185,a:cast[0],face:'left',sit,blink:sleep,walk:id==='ev:marigold:run'&&(beat===0||choice===1&&beat>=4)||id==='ev:marigold:ledgerNew'&&choice===0&&beat>=3}]
 const stroke=id==='ev:marigold:juice'&&choice===0&&beat>=2||id==='ev:marigold:rainTea'&&choice===1&&beat>=3
 if(showOther)actors.push({x:ox,a:cast[1],face:stroke?'down':'left',sit:os,stroke})
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:a.walk?2:0,blink:a.blink??false,avatar:full,pose:a.sit?'crouch':'stand',growth:1}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  if(a.stroke){const raised=spriteRows(who,'down',{frame:0,blink:false,avatar:full,pose:'handUp',growth:1});for(let yy=0;yy<rows.length;yy++)rows[yy]=[...rows[yy]].map((c,xx)=>xx<2&&yy<raised.length?raised[yy][xx]:c).join('')}
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${ground-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  if(id==='ev:marigold:rainTea'&&a.a===cast[1])for(let y=rows.length-1;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(c!=='.'&&pal[c])expect(pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7||id==='ev:marigold:rainTea'&&a.a===cast[1]&&y>=rows.length-3?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
 }
})


