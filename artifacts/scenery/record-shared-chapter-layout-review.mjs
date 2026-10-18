import fs from 'node:fs'
import crypto from 'node:crypto'

// Pass only cases whose current PNGs were actually viewed. Unchanged prior
// review is retained by hash; rerunning this script cannot approve stale art.
const file='artifacts/scenery/shared-chapter-layout-review.json'
const prior=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{samples:[]}
const requested=process.argv.slice(2)
if(!requested.length||requested.some(s=>!(/^[0-7]$/).test(s)))throw new Error('Pass exact viewed case indices (0..7).')
const viewedNow=new Set(requested.map(Number)),groups=new Map(),samples=[]
for(let index=0;index<8;index++){
 const images=['phases','phone','thumb'].map(kind=>{
  const path=`artifacts/scenery/shared-background-drafts/chapter-layout-${index}-${kind}.png`
  return {kind,path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}
 })
 const key=images.map(i=>i.sha256).join('|'),same=groups.get(key)
 const old=prior.samples.find(s=>s.index===index)
 const retained=!!old?.directlyViewed&&images.every(image=>old.images.some(p=>p.path===image.path&&p.sha256===image.sha256))
 const directlyViewed=viewedNow.has(index)||retained
 if(!directlyViewed&&same===undefined)throw new Error(`Changed or unviewed image set: ${index}. View it before recording.`)
 if(same===undefined)groups.set(key,index)
 const openIssues=[]
 if(index===2)openIssues.push('User approved conditional organizing wording on 2026-10-17 when no actual shelf exists. Live/replay DOM assertions pass; final visual UI/common-route approval remains pending. This is not completed shelf placement.')
 if(index>=5)openIssues.push('Saved world facing is preserved. A fixed event camera faces the existing shelf opening; its cabinet stands at the wall/floor seam and the original loose sheets are placed on the real board. Landscape/native phone/thumbnail stages were viewed after the wall-anchor correction. Actual browser/UI validation remains pending.')
 samples.push({index,id:'firstChapter',images,directlyViewed,...(same!==undefined?{identicalImageSetAs:same}:{}),visualEvidence:true,finalApproved:false,openIssues,...(index===2?{actionEvidence:'Approved no-shelf organizing action: sheets converge in the original hand at 0/1.6/3/8 seconds. The 0/1.6/3.6/4.5/8 sheets were viewed at landscape/native phone/thumbnail sizes for default and actual avatar; placed remains false.'}:{})})
}
fs.writeFileSync(file,JSON.stringify({batch:'shared-background-remainder',completed:false,scope:'Supplemental first-chapter furniture checks within the single 118-event batch. Image inspection is not final action, facing, event routing or browser approval.',times:[0,1.6,3.6,4.5,8],defaultAndActualPlayer:true,samples,uniqueImageSetCount:groups.size,updatedAt:new Date().toISOString()},null,2)+'\n')
console.log(JSON.stringify({contexts:samples.length,uniqueImageSets:groups.size,completed:false,openCases:samples.filter(s=>s.openIssues.length).map(s=>s.index)}))
