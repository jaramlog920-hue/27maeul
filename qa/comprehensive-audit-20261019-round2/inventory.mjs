import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root=process.cwd(), out=path.join(root,'qa/comprehensive-audit-20261019-round2')
const ignored=new Set(['.git','node_modules','dist','qa','.vercel','.remember','.superpowers','.claude'])
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(ignored.has(e.name)?[]:walk(path.join(dir,e.name))):[path.join(dir,e.name)])}
const all=walk(root).filter(f=>!/(\.log|tsbuildinfo|\.zip)$/.test(f)&&!path.basename(f).startsWith('.env')&&path.basename(f)!=='BUG_AUDIT.md')
const files=all.map(f=>({path:path.relative(root,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}))
const source=files.filter(f=>!f.path.startsWith('docs/')&&!f.path.startsWith('artifacts/')&&(!f.path.startsWith('assets/')||/\.(m?[jt]sx?|html|css|json)$/.test(f.path)))
const base=path.join(out,'source-start.json')
if(!fs.existsSync(base)){
 fs.writeFileSync(base,JSON.stringify(source,null,2));fs.writeFileSync(path.join(out,'inventory-all.json'),JSON.stringify(files,null,2))
 fs.copyFileSync(path.join(root,'BUG_AUDIT.md'),path.join(out,'BUG_AUDIT.before-round2.md'))
}else{
 const old=JSON.parse(fs.readFileSync(base,'utf8')),now=new Map(source.map(x=>[x.path,x.sha256]))
 fs.writeFileSync(path.join(out,'source-integrity.json'),JSON.stringify({checkedAt:new Date().toISOString(),baselineFiles:old.length,changed:old.filter(x=>now.get(x.path)!==x.sha256).map(x=>x.path),added:source.filter(x=>!old.some(y=>y.path===x.path)).map(x=>x.path)},null,2))
}
const prior=JSON.parse(fs.readFileSync(path.join(root,'qa/comprehensive-audit-20261018/inventory-resume.json'),'utf8')),now=new Map(source.map(x=>[x.path,x.sha256]))
fs.writeFileSync(path.join(out,'drift-since-prior.json'),JSON.stringify({changed:prior.filter(x=>now.get(x.path)!==x.sha256).map(x=>x.path),added:source.filter(x=>!prior.some(y=>y.path===x.path)).map(x=>x.path)},null,2))
console.log(JSON.stringify({allFiles:files.length,source:source.length,src:source.filter(x=>x.path.startsWith('src/')).length,tests:source.filter(x=>/\.test\.[^.]+$/.test(x.path)).length,productionModules:source.filter(x=>x.path.startsWith('src/')&&/\.tsx?$/.test(x.path)&&!/(\.test\.|\/test\/|\/dev\/|\.d\.ts$)/.test(x.path)).length,top:files.reduce((a,x)=>(a[x.path.split('/')[0]]=(a[x.path.split('/')[0]]||0)+1,a),{})},null,2))
