import {HERB_EVENT_IDS,herbEventPeople,drawHerbEvent} from './herb-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=HERB_EVENT_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].map(h=>({...v,av,h})))))('$id beat $beat choice $choice height $h: faces and bodies remain visible',({id,beat,choice,av,h})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-45,y);yy<Math.min(ground+1,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(300,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=herbEventPeople(id).map(actor);drawHerbEvent(g,id,320,h,8,av,cast[0],cast.slice(1),beat,choice)
 const sniff=id==='ev:basil:sort'&&choice===1&&beat>=3,indoor=id.endsWith('dayOffTea'),seated=id==='ev:basil:story:1'||indoor
 type A={x:number;a:FinalePerson|null;face:'right'|'left';sit:boolean}
 const actors:A[]=[{x:sniff?133:105,a:null,face:'right',sit:sniff||indoor&&choice===0},{x:185,a:cast[0],face:'left',sit:sniff||seated}]
 if(cast[1]&&(id!=='ev:basil:sort'||sniff))actors.push({x:245,a:cast[1],face:'left',sit:false})
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:0,blink:false,avatar:full,pose:a.sit?'crouch':'stand',growth:1}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${ground-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
 }
})

it.each([undefined,0,1])('the tea-window plant has six separate leaves, choice %s',choice=>{
 const leaves=new Set<string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){if(this.fillStyle!=='#8ea76e'||x<75||x>93||y<48||y>66)return;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)leaves.add(`${xx},${yy}`)}} as unknown as CanvasRenderingContext2D
 const cast=herbEventPeople('ev:apothecary:small:dayOffTea').map(actor);drawHerbEvent(g,'ev:apothecary:small:dayOffTea',320,180,8,null,cast[0],cast.slice(1),2,choice)
 let clusters=0;while(leaves.size){clusters++;const stack=[leaves.values().next().value!];while(stack.length){const key=stack.pop()!;if(!leaves.delete(key))continue;const [x,y]=key.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(leaves.has(`${x+dx},${y+dy}`))stack.push(`${x+dx},${y+dy}`)}}expect(clusters).toBe(6)
})
