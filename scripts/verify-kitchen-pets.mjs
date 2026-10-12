import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const root='assets/kitchen-pets'
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'))
assert.equal(manifest.items.length,14)
assert.equal(manifest.sequences.length,30)
const html=fs.readFileSync(`${root}/preview.html`,'utf8')
let animations=0
for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
 const file=path.resolve(root,url)
 assert(fs.existsSync(file),`Missing preview link ${url}`)
 if(url.includes('/motion/')) {
  const p=fs.readFileSync(file)
  const control=p.indexOf(Buffer.from('acTL'))
  assert(control>0,`Not animated: ${url}`)
  assert.equal(p.readUInt32BE(control+4),4)
  animations++
 }
}
assert.equal(animations,120)
for(const s of manifest.sequences)for(const[d,frames]of Object.entries(s.views)) {
 assert.equal(frames.length,4)
 const hashes=[]
 for(const f of frames) {
  assert(f.duration>=260)
  for(const file of [f.file,...Object.values(f.layers)])assert(fs.existsSync(`${root}/${file}`))
  hashes.push(fs.readFileSync(`${root}/${f.file}`).toString('base64'))
 }
 assert(new Set(hashes).size>1,`${s.id} ${d} has incorrect frame changes`)
}
console.log('14 items, 30 motion sets, 120 animated directions: files and preview links verified')
