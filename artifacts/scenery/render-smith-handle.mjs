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
const {allSightings}=await import('../../src/engine/people.ts')
const {drawSmithEvent}=await import('../../src/render/smith-events-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8')),smith=neighbors.find(n=>n.id==='smith')
const npc={avatar:withLookDefaults({name:smith.role,look:smith.look??'m',...smith.avatar}),who:smith.avatar?'writer':smith.sprite}
fs.writeFileSync('artifacts/scenery/smith-handle-runtime.json',JSON.stringify(allSightings().find(s=>s.id==='forge:handle'),null,2))
const times=[0,.45,1.1,1.8,8],player=withLookDefaults({name:'실제 기록자',look:'f',skin:3,top:6})
function render(file,cw,ch,variants,cols){
 const scale=2,rows=Math.ceil(variants.length/cols),w=cw*cols,h=ch*rows,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(oy*scale,(y+oy)*scale);yy<Math.min((oy+ch)*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(ox*scale,(x+ox)*scale);xx<Math.min((ox+cw)*scale,(x+ox+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)}}
 variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;drawSmithEvent(g,'saw:forge:handle',cw,ch,v.t,v.av,v.npc??npc,[],v.beat)})
 png(`artifacts/scenery/${file}.png`,w*scale,h*scale,pixels)
}
for(const [name,av] of [['default',null],['actual',player]]){
 render(`smith-handle-${name}-phases`,320,180,[0,1,2].flatMap(beat=>times.map(t=>({av,beat,t}))),5)
 render(`smith-handle-${name}-mobile`,320,693,[0,1,2].map(beat=>({av,beat,t:8})),3)
}
render('smith-handle-thumbnail',300,170,[{av:null,beat:1,t:8}],1)
console.log('All 3 original phases, 5 animation times, default/actual player, mobile and thumbnail rendered.')

render('smith-handle-next-generation',320,180,[0,1,2].flatMap(beat=>times.map(t=>({av:player,beat,t,npc:{avatar:withLookDefaults({name:'다음 세대 이웃',look:'f',skin:2,top:4,hairFront:8}),who:'writer'}}))),5)
