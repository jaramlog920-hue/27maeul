import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8')),scenes=JSON.parse(fs.readFileSync('src/content/life-text.json','utf8')).scenes
const actor=n=>({id:n.id,avatar:n.avatar?withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}):null,who:n.avatar?'writer':n.sprite})
const folder='artifacts/scenery/wedding-ceremony-review';fs.mkdirSync(folder,{recursive:true})
const ids=['dexter','rudy','postman','marigold','basil','merchant','presser','poppy','juniper','cosmo','tilly','wendell','penelope'],manifest=[]
function sheet(file,cw,ch,variants,draw,spouse,guests){
 const cols=3,w=cw*cols,h=ch*Math.ceil(variants.length/cols),pixels=new Uint8Array(w*h*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const c=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(oy,y+oy);yy<Math.min(oy+ch,y+oy+b);yy++)for(let xx=Math.max(ox,x+ox);xx<Math.min(ox+cw,x+ox+a);xx++)pixels.set([...c,255],(yy*w+xx)*4)}}
 variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;draw(g,cw,ch,v.t,v.avatar,spouse,guests,v.beat)})
 png(`${folder}/${file}.png`,w,h,pixels)
}
for(const id of ids){
 const module=await import(`../../src/render/${id}-wedding-art.ts`),draw=Object.values(module).find(x=>typeof x==='function'),spouse=actor(neighbors.find(n=>n.id===id)),guests=neighbors.filter(n=>n.id!==id).map(actor),scene=scenes[`wedding:${id}`]
 const variants=[]
 for(const avatar of [null,withLookDefaults({name:'실제 기록자',look:'f',skin:3,top:6,hairBack:3})])for(let beat=0;beat<scene.lines.length;beat++)for(const t of [0,.9,2,8])variants.push({avatar,beat,t})
 sheet(`${id}-phases`,320,220,variants,draw,spouse,guests)
 const final=variants.filter(v=>v.t===8)
 sheet(`${id}-phone`,320,220,final,draw,spouse,guests)
 sheet(`${id}-thumb`,300,170,final,draw,spouse,guests)
 manifest.push({id:`wedding:${id}`,name:neighbors.find(n=>n.id===id).role,lines:scene.lines,files:[`${id}-phases`,`${id}-phone`,`${id}-thumb`]})
}
fs.writeFileSync(`${folder}/manifest.json`,JSON.stringify(manifest,null,2)+'\n')
fs.writeFileSync(`${folder}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>결혼잔치 13종 새 구도</title><style>body{max-width:1000px;margin:24px auto;background:#ece4d3;font:16px system-ui;padding:16px}img{max-width:100%;image-rendering:pixelated}a{color:#385b45}</style><h1>결혼잔치 13종 · 새 구도</h1><p>원문 전 단계·0/0.9/2/8초·기본/실제 기록자. 휴대폰은 새 320×220 캔버스 구도.</p><a href="../wedding-outfits.html">결혼 복장 남녀 각 2종</a>${manifest.map(e=>`<details><summary>${e.name} · <a href="/assets/events/play.html?event=${encodeURIComponent(e.id)}">모션 보기</a></summary><p>${e.lines.map(l=>l.text).join('<br>')}</p>${e.files.map(f=>`<img loading="lazy" src="${f}.png" alt="${e.name} ${f}">`).join('')}</details>`).join('')}</html>`)
console.log(JSON.stringify({weddings:manifest.length,pngs:manifest.length*3}))
