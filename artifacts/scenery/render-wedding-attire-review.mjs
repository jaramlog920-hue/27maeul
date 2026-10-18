import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {withLookDefaults}=await import('../../src/engine/avatar.ts'),{drawDexterWedding}=await import('../../src/render/dexter-wedding-art.ts')
const ns=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8')),scenes=JSON.parse(fs.readFileSync('src/content/life-text.json','utf8')).scenes
const themes={dexter:'sheep',rudy:'table',postman:'invitations',marigold:'grapes',basil:'herbalTea',merchant:'patchwork',presser:'oliveCups',poppy:'banquetTea',juniper:'honeySpoons',cosmo:'fishPlatter',tilly:'forgedRings',wendell:'breadBoard',penelope:'wovenFlags'}
const actor=n=>({id:n.id,avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite})
const player=withLookDefaults({name:'기록자',look:'f',skin:3,hairBack:3})
function draw(g,w,h,v){
 const spouse=actor(ns.find(n=>n.id===v.id)),guests=ns.filter(n=>n.id!==v.id).map(actor)
 spouse.avatar={...spouse.avatar,weddingOutfit:spouse.avatar.look==='f'?'bride-lace':'groom-midnight'}
 drawDexterWedding(g,w,h,v.time??8,{...player,weddingOutfit:v.player??'bride-ball'},spouse,guests,v.beat??scenes[`wedding:${v.id}`].lines.length-1,themes[v.id])
}
function sheet(name,variants,cols=3,cw=320,ch=220){
 const w=cw*cols,h=ch*Math.ceil(variants.length/cols),pixels=new Uint8Array(w*h*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const c=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(oy,y+oy);yy<Math.min(oy+ch,y+oy+b);yy++)for(let xx=Math.max(ox,x+ox);xx<Math.min(ox+cw,x+ox+a);xx++)pixels.set([...c,255],(yy*w+xx)*4)}}
 variants.forEach((v,i)=>{ox=i%cols*cw;oy=Math.floor(i/cols)*ch;draw(g,cw,ch,v)})
 png(`artifacts/scenery/wedding-attire-${name}.png`,w,h,pixels)
}
sheet('all-partners',Object.keys(themes).flatMap(id=>[{id},{id,player:'bride-lace'}]))
sheet('legacy-actions',['merchant','presser','postman'].flatMap(id=>[0,1,2].flatMap(beat=>[{id,beat,time:.9},{id,beat,time:2}])) )
sheet('rudy-final',[{id:'rudy'}],1)
sheet('thumbs',Object.keys(themes).map(id=>({id})),3,300,170)
