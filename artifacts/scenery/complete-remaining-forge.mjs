import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const drawn=new Set(read('artifacts/scenery/event-art-inventory.json').filter(e=>e.kind||e.authored).map(e=>e.id)),id='saw:forge:handle'
assert.equal(drawn.size,546);assert.ok(drawn.has(id))
assert.ok(fs.readFileSync('artifacts/scenery/smith-handle-tests.log','utf8').includes('2141 passed'))
const build=fs.readFileSync('artifacts/scenery/smith-handle-build.log','utf8');assert.ok(build.includes('built in'));assert.ok(!build.includes('error TS'))
const runtime=read('artifacts/scenery/smith-handle-runtime.json');assert.deepEqual(runtime.at,{x:6,y:125})
const link='http://localhost:5173/assets/events/index.html?background=smith-new'
const summary='대장간·틸리 창문 배경의 잔여 전체 saw:forge:handle 완료. 공동주택 기존 위층 창 도트와 기존 목재 벽·바닥을 재사용해 창 아래 자루 내려놓기→잎사귀 음각 무늬→헛기침 후 아래층 대장간 안으로 돌아가기 3행을 구현했다. 창 컷에는 틸리나 목격자를 억지로 넣지 않고 자루는 창 아래에 남긴다. 얼굴·몸통·짧은 팔·발과 자루를 분리하고 같은 배율을 유지한다. 썸네일은 같은 렌더러의 무늬 컷을 사용한다. 원본 좌표22,125는 setPeopleData/lodgingNpcSpot에서 실제6,125로 정규화됨을 런타임 allSightings로 확인했다. 새벽300~390분·forge 12일 위상·saw:handle 기억·원문·엔진 조건은 유지했다. 기본/실제 플레이어, 다음 세대 NPC 외형, 3행과 동작0/.45/1.1/1.8/8초를 가로·휴대폰·썸네일에서 확인했다. 실제 게임의 기존 AuthoredStoryScene 등록 경로와 저장 없는 공통 미리보기 연결 확인. 관련3파일2,141검사, 사전 검사·TypeScript·전체 Vite/PWA 빌드 통과. 실제546개 연결/130개 미제작. 다음은 언덕 길·정자 배경 잔여 전체2개.'
const plan=read('docs/event-art-remaining-138-plan.json');Object.assign(plan.current,{connected:546,pending:130,completedSincePlanning:8,nextBatch:'hill'})
const e=plan.entries.find(e=>e.id===id);Object.assign(e,{status:'완료',background:'원본22,125 → 런타임 정규화6,125(공동주택 아래층 대장간). 서술 속 틸리 위층 창문 컷 후 실제 대장간 귀환. 엔진 위치 불변.',reuse:['src/render/forge-room-background.ts','src/render/lodging-art.ts'],design:'기존 위층 창 아래에서 자루를 세움→물러서 잎사귀 음각을 보여줌→헛기침과 대장간 귀환. 틸리는 등장하지 않음. 무늬 컷을 썸네일로 공유.',renderer:'drawSmithHandle via drawSmithEvent',verification:summary,preview:link})
e.trigger.runtimeSighting=runtime;e.cast=['smith']
for(const g of plan.groups){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
assert.equal(plan.entries.filter(e=>e.status!=='완료').length,130);write('docs/event-art-remaining-138-plan.json',plan)
const ledger=read('docs/event-art-background-groups.json')
for(const g of ledger.groups){for(const e of g.entries)if(e.id===id)Object.assign(e,{status:'완료',renderer:'drawSmithHandle',needsLocationCheck:false,basis:summary});g.completed=g.entries.filter(e=>drawn.has(e.id)).length;g.pending=g.entries.length-g.completed}
for(const g of ledger.productionBatches??[]){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
Object.assign(ledger,{drawn:546,pending:130,note:'새 전체 기획 나루2·광장4·항구1·대장간1 잔여 전체 완료. 다음 언덕 길·정자 전체2개. 임의 소수 제한 없음.'});assert.equal(ledger.groups.reduce((n,g)=>n+g.pending,0),130);write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');Object.assign(selection.entries.find(e=>e.id===id),{status:'기존 그림 유지',owner:'이 창'});Object.assign(selection,{existing:546,pending:130,counts:Object.fromEntries(['dialogue','illustration','event'].map(t=>[t,selection.entries.filter(e=>e.tier===t&&!drawn.has(e.id)).length]))});write('docs/event-art-selection.json',selection)
const md='docs/event-art-remaining-138-plan.md';let s=fs.readFileSync(md,'utf8').replace('현재545개 연결/131개 미제작','현재546개 연결/130개 미제작').replace('다음 대장간·틸리 창문 전체1개.','다음 언덕 길·정자 전체2개.').replace('완료된7개도','완료된8개도').replace('항구 여행 전체 완료 →','항구 여행·대장간 전체 완료 →').replace('대장간 자루의 22,125 트리거와 틸리 창문 원문 차이','대장간 자루의 원본22,125→실제6,125 정규화와 틸리 창문 원문 차이')
const start=s.indexOf('— `'+id+'`'),end=s.indexOf('\n## ',start+1);assert.ok(start>=0&&end>start);s=s.slice(0,start)+s.slice(start,end).replace('- 상태: 미제작.','- 상태: 완료 (3행·동작 전 구간·가로/휴대폰/썸네일·2,141검사·전체 빌드 통과).')+s.slice(end)
s+='\n\n## 대장간·틸리 창문 배경 잔여 전체 검증 결과\n\n'+summary+'\n\n대장간 그림 모음: '+link+'\n';fs.writeFileSync(md,s)
const canonical='docs/event-art-production-plan.md';s=fs.readFileSync(canonical,'utf8').replace('현재 545/676개 연결, 131개 미제작.','현재 546/676개 연결, 130개 미제작.').replace('실제 그림 연결 545개, 남은 131개.','실제 그림 연결 546개, 남은 130개.');s+='\n\n2026-10-15 대장간·틸리 창문 잔여 전체 완료: '+summary+'\n모음 '+link+'\n';fs.writeFileSync(canonical,s)
const progress='docs/event-art-progress.md';s=fs.readFileSync(progress,'utf8').replace('## 완료 434','## 완료 435');s+='\n\n## 2026-10-15 대장간·틸리 창문 배경 잔여 전체 완료\n\n'+summary+'\n\n모음 '+link+'\n';fs.writeFileSync(progress,s)
const sm='docs/event-art-selection.md';s=fs.readFileSync(sm,'utf8').replace('현재 실제 연결 545개, 미제작 131개.','현재 실제 연결 546개, 미제작 130개.');fs.writeFileSync(sm,s)
console.log('546 connected / 130 pending. Entire remaining forge batch complete. Next: hill (whole 2).')
