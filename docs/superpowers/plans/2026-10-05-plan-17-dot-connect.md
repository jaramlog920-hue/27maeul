# 스물일곱 권의 마을 — 계획 17: 새 도트를 게임에 붙이기

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**사용자 요청 (2026-10-05):** "도트업뎃됐는데 확인해주고 적어놔줘" → "붙어줘". 자산 목록은 `docs/assets-index.md`.

**Goal:** `assets/`에 만들어 둔 도트(가구 방향·사용 동작·결혼식·행사 소품과 동작·반려동물 동작)를 **지금 게임에 있는 기능**에 붙인다. 아직 없는 기능(소모임·작은 행사·함께 일하기 등)은 계획 16의 그 작업에서 이 도트를 쓴다 — 여기서 기능을 새로 만들지 않는다.

**Architecture:** 그림은 `src/render/*-art.ts`·`*-motion.ts` 원본 함수에서 그 자리에서 만든다(PNG를 불러오지 않는다 — PNG는 미리보기·확인용). 인물은 현재 외형(`avatar`·계절·키)을 넘긴다. 엔진은 "지금 무슨 동작/소품 상태인가"만 정하고(테스트 가능), 렌더러는 그 결과를 그린다.

## Global Constraints

- `docs/assets-index.md`의 공통 규칙(겹침 순서 propBack→actor→propFront, 팔레트 섞지 않음, 장식은 행사 중에만, 상태 변화는 실제 완료 때 한 번, 걷기 모션은 그림만).
- 그림 규칙(청소년 톤 파스텔, 2픽셀 이상 선, 유아틱·하트 금지), 채도 필터 뒤 모습으로 확인.
- 보상·결혼 완료 로직·마음 점수는 바꾸지 않는다 — 그림만 붙인다.
- 저장: 새 필드는 선택(옛 저장은 기본값), 저장 키/버전 유지.
- 커밋 전 네 가지 검사(`npx tsc -b; npx vitest run; npm run verify; npm run build`), 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 배포는 사용자 승인 때만.
- 다른 세션의 커밋 안 된 작업은 섞지 않는다. 도트 원본(`src/render/*-art.ts` 등)은 사용자 요청으로 이 계획이 넘겨받는다.

## 붙일 곳 (지금 있는 기능)

| 도트 | 붙일 기능 | 엔진 쪽 근거 |
|---|---|---|
| 가구 정지 그림·붙박이(`home-space-art`·`remaining-furniture-art`) | 방 가구·가방 아이콘·붙박이 글자 그리기 | `FURNITURE_ART`, `drawObject`, `drawFurniture` |
| 가구 4방향(`directional`·`remaining`) | 방 꾸미기에서 돌리기 | `Furniture`에 `facing?` |
| 사용 동작 8종 + 앉기/눕기/일어나기 | 쉬기·잠·벤치 읽기·작업대·화덕 반죽·찻집 차 | `restAt`·`sleep`·`readScripture`·만들기 |
| 이야기 뒤 소품(`expansion` props/structures) | 계획 16 작업 4의 `storyPropsNow` | `story-props.ts` 등록·그리기 |
| 결혼식 소품·동작 | 결혼하는 날 광장 모닥불 18:30~ | `weddingToday`, `atWeddingFire` |
| 생일 소품·촛불 불기 | 이웃 생일(선물한 날 그 이웃 집 앞) | `events.ts` `birthday:` |
| 계절 잔치 장식·춤·맛보기 | 봄꽃·보리·포도·모닥불 잔치 | `festivalOf` |
| 소풍 천·음식 나누기, 아기 잔치 | 모임(소풍·아기 잔치) | `bonds.ts` gathering |
| 반려동물 6동작 | 아이네 고양이/강아지 | `animal()` |

## 작업

### Task 1: 도트 원본 넘겨받기와 정지 그림
- [ ] `src/render/*-art.ts`·`*-motion.ts`·테스트, `scripts/export-*.mjs`·`pixel-png.mjs`를 커밋한다(PNG 폴더 `assets/`는 사용자 자료 — 커밋하지 않고 목록 문서로 관리).
- [ ] `furniture-art.ts`·`renderer.ts`의 정지 그림 연결(다른 세션이 해 둔 부분)을 확인하고 이어서 마무리: 가방 아이콘, 붙박이 글자, 탁자 위 작은 물건.
- [ ] `story-props.ts` 등록(`registerStoryPropArt(EXPANSION_PROPS, EXPANSION_VIEWS)`)과 `drawStoryProps` 호출을 renderer에 넣는다.
- [ ] 미리보기로 집 안·이웃집·서고 확대 확인.

### Task 2: 가구 방향 돌리기
- [ ] `Furniture.facing?: 'down'|'up'|'left'|'right'` (없으면 `HOME_SPACE_LEGACY_FACING` 또는 down). 저장 정리에서 잘못된 값은 버린다.
- [ ] 방 꾸미기에서 놓인 가구를 누르면 "돌리기" — 크기가 바뀌는 가구는 돌린 뒤에도 놓을 수 있을 때만(통로 검사 그대로).
- [ ] 렌더러는 방향 그림을 쓰고, 없는 가구는 지금 그림.

### Task 3: 가구 쓰는 동작
- [ ] 엔진: 플레이어의 "지금 하는 동작"(`act?: { kind, until, facing }`)을 쉬기·잠·벤치 읽기·작업대·화덕·찻집 차에서 짧게(실제 시간 1.2–2초) 정한다. 걷기 시작하면 끝.
- [ ] 렌더러: `furnitureUseFrame`/`extraUseFrame`으로 플레이어를 그린다(현재 외형), 가구 앞뒤 레이어 순서.
- [ ] 이웃이 제 집 앉는 자리(`home.sit`)에 있을 때 앉은 모습.

### Task 4: 결혼식
- [ ] 결혼하는 날 18:00–22:00 광장 모닥불 곁에 꽃 아치·통로 천·잔치 탁자·쟁반·촛대(행사 중에만).
- [ ] 장면 동안 두 사람: arrive → bow → offerFlowers → exchange → holdHands → celebrate, 둘레 이웃은 clap·smile. 결혼 완료·보상 로직은 그대로.

### Task 5: 생일·잔치·모임
- [ ] 이웃 생일: 선물한 날 그 이웃 곁에 birthdayBread → 플레이어가 곁에 있으면 blowCandle 한 번 → candleOut 상태(그날만, 저장 한 번).
- [ ] 계절 잔치: 그 계절 장식(springGarland·summerShadeDecor·autumnHarvest·winterLantern)과 feastBoard, 이웃 dance/taste/clap를 돌아가며.
- [ ] 소풍: picnicCloth + shareFood, 아기 잔치: welcomeBasket·placePlate, 별 보는 밤은 그대로.

### Task 6: 반려동물 동작
- [ ] 아이네 고양이/강아지를 `petMotionRows`로: 서 있으면 wait/wag, 걸으면 walk, 가끔 sniff/play. 아기 동물은 baby 옵션.

### Task 7: 한 바퀴 확인과 전달
- [ ] 미리보기 휴대폰·PC 크기, 네 계절 × 낮/밤 확인, 성능(프레임마다 새로 칠하지 않게 캐시).
- [ ] `docs/assets-index.md`의 "연결 상태" 칸을 고친다. 배포는 사용자 승인 때.

## 계획 16과의 관계
- 계획 16 작업 4(이야기 뒤 소품)가 끝난 다음 Task 1을 시작한다(같은 파일 `game.ts`·`renderer.ts`).
- 계획 16의 소모임(14–15)·작은 행사(16)·함께 일하기(17)·반려동물 성격(21)·아이 첫 경험(22)·집 공간(23)은 이 계획이 붙인 그리기 함수를 그대로 쓴다.
