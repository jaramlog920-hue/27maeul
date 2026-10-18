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
const {PEOPLE_DATA}=await import('../../src/content/people-all.ts')
const entries=groups.groups.find(g=>g.id==='library').entries.filter(e=>e.status!=='완료')
const conditions=new Map(Object.values(PEOPLE_DATA.people).flatMap(p=>(p.events??[]).map(e=>['ev:'+e.id,e])))
fs.writeFileSync('artifacts/scenery/library-production-brief.json',JSON.stringify({status:'원문 대조 중',entries:entries.map(e=>({...e,original:SCENES[e.id],trigger:conditions.get(e.id)??null}))},null,2)+'\n')
console.log(entries.map(e=>e.id+' '+e.title+'\n'+JSON.stringify(SCENES[e.id])+'\n'+JSON.stringify(conditions.get(e.id))).join('\n\n'))
