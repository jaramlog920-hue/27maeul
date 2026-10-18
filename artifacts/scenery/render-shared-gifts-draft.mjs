import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};const r=n(url,c);if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')};return r}})
import {png} from '../../scripts/pixel-png.mjs'
const {drawSharedGiftForeground,SHARED_GIFT_IDS}=await import('../../src/render/shared-gift-art.ts'),{drawSharedStoryBackground}=await import('../../src/render/shared-story-background.ts'),{storyLocationContext}=await import('../../src/render/story-location-context.ts'),{SCENES}=await import('../../src/content/text.ts'),{withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=neighbors.find(n=>n.id===id);return n?{avatar:n.avatar?withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}):null,who:n.avatar?'writer':n.sprite}:{avatar:null,who:'writer'}}
const actual=withLookDefaults({name:'실제 기록자',look:'f',skin:2,top:6})
function render(file,cw,ch,variants,cols){const scale=2,rows=Math.ceil(variants.length/cols),w=cw*cols,h=ch*rows,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0;const g={fillStyle:'#000000',fillRect(x,y,a,b){const c=this.fillStyle.startsWith('rgba')?[90,70,50,56]:this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(oy*scale,(y+oy)*scale);yy<Math.min((oy+ch)*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(ox*scale,(x+ox)*scale);xx<Math.min((ox+cw)*scale,(x+ox+a)*scale);xx++)pixels.set(c,(yy*w*scale+xx)*4)}};variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;drawSharedStoryBackground(g,cw,ch,v.t,v.location??storyLocationContext());drawSharedGiftForeground(g,v.id,cw,Math.round(ch>cw?ch*.54:ch*.6),v.t,v.av,actor(v.id.split(':')[1]))});png(`artifacts/scenery/${file}.png`,w*scale,h*scale,pixels)}


for(let page=0;page<Math.ceil(SHARED_GIFT_IDS.length/6);page++){const ids=SHARED_GIFT_IDS.slice(page*6,page*6+6);render('shared-gifts-draft-'+page,320,180,ids.flatMap(id=>[null,actual].map(av=>({id,t:8,av}))),3)}
for(const id of SHARED_GIFT_IDS)render('shared-gift-draft-'+id.replaceAll(':','-'),320,180,[null,actual].flatMap(av=>[0,.35,.8,8].map(t=>({id,t,av}))),4);
