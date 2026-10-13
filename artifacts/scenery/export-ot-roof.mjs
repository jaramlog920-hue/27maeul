import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png,draw} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const {OLD_BUILDINGS,OLD_VILLAGE_PALETTE}=await import('../../src/render/old-village-art.ts')
const {constructionBuildingArt,BUILDING_ART_PALETTE}=await import('../../src/render/newland-building-art.ts')
function save(file,rows){const w=rows[0].length,h=rows.length,p=new Uint8Array(w*h*4);draw(p,w,rows.map(r=>r.replaceAll('z','.')),BUILDING_ART_PALETTE);png(file,w,h,p)}
for(const d of ['down','up','left','right']){
 const rows=OLD_BUILDINGS.archive[d].rows
 for(const pack of ['old-testament-generations','newland-building-upgrades']){
  const stem=`assets/${pack}/buildings/archive-${d}`
  save(`${stem}.png`,rows)
  save(`${stem}-back.png`,rows.map((r,y)=>y<55?r:'.'.repeat(64)))
  save(`${stem}-front.png`,rows.map((r,y)=>y>=55?r:'.'.repeat(64)))
 }
 const a=constructionBuildingArt('archive',d,'roof'),stem=`assets/newland-building-upgrades/construction/archive-${d}-roof`
 save(`${stem}.png`,a.rows);save(`${stem}-back.png`,a.back);save(`${stem}-front.png`,a.front)
}
const rows=OLD_BUILDINGS.archive.down.rows
const p=new Uint8Array(256*256*4);draw(p,256,rows.map(r=>r.replaceAll('z','.')),OLD_VILLAGE_PALETTE,0,0,4)
png('artifacts/scenery/actual-ot-roof.png',256,256,p)
console.log('Actual archive and roof-stage previews updated in four directions.')

