# 003 — 부분 수납의 실제 화면·재접속 보완

검사일: 2026-10-19 약 19:30~19:40 KST. 범위는 002에서 미완료한 보관29/가방2의 모두 넣기 경계다. 이전 jsdom 6검사는 반복하지 않았다.

## 결과

**새 게임 문제 없음. 큐2의 이 경계 확인 완료.** 실제 모바일 크기 브라우저에서 설치 이불장 클릭→부분 모두 넣기→한도 재시도→저장/새로고침→잔여1 표시→공간 확보 후 마지막 넣기→다시 저장/새로고침을 확인했다. 수량 손실·복제·오래된 상세/버튼은 재현되지 않았다. R2-001의 실패 안내 가림을 중복 발견으로 세지 않았다.

002의 개발 서버 차단은 현재 소스의 임시 빌드를 로컬 preview로 제공하여 우회했다. 개발 서버의 응답 지연 원인 자체를 고쳤거나 확정했다는 뜻은 아니다.

## 실행 소스·격리

- HEAD `e49615fce4a0eaeeaf31ea553398b8073e6251db`와 기존 변경이 있는 현재 작업 트리를 사용. 관련 네 파일의 SHA256: `artifacts/detail-audit/round-2-20261019/003-storage-put-browser/source-hashes.json`.
- 게임 소스·동작·밸런스·대사·그림을 수정하지 않았다. 검사 스크립트와 임시 빌드만 추가/보완했다. 기존 1차 기록은 보존했다.
- Edge 새 임시 context, 390×844, 모바일 터치, 사용자 저장 접근 없음. 이전과 같은 집 안 이불장 fixture를 store load로 주입했다. 설치 과정 자체는 검증 범위 밖이다.
- Vite build에 감사 전용 entry `artifacts/detail-r2-storage-bridge.ts`를 추가했다. 게임과 같은 번들 store를 참조하고 CONTENT/newGame/world/saveGameAsync를 검사 프로필에 노출한다. 게임 코드와 별도인 감사용 산출물이며 배포하지 않았다.
- 브라우저의 동적 `/src/...` 검사 요청은 그 감사용 연결에 대한 재내보내기로만 처리했다. 제작/수납 구현을 복제하거나 mock하지 않았다. 정적 빌드의 bridge step은 no-op이며 화면은 실제 게임 RAF에 맡겼다. 캔버스 터치와 보관함 진입도 직접 확인했다.
- 외부 Google 글꼴은 검사 프로필에서 차단하고 시스템 대체 글꼴을 썼다. 개발 서버 진단에서 이를 제외해도 빈 화면이 유지돼 글꼴을 원인으로 확정하지 않았다.

## 환경 차단을 좁힌 과정과 명령

1. `node artifacts/detail-r2-storage-put-run.cjs`: Vite server와 브라우저 checker를 같은 상위 프로세스로 관리. 같은 프로세스의 HTTP probe는 **200**, HTML 2503 bytes, root 존재. 첫 브라우저 시도는 domcontentloaded 30초 timeout.
2. 시작점을 commit으로 바꾸고 요청 로그 추가: 브라우저도 문서 **200**을 받았으나 시작 버튼이 20초 안에 나타나지 않았다. 외부 글꼴을 제외해도 같았다.
3. `$env:AUDIT_BOOT_PROBE='1'; node artifacts/detail-r2-storage-put-run.cjs`: 수납 조작 없이 15초 후 DOM/요청/화면 수집. body 텍스트 없음, root 비어 있음, readyState interactive, pageerror 없음. 요청30/응답12이며 일부 CSS·게임 모듈이 응답 대기였다. Google 글꼴은 의도적으로 abort했으므로 미응답 목록에서 원인으로 해석하지 않았다. 화면 캡처를 직접 열어 빈 화면을 확인했다.
4. `node node_modules/vite/bin/vite.js build --configLoader native --outDir artifacts/detail-audit/round-2-20261019/003-storage-put-browser/build`: 현재 소스의 정적 빌드 성공, 종료0. 개발 서버 모듈 경로를 분리하기 위한 진단이다.
5. `node artifacts/detail-r2-storage-put-static.cjs`: 감사 bridge를 포함한 새 runtime-build를 만들고 로컬 preview와 checker를 한 수명에서 실행. 최초 하네스에서 bridge export가 앱 빌드 최적화로 제거된 것을 수정했고, 다음에는 새로고침 후 bridge 재주입 누락을 수정했다. 모두 **검사 하네스 문제**로 게임 결함이 아니다.
6. 위 정적 검사 최종 재실행: **종료0**, `PASS: installed storage partial put-all, remainder detail, full retry, durable reload, room recovery and final reload; no page errors`. 최종 build 로그와 browser 로그를 보존했다. 종료 시 임시 browser와 preview 서버를 정리한다. 네이티브 프로세스 실행은 도구의 권한 허용을 받아 진행했으며 승인 검토 거절은 없었다.

## 재현 순서·실제/기대 대조

| 순서/조건 | 기대 | 실제 |
|---|---|---|
| 설치 이불장 실제 캔버스 터치 | storage 창 진입 | linenCupboard storage modal 일치 |
| 보관 갈대29, 가방 갈대2에서 모두 넣기 | 1개 이동, 보관30/가방1 | 일치. 상세 갈대1, 모두 넣기 사라지고 넣기만 유지 |
| 넣기 재시도 | 거절, 총31 보존 | 양쪽 수량 그대로. storageFull toast 상태 생성 |
| 닫기, saveGameAsync, 새로고침, 이어하기, 다시 이불장 터치 | 보관30/가방1 복원 | 일치. 가방 갈대1 선택 시 상세·넣기 정상 |
| 보관함에 한 칸 여유를 fixture로 조성 | 남은1 수납 가능 | 열린 상세에서 넣기 성공, 가방0/보관30, 넣기 상세 제거 |
| 다시 저장/새로고침/이어하기/이불장 | 마지막 이동 유지 | 가방 비어 있음, 보관30 유지 |

공간 조성은 보관 갈대30→29를 fixture로 변경한 상태 전이 검사다. 자연 게임 행동으로 갈대1을 사용했다고 주장하지 않는다. 나머지 수납 조작과 저장·새로고침은 실제 UI 및 저장 API다.

## 코드 근거와 증거

수납 경로는 002와 동일하다: `StorageView.tsx:39`의 현재 n 전달 → `game-store.ts:2301`의 putChest/persist → `game.ts:3697`의 집 안 검사 → `easier.ts:136`의 Math.min 부분 이동. 실제 표시는 현재 game.inv/chest에서 다시 계산됐다.

- 새 환경/빌드 근거: `artifacts/detail-audit/round-2-20261019/003-storage-put-browser/{http-probe.json,browser.log,build.log,static-run.log,static-browser.log,source-hashes.json}`.
- 시작 차단 진단: `artifacts/detail-audit/round-2-20261019/002-storage-put/{boot-probe.json,boot-probe.png}`. 이는 의도적으로 게임 조작 없이 수집한 진단이다.
- 통과 증거: `artifacts/detail-audit/round-2-20261019/002-storage-put/{results.json,partial.png,reloaded.png,recovered.png}`. 002 당시에는 없었던 파일로 이번 회차에서 생성했다.
- partial.png와 reloaded.png를 직접 열어 보관30/가방1과 상세·버튼 상태를 확인했다. 픽셀 색 자체를 정밀 비교하지 않았다.
- pageerror 목록은 비어 있다. 네트워크까지 오류0이라고 일반화하지 않는다. 로컬 preview에는 Vercel analytics script가 없어 404/abort가 있었고, Google 글꼴도 검사에서 차단했다. 두 요청은 수납·저장 검증의 의존 경로가 아니다.

## 미확인·다음 대상

- 개발 서버의 CSS/모듈 응답 지연 근본 원인, 다른 화면 크기, 기존 실사용 저장 이행, 다른 모든 수납 가구는 미확인이다. 이번 수량 경계를 이불장 한 종류에서 검증했다.
- 큐1·2 완료. 다음 회차는 큐3: **설치 작업대의 담요 제작, 가방 양털1 + 이불장 보관 양털2**를 시작점으로 잡는다. 기존 제작 테스트와 최근 감사의 제작 공간/제작법 판정 보고를 먼저 읽어 중복을 피한다. 작업 시작→취소, 시작 후 재료/산출물 여유 변경→완료에서 현재 조건을 재검사하는지 한 연결부로 좁힌다. 아직 검증하지 않았다.
- 새 발견 번호는 여전히 R2-002다. 자동화 27-2는 계속 활성 상태이며 전체 큐 완료가 아니므로 종료하지 않는다.
