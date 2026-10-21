# 종합 감사 진행 기록 (2026-10-18 시작 / 2026-10-19 재개)

대상: twenty-seven의 현재 작업트리 전체. 기존 변경분은 보존하며 소스 수정 금지.
이전 BUG_AUDIT.md는 BUG_AUDIT.previous.md로 보관; 과거 주장은 현 코드에서 재검증해야 함.

## 검사 대상 / 담당

- root: app, store, save/game-storage, game 통합 루프, feature-rules, ModalLayer/lazy-screen/intro/Settings/ScreenBoundary, scripts·빌드·PWA·배포 설정, 전체 기존 테스트, UI 정상/비정상/경계 검증.
- economy_progression: 경제·재화·필사·도서관·미션·요리·상점·새 터·건축·마을·성장/학습 엔진 및 해당 화면.
- social_lifecycle: 시간·월드·이동·인물·관계·결혼·가족·세대·자율 행동·반려동물·모임과 해당 화면.
- ui_render_content: 렌더러 전체 구조/호출·콘텐츠/본문 로더·오디오·공용 UI·플레이·지도·꾸미기·가구·메뉴·가방·일지·이벤트 아트 연결.

## 단계

1. [x] 전체 폴더 및 파일 목록, 스택, 기능 목록 작성 (inventory-start.json).
2. [x] 담당별 코드 분석 / 파일별 검사 범위 저장. 현재 production TS/TSX572모듈 전부 담당·깊이 연결, 미배정0.
3. [x] 현재 src/scripts 전체529파일:30,653통과·8실패·5skip. 실패6파일 단독197검사:189통과·동일8실패. TypeScript·콘텐츠11종·별도 production build·91mjs구문·Python생성기1개AST 통과.
4. [x] 현재 표적 재검증: 경제7/7·사회7/7·UI6/6·root4/4. 브라우저 시작/공백/저장/새로고침/복원/가져오기 및375×812검증.
5. [x] 원본 해시 비교, 중복 제거·재판정, 심각도순 BUG_AUDIT.md 통합. 현재 기준1514파일 해시 변경0·추가0(감사 산출물 제외).

## 안전한 실행 원칙

- 운영 서버/저장/외부 계정/결제/삭제에 접근하지 않음. 브라우저는 새 localhost 포트의 시험 데이터만 사용.
- 테스트 새 파일/로그/빌드는 이 qa 하위에만 저장. 기존 소스·테스트·산출물 덮어쓰기 금지.
- 기본 Vitest가 수집하는 artifacts의 아트 내보내기 탐색 테스트는 파일을 덮어쓸 수 있어 별도 격리 설정으로 src/scripts 기존 테스트만 실행.
- AUDIT/BALANCE_AUDIT_CAPTURE 환경 변수는 비워 기존 docs/JSON 파일 쓰기 방지.
- 린트 스크립트/설정 없음. TypeScript strict 검사로 대체하되 린트 실행으로 표시하지 않음.

## 이어서 작업하는 방법

inventory-start.json의 전체 파일 목록, 각 담당 하위의 보고서·재현 파일, full-suite.json/full-suite.log, verify.log/typecheck.log/build.log를 확인한다.
완료되지 않은 영역을 먼저 이어서 검사하고 최종 보고서는 프로젝트 루트 BUG_AUDIT.md에 기록한다.

## 10월19일 현재 상태 (이 절 우선)

- 중단 중 외부에서58개 기존파일 수정,28개 테스트 추가. 기존 보고서89건 원문은 BUG_AUDIT.before-resume.md로 보존.
- inventory-resume.json이 현재 기준이다. resume-inventory.mjs 재실행은 기준 해시와 비교만 하며 기존 소스는 바꾸지 않는다. 현재 재개 후 변경0 확인.
- 현재 확정 제품 결함5건: Medium E08도구값소실/E02작업장owner/SOC06후계옷장/UI06coldmoods, Low SOC03제빵사자녀중복.
- 보고서 초안 REPORT_DRAFT.md. build-report.mjs는 current-suite.json이 없으면 초안만 쓰고, 완료 JSON이 있으면 BUG_AUDIT.md도 쓴다.
- 현재 suite 완료: current-suite.json/current-suite.log. 최초 full-suite.json(18일)은 오래된 소스 결과이므로 현재에 합산 금지.
- 8실패/6파일은 social/CURRENT_TEST_TRIAGE.md에 분류했다(기대값7/이미고친옛repro1). 실패파일 단독 결과 current-failure-rerun.json과 failure-comparison.json에서 동일8assertion 재확인했다.
- root/CURRENT_REPORT.md에 실제 브라우저 검증 절차, root/browser-save-proof.png에 저장 칸 분리 증거. 페이지127.0.0.1:52793에서 자체 시험 데이터만 사용, 삭제 테스트 안 함. 임시viewport원복.
- 최종 상태:2026-10-19 01:00 KST BUG_AUDIT.md 저장 완료.5제품결함(Medium4/Low1),테스트정합성부채 Low1묶음(8assertions).미검증 환경·추정위험 별도기록.감사용 브라우저탭과 이번 로컬미리보기서버 정리,임시viewport원복.다음에는 소스수정 허가가 있는 별도 요청에서 권장수정을 진행하면 된다.
