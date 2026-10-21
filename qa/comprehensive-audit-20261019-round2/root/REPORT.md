# 저장·통합·설정 감사 근거

- 대상: 현재 twenty-seven 전체 중 root 담당 저장/IndexedDB/가져오기·내보내기/앱 진입/공유 store/설정·의존성·보안 경계.
- 소스 수정 없음. 시작 기준점 source-start.json, 중간 source-integrity.json changed=[]/added=[].
- 이전 root 감사의 무변경 파일은 SHA로 동일성을 확인하고, 저장·앱·설정·공유 store의 변경된 경로 및 아래 보조 파일을 현재 원문으로 다시 검토했다. 대형 game/store는 다른 두 엔진 담당자와 기능별로 분담했으며 root가 모든 줄을 다시 읽었다는 뜻은 아니다.

## ROOT-01 — Low / 데이터 무결성 / 손상된 가방 수량이 정규화되지 않음

- 위치: src/engine/save.ts:133–167 normalizeShapes, :179–180 sanitize, :270 refitRoom; src/engine/items.ts:73–76 addGift. room.ts:223–233은 입력 inv를 그대로 보존한다.
- 원인: 숫자 coins/hearts/chest/pantry와 달리 inv의 값에는 타입·정수·양수 검사가 없다.
- 조건: 손상되거나 편집된 저장 파일 inv={bread:'2',fig:-1,honey:0.5,barley:3}를 가져온다. 정상 엔진이 이 값을 생성했다는 증거는 찾지 못했다.
- 재현: serialize(newGame(CONTENT))의 inv만 위 값으로 바꾼 JSON을 deserialize → 같은 값이 유지됨 → 실제 선물 공통 함수 addGift(inv,{bread:1}) → bread='21'. 정상 숫자2 대조군은3.
- 검증: boundaries.audit.test.tsx 및 inventory-boundary.json. 실제 메모리 엔진 실행 확인, 브라우저에서 손상 파일을 가져오지는 않았다. 기존 UI와 같은 readImport→deserialize 경로는 코드로 추적했다.
- 영향: 가방 수량 표시·선물·구매·제작 등 산술을 하는 모든 기능. 외부 사용자/서버 권한 침해로 주장하지 않는다.
- 권장: inv도 유한한 정수·0이상으로 정리하고 0은 제거. 선물로 허용된 99개 초과 스택/50칸 초과는 보존하여 합법적 저장을 자르지 않는다. 문자열을 자동 숫자로 인정할지 폐기할지 규칙을 정해 재로드에도 일관되게 적용한다.

## 실행한 경계 검사

- 합성 기본 저장의 90개 경로 × null/음수/0/소수/정수/문자열/배열/객체 등 10가지 =900개.
- 120개는 deserialize에서 거부, 780개는 수용. 수용된 모든 경우의 재직렬화→재로드와 tick(0.05)은 예외·재로드실패·비유한 닢0건.
- 이는 모든 필드의 의미/값 범위를 검증했다는 뜻이 아니다. inventory 산술 오류는 위 별도 비교에서 발견했다.
- 브라우저 입력 fixture는 사용자 데이터가 없는 새 게임(감사가져오기/7일째/789닢)으로만 생성했다.
- 기존 538개 파일 전체 테스트/typecheck/content11/build/npm ls/node --check92/python AST는 상위 로그 참조.

## 실제 프로덕션 브라우저 검증

- URL: http://127.0.0.1:52871 (새 origin). 시작 시 이어하기/불러오기 없는 타이틀 확인. 새 이름 감사이차 사용.
- 이름 공백3개에서 시작 비활성, 정상 이름으로 시작 및 초기 안내3쪽/닫기 정상.
- 설정→기록→저장하기, 새 칸 저장 완료 확인.
- 두 번째 탭으로 같은 저장을 열고 중복 칸 저장을 요청: GameStorageConflictError 안내가 표시되고 덮어쓰기를 막음. console warning/error0. 증거 browser-conflict.png. 이 경로는 과거 여러탭 무조건 덮어쓰기 위험을 재현하지 않았으며 현재 보호 동작을 확인했다.
- 두 시험 탭 중 두 번째를 닫고 첫 탭 새로고침, 원본/복사본 두 칸 보존 확인.
- 합성 백업을 클립보드의 붙여넣기로 가져오기, 완료 알림·자동 새로고침·새7일차789닢과 원래0닢 칸2개 모두 보존 확인.
- viewport320×568: 불러오기와 실제 게임 화면 모두 document/body 폭320, 높이568; 넘침 없음. 실제 canvas4개 및 게임 그림 확인. 증거 browser-slots-mobile.png/browser-play-mobile.png.
- 말씀→필사 시작→마태복음: 실제 1절을 글자별로 입력하고 '다음 절'을 눌러2절로 이동. 이전 입력 비워짐. 2절에 틀린 입력을 넣으면 다음 절 단추0개로 진행차단.
- 2절의 정상 앞부분 '아브라함이'만 입력하고 나가기, 설정→타이틀로(저장완료대기)→새로고침→이어하기→이어서필사하기: 1절 완료와2절 부분 입력 모두 복원. 증거 browser-copy-restored.png. 실제 한글 키보드 IME 이벤트를 검증한 것은 아니다.
- 플레이 중 직접 reload 요청은 beforeunload의 저장 대기 보호로 취소되어, 저장 완료를 기다리는 타이틀 복귀 경로로 재접속을 검증했다. 강제 종료 시 내구성을 확인한 것은 아니다.
- 브라우저 console warning/error0. viewport 원복, 생성한 탭2개 닫음, own preview server 종료. 저장 삭제·초기화·계정·결제·운영 요청은 하지 않았다.

## 검토 및 한계

- 별도 백엔드/인증/서버DB/API는 없다. 게임/앨범은 IndexedDB, 설정은 localStorage. 게임 입력의 외부 서버 권한 검사 문제는 이 구조에 해당하지 않는다.
- fetch/version·PWA 동적 청크·analytics·파일 가져오기/공유/클립보드 경로와 JSON/React 렌더 경계 확인. 서버 배포/외부 통신/공유는 실행하지 않았다. 비밀 .env 값은 출력하지 않았다. npm audit처럼 의존성 목록을 외부 전송하는 검사는 실행하지 않았다.
- 타입/내용/빌드 검증은 실제 실행, 모든 외부 패키지의 구현·보안취약점 전수검증이나 실제 Vercel 배포 검증은 아니다.
- root 추가 원문 검토: scroll.ts, word-options.ts, LetterBox.tsx, TipLetterView.tsx, scroll-hint.ts, maps.ts, feature-rules.ts; 앱 진입/저장소/설정/장면오류회복/공유store 저장과 비동기 콘텐츠 함수; 프로젝트 config와 실행 스크립트 경계.
