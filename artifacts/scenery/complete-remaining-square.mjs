import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const inventory=read('artifacts/scenery/event-art-inventory.json'),drawn=new Set(inventory.filter(e=>e.kind||e.authored).map(e=>e.id))
const ids=['village:1','village:2','saw:bread:swap','village:4'];assert.equal(drawn.size,544);ids.forEach(id=>assert.ok(drawn.has(id)))
assert.ok(fs.readFileSync('artifacts/scenery/square-remainder-final-tests.log','utf8').includes('4321 passed'))
assert.ok(fs.readFileSync('artifacts/scenery/square-remainder-build.log','utf8').includes('built in'))
const link='http://localhost:5173/assets/events/play.html?event=village%3A1&sequence=village%3A1%2Cvillage%3A2%2Csaw%3Abread%3Aswap%2Cvillage%3A4'
const verification='광장·큰길 묶음의 잔여 전체4개(꽃길 village:1 / 오가는 발길 village:2 / 장터의 비밀 saw:bread:swap / 정든 마을 village:4) 완료. 꽃길은 실제 decor.ts의 북쪽 큰길 양 가장자리 꽃 모양·색을 기존 집 앞 길 배경에 재사용하고, 오가는 발길은 실제 빵집 문 앞 노크와 이웃3명의 기본 짧은 팔 인사를 구현했다. 정든 마을은 현재 세대의 baker/grandpa/child와 인사 말풍선·원래 손 흔들기 자세를 사용한다. 장터의 비밀은 실제 명칭 대응(poppy=웬델, wendell=파피)을 유지해 왼쪽 빵 구입→오른쪽 과자 구입→광장 양끝에서 한 입 베어 문 결과를 구현했다. 모자는 원래 머리 실루엣 위에 접지하고 음식을 얼굴 바깥에 놓았다. 원래 정오 목격 조건과 장 마감 원문을 수정하지 않았다. 원문9개 대사 단계 전체와 걷기/노크 동작의 시작·중간·끝을 기본/실제 플레이어 외형의 시트, 휴대폰, 실제 통합 가로/휴대폰 미리보기와 썸네일에서 확인했다. 교체 세대 외형·짧은 팔·얼굴·몸통·발 접지 및 미리보기 저장/앨범 불변·기존 앨범 그림 보존을 포함한 관련4파일4,321개 검사 통과. 사전 검사·TypeScript·전체 Vite/PWA 빌드 통과. 원래 대사·시간·호감도·보상·해금·목격 기록은 엔진 그대로다. 실제544개 연결/132개 미제작. 다음은 새 계획의 항구 여행 잔여 전체1개.'
const plan=read('docs/event-art-remaining-138-plan.json');assert.equal(plan.groups.find(g=>g.id==='square').entries.length,4)
Object.assign(plan.current,{connected:544,pending:132,completedSincePlanning:6,nextBatch:'travel'})
for(const e of plan.entries)if(ids.includes(e.id)){
 Object.assign(e,{status:'완료',renderer:'drawSquareRemainder',verification,preview:link})
 if(e.id==='village:1'){e.reuse=['src/render/home-yard-background.ts','src/render/decor.ts'];e.background='실제 decor.ts 큰길 북쪽 골목 y8/11 양 가장자리. 집 앞 길의 재사용 배경과 원래 세 점 꽃 도트를 결합; 광장 우물로 강제 이동 없음.'}
 if(e.id==='village:2')e.reuse=['src/render/bakery-front-background.ts']
 if(e.id.startsWith('village:'))e.trigger={path:'src/engine/game.ts goToSleep / bonds.villageLevel',heartsTotalThreshold:({'village:1':100,'village:2':220,'village:4':520})[e.id],location:'아침 큐 위치를 유지하는 마을 풍경 삽입 컷',flags:'villageLevel',album:'기존 원문 album 기록 유지; 새 사진은 빈 이미지에만 저장'}
}
for(const g of plan.groups){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
plan.groups.find(g=>g.id==='square').assets=['src/render/market-square-background.ts','src/render/home-yard-background.ts','src/render/bakery-front-background.ts','src/render/decor.ts']
assert.equal(plan.entries.filter(e=>e.status!=='완료').length,132);write('docs/event-art-remaining-138-plan.json',plan)
const ledger=read('docs/event-art-background-groups.json'),square=ledger.groups.find(g=>g.id==='square')
for(const g of ledger.groups)for(const e of [...g.entries])if(ids.includes(e.id)){
 if(g!==square){g.entries.splice(g.entries.indexOf(e),1);square.entries.push(e)}
 Object.assign(e,{group:'square',productionBatch:'square',status:'완료',renderer:'drawSquareRemainder',needsLocationCheck:false,basis:verification})
}
for(const g of ledger.groups){g.count=g.entries.length;g.completed=g.entries.filter(e=>drawn.has(e.id)).length;g.pending=g.count-g.completed}
for(const g of ledger.productionBatches??[]){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
Object.assign(ledger,{drawn:544,pending:132,note:'138개 전체 재기획 후 나루2개 및 광장·큰길4개 전체 검증 완료. 다음 activePlan의 항구 여행 전체1개. 임의 소수 제한 없이 배경 묶음 단위로 진행.'})
assert.equal(ledger.groups.reduce((n,g)=>n+g.pending,0),132);write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');for(const e of selection.entries)if(ids.includes(e.id))Object.assign(e,{status:'기존 그림 유지',owner:'이 창'})
Object.assign(selection,{existing:544,pending:132,counts:Object.fromEntries(['dialogue','illustration','event'].map(t=>[t,selection.entries.filter(e=>e.tier===t&&!drawn.has(e.id)).length]))});write('docs/event-art-selection.json',selection)
const md='docs/event-art-remaining-138-plan.md';let text=fs.readFileSync(md,'utf8')
text=text.replace('**나루 전체2개 완료 → 현재540개 연결/136개 미제작**, 다음 광장·큰길4개.','**나루 전체2개·광장/큰길 전체4개 완료 → 현재544개 연결/132개 미제작**, 다음 항구 여행 전체1개.').replace('완료된2개도 이력을 유지한다.','완료된6개도 이력을 유지한다.')
for(const id of ids){const start=text.indexOf('— `'+id+'`');let end=text.indexOf('\n### ',start+1);const nextGroup=text.indexOf('\n## ',start+1);if(end<0||nextGroup>=0&&nextGroup<end)end=nextGroup;assert.ok(start>=0&&end>start);text=text.slice(0,start)+text.slice(start,end).replace('- 상태: 미제작.','- 상태: 완료 (전 대사·가로/휴대폰/썸네일·관련 검사·전체 빌드 통과).')+text.slice(end)}
text+='\n\n## 광장·큰길 잔여 전체4개 검증 결과\n\n'+verification+'\n\n북쪽 꽃길의 근거는 실제 src/render/decor.ts, 오가는 발길의 문은 기존 bakery-front-background, 광장/장터는 기존 market-square-background다. 풍경 소개 큐 때문에 플레이어를 다른 장소로 이동시키지 않는다.\n\n완성 모음: '+link+'\n';fs.writeFileSync(md,text)
const canonical='docs/event-art-production-plan.md';let old=fs.readFileSync(canonical,'utf8').replace('현재 540/676개 연결, 136개 미제작.','현재 544/676개 연결, 132개 미제작.').replace('실제 그림 연결 540개, 남은 136개.','실제 그림 연결 544개, 남은 132개.').replace('| 광장·장터·우물 | 1 |','| 광장·장터·우물 | 0 |').replace('| 현재 위치·장소 확인 대기 | 134 |','| 현재 위치·장소 확인 대기 | 131 |')
old+='\n\n2026-10-15 새 기획 광장·큰길 전체 묶음 완료: '+verification+'\n모음 '+link+'\n';fs.writeFileSync(canonical,old)
const progress='docs/event-art-progress.md';old=fs.readFileSync(progress,'utf8').replace('## 완료 429','## 완료 433');old+='\n\n## 2026-10-15 광장·큰길 잔여 전체4개 완료\n\n'+verification+'\n\n모음 '+link+'\n';fs.writeFileSync(progress,old)
const selectionMd='docs/event-art-selection.md';old=fs.readFileSync(selectionMd,'utf8').replace('현재 실제 연결 540개, 미제작 136개.','현재 실제 연결 544개, 미제작 132개.');fs.writeFileSync(selectionMd,old)
console.log(JSON.stringify({connected:544,pending:132,batch:'square',completed:ids,next:'travel',preview:link}))
