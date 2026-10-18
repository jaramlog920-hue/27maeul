import {it,vi} from 'vitest';
import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import * as movement from '../../src/engine/movement';
import {route} from '../../src/engine/neighbors';
import {MAP} from '../../src/engine/world';
it('목장 경로 탐색 비용 기록',()=>{
const spy=vi.spyOn(movement,'findPath'); const rows=[];
for(const blockers of [new Set<string>(),new Set(['4,29','6,29','5,28','5,30'])]) {
spy.mockClear();const start=performance.now();const path=route({x:10,y:30},{x:5,y:29},blockers);
rows.push({blocked:blockers.size>0,ms:performance.now()-start,searches:spy.mock.calls.length,path:path?.length??null});
}
writeFileSync('artifacts/scenery/pasture-route-before.json',JSON.stringify({rows,map:MAP.slice(25,32).map(r=>r.slice(0,14))},null,2));spy.mockRestore();
})
