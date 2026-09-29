# 스물일곱 권의 마을 — 계획 6: 연애와 결혼

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마을 이웃 집안의 젊은 사람 여덟 명(영어 개인 이름)을 더하고, 인사·선물 → 저녁 초대 → 둘만의 이야기 둘 → 고백(들꽃 다발) → 청혼(약속의 끈) → 마을 잔치로 치르는 결혼 → 배우자가 내 집으로 이사 오는 흐름을 만든다.

**Architecture:** 후보는 기존 이웃 체계(`NeighborDef`, 하트·대화·선물·동선·저녁 초대)를 그대로 쓰는 이웃으로 더하고 `romanceable: true`를 단다(설계 §2.7이 자리를 남겨 둠). 연애 단계는 `src/engine/romance.ts`(새)에 순수 함수로, 장면 문구는 `life-text.json`의 `romance` 절에. 결혼 뒤 배우자는 내 집(`HOME_RECT`, 집 넓히기 1단계 방)에 산다.

**Tech Stack:** 기존과 같음.

## 판단과 근거 (사용자가 맡긴 결정, 2026-09-30 기록)

1. **이름**: 남 Oliver(올리버)·Arlo(알로)·Rowan(로완)·Milo(마일로), 여 Ivy(아이비)·Clara(클라라)·Nora(노라)·Hazel(헤이즐). 성경에 나오는 이름은 영어 형태까지 뺐다 — 예: Felix(벨릭스), Theo(데오빌로에서 옴), Eli(엘리), Chloe(글로에), Phoebe(뵈뵈), Lydia(루디아), Julia(율리아). 화면에는 한글 표기.
2. **후보 구성**: 주인공 모습(여자/남자)과 **다른 모습의 후보 네 명**만 연애 대상이 된다. 이유: 성경 게임 모음의 한 편이고 이용자가 청소년·교회 공동체이므로, 교단마다 입장이 갈리는 부분을 게임이 먼저 열지 않는 보수적 선택. 나머지 넷도 마을 이웃으로 친구가 될 수 있다(하트·선물·대화는 같고, 고백·청혼 단계만 없음). 사용자가 돌아와 바꾸기를 원하면 `romance.ts`의 `candidatesFor` 한 곳만 고치면 된다.
3. **이웃 수**: 설계의 "최대 13명"은 역할 이웃 기준이다. 연애 후보 여덟은 그 집안 식구로 더해진다(역할 이웃 수는 그대로 13).
4. **집안**: Oliver=빵 굽는 집, Clara=포도원 할아버지 댁 손녀, Ivy=베 짜는 집, Rowan=어부 댁, Nora=주막 집, Arlo=제본 골목의 목수 댁, Hazel=벌 치는 집, Milo=양치기 댁. 이사 조건은 그 집안 이웃과 같다(그 이웃이 이사 오기 전에는 보이지 않는다).
5. **결혼 조건**: 내 집이 1단계 "방 하나 더"여야 한다(배우자가 살 방). 결혼식은 교파 예식이 아닌 광장 마을 잔치(설계 §8).
6. **연애 대화에 성경 구절 금지**(설계 §8), 목격자·교리 말투 금지. 모든 문구 verify(금지어) 통과.

## Global Constraints

- 설계 §7-1·§8, `docs/exclusion-list.md`. 게임 문장은 `life-text.json`에만, 금지어 verify 통과. 성경 인물 이름 금지 목록(영어·한글 표기)을 `src/content/forbidden.ts`에 더해 후보 이름과 **플레이어 이름 입력**에도 적용한다.
- 하트는 기존 0–10(`MAX_HEART`). 단계: 2 저녁 초대 가능, 4 둘만의 이야기 1, 6 둘만의 이야기 2, 8 + 들꽃 다발 → 연인, 10 + 연인 7일 + 약속의 끈 → 청혼 → 다음 장날 저녁 결혼 잔치.
- 연인·배우자는 한 명. 다른 후보에게 다발을 주면 "이미 마음을 준 사람이 있어요" 안내(질투 장면 없음).
- 그림: 청소년 톤 파스텔, 2픽셀 이상 선, 후보 스프라이트는 기존 10×14 이웃 스프라이트 방식(`dressNeighbor`)으로 각자 다른 머리·옷 색. 하트 장식 금지(연애 표시는 작은 꽃 아이콘).
- 커밋 전 네 가지 검사, 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, 브랜치 `plan-1-trial`. 배포는 작업 6에서만(사용자 사전 승인).

---

### Task 1: 이름 검사와 후보 여덟의 자리

**Files:** `src/content/forbidden.ts`(성경 인물 영어·한글 이름 목록), `src/content/neighbors.json`(후보 여덟: `id`, `role`=이름, `romanceable: true`, `look: 'f'|'m'`, `family`=집안 이웃 id, 집 문, 하루 동선), `src/engine/types.ts`(`NeighborDef`에 `romanceable?`, `look?`, `family?`, `name?`), `src/render/sprites.ts`(8명 옷·머리), `src/engine/map-spots.test.ts`(동선 자동 검사)
- [ ] 테스트: 금지 목록이 John/존/요한, Mary/메리/마리아, Peter/피터/베드로, Felix/벨릭스, Chloe/클로이/글로에 등을 잡는다. 후보 이름 여덟은 통과한다. 플레이어 이름 "Mary"는 막힌다.
- [ ] 후보는 가족 이웃의 `joinsAt`/`joinsAtBooks`를 물려받는다(가족이 이사 오기 전 안 보임).
- [ ] 커밋 `feat: 연애 후보 여덟 — 영어 이름, 집안, 동선`.

### Task 2: 연애 단계 엔진

**Files:** `src/engine/romance.ts`(새), `src/engine/game.ts`(선물·대화 흐름에 연결), `src/engine/items.ts`·`types.ts`(`bouquet` 들꽃 다발, `promiseCord` 약속의 끈), 거래(장날: 다발 닢 30, 끈 닢 150 — 연인일 때만), 테스트
- [ ] `candidatesFor(look)`: 주인공 모습과 다른 모습의 후보.
- [ ] `romanceStage(s, id)`: `friend | dating | engaged | married`. 들꽃 다발: 하트 8 이상 + 후보 → `dating`(한 명만). 약속의 끈: `dating` 7일 이상 + 하트 10 → `engaged`, 결혼일 = 다음 장날. 결혼일 저녁 → `married`, 배우자 이사(집 1단계 필요, 없으면 청혼 때 "집에 방이 하나 더 있으면 좋겠어요" 안내하고 받지 않음).
- [ ] 테스트: 각 단계 조건, 한 명만, 모습 조건, 집 조건, 저장/불러오기.
- [ ] 커밋 `feat: 연애 단계 — 다발·끈·결혼일`.

### Task 3: 둘만의 이야기와 문구

**Files:** `life-text.json`(`romance.<id>`: 인사 대사 5, 좋아하는 선물 설명, 이야기 1·2(하트 4·6), 고백, 청혼, 결혼 잔치 한마디), `src/engine/stories.ts`(이야기 트리거: 하트 도달 다음 날 아침, 그 사람 자리로 가면 장면), `src/features/scene/SceneView.tsx`(꽃 아이콘), 테스트
- [ ] 여덟 명 각자 성격이 다르게(예: 빵집 Oliver는 새벽 가마 이야기, 어부 댁 Rowan은 호수 날씨). 성경 구절·교리 말투 없음, 목격자 말투 없음. 문구는 청소년이 읽기 편한 존댓말.
- [ ] verify 통과(금지어), 문구가 비어 있지 않은지 테스트.
- [ ] 커밋 `content: 연애 후보 여덟의 이야기`.

### Task 4: 결혼 잔치와 함께 사는 날들

**Files:** `src/engine/game.ts`(결혼일 저녁 광장 잔치 — 이웃 모두 `FESTIVAL_SPOTS`, 배우자는 가운데), `src/render/renderer.ts`(잔치 장식: 광장 등불·꽃길, 2픽셀 이상), `life-text.json`(`scenes.wedding`, 앨범), 배우자 일상(`src/engine/romance.ts`: 아침 인사, 가끔 빵·차 선물, 집 안 자리 — 넓힌 방), 테스트
- [ ] 결혼 뒤 배우자는 낮엔 원래 집안 일터, 저녁엔 내 집. 아침에 한 번 말 걸면 작은 선물(하루 한 번).
- [ ] 테스트: 잔치 한 번, 배우자 동선, 선물 하루 한 번.
- [ ] 커밋 `feat: 결혼 잔치와 함께 사는 날들`.

### Task 5: 화면과 선반

**Files:** `src/features/talk/*`(대화 창에 연애 단계 표시·다발/끈 건네기 버튼 — 조건 맞을 때만), `src/features/shelf/Shelf.tsx`(선반 "이웃" 탭 또는 앨범에 결혼 사진), 테스트
- [ ] 커밋 `feat: 대화 창의 다발·끈, 앨범의 결혼 사진`.

### Task 6: 한 바퀴 확인과 배포

- [ ] 개발 도우미로 하트 올리기 → 다발 → 이야기 → 끈 → 결혼 잔치 → 다음 날 배우자 아침 인사. 두 모습(여자/남자 주인공)으로 각각. 콘솔 오류 0, 스크린샷 확대 확인.
- [ ] 전체 검사 후 배포(https://27maeul.vercel.app 200), 커밋 `chore: 계획 6 마무리`.

## 자기 점검
- §8 연애·결혼: 후보 8명(남 4·여 4, 가상), 하트 단계(인사→선물→저녁 초대→둘만의 이야기→고백→결혼), 교파 예식 아닌 마을 잔치, 연애 대화 성경 구절 금지 → 작업 1–4. §7-1 영어 이름·성경 인물 이름 금지 → 작업 1.
- 아이(설계 §8 다음)는 이 계획에 넣지 않는다.
