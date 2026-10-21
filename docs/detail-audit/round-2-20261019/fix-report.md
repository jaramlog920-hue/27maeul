# R2-001·R2-002 수정 및 검증

2026-10-19, 사용자 ‘전부고쳐줘’ 요청에 따라 이번 검사에서 발견한 두 안내 문제를 수정했다. 이전001~005 보고서는 수정 전 재현 기록으로 보존한다.

## 수정 완료

- **R2-001:** 모달이 열린 동안 Toast를 document.body에 portal로 렌더링하고, fixed 위치와 모달 위 레이어(z-index70)를 사용한다. 창이 닫히면 기존 world-frame 알림 위치로 돌아간다. role=status와 클릭 통과를 유지한다. 메시지와 만료 시간·수납 동작은 변경하지 않았다.
- **R2-002:** 작업대 NeedList의 보유량을 game.inv 단독 대신 stockOf(game,id)로 계산한다. 가방1+이불장2는3/3 정상 표시이며, 수납 가구 접근이 없으면 보관함 데이터를 무조건 더하지 않고 기존 가방1/3 부족 표시를 유지한다. 재료 소모·제작 비용/보상은 바꾸지 않았다.

구현: `src/features/play/Hud.tsx`, `src/app/parts.css`, `src/features/menus/PlaceMenu.tsx`.

## 검증 결과

- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/features/play/ToastModal.test.tsx src/features/play/Hud.test.tsx src/features/menus/CraftQuantity.test.tsx src/audit/detail-r2-craft-mixed.test.tsx src/audit/detail-r2-storage-take.test.tsx src/audit/detail-r2-storage-put.test.tsx`:6파일23검사 통과. 모달 전환 시 알림 한 개만 유지·portal 이동·원위치 복귀, 기존 HUD·제작량·수납·혼합 재료 검사 포함.
- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-r2-school-switch.test.tsx`:5검사 통과. 감사 때 추가한 테스트의 Testing Library 옵션 타입을 정리하고 재검증했다.
- 수납 가구를 없앤 대조군을 추가한 뒤 `src/audit/detail-r2-craft-mixed.test.tsx`만 다시 실행:5/5 통과(위23검사 중4개의 재검사+새 대조군1개).
- `node node_modules/typescript/bin/tsc --noEmit`: 최종 통과. 새 감사 테스트의 지원하지 않는 exact 옵션은 제거했다. 테스트 하네스 타입 문제이며 게임 기능 결함으로 세지 않았다.
- `git diff --check`로 변경 파일 공백 검사 통과.
- `node artifacts/detail-r2-fixes-static.cjs`: 현재 소스의 감사용 임시 빌드·분리된 Edge에서 통과. 실제 사용자 저장 접근·배포 없음.

브라우저 확인:

1. 가방50종·보관 갈대1로 보관함 UI를 제어 진입하고 실제 꺼내기를 클릭.390×844와1280×900에서 실패 알림의 parentBody=true, fixed, 화면 전면 hit 확인. hit 측정 순간에만 pointer-events를 auto로 바꾸고 즉시 복원했으며 그림/데이터를 바꾸지 않았다. 거절 시 가방0/보관1 보존.
2. 실제 캔버스에서 작업대 터치→담요 상세3/3·short 표시 없음·만들기 활성 확인.
3. 만들기→취소 시 양털1+2 보존. 다시 만들기→실제 연장 완료 시 양털3 소모·담요1 지급. 실제 저장 API→페이지 새로고침→이어하기 후 결과 유지. pageerror0.
4. toast-visible-390.png와stock-corrected.png를 직접 열어 수정 화면을 확인했다. 외부 글꼴은 검사 프로필에서 제외했다. 넓은 화면은 동일 터치 context의 viewport 변경이므로 모든 데스크톱 입력 조합 검증으로 일반화하지 않는다.

증거: `artifacts/detail-audit/round-2-20261019/fix-2-findings/{results.json,toast-visible-390.png,toast-visible-1280.png,stock-corrected.png,static-run.log}`. 테스트·타입 로그는 같은 상위 폴더의 fix-*.log다.

React 점검: 조건부 반환 이전에 훅을 호출하고 모달 여부는 boolean으로 구독한다. 추가 effect/타이머 없이 현재 상태에서 표시를 유도하며 알림의 role/status와 pointer-events:none을 유지했다. 제작 상세와 활성 여부가 같은 접근 가능 재고 기준을 사용한다.

자동화27-2는 완료 후 PAUSED 상태를 유지한다. 이번 변경은 로컬 소스에 반영했으며 배포하지 않았다.
