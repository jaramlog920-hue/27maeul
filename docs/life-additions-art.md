# 생활 도트 후속 6묶음 — 자산만 제작

2026-10-07 요청: 유아·아이·노인 동작, 손님 입주 장면, 기억 정원 기념물, 책등 추가 장식을 모두 제작. 게임 연결은 사용자가 클로드에게 맡기므로 원본·PNG·미리보기만 만들었다.

## 준비한 것

| 묶음 | 도트·모션 |
|---|---|
| 유아 | 네 방향 아장아장 걷기, 기어가기, 주저앉기, 손 내밀기 |
| 아이 | 앉아 글쓰기, 책 넘기기, 작은 바구니 들고 걷기, 물건 건네기 |
| 노인 | 느린 앉기·일어나기, 허리 펴기, 손 흔들기 |
| 손님 입주 | 넬리·모리스·아이비 각각 짐 들고 도착, 짐 내려놓기, 열쇠 받기, 문 앞 인사 |
| 기억 정원 | 결혼(두 고리), 출생(요람), 독립(열쇠) 표식, 꽃고리, 꽃 화분, 리본 말뚝 |
| 책 장식 | 모서리 금속, 천 책갈피, 눌러 찍은 무늬, 손때 묻은 표지. 기존 크림·하늘·풀빛·연보라·모래·회청 6색의 표지와 책등 + 작업대 손동작 |

인물 24개 동작 세트 × 4방향 × 4프레임 = 합성 384장. 인물/뒤 소품/앞 소품 레이어 1,152장. 기념물 24장. 표지·책등 48장. 책 작업 96장. 합성 및 레이어 PNG 1,704장, 별도 도감 PNG 1장.

## 클로드 연결용 원본

- `src/render/life-additions-motion-art.ts`: `toddlerMotionFrame`, `childMotionFrame`, `elderMotionFrame`, `guestArrivalFrame`.
- 유아·아이·노인은 마지막 인수 `avatar`를 실제 인물의 `FullAvatar`로 전달할 수 있다. 기본값은 자산 확인용 예시 외형이다. 랜덤 아이의 외형 데이터를 바꾸거나 새 성장 규칙을 만들지 않았다.
- 입주 동작은 현재 `SETTLEMENT_GUESTS`의 고유 외형을 사용한다. 손님 이름은 다른 작업에서 이미 바뀐 **넬리**를 그대로 읽으며, 모리스는 노년 외형을 유지한다.
- 인물 동작 반환: 24×24 `actor`, `propBack`, `propFront`, 인물 `palette`, `anchor`, `duration`, `loop`. 도구는 `ADDITION_PROP_PALETTE`로 그린다. 뒤 소품 → 인물 → 앞 소품 순서.
- 기념물: `src/render/life-additions-prop-art.ts`의 `memoryMarkerRows(kind, frame)`, 16×16, `MEMORY_PALETTE`. 꽃/리본만 작은 움직임, 표식 자체의 도상은 고정이다. 날짜·이름·발생하지 않은 사건을 그림에 넣지 않았다.
- 책: `decoratedBookRows(detail, color, cover)` = 책등 8×20 / 표지 24×32. `bookDetailWorkRows(detail, color, frame)` = 작업대 40×40. 색은 `bookDetailPalette(color)`.
- 책 꾸미기 마지막 프레임은 완성 표지와 같고 손은 사라진다. 장식별 새 제본 옵션·아이템 ID·가격은 만들지 않았다.
- `assets/life-additions/manifest.json`: 프레임별 PNG·레이어 경로, 크기, 앵커, 시간, 반복 여부. `connected: false`.
- 내보내기: `node scripts/export-life-additions.mjs`.

## 보기

- `assets/life-additions/preview.html`: 6묶음 필터, 방향 선택, 재생/정지, 단발 동작 다시 보기. 단발은 마지막 자세에서 멈춘다. 반복은 각 동작의 프레임 시간을 사용한다.
- `assets/life-additions/contact-sheet.png`: 위 3줄은 유아 4/아이 4, 노인 4/넬리 입주 4, 모리스 입주 4/아이비 입주 4. 다음 줄은 기념물 6종. 아래 4줄은 금속 모서리/천 책갈피/눌러 찍은 무늬/손때 표지이며 각 줄은 6색이다.

## 검증과 범위

- `node scripts/export-life-additions.mjs`: 전체 PNG·레이어·manifest·미리보기 생성 성공.
- PNG 도감 육안 검사 후 기어가는 유아의 몸통·하의 가시성을 보완했다.
- `npm test -- --reporter=dot src/render/life-additions-art.test.ts`: 6테스트 통과. 모든 인물 동작의 방향·팔레트·레이어 크기, 자세 차이, 외형 교체, 기념물 도상, 책 작업 완성 프레임 검사.
- `npx tsc -b`: 통과. 첫 실행에서 검사용 함수 타입의 자기 참조를 수정한 뒤 재검증했다.
- 게임 렌더러·엔진·일과·저장·제본 선택지·기존 자산 파일은 이 작업에서 수정하지 않았다. 신규 자산 모듈은 앱에서 import하지 않는다.
- 게임 연결·입주 구현·기념물 배치·게임 화면 확인·커밋·배포는 하지 않았다.
