import fs from 'node:fs'
const p='docs/event-art-remaining-138-plan.json',plan=JSON.parse(fs.readFileSync(p,'utf8'))
for(const e of plan.entries.filter(e=>e.batch==='yard'))e.workInProgress={audit:'docs/event-art-yard-batch-audit.md',rendererDraft:'src/render/home-yard-events-art.ts',context:'src/render/home-yard-event-context.ts',validation:'2파일268검사 및 TypeScript 통과. 공통 연결/통합 검사/전 비율 시각 확인/전체 빌드 미완료. 완료 수 불변.'}
const mailbox=plan.entries.find(e=>e.id==='homeMailbox');mailbox.trigger.currentRuntime='폐기된 옛 장면. src/engine/mailbox.test.ts는 자동 발생/설치 없음과 현재 편지 바구니 수령을 검사한다. 미리보기 원문 도트만 구현하고 이벤트·설치 기능은 복구하지 않는다.'
fs.writeFileSync(p,JSON.stringify(plan,null,2)+'\n')
const md='docs/event-art-remaining-138-plan.md';let s=fs.readFileSync(md,'utf8');s+='\n\n## 내 집 마당 배경 잔여 전체 제작 중\n\n4개 전체 원문·엔진 대조와 읽기 전용 문맥/렌더러 초안을 준비했다. `homeMailbox`는 현재 폐기된 옛 장면이며 미리보기 원문만 그린다. 설치 해금을 복구하지 않는다. 268검사·TypeScript는 통과했지만 공통 연결·시각 확인·전체 빌드 전이므로 완료 수는 548/128 그대로다. [마당 전체 대조와 이어 할 일](event-art-yard-batch-audit.md)을 먼저 읽고 같은 묶음을 계속한다.\n';fs.writeFileSync(md,s)
const progress='docs/event-art-progress.md';s=fs.readFileSync(progress,'utf8');s+='\n\n## 2026-10-15 내 집 마당 잔여 전체4개 제작 중 (미완료)\n\n원문/현재 엔진 대조, 읽기 전용 문맥과 4개 렌더러 초안, 268검사·TypeScript 완료. 공통 연결/시각 확인/전체 빌드 대기. 완료 수는 올리지 않았다. 이어 할 일은 docs/event-art-yard-batch-audit.md. homeMailbox는 현재 폐기된 옛 장면으로 재해금하지 않는다.\n';fs.writeFileSync(progress,s)
console.log('Whole yard batch remains in progress; 548 connected / 128 pending unchanged.')
