# 007 — 아기에서 걷는 아이로 바뀌는 아침

2026-10-18 한국 시각. 아이가 태어난 지 13일인 밤에서 14일 아침으로 넘어가는 연결부만 검사했다. 게임 동작·밸런스·대사는 수정하지 않았다.

## 조건과 실행

- `legacyGame(CONTENT)`, 집 2단계, 결혼 상태, born 10인 아이 루시. 23일 22:00부터 24일 아침까지.
- 기본 가구를 유지하고 `placement`로 유효한 요람 위치를 확인했다. 요람 `{26,114}`, 기록자 `{27,114}`에서 실제 돌보기가 가능한 대조 상태다.
- 아이 가까움 10, 기록자 지능 level 3/xp 10으로 성장 시 물려받기와 첫 함께하기의 경험치 변화를 분리했다.
- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-child-first-walk.test.tsx`: 새 검사 5건 통과.
- `node node_modules/typescript/bin/tsc --noEmit`: 통과.
- 서버: `node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 4187 --strictPort`.
- `node artifacts/detail-child-first-walk-check.cjs`: 모바일 390×844, 배율 2, 임시 Edge에서 실제 캔버스 선택·돌보기·잠들기·성장 장면·동행 변경·함께하기·저장 재접속 흐름 통과. pageerror 없음.
- 실사용 저장 대신 jsdom 메모리 저장소와 임시 브라우저 프로필의 IndexedDB를 사용했다.

## 실제/기대 대조

1. 성장 직전 요람의 아이를 실제 캔버스에서 탭하면 요람 대사와 돌보기 4개가 나온다. 동행 버튼은 없다. 안아 주기는 가까움 10→12, cared 0→1이다.
2. 잠자기 취소는 날짜·아이·물려받기·메뉴를 바꾸지 않는다. 실제 잠든 다음 날부터 toddler/follow가 되고 첫걸음 장면과 childWalked 표식이 한 번 생긴다.
3. 성장 후 요람 대사·돌보기 버튼이 사라지고 ‘지금은 곁을 따라다녀요.’와 함께하기·동행/집에 두기가 나온다. 아직 ‘혼자 다니게 두기’는 없다.
4. 성장 뒤 예전 돌보기 입력 4종을 엔진과 store에 직접 보내도 모두 거절되고 가까움·돌본 날·게임 객체를 보존한다.
5. 성장 아침의 물려받기 20~50%와 능력치는 저장 복원 후 같고, 다음 날 다시 자도 중복 적용되지 않는다. 첫걸음 장면도 중복 생성되지 않는다.
6. 집에 두기 후 재접속하면 home 상태를 유지한다. 다시 데리고 다니면 follow가 된다. 캔버스에서 실제 걷는 아이를 탭해 함께하기 메뉴를 열 수 있다.
7. 함께하기 메뉴 취소는 아무 보상을 주지 않는다. 성장 아침의 첫 책 읽기는 정상 실행되어 가까움 +3, 지능 경험치, 하루 활동 1회, 결과 대사가 일치한다. 저장 복원 후에도 그대로다.
8. 첫걸음 장면의 실제 제목은 ‘아기의 첫걸음’. 장면을 닫고 재접속하면 큐에서 사라지고 가족 앨범에 한 장 남는다.

모든 항목이 기대와 일치했다. 새 재현 버그·안내 부족·의도 확인 항목은 없다.

## 코드 근거와 검사 보정

- `src/engine/child.ts`: childStage는 born+14부터 toddler, childMode 기본값은 follow다.
- `src/engine/game.ts`: childMorning은 inherited가 없을 때만 물려받고 childWalked가 없을 때만 첫걸음 장면을 만든다. careBaby는 cradle이 아닌 아이의 입력을 거절한다.
- `src/features/companion/FollowMenu.tsx`: cradle 분기와 성장 후 분기가 달라, 성장하면 아기 돌보기 대신 동행·함께하기가 표시된다. 혼자 다니기는 helper/adult에서만 보인다.
- `src/engine/family.ts`: canKidAct는 baby일 때 차단하고 toddler부터 활동 조건을 검사한다.
- 초기 브라우저 자동 입력은 지도 탭 직후 돌보기 클릭이 무시되어 가까움이 그대로였다. 직접 careBaby를 대조하면 정상 결과가 나왔고 `src/shared/ghost.ts`의 450ms 지도 탭 후 클릭 차단 규칙을 확인했다. 최종 스크립트는 실제 포인터로 창을 연 뒤 550ms 기다린다. 이 규칙을 우회하거나 성장 오류로 보고하지 않았다.
- 대사/조작 화면은 실제 컴포넌트로 검증했다. 성장 장면을 기다리는 다른 아침 장면의 순서는 제외하고, 생성된 childWalks를 직접 열어 화면과 완료 기록을 검사했다.
- 성장 후 캔버스 탭은 침대 가구와 겹치지 않게 기록자를 열린 방 안 칸 `{20,113}`으로 옮긴 검사 상태에서 했다. 침대 근처의 성장 직후 자동 위치 선택은 별도 범위다.

## 자료와 미확인 범위

`artifacts/detail-audit/007-child-first-walk/result.json`: baby, cared, morning, grown, home, played, restored의 아이·위치·메뉴·장면/앨범·활동 상태.

화면: `before-growth-cradle.png`, `first-walk-scene.png`, `after-growth-follow.png`, `first-activity-result.png`.

형제 선택 전환, 돕는 아이/어른으로 성장, 배움터·예약된 활동, 새 터, 다른 가구와의 경로 충돌은 이번에 일반화하지 않았다. 아이 성장 검사는 아직 전체 완료가 아니다.

## 다음 대상 변경

검사 중 사용자가 대장장이에게서 얻어 설치하는 가구도 실제 사용까지 검사해 달라고 추가 요청했다. 다음 회차의 우선순위를 이 요청으로 변경한다. 가구 획득 → 설치 → 클릭/사용 → 효과·소모·동작 → 저장·재접속 후 재사용을 한 가구씩 추적한다. 아이의 helper/adult 및 예약 경계는 큐에 남긴다.
