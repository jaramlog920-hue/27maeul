# 함께하는 이벤트와 27권 완필 축하 도트

게임 연결용 자산이다. 이벤트 조건, 보상, 주민 위치, 일과, 저장 상태는 변경하지 않았다.

## 준비된 장면

| 장면 | 종류 | 원본 크기 | 프레임 | 길이 |
|---|---|---|---|---|
| 선물 주고받기 | 꾸러미·책·버들 바구니 | 64×32 | 8 | 2.08초 |
| 함께 기념물 놓기 | 결혼·출생·잔치·이사 편지·독립·완필 | 64×32 | 8 | 2.40초 |
| 27권 완필 축하 | 마지막 책 꽂기 → 27권 완성 → 책 보여주기·박수·종이 장식 | 128×56 | 8 | 2.88초 |

짝 동작은 좌우 두 배치를 제공한다. 모든 장면은 한 번 재생하고 마지막 자세를 유지한다. 8프레임 이후에 `0`으로 되돌리면 선물이 순간 이동하므로 `loop:false`를 따른다.

## 원본 API

`src/render/paired-event-art.ts`

```ts
pairedGiftFrame('book', frame, firstLook, secondLook, 'right')
pairedMemorialFrame('wedding', frame, firstLook, secondLook, 'right')
```

외형은 `{ avatar: FullAvatar, short?: number, elder?: boolean }`로 전달한다. 주민·랜덤 출생 인물의 현재 외형을 사용할 수 있다. PNG에는 예시 인물 외형이 들어 있다.

`first`는 주는 사람, `second`는 받는 사람이다. `'left'`는 장면 전체를 반전하며 두 사람의 역할을 유지한다. 반환값 `actors`의 두 레이어는 각각 자기 `palette`로 그린다. 각 레이어 크기는 64×32 전체 캔버스 크기다.

선물은 0–2프레임에 `first`, 3–4프레임에 `both`, 5–7프레임에 `second`가 잡는다. 기념물은 0–5프레임에 함께 낮추고 6–7프레임에 `ground`에 남긴다. `object.supports`는 시각적 받침 정보이며 실제 아이템 소유권 변경이나 이벤트 발동은 연결하는 쪽에서 처리한다.

`object.bounds`와 `hands`는 장면 좌표다. 손은 2×2이며 `x,y`가 왼쪽 위다. `actors[].anchor`는 발 기준점이다. 두 사람을 별도 시간으로 재생하지 않고 같은 프레임 번호로 재생한다. 공유 소품은 `propFront`에 한 번만 있다.

`src/render/completion-celebration-art.ts`

```ts
completionSceneFrame(frame, [writerLook, guestLook1, guestLook2])
```

인물 3명은 별도 레이어다. 0–3프레임에는 선반에 26권, 이동 중인 마지막 책에 1권이 있다. 4프레임부터 그 책이 선반에 합쳐진다. 5–7프레임의 큰 표지 책은 완성 책을 보여주는 별도 연출 소품이다. 장면 메타데이터 `completed`는 실제 완필 판정을 대신하지 않는다.

## 파일 사용

`assets/paired-events/preview.html`에서 동작·좌우 배치·다시 재생을 볼 수 있다. `manifest.json`에는 프레임 순서, 시간, 역할별 팔레트, 발·손 위치, 소품 위치, 분리 레이어 경로가 있다.

그리는 순서는 배경 소품 → 인물 레이어들 → 앞 소품이다. PNG는 투명 배경이며 정수 배율과 최근접 확대를 사용한다. 합성본은 바로 확인하는 용도, 분리본은 외형·배경과 조합하는 용도다. 각 레이어는 같은 캔버스 크기여서 좌표를 바꾸지 않고 겹치면 된다.

재생성 명령: `node scripts/export-paired-events.mjs`

검증 명령: `npm test -- --reporter=dot src/render/paired-event-art.test.ts`
