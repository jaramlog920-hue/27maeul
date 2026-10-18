# ㅎ 이벤트 개별 도트 장면 제작

작업 worktree: `C:/Users/wn410/OneDrive/Desktop/cloooo/twenty-seven-event-art-h`
브랜치: `codex/event-art-h`
공유 프로젝트: `C:/Users/wn410/OneDrive/Desktop/cloooo/twenty-seven`
자동 작업: `automation-2`, 이 대화의 heartbeat, 15분 간격.

## 범위와 보존

2026-10-14 실제 `eventPreviewEntries()`의 전체 콘텐츠를 읽어 제목 첫 초성이 ㅎ인 43개를 확인했다. life-text뿐 아니라 people.json, people-more.json에서 생성되는 장면도 포함한다. 다른 대화의 현재 작업은 별도 worktree의 기준 스냅샷 커밋 bd100cc에 보존했다. 공유 체크아웃은 초기 파일을 덮어쓰지 않고 최신 내용에 새 import·등록·분기만 더했다. 공통 진행 기록은 수정하지 않는다.

기존 도트가 있는 `facilityFinished` 계열과 `sunset`도 이 문서의 시각 확인과 검사가 끝날 때까지 완료로 기록하지 않는다. 아직 제작하지 않은 장면을 공통 색 변경으로 등록하지 않는다.

## 완료 6

- `ev:poppy:love:1` — 하나 더 넣은 차: 원래 19:00~20:00 건조 날씨, 찻집 곁 위치, 웬델과 기록자를 확인했다. 박하·꿀·주전자·두 잔, 저녁 찻집 창·메뉴판을 각각 그렸다. 두 답변에서만 사과 꽃을 공개하며 맞혀 보는 선택은 웬델의 작은 손동작, 한 모금 선택은 접시를 남기고 잔만 입 옆에 든다. 얼굴과 짧은 손을 가리지 않는다. 원래 두 대사·두 선택·각 한 답변 및 조건과 보상은 변경하지 않았다.
- `shelved` — 한 권 더: 서고의 낮은 빈 칸에 책 한 권이 들어가는 정수 이동. 기존 인물의 짧은 팔다리와 발 접지, 선반 앞 얼굴·손을 유지한다. 원래 한 줄과 닫기 기능을 보존한다.
- `bookBound` — 한 권을 다 필사했다: 실제 최종 필사 후, 아직 제본 전인 대사에 맞춰 낱장 묶음과 마지막 글줄, 내려놓은 펜·잉크·등잔, 의자와 작업대, 선반 위 표지판과 실을 따로 배치한다. 원래 한 줄을 보존한다.

게임은 ModalLayer → SceneView → AuthoredStoryScene, 통합 미리보기는 EventPlayer → AuthoredStoryScene, 썸네일은 EventThumbnail → drawAuthoredStory로 같은 함수를 사용한다. 한 권 더에서 기존 LandscapeScene 우선 분기가 새 그림을 건너뛰는 것을 방지했다. 잔치의 FeastView 동작은 유지했다. 미리보기 저장·앨범 무변경과 닫기 상태 보존 검사를 추가했다.

- `ev:juniper:story:2` — 한 사람 앞에서: 원래 저녁 17:00~19:00의 언덕, 날씨·7일 조건·등장 주니퍼·선택 보상과 대사 6줄/선택별 답변 2줄을 확인했다. 덮은 공책 사이 노란 꽃 종이 귀퉁이, 그림을 내미는 컷을 분리하고 노란 꽃 열둘·흰 꽃 셋(마지막 한 꽃잎 미완성)·귀퉁이 벌 한 마리를 그린다. 듣기 선택의 추가 한 줄에는 작은 손동작, 그림을 오래 보는 선택에는 종이를 정수 도트로 약간 기울이며 기록자가 가까이 앉는다. 흰 꽃 질문에서는 원래 그림을 그대로 두고 설명을 이어간다. 모두 브라우저 시각 확인. 사진: artifacts/scenery/h-003-shown-to-one-closed.png, h-003-shown-to-one-listen.png, h-003-shown-to-one-study.png, h-003-shown-to-one-white.png.
- `ev:penelope:unpickTalk` — 한 올: 베 짜는 집 앞, 13:00~18:00 건조 날씨, 페넬로피와 기록자, 한 올을 틀려 사흘 짠 천을 풀었다는 원문과 기존 조건/보상을 확인했다. 실제 직조집의 붉은 기와·크림 벽·둥근 창·갈색 문을 참고하고 발 옆에 풀린 실을 둥글게 그렸다. 못 찾겠다는 선택은 실을 그대로 둔다. 같이 감는 선택은 두 사람이 무릎을 낮춰 짧은 손 사이에 타래를 잡고 감으며 풀린 실은 줄어든다. 마지막 답변에서는 시간을 다시 시작해도 실이 풀리지 않는다. 타래가 얼굴을 가리는 초기 배치를 수정했고 두 선택, 손 간격, 발과 자세, 썸네일을 브라우저에서 확인했다. 대사 2줄, 선택별 답변 2줄과 기존 시간·소지품·호감도 처리를 보존했다. 게임/미리보기/썸네일에 동일 렌더러 연결. 완료된 다섯 장면 모두 미리보기가 게임과 앨범을 바꾸지 않음을 검사한다.
  - 관련 검사 80개 통과(작업 worktree와 공유 프로젝트 각각). 전체 빌드 양쪽 통과. 기록: artifacts/scenery/h-004-tests.log, h-004-build.log, h-004-integrated-tests.log, h-004-integrated-build.log.
  - 확인 이미지: artifacts/scenery/h-004-one-thread-loose.png, h-004-one-thread-honest.png, h-004-one-thread-wound.png, h-004-one-thread-gallery.png.
- `ev:beekeeper:story:4` — 한 장의 관찰: 찻집, 15:00~16:00, 클로버·주니퍼·웬델, 전날 꽃 이름 시식판 이후라는 실제 이벤트와 공책 한 장·꽃 그림·주니퍼 숫자 기록을 대조했다. 오후 격자창과 차통 선반, 벽에 건 한 장의 공책, 그림 옆에 선 주니퍼, 설명하는 클로버, 별도 찻잔 탁자의 웬델을 그렸다. 토끼풀 네 번의 아침 관찰을 숫자 1·2·3·4로 표현한다. 떨어져 보는 선택은 관람 거리를 유지하고, 질문하는 선택은 기록자가 그림 앞에 서고 주니퍼가 작은 손동작으로 답한다. 박수 선택은 기본 박수 도트 모션을 쓰며 손님 둘과 주니퍼가 기록자 쪽으로 고개를 돌린다. 손님들은 대사의 이름 없는 손님으로 그리며 별도 이웃 이름이나 관계를 추가하지 않는다. 그림 옆자리에는 찻잔을 놓지 않는다. 기본 비율, 짧은 손, 앉은 손님의 의자, 얼굴·손·소품 가림과 대화창 위의 발을 세 선택 모두 브라우저에서 확인했다. 실제 세대/옷차림은 기존 등장 인물 해석을 사용한다. 대사 4줄, 선택별 1답변 및 기존 시간·소지품·호감도·해금과 스토리 완료 조건은 변경하지 않는다. 게임/통합 미리보기/썸네일에 같은 렌더러 연결. 미리보기는 저장과 앨범을 바꾸지 않는다.
  - 관련 검사 98개 통과(작업 worktree와 공유 프로젝트 각각), 전체 빌드 양쪽 통과. 이전 장면 파일을 다시 복사하지 않고 공유 연결 파일의 최신 내용에 이번 등록·import·분기만 추가했다.
  - 확인 이미지: artifacts/scenery/h-005-observation-wall.png, h-005-observation-watch.png, h-005-observation-question.png, h-005-observation-clap.png, h-005-observation-gallery.png.
  - 검사 로그: artifacts/scenery/h-005-tests.log, h-005-build.log, h-005-integrated-tests.log, h-005-integrated-build.log. 공유 최신 의존성 보존 스냅샷: 5405fd0.
## 전체 담당 목록 (제목 순)
- [x] `ev:poppy:love:1` — 하나 더 넣은 차 · 웬델
- [x] `shelved` — 한 권 더
- [x] `bookBound` — 한 권을 다 필사했다
- [x] `ev:juniper:story:2` — 한 사람 앞에서 · 주니퍼
- [x] `ev:penelope:unpickTalk` — 한 올 · 페넬로피
- [x] `ev:beekeeper:story:4` — 한 장의 관찰 · 클로버
- [ ] `ev:marigold:bossy` — 할 일 목록 · 메리골드
- [ ] `ev:marigold:rainTea` — 할아버지 방 · 메리골드
- [ ] `ev:marigold:love:2` — 할아버지께 말하기 · 메리골드
- [ ] `growth:community` — 함께 가꿀 마을
- [ ] `loverTrust:dexter` — 함께 걸어온 날들 · 덱스터
- [ ] `loverTrust:rudy` — 함께 걸어온 날들 · 루디
- [ ] `loverTrust:postman` — 함께 걸어온 날들 · 마일로
- [ ] `loverTrust:marigold` — 함께 걸어온 날들 · 메리골드
- [ ] `loverTrust:basil` — 함께 걸어온 날들 · 바질
- [ ] `loverTrust:merchant` — 함께 걸어온 날들 · 오스카
- [ ] `loverTrust:presser` — 함께 걸어온 날들 · 올리버
- [ ] `loverTrust:poppy` — 함께 걸어온 날들 · 웬델
- [ ] `loverTrust:juniper` — 함께 걸어온 날들 · 주니퍼
- [ ] `loverTrust:cosmo` — 함께 걸어온 날들 · 코스모
- [ ] `loverTrust:tilly` — 함께 걸어온 날들 · 틸리
- [ ] `loverTrust:wendell` — 함께 걸어온 날들 · 파피
- [ ] `loverTrust:penelope` — 함께 걸어온 날들 · 페넬로피
- [ ] `fam:cook` — 함께 만든 음식
- [ ] `facilityFinished` — 함께 만든 자리
- [ ] `facilityFinished:shade` — 함께 만든 자리 · 그늘막
- [ ] `facilityFinished:longBench` — 함께 만든 자리 · 긴 벤치
- [ ] `facilityFinished:signPost` — 함께 만든 자리 · 표지판
- [ ] `facilityFinished:flowerBed` — 함께 만든 자리 · 화단
- [ ] `fam:supper` — 함께 먹는 저녁
- [ ] `ev:shepherd:story:4` — 함께 쓰는 자리 · 오웬
- [ ] `growth:community:full` — 함께 짓는 공동시설
- [ ] `fam:meal` — 함께 차린 식탁
- [ ] `ev:presser:small:jarLabels` — 항아리 표지 · 올리버
- [ ] `ev:penelope:home:1` — 현관 발판 · 페넬로피
- [ ] `ev:rudy:home:1` — 현관 선반 · 루디
- [ ] `ev:cosmo:love:2` — 형에게 쓰는 답장 · 코스모
- [ ] `ev:cosmo:jealous` — 형의 편지 · 코스모
- [ ] `sunset` — 호숫가 노을
- [ ] `ev:basil:small:walk` — 호숫가 한 바퀴 · 바질
- [ ] `ev:tilly:quarrel` — 호숫가의 저녁 · 틸리
- [ ] `childHelps` — 혼자 다니는 아이
- [ ] `ev:wendell:home:1` — 혼자 맡은 가마 · 파피

## 검증 결과

- 브라우저에서 두 차 선택, 서고 책, 필사 작업대의 인물·소품·발·가구와 얼굴 가림을 확인했다. 새 브라우저 탭의 최종 코드 오류 로그는 0개.
- 관련 검사 82개 통과. worktree와 공유 체크아웃의 전체 npm run build 통과. 공유 통합 후 관련 검사 87개 재통과.
- 시각 자료: artifacts/scenery/h-000-our-blend-guess.png, h-000-our-blend-sip.png, h-001-one-more-book.png, h-002-last-copied-page.png.
- 검사 로그: artifacts/scenery/h-tests.log, h-build.log, h-integrated-tests.log, h-integrated-build.log.

## 다음 작업

다음 담당 이벤트는 `ev:marigold:bossy` — 할 일 목록. 제목 순으로 하나씩 이어간다. 새 실행은 이 목록과 공유 프로젝트의 최신 docs/event-art-progress.md 및 실제 eventPreviewEntries를 먼저 대조한다. 이번 턴에서 제본 이전 상태를 확인한 두 단일 장면의 초안을 먼저 준비했고, 실제 생성 목록 대조 후 맨 앞의 하나 더 넣은 차를 선택별로 검증한 다음 세 장면 완료를 기록한 뒤 다음 장면 한 사람 앞에서를 세 선택별로 마쳤다.

새 장면의 연결은 공유 파일의 최신 내용을 다시 읽고 필요한 import·등록·분기만 삽입한다. 전체 연결 파일이나 초기 스냅샷을 덮어쓰지 않는다. 공유 파일에서 새로운 다른 대화 코드가 있으면 그 연결을 worktree에도 추가적으로 합쳐 테스트한다. scripts/integrate-h-art.mjs는 이번 여섯 장면의 안전한 통합 도구이며 이후 새 장면에 맞춰 갱신해야 한다.



2026-10-14 추가 대조: 공유 프로젝트에 커밋된 변경도 기준 스냅샷 bd100cc와의 diff로 읽고 미커밋 파일과 함께 worktree에 보존했다. 최신 공유 소스 기준 스냅샷은 9390195다. 반복 작업 프롬프트의 오래된 완료 수/다음 이벤트를 제거했으며 항상 이 문서와 실제 목록으로 결정한다. 담당 목록은 43개, 완료 6개다.


