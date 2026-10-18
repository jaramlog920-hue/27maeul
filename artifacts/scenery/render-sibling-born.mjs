import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {drawSiblingBorn}=await import('../../src/render/sibling-born-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const parent=withLookDefaults({name:'기록자',look:'m'}),spouse=withLookDefaults({name:'배우자',look:'f',hairFront:3,hairBack:3,top:4})
for(const held of [false,true])for(const [w,h,scale,label] of [[320,180,4,'wide'],[300,170,4,'thumb'],[320,480,2,'portrait'],[320,693,2,'phone']])for(const beat of [0,1]){
 const pixels=new Uint8Array(w*scale*h*scale*4)
 const g={fillStyle:'#000000',fillRect(x,y,a,b){
  if(!/^#[a-f\d]{6}$/i.test(this.fillStyle))throw new Error(`Unexpected color ${this.fillStyle}`)
  const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255)
  for(let yy=Math.max(0,y*scale);yy<Math.min(h*scale,(y+b)*scale);yy++)for(let xx=Math.max(0,x*scale);xx<Math.min(w*scale,(x+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)
 }}
 drawSiblingBorn(g,w,h,8,parent,{avatar:spouse,who:'writer'},{avatar:withLookDefaults({name:'큰아이',look:'f',top:2}),who:'child',short:1,baby:held},{avatar:withLookDefaults({name:'아기',look:'m',skin:1}),who:'writer'},beat)
 png(`artifacts/scenery/story-027-sibling-${held?'held-':''}${label}-${beat}.png`,w*scale,h*scale,pixels)
}
