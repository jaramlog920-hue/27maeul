import {WOOD_EVENT_IDS,woodEventPeople,drawWoodEvent} from './wood-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE} from './sprites'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string):FinalePerson=>{const n=neighbors.find(n=>n.id===id)!;return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}}
const frames=WOOD_EVENT_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,i)=>({id,choice,beat:SCENES[id].lines.length+i})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'Actual player',look:'f',top:6,skin:3})].flatMap(av=>[170,180,480,693].map(h=>({...v,av,h})))))('$id beat $beat choice $choice height $h: faces and bodies remain visible',({id,beat,choice,av,h})=>{
 const f=Math.round(h>320?h*.54:h<=170?h*.69:h*.6),ground=f+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=Math.max(ground-45,y);yy<Math.min(ground+1,y+h);yy++)for(let xx=Math.max(8,x);xx<Math.min(300,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=woodEventPeople(id).map(actor);drawWoodEvent(g,id,320,h,8,av,cast[0],cast.slice(1),beat,choice)
 const library=id==='ev:rudy:readTogether'&&beat>=1,home=id==='ev:carpenter:story:4'||id==='ev:rudy:silence'&&choice===0&&beat>=4
 const sit=home||library,playerSit=library||home&&choice===0||id==='ev:rudy:love:2'&&beat>=1
 type A={x:number;a:FinalePerson|null;face:'right'|'left';sit:boolean}
 const actors:A[]=[{x:105,a:null,face:'right',sit:playerSit},{x:185,a:cast[0],face:'left',sit}]
 if(cast[1]&&(id!=='ev:rudy:silence'||home))actors.push({x:245,a:cast[1],face:'left',sit:home})
 for(const a of actors){const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{frame:0,blink:false,avatar:full,pose:a.sit?'crouch':'stand',growth:1}),pal=who==='writer'?writerPalette('spring',full):PALETTE
  for(let y=0;y<7;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(id==='ev:rudy:level'&&a.x===185&&c==='o'&&y===rows.findIndex(r=>r.includes('o'))&&x===rows[y].indexOf('o'))continue;if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${ground-rows.length*2+y*2+yy}`),`${id} actor ${a.x} face ${c}`).toBe(pal[c])}
  const cells=rows.flatMap((r,y)=>y<7?[]:[...r].flatMap((c,x)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  expect(cells.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${ground-rows.length*2+y*2}`)===pal[c]).length/cells.length,`${id} body ${a.x}`).toBeGreaterThanOrEqual(.8)
 }
})


function scenePixels(id:string,beat:number,choice?:number){
 const pixels=new Map<string,string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=woodEventPeople(id).map(actor);drawWoodEvent(g,id,320,180,8,null,cast[0],cast.slice(1),beat,choice);return pixels
}
it('three nails appear only after Rudy actually drives them, not on a future-placement reply',()=>{
 for(const choice of [undefined,0,1,2]){
  const pixels=scenePixels('ev:rudy:story:2',5,choice)
  const nails=[163,170,177].filter(x=>pixels.get(`${x},109`)==='#67736e')
  expect(nails.length).toBe(choice===0?3:0)
 }
})
it('the reading scene enters the library after the invitation, and silence enters the house only in the narrated evening',()=>{
 expect(scenePixels('ev:rudy:readTogether',0).get('0,0')).toBe('#d7dfc8')
 expect(scenePixels('ev:rudy:readTogether',1).get('0,0')).toBe('#d8c5a6')
 expect(scenePixels('ev:rudy:silence',3,0).get('0,0')).toBe('#c6b49a')
 expect(scenePixels('ev:rudy:silence',4,0).get('0,0')).toBe('#817966')
 expect(scenePixels('ev:rudy:silence',4,1).get('0,0')).toBe('#c6b49a')
})
it('the night practice planes away the mistaken glyph before carving it again',()=>{
 expect(scenePixels('saw:rudy:carving',0).get('163,105')).toBe('#735536')
 expect(scenePixels('saw:rudy:carving',1).get('163,105')).not.toBe('#735536')
 expect(scenePixels('saw:rudy:carving',2).get('163,105')).toBe('#735536')
})
