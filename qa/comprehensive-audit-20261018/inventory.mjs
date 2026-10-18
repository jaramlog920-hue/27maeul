import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root=process.cwd()
const out=path.join(root,'qa/comprehensive-audit-20261018')
fs.mkdirSync(out,{recursive:true})
const ignored=new Set(['.git','node_modules','dist','qa','artifacts','assets','docs','.vercel','.remember','.superpowers'])
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(ignored.has(e.name)?[]:walk(path.join(dir,e.name))):[path.join(dir,e.name)])}
const files=walk(root).filter(f=>!/(\.log|tsbuildinfo)$/.test(f)&&!path.basename(f).startsWith('.env')&&path.basename(f)!=='BUG_AUDIT.md')
const records=files.map(f=>({path:path.relative(root,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}))
fs.writeFileSync(path.join(out,'inventory-start.json'),JSON.stringify(records,null,2))
const prior=path.join(root,'BUG_AUDIT.md')
if(fs.existsSync(prior))fs.copyFileSync(prior,path.join(out,'BUG_AUDIT.previous.md'))
console.log(JSON.stringify({files:records.length,source:records.filter(x=>x.path.startsWith('src/')).length,tests:records.filter(x=>/\.test\.[^.]+$/.test(x.path)).length,byDirectory:Object.fromEntries([...new Set(records.map(x=>x.path.split('/')[0]))].map(k=>[k,records.filter(x=>x.path.split('/')[0]===k).length]))}))
