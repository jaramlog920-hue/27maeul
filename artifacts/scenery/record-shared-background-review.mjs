import fs from 'node:fs'
import crypto from 'node:crypto'

// This records only images the reviewer has already inspected; it performs no visual approval.
const root='artifacts/scenery/shared-background-drafts'
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'))
const file='artifacts/scenery/shared-background-visual-review.json'
const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{batch:'shared-background-remainder',completed:false,samples:[]}
const ids=process.argv.slice(2)
if(!ids.length)throw new Error('Pass only scene IDs whose three viewport sheets were actually inspected.')
for(const id of ids){
 const entry=manifest.find(e=>e.id===id)
 if(!entry)throw new Error(`Unknown scene: ${id}`)
 const images=['phases','phone','thumb'].map(kind=>{
  const path=`${root}/actual-${entry.key}-${kind}.png`
  return {kind,path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}
 })
 const sample={id,title:entry.title,status:'reviewed-sample',sourceLines:entry.lines,context:'Explicit winter day121 review example; actual generation/wardrobe cast, default and actual player. Square coordinates24,18 except firstChapter home20,112.',times:entry.times??[0,.6,8],images,scope:'All original dialogue stages in these three sheets. Actual occurrence locations and browser integration remain separate checks.'}
 const index=record.samples.findIndex(s=>s.id===id)
 if(index<0)record.samples.push(sample);else record.samples[index]=sample
}
record.updatedAt=new Date().toISOString()
record.sceneCount=manifest.length
record.reviewedSampleCount=record.samples.length
record.remainingSampleIds=manifest.filter(e=>!record.samples.some(s=>s.id===e.id)).map(e=>e.id)
record.completed=false
fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n')
console.log(JSON.stringify({reviewedSamples:record.reviewedSampleCount,remainingSamples:record.remainingSampleIds.length,batchCompleted:false,file}))
