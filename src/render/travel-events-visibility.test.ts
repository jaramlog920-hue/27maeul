import {TRAVEL_EVENT_IDS,travelEventPeople,drawTravelEvent,travelSister} from './travel-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
import {harborBaker} from './harbor-trip-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=TRAVEL_EVENT_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].flatMap(h=>[0,.7,1.4,8].map(t=>({...v,av,h,t}))))))('$id beat $beat choice $choice height $h t=$t: native faces, bodies and feet',({id,beat,av,h,t})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-100,y);yy<Math.min(ground+1,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(305,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=travelEventPeople(id).map(actor),npc=cast[0]??{avatar:null,who:'writer' as const}
 drawTravelEvent(g,id,320,h,t,av,npc,cast.slice(1),beat)
 type A={x:number;a:FinalePerson|null;face:'right'|'left';sit?:boolean;walk?:boolean;raised?:boolean;ground?:number;growth?:number}
 const sx=Math.round(217+((beat>=2?140:185)-217)*Math.min(1,t/1.4)),harbor=id==='trip:harbor',actors:A[]=[{x:harbor&&beat>=3?Math.round(105+20*Math.min(1,t/1.4)):105,a:null,face:'right',walk:harbor&&beat>=3&&t<1.4},...(harbor&&beat>=1?[{x:185,a:{avatar:harborBaker,who:'writer' as const},face:'left' as const}]:[]),...(id==='trip:hillTown'&&beat>=1?[{x:sx,a:{avatar:travelSister(npc),who:'writer' as const,short:1},face:'left' as const,walk:t<1.4,growth:.75}]:[])]
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:a.walk?Math.floor(t*3)%2?1:2:0,blink:false,avatar:full,pose:a.raised?'handUp':a.sit?'crouch':'stand',growth:a.growth??1,short:a.a?.short}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${(a.ground??ground)-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${(a.ground??ground)-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
  for(let y=rows.length-1;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(c!=='.'&&pal[c])expect(pixels.get(`${a.x+x*2},${(a.ground??ground)-rows.length*2+y*2}`),`${id} feet ${a.x}`).toBe(pal[c])}
 }
})
