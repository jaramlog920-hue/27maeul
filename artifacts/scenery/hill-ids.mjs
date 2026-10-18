import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){
 if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true}
 const result=n(url,c)
 if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...result,source:String(result.source).replaceAll('import.meta.glob','(() => ({}))')}
 return result
}})
const {SCENES}=await import('../../src/content/text.ts')
const groups=JSON.parse(fs.readFileSync('docs/event-art-background-groups.json','utf8'))
console.log(JSON.stringify(groups.groups.find(g=>g.id==='hill').entries.filter(e=>e.status!=='완료').map(e=>e.id)))
