import fs from 'node:fs'
import crypto from 'node:crypto'

// Evidence audit only: valid PNG hashes never stand in for a browser inspection.
const root='artifacts/scenery'
const names=['shared-background-visual-review.json','shared-background-sites-review.json','shared-return-locations-review.json','shared-chapter-layout-review.json','shared-live-thumbnails-review.json']
const ledgers=names.map(name=>{
 const record=JSON.parse(fs.readFileSync(`${root}/${name}`,'utf8')),images=[]
 function visit(value){
  if(!value||typeof value!=='object')return
  if(value.path?.endsWith('.png')&&value.sha256){
   const exists=fs.existsSync(value.path)
   images.push({path:value.path,valid:exists&&crypto.createHash('sha256').update(fs.readFileSync(value.path)).digest('hex')===value.sha256})
  }
  for(const child of Object.values(value))if(typeof child==='object')visit(child)
 }
 visit(record)
 return {ledger:name,images:images.length,invalidImages:images.filter(image=>!image.valid).map(image=>image.path),samples:record.samples.length,visuallyReviewed:record.samples.filter(sample=>sample.visuallyReviewed).length,remainingIds:record.remainingIds??null}
})
const live=ledgers.find(ledger=>ledger.ledger==='shared-live-thumbnails-review.json')
const report={date:new Date().toISOString(),batch:'shared-background-remainder',connected:676,registrationPending:0,ledgers,liveThumbnailReviewComplete:live.visuallyReviewed===118&&live.remainingIds?.length===0,locationIntegration:{tests:417,passed:true,log:`${root}/shared-final-location-matrix-tests.log`,scope:'All 118 IDs retain real village room owners, newland archive/furniture and completed-only housing; every returning partner uses matching same-day tea/walk/sunset provenance. Local DOM/canvas tests, not browser approval.'},build:{passed:true,log:`${root}/shared-final-review-build.log`},finalApproved:false,remaining:['Actual browser/UI validation remains blocked by the saved permission/managed policy gate. No new browser retry or alternate route was attempted.']}
// Require actual passing logs, not a report assembled from intended commands.
const tests=fs.readFileSync(report.locationIntegration.log,'utf8'),build=fs.readFileSync(report.build.log,'utf8')
if(!/417 passed/.test(tests)||!/built in/.test(build)||/error TS\d|Build failed/i.test(build))throw new Error('Passing test/build evidence is missing')
if(ledgers.some(ledger=>ledger.invalidImages.length))throw new Error('Reviewed PNG evidence changed; inspect affected images before recording a checkpoint')
fs.writeFileSync(`${root}/shared-final-review-checkpoint.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({pngs:ledgers.reduce((sum,ledger)=>sum+ledger.images,0),invalid:0,liveThumbnails:live.visuallyReviewed,remainingLiveThumbnails:live.remainingIds.length,finalApproved:false}))
