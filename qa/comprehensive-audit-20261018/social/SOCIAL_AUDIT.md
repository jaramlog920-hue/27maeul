# 사회·가족·시간·세계 분담 감사 (2026-10-18)

현재 작업 트리 기준의 읽기 전용 감사다. 기존 소스·테스트·설정은 수정하지 않았다. 새 재현 파일과 이 보고서만 `qa/comprehensive-audit-20261018/social/`에 만들었다. 과거 BUG_AUDIT의 주장은 현재 소스와 별도 재현으로 다시 판단했다.

## 확인 결과

**확인한 문제 7건: High 1 / Medium 5 / Low 1.** Critical은 발견하지 못했다. 문제가 없다는 보장은 아니다. 인메모리 순수 엔진 재현과 jsdom 버튼 클릭 재현을 구분한다. 브라우저 픽셀 렌더·실사용 저장 슬롯은 이 분담에서 변경하거나 시험하지 않았다.

### SOC-02 — High — 해산 기록 때문에 활성 소모임이 저장 후 사라짐

- 유형: 데이터 소실 / 상태 복원 / 기능 간 충돌.
- 위치: `src/engine/clubs.ts:77`, `:89`, `:176`.
- 원인: 생성 제한은 활성 모임 수만 세지만 `sanitizeClubs`는 해산 모임을 포함한 배열 앞 3개만 남긴다. 모임 id 생성도 남은 배열의 최댓값에 의존한다.
- 조건·재현: 차 모임을 생성하고 해산하는 일을 세 번 반복한 뒤 네 번째 모임을 만든다. 저장 전 활성은 `club:4`; `deserialize(serialize(state))` 후 활성 모임이 0개다. 앞선 모임 하나만 해산한 뒤 네 번째를 만들어도 네 번째가 잘린다.
- 실제 검증: **엔진 및 실제 직렬화/역직렬화 재현 확인**, `repro.audit.ts` 두 번째 테스트. 기존 모임 약속이 별도 배열에 남는 구조도 코드 확인했다. id 재사용으로 추가 충돌할 수 있으나 그 후속 단계는 별도 동적 재현하지 않았다.
- 영향: 소모임 목록, 회차 예약, 모임 작품 및 이력 연결.
- 권장 수정: 활성 모임 제한과 보관할 해산 이력을 분리하고, 로드 때 활성 모임을 우선 보존한다. id는 약속/회차 이력까지 고려하거나 독립 단조 카운터로 발급한다.

### SOC-01 — Medium — 함께하는 아이를 바꾸면 실제 막내의 성장 제한을 우회해 다음 아이를 가질 수 있음

- 유형: 기능 / 분기·해금 조건 / 계산·밸런스.
- 위치: `src/engine/siblings.ts:17`, `:60-64` (선택 교환 `:27-44`).
- 원인: `allKids`는 선택한 아이부터 반환하며 정렬하지 않는다. `babyBlock`은 배열 마지막 아이를 막내라고 가정한다.
- 조건·재현: 300일에 첫째 출생일 200, 둘째 출생일 299로 설정한다. 첫째가 선택됐을 때 `babyBlock`은 `youngest`. 가족 창에서 둘째를 선택하면 배열 마지막이 첫째가 되어 반환값이 `null`로 바뀌고 `askBaby`가 `babyWish=300`을 기록한다.
- 실제 검증: **순수 엔진 재현 확인**, `repro.audit.ts` 첫 테스트. UI의 아이 선택 버튼과 store가 같은 `selectKid`를 호출하는 것도 확인했다.
- 영향: 출산 간격, 셋째 해금, 가족 성장 밸런스.
- 권장 수정: 막내는 모든 아이 중 `born` 최댓값으로 찾는다. 선택 순서에 의존하지 않는다.

### SOC-04 — Medium — 후계자의 결혼 준비·아기 침대 보상 호감도가 보이지 않는 person id에 적립됨

- 유형: 데이터 무결성 / 보상 지급 / 세대 교체와 대화 기능 충돌.
- 위치: `src/features/talk/GenTalk.tsx:114`, `:148`; 호감도 저장·읽기 `src/engine/game.ts:2430-2473`; 대화 대상 전달 `src/features/talk/TalkBox.tsx:159` 주변.
- 원인: 상담·가족 관계는 `g-0001` 같은 인물 id를 쓰지만 플레이어 호감도와 화면은 `cosmo` 같은 이웃 자리 id를 쓴다. GenTalk은 `heartUp`에 인물 id를 그대로 전달한다. `heartUp`은 자리 id로 변환하지 않는다.
- 조건·재현: cosmo/poppy 자리를 g-0001/g-0002가 이어받아 결혼 준비 중이고 재료 빵 2개가 있는 상태에서 g-0001에게 [준비 돕기]를 누른다. 빵과 준비 항목은 처리되지만 cosmo/poppy 호감도는 각각 10 그대로이고 `hearts['g-0001']`, `hearts['g-0002']`만 증가한다.
- 실제 검증: **jsdom 실제 버튼 클릭 확인**, `ui-generation.audit.ts` 두 번째 테스트. 테스트에서는 외부 저장을 하지 않도록 applyLifeState만 인메모리 store 반영으로 대체했다. 아기 침대 보상은 동일한 잘못된 호출의 코드 확인이며 해당 버튼의 별도 클릭 재현은 하지 않았다.
- 영향: 후계자와의 결혼 준비/출산 지원 보상, 호감도 표시·해금.
- 권장 수정: `slotOfPerson(g,pid)`로 보상 대상을 변환하거나 호감도 API에서 id 체계를 명시하고 단일화한다.

### SOC-05 — Medium — 헤어진 뒤 다시 9하트에 도달하면 첫 이정표 선물을 반복 지급

- 유형: 중복 지급 / 보상 무결성.
- 위치: `src/engine/game.ts:2464-2474`, `:3904-3911`; 선물 정의 `src/engine/stories.ts:21` 전후.
- 원인: 이정표는 `before < m && after >= m`만 보고 이미 지급한 이웃별 이정표 여부를 기록하지 않는다. 헤어짐은 호감도를 49로 낮추므로 재교제 후 다시 같은 경계를 넘는다.
- 조건·재현: 관계 이야기 문턱을 모두 완료한 merchant와 교제하며 89→90으로 올리면 러그 1개. 헤어지고 14일 유예 뒤 호감도를 회복해 다발을 건네 다시 교제한 후 90에 도달하면 러그가 또 1개 지급된다.
- 실제 검증: **엔진 재현 확인**, `prior-triage.audit.ts` 첫 테스트. 시간 소모가 큰 일상 교류 반복은 유효한 `heartUp(...,'story')` 입력으로 압축했다. 고백, 냉각 기간, 재교제 및 실제 이정표 지급 함수는 그대로 실행했다. 최초 재현 시 관계 이야기 완료 사전조건을 빠뜨려 실패했고 그 fixture를 바로잡은 최종 실행은 3/3 통과했다.
- 영향: merchant/presser/postman 등 연애 후보의 이정표 선물과 물건 경제.
- 권장 수정: 이웃/인물별 이정표 지급 완료 표식을 영구 기록하고, 재교제 때 초기화하지 않는다. 기존 저장은 이미 본 선물 장면·일지 등을 고려해 이관한다.

### SOC-06 — Medium — 후계자와 결혼해도 배우자 옷장은 은퇴한 부모의 이름·외형·성별을 사용

- 유형: 기능 / 세대 교체 데이터 연결.
- 위치: `src/engine/game.ts:5053-5074`; renderer 외형 선택 `src/render/renderer.ts:2662`, `:2719`, `:2741`; `src/render/neighbor-look.ts`.
- 원인: `lookOf('spouse')`와 `dressUp`은 고정 이웃 정의/자리 id만 사용하며 `slotPerson`의 실제 후계자와 외형을 보지 않는다. 렌더러는 후계자 외형과 은퇴 부모 외형을 따로 사용한다.
- 조건·재현: cosmo를 여성 후계자 g-0001이 이어받고 그 후계자와 결혼한 상태에서 배우자 옷장을 연다. 후계자는 여성·다른 이름·다른 머리/옷인데 `lookOf` 결과는 cosmo의 남성 외형과 이름이다. 옷을 확정하면 `looks.cosmo`만 바뀌고 후계자의 avatar는 그대로다.
- 실제 검증: **엔진 재현 확인**, `prior-triage.audit.ts` 두 번째 테스트. 부모/후계자 렌더 분기는 정적 확인했으며 픽셀 스크린샷 비교는 하지 않았다.
- 영향: 배우자 옷장, 세대 교체 후 가족 표시와 커스터마이즈.
- 권장 수정: 실제 배우자 person id를 해석해 후계자 avatar를 기본값으로 사용하고 의상 상태도 그 인물에 귀속한다. 은퇴 부모 의상과 분리한다.

### SOC-07 — Medium — 이사 의사가 있던 가족의 집을 철거하고 다시 배정하면 과거 의사로 새 집에서도 곧 떠남

- 유형: 상태 수명 / 데이터 무결성 / 건축과 가족 이사 충돌.
- 위치: `src/engine/gen-homes.ts:70-74`, `:100-118`; `src/engine/newland-build.ts:413-421`, `:457-459`.
- 원인: 철거는 건물만 제거하고 `moveWish`/`moveBye` 등 가족 이사 표식을 정리하지 않는다. `giveFamilyHome`은 입주 날짜를 갱신하지만 이전 이사 의사는 보존한다. 아침 정산은 새 입주 날짜보다 기존 wish를 먼저 처리한다.
- 조건·재현: 40일에 `moveWish:1=40`인 가족의 b1 집을 `demolishBuild`로 철거한다. 41일에 b2를 `giveFamilyHome`으로 배정하면 입주일은 41이지만 wish는 40이다. 43일 아침 `familyMoveMorning`은 새 집에 산 지 이틀인 가족을 떠나게 한다.
- 실제 검증: **철거→재입주→아침 엔진 재현 확인**, `prior-triage.audit.ts` 세 번째 테스트. 실제 사용자 건물이나 운영 데이터는 수정하지 않았다.
- 영향: 가족 입주, 이사 알림·잔류 결정, 빈집/주택 배정.
- 권장 수정: 퇴거·철거 때 해당 거주 관계를 정리하고, 새 입주 때 이전 거주에서 생긴 wish/bye를 해제한다. 필요하면 이사 의사를 주거 id/입주 회차에 귀속한다.

### SOC-03 — Low — 빵집 아이가 견습/후계자로 전환되면 중복 등장

- 유형: 렌더링 / 가족 단계와 세대 교체 충돌.
- 위치: `src/engine/gen-looks.ts:45`, `:47-53`; 사용 지점 `src/render/renderer.ts:2719`, `:2777` (기본 후계자 외형 `:2662`, `:2741`).
- 원인: 빵집 아이의 특별 분기가 이미 grown baker-baby를 동반 목록에 넣는다. 견습 분기는 같은 아이를 다시 넣고, 은퇴 뒤에도 특별 분기가 기본 후계자 sprite와 별도로 아이를 넣는다.
- 조건·재현: 100일의 `newGenState`에 `heirs.baker={heir:'baker-baby',since:92}`를 부여하면 `companionsOf(...,'baker',100)`의 결과 id는 `[baker-baby,baker-baby]`. 132일 은퇴 표식 뒤에도 같은 아이가 companion으로 남는다.
- 실제 검증: **순수 함수 중복 결과 확인**, `ui-generation.audit.ts` 첫 테스트. UI/render 분담자가 renderer가 배열을 dedup 없이 각각 실내 x±1/실외 x±0.85 등에 그리는 것을 독립 확인했다. 픽셀 브라우저 검증은 하지 않았다.
- 영향: 빵집 가족, 견습, 은퇴 후 주변 인물 표시.
- 권장 수정: 특별 빵집 아이를 일반 견습/기본 후계자 분기와 상호 배타적으로 처리하고, companion id 중복을 차단한다.

## 테스트

새 파일은 기본 전체 테스트에 끼어들지 않도록 `.audit.ts` 이름이며 별도 설정으로만 실행한다.

```text
node node_modules/vitest/vitest.mjs run --config qa/comprehensive-audit-20261018/social/vitest.audit.config.mjs
  repro.audit.ts + ui-generation.audit.ts: 2 files, 4 tests passed, 109.79s

node node_modules/vitest/vitest.mjs run prior-triage.audit.ts --config qa/comprehensive-audit-20261018/social/vitest.audit.config.mjs
  prior-triage.audit.ts: 1 file, 3 tests passed, 100.16s
```

초기 sandbox 실행은 Vite 하위 프로세스 생성 `spawn EPERM`으로 시작하지 못했고 승인된 로컬 실행으로 검증했다. 전체 기존 suite/타입/빌드는 root 담당자가 별도로 기록한다. 이 보고서는 새 재현 7건의 최종 결과만 집계한다.

## 확인한 범위와 깊이

아래 59개 독립 엔진 파일은 원문을 끝까지 읽고 입력·상태·저장 정리·경계 조건·호출 관계를 검토했다. 전 파일을 동적 실행한 것은 아니다. 상세 파일 목록/실행 여부는 `COVERAGE.json`에 기록한다.

- 시간·달력: clock/calendar.
- 관계·가족·출산: avatar, bonds, child, romance, siblings, baker-baby, family 및 family-*.
- 주민 세대: gen 및 gen-* 전체, npc-* 전체, neighbors, meet, movement, hearts, people.
- 모임·세계 생활: club-* 및 clubs, companion/pet-life, events/event-scene/social-scene, spaces/space-life, news, neighbor-moments, inn-guests, night-doors, stories/scenic-kinds/living-moments, places, world, yard, work-day, talk-popups/tip-letters/wedding-attire, autonomy.
- UI: child/companion/family/clubs/talk/trip의 production TS/TSX 전체, SceneView/AuthoredStoryScene/scene-state-text/WeddingAttirePicker. 미술 asset 자체·CSS의 시각적 결과는 UI/render 분담 범위다.
- game.ts 집중 검토: careBaby, 주민 목적지/meetContext/lateSpots, 이야기·목격·일과·약속·선택 및 관계 상태, school/childTile/homeSeats, request/visit/dine, heartUp 및 이정표/호감도 상한, romance/bouquet/cord/breakup/date, childMorning/kidsMorning, sceneSeen, lookOf/dressUp/furnishSpouse. game.ts 전체에 대한 깊은 검토를 주장하지 않는다.
- game-store.ts 집중 검토: gift/talk, petActivity, child career/residence/mode/school/activity/show/name/select/pregnancy, goTrip, bouquet/cord/breakup/date, dressUp, chooseScene/nextScene/careBaby. 저장 슬롯·프레임·모달 복구의 전체 검토는 root 담당.

## 확정 건수에 넣지 않은 위험·제한

- `FestSession`의 계절 잔치 한 판은 `fireGuests(game)`를 매번 다시 계산하며 0명/감소 시 결과 화면과 task.stage 완료 기준이 어긋날 수 있다. 현재는 계절 행사 날이 항상 맑게 고정되어 과거 보고서의 '비 오는 잔치 날은 항상 막힘' 경로는 성립하지 않는다. 정상 시간 흐름에서 영구 진행 불가가 되는 경로를 이 분담에서 재현하지 않아 확정 버그로 집계하지 않았다.
- 여행은 아침 처리 후 현재 선택된 아이에 `familyTrip(next)`를 적용한다. 성장 장면으로 선택 아이가 바뀌는 순간의 잘못된 동행 보상 가능성은 정적 위험으로만 남긴다.
- `familyMorning`은 선택한 아이 한 명만 보고 호출되므로 비선택 형제자매 생일 처리 누락 가능성을 남긴다. 전체 아침 시나리오 동적 재현은 하지 않았다.
- `completeStory`가 꽉 찬 가방에 `add`로 keepsake를 넣는 경로는 손실 가능성이 있지만 현재 실제 people 콘텐츠에 keepsake 설정이 없어 현재 도달 가능한 버그로 집계하지 않았다.
- 실시간 UI 및 모바일/키보드/터치, 오프라인/PWA, 운영 저장 마이그레이션, 브라우저 사진 캐시, 접근성 결과는 이 분담만으로 확인하지 못했다. root와 UI 분담 보고서를 함께 봐야 한다.

## 우선순위

1. SOC-02 활성 모임 저장 소실을 먼저 수정한다.
2. SOC-04 보상 id 체계, SOC-06 배우자 의상 id 체계, SOC-07 주거 수명 표식을 정리한다.
3. SOC-01 출산 조건과 SOC-05 1회 선물 가드를 보완한다.
4. SOC-03 중복 인물 표시를 정리한다.

