# 004 — 설치 작업대 제작의 가방·수납 재료 연결

검사일: 2026-10-19 19:40 KST 시작. 큐3에서 담요 제작 하나만 검사했다. 가방 양털1 + 설치 이불장의 양털2를 쓰는 작업대 상세→손일 시작→취소/완료→저장 복원 경계다.

## 결과

**R2-002: 재현된 사용성·안내 부족.** 양털3개를 실제로 사용할 수 있어 만들기가 활성화되는데, 재료 상세는 가방만 세어 **빨간색 1/3**을 표시한다. 이불장 재료2가 제작에 포함된다는 설명이 없어 재료 부족으로 오해할 수 있다. 제작을 막거나 재료를 잃는 오류는 아니다.

jsdom 4검사와 모바일 실제 작업대 터치·취소·연장 완료·영구 저장 후 새로고침은 통과했다. 게임 소스는 수정하지 않았다.

## 코드 기준·기존 검사와의 차이

- HEAD `e49615fce4a0eaeeaf31ea553398b8073e6251db` + 기존 변경이 있는 현재 작업 트리. 관련 파일 SHA256은 증거 폴더의 source-hashes.json에 보존했다.
- `src/engine/craft-flow.test.ts`는 모든 제작법의 일반 취소/완료/복원, 궤짝 재료와 산출물 한도를 이미 검사한다. 이를 전부 재실행하지 않았다. 이번은 궤짝 해금 표식 없이 이불장만 둔 혼합1+2 재료의 상세 표시 및 열린 손일의 완료 시 재검사에 집중했다.
- 최근 경제 감사의 E-R2-01은 배운 제작법의 공간 계산 문제다. 이번은 기본 작업대의 재료 보유량 표시이므로 구분한다. 해당 보고 및 최근 REPORT_DRAFT에서 같은 표시 재현은 확인되지 않았다. 기존 D001~D008과 R2-001은 반복 신규 보고하지 않았다.
- 실사용 저장은 사용하지 않았다. jsdom 메모리 localStorage 및 새 임시 Edge context만 사용했다.

## R2-002 재현 순서

1. 집 안에 작업대(`homeWorkbench`)와 이불장(`linenCupboard`)이 있는 상태에서 가방 양털1, 보관함 양털2를 준비한다. 별도 supplyChest 해금 표식 없음.
2. 캔버스의 실제 작업대를 터치하고 담요 아이콘을 선택한다.
3. 상세에 붉은 **1/3** 부족 표시와 활성화된 **만들기** 버튼이 함께 나온다.
4. 만들기를 눌러 손일을 시작할 수 있다. 취소하면 가방1/보관2 그대로다.
5. 다시 시작해 실제 ‘연장으로 바로 끝내기’를 누르면 양털1+2를 합쳐 소모하고 담요1을 받는다.

기대: 제작에 쓸 수 있는 총3개를 충분한 것으로 표시하거나, 가방1·보관2를 구분해 총량과 제작 가능 이유를 안내한다. 실제: 총량은 제작 가능 판정에만 사용되고 상세는 가방1만 부족으로 표현한다.

근거:

- `src/features/menus/PlaceMenu.tsx:108`: NeedList의 have가 `game.inv[id] ?? 0`만 반환한다.
- 같은 메뉴의 block은 `canCraft(game, recipe)` 결과다. `src/engine/game.ts`의 canCraft→haveStock/useStock과 chestOf는 설치 수납 가구를 인정하여 합계3을 계산한다.
- `src/shared/IconGrid.tsx:94`: have<need일 때 li.short, `src/app/parts.css:2496`: short 글색 #b0473a.
- 실제 캡처 `misleading-stock.png`를 직접 열어 붉은1/3·활성 만들기를 확인했다. 결과 JSON의 before는 inv.wool1/chest.wool2, made는 wool0/blanket1이다.

개선 방향(미적용): 제작 가능 판정과 같은 stockOf를 수량 표시에도 사용하거나 보관함 몫을 명시한다. 다른 화면으로의 일반화는 별도 검사 대상이다.

## 명령과 결과

1. `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-r2-craft-mixed.test.tsx` — 최종 **4/4 통과**, 6.43초. 로그 vitest-final.log. 첫 실행의2개 실패는 거절 후 game 참조 동일성을 기대한 하네스 단언이었다. persist가 found/bookDesigns 등을 정규화해 새 객체를 만들므로 가방·보관함·시간 보존 단언으로 바로잡았다. 게임 결함으로 세지 않았다. 초기 로그도 vitest.log로 보존했다.
2. `node artifacts/detail-r2-craft-mixed-static.cjs` — 현재 소스에 감사 전용 bridge entry를 더한 임시 빌드, 로컬 preview, 새 Edge 모바일 context로 실행. 최종 **종료0**, `PASS: mixed stock displayed short despite enabled make; actual cancel, kit completion and durable reload preserve exact consumption`.
3. 브라우저 첫 실행은 수량 정상 확인 후 시간차가60이 아닌60.3167이라 하네스 단언에 실패했다. 실제 RAF가 창 조작 사이에 흘린 소수 시간이며, 제작 비용 자체는 엔진 검사에서60 확인. 브라우저 단언을60 이상61 미만으로 보완한 뒤 한 번 재실행해 복원까지 완료했다. 게임 시간 오류로 세지 않았다.

## 확인 조건·실제/기대 대조

| 조건 | 기대 | 실제 |
|---|---|---|
| 가방1+이불장2, 담요 상세 | 충분한 재료를 일관되게 안내 | 제작 가능하지만 빨간1/3. R2-002 |
| 손일 시작 직후 취소 | 양쪽 재료/산출물 보존 | jsdom 및 실제 UI 일치 |
| 다시 시작→완료→중복 닫기 | 양털3 한 번만 소모, 담요 지급 | jsdom 일치. 실제 연장 완료도 양털0/담요1 |
| 제작 후 저장·새로고침·이어하기 | 결과/보관함 유지 | 실제 saveGameAsync 및 재접속 일치, pageerror0 |
| fixture로 손일 중 보관 양털2→1 | 완료 거절, 남은 재료/시간 보존 | jsdom에서 일치 |
| fixture로 손일 중 담요99+보관30 포화 | 완료 거절, 양털 미소모 | jsdom에서 일치 |

마지막 두 조건은 지연 콜백의 방어를 분리한 fixture 주입이다. 자연 게임 조작으로 손일 중 재료가 변하는 경로를 재현했다고 주장하지 않으며, 거절 뒤 새 안내 문제를 별도로 세지 않았다. 같은 이유로 모든 실제 동시 상태 변경을 검증한 것으로 일반화하지 않는다.

## 증거와 실행 환경

- 테스트: `src/audit/detail-r2-craft-mixed.test.tsx`.
- 재현: `artifacts/detail-r2-craft-mixed-check.cjs`, 실행 하네스 `artifacts/detail-r2-craft-mixed-static.cjs`.
- 증거 폴더: `artifacts/detail-audit/round-2-20261019/004-craft-mixed/`.
- `misleading-stock.png`, `results.json`, `vitest.log`, `vitest-final.log`, `static-run.log`, `static-final.log`, `static-browser.log`, `source-hashes.json`을 보존했다.
- 003과 같은 감사용 bridge로 실제 번들 store를 참조하며 게임 로직을 mock하지 않았다. 초기 게임/가방/수납 가구 배치는 fixture로 주입했다. 화면은 실제 RAF가 그렸고 실제 캔버스 터치로 작업대에 진입했다.
- Edge390×844 터치, 연장 handyKit을 가방에 넣은 기본 장착 상태. 정상 게임 UI의 연장 완료를 사용했으며 일반 타이밍 손일3회 성공을 브라우저에서 직접 수행한 것은 아니다.
- 외부 글꼴은 검사 프로필에서 차단했고 로컬 preview의 analytics script404는 수납/제작 의존 경로가 아니다. pageerror0과 모든 네트워크 오류0은 구분한다. 임시 서버/브라우저는 finally에서 정리했다.

## 미확인·다음 대상

다른 제작법·화덕/기름틀 재료 상세, 데스크톱 화면, 일반 타이밍 손일의 실제 포인터 완료, 손일 중 자연 상태 변경 경로는 미확인이다. 표시 문제는 이번 담요 혼합재료 조건에 한정해 보고한다.

큐3 완료. 다음은 마지막 큐4: **배움터 창이 열린 상태에서 활성 아이가 바뀌는 경우, 아이별 그날 맡김 여부·비용·이름/버튼이 함께 갱신되는지** 한 경계로 좁힌다. 먼저 가족의 아이 전환이 해당 창을 유지하는 실제 UI 경로가 있는지 확인한다. 자연 경로가 없다면 fixture 전환은 방어 검증으로만 기록한다. 1차의 성인 배움터·진로 초안·성장 첫날 도움은 제외한다. 큐4 완료 뒤 최종 보고서 및 자동화27-2 비활성화가 남았다.

