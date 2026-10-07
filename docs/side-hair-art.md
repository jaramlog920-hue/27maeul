# 옆모습 뒷머리 보강

귀 뒤가 한 색의 넓은 면으로 보이던 문제를 고쳤다. 기존 10×14 인물 도트와 외형 선택 번호를 사용한다. 게임 기능·이벤트 연결·주민 일과는 변경하지 않았다.

- 짧은 머리: 뒤통수의 둥근 명암과 안쪽으로 들어가는 목덜미.
- 긴 머리: 끊기지 않고 이어지는 머릿결과 갈라지는 끝.
- 단발: 귀를 덮는 면과 반듯한 끝선을 유지한 안쪽 밝은 결·바깥 그늘.
- 올린 머리·낮게/높게 묶은 머리·양갈래·쪽머리: 묶음의 볼륨과 휘어지는 꼬리.
- 땋은 머리: 두 칸 폭에서 교차하는 밝은 줄과 그늘.
- 어깨 물결 머리: 귀를 덮는 안쪽 줄을 유지하며 바깥 윤곽만 굽힘.

`src/render/side-hair-details.ts`가 오른쪽 모습의 후두부를 다듬는다. `character-details.ts`에서는 머리를 그린 다음, 장신구를 그리기 전에 적용한다. 왼쪽 모습은 기존 `spriteRows`의 좌우 반전으로 만든다. 앞·뒤 모습은 유지한다. 옛 주민도 자기 머리색과 모자 모양을 유지하며 뒷머리에 결을 더한다. 노년은 목 아래로 내려오는 가닥까지 은회색을 사용한다.

## 비교와 파일

`assets/side-hair/preview.html`에서 11종의 성인·아이·노인과 기존 주민 23명, 서고 방문객 4종, 입주 손님 3명의 좌우 서기·걷기를 확인한다.

`styles-before-after.png`의 열 순서: 수정 전 / 수정한 오른쪽 / 수정한 왼쪽 / 아이 / 노년. 줄 순서는 `HAIR_BACKS`의 11가지 선택 순서다.

`residents-before-after.png`는 각 칸에 수정 전·후를 나란히 놓았다. 기존 주민은 콘텐츠 목록 순서이며 그 뒤에 서고 방문객과 손님을 놓았다.

`before.json`은 이번 수정 직전의 비교 원본이다. 재생성해도 덮어쓰지 않는다. `manifest.json`에는 현재 PNG, 인물 팔레트, 원본 높이와 프레임 순서가 있다. 0은 서기, 1·2는 걸음이다. 걷기는 `0,1,0,2` 순서로 확인할 수 있다.

원본은 `spriteRows`를 사용한다. 개별 PNG는 투명 배경·10px 폭이며 아이는 높이가 11px이다. 화면에 놓을 때 발을 같은 바닥에 맞춘다.

재생성: `node scripts/export-side-hair.mjs`

짝 이벤트, 제작·직업, 손님, 방문객, 생활·가족, 노년, 결혼식·가구·요리·서고의 기존 PNG 묶음도 새 머릿결로 다시 내보냈다. 원본 함수를 쓰는 쪽과 PNG를 쓰는 쪽에서 같은 외형을 볼 수 있다.

이번에 함께 만든 이벤트 묶음 재생성: `node scripts/export-paired-events.mjs`.

JSON을 직접 불러오는 옛 내보내기 스크립트에는 공통 로더를 붙인다. 예: `node --import ./scripts/pixel-ts-loader.mjs scripts/export-event-life-motion.mjs`.

검증: `npm test -- --reporter=dot src/render/side-hair-details.test.ts src/render/sprites.test.ts src/render/paired-event-art.test.ts`
