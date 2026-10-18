import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const ns=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=ns.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar}),who:n.avatar?'writer':n.sprite}}
const av=withLookDefaults({name:'기록자',look:'f',skin:3,top:6})
function sheet(name,variants,cw=320,ch=220){const cols=3,w=cw*cols,h=ch*Math.ceil(variants.length/cols),buf=new Uint8Array(w*h*4);let ox=0,oy=0
const g={fillStyle:'#000000',fillRect(x,y,a,b){let c,alpha=1;if(this.fillStyle.startsWith('rgba')){const v=this.fillStyle.match(/[\d.]+/g).map(Number);c=v.slice(0,3);alpha=v[3]}else c=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(0,y);yy<Math.min(ch,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(cw,x+a);xx++){const k=((yy+oy)*w+xx+ox)*4;for(let j=0;j<3;j++)buf[k+j]=Math.round(c[j]*alpha+buf[k+j]*(1-alpha));buf[k+3]=255}}}
variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;v(g,cw,ch)});png(`artifacts/scenery/${name}.png`,w,h,buf)}
const proposals=[]
for(const id of ['basil','dexter','juniper','marigold','merchant','poppy','presser','rudy','cosmo','wendell','penelope','tilly','postman']){const m=await import(`../../src/render/${id}-proposal-art.ts`),fn=m[Object.keys(m).find(k=>k.startsWith('draw'))];for(const t of [0,.5])proposals.push((g,w,h)=>fn(g,w,h,t,av,actor(id),1,{minute:900,indoors:false,wet:true,snow:false,at:{x:15,y:24}}))}
sheet('event-rain-proposals',proposals.slice(0,16))
sheet('event-rain-proposals-additional',proposals.slice(16))
const frames=[]
for(const [file,name,id,npc,extra] of [['postman-events-art','drawPostmanEvent','ev:postman:small:rainCover','postman',[]],['bakery-events-art','drawBakeryEvent','ev:wendell:letterTalk','wendell',[]],['herb-events-art','drawHerbEvent','ev:basil:mountain','basil',[]],['hall-events-art','drawHallEvent','ev:juniper:rainDraw','juniper',[]],['vine-events-art','drawVineEvent','ev:marigold:rainTea','marigold',['grandpa']],['square-events-art','drawSquareEvent','ev:merchant:small:souvenirs','merchant',[]]]){const m=await import(`../../src/render/${file}.ts`);const event=id??m[Object.keys(m).find(k=>k.endsWith('_IDS'))][0];console.log(file,event);for(const t of [0,.7])frames.push((g,w,h)=>m[name](g,event,w,h,t,av,actor(npc),extra.map(actor),0))}
sheet('event-rain-backgrounds',frames)
const {drawShoreFisher}=await import('../../src/render/shore-fisher-art.ts'),{drawShoreRemainder}=await import('../../src/render/shore-remainder-art.ts')
const fisher=[]
for(const id of ['ev:fisher:story:1','ev:fisher:story:4','movedIn:fisher'])for(let beat=0;beat<3;beat++)fisher.push((g,w,h)=>(id.startsWith('moved')?drawShoreRemainder:drawShoreFisher)(g,id,w,h,.6,beat===0?null:av,actor('fisher'),[],beat,beat===0?null:beat-1))
sheet('fisher-village-house-review',fisher)
sheet('fisher-village-house-mobile',fisher.slice(0,3),320,480)
sheet('fisher-village-house-thumbnails',fisher,300,170)

sheet('event-rain-mobile',frames.slice(0,6),320,480)
sheet('event-rain-thumbnails',frames,300,170)
