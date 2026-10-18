import path from 'node:path'
import {registerHooks} from 'node:module'
import assert from 'node:assert/strict'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)}})
const {drawOldWall}=await import('./native-room-wall-before.ts'),{drawNativeRoomWall}=await import('../../src/render/world-ground-art.ts')
function record(fn,...args){const calls=[],g={fillStyle:'',fillRect(...a){calls.push([this.fillStyle,...a])}};fn(g,...args);return calls}
let cases=0
for(const [x,y] of [[16,112],[20,110],[31,115]])for(const n of ['#','S','N','f','_','D'])for(const e of ['#','S','N','f','_','D'])for(const s of ['#','S','N','f','_','D'])for(const w of ['#','S','N','f','_','D']){
 const tiles={[`${x},${y-1}`]:n,[`${x+1},${y}`]:e,[`${x},${y+1}`]:s,[`${x-1},${y}`]:w},at=(xx,yy)=>tiles[`${xx},${yy}`]??'#'
 assert.deepEqual(record(drawNativeRoomWall,x,y,at),record(drawOldWall,x,y,at));cases++
}
process.stdout.write(JSON.stringify({nativeRoomWallParity:cases,unchanged:true})+'\n')
