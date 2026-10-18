import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import assert from 'node:assert/strict'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};const r=n(url,c);if(/\/(nt-loader|ot-catalog)\.ts$/.test(url))return {...r,source:String(r.source).replaceAll('import.meta.glob','(() => ({}))')};return r}})
const source=execFileSync('git',['show','HEAD:src/render/decor.ts'],{encoding:'utf8'}).replaceAll("'../engine/","'../../src/engine/")
const baseline=new URL('./bond-decor-before.ts',import.meta.url);fs.writeFileSync(baseline,source)
const {drawDecor:before}=await import(baseline.href),{drawDecor:after}=await import('../../src/render/decor.ts')
const {newGame}=await import('../../src/engine/game.ts'),{CONTENT}=await import('../../src/content/catalog.ts')
function record(draw,game,weather,t,day){const calls=[],g={fillStyle:'',strokeStyle:'',lineWidth:1,fillRect(...args){calls.push(['rect',this.fillStyle,...args])},beginPath(){calls.push(['begin'])},moveTo(...args){calls.push(['move',...args])},lineTo(...args){calls.push(['line',...args])},stroke(){calls.push(['stroke',this.strokeStyle,this.lineWidth])}};draw(g,game,weather,t,day);return calls}
const game=newGame(CONTENT),names=['bakeryBench','childGarden','grapeTrellis','grandpaBench','stallAwning','pressHandle','oliveGrove','bigBellows','lanterns','kite','loomAwning','moreHives']
let checks=0
for(const level of [0,2,4])for(const weather of ['sunny','rain','wind','snow'])for(const day of [false,true])for(const flags of [{},...names.map(n=>({[`unlock:${n}`]:1})),Object.fromEntries(names.map(n=>[`unlock:${n}`,1]))])for(const t of [0,.6,8]){
 const s={...game,flags:{...flags,villageLevel:level}}
 assert.deepEqual(record(after,s,weather,t,day),record(before,s,weather,t,day));checks++
}
process.stdout.write(JSON.stringify({nativeDecorCommandParity:checks,unchanged:true})+'\n')
