# 013 — 대장장이 부탁 보상 촛대와 밤의 실제 반응

2026-10-18 한국 시각. 남은 대장장이 smith:2 부탁 보상을 받아 설치하고 실제 밤 화면·클릭·회수·재사용·저장 복원을 검사했다. 현재 아이템 candle의 표시 이름은 ‘촛대’다. 게임 동작·밸런스·대사·그림은 수정하지 않았다.

## 조건과 실행

- `legacyGame(CONTENT)`, 20일 22:00, 기본 집, smith 관계 70점. 첫 부탁은 완료, 두 번째 부탁은 이미 들은 상태다.
- 재료 올리브 2개·빵 1개. 보상 한도 대조는 가방 촛대 99개와 0개다.
- 설치 `{22,112}`, 이동/재설치 `{22,113}`, 기록자 `{20,114}`.
- 현재 촛대는 불꽃이 포함된 small 가구 그림이며 별도의 점등/소등·수납·생산 입력은 정의돼 있지 않다. 생일 행사에서 부는 초와 일반 설치 가구를 혼동하지 않았다.
- smith:2는 촛대 1개 외에 `unlock:lanterns`도 준다. 이는 집 안 촛대의 점등 상태가 아닌 마을 길가 등불의 영구 해금이다.
- 실사용 저장은 접근하지 않았다. jsdom 메모리 저장소와 임시 Edge 프로필의 IndexedDB를 사용했다.

명령·결과:

- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-smith-candle.test.tsx`: 5건 통과.
- `node node_modules/typescript/bin/tsc --noEmit`: 통과.
- `node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 4193 --strictPort`: 정상 시작. 검사 종료 후 해당 서버만 중지했다.
- `node artifacts/detail-smith-candle-check.cjs`: 모바일 390×844, 배율 2, 실제 재료 건네기·보상 거절/수령·설치·밤의 캔버스 탭·이동·회수·재설치·이어하기 흐름 통과. pageerror 없음. 물리 휴대폰 검사는 아니다.

## 실제/기대 결과

1. 촛대 99개로 보상을 못 받으면 재료와 부탁 진행 1을 보존하고 가방이 찼다는 안내를 띄운다. 길가 등불도 아직 해금하지 않는다.
2. 보상 한도 실패를 분리한 뒤 촛대 없는 가방으로 실제 재료 건네기를 누르면 올리브 2·빵 1만 차감하고 촛대 1개를 받는다. 부탁 완료·수령 기록·길가 등불 해금이 함께 남는다.
3. 가구 목록 ‘촛대’를 선택해 바닥에 설치하면 가방 1→0, 방 안 한 개다. 밤 화면에서 작은 불꽃 그림을 확인했다. 별도 주변 조명을 제공한다고 단정하지 않았다.
4. 일반 플레이에서 실제 촛대 칸을 누르면 점등/소등 창이나 소모·생산 동작이 생기지 않는다. 작은 바닥 가구라 해당 칸으로 이동할 수 있으며 촛대 수량·부탁 해금은 변하지 않는다.
5. 저장 복원 후 촛대 위치·수량이 같고, 가방을 거치지 않는 이동 → 회수 → 다른 칸 재설치 → 최종 재접속에서도 촛대는 한 개다.
6. 길가 등불 8곳은 촛대 회수·재설치 여부와 독립적으로 해금을 유지한다. 최종 실제 밤 화면에서 길가 등불과 빛 번짐을 확인했다.

확인 범위에서 새 버그·안내 부족·의도 확인 항목은 없다. 보상 한도 거절도 정상적으로 안내된다.

## 코드·증거

- `src/engine/bonds.ts`의 smith:2: 올리브 2·빵 1 → 촛대 1, lanterns 해금.
- `src/engine/game.ts`의 fulfillRequest: 보상이 못 들어가면 재료를 쓰기 전에 null로 거절한다. 성공하면 부탁·수령·해금을 기록한다.
- `src/store/game-store.ts`의 requestGive: 보상 거절에 bagFull 안내를 표시한다.
- `src/render/remaining-furniture-art.ts`: 촛대의 노란 불꽃 도트가 포함된다.
- `src/render/decor.ts`의 lanternLights와 renderer의 야간 조명: lanterns 해금으로 길가 8곳을 밝힌다. 설치한 candle 목록으로 점등하는 기능은 아니다.
- 상태 결과: `artifacts/detail-audit/013-smith-candle/result.json`의 before, blocked, earned, installed, clicked, restored, collected, reused.
- 화면: `reward-capacity-blocked.png`, `night-candle-installed.png`, `public-lanterns-after-candle-reuse.png`.

## 범위와 큐 완료

부탁을 듣기 전의 긴 관계 진행과 장소까지의 도보는 검사 상태로 준비했다. 두 번째 부탁의 실제 재료 건네기·꾸미기·캔버스 입력은 실제 UI로 확인했다. 완료 장면 큐는 설치 경로와 분리했으며, 길가 등불 화면은 검사 상태로 기록자를 등불 곁에 옮겨 촬영했다. 가방 99개 대조 후 수령 경로를 격리하려고 검사 가방의 촛대를 0개로 바꿨다. 실사용 저장을 변경한 것이 아니다.

초기 네 가지 큐와 추가 요청에서 특정한 대장장이 관련 세 경로(협탁 보상, 나무통 마감, 촛대 부탁 보상)의 1차 검사를 마쳤다. 게임 전체의 모든 가구·모든 조합을 전수 검사했다는 뜻은 아니다. 새 기능·이름이 지정되지 않은 추가 가구를 임의로 계속 늘리지 않는다. 최종 보고서를 남기고 요청된 자동화 27을 비활성화한다.
