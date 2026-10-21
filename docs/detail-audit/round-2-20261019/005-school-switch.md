# 005 — 아이 전환과 배움터의 아이별 하루 제한

검사일: 2026-10-19 19:50 KST 시작. 마지막 큐4의 한 연결부: 첫째는 오늘 배움터 이용 완료, 둘째는 미이용일 때 선택 아이를 바꾼 뒤 이름·활성 버튼·비용·아이별 경험치/하루 표식이 함께 바뀌는지 확인했다.

## 결과

**새 문제 없음.** jsdom 5검사 및 실제 모바일 UI의 배움터 닫기→가족에서 둘째 선택→배움터 재진입→맡기기→첫째로 전환→저장/재접속→둘째 재확인 경로 통과. 첫째 표식은 보존되고 둘째에게만15닢/경험치가 한 번 적용됐다.

배움터 창 자체에는 아이 선택 버튼이 없다. 가족 선택 버튼의 실제 호출 위치도 Family.tsx이며 한 ModalLayer가 현재 창을 표시한다. **배움터 창을 유지한 채 바꾸는 검사는 store.selectKid를 호출하는 방어 검증**으로 구분했다. 이것을 자연 게임 UI의 동시 전환이라고 주장하지 않는다.

## 소스·격리·중복 방지

- 현재 작업 트리에서 실행했다. 마지막 HEAD 조회는 `3c5ffb06e634ba137432253d8453bd092b0a1b0f`(집 옆 자유 마당, 첫 주 플레이 점검 개선). 이전 회차의 HEAD e49615f에서 바뀌었으나 이 감사는 커밋을 만들거나 소스를 되돌리지 않았다.
- 관련 파일 수정 시각은 이번 시작 전이며 실행 후 SHA256을 source-hashes.json에 남겼다. game.ts19:06, game-store.ts19:32, SchoolView/Family/siblings는 전날 수정 상태였다. 감사용 테스트·스크립트·보고서만 추가/보완했다.
- 기존 `siblings.test.ts`는 아이 표식/옷장 교환을 검사하고 `SchoolView.test.tsx`는 교실 발표/집 밖 거절을 검사한다. 이번은 실제 화면과 아이별 비용/상태를 연결한 미검사 조합이다. 1차의 성인 배움터·진로 초안·첫 도움 조합은 제외했다.
- fixture:100일째10시, 돕는 아이 가람(born40)·나래(born50),100닢. 가람의 schoolDay100을 초기 상태로 주입했고 나래는 미이용. 부모 진행은 legacy 해금 상태로 분리했다. 첫째의 이전 결제 자체를 이번에 재현한 것은 아니다.
- jsdom 메모리 저장과 임시 Edge context만 사용. 실제 사용자 저장 접근 없음. 브라우저는390×844 터치,003~004에서 마련한 감사용 정적 빌드/같은 번들 store bridge를 사용했다. 배움터는 실제 캔버스 터치로 진입했다.

## 명령·결과

1. `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-r2-school-switch.test.tsx` — 최종 **5/5 통과**,4.25초, vitest-final.log. 초기1실패는 첫째 메뉴 버튼이 지능(wit)인데 근력 경험치를 검사한 하네스 기대값 착오다. 실제 UI 차례 STAT_IDS를 읽고 지능 증가·근력 유지로 수정했다. 게임 버그로 세지 않았다. 초기 로그도 보존했다.
2. `node artifacts/detail-r2-school-switch-static.cjs` — 감사용 임시 build 및 로컬 preview, 임시 Edge에서 **종료0**, `PASS: actual school close/family switch/reopen, per-child attendance, one fee, correct XP target and durable reload`.
3. second-eligible.png를 직접 열어 ‘나래’와5개 활성 맡기기 버튼을 확인했다. 전후 스냅샷은 results.json에 남겼다.

## 조건·기대/실제 대조

| 조건 | 기대 | 실제 |
|---|---|---|
| 첫째 schoolDay100 |5개 맡기기 거절·이용 완료 안내 | DOM/실제 화면 일치 |
| 창 닫기·가족에서 둘째 선택·재진입 | 이름 나래, 오늘 표식 없음,100닢 유지,5개 버튼 활성 | 실제 UI 일치 |
| 둘째 첫 지능 맡기기 |85닢, 둘째 지능 증가·첫째 능력치 유지, schoolDay100 | 실제 UI/JSON 일치 |
| 둘째 재진입 및 다른 능력치 재시도 | 추가 비용/경험치 없음 | UI 버튼5개 비활성. jsdom 직접 액션 재호출도 추가 지불 없음 |
| 첫째로 전환·재진입 | 첫째 완료 표식 유지, 추가 비용 없음 | schoolDay100/85닢 유지 |
| 첫째 선택 상태 저장·새로고침·이어하기 | active 첫째와 보관된 둘째의 표식 모두 유지 | 실제 saveGameAsync 및 새로고침 일치 |
| 복원 뒤 둘째 재선택·재진입 | 둘째도 오늘 완료,85닢 유지 | 실제 UI 일치 |
| 열린 SchoolView에서 store로 둘째 전환 | 이전 버튼 DOM도 현재 이름·상태·대상으로 갱신 | jsdom 일치, 방어 검증 |
| 열린 SchoolView에서 완료한 첫째로 store 전환 | 버튼 비활성·지연 액션 거절 | jsdom 일치, 방어 검증 |
| 둘째 선택 후 닫기·serialize 복원 | 결제 없음, 별도 표식 보존 | jsdom 일치 |
| fixture로 다음 날101일로 변경 | 두 아이가 따로 다시 이용 가능 | jsdom 일치, 둘째·첫째 각15닢. 실제 잠자기/아침 경로는 이번에 재검사하지 않음 |

## 코드 근거

- `src/features/family/Family.tsx:63`: 아이 버튼→store.selectKid.
- `src/store/game-store.ts:1982`: 선택 시 게임을 persist하고 현재 modal은 바꾸지 않는다. 자연 UI에서는 Family 창이 열린 상태다.
- `src/engine/siblings.ts:22`의 isKidFlag는 school 접두사를 포함한다. swapKid는 나가는 아이의 schoolDay를 kidFlags로 옮기고 들어오는 아이의 표식으로 교체한다.
- `src/features/child/SchoolView.tsx`: 현재 game.child와 canSchool을 매번 읽어 이름/버튼 상태를 계산하고 goSchool(stat)를 호출한다. 오래된 아이 객체를 결제 대상에 고정하지 않는다.
- `src/engine/game.ts:2075` canSchool은 현재 아이·날짜 표식·마감·비용을 재확인한다. sendToSchool은 현재 아이에게만 경험치를 더하고 현재 schoolDay를 기록한다.
- `src/store/game-store.ts:1928`: goSchool은 실행 시 현재 get().game을 사용하고 성공하면 창을 닫는다.

## 증거·미확인

- 테스트: `src/audit/detail-r2-school-switch.test.tsx`.
- 재현: `artifacts/detail-r2-school-switch-check.cjs`, 실행 `artifacts/detail-r2-school-switch-static.cjs`.
- `artifacts/detail-audit/round-2-20261019/005-school-switch/`: results.json, first-already-enrolled.png, second-eligible.png, restored-first.png, vitest.log, vitest-final.log, static-run.log, static-browser.log, source-hashes.json.
- pageerror0. 외부 글꼴은 검사에서 차단하고 로컬 preview의 analytics404는 기능 의존 경로가 아니다. 전체 네트워크 오류0이라고 주장하지 않는다.
- 생애 단계/집을 떠난 아이·세 아이 전 조합·모든 능력치·실제 다음 아침 이벤트·열린 창에서 자연 전환이 가능한 추가 입력 경로는 미확인이다. 이번에는 돕는 아이 두 명의 하루 제한 연결부만 확인했다.

## 다음 대상

유한 큐1~4 완료. 추가 기능 검사는 잡지 않는다. 같은 폴더 final-report.md를 남기고 자동화27-2를 비활성화한다. 새로운 발견은 없으므로 다음 발견 번호는 사용하지 않는다.
