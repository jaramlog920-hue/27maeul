import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {drawPresserProposal}=await import('../../src/render/presser-proposal-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const ns=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'));
const actor=n=>({avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite});
const dexter=actor(ns.find(n=>n.id==='presser')),guests=ns.filter(n=>n.id!=='presser').map(actor);
const parent=withLookDefaults({name:'기록자',look:'m'}),spouse=withLookDefaults({name:'배우자',look:'f',hairFront:3,hairBack:3,top:4})
for(const [w,h,scale,label] of [[320,180,4,'wide'],[300,170,4,'thumb'],[320,480,2,'portrait'],[320,693,2,'phone']])for(const beat of [0,1]){
 const pixels=new Uint8Array(w*scale*h*scale*4)
 const g={fillStyle:'#000000',fillRect(x,y,a,b){
  const color=this.fillStyle.startsWith('#')?this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(1):this.fillStyle.match(/[\d.]+/g).map(Number)
  for(let yy=Math.max(0,y*scale);yy<Math.min(h*scale,(y+b)*scale);yy++)for(let xx=Math.max(0,x*scale);xx<Math.min(w*scale,(x+a)*scale);xx++){
   const offset=(yy*w*scale+xx)*4
   for(let c=0;c<3;c++)pixels[offset+c]=Math.round(color[c]*color[3]+pixels[offset+c]*(1-color[3]))
   pixels[offset+3]=255
  }
 }}
 drawPresserProposal(g,w,h,8,parent,dexter,beat,{minute:1320,indoors:false,wet:true,snow:true})
 png(`artifacts/scenery/story-048-presser-proposal-snow-${label}-${beat}.png`,w*scale,h*scale,pixels)
}
