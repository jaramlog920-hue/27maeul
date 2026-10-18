import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){
 if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
 const result=n(url,c)
 if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...result,source:String(result.source).replaceAll('import.meta.glob','(() => ({}))')}
 return result
}})
import {png} from '../../scripts/pixel-png.mjs'
const {drawSquareEvent,SQUARE_EVENT_IDS}=await import('../../src/render/square-events-art.ts')
const {SCENES}=await import('../../src/content/text.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const actor=id=>{const n=neighbors.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite}}
const parent=withLookDefaults({name:'기록자',look:'m',skin:2})
const {squareEventPeople}=await import('../../src/render/square-events-art.ts')
const cast=id=>{const people=squareEventPeople(id);return [people.length?actor(people[0]):{avatar:null,who:'writer'},people.slice(1).map(actor)]}
const {spriteRows,writerPalette}=await import('../../src/render/sprites.ts');for(const id of ['poppy','wendell']){const a=actor(id); const rows=spriteRows(a.who,'down',{avatar:a.avatar,frame:0,growth:1}); const pal=writerPalette('spring',a.avatar); console.log(id,rows.length,rows.slice(0,6),rows.findIndex(r=>[...r].some(c=>pal[c])))}
