# UI·렌더·콘텐츠 감사 통합

현재 실행 재현된 제품 문제는 Medium1/Low2다. 이전 보고서 M-18/L-30/L-31과 겹치는 현상을 현재 소스로 독립 확인한 것으로 과거 수와 합산하지 않는다. 원래 UI 담당자의 하네스/인벤토리를 root가 현재 변경된 렌더러로 재실행해 통합했다.

## UI-R2-03 — Medium / 여러 일터 중 첫 일터에 선택한 아이를 잘못 그림

- 현재 위치: src/render/renderer.ts:2105–2130. nl.builds.find로 첫 kidWork만 읽고 kidWorkJob(game)/game.child/game.looks.child로 직업과 인물을 고른다.
- 조건·재현: 첫 건물 owner=me:2 요리사, 두 번째 owner=me:1 목공인 상태에서 me:1 아이를 선택하고 09~17시 새 터를 그린다.
- 실제 실행: createRenderer.draw 및 furnitureUseFrame spy로 첫 요리사 건물에 '선택아이'의 craft동작이1회, 두 번째 주인 건물에는 해당 작업자 그림0회를 확인했다. 실제 건물 ownerJob은 각각 cook/woodworker로 정상이다.
- 영향: 다자녀 일터 인물·직업·복장과 건물 주인 불일치, 여러 일터 작업자 누락. FacilityView의 선물/제목 오류가 고쳐진 것과 별개다.
- 권장: 완료된 모든 kidWork를 순회하며 owner로 아이·옷장·직업·거주 상태를 해석해 그린다.

## UI-R2-02 — Low / 비선택 형제는 옷장·성인 모습·떠난 상태를 무시함

- 현재 위치: src/render/renderer.ts:2786–2797. baby이외에는 항상 child/growth2이며 wardrobe/left를 읽지 않는다.
- 조건·재현: 성인 큰아이에게 옷을 입히고 둘째를 선택한다. 큰아이 wardrobe가 siblings에 보존된 것을 확인한 뒤, 큰아이 옷 두 종류 및 left true/false로 실제 마을 렌더러를 비교한다.
- 실제 실행: 세 경우가 동일 child canvas를 사용하고 left=true에도 같은 위치에 그려진다. 픽셀 스크린샷 비교가 아니라 실제 렌더러 호출/캐시 canvas 동일성 검사다.
- 영향: 가족 창의 복장·나이·거주 상태와 마을 그림 불일치.
- 권장: 선택 아이와 같은 외형 helper를 형제마다 적용하고 childMode/left로 위치·표시 여부를 판단한다.

## UI-R2-01 — Low / 여행판 아이는 옷장·성인 모습을 무시함

- 현재 위치: src/render/renderer.ts:3311–3323. toddler여부 외의 모든 단계를 child/growth2로 그린다.
- 조건·재현: adult/scribe 아이와 여행판을 그리고, 실제 저장의 looks.child를 서로 다른 머리·복장 두 벌로 바꿔 다시 그린다.
- 실제 실행: createTripRenderer.draw의 아이 그림은 같은 canvas이며 높이13, 정상 성인 helper의 writer행은14다. 정상 helper는 두 복장에 서로 다른 spriteRows를 만든다.
- 영향: 성인 자녀 동행 여행의 외형 일관성. 여행 보상·저장 자체 오류로 확대하지 않는다.
- 권장: 마을과 여행이 같은 단계/옷장 해석 함수를 사용한다.

## 실행 및 검사 강도

- 초기 담당464개, 교차 호출9개 추가한473개 파일. code336/JSON133/CSS4,106,263줄. 전체 구조/TS·TSX·JSON 구문을 처리했으나 모든 코드의 의미나 JSON 문장을 정독했다는 뜻은 아니다.
- 이번 집중 분기 검토45개, 이전 집중 검토100개(그중89개는 SHA동일)로 별도 기록했다. coverage.json의 currentFocusedReview/priorFocusedReview/reviewLimits 참조. root의 이후 변경 검토는 상위 coverage-final.json에 별도 표시한다.
- 재개 후 현행 코드의 resumed-results.json:11검사 통과. renderer3재현, 빈캐시회복, 벽걸이/일정/거래 회귀, 새 머리7,392조합,577고유등록장면의 기본대사·선택답변 렌더 스모크,설정import/reset중삭제차단 포함. 구체적 숫자/포함 범위는 각 하네스 원문을 따른다.
- 장면 스모크는 null/사용자avatar,300×170·320×180·320×693,시각0/8초 조합의 비어있지 않은 그리기·유한좌표·예외 여부다. 모든 픽셀·얼굴 가림·날씨·연속프레임을 검증하지 않았다.
- gallery-integrity.json:40가구136PNG 모두 manifest SHA 일치,sourceHashes8중sprites.ts1개만 다름. stale manifest 검사는 실패하지만 그림이 잘못됐다고 확정하지 않는다. 원본manifest/그림은 수정하지 않았다.
- Settings busy중 처음부터는 확인창만 연다. 실제삭제버튼은 busy로 막히며 동일 run latch 사용. 합성모킹에서 erase0회로 후보 기각.

## 미확인 로딩 관측 — 확정 제품 오류에서 제외

ModalLayer loveVerse의 두 책 선로딩을 추가 검사했을 때 collected.map/filter는 php/jn 두 책인데 NtContent에 관측된 books는php만이었다. 로더/배열 계측을 제거한 root 최소하네스에서도 같은 관측이 나왔다. Set계측에서는 두 책이 yield된다. 반면 소스 및 Vite변환/프로덕션 번들에는 모든 책을 push하는 정상 for-of가 있다. 추가 Array.prototype 계측은 검사 보고 체계를 교란해 유효한 증거로 쓰지 않았다.

현재 런타임 제품 결함인지 시험 변환/관측 계층 문제인지 원인을 확정하지 못했다. modal-results.json/modal-isolated-results.json/root/modal-books-results.json/ModalLayer.transformed.js가 조사 근거다. 이를 제품 버그 수에 넣거나 UI06 전체가 해결됐다고 단정하지 않는다. piece-moods의 실패를 캐시하지 않는 순수 회복 경로는 현행 실행으로 확인했다. 다중책 cold UI의 실제 브라우저 전체 흐름은 미검증으로 남긴다.
