# 서고 방문객·길 이음·기억 정원·범위 책장·선물 아이콘

2026-10-07 사용자 전달 목록을 기준으로 준비한 **미연결 도트 자산**. 게임 연결은 클로드가 맡는다.

## 제작 목록

| 항목 | 원본과 PNG |
|---|---|
| 서고 방문객 | 나그네·배우러 온 사람·꼬마·다른 마을 서기, 앞/뒤/왼쪽/오른쪽 각각 4프레임 걸음. 64 PNG |
| 꾸미기 길 | 모래·돌 각각 4방향 인접 조합 16개. 독립 칸·끝·일자·모서리·T·교차와 모든 방향. 32 PNG |
| 사건별 기념물 | 결혼(두 고리)·아이 출생(요람)·잔치(작은 빵과 깃발)·이사 편지(봉투)·새집/독립(짐)·27권 완필(펼친 책). 꽃만 흔들리는 4프레임. 24 PNG |
| 구약 범위 책장 | 창세기–신명기: 세로 칸막이 / 여호수아–에스더: 작은 서랍형 / 욥기–아가: 넓은 두 선반 / 이사야–말라기: 푸른 가로 띠. 각 0~12칸 채움. 52 PNG |
| 손님 선물 | 버들 바구니·별자리 그림판·씨앗 주머니, 8×8 축약판과 16×16 상세판을 각각 그렸다. 6 PNG |

개별 PNG 178개. 길 연결 예시 2개와 도감 1개를 더해 181개. `preview.html`, `manifest.json` 포함.

## 클로드가 연결할 API

원본: `src/render/archive-followup-art.ts`.

- `visitorWalkFrame(kind, facing, frame)` → `actor` 24×24, 인물 `palette`, `anchor`, `duration: 180`, `loop: true`.
- 외형은 기존 `village-followup-art.ts`의 `VISITOR_LOOKS`와 공유한다. 이번 작업은 해당 상수를 export로 공개했을 뿐 기존 방문객 기능이나 렌더러를 변경하지 않았다. 걸음 순서는 0·1·0·2, 앵커는 고정이다. 이동 시 실제 다리가 바뀌고 서 있는 그림을 들썩이는 처리에 의존하지 않는다.
- `joinedPathRows('sand' | 'stone', mask)` → 투명 바탕 16×16, `JOIN_PATH_PALETTE`. 기존 BG_ART 소재에서 모래/돌 색과 결을 재사용했다. 기본 지형·기본 길 파일은 수정하지 않았다.
- 길 mask: 북=1, 동=2, 남=4, 서=8. 예: 5=세로 일자, 10=가로 일자, 3=북동 모서리, 7=서쪽이 없는 T자, 15=교차. 이웃에 **같은 종류의 꾸미기 길**이 있는 방향만 OR로 합친다. 모든 조각은 길 영역만 있고 바탕이 투명하므로 먼저 해당 칸의 실제 바닥을 그린 뒤 올린다.
- `eventMemoryRows(kind, frame)` → 16×16, `ARCHIVE_PROP_PALETTE`. 저장된 실제 사건에만 대응해 배치할 것. 위치·새 사건·날짜·보상·아이템 ID는 이 자산 작업에서 추가하지 않았다.
- `rangeShelfRows(roomId, fill)` → 16×16, `ARCHIVE_PROP_PALETTE`. roomId는 기존 OT_ROOMS의 law/history/poetry/prophets. fill은 0~12로 제한하며, 이미 책이 포함된 합성 그림이다. 기존 별도 책 채움 그림을 중복으로 올리지 말 것. 화면 이름은 책 범위(기존 OT_ROOMS.label)를 유지한다.
- `guestGiftIconRows(itemId, size)` → 8×8 또는 16×16, `ARCHIVE_PROP_PALETTE`. itemId는 기존 willowBasket/starChart/seedPouch.
- manifest는 방향·프레임·앵커·시간, 길 mask·연결 방향, 기념물 프레임, 책장 채움, 선물 크기별 경로를 담는다. `connected: false`.

## 손님 입주 관련 기존 완성본

- 넬리·모리스·아이비의 외형·네 방향 걷기·손일·읽기·휴식 등: `assets/settlement-guests/manifest.json`, `src/render/settlement-guests-art.ts`.
- 짐 들고 도착·짐 내려놓기·열쇠 받기·문 앞 인사: `assets/life-additions/manifest.json`, `src/render/life-additions-motion-art.ts`의 `guestArrivalFrame`.
- 도트는 준비되어 있다. 실제 입주 상태·집 배정·일과·지도 등장 연결은 이 작업에서 추가하지 않았다.

## 내보내기·확인

`node scripts/export-archive-followup.mjs` → `assets/archive-followup/`.

- `preview.html`: 분류 필터, 방문객 방향 선택, 모션 재생/정지, 모래/돌 길의 5×5 연결 예시, 책장 0/4/8/12칸 비교, 아이콘 크기 비교.
- `contact-sheet.png`: 위 네 줄은 방문객 4종, 각 줄 앞/뒤/왼쪽/오른쪽. 그 아래 모래 16조각·돌 16조각, 사건 기념물 6종, 맨 아래 범위 책장 4종과 선물 3종.
- `npm test -- --reporter=dot src/render/archive-followup-art.test.ts src/render/village-followup.test.ts`: 2파일 9테스트 통과. 크기·팔레트·발 변화·앵커 고정·길 연결 경계·도상 구별·책장 채움 검사.
- `npx tsc -b`: 통과.
- 도감과 돌 길 연결 예시 PNG 육안 확인. 게임 화면 검사는 하지 않았다.
- 렌더러·엔진·일과·저장·가구·아이템 연결·기존 배경 교체·커밋·배포 없음.
