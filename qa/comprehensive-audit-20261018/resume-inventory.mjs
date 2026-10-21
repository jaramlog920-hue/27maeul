import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root=process.cwd(),out=path.join(root,'qa/comprehensive-audit-20261018')
const ignored=new Set(['.git','node_modules','dist','qa','artifacts','assets','docs','.vercel','.remember','.superpowers'])
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(ignored.has(e.name)?[]:walk(path.join(dir,e.name))):[path.join(dir,e.name)])}
const files=walk(root).filter(f=>!/(\.log|tsbuildinfo)$/.test(f)&&!path.basename(f).startsWith('.env')&&path.basename(f)!=='BUG_AUDIT.md')
const records=files.map(f=>({path:path.relative(root,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}))
const base=path.join(out,'inventory-resume.json')
if(!fs.existsSync(base))fs.writeFileSync(base,JSON.stringify(records,null,2))
else{const old=JSON.parse(fs.readFileSync(base,'utf8'));const map=new Map(records.map(x=>[x.path,x.sha256]));const dif=old.filter(x=>map.get(x.path)!==x.sha256).map(x=>x.path);const newFiles=records.filter(x=>!old.some(y=>y.path===x.path)).map(x=>x.path);fs.writeFileSync(path.join(out,'resume-integrity.json'),JSON.stringify({baselineFiles:old.length,changed:dif,added:newFiles},null,2))}
const backup=path.join(out,'BUG_AUDIT.before-resume.md')
if(!fs.existsSync(backup))fs.copyFileSync(path.join(root,'BUG_AUDIT.md'),backup)
console.log(JSON.stringify({files:records.length,tests:records.filter(x=>/\.test\.[^.]+$/.test(x.path)).length}))
