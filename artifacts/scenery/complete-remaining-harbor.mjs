import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const inv=read('artifacts/scenery/event-art-inventory.json'),drawn=new Set(inv.filter(e=>e.kind||e.authored).map(e=>e.id)),id='trip:harbor'
assert.equal(drawn.size,545);assert.ok(drawn.has(id))
assert.ok(fs.readFileSync('artifacts/scenery/harbor-trip-integrated-tests.log','utf8').includes('1991 passed'))
assert.ok(fs.readFileSync('artifacts/scenery/harbor-trip-flow-tests.log','utf8').includes('4 passed'))
assert.ok(fs.readFileSync('artifacts/scenery/harbor-trip-build.log','utf8').includes('built in'))
assert.ok(fs.readFileSync('artifacts/scenery/harbor-trip-integrated-build.log','utf8').includes('built in'))
const link='http://localhost:5173/assets/events/index.html?background=travel-new'
const summary='항구 여행 배경의 잔여 전체 trip:harbor 완료. 기존 여행 마을 돌길·낮은 집 배경과 원래 배 도트를 재사용해 항구 도착(돛대·갈매기·좌판)→골목 빵집 주인이 봇짐을 봄→파피의 옛 반죽 이야기→빵을 종이에 싸 주는 마지막 컷을 구현했다. 이름 없는 현지 성인 주인을 원래 마을 NPC나 친족으로 바꾸지 않았다. 봇짐은 발 옆 바닥에 두고 기록자가 다가가도 그 자리에 남겨 몸통·발을 가리지 않는다. 기본/실제 플레이어 외형, 원문4대사와 걷기 시작·중간·끝을 가로·휴대폰·썸네일에서 시각 확인했다. 실제 게임 TravelView에 첫 방문 원문별 같은 AuthoredStoryScene을 연결하고 마지막에 기존 희귀품 가게로 이어지게 했다. 기존 언덕 여행도 같은 실제 화면 연결을 사용하며 이미 만든 그림은 재제작하지 않았다. 재방문은 원래대로 첫 이야기를 반복하지 않고 가게로 간다. 통합4파일1,991개 검사 및 실제 게임4단계→가게→귀환 흐름4개 재검사 통과. 기존 앨범 그림을 보존하고 미리보기는 저장·앨범을 변경하지 않는다. 배삯25닢·숙박10닢·빵1개·wendell 마음+5·다음 날 아침 귀환 조건은 엔진 그대로다. 사전 검사·TypeScript·전체 Vite/PWA 빌드 통과. 실제545개 연결/131개 미제작. 다음은 새 기획 대장간·틸리 창문 배경의 잔여 전체1개.'
const plan=read('docs/event-art-remaining-138-plan.json');Object.assign(plan.current,{connected:545,pending:131,completedSincePlanning:7,nextBatch:'forge'})
Object.assign(plan.entries.find(e=>e.id===id),{status:'완료',renderer:'drawHarborTrip via drawTravelEvent',verification:summary,preview:link})
for(const g of plan.groups){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
plan.travelGameIntegration={path:'src/features/talk/TravelView.tsx → AuthoredStoryScene → drawAuthoredStory → drawTravelEvent',preserved:'처음 방문만 원문별 그림, 재방문은 가게. 기존 가격·상품·수확·귀환/일지·앨범 정산 유지. 미리보기 저장 불변.',review:'React 체크: 모든 hooks는 분기 전, 목적지별 페이지를 로컬 상태로 관리, 함수형 setState, 원문 aria-live 및 기본 button, 효과 cleanup은 공통 AuthoredStoryScene 유지.'}
assert.equal(plan.entries.filter(e=>e.status!=='완료').length,131);write('docs/event-art-remaining-138-plan.json',plan)
const ledger=read('docs/event-art-background-groups.json')
for(const g of ledger.groups){for(const e of g.entries)if(e.id===id)Object.assign(e,{status:'완료',renderer:'drawHarborTrip',needsLocationCheck:false,basis:summary});g.count=g.entries.length;g.completed=g.entries.filter(e=>drawn.has(e.id)).length;g.pending=g.count-g.completed}
for(const g of ledger.productionBatches??[]){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
Object.assign(ledger,{drawn:545,pending:131,note:'새 전체 기획에서 나루2개·광장/큰길4개·항구여행 잔여 전체 완료. 다음은 대장간·틸리 창문 묶음. 임의 소수 제한 없음.'});assert.equal(ledger.groups.reduce((n,g)=>n+g.pending,0),131);write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');Object.assign(selection.entries.find(e=>e.id===id),{status:'기존 그림 유지',owner:'이 창'});Object.assign(selection,{existing:545,pending:131,counts:Object.fromEntries(['dialogue','illustration','event'].map(t=>[t,selection.entries.filter(e=>e.tier===t&&!drawn.has(e.id)).length]))});write('docs/event-art-selection.json',selection)
const md='docs/event-art-remaining-138-plan.md';let s=fs.readFileSync(md,'utf8').replace('현재544개 연결/132개 미제작','현재545개 연결/131개 미제작').replace('다음 항구 여행 전체1개.','다음 대장간·틸리 창문 전체1개.').replace('완료된6개도 이력을 유지한다.','완료된7개도 이력을 유지한다.')
s=s.replace('**나루 전체2개·광장/큰길 전체4개 완료 →','**나루 전체2개·광장/큰길 전체4개·항구 여행 전체 완료 →')
const start=s.indexOf('— `'+id+'`'),end=s.indexOf('\n## ',start+1);assert.ok(start>=0&&end>start);s=s.slice(0,start)+s.slice(start,end).replace('- 상태: 미제작.','- 상태: 완료 (원문4단계·실제 여행 화면 연결·가로/휴대폰/썸네일·검사·전체 빌드 통과).')+s.slice(end)
s+='\n\n## 항구 여행 배경 잔여 전체 검증 결과\n\n'+summary+'\n\n여행 그림 모음: '+link+'\n';fs.writeFileSync(md,s)
const canonical='docs/event-art-production-plan.md';s=fs.readFileSync(canonical,'utf8').replace('현재 544/676개 연결, 132개 미제작.','현재 545/676개 연결, 131개 미제작.').replace('실제 그림 연결 544개, 남은 132개.','실제 그림 연결 545개, 남은 131개.').replace('| 이웃 마을·여행 | 1 |','| 이웃 마을·여행 | 0 |');s+='\n\n2026-10-15 항구 여행 배경 잔여 전체 완료: '+summary+'\n모음 '+link+'\n';fs.writeFileSync(canonical,s)
const progress='docs/event-art-progress.md';s=fs.readFileSync(progress,'utf8').replace('## 완료 433','## 완료 434');s+='\n\n## 2026-10-15 항구 여행 배경 잔여 전체 완료\n\n'+summary+'\n\n모음 '+link+'\n';fs.writeFileSync(progress,s)
const selectionMd='docs/event-art-selection.md';s=fs.readFileSync(selectionMd,'utf8').replace('현재 실제 연결 544개, 미제작 132개.','현재 실제 연결 545개, 미제작 131개.');fs.writeFileSync(selectionMd,s)
console.log('545 connected / 131 pending. Entire remaining harbor batch complete. Next: forge.')
