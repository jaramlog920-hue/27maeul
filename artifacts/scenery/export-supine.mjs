import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png,draw} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){return url.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}:n(url,c)}})
const {furnitureUseFrame,USE_PROP_PALETTE,USE_ACTIONS}=await import('../../src/render/furniture-use-motion.ts')
const {writerPalette}=await import('../../src/render/sprites.ts')
const palette=writerPalette('spring'),proof=new Uint8Array(384*384*4)
for(const [i,facing] of ['down','up','left','right'].entries())for(let frame=0;frame<4;frame++){
 const a=furnitureUseFrame('writer',facing,'lie',frame,{frame:0,blink:false,season:'spring'})
 draw(proof,384,a.actor,palette,frame*96,i*96,4)
}
png('artifacts/scenery/supine-four-directions.png',384,384,proof)
const contact=new Uint8Array(384*3072*4)
for(const [ai,action] of USE_ACTIONS.entries())for(const [di,facing] of ['down','up','left','right'].entries())for(let frame=0;frame<4;frame++){
 const a=furnitureUseFrame('writer',facing,action,frame,{frame:0,blink:false,season:'spring'})
 for(const [rows,pal] of [[a.propBack,USE_PROP_PALETTE],[a.actor,palette],[a.propFront,USE_PROP_PALETTE]])draw(contact,384,rows,pal,frame*96,(ai*4+di)*96,4)
}
png('assets/furniture/use-motion/preview-4x.png',384,3072,contact)
for(const [dir,child] of [['assets/furniture/use-motion',false],['assets/furniture/expansion/children',true]]){
 if(!fs.existsSync(dir))continue
 const sheet=new Uint8Array(96*24*4),actors=new Uint8Array(96*24*4),backs=new Uint8Array(96*24*4),fronts=new Uint8Array(96*24*4)
 for(let frame=0;frame<4;frame++){
  const a=furnitureUseFrame('writer','up','lie',frame,{frame:0,blink:false,season:'spring',short:child?1:undefined}),pixels=new Uint8Array(24*24*4)
  for(const [rows,pal,target] of [[a.propBack,USE_PROP_PALETTE,backs],[a.actor,palette,actors],[a.propFront,USE_PROP_PALETTE,fronts]]){draw(pixels,24,rows,pal);draw(sheet,96,rows,pal,frame*24);draw(target,96,rows,pal,frame*24)}
  png(`${dir}/lie-up-${frame}.png`,24,24,pixels)
 }
 for(const [suffix,pixels] of [['sheet',sheet],['actor',actors],[child?'back':'prop-back',backs],[child?'front':'prop-front',fronts]])png(`${dir}/lie-up-${suffix}.png`,96,24,pixels)
}
