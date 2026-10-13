# ㅍ으로 시작하는 이벤트 개별 도트 제작

담당: 원래 이벤트 제목의 첫 초성이 ㅍ인 미완성 항목만. 접미사의 인물 이름으로 판단하지 않는다.
원본: C:/Users/wn410/OneDrive/Desktop/cloooo/twenty-seven
전용 worktree: C:/Users/wn410/.codex/worktrees/event-art-p
브랜치: codex/event-art-p
자동 작업: automation-3, 이 대화에서 15분 간격. 한 장면 완성을 목표로 하며 검증을 생략하지 않는다. 모두 끝나면 이 자동 작업만 중지한다.

2026-10-14: docs/event-art-progress.md와 실제 eventPreviewEntries/SCENES를 대조했다. 제목 순 24개 중 포도 수확 잔치 1개는 이미 완료되어 제외했다. 남은 23개 중 아래 3개를 완료했다. scenic kind가 있다는 이유만으로 새 완료로 처리하지 않으며, 기존 전용 장면은 대사 적합성과 브라우저 시각 확인 후 판단한다.

## 완료 3

- romance1:wendell — 파피의 이야기(가마 불): 현재의 새벽 가마, 정리된 장작과 긴 나무 도구, 빈 판매 바구니. 파피와 기록자가 뜨거운 입구에서 떨어져 서서 이야기한다. 둘째 대사에서 짧은 팔로 가마 쪽에 손을 편다. 회상에 언급된 아버지나 어린 파피를 현재 장면에 추가하지 않는다. 두 원래 대사와 닫기 흐름 유지. 확인: artifacts/scenery/p-001-fire-memory.png.
- romance2:wendell — 파피의 이야기(자기 이름의 빵): 밀가루 선반, 준비대와 반죽, 낮은 시음대의 빈 접시. 첫 시식을 부탁하는 둘째 대사에서 기록자에게 작은 손짓. 아직 만들지 않은 빵을 완성하거나 시식/선물하는 모습으로 앞당기지 않는다. 두 원래 대사, 이름 치환, 닫기 흐름 유지. 확인: artifacts/scenery/p-002-bread-wish.png.
- ev:merchant:story:1 — 팔지 않는 상자: 원래 장날 07:30–12:00 조건을 참고해 오전 좌판을 그렸다. 처음에는 상인이 몸을 낮춰 닫힌 개인 상자를 자기 쪽으로 밀어 둔다. 설명 선택은 닫힌 개인 상자에 대해 손짓하며, 기다리는 선택은 좌판 천 끝을 펴고, 진열 살피기는 기록자가 판매 물건 쪽으로 다가가 손을 둔다. 개인 상자는 모든 갈래에서 닫힌 채 별도로 남기며 대사에 없는 내용물을 만들어 넣지 않는다. 허리 높이 좌판, 상자/손/얼굴/발의 가림을 수정·확인했다. 세 선택의 원래 답변과 닫기, 시간/재고 및 기존 기억/해금 처리를 보존한다. 확인: artifacts/scenery/p-003-box-listen.png, p-003-box-wait.png, p-003-box-inspect.png.

게임/통합 미리보기/썸네일은 기존 drawAuthoredStory 단일 경로로 연결했다. 기존 resolve를 통해 실제 세대/맞춤 외형/옷차림을 전달한다. 미리보기는 저장과 앨범을 바꾸지 않는 검사를 추가했다. 카메라 확대/축소나 시간에 따른 인물 배율 변경은 넣지 않았다. 3개 전용 렌더러 외에 콘텐츠/게임 규칙 파일은 수정하지 않았다.

검증: worktree 관련 4개 파일의 검사 79개 통과 및 prebuild/TypeScript/Vite/PWA 빌드 통과. 최신 원본 연결 파일에 자기 등록/호출/대사 단계만 추가한 뒤, 통합 프로젝트 검사 84개와 전체 빌드도 통과했다. 다른 대화가 추가한 drawLastCopiedPage, drawOneMoreBook, drawOurBlend, drawCountingSteps, drawWorriedApothecary 및 해당 대사/선택 단계 코드를 유지했다. 원본 공유 파일을 worktree 버전으로 덮어쓰지 않았다. 검사 로그: artifacts/scenery/p-tests.log, p-build.log, p-integrated-tests.log, p-integrated-build.log.

## 다음 순서

다음은 romance1:penelope — 페넬로피의 이야기(처음 짠 구멍 난 천과 창가)이다. 새 실행 전에 최신 원본 진행 기록과 실제 목록을 다시 확인하고, 다른 대화의 새 연결 코드를 worktree에 반영한다. 미완성 수정이 있으면 먼저 마친다. 계속 여부는 묻지 않는다.

## 남은 담당 항목(제목 순)

- [ ] `romance1:penelope` — 페넬로피의 이야기 · 페넬로피
- [ ] `romance2:penelope` — 페넬로피의 이야기 · 페넬로피
- [ ] `romance2:penelope:friend` — 페넬로피의 이야기 · 페넬로피
- [ ] `psalmRest` — 펜을 내려놓은 저녁
- [ ] `ev:penelope:story:3` — 펴 보이는 저녁 · 페넬로피
- [ ] `romance1:postman` — 편지 나르는 이웃의 이야기 · 마일로
- [ ] `romance2:postman` — 편지 나르는 이웃의 이야기 · 마일로
- [ ] `romance2:postman:friend` — 편지 나르는 이웃의 이야기 · 마일로
- [ ] `growth:mailbox:full` — 편지 바구니의 새 소식
- [ ] `ev:fisher:story:2` — 평평한 바닥 · 핀
- [ ] `ev:marigold:ledgerNew` — 포도원의 값 · 메리골드
- [ ] `ev:child:small:labelTurn` — 표지 돌려 놓기 · 윌로
- [ ] `ev:rudy:story:1` — 표지 모양 · 루디
- [ ] `ev:rudy:label` — 표지의 글자 · 루디
- [ ] `ev:beekeeper:story:2` — 풀밭의 걸음 · 클로버
- [ ] `ev:juniper:danceNew` — 풀밭의 공책 · 주니퍼
- [ ] `saw:juniper:dance` — 풀밭의 춤 · 주니퍼
- [ ] `saw:penelope:unpick` — 풀어 버린 천 · 페넬로피
- [ ] `ev:juniper:avoid` — 피해 다니는 날들 · 주니퍼
- [ ] `afterCopy` — 필사를 마친 늦은 밤
