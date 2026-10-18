import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {drawHillEvent,HILL_EVENT_IDS,hillEventPeople}=await import('../../src/render/hill-events-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts'),{SCENES}=await import('../../src/content/text.ts')
const ns=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=ns.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar}),who:n.avatar?'writer':n.sprite}}
const av=withLookDefaults({name:'기록자',look:'f',skin:3,top:6,hairBack:3})
function sheet(name,variants,cw=320,ch=220){const cols=3,w=cw*cols,h=ch*Math.ceil(variants.length/cols),buf=new Uint8Array(w*h*4);let ox=0,oy=0
const g={fillStyle:'#000000',fillRect(x,y,a,b){let c,alpha=1;if(this.fillStyle.startsWith('rgba')){const v=this.fillStyle.match(/[\d.]+/g).map(Number);c=v.slice(0,3);alpha=v[3]}else c=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(0,y);yy<Math.min(ch,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(cw,x+a);xx++){const k=((yy+oy)*w+xx+ox)*4;for(let j=0;j<3;j++)buf[k+j]=Math.round(c[j]*alpha+buf[k+j]*(1-alpha));buf[k+3]=255}}}
variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;v(g,cw,ch)});png(`artifacts/scenery/${name}.png`,w,h,buf)}
const variants=HILL_EVENT_IDS.flatMap(id=>{const scene=SCENES[id],cast=hillEventPeople(id).map(actor);return [0,1,2].map(stage=>(g,w,h)=>drawHillEvent(g,id,w,h,[0,.5,8][stage],stage===0?null:av,cast[0],cast.slice(1),stage===0?0:stage===1?Math.floor((scene.lines.length-1)/2):scene.lines.length-1+(scene.choices?.[0]?.reply.length??0),stage===2&&scene.choices?.length?0:null))})
for(let i=0;i<variants.length;i+=18)sheet(`hill-background-scenes-${i/18+1}`,variants.slice(i,i+18))
const representative=['date:walk:1','ev:dexter:story:1','ev:basil:tree','fam:picnic','ev:dexter:story:2','dateWalk'].map(id=>variants[HILL_EVENT_IDS.indexOf(id)*3+1])
sheet('hill-background-mobile',representative,320,480)
sheet('hill-background-thumbnails',representative,300,170)
sheet('hill-background-example',[variants[HILL_EVENT_IDS.indexOf('ev:dexter:story:1')*3+1]],480,270)
const {drawSharedStoryBackground}=await import('../../src/render/shared-story-background.ts'),{storyLocationContext}=await import('../../src/render/story-location-context.ts')
sheet('hill-background-seasons',[1,31,61,91,1,1].map((day,i)=>(g,w,h)=>drawSharedStoryBackground(g,w,h,.5,storyLocationContext({player:{x:14,y:12,facing:'up',path:[],walkTime:0},clock:{day,minute:i===4?1100:i===5?1300:900}}))))
fs.writeFileSync('artifacts/scenery/hill-background-manifest.json',JSON.stringify({ids:HILL_EVENT_IDS,panels:['first default','middle actual','last first-choice actual'],sceneSheets:Math.ceil(variants.length/18)},null,2))
