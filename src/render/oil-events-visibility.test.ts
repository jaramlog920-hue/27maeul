import {OIL_EVENT_IDS,oilEventPeople,drawOilEvent} from './oil-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=OIL_EVENT_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].map(h=>({...v,av,h})))))('$id beat $beat choice $choice height $h: faces and bodies remain visible',({id,beat,choice,av,h})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-45,y);yy<Math.min(ground+1,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(300,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=oilEventPeople(id).map(actor);drawOilEvent(g,id,320,h,8,av,cast[0],cast.slice(1),beat,choice)
 const tea=id.endsWith('lateTea'),shade=id==='ev:presser:story:4'||id.includes('extraMinutes'),sit=id.endsWith('untimedTea')||id.endsWith('imperfectHouse')||tea||id.includes('extraMinutes')||id==='ev:presser:love:2'&&beat>=1&&choice!==0,psit=id.endsWith('untimedTea')||id.endsWith('imperfectHouse')||tea&&choice===0||shade&&choice===0||id.includes('extraMinutes')||id==='ev:presser:love:2'&&beat>=1&&choice!==0
 type A={x:number;a:FinalePerson|null;face:'right'|'left';sit:boolean}
 const actors:A[]=[{x:id==='ev:presser:story:4'&&choice===0?172:132,a:null,face:'right',sit:psit},{x:195,a:cast[0],face:'left',sit:sit||id==='ev:presser:story:4'&&beat===0}]
 if(cast[1])actors.push({x:id==='ev:presser:story:4'&&choice===1?172:260,a:cast[1],face:'left',sit:tea||shade&&choice===1})
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:0,blink:false,avatar:full,pose:a.sit?'crouch':'stand',growth:1}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${ground-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
 }
})


