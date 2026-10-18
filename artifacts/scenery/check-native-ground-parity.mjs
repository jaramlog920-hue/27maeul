import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import assert from 'node:assert/strict'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){return n(url,c)}})
const old=await import('./native-ground-before.ts'),now=await import('../../src/render/world-ground-art.ts')
function record(fn,...args){const calls=[],g={fillStyle:'',fillRect(...a){calls.push([this.fillStyle,...a])}};fn(g,...args);return calls}
let groundChecks=0,treeChecks=0
for(const season of ['spring','summer','autumn','winter'])for(const [x,y] of [[0,0],[7,14],[39,29],[20,33],[-1,4],[19,22]])for(const height of [30,40,100])for(const ch of ['.',',','T','f','b','d','h','s','k','D','H','m','A','P','>','X','~','=','u','r','#','_','B','w'])for(const at of [()=>'.',()=>',',(xx,yy)=>(xx+yy)%2===0?',':'.']){
 old.setHeight(height)
 assert.deepEqual(record(now.drawNativeGround,ch,x,y,season,at,height),record(old.drawGround,ch,x,y,season,at));groundChecks++
}
for(const season of ['spring','summer','autumn','winter'])for(let x=0;x<40;x++)for(const y of [0,8,14,29])for(const kind of ['deciduous','evergreen','fruit']){
 assert.deepEqual(record(now.drawTree,x,y,season,kind),record(old.drawTree,x,y,season,kind));treeChecks++
}
process.stdout.write(JSON.stringify({groundChecks,treeChecks,unchanged:true})+'\n')
