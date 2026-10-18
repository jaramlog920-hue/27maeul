import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){
 if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
 const result=n(url,c)
 if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...result,source:String(result.source).replaceAll('import.meta.glob','(() => ({}))')}
 return result
}})
import {png} from '../../scripts/pixel-png.mjs'
const {drawTravelEvent,TRAVEL_EVENT_IDS}=await import('../../src/render/travel-events-art.ts')
const {SCENES}=await import('../../src/content/text.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=neighbors.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite}}
const parent=withLookDefaults({name:'기록자',look:'m',skin:2})
const {travelEventPeople}=await import('../../src/render/travel-events-art.ts')
const cast=id=>{const people=travelEventPeople(id);return [people.length?actor(people[0]):{avatar:null,who:'writer'},people.slice(1).map(actor)]}
const variants=TRAVEL_EVENT_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,reply)=>({id,choice,beat:SCENES[id].lines.length+reply})))])

variants.push(...variants.filter(v=>v.id==='trip:hillTown').flatMap(v=>[0,.7,1.4].map(t=>({...v,t}))))
for(let sheet=0;sheet<Math.ceil(variants.length/12);sheet++){
 const w=960,h=720,scale=2,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){if(this.fillStyle.startsWith('rgba'))return;const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(oy*scale,(y+oy)*scale);yy<Math.min((oy+180)*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(ox*scale,(x+ox)*scale);xx<Math.min((ox+320)*scale,(x+ox+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)}}
 for(let cell=0;cell<12;cell++){const v=variants[sheet*12+cell];if(!v)continue;ox=cell%3*320;oy=Math.floor(cell/3)*180;const [npc,others]=cast(v.id);drawTravelEvent(g,v.id,320,180,v.t??8,null,npc,others,v.beat,v.choice)}
 png(`artifacts/scenery/travel-events-sheet-${sheet}.png`,w*scale,h*scale,pixels)
}
for(const id of TRAVEL_EVENT_IDS){
 const w=320,h=693,pixels=new Uint8Array(w*h*4)
 const g={fillStyle:'#000000',fillRect(x,y,a,b){if(this.fillStyle.startsWith('rgba'))return;const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(0,y);yy<Math.min(h,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(w,x+a);xx++)pixels.set(color,(yy*w+xx)*4)}}
 const [npc,others]=cast(id);drawTravelEvent(g,id,w,h,8,null,npc,others,SCENES[id].lines.length,0)
 png(`artifacts/scenery/travel-${id.replaceAll(':','-')}.png`,w,h,pixels)
}
console.log(variants.map((v,i)=>`${i}: ${v.id} beat=${v.beat} choice=${v.choice??'-'}`).join('\n'))
