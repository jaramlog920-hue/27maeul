import fs from 'node:fs'
const out='qa/comprehensive-audit-20261019-round2'
const inv=JSON.parse(fs.readFileSync(`${out}/source-closing.json`,'utf8'))
const start=new Map(JSON.parse(fs.readFileSync(`${out}/source-start.json`,'utf8')).map(x=>[x.path,x.sha256]))
const reviews=new Map()
function add(file,owner,depth,sha){if(!file)return;file=file.replaceAll('\\','/');reviews.set(file,[...(reviews.get(file)??[]),{owner,depth,reviewedSha256:sha?.toLowerCase()}])}
for(const line of fs.readFileSync(`${out}/economy/coverage.csv`,'utf8').split(/\r?\n/).slice(1)){
 const c=[...line.matchAll(/"((?:[^"]|"")*)"/g)].map(x=>x[1].replaceAll('""','"'))
 if(c.length)add(c[0],'economy',c[3],c[6])
}
for(const x of JSON.parse(fs.readFileSync(`${out}/social/COVERAGE.json`,'utf8')))add(x.path,'social',x.round2Depth,x.sha256)
for(const x of JSON.parse(fs.readFileSync(`${out}/ui/coverage.json`,'utf8')).files)add(x.file,'ui',x.coverage,x.sha256)
const prior=JSON.parse(fs.readFileSync('qa/comprehensive-audit-20261018/coverage-current.json','utf8'))
for(const x of prior)if(!reviews.has(x.path))for(const r of x.reviews)add(x.path,r.owner,`prior review reused only if SHA unchanged: ${r.depth}`,x.sha256)
const rootFiles=['src/main.tsx','src/engine/game.ts','src/engine/save.ts','src/engine/game-storage.ts','src/engine/maps.ts','src/engine/types.ts','src/engine/feature-rules.ts','src/engine/scroll.ts','src/engine/word-options.ts','src/store/game-store.ts','src/features/ModalLayer.tsx','src/features/ScreenBoundary.tsx','src/features/lazy-screen.ts','src/features/passage/NtContent.tsx','src/features/play/Settings.tsx','src/features/play/Play.tsx','src/features/letters/LetterBox.tsx','src/features/letters/TipLetterView.tsx','src/features/scroll-hint.ts','src/shared/save-file-download.ts','src/shared/storage-notice-state.ts']
for(const x of inv.filter(x=>(x.path.startsWith('src/app/')||x.path.startsWith('src/features/intro/'))&&!/\.test\./.test(x.path)))rootFiles.push(x.path)
for(const f of rootFiles)add(f,'root','current source and integration review; game/store focused shared sections',start.get(f))
const drift=JSON.parse(fs.readFileSync(`${out}/source-drift-at-resume.json`,'utf8'))
const shallow=new Set(['src/render/remaining-furniture-art.ts','src/render/renderer.ts','src/content/life-text.json','src/content/love-commands.json'])
for(const f of [...drift.changed,...drift.added]){
 const x=inv.find(x=>x.path===f);if(!x)continue
 add(f,'root-resumed',shallow.has(f)?'resumed structural/source-delta inspection + current build/registered-renderer tests; not every pixel or data sentence':'resumed current source/call-site review + relevant current tests',x.sha256)
}
for(const x of JSON.parse(fs.readFileSync(`${out}/late-drift.json`,'utf8')))add(x.path,'root-late','late outdoor integration current body/source-delta review; current type + 46 related tests + final 40 audit checks; no native outdoor pixel test',x.sha256)
for(const x of JSON.parse(fs.readFileSync(`${out}/closing-drift.json`,'utf8')))add(x.path,'root-closing','closing current source-delta review + closing type/build and 45 outdoor/room tests; not native preview pixel verification',x.sha256)
const prod=inv.filter(x=>x.path.startsWith('src/')&&/\.tsx?$/.test(x.path)&&!/\.test\.|\.d\.ts$|\/test\/|\/dev\//.test(x.path)&&!x.path.endsWith('/setupTests.ts'))
const rows=prod.map(x=>({path:x.path,sha256:x.sha256,sourceChangedAtResume:start.get(x.path)!==x.sha256,reviews:(reviews.get(x.path)??[]).map(r=>({...r,hashMatchesCurrent:r.reviewedSha256===x.sha256})),status:reviews.has(x.path)?'reviewed-at-documented-depth':'unassigned'}))
fs.writeFileSync(`${out}/coverage-final.json`,JSON.stringify(rows,null,2))
console.log(JSON.stringify({productionModules:prod.length,assigned:rows.filter(x=>x.reviews.length).length,missing:rows.filter(x=>!x.reviews.length).map(x=>x.path),currentHashEvidenceMissing:rows.filter(x=>!x.reviews.some(r=>r.hashMatchesCurrent)).map(x=>x.path),structuralOnlyExamples:rows.filter(x=>x.reviews.every(r=>/structural/.test(r.depth))).slice(0,10).map(x=>x.path)},null,2))
