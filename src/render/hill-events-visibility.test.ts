import {HILL_REMAINDER_IDS} from './hill-remainder-art'
import {HILL_EVENT_IDS,hillEventPeople,drawHillEvent,isHillDate} from './hill-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=HILL_EVENT_IDS.filter(id=>!(HILL_REMAINDER_IDS as readonly string[]).includes(id)).flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].flatMap(h=>[0,.5,8].flatMap(t=>(v.id==='fam:picnic'?[0,1,2]:[0]).map(kid=>({...v,av,h,t,kid})))))))('$id beat $beat choice $choice height $h t=$t: native faces, bodies and feet',({id,beat,choice,av,h,t,kid})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-100,y);yy<Math.min(ground+20,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(305,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=hillEventPeople(id).map(actor),npc=id==='fam:picnic'&&kid?{avatar:withLookDefaults({name:'누리',look:'m',skin:3,top:7}),who:'writer' as const,short:kid===1?1:0}:cast[0]
 drawHillEvent(g,id,320,h,t,av,npc,cast.slice(1),beat,choice)
 const tree=id.includes('basil'),clouds=id==='ev:dexter:clouds',group=id==='ev:dexter:story:2'||id==='ev:dexter:story:3',passers=id==='ev:dexter:story:3b',poem=id.includes('poem'),family=id==='fam:picnic',date=isHillDate(id)
 const walking=date&&!(id==='date:walk:2'&&beat>=1)&&!(id==='dateWalk'&&beat>=1)
 const sit=family||poem||group||passers||id==='ev:dexter:story:1'||id==='ev:dexter:story:2b'||id==='ev:juniper:story:1'||id==='date:walk:2'&&beat>=1||id==='ev:dexter:small:shadowStick'&&!(choice===1&&beat>=2)
 const climbing=tree&&(id==='saw:basil:treeFall'?beat===0:choice===1?beat>=4:choice===0&&beat===3),bothClimb=climbing&&choice===1
 type A={x:number;a:FinalePerson|null;face:'right'|'left'|'up'|'down';sit?:boolean;walk?:boolean;raised?:boolean;ground?:number;supine?:boolean}
 const actors:A[]=[{x:bothClimb?165:id==='date:walk:2'&&beat>=1?228:id==='dateWalk'&&beat>=2?196:105,a:null,face:bothClimb?'up':'right',sit,walk:walking,ground:ground-(bothClimb?31:0),supine:clouds&&choice===2},{x:climbing?191:id==='date:walk:2'&&beat>=1?259:id==='dateWalk'&&beat>=2?232:185,a:npc,face:climbing?'up':'left',sit:(sit||id==='saw:basil:treeFall'&&beat>=1)&&!climbing,walk:walking,ground:ground-(climbing?47:0),supine:clouds}]
 cast.slice(1).forEach((a,i)=>{if(passers&&beat!==2)return;actors.push({x:230+i*29,a,face:'left',sit:group&&!(id==='ev:dexter:story:3'&&beat===2)||passers})})
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.supine?'down':a.face,{frame:a.walk?Math.floor(t*3)%2?1:2:0,blink:false,avatar:full,pose:a.raised?'handUp':a.sit?'crouch':'stand',growth:1,short:a.a?.short}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+(a.supine?y:x)*2+xx},${a.supine?ground-17+x*2+yy:(a.ground??ground)-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+(a.supine?y:x)*2},${a.supine?ground-17+x*2:(a.ground??ground)-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
  for(let y=rows.length-1;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(c!=='.'&&pal[c])expect(pixels.get(`${a.x+(a.supine?y:x)*2},${a.supine?ground-17+x*2:(a.ground??ground)-rows.length*2+y*2}`),`${id} feet ${a.x}`).toBe(pal[c])}
 }
})
