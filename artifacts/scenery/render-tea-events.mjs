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
const {drawTeaEvent,TEA_EVENT_IDS}=await import('../../src/render/tea-events-art.ts')
const {SCENES}=await import('../../src/content/text.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=neighbors.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite}}
const parent=withLookDefaults({name:'기록자',look:'m',skin:2})
const {teaEventPeople}=await import('../../src/render/tea-events-art.ts')
const cast=id=>{const people=teaEventPeople(id);return [actor(people[0]),people.slice(1).map(actor)]}
const variants=TEA_EVENT_IDS.flatMap(id=>[{id,beat:0},{id,beat:SCENES[id].lines.length-1},...(SCENES[id].choices??[]).map((c,choice)=>({id,choice,beat:SCENES[id].lines.length+c.reply.length-1}))])
for(let sheet=0;sheet<Math.ceil(variants.length/12);sheet++){
 const w=960,h=720,scale=2,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(0,(y+oy)*scale);yy<Math.min(h*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(0,(x+ox)*scale);xx<Math.min(w*scale,(x+ox+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)}}
 for(let cell=0;cell<12;cell++){const v=variants[sheet*12+cell];if(!v)continue;ox=cell%3*320;oy=Math.floor(cell/3)*180;const [npc,others]=cast(v.id);drawTeaEvent(g,v.id,320,180,8,null,npc,others,v.beat,v.choice)}
 png(`artifacts/scenery/tea-events-sheet-${sheet}.png`,w*scale,h*scale,pixels)
}
for(const id of TEA_EVENT_IDS){
 const w=320,h=693,pixels=new Uint8Array(w*h*4)
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(0,y);yy<Math.min(h,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(w,x+a);xx++)pixels.set(color,(yy*w+xx)*4)}}
 const [npc,others]=cast(id);drawTeaEvent(g,id,w,h,8,null,npc,others,SCENES[id].lines.length,0)
 png(`artifacts/scenery/tea-${id.replaceAll(':','-')}.png`,w,h,pixels)
}
console.log(variants.map((v,i)=>`${i}: ${v.id} beat=${v.beat} choice=${v.choice??'-'}`).join('\n'))
