import fs from 'node:fs'
import crypto from 'node:crypto'
const root='artifacts/scenery',folder=`${root}/shared-background-drafts`
const source=JSON.parse(fs.readFileSync(`${folder}/manifest.json`,'utf8'))
const file=`${root}/shared-live-thumbnails-review.json`
const prior=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{samples:[]}
const entries=source.map(e=>{
 const path=`${folder}/actual-${e.key}-live-thumb.png`,png=fs.readFileSync(path)
 return {id:e.id,title:e.title,sourceLines:e.lines,times:e.times,viewport:{width:300,height:170},defaultAndActualPlayer:true,context:'Explicit winter day121 generation/wardrobe example; plaza24,18 except firstChapter home20,112. This is not actual occurrence routing approval.',image:{path,sha256:crypto.createHash('sha256').update(png).digest('hex'),width:png.readUInt32BE(16),height:png.readUInt32BE(20)}}
})
const samples=entries.map(entry=>{
 const old=prior.samples.find(s=>s.id===entry.id)
 const retained=old?.visuallyReviewed===true&&old.image.sha256===entry.image.sha256
 return {...entry,visuallyReviewed:!!retained,finalApproved:false,...(retained?{notes:old.notes}:{})}
})
fs.writeFileSync(`${root}/shared-live-thumbnails-manifest.json`,JSON.stringify({batch:'shared-background-remainder',entries},null,2)+'\n')
fs.writeFileSync(file,JSON.stringify({batch:'shared-background-remainder',completed:false,samples,remainingIds:samples.filter(s=>!s.visuallyReviewed).map(s=>s.id),updatedAt:new Date().toISOString()},null,2)+'\n')
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
fs.writeFileSync(`${folder}/live-thumbnails.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>실제 썸네일 비율 검토</title><style>body{max-width:1000px;margin:24px auto;font:16px system-ui;background:#f6f0e2}img{max-width:100%;image-rendering:pixelated}</style><h1>118개 · 실제300×170 썸네일 비율</h1><p>기본/실제 기록자, 실제 겨울 인물 예시. 원문 전 단계 시작·중간·끝. 기존320×120 시트와 별도 검토하며 완료 등록이 아닙니다.</p>${entries.map(e=>`<details><summary>${escape(e.id)} · ${escape(e.title)}</summary><ol>${e.sourceLines.map(l=>`<li>${escape(l.speaker)}: ${escape(l.text)}</li>`).join('')}</ol><img loading="lazy" src="actual-${e.id.replaceAll(':','-')}-live-thumb.png" alt="${escape(e.title)} 실제 썸네일 비율 전 단계"></details>`).join('')}</html>`)
console.log(JSON.stringify({fixtures:entries.length,reviewed:samples.filter(s=>s.visuallyReviewed).length,remaining:samples.filter(s=>!s.visuallyReviewed).length,completed:false}))
