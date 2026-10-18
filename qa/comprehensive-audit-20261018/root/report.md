# 저장·통합 계층 감사

검토: `src/main.tsx`, `src/app/*` 생산 코드, `src/store/game-store.ts`의 저장/불러오기·프레임·입력·전환 경로, `src/engine/save.ts`, `game-storage.ts`, `feature-rules.ts`, `types.ts`, `maps.ts`, `game.ts`의 초기화·settle·syncHome·시간·지도 및 통합 호출, `features/ModalLayer.tsx`, `ScreenBoundary.tsx`, `lazy-screen.ts`, `intro/*`, `play/Settings.tsx`, `passage/NtContent.tsx`, `shared/save-file-download.ts`, `storage-notice-state.ts`, 빌드/테스트/PWA/Vercel/의존성 설정. game.ts의 경제·사회·가구 세부는 각 담당과 분담.

## R-M1 (Medium): 필수 장면의 렌더링 오류에서 닫기로 복구할 수 없음

- 유형: 예외 복구/진행 차단.
- 위치: `src/features/ScreenBoundary.tsx:13`의 오류 UI 및 닫기, `src/store/game-store.ts:1701`의 장면 재개, `src/store/game-store.ts:1757`의 closeModal (최종 정확한 줄은 rg로 확인).
- 원인: 오류 UI의 닫기는 modal만 비운다. 실패 장면은 game.scenes에 남고, 다음 frame에서 같은 장면이 열린다.
- 재현: 새 게임의 welcome 장면을 열고 장면 자식 컴포넌트가 오류를 던지게 장애 주입 → ‘닫기’ → 다음 프레임. 같은 welcome이 다시 열린다. 회복되지 않는 청크/장면 오류라면 반복된다.
- 검증: **React/jsdom 장애 주입으로 재현**. 자연 플레이에서 welcome 렌더 오류가 발생한다는 의미는 아니다. 저장 데이터 소실은 확인하지 않았다.
- 영향: 첫 안내/진행에 필수인 장면의 오류 복구.
- 수정 권장: 실패한 장면을 안전하게 보류/건너뛰는 별도 전환을 제공하고, 재시도와 건너뛰기를 구분한다. 렌더 재시도만으로 효과나 보상을 중복 지급하지 않도록 한다.
- 증거: `integration.audit.test.tsx`의 fault injection 테스트.

## R-L1 (Low): 저장 가져오기에서 숫자 필드 내부 타입 검증 누락

- 유형: 입력 검증/데이터 무결성.
- 위치: `src/engine/save.ts:435`의 deserialize 기본 형태 검사, `src/engine/save.ts:149`의 환불 합산, `src/engine/game.ts:2430` 및 `:2457`의 호감도 합산.
- 원인: coins를 검증하지 않고 hearts도 객체인지 여부만 확인한다. 파싱한 내부 값을 기본 상태에 펼친 뒤 숫자 계산에 사용한다.
- 재현: 정상 serialize JSON에서 coins를 문자열 `"50"`로 바꾸어 deserialize → 로드 성공, coins=`"500"`. hearts.baker를 문자열 `"50"`로 바꾸어 로드한 뒤 heartUp(...,1) → 정상 51이 아닌 값으로 변한다.
- 검증: **순수 엔진 테스트 재현**. 정상 앱이 자체 생성한 백업에서 이런 타입이 발생하는 경로는 찾지 못했다. 손상되거나 외부 편집된 저장 입력에 한정한다.
- 영향: 저장 가져오기/복원 뒤 재화·관계 수치.
- 수정 권장: 공개 저장 스키마에서 숫자 필드를 유한 정수·범위로 검사하거나 명시적으로 정규화하고, 모양이 잘못된 백업은 안전하게 거절한다.
- 증거: `integration.audit.test.tsx`의 numeric-string, malformed heart 테스트.

## 확인한 정상 동작 / 반증

- 정상 엔진 저장 → 내보내기 → 가져오기는 새 칸을 생성하며 기존 칸 123닢과 가져온 칸 789닢을 구분했다.
- 현재 IndexedDB 계층은 원자적 migration/manual commit, quota 오류 표출·재시도, stale-tab optimistic conflict, versionchange, 사진 포함 복원/복사를 구현하고 기존 회귀 테스트를 갖춘다. 과거 보고서의 ‘항상 조용히 실패’, ‘여러 탭 무조건 덮어쓰기’를 현 코드에 그대로 적용하지 않는다.
- Settings 가져오기는 새 칸을 로드한 뒤 store.load하고 새로고침한다. 과거 import 덮어쓰기 결함을 현 코드에 다시 확인된 것으로 보고하지 않는다.
- 소스 수정 없이 typecheck, verify 11종, 별도 출력 production build, npm ls를 통과했다. 전체 src/scripts 테스트 결과는 상위 보고서에 통합한다.

## 제한

- CUA 첫 inventory는 성공했지만 localhost 탭 생성 30초, 복구 getState 60초에서 도구 연결이 시간 초과했다. 이 담당 보고서는 실제 브라우저 조작 성공으로 표시하지 않는다.
- `farewell` modal을 데이터 없이 강제로 연 탐색 검사는 동적 import가 30초 시간 초과했다. 정상 UI 도달 조건도 입증하지 못하여 확정 버그와 최종 4개 재현 테스트에서 제외했다. 첫 탐색 실행 결과(4 pass/1 timeout)와 재실행을 구분한다.
- 플랫폼별 페이지 종료 시 IndexedDB 트랜잭션 완료, 설치 PWA 및 iOS 오디오·IME·작업 강제 종료는 실제 기기 검증이 남는다.
