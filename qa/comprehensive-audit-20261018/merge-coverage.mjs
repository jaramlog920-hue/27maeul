import fs from 'node:fs'
import path from 'node:path'
const out='qa/comprehensive-audit-20261018'
const inv=JSON.parse(fs.readFileSync(`${out}/inventory-resume.json`,'utf8'))
const covered=new Map()
function add(file,owner,depth){if(typeof file!=='string')return;file=file.replaceAll('\\','/');const old=covered.get(file)??[];covered.set(file,[...old,{owner,depth}])}
for(const line of fs.readFileSync(`${out}/economy/coverage.csv`,'utf8').split(/\r?\n/).slice(1)){const cols=[...line.matchAll(/"((?:[^"]|"")*)"/g)].map(m=>m[1].replaceAll('""','"'));if(cols.length)add(cols[0],'economy',cols[2])}
const social=JSON.parse(fs.readFileSync(`${out}/social/COVERAGE.json`,'utf8'))
for(const key of ['engine','features','scene','focusedFiles','supportingRead'])for(const x of Array.isArray(social[key])?social[key]:[]){if(typeof x==='string')add(x,'social','supporting-read');else add(x.path??x.file,'social',x.depth??'focused-source-review')}
const ui=JSON.parse(fs.readFileSync(`${out}/ui/inventory.json`,'utf8'))
for(const x of ui.files)add(x.file,'ui',x.coverage)
const rootFiles=['src/main.tsx','src/engine/game.ts','src/engine/save.ts','src/engine/game-storage.ts','src/engine/feature-rules.ts','src/engine/types.ts','src/engine/maps.ts','src/engine/scroll.ts','src/engine/word-options.ts','src/store/game-store.ts','src/features/ModalLayer.tsx','src/features/ScreenBoundary.tsx','src/features/lazy-screen.ts','src/features/passage/NtContent.tsx','src/features/play/Settings.tsx','src/features/letters/LetterBox.tsx','src/features/letters/TipLetterView.tsx','src/features/scroll-hint.ts','src/shared/save-file-download.ts','src/shared/storage-notice-state.ts','src/dev/test-saves.ts','src/dev/controls-playtest.ts']
for(const x of inv.filter(x=>(x.path.startsWith('src/app/')||x.path.startsWith('src/features/intro/'))&&!/\.test\./.test(x.path)))rootFiles.push(x.path)
for(const f of rootFiles)add(f,'root','source-read-and-integration-review; shared game/store focused, not every line')
const production=inv.filter(x=>x.path.startsWith('src/')&&/\.(ts|tsx)$/.test(x.path)&&!/\.test\.|\.d\.ts$/.test(x.path)&&!x.path.startsWith('src/test/')&&!x.path.startsWith('src/dev/')&&!x.path.endsWith('/setupTests.ts'))
const rows=production.map(x=>({path:x.path,sha256:x.sha256,reviews:covered.get(x.path)??[],status:covered.has(x.path)?'reviewed-at-documented-depth':'unassigned-needs-review'}))
fs.writeFileSync(`${out}/coverage-current.json`,JSON.stringify(rows,null,2))
const missing=rows.filter(x=>!x.reviews.length).map(x=>x.path)
console.log(JSON.stringify({productionModules:rows.length,assigned:rows.length-missing.length,missing},null,2))
