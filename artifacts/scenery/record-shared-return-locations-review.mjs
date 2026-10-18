import fs from 'node:fs'
import crypto from 'node:crypto'
// Supply exact fixture keys only after viewing all four sheets, including the
// complete phone layout and its lossless, original-scale actor-band crop.
const manifest=JSON.parse(fs.readFileSync('artifacts/scenery/shared-return-locations/manifest.json','utf8'))
const file='artifacts/scenery/shared-return-locations-review.json'
const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{batch:manifest.batch,scope:manifest.scope,completed:false,samples:[]}
const keys=process.argv.slice(2)
if(!keys.length)throw new Error('Pass only the exact keys of actually viewed fixtures.')
for(const key of keys){
 const entry=manifest.entries.find(e=>e.key===key)
 if(!entry)throw new Error(`Unknown fixture: ${key}`)
 for(const img of entry.images)if(crypto.createHash('sha256').update(fs.readFileSync(img.path)).digest('hex')!==img.sha256)throw new Error(`Stale PNG: ${img.path}`)
 const old=record.samples.findIndex(e=>e.key===key)
 const sample={...entry,visuallyReviewed:true,finalApproved:false,notes:'All four original dialogue stages, default/actual player, 0/.6/8 seconds, landscape/phone/thumbnail and lossless phone actor bands inspected. The three captured places and restored-current-room examples are supplemental QA within the single unfinished 118-event batch; no browser or final routing approval.'}
 if(old<0)record.samples.push(sample);else record.samples[old]=sample
}
record.remainingFixtureKeys=manifest.entries.filter(e=>!record.samples.some(s=>s.key===e.key&&s.images.length===e.images.length&&s.images.every((img,i)=>img.sha256===e.images[i].sha256))).map(e=>e.key)
record.fixtureCount=manifest.entries.length;record.updatedAt=new Date().toISOString();record.completed=false
fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n')
console.log(JSON.stringify({inspectedFixtures:record.samples.length,remainingFixtures:record.remainingFixtureKeys.length,batchCompleted:false}))
