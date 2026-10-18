import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const ids=['date:walk:1','saw:tilly:flower'],drawn=new Set(read('artifacts/scenery/event-art-inventory.json').filter(e=>e.kind||e.authored).map(e=>e.id))
assert.equal(drawn.size,548);for(const id of ids)assert.ok(drawn.has(id))
assert.ok(fs.readFileSync('artifacts/scenery/hill-remainder-tests.log','utf8').includes('6272 passed'))
assert.ok(fs.readFileSync('artifacts/scenery/hill-remainder-partner-tests.log','utf8').includes('1724 passed'))
const build=fs.readFileSync('artifacts/scenery/hill-remainder-build.log','utf8');assert.ok(build.includes('built in'));assert.ok(!build.includes('error TS'))
const link='http://localhost:5173/assets/events/index.html?background=hill-new'
const summary='언덕 길·정자 배경의 잔여 전체2개(date:walk:1, saw:tilly:flower) 완료. 기존 언덕 흙길과 호숫가 정자 노을 배경을 재사용했다. 들꽃 산책은 원래 실제 연인13명의 외형으로 몸을 낮춰 꺾은 뒤 짧은 손 옆에서 내민다. 정자 목격은 틸리의 손톱 크기 쇠꽃→금속 무늬→원문 대사→주머니에 넣고 호숫가로 걷는4단계다. 쇠꽃을 생화나 획득 아이템으로 바꾸지 않는다. 소품은 실제 외형의 손과 주변 몸 윤곽을 읽어 얼굴·머리·몸통 바깥에 둔다. 기본/실제 기록자, 13명 상대와 다음 세대 NPC, 6개 대사 단계와 시작·중간·끝 동작, 가로·휴대폰·썸네일을 시각 확인했다. 3파일6,272검사 통과 후 실제 연인13명 연결 검사를 추가하여 AuthoredStoryScene 1,724개 재검사 통과. 게임·미리보기·썸네일은 같은 drawHillRemainder를 공유하고 미리보기 저장/앨범 불변이다. 산책40분·마음+5·날씨/시간·정자12,32 목격의 19~20시/여름·가을/건조/3단계와 saw:ironFlower 기억 조건을 보존했다. 사전 검사·TypeScript·전체 Vite/PWA 빌드 통과. 실제548개 연결/128개 미제작. 다음은 내 집 마당 배경 잔여 전체4개.'
const plan=read('docs/event-art-remaining-138-plan.json');Object.assign(plan.current,{connected:548,pending:128,completedSincePlanning:10,nextBatch:'yard'})
const runtime=read('artifacts/scenery/hill-remainder-runtime.json')
for(const id of ids){const e=plan.entries.find(e=>e.id===id);Object.assign(e,{status:'완료',renderer:'drawHillRemainder via drawHillEvent',verification:summary,preview:link});if(id==='saw:tilly:flower'){e.trigger.runtimeSighting=runtime;e.cast=['tilly'];e.reuse=['src/render/sunset-background.ts']}else{e.trigger.date={place:'walk',minutes:40,heartGain:5,from:360,to:1170,dry:true,candidates:13};e.reuse=['src/render/pasture-ground.ts']}}
for(const g of plan.groups){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
assert.equal(plan.entries.filter(e=>e.status!=='완료').length,128);write('docs/event-art-remaining-138-plan.json',plan)
const ledger=read('docs/event-art-background-groups.json');for(const g of ledger.groups){for(const e of g.entries)if(ids.includes(e.id))Object.assign(e,{status:'완료',renderer:'drawHillRemainder',needsLocationCheck:false,basis:summary});g.completed=g.entries.filter(e=>drawn.has(e.id)).length;g.pending=g.entries.length-g.completed}
for(const g of ledger.productionBatches??[]){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
Object.assign(ledger,{drawn:548,pending:128,note:'새 기획 나루·광장·항구·대장간·언덕/정자 잔여 전체 완료. 다음 내 집 마당 전체4개. 임의 개수 제한 없음.'});assert.equal(ledger.groups.reduce((n,g)=>n+g.pending,0),128);write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');for(const e of selection.entries)if(ids.includes(e.id))Object.assign(e,{status:'기존 그림 유지',owner:'이 창'});Object.assign(selection,{existing:548,pending:128,counts:Object.fromEntries(['dialogue','illustration','event'].map(t=>[t,selection.entries.filter(e=>e.tier===t&&!drawn.has(e.id)).length]))});write('docs/event-art-selection.json',selection)
const md='docs/event-art-remaining-138-plan.md';let s=fs.readFileSync(md,'utf8').replace('현재546개 연결/130개 미제작','현재548개 연결/128개 미제작').replace('다음 언덕 길·정자 전체2개.','다음 내 집 마당 전체4개.').replace('완료된8개도','완료된10개도').replace('항구 여행·대장간 전체 완료 →','항구 여행·대장간·언덕/정자 전체 완료 →')
for(const id of ids){const a=s.indexOf('— `'+id+'`'),b=s.indexOf('\n##',a+1);assert.ok(a>=0&&b>a);s=s.slice(0,a)+s.slice(a,b).replace('- 상태: 미제작.','- 상태: 완료 (전 대사·동작·실제 연인13명·가로/휴대폰/썸네일·관련 검사·전체 빌드 통과).')+s.slice(b)}
s+='\n\n## 언덕 길·정자 배경 잔여 전체 검증 결과\n\n'+summary+'\n\n언덕 그림 모음: '+link+'\n';fs.writeFileSync(md,s)
for(const [p,from,to] of [['docs/event-art-production-plan.md','현재 546/676개 연결, 130개 미제작.','현재 548/676개 연결, 128개 미제작.'],['docs/event-art-progress.md','## 완료 435','## 완료 437']]){s=fs.readFileSync(p,'utf8').replace(from,to).replace('실제 그림 연결 546개, 남은 130개.','실제 그림 연결 548개, 남은 128개.').replace('| 현재 위치·장소 확인 대기 | 131 |','| 현재 위치·장소 확인 대기 | 128 |');s+='\n\n## 2026-10-15 언덕 길·정자 배경 잔여 전체 완료\n\n'+summary+'\n\n모음 '+link+'\n';fs.writeFileSync(p,s)}
const sm='docs/event-art-selection.md';s=fs.readFileSync(sm,'utf8').replace('현재 실제 연결 546개, 미제작 130개.','현재 실제 연결 548개, 미제작 128개.');fs.writeFileSync(sm,s)
console.log('548 connected / 128 pending. Complete remaining hill group. Next whole yard group: 4.')
