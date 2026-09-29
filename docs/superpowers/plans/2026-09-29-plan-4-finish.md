# 스물일곱 권의 마을 — 계획 4: 완성과 다듬기

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네 복음서가 다 들어간 게임을 한 편으로 완성한다 — 남은 작은 결함 정리, 새 이웃 넷을 마을 행사에 넣기, 네 권을 다 꽂으면 여는 복음서 방 완성 잔치와 사도행전 방 예고(그 뒤로도 계속 산다), 도감과 "나의 한 줄", 집 넓히기 2단계와 넓은 책상, 폰 설치·오프라인·성능, 배포.

**Architecture:** 엔진(`src/engine/`)은 순수 TS, store가 화면과 잇는다(계획 1·2와 같음). 새 상태는 `GameState`에 필드를 더하고 `save.ts`에서 옛 저장을 채운다. 장면은 `life-text.json`의 `scenes`, 앨범은 `album`. 지도 좌표는 `world.ts`, 이웃집·서고·내 집 방은 `ROOMS`/`HOME_RECT`/`viewRoomAt`.

**Tech Stack:** Vite 8, React 19, TypeScript, Zustand 5, Vitest, vite-plugin-pwa.

## Global Constraints

- 설계: `docs/superpowers/specs/2026-09-29-twenty-seven-design.md` (특히 §7-1 사용자 결정). 최상위 기준: `docs/exclusion-list.md`.
- 게임이 지어낸 문장은 `src/content/life-text.json`에만, `npm run verify`(금지어) 통과. 성경 문장은 `Passage`로만, 원문 그대로.
- 화면 문구 한국어, "벌"이라는 말 금지. 이웃은 역할 이름만. 사이트·게임 글에 제작 뒷이야기·게임 개수를 넣지 않는다.
- 그림: 청소년 톤의 차분한 파스텔(참고 색 `#bfcfa4` 풀, `#e5d3aa` 길, `#f8e6c0` 벽, `#f1bf6b` 창, 지붕 `#ac7759`/`#7b9a60`), 유아틱·하트 장식 금지, 창은 문을 가운데 둔 대칭, 반복되는 1픽셀 선 금지(2픽셀 이상), 새 가구는 윤곽 연하게. 그림을 바꾸면 미리보기에서 확대해 확인한다.
- 잔치 뒤 결말로 끝내지 않는다 — 계속 산다.
- 집 넓히기는 2단계: 1단계 "방 하나 더", 2단계 "다락 서재".
- 저장 키 `twenty-seven/save`, 버전 1 유지(필드를 더할 때 `save.ts`에서 기본값 채우기).
- 커밋 전: `npx tsc -b; npm test; npm run verify; npm run build`. 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 브랜치 `plan-1-trial`.
- 배포는 작업 7에서만 (`npx vercel deploy --prod --yes` in `twenty-seven/`, 프로젝트 `27maeul`, 주소 https://27maeul.vercel.app) — 사용자 사전 승인(2026-09-29 11:32).

---

### Task 1: 남은 작은 결함 정리

**Files:** `src/features/menus/Settings.tsx`, `src/engine/ending.ts`(또는 `endingNextNote`가 있는 곳), `src/engine/save.ts`, `src/store/game-store.ts`(잠자리 복습), `src/app/*.css`(`.hud-peace`), `src/content/life-text.json`(`ui.sellNone` 쓰임 또는 삭제)

- [ ] 화면에 남은 옛 게임 말 "기록자"를 이 게임 말("필사가"/주인공 이름)로 바꾼다. `grep -rn "기록자" src/content src/features src/engine` 중 **플레이어가 보는 문구**만 (주석은 그대로 둬도 됨).
- [ ] `save.ts`: `shelved`의 키가 `mt|mk|lk|jn`이고 값이 0|1|2인 것만 남긴다. 테스트: 잘못된 키·값이 든 저장을 불러오면 걸러진다.
- [ ] 잠자리 복습: "다시 읽을 구절"은 본문을 **읽음**으로 닫았을 때만 목록에서 뺀다(창만 닫으면 남는다). 테스트.
- [ ] `.hud-peace` 스타일 정의(평안 표시), `ui.sellNone`은 팔 것이 없을 때 좌판에 쓰거나 지운다.
- [ ] 커밋 `fix: 남은 작은 결함 — 옛 문구, 저장 검사, 복습 제거 조건`.

### Task 2: 새 이웃 넷을 마을 행사에

**Files:** `src/engine/neighbors.ts`(`FESTIVAL_SPOTS`), `src/engine/bonds.ts`(`BABY_PARTY_SPOTS`, `HILL_SPOTS`, `MILESTONE_GIFTS`, 초대 가능 이웃), `src/engine/stories.ts`(`ENDING_SPOTS`가 쓰이면), `src/engine/map-spots.test.ts`, `life-text.json`(새 이웃 대사·선물 장면)

- [ ] `postman`·`innkeeper`·`fisher`·`carpenter`를 잔치 모닥불 둘레, 아기 잔치, 언덕 소풍·별 보기, 마음 단계 선물(MILESTONE_GIFTS), 저녁 초대 후보에 넣는다. 이사 오기 전(`movedIn:${id}` 없음)에는 빠진다.
- [ ] 자리는 걸을 수 있는 칸이어야 한다 — `map-spots.test.ts`가 자동 검사. 모닥불 둘레 자리는 광장(19..29, 13..20) 안, 서로 겹치지 않게.
- [ ] 저녁 초대: 새 이웃 중 이웃집 방이 없는 이웃은 초대하지 않는다(초대는 방이 있는 집만).
- [ ] 대사·선물 문구는 생활의 말로, 성경 사건 흉내 금지(exclusion 2-3). verify 통과.
- [ ] 커밋 `feat: 새 이웃 넷도 잔치·소풍·선물·초대에`.

### Task 3: 복음서 방 완성 잔치와 사도행전 방 예고

**Files:** `src/engine/game.ts`(잠들 때 단계 판정), `src/engine/library.ts`, `src/render/renderer.ts`(서고 안 잠긴 문 빛), `life-text.json`(`scenes.gospelFeast`, `album`), 테스트

- [ ] 네 권이 모두 서고에 꽂힌 뒤 처음 잠드는 밤 → 다음 날 아침 장면 `gospelFeast`(해설 + 이웃 몇 마디, 성경 문장 없음, 27권 모인 역사 암시 금지), 그날 저녁 광장 모닥불 잔치(비가 와도 연다, 이사 온 이웃 모두 `FESTIVAL_SPOTS`), 풍경 앨범 `gospelFeast` 한 장.
- [ ] 잔치 다음 날부터 서고 안의 첫 잠긴 문(사도행전 방)이 은은하게 빛난다(따뜻한 빛, 2픽셀 이상). 누르면 "사도행전 방 문틈으로 불빛이 새어 나와요." 같은 예고 한 줄(`library.lockedRoomGlow`). 문은 아직 잠겨 있다.
- [ ] 결말로 끝내지 않는다 — 잔치 뒤에도 하루가 이어진다. `flags.gospelFeast = 1|2`로 한 번만.
- [ ] 테스트: 네 권 꽂기 → 잠 → 장면·잔치·앨범, 두 번째 밤엔 다시 나오지 않음, 세 권일 땐 나오지 않음.
- [ ] 커밋 `feat: 복음서 방 완성 잔치와 사도행전 방 예고`.

### Task 4: 도감 다듬기와 나의 한 줄

**Files:** `src/features/shelf/Shelf.tsx`, `src/features/library/Library.tsx` 또는 꽂기 뒤 흐름(store), `src/engine/game.ts`(`setMyLine`), `save.ts`, `life-text.json`

- [ ] 도감 위쪽에 책 고르기(전체 · 마태 · 마가 · 누가 · 요한)와 "한 복음서에만" 거르기. 장은 접힌 채(현재 동작 유지), 고른 책만 보인다. 선택은 본문을 보고 돌아와도 유지.
- [ ] 나의 한 줄: 책을 서고에 처음 꽂은 직후 "이 책에 대한 나의 한 줄을 남길까요? (나중에 적어도 돼요)" — 적으면 `myLines['book:mk']`처럼 책 키로 저장. 선반의 "내가 남긴 한 줄"에 책 이름으로 보인다. 조각 키(기존)도 계속 보인다. 이 문구는 플레이어 말이라 verify 대상이 아니다.
- [ ] 테스트: 책 거르기, 책 한 줄 저장·표시, 옛 저장의 조각 키 유지.
- [ ] 커밋 `feat: 도감 책별 보기와 나의 한 줄`.

### Task 5: 집 넓히기 2단계와 넓은 책상

**Files:** `src/engine/world.ts`(`HOME_RECT`, `HOME_EXPAND_RECT`, 방), `src/engine/room.ts`(놓을 수 있는 바닥), `src/engine/game.ts`(거래·목수), `src/render/renderer.ts`(지붕·벽), `src/engine/items.ts`(`TOOLS`에 `wideDesk`), `types.ts`, `life-text.json`, 테스트

- [ ] **1단계 "방 하나 더"** — 목수(이사 온 뒤)에게 닢 120 + 올리브 5로 부탁. 다음 날 아침 집 오른쪽 빈 땅(`HOME_EXPAND_RECT` 11..12열, 2..7줄)이 집이 된다: 벽을 넓히고 사이 벽에 문을 내 작업실과 이어진 새 방. 밖에서는 지붕이 그만큼 넓어진다(내 집 지붕 한 장). 새 방 바닥도 방 꾸미기 가능.
  - 구현 제안: 지도는 고정 문자열이므로, 확장 전·후 두 지도를 짓지 말고 `homeLevel`에 따라 그 칸들의 글자를 바꿔 주는 오버레이(`tileAt`이 `homeLevel`을 보고 확장 칸을 `'f'`/`'#'`로 돌려준다)를 쓴다. 이웃 동선·길찾기가 `tileAt`/`isWalkable`을 쓰므로 함께 맞춰진다. 지도 캐시는 `homeLevel`별로 따로.
  - 확장 칸에는 지금 아무것도 없어야 한다(설계 때 비워 둠) — 테스트로 확인.
- [ ] **2단계 "다락 서재"** — 1단계 뒤, 닢 200 + 파피루스 5. 작업실 선반 옆에 사다리(칸 하나)가 생기고, 밟으면 다락 방(`ROOMS`처럼 지도 아래 보이지 않는 곳, 8×6)으로 올라간다(문깔개로 내려옴). 다락엔 책장·독서대·창이 기본으로 있고, 방 꾸미기 가능. 다락 창가에서 자기 전 읽기를 하면 '평안'이 하루 더 간다(작은 보상, 수치는 설계 §7 '평안' 규칙에 맞춘다).
- [ ] **넓은 책상** — 장날 닢 80, `TOOLS`에 `wideDesk`: 장 엮기에 드는 시간 20% 줄어듦(좋은 펜·밝은 등잔과 같은 방식). 책상 그림이 두 칸 폭으로 보인다(작업실 책상 자리 오른쪽 칸이 비어 있으면; 아니면 그림만 넓게).
- [ ] 테스트: 비용·단계 순서(2단계는 1단계 뒤), 확장 뒤 길찾기·방 꾸미기·`isHome`, 저장/불러오기, 넓은 책상 시간.
- [ ] 미리보기로 밖(넓어진 지붕)·안(새 방·다락) 확인, 확대 스크린샷.
- [ ] 커밋 `feat: 집 넓히기 2단계와 넓은 책상`.

### Task 6: 폰 설치·오프라인·성능

**Files:** `vite.config.ts`(PWA), `index.html`, `src/render/renderer.ts`(성능), 테스트/점검 기록

- [ ] PWA: 매니페스트 이름·짧은 이름·아이콘·색(바탕 `#edf0df`) 확인, 새로 추가된 글꼴·이미지가 캐시 목록에 들어가는지. `npm run build` 뒤 `dist/sw.js`의 precache 목록 확인.
- [ ] 오프라인: 미리보기에서 한 번 연 뒤 네트워크를 끊고(가능하면 `navigator.serviceWorker` 확인) 새로고침해도 시작 화면이 뜨는지 확인해 결과를 커밋 메시지·기록에 적는다.
- [ ] 성능: 지도 캐시 캔버스(48×60칸 = 768×960px)가 계절마다 하나씩만 만들어지는지, 프레임마다 새 캔버스를 만들지 않는지 점검. `paint()` 캐시 키가 매 프레임 새로 생기는 곳(예: 주인공 스프라이트 키)이 있으면 줄인다. 미리보기 콘솔 오류 0.
- [ ] 커밋 `perf: 폰 설치·오프라인 확인과 그리기 캐시 점검`.

### Task 7: 한 바퀴 확인과 배포

- [ ] 미리보기(모바일)로: 새 게임 → 네 권 중 하나 고르기 → 서고 꽂기 → 잔치(개발 도우미로 네 권 꽂은 상태) → 사도행전 문 빛 → 집 넓히기 1·2단계 → 도감 책 보기. 콘솔 오류 0. 스크린샷.
- [ ] 전체 검사 통과 후 배포: `cd twenty-seven && npx vercel deploy --prod --yes` → https://27maeul.vercel.app 200, `<title>` 확인.
- [ ] 커밋(필요 시) `chore: 계획 4 마무리`.

## 자기 점검
- §7-1의 계획 4 항목(작은 정리·새 이웃 행사·잔치와 예고·도감과 한 줄·집 2단계와 넓은 책상·PWA/성능·배포) → 작업 1–7. 잔치 뒤 계속 살기 → 작업 3.
