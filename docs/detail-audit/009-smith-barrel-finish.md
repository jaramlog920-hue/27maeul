# 009 — 대장간 나무통 마감 선택·설치·실제 반응

2026-10-18 한국 시각. 이미 대장장이에게 hookFinish를 배운 뒤 작업대에서 원래 색/구리색을 고르는 연결부만 검사했다. 설치 성공에서 끝내지 않고 캔버스의 실제 색과 클릭 반응·회전·이동·회수·재설치·재접속을 확인했다. 게임 동작·밸런스·대사·그림은 수정하지 않았다.

## 조건과 실제 용도

- `legacyGame(CONTENT)`, 20일 10:00, 기본 집, 나무통 1개. 배운 기록은 `{hookFinish:{day:2,from:'smith',picked:'copper'}}`, 처음 선택한 모습은 원래 색이다.
- 설치 `{20,112}`, 옮길 자리 `{22,113}`, 기록자 `{20,114}`.
- 나무통의 현재 정의는 solid 장식 가구다. isStorage/functionalAt의 수납·생산 가구에 포함되지 않으며 설명도 ‘쇠테를 두른 튼튼한 통.’이다. 수납 기능이 있다는 기대를 임의로 세우지 않았다.
- 배움 발견·손일 미니게임 자체는 기존 skills 테스트 범위이고 이번에는 완료된 배움 상태로 시작했다. 구매·제작으로 나무통을 얻는 흐름도 이번 범위 밖이다.
- 실제 사용자 저장 대신 jsdom 메모리 저장소와 임시 Edge 프로필의 IndexedDB만 사용했다.

## 명령과 결과

- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-smith-barrel-finish.test.tsx`: 8건 통과. 4방향 실제 그림의 팔레트 치환 검사 포함.
- `node node_modules/typescript/bin/tsc --noEmit`: 통과.
- `node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 4189 --strictPort`: 정상 시작. 검사 종료 후 해당 서버만 중지했다.
- `node artifacts/detail-smith-barrel-finish-check.cjs`: 모바일 390×844, 배율 2, 실제 터치/캔버스 경로 통과. pageerror 없음.
- 작업대 modal 진입과 꾸미기 시작은 검사 훅을 사용했다. 모습 선택·닫기·가구 목록 선택·설치·캔버스 클릭·회전·이동·회수는 실제 UI를 사용했다. 물리 휴대폰 검사는 아니다.

## 실제/기대 결과

1. 작업대에서 ‘구리색으로 매만지기’를 누르면 `skillFinish:barrel`이 2, 해당 단추가 선택됨 상태가 된다. 재료·수량·능력치·시간 변화는 없다. 새로 놓은 나무통에 `finish:'copper'`가 붙는다.
2. 구리색 나무통의 실제 캔버스와 원래 색으로 다시 설치한 캔버스는 다르다. 같은 위치·방향·줌과 실제 캔버스 확대 배율을 반영해 나무통 영역을 비교했으며 RGBA가 다른 픽셀은 570개였다. 구리색 쇠테와 회색 쇠테를 전체 화면에서도 확인했다.
3. 설치한 나무통을 일반 플레이 중 실제 탭해도 수납 창이나 생산 동작을 시작하지 않는다. 물건·보상이 소비되거나 늘지 않는다. 현재 장식 가구 정의 및 설명과 모순되지 않는다.
4. 구리색 마감은 저장 복원·회전·가방을 거치지 않는 이동에서 유지된다. 방향 right, 다른 위치에서도 finish가 남는다.
5. ‘처음 색 그대로’를 선택해도 이미 놓인 가구는 바뀌지 않는다. 이는 placedStyle이 설치 시점에 모습을 붙이는 현재 규칙이다. 회수 후 다시 놓으면 새 선택에 따라 finish가 없는 원래 모습이 된다.
6. 최종 재접속 후 원래 모습 선택·방 안 나무통 한 개·가방 0개·배운 기록·능력치·닢이 일치한다. 수량 손실·중복은 없다.

## 코드 근거와 원인 분리

- `src/engine/skill-defs.ts`: hookFinish는 smith/tilly가 가르치는 나무통의 iron/copper 모습 선택이다. needs가 없어 이 배움에서 나무통 자체를 새로 제작하지 않는다.
- `src/features/skills/SkillLesson.tsx`: SkillCraftOptions는 배운 기술의 선택 단추를 표시하고 chooseSkillStyle 결과를 저장한다.
- `src/engine/skills.ts`: chooseSkillStyle은 선택 표식만 갱신한다.
- `src/engine/game.ts`의 placeFurniture: 놓을 때 placedStyle을 적용한다. moveFurniture는 기존 piece의 finish를 보존한다.
- `src/engine/room.ts`: rotation과 refitRoom은 finish를 이어 붙인다.
- `src/render/renderer.ts`: facingArt 우선으로 실제 방향 그림을 고르고 STYLE_PALETTES를 합쳐 칠한다.

검사 중 배제한 의심:

- furniture-art의 옛 기본 나무통 그림에는 큰 S, 구리색 표에는 작은 s가 보여 색 변경 누락을 의심했다. 실제 렌더러가 우선 사용하는 remaining-furniture-art의 방향 그림에는 작은 s가 있고, 4방향 검사와 실제 화면에서 색 변경이 확인됐다. 사용하지 않는 옛 그림만 보고 버그로 세지 않았다.
- 최초 브라우저 입력에서 지도 탭 직후 원래 색 선택이 무시됐다. 기존 450ms 유령 클릭 차단 구간을 넘긴 뒤 선택되었음을 표식으로 확인했다. 상태 변경 누락 버그로 보고하지 않았다.
- 최초 픽셀 비교는 내부 캔버스의 정수 확대 배율을 빠뜨려 잘못된 영역을 읽었다. `canvas.width / (VIEW_W*TILE)` 배율과 재접속에도 고정되는 줌을 반영해 나무통 위치를 다시 비교했다. 초기 0픽셀 결과는 게임 증거가 아니며 최종 결과는 570픽셀 차이다.

## 자료·판정

- 상태/픽셀 결과: `artifacts/detail-audit/009-smith-barrel-finish/result.json`.
- 화면: `workbench-copper-choice.png`, `copper-installed.png`, `original-reinstalled.png`.
- 이번 범위의 새 재현 버그·안내 부족·의도 확인·미검증 의심은 없다. D001~D006의 기존 상태는 변경하지 않았다.
- 수납이나 생산 기능이 필요한 다른 가구에 이 결과를 일반화하지 않는다. 새 터·주민에게 배움을 보여 주기·중단한 미니게임·가방이 가득 찬 경우는 확인하지 않았다.

## 다음 대상

대장장이의 직접 설치 보상 협탁과 배운 나무통 마감은 각각 008·009에서 실제 사용/반응까지 1차 확인했다. 사용자가 특정 가구 이름을 주면 그 가구를 우선한다. 추가 명칭이 없으면 원래 큐 4로 돌아가 걷는 아이→돕는 아이(`born+42`)의 성장 아침과 기존 home/follow 상태·처음 도움·메뉴·저장 복원을 좁게 검사한다. 어른·예약 경계는 별도 회차다.
