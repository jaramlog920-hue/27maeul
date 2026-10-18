import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){
 if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
 const result=n(url,c)
 if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...result,source:String(result.source).replaceAll('import.meta.glob','(() => ({}))')}
 return result
}})
const {eventPreviewEntries}=await import('../../src/features/scene/event-registry.ts')
const {SCENES}=await import('../../src/content/text.ts')
const entries=eventPreviewEntries().map(e=>({...e,lines:SCENES[e.id]?.lines,choices:SCENES[e.id]?.choices}))
fs.writeFileSync('artifacts/scenery/event-art-inventory.json',JSON.stringify(entries,null,2))
console.log(JSON.stringify({total:entries.length,drawn:entries.filter(e=>e.kind||e.authored).length,pending:entries.filter(e=>!e.kind&&!e.authored).length}))
console.log(entries.filter(e=>!e.kind&&!e.authored).map(e=>`${e.id}\t${e.title}\t${e.caption}`).join('\n'))
