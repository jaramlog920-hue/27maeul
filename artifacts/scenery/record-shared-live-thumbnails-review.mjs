import fs from 'node:fs'
import crypto from 'node:crypto'
// Explicit manual checkpoint only, after viewing every stage/actor/time on the PNG.
const file='artifacts/scenery/shared-live-thumbnails-review.json',record=JSON.parse(fs.readFileSync(file,'utf8')),ids=process.argv.slice(2)
if(!ids.length)throw new Error('Pass exact event IDs whose current PNG sheet was visually inspected.')
for(const id of ids){
 const sample=record.samples.find(s=>s.id===id)
 if(!sample)throw new Error(`Unknown fixture: ${id}`)
 const hash=crypto.createHash('sha256').update(fs.readFileSync(sample.image.path)).digest('hex')
 if(hash!==sample.image.sha256)throw new Error(`Stale fixture: ${id}. Regenerate its manifest, then view the changed PNG.`)
 sample.visuallyReviewed=true;sample.finalApproved=false
 sample.notes='Actual300x170 sheet viewed: every original dialogue stage and recorded action time for default/actual player, explicit winter generation/wardrobe. No new face/body/hand/foot clipping found. This does not approve actual occurrence routing, CSS cropping or browser integration.'
}
record.remainingIds=record.samples.filter(s=>!s.visuallyReviewed).map(s=>s.id);record.updatedAt=new Date().toISOString()
fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n')
console.log(JSON.stringify({reviewed:record.samples.length-record.remainingIds.length,remaining:record.remainingIds.length,completed:false}))
