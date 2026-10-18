import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};const r=n(url,c);if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')};return r}})
import {png} from '../../scripts/pixel-png.mjs'
const {drawHomeYardEvent,HOME_YARD_EVENT_IDS,homeYardEventPeople}=await import('../../src/render/home-yard-events-art.ts'),{homeYardEventContext}=await import('../../src/render/home-yard-event-context.ts'),{SCENES}=await import('../../src/content/text.ts'),{withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=neighbors.find(n=>n.id===id);return n?{avatar:n.avatar?withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}):null,who:n.avatar?'writer':n.sprite}:{avatar:null,who:'writer'}}
const actual=withLookDefaults({name:'실제 기록자',look:'f',skin:2,top:6})
function render(file,cw,ch,variants,cols){const scale=2,rows=Math.ceil(variants.length/cols),w=cw*cols,h=ch*rows,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0;const g={fillStyle:'#000000',fillRect(x,y,a,b){const c=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(oy*scale,(y+oy)*scale);yy<Math.min((oy+ch)*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(ox*scale,(x+ox)*scale);xx<Math.min((ox+cw)*scale,(x+ox+a)*scale);xx++)pixels.set(c,(yy*w*scale+xx)*4)}};variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;drawHomeYardEvent(g,v.id,cw,ch,v.t,v.av,v.npc??actor(homeYardEventPeople(v.id)[0]),v.beat,v.ctx)});png(`artifacts/scenery/${file}.png`,w*scale,h*scale,pixels)}

const times=[0,.5,.7,1.2,8]
for(const id of HOME_YARD_EVENT_IDS)for(const [name,av] of [['default',null],['actual',actual]]){
 const phases=SCENES[id].lines.map((_,beat)=>({id,beat,t:8,av,ctx:homeYardEventContext()}))
 render(`yard-${id}-${name}-phases`,320,180,phases.flatMap(v=>times.map(t=>({...v,t}))),5)
 render(`yard-${id}-${name}-mobile`,320,693,phases,phases.length)
 render(`yard-${id}-${name}-thumbnail`,300,170,[{...phases[0],beat:2}],1)
}
const rack=homeYardEventContext()
render('yard-moved-racks',320,180,[{x:2,y:12},{x:10,y:8},{x:8,y:14}].map(reedRack=>({id:'reedRack',beat:0,t:8,av:actual,ctx:{...rack,reedRack}})),3)
render('yard-stowed-rack',320,180,[{id:'reedRack',beat:0,t:8,av:actual,ctx:{...rack,rackPlaced:false}}],1)
for(const [name,av] of [['default',null],['actual',actual]]){
 const dog={...rack,companion:{kind:'dog',name:'달콩'},childPet:'cat'}
 render(`yard-dog-adoption-${name}`,320,180,[0,1].flatMap(beat=>times.map(t=>({id:'companionJoined',beat,t,av,ctx:dog}))),5)
 render(`yard-dog-adoption-${name}-mobile`,320,693,[0,1].map(beat=>({id:'companionJoined',beat,t:8,av,ctx:dog})),2)
}
console.log('Whole yard group: all 11 dialogue phases, five action times, two player looks, both adoptions, three moved racks and stowed rack rendered.')

const nextNpc={avatar:withLookDefaults({name:'다음 세대 이웃',look:'m',skin:3,top:4,hairFront:8}),who:'writer'}
render('yard-next-generation',320,180,HOME_YARD_EVENT_IDS.flatMap(id=>SCENES[id].lines.map((_,beat)=>({id,beat,t:.5,av:actual,npc:nextNpc,ctx:homeYardEventContext()}))),3)
