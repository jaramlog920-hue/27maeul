# 구약맵 건물·경계·공사 도트

도트 자산만 준비했다. 게임 연결은 클로드가 할 수 있도록 PNG, 앞뒤 레이어, 좌표와 미리보기를 함께 제공한다.

| 묶음 | 구성 | 원본 크기 |
|---|---|---|
| 직업 건물 | 18종 × 앞·뒤·왼쪽·오른쪽 | 64×64 |
| 독립 작업 소품 | 직업별 18종 | 16×16 |
| 나무 울타리·낮은 돌담 | 재질별 16가지 이음 | 16×16 |
| 경계 문 | 재질 2종 × 가로·세로 × 열기·닫기 × 4프레임 | 16×16 |
| 공사 | 기존 25건물 × 4방향 × 3단계 | 64×64 |

## 직업 건물

요리사, 화가, 직조공, 정원사, 도공, 악기 제작자, 목수, 제빵사, 서기관, 학자, 목공, 배 만드는 사람, 찻집지기, 상인, 어부, 선원, 약초사, 여행자의 일터를 구분했다. 지붕은 박공·사면·비탈·평지붕·단차·두 박공·둥근 지붕으로, 창은 네모·아치·세로·격자·원형·넓은 창으로 나누었다. 야외 이젤, 베틀, 화덕, 약초 건조대 등은 별도 PNG로도 제공한다.

```ts
import { professionBuildingArt, professionWorkPropRows } from '../render/newland-building-art'
const building = professionBuildingArt('baker', 'down')
const prop = professionWorkPropRows('baker')
```

기존 건물 크기 64×64와 문 위치를 유지했다. 앞은 `(32,60)`, 왼쪽은 `(15,60)`, 오른쪽은 `(47,60)`이며 뒤는 `entry:null`이다. 발 기준점은 `(32,60)`, 점유 영역은 기존처럼 `{w:4,h:3,dy:1}`이다. 문은 기존 색과 10×21 형태를 유지한다. 작업 소품은 완공 그림에 이미 포함되어 있으므로 별도 소품을 추가할 때 중복 배치하지 않는다. `workSlot`은 건물 내부의 소품 좌표다.

서고·집·손님집·가족집·전시실·마당·정원 7종의 완공 그림은 기존 도트를 복사해 공사 마지막 단계와 비교할 수 있게 했다. 직업 건물만 새 외형이다.

## 울타리·돌담

```ts
import { boundaryRows, boundaryGateFrame } from '../render/newland-boundary-art'
const tile = boundaryRows('wood', 2 | 8) // 동·서로 이어지는 일자
const gate = boundaryGateFrame('stone', 'horizontal', 'open', frame)
```

이웃 비트는 북 `1`, 동 `2`, 남 `4`, 서 `8`이다. `0`은 독립 기둥이며 끝 4개, 일자 2개, 모서리 4개, T자 4개, 교차 1개를 포함해 재질별 16조각이다. 도로와 경계는 별도 이웃 집합으로 계산한다. 울타리와 돌담 사이 재질 전환 조각은 포함하지 않았다.

문은 4프레임, 프레임당 200ms, 전체 0.8초이며 `loop:false`다. 열기와 닫기는 역순이다. `horizontal`은 동서 이음 사이, `vertical`은 남북 이음 사이에 놓는다. 발 기준점은 `(8,16)`이다. `opening`은 그림에서 열린 정도를 나타내며 실제 통행 판정은 연결하는 쪽에서 처리한다.

## 공사 단계

```ts
import { constructionBuildingArt } from '../render/newland-building-art'
const art = constructionBuildingArt('weaver', 'left', 'frame')
```

순서는 `foundation` 기초·자재 → `frame` 기둥·들보·버팀대 → `roof` 일부 벽과 지붕·노출 서까래 → 별도 완공 그림이다. 공사에는 `entry:null`, `complete:false`를 반환한다. `plannedEntry`는 완공 시 문 좌표다. 뒤쪽과 열린 마당·정원은 `plannedEntry:null`이다.

마당·정원은 지붕 대신 마지막 단계에 바닥·울타리·화단을 마감한다. 이 둘의 점유 영역은 `{w:4,h:4,dy:0}`이다. 각 단계의 시간·날짜·진척도·건설 보상은 게임에서 정한다. 매니페스트의 `duration:900`은 미리보기용 권장 표시 시간이다.

## 파일과 레이어

- 전체: `assets/newland-building-upgrades/`
- 미리보기: `preview.html`
- 목록과 좌표: `manifest.json` (`connected:false`)
- 건물: `buildings/{id}-{direction}.png`
- 작업 소품: `work-props/{job}.png`
- 경계: `boundaries/{material}-{mask}.png`
- 문: `gates/{material}-{axis}-{action}-{frame}.png`
- 공사: `construction/{id}-{direction}-{stage}.png`
- 비교표: `buildings-contact-sheet.png`, `buildings-before-after.png`, `construction-contact-sheet.png`, `boundaries-contact-sheet.png`
- 조합 예시: `example-yard.png`

각 건물·공사·경계·문에는 합성 PNG와 `-back.png`, `-front.png`가 있다. 두 레이어는 합성 PNG와 같은 크기이며 서로 겹치지 않는다. 건물·공사는 `y<55`를 뒤 레이어, `y>=55`를 앞 레이어로 나눴다. 경계·문은 `y<10`과 `y>=10`으로 나눴다. 경계가 세로로 길게 이어질 때 각 타일의 지도 y좌표로도 정렬한다. 원본 코드 렌더링에는 건물용 `BUILDING_ART_PALETTE`, 경계용 `BOUNDARY_PALETTE`를 각각 사용한다.

모든 개별 PNG는 투명 배경이다. 확대 시 최근접 보간을 사용한다. 비교표와 마당 조합 예시는 배경을 포함한다. 기존 건물 원본과 게임 연결 파일은 수정하지 않았다.

```powershell
node scripts/export-newland-building-upgrades.mjs
npm test -- --reporter=dot src/render/newland-building-upgrades.test.ts
```
