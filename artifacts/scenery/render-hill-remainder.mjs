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
await import('../../src/content/catalog.ts')
const {allSightings}=await import('../../src/engine/people.ts'),{SCENES}=await import('../../src/content/text.ts')
const {drawHillEvent}=await import('../../src/render/hill-events-art.ts'),{withLookDefaults}=await import('../../src/engine/avatar.ts'),{CANDIDATE_IDS}=await import('../../src/engine/romance.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=neighbors.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite}}
fs.writeFileSync('artifacts/scenery/hill-remainder-runtime.json',JSON.stringify(allSightings().find(s=>s.id==='tilly:flower'),null,2))
const times=[0,.4,.7,1.2,8],player=withLookDefaults({name:'실제 기록자',look:'f',skin:2,top:6}),replacement={avatar:withLookDefaults({name:'다음 세대',look:'m',top:5,skin:3,hairFront:8}),who:'writer'}
function render(file,cw,ch,variants,cols){
 const scale=2,rows=Math.ceil(variants.length/cols),w=cw*cols,h=ch*rows,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(oy*scale,(y+oy)*scale);yy<Math.min((oy+ch)*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(ox*scale,(x+ox)*scale);xx<Math.min((ox+cw)*scale,(x+ox+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)}}
 variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;drawHillEvent(g,v.id,cw,ch,v.t,v.av,v.npc,[],v.beat)})
 png(`artifacts/scenery/${file}.png`,w*scale,h*scale,pixels)
}
for(const id of ['date:walk:1','saw:tilly:flower'])for(const [name,av] of [['default',null],['actual',player]]){
 const npc=actor(id==='date:walk:1'?'wendell':'tilly'),phases=SCENES[id].lines.map((_,beat)=>({id,av,npc,beat,t:8})),stem=id==='date:walk:1'?'wildflower':'ironflower'
 render(`hill-${stem}-${name}-phases`,320,180,phases.flatMap(v=>times.map(t=>({...v,t}))),5)
 render(`hill-${stem}-${name}-mobile`,320,693,phases,phases.length)
 render(`hill-${stem}-${name}-thumbnail`,300,170,[{...phases[0],beat:2}],1)
 render(`hill-${stem}-next-generation`,320,180,phases.flatMap(v=>times.map(t=>({...v,t,npc:replacement}))),5)
}
render('hill-wildflower-all-partners',320,180,CANDIDATE_IDS.flatMap(p=>[0,1].map(beat=>({id:'date:walk:1',av:player,npc:actor(p),beat,t:8}))),4)
console.log('Two entire hill remainders, all phases/times, 13 partners and replacement generation rendered.')
