import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png,draw} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {petMotionRows,petStillRows}=await import('../../src/render/pet-art.ts')
const {ANIMAL_PALETTE}=await import('../../src/render/sprites.ts')
const actions=['wait','walk','sniff','play','wag','curl'], W=768,H=4*6*80
const pixels=new Uint8Array(W*H*4);for(let i=0;i<pixels.length;i+=4)pixels.set([228,216,196,255],i)
let row=0
for(const kind of ['cat','dog'])for(const baby of [true,false])for(const action of actions){
 for(let f=0;f<4;f++)for(const [j,face]of ['left','right'].entries()){
 const curl=action==='curl'?petStillRows(kind,'curl',baby):null
 const rows=curl?(face==='right'?curl.map(row=>[...row].reverse().join('')):curl):petMotionRows(kind,face,action,f,baby)
 draw(pixels,W,rows,ANIMAL_PALETTE[kind],f*192+j*80,row*80,4)
 }
 row++
}
png('artifacts/scenery/copy-pet-native-review.png',W,H,pixels)
console.log('Rows: cat baby/adult, dog baby/adult; each wait/walk/sniff/play/wag/curl. Four phases with left/right pairs.')
