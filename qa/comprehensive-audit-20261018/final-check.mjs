import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {spawnSync} from 'node:child_process'
const root=process.cwd(),out=path.join(root,'qa/comprehensive-audit-20261018')
const baseline=JSON.parse(fs.readFileSync(path.join(out,'inventory-start.json'),'utf8'))
const changed=baseline.flatMap(x=>{const p=path.join(root,x.path);if(!fs.existsSync(p))return[{path:x.path,change:'removed'}];const hash=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');return hash===x.sha256?[]:[{path:x.path,change:'modified'}]})
fs.writeFileSync(path.join(out,'source-integrity.json'),JSON.stringify({baselineFiles:baseline.length,changed},null,2))
const scripts=baseline.filter(x=>x.path.startsWith('scripts/')&&/\.mjs$/.test(x.path))
const syntax=scripts.map(x=>{const r=spawnSync(process.execPath,['--check',x.path],{encoding:'utf8'});return{path:x.path,exit:r.status,error:r.error?.message??(r.status===0?undefined:r.stderr)}})
fs.writeFileSync(path.join(out,'script-syntax.json'),JSON.stringify(syntax,null,2))
console.log(JSON.stringify({baseline:baseline.length,changed,scriptSyntax:{total:syntax.length,failed:syntax.filter(x=>x.exit!==0)}}))
