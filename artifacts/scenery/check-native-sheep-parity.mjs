import fs from 'node:fs';import path from 'node:path';import {registerHooks} from 'node:module';import assert from 'node:assert/strict'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?s+'.ts':s,c)},load(u,c,n){if(u.endsWith('.json'))return {format:'module',source:'export default '+fs.readFileSync(new URL(u),'utf8'),shortCircuit:true};return n(u,c)}})
const {villageSheepFrames}=await import('../../src/render/village-sheep-frame.ts'),{sheepCount}=await import('../../src/render/decor.ts')
const source=fs.readFileSync(new URL('./native-sheep-before.txt',import.meta.url),'utf8').replace(/items\.push\(\{ y, paint:.*\}\)/,'out.push({x,y,side,action,frame:f})')
const before=Function('game','t','sheepCount','const out=[];'+source+';return out')
let cases=0;for(const flag of [0,1,2])for(let tick=0;tick<=360;tick++){
 const flags={'unlock:penBig':flag},t=tick/10;assert.deepEqual(villageSheepFrames(flags,t),before({flags},t,sheepCount));cases++
}
process.stdout.write(JSON.stringify({nativeSheepParity:cases,unchanged:true})+'\n')
