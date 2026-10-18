import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const ids=['companionJoined','strays','homeMailbox','reedRack'],drawn=new Set(read('artifacts/scenery/event-art-inventory.json').filter(e=>e.kind||e.authored).map(e=>e.id))
assert.equal(drawn.size,552);for(const id of ids)assert.ok(drawn.has(id))
assert.ok(fs.readFileSync('artifacts/scenery/home-yard-integrated-tests.log','utf8').includes('2253 passed'))
const build=fs.readFileSync('artifacts/scenery/home-yard-build.log','utf8');assert.ok(build.includes('built in')&&build.includes('dist/sw.js'));assert.ok(!build.includes('error TS'))
const link='http://localhost:5173/assets/events/index.html?background=yard-new'
const summary='내 집 마당 배경의 잔여 전체4개(companionJoined, strays, homeMailbox, reedRack) 완료. 기존 마당 벽·기와·울타리와 실제 새끼 동물 도트를 재사용했다. 입양 전 두 동물/입양 후 실제 종류·이름과 물 긷는 아이의 반대 동물/문 왼쪽 편지함 설치/기존 갈대 틀의 종이와 어부 손 인사·귀환을 원문11행에 맞췄다. 동물 두 분기 모두 다른 이동 줄을 쓰고 이미 도착한 내 동물은 다음 대사에서 제자리에 남아 사람·동물의 얼굴과 몸·발을 가리지 않는다. 대사창 위에 모든 발이 보이도록 배치를 확인했다. 저장된 갈대 틀3자리와 거둔 상태를 읽기 전용으로 반영하며 집·울타리 상대 위치만 이동하고 하늘·땅에는 빈 띠를 만들지 않는다. homeMailbox는 현재 폐기된 옛 장면이므로 미리보기 원문만 그리며 현행 편지 바구니/해금·우편 동작은 복구하거나 바꾸지 않는다. 게임·미리보기·썸네일 동일 drawHomeYardEvent 연결, 기본/실제 플레이어·실제 이웃/아이·다음 세대 외형과 11행의 동작 시작/중간/끝을 가로·휴대폰·썸네일에서 확인했다. 실제 ModalLayer 전 대사 흐름, 저장/앨범 불변, 두 입양 분기, 옮긴 틀, 동물끼리/사람과의 가림, 기존 동물·우편·마당 엔진 회귀를 포함한8파일2,253검사 통과. 사전 검사·TypeScript·전체 Vite/PWA 빌드 통과. 실제552개 연결/124개 미제작.'
const plan=read('docs/event-art-remaining-138-plan.json');Object.assign(plan.current,{connected:552,pending:124,completedSincePlanning:14,nextBatch:'family-room'})
for(const id of ids){const e=plan.entries.find(e=>e.id===id);Object.assign(e,{status:'완료',renderer:'drawHomeYardEvent via drawAuthoredStory',verification:summary,preview:link});delete e.workInProgress}
// Same reusable room background is one production batch, preserving each original room/context.
const merged=plan.groups.filter(g=>['home','dinner-child'].includes(g.id));assert.equal(merged.length,2)
plan.batchMergeHistory=[...(plan.batchMergeHistory??[]),{date:'2026-10-16',reason:'사용자 재강조: 같은 배경 전체를 묶어 제작. 같은 family-room-background 자산의 병상·아이네 저녁을 한 제작 묶음으로 합침. 실제 장소 배치·인물·조건은 사건별 유지.',previous:merged}]
const family={id:'family-room',name:'가족 방 배경 전체 (병상·아이네 저녁)',assets:['src/render/family-room-background.ts'],context:'동일 배경 자산을 함께 제작하되 sick는 유저의 실제 잠자리, dinner:child는 ROOMS.child의 배움 탁자/침대/화덕으로 구분. 각 원문·인물·보상·시간 보존.',entries:merged.flatMap(g=>g.entries),completed:0,pending:2}
plan.groups=plan.groups.flatMap(g=>g.id==='home'?[family]:g.id==='dinner-child'?[]:[g])
for(const e of plan.entries)if(['home','dinner-child'].includes(e.batch))e.batch='family-room'
for(const g of plan.groups){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
assert.equal(plan.entries.filter(e=>e.status!=='완료').length,124);assert.equal(plan.groups.reduce((n,g)=>n+g.pending,0),124);write('docs/event-art-remaining-138-plan.json',plan)
const ledger=read('docs/event-art-background-groups.json');for(const g of ledger.groups){for(const e of g.entries)if(ids.includes(e.id))Object.assign(e,{status:'완료',renderer:'drawHomeYardEvent',needsLocationCheck:false,basis:summary});g.completed=g.entries.filter(e=>drawn.has(e.id)).length;g.pending=g.entries.length-g.completed}
ledger.productionBatches=(ledger.productionBatches??[]).flatMap(g=>g.id==='home'?[{id:family.id,name:family.name,entries:family.entries,completed:0,pending:2}]:g.id==='dinner-child'?[]:[g])
for(const g of ledger.productionBatches){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
Object.assign(ledger,{drawn:552,pending:124,note:'마당 잔여 전체4개 완료. 다음은 같은 가족 방 배경 자산의 병상·아이네 저녁 전체 묶음. 임의 1~2개 제한 없음.'});write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');for(const e of selection.entries){if(ids.includes(e.id))Object.assign(e,{status:'기존 그림 유지',owner:'이 창'});if(['sick','dinner:child'].includes(e.id))e.productionBatch='family-room'}
Object.assign(selection,{existing:552,pending:124,counts:Object.fromEntries(['dialogue','illustration','event'].map(t=>[t,selection.entries.filter(e=>e.tier===t&&!drawn.has(e.id)).length]))});write('docs/event-art-selection.json',selection)
const md='docs/event-art-remaining-138-plan.md';let s=fs.readFileSync(md,'utf8').replace('현재548개 연결/128개 미제작','현재552개 연결/124개 미제작').replace('다음 내 집 마당 전체4개.','다음 가족 방 배경 전체(병상·아이네 저녁).').replace('완료된10개도','완료된14개도').replace('항구 여행·대장간·언덕/정자 전체 완료 →','항구 여행·대장간·언덕/정자·마당 전체 완료 →')
for(const id of ids){const a=s.indexOf('— `'+id+'`'),b=s.indexOf('\n##',a+1);assert.ok(a>=0&&b>a);s=s.slice(0,a)+s.slice(a,b).replace('- 상태: 미제작.','- 상태: 완료 (같은 마당 잔여4개 함께 연결·전 대사/동작·가로/휴대폰/썸네일·관련 검사·전체 빌드 통과).')+s.slice(b)}
s=s.replace('| 7 | 내 집 병상 전체 | 1 |','| 7 | 가족 방 배경 전체 (병상·아이네 저녁) | 2 |').replace('| 8 | 아이네 집 저녁 전체 | 1 |','| 8 | 7번과 통합 (옛 분류 이력) | 0 |')
s+='\n\n## 2026-10-16 마당 배경 잔여 전체 완료\n\n'+summary+'\n\n모음: '+link+'\n\n다음 제작은 같은 가족 방 배경 자산을 쓰는 `sick`·`dinner:child` 전체 묶음이다. 종전7·8번은 한 묶음으로 합쳤다. 실제 집/아이네 방 배치와 대사·시간·보상은 각각 보존한다. 아래 과거 제작 중 기록은 이 완료 기록으로 대체한다.\n';fs.writeFileSync(md,s)
for(const [p,from,to] of [['docs/event-art-production-plan.md','현재 548/676개 연결, 128개 미제작.','현재 552/676개 연결, 124개 미제작.'],['docs/event-art-progress.md','## 완료 437','## 완료 441']]){s=fs.readFileSync(p,'utf8').replace(from,to).replace('실제 그림 연결 548개, 남은 128개.','실제 그림 연결 552개, 남은 124개.').replace('| 현재 위치·장소 확인 대기 | 128 |','| 현재 위치·장소 확인 대기 | 124 |');s+='\n\n## 2026-10-16 내 집 마당 배경 잔여 전체4개 완료\n\n'+summary+'\n\n모음 '+link+'\n다음: 가족 방 배경 전체(sick·dinner:child 묶음).\n';fs.writeFileSync(p,s)}
const sm='docs/event-art-selection.md';s=fs.readFileSync(sm,'utf8').replace('현재 실제 연결 548개, 미제작 128개.','현재 실제 연결 552개, 미제작 124개.');fs.writeFileSync(sm,s)
const audit='docs/event-art-yard-batch-audit.md';s=fs.readFileSync(audit,'utf8');s+='\n\n## 2026-10-16 전체 완료 검증\n\n'+summary+'\n\n이 문서의 위 제작 중/대기 항목은 모두 완료했다. React 검토: hooks를 모든 분기 앞에 유지, 동물 이동 좌표 대신 종류/이름·마당 좌표만 구독, 공통 RAF cleanup 유지, 분류 버튼 aria-pressed·기존 대사 UI 유지, 추가 상태 쓰기/렌더 중 부작용 없음. 모음 '+link+'\n';fs.writeFileSync(audit,s)
console.log('Entire yard group complete: 552 connected / 124 pending. Next: whole shared family-room batch.')
