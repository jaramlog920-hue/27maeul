import fs from 'node:fs'
import crypto from 'node:crypto'

// Manual bookkeeping only. Pass a key only after inspecting all three real PNG sheets.
const file='artifacts/scenery/shared-background-sites-review.json'
const manifest=JSON.parse(fs.readFileSync('artifacts/scenery/shared-background-sites/manifest.json','utf8'))
const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{batch:manifest.batch,completed:false,samples:[]}
const keys=process.argv.slice(2)
if(!keys.length)throw new Error('Pass exact fixture keys whose three viewport sheets were inspected.')
for(const key of keys){
 const entry=manifest.entries.find(e=>e.key===key)
 if(!entry)throw new Error(`Unknown fixture: ${key}`)
 for(const image of entry.images)if(crypto.createHash('sha256').update(fs.readFileSync(image.path)).digest('hex')!==image.sha256)throw new Error(`Stale generated fixture: ${image.path}`)
 const index=record.samples.findIndex(e=>e.key===key),old=index>=0?record.samples[index]:null
 const sample={...entry,visuallyReviewed:true,finalApproved:false,notes:old?.notes??'Both original dialogue stages, default/actual player, 0/.6/8 seconds and landscape/phone/thumbnail sheets inspected. Explicit fixture only; actual occurrence routing, additional states and browser integration remain separate checks.'}
 if(entry.id==='done:baker:2'&&!entry.babyPresent)sample.openIssue='User approved preparation wording on 2026-10-17 when no actual infant exists. No infant is invented. Live/replay text selection is implemented; final visual UI/common-route approval remains pending.'
 if(index<0)record.samples.push(sample);else record.samples[index]=sample
}
record.updatedAt=new Date().toISOString()
record.fixtureCount=manifest.entries.length
record.remainingFixtureKeys=manifest.entries.filter(e=>!record.samples.some(s=>s.key===e.key&&s.images.every((img,i)=>img.sha256===e.images[i].sha256))).map(e=>e.key)
record.completed=false
fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n')
console.log(JSON.stringify({inspectedFixtures:record.samples.length,remainingFixtures:record.remainingFixtureKeys.length,batchCompleted:false}))
