import fs from 'node:fs'
import assert from 'node:assert/strict'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')
const inventory=read('artifacts/scenery/event-art-inventory.json'),drawn=new Set(inventory.filter(e=>e.kind||e.authored).map(e=>e.id))
const ids=['saw:boat:argue','movedIn:fisher'];assert.equal(drawn.size,540);ids.forEach(id=>assert.ok(drawn.has(id)))
const finalTests=fs.readFileSync('artifacts/scenery/shore-remainder-final-tests.log','utf8'),build=fs.readFileSync('artifacts/scenery/remaining-plan-build.log','utf8')
assert.ok(finalTests.includes('1480 passed'));assert.ok(build.includes('built in'))
const verification='나루 잔여 전체 2개 완료. 나루의 말다툼은 실제 코스모·루디와 대패, 낮은 설계판, 마지막 대사에서 대패 내려놓기와 둥글되 작은 뾰족한 끝이 남은 뱃머리 설계. 어부 이사 인사는 실제 핀과 기존 어부 집 도트·그물·물고기 항아리·작은 짐. 집의 바닥과 인물 발 접지를 보정했다. 원문 5개 대사 단계 전체를 기본/실제 플레이어 외형의 가로 시트, 휴대폰 및 실제 통합 미리보기·썸네일에서 확인. 관련4개 파일 3,287개 검사 통과 후 마지막 배치 수정에 대해 얼굴·몸통·팔·접지 검사1,480개 재통과. 사전 검사·TypeScript·전체 Vite/PWA 빌드 통과. 기존 엔진·콘텐츠·선택/보상·앨범 저장 로직은 변경하지 않았다. 실제540개 연결/136개 미제작. 다음은 새 계획의 광장·큰길 잔여 전체4개.'
const p=read('docs/event-art-remaining-138-plan.json');p.current={connected:540,pending:136,completedSincePlanning:2,nextBatch:'square'};p.automation={id:'automation',requestedIntervalMinutes:10,applied:false,status:'기존 자동화 조회·일시중지·새 프롬프트 적용 모두 도구 승인이 필요하지만 approval policy never로 차단됨. 실제 자동화는 중지/변경되지 않음.'}
p.implementationPrerequisites={current:'current 묶음103개 착수 전 AuthoredStoryScene→drawAuthoredStory와 EventThumbnail/미리보기 공통 호출에 읽기 전용 실제 장소 문맥을 전달하는 어댑터를 마련한다. 현재 ProposalArtContext만으로 부족한 map/실내 owner/날씨/시간과 신규 땅 문맥을 빠짐없이 전달하고 대표 미리보기 문맥을 명시한다. 배경 해결기만 만든 것을103개 사건 완성으로 세지 않는다.',dateReturn:'직전 나들이 장소를 기존 상태/호출 경로에서 확인하여 공통 귀갓길 문맥을 전달한다. 장면을 위해 저장/보상 조건을 바꾸지 않는다.'}
for(const e of p.entries){
 if(ids.includes(e.id)){e.status='완료';e.renderer='drawShoreRemainder';e.verification=verification}
 if(e.id==='trip:harbor')e.trigger={path:'src/engine/travel.ts DESTS.harbor / game 여행 경로',fare:25,lodging:10,keepsake:{bread:1},friend:'wendell',friendGain:5,leaveByMinute:720,once:'처음 간 날 이야기',location:'항구 도착 서술'}
 if(e.id==='dinner:child'||e.id==='dinner:baker')e.trigger={path:'src/engine/game.ts dine / bonds.INVITE_DOORS',door:e.id.endsWith('child')?{x:35,y:16}:{x:5,y:16},minuteWindow:[1080,1230],durationMinutes:90,hungerDelta:-60,preserve:'원래 초대·우호도·한 번 식사·그날 모임 조건'}
 if(e.id==='done:baker:2')e.design+=' 아기를 실제로 보여 주는 컷이 필요하면 기존 유저 아기 공용 도트와 현재 baker 가족 외형·세대를 사용하며 덮개는 얼굴 아래로 고정한다.'
}
for(const g of p.groups){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
write('docs/event-art-remaining-138-plan.json',p)
const ledger=read('docs/event-art-background-groups.json'),shore=ledger.groups.find(g=>g.id==='shore')
for(const g of ledger.groups)for(const e of [...g.entries])if(ids.includes(e.id)){
 if(g!==shore){g.entries.splice(g.entries.indexOf(e),1);shore.entries.push(e)}
 Object.assign(e,{group:'shore',productionBatch:'shore',status:'완료',renderer:'drawShoreRemainder',needsLocationCheck:false,basis:verification})
}
for(const g of ledger.groups){g.count=g.entries.length;g.completed=g.entries.filter(e=>drawn.has(e.id)).length;g.pending=g.count-g.completed}
for(const g of ledger.productionBatches??[]){g.completed=g.entries.filter(id=>drawn.has(id)).length;g.pending=g.entries.length-g.completed}
Object.assign(ledger,{drawn:540,pending:136,note:'138개 전체 재기획 후 나루 잔여 전체2개 검증 완료. 다음은 activePlan의 광장·큰길4개. 기존 완료 이력 보존.'});assert.equal(ledger.groups.reduce((n,g)=>n+g.pending,0),136);write('docs/event-art-background-groups.json',ledger)
const selection=read('docs/event-art-selection.json');for(const e of selection.entries)if(ids.includes(e.id))Object.assign(e,{status:'기존 그림 유지',owner:'이 창'})
Object.assign(selection,{existing:540,pending:136,counts:Object.fromEntries(['dialogue','illustration','event'].map(t=>[t,selection.entries.filter(e=>e.tier===t&&!drawn.has(e.id)).length]))});write('docs/event-art-selection.json',selection)
const md='docs/event-art-remaining-138-plan.md';let text=fs.readFileSync(md,'utf8');text=text.replace('# 남은 138개 이벤트 배경·제작 기획','# 남은 138개 이벤트 배경·제작 기획\n\n최신 제작 결과: **나루 전체2개 완료 → 현재540개 연결/136개 미제작**, 다음 광장·큰길4개. 아래138개는 재기획 시작 기준 목록이며 완료된2개도 이력을 유지한다.\n\n자동화 상태: 기존 자동화 일시중지와 새10분 프롬프트 적용을 요청했으나 도구 승인 정책으로 차단되었다. 실제 자동화 변경은 적용되지 않았다.\n\n현재 장소 묶음103개 제작 전에는 읽기 전용 장소 문맥을 게임·미리보기·썸네일에 공통 전달하는 배경 해결기를 먼저 연결해야 한다. 기존 ProposalArtContext만으로 map/방/시간/날씨/새 터가 모두 전달된다고 가정하지 않는다. 이 어댑터 작업은 개별 사건 완성 수에 포함하지 않는다.');text+='\n\n## 첫 제작 묶음 검증 결과\n\n'+verification+'\n\n완성 모음: http://localhost:5173/assets/events/play.html?event=saw%3Aboat%3Aargue&sequence=saw%3Aboat%3Aargue%2CmovedIn%3Afisher\n';fs.writeFileSync(md,text)
const canonical='docs/event-art-production-plan.md';let old=fs.readFileSync(canonical,'utf8');old=old.replace('현재 538/676개 연결, 138개 미제작.','현재 540/676개 연결, 136개 미제작.').replace('실제 그림 연결 538개, 남은 138개.','실제 그림 연결 540개, 남은 136개.');old+='\n\n2026-10-15 새 전체 재기획 및 첫 묶음: '+verification+'\n기존 자동화 지시는 폐기했다. 새10분 자동화 적용은 도구 승인 정책 때문에 실패했으며 실제 중지/변경을 완료했다고 기록하지 않는다.\n';fs.writeFileSync(canonical,old)
const progress='docs/event-art-progress.md';old=fs.readFileSync(progress,'utf8').replace('## 완료 427','## 완료 429');old+='\n\n## 2026-10-15 남은138개 전체 재기획·나루 전체 완료\n\n[최신 전체 기획](event-art-remaining-138-plan.md): 16개 배경 제작 묶음, 원문138개 중복/누락 없음, 기존 배경 자산 경로 모두 확인. 같은 배경 묶음 전체를 순차 진행하며 임의2개 제한은 없다.\n\n'+verification+'\n\n자동화 조회·일시중지·새 프롬프트/10분 간격 적용은 모두 도구 승인 정책(approval policy never)으로 차단됐다. 기존 자동화 실제 상태는 변경되지 않았다. 후속 작업은 기존 heartbeat 본문 대신 최신 전체 기획을 따른다.\n';fs.writeFileSync(progress,old)
console.log('540 connected /136 pending. New plan: shore complete, square4 next. Automation NOT changed (approval blocked).')
