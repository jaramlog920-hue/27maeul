# 유아·어린이 Y-001~Y-003 수정 (2026-10-20)

사용자의 ‘버그 고쳐줘’, ‘아까 찾은 버그도’ 요청에 따라 이번 감사의 세 항목을 수정했다. 기존 작업 변경과 실제 사용자 저장은 보존했다. 이번 수정은 로컬이며 새 배포는 실행하지 않았다.

## Y-003: 공간 확인 → 안내 → 가방 정리 → 재시도

- `doKidAct`에서 산출물 전량을 가방/사용 가능한 보관함에 넣을 수 있을 때만 활동을 확정한다. 실패하면 원래 상태를 유지한다. 시간·하루 횟수·능력치·가까움·만들기 순번·앨범 표식이 소비되지 않는다.
- 실패 시 결과창 대신 ‘가방 공간이 부족해요 / 물건을 받을 공간이 부족해요. 가방을 비우시겠습니까?’를 먼저 표시한다.
- ‘가방 비우기’는 기존 가방을 연다. 물건을 자동 삭제하거나 일괄로 비우지 않는다. 사용자가 물건과 버릴 수량을 선택하고 기존 확인 단계를 거친다.
- 가방 상단의 ‘공간 확인하고 다시 받기’로 원래 활동을 재시도한다. 자리가 여전히 없으면 소모 없이 안내로 돌아간다. 자리가 생기면 원래 첫 작품/빵/산책 물건을 받고, 시간과 활동 횟수는 한 번만 적용된다.
- 가방을 닫으면 원래 안내로 돌아간다. ‘나중에’나 안내의 닫기로 취소할 수 있다. 재시도 대상은 아이의 born으로 고정하고, 선택 아이/학교 상태가 바뀌면 다른 아이에게 실행하지 않는다. 완료 후 남은 재시도 입력은 무시해 중복 보상을 막는다.
- 결과 물건이 없는 탄 빵 활동과 읽기 등은 가방이 찼다는 이유만으로 막지 않는다. 보관함에 공간이 있으면 정상적으로 보관함에 받는다.

이번 사전 차단은 가족 함께하기의 만들기·요리·산책 수령 경로에 적용한다. 아직 활동을 실행하지 않은 상태에서 가방을 정리하는 방식이므로 재시도 의도는 창 상태로만 둔다. 안내 중 새로고침/취소를 해도 활동 비용은 쓰지 않았으므로 메뉴에서 같은 활동을 다시 고를 수 있다. 과거 버전에서 이미 사라진 물건의 임의 소급 복원은 하지 않았다.

## Y-001/Y-002: 비선택 아이 위치

- `siblingAtSchool`에서 비선택 아이 자신의 kidFlags.schoolDay와 종료 시각을 사용한다.
- `siblingTile`은 학교의 이웃 자리를 배정하고, 집 대기 mode도 그대로 적용한다. 세 아이 동시 등원 시 선택 아이/비선택 두 아이가 학교의 서로 다른 세 자리를 사용한다.
- 지도에서 비선택 등원 아이도 자기 성장 단계·옷장으로 읽기 동작을 표시한다. 다른 아이를 선택한 뒤 집에 두었던 어린이가 밖으로 이동하지 않는다.
- 18시 이후 학교 상태 해제 및 저장 직렬화 왕복도 확인했다.

## 검증

증거 폴더: `artifacts/youth-fixes-20261020/`.

- 기존 감사 재현 검사를 수정된 동작의 회귀 검사로 전환했다. 원래 발견 보고서와 옛 증거 폴더는 보존했다.
- `npm test -- --configLoader native --pool threads --maxWorkers 2 src/audit/youth-school-selection-20261020.test.tsx src/audit/youth-activity-capacity-20261020.test.tsx src/engine/family.test.ts src/engine/siblings.test.ts src/features/family/KidTime.test.tsx src/features/bag/Bag.test.tsx src/audit/all-bugs-render.test.ts src/audit/detail-r2-school-switch.test.tsx`
  - 8파일 50검사 통과 (`regressions.log`).
- `npm test -- --configLoader native --pool threads --maxWorkers 2 src/audit/youth-school-selection-20261020.test.tsx src/engine/kid-time.test.ts src/engine/first-times.test.ts src/features/ModalLayer.test.tsx src/features/child/SchoolView.test.tsx`
  - 5파일 119검사 통과 (`additional-regressions.log`). 앞 실행과 중복되는 파일이 있어 두 수치를 합산하지 않는다.
- 세 자녀 fixture를 실제 가능한 출생 간격으로 정리한 후 해당 위치 회귀 6검사 재실행 통과 (`location-final-tests.log`).
- TypeScript 검사 통과. `npm run build`의 콘텐츠 검증·타입·Vite/PWA 빌드 통과 (`build.log`). 기존 큰 청크 경고만 남아 있다.
- 실제 임시 모바일 Edge: 유아41일/어린이42일 × 만들기·요리·산책, 빈칸 대조, 보관함 여유/포화 대조의 9조건을 실행했다. 가방에서 실제 물건 선택→버리기 확인→재시도까지 통과했다. 정리 전 재시도는 시간600/횟수0, 정리 후 수령은 시간640/횟수1, 중복 입력 뒤에도 물건1개로 유지됐다 (`capacity/results.json`).
- 실제 가족 선택 단추와 등원/집 대기 화면, 저장 직렬화 복원 확인 (`locations/results.json`). 선택 후 학교는 (22,45), 집 대기는 (21,114)로 해당 장소 안에 유지됐다.
- 등원 모션은 유아/어린이 × 기본/실제 옷장 × 읽기4프레임의 16장과 모음 그림 `locations/school-frames.png`를 확인했다. 모바일 실제 화면과 모음/축소 크기에서 얼굴·몸 가림을 확인했다.
- 두 브라우저 검사 모두 JavaScript 오류0. 보조 모션 캡처의 첫 시도는 검사 스크립트의 Renderer API 착오로 실패했으며, 실제 API에 맞춰 수정 후 다시 통과했다. 게임 버그로 세지 않았다.
- React 검토: 새 비동기 요청/효과 없음, 훅 호출 순서 일정, 안내창 이름/버튼 문구 제공, 재시도 시 최신 store와 아이 id 재검사. 기존 가방 수동 확인 흐름 유지.

## 검증 한계

실제 사용자 저장은 열지 않았다. 저장 검사는 serialize/deserialize 왕복이며 실제 프로세스 종료 후 IndexedDB 재접속을 새로 검증했다고 주장하지 않는다. 이번에는 변경 경로와 인접 회귀를 검사했으며 전체 3만여 검사를 다시 실행하지는 않았다. 향후 별도 새 버그 검사는 progress.md의 다음 대상에서 이어간다.
