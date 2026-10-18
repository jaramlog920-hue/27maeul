import fs from 'node:fs';import path from 'node:path';import {registerHooks} from 'node:module';import assert from 'node:assert/strict'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?s+'.ts':s,c)},load(u,c,n){if(u.endsWith('.json'))return {format:'module',source:'export default '+fs.readFileSync(new URL(u),'utf8'),shortCircuit:true};return n(u,c)}})
const old=await import('./native-exterior-before.ts'),now=await import('../../src/render/house-exterior-art.ts')
function record(fn,...args){const out=[],g={fillStyle:'',fillRect(...v){out.push([this.fillStyle,...v])}};fn(g,...args);return out}
let walls=0,roofs=0,libraries=0
for(const id of [...Object.keys(now.HOUSE_STYLES),'unknown'])for(const width of [4,5,7,9])for(const x of [3,4,5,6,7,8,9,10,11])for(const y of [8,9])for(const ch of ['#','S','D','L']){
 const h={x0:3,x1:3+width-1,y1:9,doorX:3+Math.floor(width/2)};assert.deepEqual(record(now.houseWallTile,x,y,ch,id,h),record(old.houseWallTile,x,y,ch,id,h));walls++
}
for(const width of [4,5,7,9])for(const height of [2,3,5])for(const roof of Object.values(now.HOUSE_STYLES).map(s=>s.roof))for(const chimney of [false,true]){
 assert.deepEqual(record(now.drawRoof,3,4,3+width-1,4+height-1,roof,chimney),record(old.drawRoof,3,4,3+width-1,4+height-1,roof,chimney));roofs++
}
for(const width of [5,7,9])for(const doorX of [5,6,7])for(const roof of [['#58984c','#488040','#6cac5c'],['#6f8f9a','#526f7e','#91acb5']]){
 const h={x0:3,y0:4,x1:3+width-1,y1:9,doorX};assert.deepEqual(record(now.drawLibraryExterior,h,roof),record(old.drawLibraryExterior,h,roof));libraries++
}
process.stdout.write(JSON.stringify({walls,roofs,libraries,unchanged:true})+'\n')
