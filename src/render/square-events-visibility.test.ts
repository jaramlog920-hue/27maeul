import {SQUARE_EVENT_IDS,squareEventPeople,drawSquareEvent,isSquareFamilyKid,type SquareChild} from './square-events-art'
import {isSquareRemainder} from './square-remainder-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=SQUARE_EVENT_IDS.filter(id=>!isSquareRemainder(id)).flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].flatMap(h=>(isSquareFamilyKid(v.id)||v.id.startsWith('ev:romance:postman:')||v.id==='ev:juniper:love:2'||v.id==='ev:juniper:book'?[0,.5,8]:[8]).flatMap(t=>(isSquareFamilyKid(v.id)?[0,1,2]:[0]).map(kid=>({...v,av,h,t,kid})))))))('$id beat $beat choice $choice height $h t=$t: native faces, bodies and feet',({id,beat,choice,av,h,t,kid})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-47,y);yy<Math.min(ground+1,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(305,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const ids=squareEventPeople(id),cast=ids.map(actor),family=isSquareFamilyKid(id),npc:SquareChild=family?{avatar:withLookDefaults({name:'아이',look:kid===1?'m':'f',skin:3,top:kid===2?7:0}),who:kid?'writer':'child',short:kid===1?0:1}:cast[0]??{avatar:null,who:'writer'}
 drawSquareEvent(g,id,320,h,t,av,npc,cast.slice(1),beat,choice)
 const tea=id==='ev:merchant:story:4',lunch=id==='ev:rudy:lunch',dance=id==='ev:juniper:love:2',bookDance=id==='ev:juniper:book'&&choice===0&&beat>=3,dx=(dance||bookDance)&&(choice===0||choice===1)?Math.floor(t*2)%2*2:0,psit=tea&&choice===0||lunch||id==='ev:merchant:love:2'&&choice===0||dance&&choice===1,sit=tea&&choice===0||lunch
 type A={x:number;a:FinalePerson|null;face:'right'|'left';sit?:boolean;walk?:boolean;raised?:boolean}
 const actors:A[]=[{x:105+(dance&&choice===0?dx:0),a:null,face:'right',sit:psit,walk:dance&&choice===0||id.endsWith('ownMessage')&&choice===1&&beat>=2,raised:id==='ev:marigold:bossy'&&choice===0}]
 if(id!=='growth:stall:full')actors.push({x:family?id==='fam:errand'&&beat>=1?152:127:185+dx+(id.endsWith('noParcel')&&beat===0?Math.round(18*(1-Math.min(1,t/1.2))):0),a:npc,face:family||id.endsWith('ownMessage')&&choice===1&&beat>=2?'right':'left',sit:family?false:sit,walk:family?id!=='fam:market'&&beat===0:(dance||bookDance)&&(choice===0||choice===1)||id.endsWith('ownMessage')&&choice===1&&beat>=2||id.endsWith('noParcel')&&beat===0&&t<1.2})
 if(family)actors[0].walk=id!=='fam:market'&&beat===0
 cast.slice(1).forEach((a,i)=>{if(id==='ev:tilly:market'&&choice==null)return;const crowd=id==='ev:marigold:bossy'&&beat>=2;actors.push({x:family?185+i*34:crowd?42+i*26:235+i*29,a,face:'left',walk:crowd})})
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:a.walk?Math.floor(t*3)%2?1:2:0,blink:false,avatar:full,pose:a.raised?'handUp':a.sit?'crouch':'stand',growth:1,short:a.a?.short}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${ground-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
  for(let y=rows.length-1;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(c!=='.'&&pal[c])expect(pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`),`${id} feet ${a.x}`).toBe(pal[c])}
 }
})
