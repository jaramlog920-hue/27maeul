# 기존 suite 실패 독립 분류 — 과거 실행 기록

2026-10-19 현재 소스와 대조했다. **`full-suite.json`은 최신 소스의 실행 결과가 아니다.** JSON의 시작 시각은 2026-10-18 16:12:26 KST, 파일 수정 시각은 17:26:43 KST다. 이후 여러 소스·테스트가 23:11~23:12 KST 등에 수정됐다. root가 시작한 현재 코드 재실행 결과가 이 기록보다 우선한다. 이 분담에서는 기존 파일을 수정하거나 실패 suite를 재실행하지 않았다.

기록된 결과는 30,605개 중 30,585 통과 / 15 실패 / 5 보류다. 실패 assertion은 12개 파일에 있다. JSON의 `numFailedTestSuites=23`은 실패 파일 개수와 같지 않다. 10MB 원문을 출력하지 않고 Node로 실패 assertion만 추출해 `failed-assertions.json`에 보관했다.

| 파일 / 실패 항목 | 독립 분류 | 판단 근거와 현재 상태 |
|---|---|---|
| content/catalog.test.ts — 물건·바꾸기 이름 | 과거 제품 연결 오류 + 현재 테스트 계약 부채 | 옛 기록은 `T.trades.weddingTuxedo` 부재를 지적한다. 과거 TradeBoard가 이 값을 그대로 label로 써 이름이 비는 경로가 있었으나, **현재 TradeBoard.tsx:83은 `names[t.id] ?? itemName(icon)`으로 대체**한다. 현재 UI 결함으로 집계하지 않는다. 모든 trade에 별도 번역키가 있어야 한다는 테스트와 fallback 정책을 맞춰야 한다. |
| content/ot-catalog.test.ts — 빌드 메인 청크 분리 | 빌드 산출물·테스트 전제 의존 | 실패는 앱 코드 예외가 아니라 `files.find(...)`가 undefined인 상태에서 test가 path.join을 호출한 것이다. 현재 테스트는 game-/index-를 찾도록 바뀌었다. 해당 dist가 어느 소스/빌드의 산출물인지 먼저 확인하고 최신 build+manifest 기반으로 검증해야 한다. |
| features/ModalLayer.test.tsx — 좋아하는 선물 반응 | 문구 기대값 부채 | test는 옛 문장 `어머, 제가 좋아하는 거예요!`를 찾는다. 현재 life-text.json giftReplies.liked는 `정말 기뻐요! 제 마음에 꼭 들어요. 고마워요.`이고 store는 이 값을 표시한다. 실패 자체는 선물 처리나 호감도 결함을 입증하지 않는다. |
| features/ModalLayer.test.tsx — 깔개 놓기 | 저장 모양 기대값 부채 | 현재 room.placement는 넘겨진 방향을 `facing:'down'` 등으로 보존한다. test는 방향 속성이 없는 객체와 완전 일치를 요구한다. 놓인 칸/개수/가방 차감/회수 기능과 메타데이터를 나눠 검증해야 한다. |
| features/ModalLayer.test.tsx — 협탁 위 화병 | 저장 모양 기대값 부채 | 같은 placement의 `turned` 속성이 작은 물건에도 포함된다. test의 `{on:true}` 객체와 완전 일치 실패이며, 슬롯 위치·on 상태는 실패 메시지에서 동일하다. 현재 생산 동작 오류로 집계하지 않는다. |
| engine/apothecary.test.ts — 매력 판매 보너스 | 의도된 단계 계산 변경 / fixture 부채 | sellBonus는 levelOf>=3을 사용하고 levelOf는 statScore를 20점 단위로 계산한다. 저장 인코딩 raw.level=3을 효과 3단계로 읽는 옛 기대가 맞지 않는다. 현재 테스트는 raw.level=4에서 +1을 기대하도록 이미 조정됐다. |
| engine/club-affinity.test.ts — 회원 친밀도 | 의도된 배율 / 기대값 부채 | 0.4는 autonomy가 잠긴 신규게임에서 2×npcAffinityScale(0.2)다. 현재 테스트는 배율을 곱한 값을 기대하도록 바뀌었다. 제품 계산 오류 증거가 아니다. |
| engine/gen-replay.test.ts — 씨앗 40개 첫 연인 다양성 | 환경·실행 시간 한도 | 기록은 60초 timeout뿐이고 결과 분포 assertion 실패는 없다. 병렬 부하 및 연산량을 분리해 단독 실행해야 하며 연애 로직 결함으로 변환하지 않는다. |
| engine/ot-copying.test.ts — 장면 불변 | 의도된 신규 milestone / 기대값 부채 | 단권 오바댜 완료 때 progress-milestones.otMilestoneScenes가 첫 구약 완필 `firstOtBook`을 예약한다. test의 scenes 불변 기대가 새 장면 정책과 충돌한다. 중복 지급·잘못된 조건은 별도 assertion으로 검사해야 한다. |
| engine/review-probes.test.ts — 추가 주사위 비용 | 변경된 여행 비용/fixture 재확인 필요 | 반환값 null을 강제 non-null로 다룬 test에서 예외다. 현재 test는 HARBOR=tripCost(DESTS.harbor,[])를 읽도록 바뀌었고 takeTrip은 returning=true로 검사한다. 과거 고정 비용 전제·소스 시점 불일치가 있어 현재 비용 버그로 단정하지 않는다. 현재 suite 재실행에서 동일하면 fixture와 canTrip의 정확한 block부터 확인해야 한다. |
| engine/review-probes.test.ts — 귀환 후 가족 저장 | 변경된 비용/비정상 fixture 재확인 필요 | null의 close를 읽다가 실패했다. 현재 test도 새 게임에 직접 어린아이를 주입하고 store를 호출하므로 실제 해금·출산 흐름과 다르다. 정상 여행 UI는 canTrip으로 출발을 제한하고, takeTrip 후에만 가족 보상을 준다. 현재 실행에서 실패하면 저장/비용/child prune 중 어느 단계인지 분리해야 한다. 과거 로그 하나로 제품 버그에 포함하지 않는다. |
| render/copy-furniture.test.ts — 모든 단계×방향 렌더 | 환경·시간 한도 | 30초 timeout뿐이다. 현재 파일은 전수 그림 생성이 오래 걸림을 명시하고 180초 timeout을 설정했다. 행 길이/팔레트 assertion 실패 증거는 없다. |
| features/library/BookView.test.tsx — 첫 집 책장 배치 | 새 장면 전환 / 오래된 DOM 참조 기대 | 현재 store.toggleHomeBook은 첫 책을 놓으면 firstHomeBook 장면으로 모달을 전환한다. test는 homeShelf 배열 변경까지 확인한 뒤 전환 전 dialog 참조 `d`에서 새 개수를 찾는다. 실제 DOM은 모달 전환으로 교체되므로 옛 노드는 0/3으로 남는다. 장면을 마치고 책장으로 돌아오는 흐름으로 기대를 갱신해야 한다. |
| features/library/Library.test.tsx — 마지막 책 꽂기 | 새 영화식 장면 / 기대값 부채 | 실제 dialog는 `스물일곱 권이 모인 날`이고 `완성 기록 보기` 버튼이 있다. test는 즉시 옛 `스물일곱 권의 서고` 요약 화면을 기대한다. 현재 LandscapeScene/nextScene은 장면 다음 shelfDone으로 진행하도록 연결되어 있다. |
| features/journal/AllFeastSave.test.tsx — 아침 사진→저녁 사진 교체 | 과거 제품 사진 갱신 오류, 현재 수정 코드 확인 | 기록상 실제 저장 사진이 morning인 채 남아 fire 기대와 다르다. 현재 snapAlbum은 timedGathering의 **자기 사진** 재촬영만 막고 photoFor로 다른 앨범을 갱신하는 저녁 장면은 허용한다(game-store.ts:781 전후). 과거 실패 경로를 겨냥한 수정이 존재하므로 현재 실패로 집계하지 않는다. 실제 현재 통과 여부는 root 재실행 결과로 확정한다. |

분류상 2건은 과거 생산 경로와 연결되는 오류였으나 현재 수정 코드를 확인했고, 10건은 기대값·정책·fixture 부채, 2건은 timeout, 1건은 빌드 산출물 전제 의존이다. **현재 제품 버그를 이 15개 기록으로 추가 확정하지 않았다.** 현재 소스 기준으로 새로 실행한 결과와 대조해 지속되는 실패만 다음 단계에서 조사해야 한다.

추가 확인: 사회 감사의 남성 플레이어/여성 후계자 옷장 fixture 재실행은 1 통과 / 2 필터 제외, 104.80초였다. 이 결과도 소스 drift 이전 실행이므로 현재 7개 사회 항목은 `CURRENT_SOCIAL_AUDIT.md`의 재검증 결과로 대체한다.
