# UI · 렌더 · 콘텐츠 · 가구 배치 감사

감사일: 2026-10-18 (Asia/Seoul). 기존 소스·기존 테스트·설정·데이터는 수정하지 않았다. 아래의 재현은 새 감사 파일의 메모리 상태/로컬 jsdom에서 실행했으며 사용자 저장·운영 서버·결제·삭제를 실행하지 않았다.

## 검증 결과

- `probes.test.ts`: **4/4 통과**, 결과 `probes-results.json`. 버그 재현 검사는 현재의 잘못된 동작이 존재함을 assert한 검사이므로 통과가 무결함을 의미하지 않는다.
- `schedule-trades.test.tsx`: **3/3 통과**, 결과 `schedule-trades-results.json`.
- 모든 고유 `AUTHORED_STORY_IDS` 577개를 시작/마지막 기본 대사 단계 × 기본(null)/실제 사용자형 avatar × 300×170/320×180/320×693으로 6,924회 그렸다. 2D 명령 mock에서 예외와 NaN/Infinity 좌표가 없었다. 화면 픽셀·가림·모든 선택 답변·모든 실제 가족/방 상태를 검증한 결과가 아니다.
- 실제 새 터 서고·두 주택 방 `RoomCtx`의 유효한 벽 좌표를 열거했다. 보통 가구는 설치되는 해금 상태를 대조군으로 사용했다.
- 유효한 `canBuildWall` → `buildWall` 11회로 생긴 12개 배치를 그렸다. 첫 12개 전체 지도 캔버스는 재방문 시 새로 생성되지 않아 캐시에 계속 유지됨을 확인했다.
- 초기 가설 하나(필사 가구 방향 미리보기 누락)는 실행 결과 기각했다. `facingArt`가 additions 등록을 통해 정상 반환하므로 버그로 집계하지 않는다. 첫 탐색 실행의 실패는 이 잘못된 감사 가설을 잡은 것이며, 이후 정상 계약 검사로 고친 최종 결과가 4/4이다.
- Windows 제한 환경의 첫 실행은 `spawn EPERM`으로 시작하지 못했다. 동일 로컬 명령을 승인된 확장 실행 환경에서 실행한 최종 JSON 결과가 위 수치다.

실행 명령:

```powershell
node node_modules/vitest/vitest.mjs run qa/comprehensive-audit-20261018/ui/probes.test.ts --maxWorkers=1 --reporter=json --outputFile=qa/comprehensive-audit-20261018/ui/probes-results.json
node node_modules/vitest/vitest.mjs run qa/comprehensive-audit-20261018/ui/schedule-trades.test.tsx --maxWorkers=1 --reporter=json --outputFile=qa/comprehensive-audit-20261018/ui/schedule-trades-results.json
node qa/comprehensive-audit-20261018/ui/inventory.mjs
```

## 확인된 문제 (5개: Medium 4, Low 1)

### UI-01 · Medium · 새 터 서고와 주택에서 벽걸이 가구를 설치할 수 없음

- 유형: 기능 간 충돌 / 배치 조건문.
- 위치: `src/engine/room.ts:81`, `:86`, `:139`; `src/engine/newland-rooms.ts:18`, `:36`.
- 원인: 바닥 배치는 주어진 `RoomCtx.isFloor`를 사용하지만 wall 분기만 `footprint(f).every(isHangingWall)`를 호출한다. 그 함수는 첫 마을의 전역 `isHome`를 요구한다. 새 터의 서고/주택 벽 아래 바닥은 유효한 새 터 바닥이지만 첫 마을 집 좌표가 아니므로 모두 거절된다.
- 영향: `copyClothesNiche`, `copySpringFlowers`, `copySummerShells`, `copyAutumnLeaves` 4종의 새 터 실내 배치. 기존 새 터 저장에 벽걸이가 들어 있다면 `refitRoom`/`sanitizeRooms`에서도 가방으로 되돌아갈 수 있다(후자는 호출 경로의 정적 분석).
- 재현: 꾸미기 완전 해금, 해당 가구를 가진 상태에서 새 터 서고 안으로 이동 → 가구 배치 → 벽걸이 선택 → 서고 북쪽 벽(예: x14..24,y30)을 선택. 설치가 모두 실패한다. 같은 가구를 첫 마을 집 `(19,110)`에 설치하면 성공한다. 주택 두 방의 벽도 같은 결과다.
- 검증: **실행 확인**. 실제 ARCHIVE_CTX와 ROOM_SLOTS 두 개에서 `'#' && ctx.isFloor({x,y+1})`인 전체 벽을 열거해 모두 실패를 확인했다. `placeFurniture`의 성장 해금을 `growthLegacy`로 연 상태에서 보통 의자 배치 성공을 대조하고 4종 모두 서고 설치 실패를 확인했다. 실브라우저 클릭/스크린샷은 수행하지 않았다.
- 권장: `RoomCtx`에 벽 배치 판정 함수를 추가하거나 해당 context의 벽/바닥 판정으로 wall 분기도 일반화한다. 서고·두 주택 방·첫 마을 벽에 대한 회귀 검사를 추가한다.

### UI-02 · Medium · 벽 배치를 바꿀 때 전체 지도 캔버스가 누적 보관됨

- 유형: 시스템 / 메모리 누적 / 모바일 안정성.
- 위치: `src/render/renderer.ts:686`, `:688`, `:692`, `:746`.
- 원인: 모듈 전역 `mapCache` 키에 `homeWallsKey()` 전체 배치가 들어가지만 삭제/상한이 없다. 벽 하나를 추가할 때마다 새 배치의 `WIDTH*TILE × HEIGHT*TILE` 캔버스를 보관한다. `spriteCache`처럼 상한을 두는 처리가 이 캐시에는 없다.
- 재현: 같은 실행에서 집을 확장한 뒤 여러 곳에 벽을 차례로 설치해 화면을 갱신한다. 또는 여러 고유 배치가 들어 있는 저장을 전환한다. 각 배치의 전체 지도 그림이 남는다.
- 검증: **할당/보관 경로 실행 확인**. 실제 `canBuildWall`를 통과한 11회 `buildWall` 뒤 12개 배치가 각각 768×2624 캔버스를 만들었다. 12개를 다시 그려도 새 캔버스가 만들어지지 않아 기존 그림 참조가 보관됨을 확인했다. 12장 RGBA 원시 버퍼 환산은 **96,731,136 bytes(약 92.25 MiB)**이다. mock이므로 실제 브라우저 RAM/GPU 메모리 측정·OOM 발생 자체를 확인한 것은 아니다.
- 영향: 꾸미기를 오래 하거나 여러 저장을 전환할 때 성능 저하/메모리 압박 위험. 캔버스가 해제되지 않는 결함은 확인했고, 특정 기기의 강제 종료 여부는 미검증이다.
- 권장: 최신 배치만 유지하거나 작고 명시적인 LRU 상한을 적용한다. 서로 다른 저장/벽 편집으로 무한히 키가 늘지 않게 한다.

### UI-03 · Medium · 기본 아래 조작판의 다음 일정에서 직접 만든 약속과 주민 결혼식 누락

- 유형: 화면 간 상태 불일치 / 데이터 투영 누락.
- 위치: `src/features/play/ControlDeck.tsx:64`–`:70`; 비교: `src/engine/events.ts:44`, `:104`.
- 원인: `DeckNext`가 `scheduledEvents`에 clock/today/flags/notebook만 전달한다. 실제 일정 계산에 필요한 plans/gen/romance가 없어 약속과 결혼식이 계산에서 빠진다. plans/gen/romance를 subscribe하지 않아 해당 상태만 바뀔 때 갱신도 없다.
- 재현: 오늘 10:00~11:00의 차 모임 약속을 만든 뒤 9:50에 아래 조작판을 본다. 다음 일정은 다른 행사를 표시하고, 눌러 연 전체 일정에는 차 모임이 존재한다. 주민 결혼 준비 일정도 같은 누락 분기다.
- 검증: **React/jsdom DOM 실행 확인**. 유효한 Appt 자료형으로 `scheduledEvents(game)`에 제목이 나타나고 `ScheduleDialog`에도 나타나는 상태에서 `.deck-next`에는 제목이 없음을 확인했다. 사용자 브라우저에서 예약 생성 버튼부터의 전체 경로는 미검증이다.
- 영향: 기본 모바일/아래 조작판 UI에서 예약 행사를 놓칠 수 있다.
- 권장: 아래 조작판과 다른 일정 UI가 공용 상태 선택/계산 함수를 사용하고 plans/gen/romance를 모두 전달하도록 한다.

### UI-04 · Medium · 내 결혼식이 전체 일정과 위쪽 다음 일정에 나타나지 않음

- 유형: 기능 연계 누락 / 일정 UI.
- 위치: `src/features/play/EventSchedule.tsx:13`–`:21`; 비교: `src/engine/events.ts:35`–`:41`.
- 원인: `useEvents`가 plans/gen까지 전달하지만 romance를 전달하지 않는다. 엔진은 약혼한 주인공의 weddingDay로 결혼식을 넣으므로 UI 계산에서만 사라진다. `NextEventBar`와 `ScheduleDialog`가 모두 이 hook을 쓴다. 아래 조작판도 UI-03의 누락에 포함된다.
- 재현: 웬델과 약혼하고 결혼 예정일이 7일째인 상태 → 7일째 설정/일정 열기. 엔진의 원본 일정에는 `7:wedding`이 있고 전체 일정 창에는 내 결혼식 행이 없다.
- 검증: **React/jsdom DOM 실행 확인**. 같은 game 상태를 사용해 원본 `scheduledEvents`의 실제 결혼식 제목이 DOM에서 없는 것을 확인했다. `useEventAlerts`는 전체 game을 전달하므로 이 문제만으로 결혼식 시작 알림/실제 결혼 엔진까지 사라진다고 주장하지 않는다.
- 영향: 결혼 준비와 일정 확인, 위쪽 다음 일정.
- 권장: romance를 subscribe하고 scheduledEvents에 전달한다. 약혼 당일, 예식일, 예식 후 상태까지 UI 검증한다.

### UI-05 · Low · 장날 결혼 예복 네 상품의 이름과 선택 상세 제목이 비어 있음

- 유형: 콘텐츠 ID 연결 누락 / 접근성.
- 위치: `src/features/talk/TradeBoard.tsx:82`; `src/content/text.ts:94`; `src/shared/IconGrid.tsx:31`, `:44`; 거래 생성: `src/engine/game.ts:2757`.
- 원인: 예복은 `ITEM_TEXT`에 이름을 등록하지만 거래 UI가 읽는 `T.trades`에는 같은 네 ID가 없다. `buyEntry.label`은 undefined가 되고 상품 상세의 `<strong>`도 비어 있다.
- 재현: 7일째 장날 상인의 사기 탭 → 결혼 예복 구역 → 아무 예복 아이콘 선택. 아이콘/180닢/공통 설명은 있지만 상품 이름 제목이 나오지 않는다.
- 검증: **React/jsdom DOM 실행 확인**. 네 예복 거래가 TRADES에 존재함, 네 T.trades 키가 undefined임, 네 `.bag-grid button`에 aria-label이 없음, 선택 후 `.bag-detail strong`이 빈 문자열임을 확인했다. 내부 ItemIcon의 canvas aria-label은 ITEM_TEXT로 붙으므로 모든 접근성 이름이 완전히 사라진다고 확대하지 않는다.
- 영향: 예복 구매 전 종류 확인/선택 상세 제목.
- 권장: 예복의 거래명도 단일 카탈로그에서 생성하거나 `names[t.id] ?? itemName(icon)`을 사용한다.

## 범위와 누락

- 세부 파일 목록/줄 수/import/top-level 심볼/검사 깊이는 `inventory.json`에 기록했다. 현재 458개(코드321/JSON133/CSS4), 103,890줄을 전체 구문 파싱/구조 목록으로 다루었다. 구문 오류 0. 247개 production renderer 모듈을 전체 구조 목록에 포함했다.
- `focused-human-source-review-plus-structural` 표시는 입력/상태/비동기/캐시/배치/장면 분기 중심의 집중 검토이며, 큰 파일 모든 줄을 손으로 검토했다는 의미가 아니다. 다른 파일들은 `complete-structural-parse-inventory-only`로 분명히 기록했다. 특히 200여 렌더러 파일의 도트 좌표를 모두 수동/시각 검토했다고 주장하지 않는다.
- root 담당과 제외 합의: Settings, save-file-download, storage-notice-state, 이야기 선택 로직(SceneView 등), 경제/보상 의미론. 루트의 전체 기존 테스트와 콘텐츠 원본 대조 검사는 별도로 통합된다.
- `src/render/AGENTS.md`를 읽었다. 얼굴·몸/손/팔 가림을 모든 선택·대사·크기에서 시각 확인해야 완료 기록을 갱신한다는 규칙에 따라, 이번 명령 기반 smoke로 시각 완료를 선언하지 않았다.
- 모바일 실기기, iOS 오디오 interrupted/resume, 브라우저 canvas 실제 메모리/픽셀, 모든 사용자 조작 순서/모든 게임 상태의 조합은 검증하지 못했다.
- 숨긴 탭의 음악: audio/sound.ts의 musicTimer는 중지/visibility 처리가 없고 Play.tsx의 visibilitychange는 저장만 한다. 백그라운드에서 계속 재생될 가능성은 코드상 있으나 실제 브라우저 정책·요구된 동작을 확인하지 않았으므로 확정 버그 수에 넣지 않았다.
- 빵집 자녀 중복 렌더: social_lifecycle 담당과 교차검토. renderer.ts:2719,2777는 companionsOf 결과를 중복 제거 없이 각각 그리며, 기본 주민은 :2662의 slotHeir 외형으로 그린다. 사회/세대 담당이 소유한 통합 finding에 포함하고 이 문서 5개에는 중복 집계하지 않았다.
- 오류를 발견하지 못한 파일/실행 경로도 무결함을 보장하지 않는다.
