# 도트 자산 목록 (`assets/`)

> 이벤트·소품·동작 그림은 **새로 그리기 전에 여기서 먼저 찾는다** (사용자, 2026-10-05). 각 폴더의 `manifest.json`에 크기·방향·프레임 시간·기준점(anchor/handAnchor)·반복 여부가 있고, `클로드_…안내.txt`에 연결 방법이 있다.
> 마지막 확인: 2026-10-05 — PNG 3,700여 개, 7.2MB. 연결은 계획 17(`docs/superpowers/plans/2026-10-05-plan-17-dot-connect.md`)에서 진행 — 아래 "연결 상태" 칸.

## 공통 규칙 (모든 안내 txt에서 같은 것)

- 원본은 16px 타일 정수 도트, 투명 PNG. 확대는 nearest-neighbor.
- 인물 PNG는 **기본 봄 외형 예시**다. 실제 플레이어·주민·아이는 원본 함수에 현재 외형(`avatar`·계절·키 옵션)을 넘겨 그 자리에서 만든다 — PNG를 그대로 쓰지 않는다.
- 인물 팔레트(`writerPalette`·주민 팔레트)와 소품 팔레트(`FURNI_PALETTE`/`USE_PROP_PALETTE`)는 섞지 않는다.
- 겹치는 순서: 가구 뒤 → 뒤 소품(propBack) → 인물(actor) → 앞 소품(propFront) → 가구 앞.
- 행사 장식은 행사 중에만 보이고 끝나면 걷는다. 결과물(완성 작품·완공 시설)만 사건 완료 상태에 따라 남긴다.
- 상태 변화(촛불 끔·선물 풂·공개)는 실제 완료 순간에 한 번 저장 — 반복 재생으로 보상을 두 번 주지 않는다.
- 걷기 모션은 그림만 — 실제 이동·충돌·따라다니기는 게임 경로를 쓴다.

## 폴더별

| 폴더 | 분량 | 원본 코드 (src/render) | 내보내기 | 안내 txt | 연결 상태 |
|---|---|---|---|---|---|
| `furniture/` (맨 위) | `home-space-furniture-v1.png` 원안 시트 (가구 20종) | — | — | `README.txt` | 원안 그림 (게임 해상도로 다듬은 것은 아래 `directional`·`remaining`) |
| `furniture/directional/` | 집 가구 20종 × 4방향 = 80 PNG + atlas | `home-space-directions.ts` (`HOME_SPACE_DIRECTIONS`) | `node scripts/export-home-space-art.mjs --directions` | `클로드_방향전환_연결안내.txt` | 정지 그림 연결(계획 17 작업 1, 5a459d7). 돌리기는 작업 2 |
| `furniture/remaining/` | 남은 배치 가구 19종 + 고정 가구 10종(`fixtures/`: 침대·필사 책상·작업대·화덕·베틀·요람·고정 항아리·화분·넓은 책상·그을음 받이) × 4방향 = 116 PNG | `remaining-furniture-art.ts` | `export-home-space-art.mjs` | `클로드_연결안내.txt` | 정지 그림·붙박이 연결(작업 1). 돌리기는 작업 2 (서고 선반·여정 판·카드 판은 범위 밖) |
| `furniture/use-motion/` | 가구 사용 동작 8종(앉아 쉬기·차 마시기·책 읽기·손일·반죽·꺼내고 넣기·인형 쓰다듬기·누워 쉬기) × 4방향 × 4프레임 = 128 + 시트 | `furniture-use-motion.ts` (`furnitureUseFrame`) | `export-furniture-use-motion.mjs` | `클로드_사용모션_연결안내.txt` | 연결(작업 3, 3026bb9): 쉬기·잠·벤치 읽기·만들기·화덕·찻집 차, 이웃이 제 집 자리에 앉은 모습 |
| `furniture/expansion/` | 생활 소품 68종(`props/`, 아이콘 `icons/` 8×8), 방향별 시설 9종(`structures/`: 좌판 마감/개점·나루 보관대·조립 골격·열린 상자/찬장·미완성 의자·그늘막), 기존 가구 12종 앞뒤 레이어(`layers/`), 성인 동작 14종(`motions/`), 어린이 동작 22종(`children/`), 고양이·강아지 6동작(`pets/`) | `expansion-prop-art.ts`, `expansion-life-motion.ts` | `export-expansion-art.mjs` | `클로드_전체기획_도트연결안내.txt` (생활 확장 01–11·주민별 소품 표) | 소품·시설: 이야기 뒤 소품으로 등록(작업 1). 일어나기(rise)는 작업 3, 고양이·강아지 동작은 작업 6에서 연결. 나머지 성인·어린이 동작은 그 기능이 생길 때 |
| `events/wedding/` | 결혼식 소품 14종(꽃 아치 4방향·꽃다발·화관·옷꽃·반지 상자·화분·잔치 쟁반·찻잔·선물·꽃잎·촛대·통로 천·잔치 탁자) + 인물 동작 6종(입장·인사·꽃다발·반지 교환·손잡기·축하) × 4방향 × 4프레임 | `wedding-art.ts` (`weddingActorFrame`) | `export-event-art.mjs` | `../클로드_이벤트도트_연결안내.txt` | 연결(작업 4, 63c8ea3): 결혼 잔치 저녁 모닥불 둘레에 아치·통로 천·꽃잎·촛대·화분·표지·선물·잔치 탁자·쟁반·찻잔, 짝과 기록자 동작 6종 차례로. 꽃다발·반지 상자는 동작 안 소품으로만, 화관·옷꽃은 아직 쓰지 않음. 결혼 완료·보상은 그대로 |
| `events/other/` | 다른 이벤트 소품 20종: 생일(birthdayBread·birthdayBanner), 집들이(welcomeBasket·housewarmingSign), 작품 발표(exhibitStand·artworkUnfinished/Complete·firstToy), 완공(openingRibbon·ribbonAfter), 첫 심부름(errandParcel), 나들이(travelBundle·picnicCloth), 재회 편지(reunionLetter), 계절 잔치(springGarland·summerShadeDecor·autumnHarvest·winterLantern·feastBoard), 가족 액자(familyMemoryFrame) | `event-art.ts` | `export-event-art.mjs` | `../클로드_이벤트도트_연결안내.txt` | 일부 연결(작업 5, d1032fb): birthdayBread, 계절 잔치 4종 + feastBoard, picnicCloth, welcomeBasket. 나머지(집들이 표지·작품 발표·완공 리본·첫 심부름·나들이 짐·재회 편지·가족 액자·birthdayBanner)는 그 기능이 생길 때 |
| `events/additional/` **(새로 추가)** | 행사 동작 17종 × 성인/어린이 × 4방향 × 4프레임 = 544 + 시트: 박수·촛불 불기·음식 나누기·꾸러미 들고 걷기·장식 걸기·춤·웃기·끄덕이기·맛보기·아기 안기·아이와 손잡고 걷기·천 펼치기·접시 놓기·장식 걷기·선물 풀기·작품 공개·받은 물건 살펴보기 / 두 사람 배치 예시 2종(`pairs/`: 음식 나누기·손잡고 걷기) / 소품 상태 5종(`states/`: 꺼진 초·풀린 선물·덮인 작품·접힌 천·빈 접시) | `event-life-motion.ts` (`eventMotionFrame`) | `export-event-life-motion.mjs` | `클로드_추가이벤트모션_연결안내.txt` | 일부 연결(작업 4·5): clap·smile(결혼 손님), dance·taste·clap(계절 잔치), blowCandle + states/candleOut(생일, 그날 한 번 저장), shareFood(소풍), placePlate(아기 잔치). 나머지 동작·상태는 그 기능이 생길 때 |

## 이벤트별로 쓸 것 (안내 txt 요약)

| 이벤트 | 소품 | 동작 |
|---|---|---|
| 생일 | birthdayBread(켜짐) → states/candleOut, birthdayBanner | blowCandle, clap |
| 집들이·이사 환영 | welcomeBasket, housewarmingSign | carryParcel, shareFood, placePlate, hangDecor + 인사·차 |
| 작품 발표·첫 공동 만들기 | exhibitStand, states/artworkCovered → artworkComplete, firstToy | unveil, clap, nod |
| 공동 시설 완공 | structures 상태 + openingRibbon/ribbonAfter | unveil, clap, dance |
| 첫 심부름 | errandParcel (실제 완료 때만) | carryParcel + give/take |
| 가족 나들이·여행 | travelBundle, picnicCloth | walkHand, spreadCloth, shareFood, holdBaby |
| 계절 잔치 | springGarland·summerShadeDecor·autumnHarvest·winterLantern·feastBoard | hangDecor, dance, taste, clearDecor |
| 받은 선물 | states/giftOpen + 실제 받은 물건 | unwrapGift, useGift |
| 결혼식 | wedding 소품 14종 | arrive·bow·offerFlowers·exchange·holdHands·celebrate |
| 손님 | — | clap·smile·nod·taste + 서기·걷기·차 |

- 어린이 폴더의 holdBaby는 크기 확인용 — 아이가 아기를 안는 행동을 자동으로 넣지 않는다(나이·보호자 조건 확인).
- pairs는 배치 예시 — 실제로는 두 사람을 각자 외형으로 그리고 handAnchor로 손을 맞춘다.

## 주민별 소품 (expansion 안내 txt)

빵 굽는 이웃 restSign·breadTray/snackPlate · 물 긷는 아이 displayEmpty/displaySeason·seasonalLeaves·smoothStones·namePlate · 할아버지 chair·constructionFrame·sharedPlan · 상인 좌판 천·chest/chestOpen·nameSign · 대장장이 drawingBoard·metalParts·ornamentRing·hookNamed · 양치기 toolRack·apron·woolSorted · 기름 짜는 이웃 workbench/chair·oilEmpty/Full · 베 짜는 이웃 clothBlue/Rose/Pattern · 벌 치는 이웃 notebookOpen/Closed·beeDrawing · 편지 나르는 이웃 bagWorn/bagRepaired (나머지는 안내 txt).

## 확인할 것 (2026-10-05)

- 원본 코드(`src/render/*-art.ts`, `*-motion.ts`)와 `scripts/export-*.mjs`는 계획 17 작업 1에서 커밋했다(5a459d7). 네 가지 검사 통과. PNG 폴더 `assets/`는 커밋하지 않는다.
- `미리보기.html`(각 폴더)로 브라우저에서 재생 확인 가능.
- 작업 4·5(63c8ea3·d1032fb): 행사 소품의 자리와 동작은 엔진 `src/engine/event-scene.ts`가 정하고(테스트 `event-scene.test.ts` — 지도 칸·사람 자리 확인 포함), 렌더러는 `src/render/event-props.ts`로 그린다. 개발 미리보기에서 결혼 잔치·봄꽃 잔치·소풍·생일 촛불을 확인했다.
