import fs from 'node:fs'
const base='qa/comprehensive-audit-20261018'
const read=f=>fs.readFileSync(`${base}/${f}`,'utf8')
const j=f=>JSON.parse(read(f))
const inv=j('inventory-resume.json')
const coverage=j('coverage-current.json')
const suite=fs.existsSync(`${base}/current-suite.json`)?j('current-suite.json'):null
const modules=inv.filter(x=>x.path.startsWith('src/')).length
const testFiles=inv.filter(x=>/\.test\.[^.]+$/.test(x.path)).length
const currentDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',dateStyle:'short',timeStyle:'short'}).format(new Date())
function section(file,id){const md=read(file),lines=md.split(/\r?\n/),start=lines.findIndex(x=>/^### /.test(x)&&x.includes(id));if(start<0)throw Error(`Missing finding ${id}`);let end=start+1;while(end<lines.length&&!/^#{1,3} /.test(lines[end]))end++;return lines.slice(start,end).join('\n').trim()}
const findings=[
['M-01','E-08','economy/CURRENT_FINDINGS.md'],
['M-02','E-02','economy/CURRENT_FINDINGS.md'],
['M-03','SOC-06','social/CURRENT_SOCIAL_AUDIT.md'],
['M-04','UI-06','ui/FINDINGS.md'],
['L-01','SOC-03','social/CURRENT_SOCIAL_AUDIT.md'],
].map(([id,old,file])=>section(file,old).replace(/^### [^\n]+\n/,m=>m.replace(old,`${id} (${old})`)))
findings[3] += '\n- 추가 엔진 위치: `src/engine/game.ts:2963-2970`의 `giveLoveVerse`가 계산된 분위기로 hit와 선물 기록을 정한다.'
const suiteLine=suite?`**${suite.testResults.length}개 파일 / ${suite.numTotalTests.toLocaleString('en-US')}개 검사: ${suite.numPassedTests.toLocaleString('en-US')} 통과, ${suite.numFailedTests} 실패, ${suite.numPendingTests} 건너뜀.**`:'**실행 중 — 최종 결과 대기. 이 초안은 완료 보고서가 아니다.**'
const failures=suite?suite.testResults.flatMap(f=>f.assertionResults.filter(a=>a.status==='failed').map(a=>({file:f.name.replaceAll('\\','/').split('/twenty-seven/').at(-1),test:a.fullName,message:a.failureMessages?.[0]?.split('\n')[0]}))):[]
fs.writeFileSync(`${base}/current-failure-summary.json`,JSON.stringify(failures,null,2))
const failureTable=failures.length?'| 파일 | 실패 검사 | 실제 오류 첫 줄 |\n|---|---|---|\n'+failures.map(x=>`| \`${x.file}\` | ${x.test.replaceAll('|','/')} | ${(x.message??'').replaceAll('|','/')} |`).join('\n'):(suite?'기존 검사에서 실패한 assertion은 없다.':'완료 후 실패 항목을 기록한다.')
const result=`# twenty-seven 전체 프로젝트 버그 감사

최종 기준: **2026-10-19 현재 작업트리**. 작성 시각: ${currentDate} KST. ${suite?'현재 코드의 종합 감사와 실행 검증 결과를 통합했다.':'진행 초안이다.'}

## 1. 핵심 결과

현재 재현된 **제품 결함 5건: Critical 0 / High 0 / Medium 4 / Low 1**. 별도로 테스트 정합성 문제1묶음(T-01, Low: 실패 assertion8개)을 기록했다. Critical·High를 발견하지 못했다는 뜻이며 없다는 보장은 아니다. 코드 분석만의 위험은 이 수에 넣지 않았다. 기존 소스·기존 테스트·설정·콘텐츠는 이 감사에서 수정하지 않았다.

| 우선순위 | 심각도 | ID | 문제 |
|---|---|---|---|
| 1 | Medium | M-01 | 50칸 가방에서 도구 구매 시 8,000닢만 차감되고 도구가 지급되지 않음 |
| 2 | Medium | M-02 | 둘째 작업장을 열어도 함께하는 첫 자녀의 이름·직업·보상을 사용 |
| 3 | Medium | M-03 | 후계 배우자 옷장이 원래 주민을 편집해 실제 배우자 외형에 반영되지 않음 |
| 4 | Medium | M-04 | 본문 로딩 전 계산한 성경 조각 분위기 빈 배열이 영구 캐시되어 선물 분기가 틀림 |
| 5 | Low | L-01 | 제빵사 자녀가 견습·후계자 전환 후 중복 렌더 대상으로 남음 |

가장 먼저 **거래의 지급·차감 원자성과 작업장 owner 전달**을 수정하는 것이 좋다. 게임 내부 재화 손실과 다른 인물 데이터 처리 오류이기 때문이다. 각 결함의 수정은 권장안으로만 제시했으며 실제 소스 수정은 하지 않았다.

### 감사 도중 소스가 바뀐 점

10월18일 최초 실행 이후 중단 중 **58개 기존 파일이 외부에서 수정되고 테스트28개가 추가**됐다. 따라서 최초 실행의 30,585 통과/15 실패/5 skip, 당시 발견 목록을 현재 버그로 재사용하지 않았다. 수정된 담당 소스 재독, 표적 회귀 검사, 타입·콘텐츠·빌드·전체 테스트 재실행으로 재판정했다.

- 최초 파일 목록: \`qa/comprehensive-audit-20261018/inventory-start.json\`.
- 재개 후 현재 기준: \`inventory-resume.json\`, 파일별 소스 해시와 검사 깊이는 \`coverage-current.json\`.
- 재개 직전 기존 보고서89건 원문도 \`BUG_AUDIT.before-resume.md\`에 보존했다. 과거89건·이번5건을 합산하지 않는다. 과거 보고서의 원격 HEAD 빌드 실패는 현재 작업트리 빌드 실패로 집계하지 않았다. 원격 배포/커밋 상태는 이번 실행 대상이 아니다.

## 2. 구조·실행 환경과 전체 기능 목록

독립 프로젝트 \`twenty-seven\` 전체가 대상이다. 상위 cloooo의 jaramlog-v2 등 다른 프로젝트는 사용자가 지정한 범위에서 제외했다. 최근 diff만 고르지 않고 전체 목록을 만들었다.

- 조사 목록 **${inv.length}개 파일**, \`src/\` ${modules}개 파일, 기존 \`.test.ts/.tsx\` ${testFiles}개, 제품 TS/TSX 모듈 **${coverage.length}개**. 전 제품 모듈에 담당·검사 깊이를 연결했으며 미배정 모듈은0개다. 전 파일의 모든 줄을 수동 검토했다는 뜻은 아니다.
- 프론트엔드: React19.3 / TypeScript7 / Zustand5, Vite8, Workbox 기반 PWA. Node24.21.0 / npm11.19.0. 설치 버전은 \`dependencies.log\`에 기록했다. 새 의존성 설치·갱신은 하지 않았다.
- 서버·DB: 별도 업무 백엔드/원격DB/API·로그인·사용자 권한 체계는 없다. 게임 데이터/사진은 **IndexedDB**, 작은 기기 설정은 localStorage. 따라서 서버 인증·다른 계정 간 권한 검사는 해당 없음. 저장 칸 간 혼합·동시 탭 충돌은 저장 계층과 기존 회귀 검사에서 다뤘다.
- 외부 연동: Vercel Analytics와 정적 배포, 본문의 지연 import, 버전 확인, PWA 캐시. 운영 URL·계정·배포·결제·삭제·원격 데이터 조작은 시험하지 않았다.
- 경로: \`src/app\` 시작·복구, \`store\` 액션/저장, \`engine\` 규칙, \`features\` 화면, \`render\` canvas/art, \`content\` 본문·대사·로더, \`shared/audio\` 공통 UI·소리. \`scripts\` 생성·검증 도구, \`public\` 배포 정적 파일, \`vite.config.ts/vercel.json/package*.json/tsconfig.json\` 실행 설정을 조사했다.
- \`node_modules/.git/dist/artifacts/qa/docs\` 및 원본 아트 assets는 제품 소스 정독 대상에서 제외했다. 필요한 의존성·현재 빌드·기존 테스트·감사 증거는 읽었다. 예전 산출물/아트 내보내기 검사는 기존 파일을 덮어쓸 수 있어 실행하지 않았다. 실제 제품 아트와 연결은 \`src/render\` 구조·호출 및 장면 smoke로 검사했다.

| 기능·검사 대상 | 검사 완료 범위/실제 검증 | 현재 제품 결함 수 |
|---|---|---:|
| 시작·캐릭터 생성·불러오기 | 입력 정리/빈 이름/슬롯, 실제 브라우저 새 게임·복원 | 0 |
| 저장·가져오기·사진·오류복구 | save/game-storage 전체, IndexedDB 원자성·quota·동시 탭 기존 검사, 표적 회귀 및 실제 import | 0 |
| 시간·날씨·욕구·능력치 | clock/calendar/needs/stats 및 통합 루프·시간 넘기기 | 0 |
| 가방·궤짝·장터·재화 | 상점·판매·지급·slot 경계·해금, 50칸 실제 엔진 재현 | 1(M-01) |
| 채집·텃밭·공예·요리·직업·기술 | 관련 엔진/화면 정독, 체험 요리 복원 수정 대조 | 0 |
| 필사·퍼즐·음성 보조·제본·서고·퀴즈·복습 | 관련 엔진/화면, IME와 중복 타일 수정 대조, 콘텐츠 검사 | 0 |
| 조각·말씀·편지·콘텐츠 지연 로딩 | 로더/카탈로그 구조·콘텐츠 검증, cold module 실제 재현 | 1(M-04) |
| 대화·관계·연애·결혼·이정표 선물 | 엔진/화면·세대 id·반복 지급 가드 수정 대조 | 0 |
| 가족·옷장·출산·학교·자녀 선택 | 관련 엔진/화면, 막내 판정 수정 대조, 후계 배우자 실제 재현 | 1(M-03) |
| 자녀 진로·작업장·건물 owner | 건축↔시설↔방문 연결, 실제 React/jsdom 시설 진입 재현 | 1(M-02) |
| 주민 자율 생활·세대·이사·후계자 | 독립 모듈 전체·관련 통합 경로, 동반자·이사 재현 | 1(L-01) |
| 모임·약속·축제·행사·읽기 | 엔진/화면, 소모임 복원·일정 표시 수정 대조 | 0 |
| 여행·주사위·보상·순위·일지 | 엔진/화면, 동일 여행 RNG와 귀환 rank 수정 대조 | 0 |
| 월드·NPC 이동·새 터·건축·벽·가구 | 구조/경로·배치·해금·실제 유효 context·cache 수정 대조 | 0 |
| 장면·도트 렌더러 | 전 renderer 구조, 집중 검토,577장면의 대사/선택 단계 mock draw | 0(세대 중복은 위에 집계) |
| HUD·설정·오디오·공통 UI·모바일 | 상태/이벤트·구독·정리,375×812 실제 핵심 UI | 0 |
| 의존성·타입·빌드·PWA·배포 설정·보조 도구 | 설치 버전 확인·타입·콘텐츠·production build·91개 mjs 구문 검사 | 0 |

0은 이번 검사에서 현재 확정 결함을 찾지 못했다는 뜻이다. 관련 기능끼리 같은 문제를 중복 집계하지 않았다. 테스트 기대값·fixture 문제는 아래 실행 결과에 별도로 적는다.

### 검사 깊이와 파일별 기록

경제 담당은 엔진78개+UI/support63개를 정독했고, 사회 담당은 엔진59개+기능24개+장면4개 및 통합 함수들을 검토했다. UI 담당 목록462개 중100개는 집중 소스 검토, 나머지는 구조 파싱/심볼·import/JSON/파일 목록 수준으로 구분했다. 247개 제품 renderer의 도트 좌표를 모두 손으로/픽셀로 검사하지 않았다. 공유 game.ts/store는 담당별 함수 범위를 나눠 검토했다.

\`coverage-current.json\`(전체), \`economy/coverage.csv\`(현재 해시·정독 깊이), \`social/COVERAGE.json\`+현재 보고서·fingerprints, \`ui/inventory.json\`(구조/집중 구분)을 참고한다. 기본 검사는 전체 소스에 적용했고 별도 동적 검사는 선택한 재현/경계에만 적용했다.

## 3. 실제 실행 결과

| 검사 | 현재 결과 | 증거 |
|---|---|---|
| TypeScript strict | 통과 — \`tsc --noEmit --incremental false\` | current-typecheck.log |
| 콘텐츠 검증11종 | 모두 통과 | current-verify.log |
| 프로덕션 빌드 | 성공, PWA 생성 성공 | current-build.log/current-build/ |
| 보조 도구 구문 | 91개 mjs \`node --check\`, Python 생성기1개 ast.parse 통과 | script-syntax.json/python-syntax.json |
| 의존성 설치 상태 | \`npm ls --depth=0\` 정상 | dependencies.log |
| 린트 | 설정·스크립트 없음. 실행한 것으로 표시하지 않음 | package.json |
| 전체 기존 src/scripts 테스트 | ${suiteLine} | current-suite.json/current-suite.log |
| 현재 표적 재검증 | 경제7/7, 사회7/7, UI6/6, 저장/복구·fixture4/4 | 담당별 current*.json/md |
| 실제 브라우저 | 시작·저장·새로고침·복원·가져오기·모바일375×812 확인 | root/CURRENT_REPORT.md, 아래 사진 |

빌드 산출물은 기존 dist를 건드리지 않고 감사 전용 current-build에 썼다. npm build의 검사 체인을 타입/verify/vite 단계로 나눠 동등한 검사를 실행했다. PWA precache209개, 약4.28MiB. expansion-prop-art 청크2.06MB(gzip 약617KB) 경고가 있으나 빌드 실패나 실제 기기 장애를 확인한 것은 아니다.

콘텐츠 검증은 pieces.json 검증대상496조각, 여정46·교회7카드, 편지21권, 하나님 기록155줄, 연결 구절1,604곳, 신약260장·구약39권929장23,144절, 절 해시30,661개 및 신약/사랑의 계명 생성 일치를 확인했다. 편지·요한계시록의 장 단위 동적 조각까지 합한 총수가496이라는 뜻은 아니다. 허용된 구약 빈 절19곳은 스크립트가 따로 보고하며 신규 오류로 세지 않았다.

표적 재현 검사는 '현재 버그가 존재함'을 assert하는 검사도 포함한다. 해당 검사 통과를 제품 무결함으로 해석하면 안 된다. jsdom canvas 미구현 경고와 실제 브라우저의 결과를 구분했다. 감사 하네스는 qa 아래에만 만들었고 기존 테스트를 고치지 않았다.

### 현재 전체 suite의 실패 항목

${failureTable}

**실패6개 파일만 단독 재실행:** 총197개 중189통과·8실패였고, 전체 실행과 실패 assertion8개가 정확히 동일했다(39.21초). 시간 초과로 분류한 실패는 현재 실행에 없다. 증거는 \`current-failure-rerun.json\`, \`failure-comparison.json\`이다. 이전 snapshot의 \`full-suite.json\`(15실패)은 현재 수치가 아니다.

#### T-01 — Low — 현재 동작과 맞지 않는 기존 테스트 기대값8개

- 유형: 테스트/회귀 검사 정합성. 위 표의6개 테스트 파일 및 \`social/CURRENT_TEST_TRIAGE.md\`의 assertion 위치 참조.
- 원인: 현재의 완성 장면·첫 집 책장 장면·미본 잔치 연기·새 대사·facing 메타데이터와 옛 기대값이7개 충돌한다. 나머지1개는 이미 고친 자녀 진로 선택 혼합 버그가 여전히 존재하기를 기대하는 옛 재현 검사다.
- 재현: \`npm test -- --config qa/comprehensive-audit-20261018/full-suite.config.mts\`. 위 실패파일6개만 지정해도 같은8개가 실패한다. 기존 설정과 원래 테스트는 이 감사에서 변경하지 않았다.
- 실제 검증: 현재 전체529파일 실행 및 해당6파일 단독 재실행. 단독 결과를 소스 호출·새 규칙 검사와 대조했다. BookView의0/3은 첫 배치 장면 전환으로 제거된 이전 DOM을 검사한 결과이며, 앞선 homeShelf 실제 상태 assertion은 통과한다. 마지막 책을 꽂은 후에는 완성 그림 장면에서 [완성 기록 보기]를 눌러야 요약 dialog로 넘어간다.
- 영향: 테스트 명령이 계속 실패하여 회귀 신호와 기대값 부채를 구분하기 어렵고, CI가 이 명령을 필수로 쓰면 검사 단계가 막힌다. 이8실패를 제품 결함8개로 확대하지 않았다.
- 권장: 현재 규칙에 맞게 기대값/fixture/장면 전환을 정비하되 재료 차감·호감도·일회성·저장 검사를 유지한다. 옛 버그 재현 assertion은 수정된 동작을 지키는 회귀 검사로 바꾼다. 각 테스트의 실패 뒤 assertion까지 검증하려면 이 정비 후 다시 실행해야 한다.

현재 실패의 상세 원인·권장 테스트 변경은 \`social/CURRENT_TEST_TRIAGE.md\`에 있다. 테스트 정비는 후속 수정 작업이며 이번 읽기 전용 감사에는 포함하지 않는다.

### 브라우저 정상·비정상·경계 검증

빈 새 origin(127.0.0.1:52793)에서 이름 없음/공백3개 시작 차단, \`감사시험\` 생성, 시작 안내, 설정·수동 저장, 타이틀 및 두 저장 칸 복원을 직접 조작했다. 375×812에서 canvas가 실제 표시됐고 document/body scrollWidth=375로 가로 넘침이 없었다. 자체 만든7일째789닢 백업을 가져온 뒤 자동 새로고침과 새 칸 생성을 확인했으며, 기존1일째0닢 칸 두 개도 유지됐다. 가져온 칸을 다시 열어7일째10:00·789닢을 확인했다. 이 시험 페이지의 console warning/error 기록은0개였다. 사용자의 기존 저장을 읽어 플레이하거나 삭제하지 않았다.

![375px 브라우저에서 확인한 저장 칸 분리](C:/Users/wn410/OneDrive/Desktop/cloooo/twenty-seven/qa/comprehensive-audit-20261018/root/browser-save-proof.png)

처음10월18일에는 브라우저 도구 시간 초과가 있었지만10월19일 재개 후 연결돼 위 경로는 실제 UI 검증했다. viewport는 시험 후 원복했다.

## 4. 현재 재현된 제품 결함 — 심각도·우선순위순

아래5건은 각각 실행 검증이 있다. 실제 브라우저, React/jsdom, 순수 엔진, 정적 호출 추적 중 무엇으로 확인했는지 항목마다 명시했다. 운영 데이터로 시험한 항목은 없다.

${findings.join('\n\n')}

## 5. 수정 확인·재판정 및 확정하지 않은 위험

감사 중 외부 수정된 항목은 현재 동작을 다시 시험해 현재 결함에서 제외했다. 소모임 활성 기록 복원, 출산 간격, 후계자 결혼 준비 보상 id, 재연애 이정표 중복, 가족 집 재배정 이사 상태, 체험 요리 복원, 동일 단어 타일, IME 늦은 종료, 여행 RNG·귀환 순위, 새 터 벽걸이, 지도 cache LRU, 일정 표시, 예복 이름, 저장 숫자 정규화, 오류 장면 건너뛰기가 여기에 해당한다. 세부 대조 절차는 담당 현재 보고서에 있다.

다음은 현재 제품 결함5건과 별개로 남는 **미확정 위험/검사 제한**이다.

| 항목 | 현재 근거와 한계 |
|---|---|
| 축제 참가자 수 변동 중 준비 단계 | 정상 UI에서 영구 차단되는 전체 경로를 재현하지 못했다. 축제 날 항상 맑음인 규칙 때문에 과거의 ‘비 오는 잔치’ 설명은 성립하지 않는다. |
| 여행 아침의 선택 아이 전환 | 아침 성장/편지로 선택 아이가 바뀔 때 동행 보상 대상이 바뀔 가능성을 읽었으나 현재 정상 UI 재현이 없다. |
| 자녀별 생일 범위 | 선택 아이/형제 전원 보상 계약이 확정되지 않아 단순 코드 차이를 버그로 단정하지 않았다. |
| 성경/대사/장면 전체 상태 조합 |577장면 명령 smoke는 모든 실제 가족·방·날씨·연속 프레임·픽셀 가림의 시각 검증이 아니다. |
| PWA/오프라인/업데이트·실제 모바일 | 생성된 SW/캐시 설정·청크 복구 코드를 조사했으나 실제 iOS/Android 설치 앱, 저장소 퇴거, OS 강제 종료, 모든 업데이트 중단은 시험하지 않았다. |
| 실제 quota·저장 동시성 | mock IndexedDB의 quota·트랜잭션·동시 탭 회귀 검사를 사용했다. 사용자 기기 디스크를 채우거나 운영 저장을 경쟁 변경하지 않았다. |
| 물리 IME·음성·오디오 | jsdom 이벤트·소스 검토는 했지만 모든 실제 키보드·마이크·iOS interrupted 오디오를 장치별로 확인하지 않았다. |
| 의존성 보안·원격 배포 | 설치·lock/config를 조사했다. 외부로 의존성/소스 목록을 보내는 취약점 조회, 운영 URL 및 원격 배포 상태 조회는 실행하지 않았다. |

분석상 모양만 의심됐으나 현재 콘텐츠에서 도달하지 않는 story keepsake 분기, 도구 추가 등록으로 반증된 방향 미리보기 누락, 정책/의도와 구분되지 않는 가격·반복 보상은 확정 버그에 넣지 않았다. 과거 보고서의 사용자 결정 문구는 별도 역사 기록이며 이 감사가 소스 변경 권한으로 사용하지 않았다.

## 6. 남은 작업과 재개 자료

${suite?'전체 기존 테스트·현재 표적 재검증·타입·콘텐츠·빌드 검사를 실행하고 범위/한계를 기록했다.':'현재 전체 suite 실행 중이다. 완료 결과·실패 분류·최종 해시 비교를 반영하기 전에는 완료로 표시하지 않는다.'} 다섯 제품 결함의 수정과 위 미검증 환경 시험은 이 읽기 전용 감사의 후속 작업이다. 모든 버그를 찾았다고 보장하지 않는다.

핵심 기록은 \`qa/comprehensive-audit-20261018/PROGRESS.md\`, \`inventory-resume.json\`, \`coverage-current.json\`, \`resume-integrity.json\`, 현재 실행 로그·JSON, 담당 현재 보고서와 별도 재현 파일이다. 재개 후 최종1514파일 해시 비교는 변경0·추가0이었다(허용된 감사 산출물/최종 보고서는 별도 경로로 제외). 이전 snapshot 하네스는 현재 수정된 동작에서 실패할 수 있으므로 현재용 current-* 검사와 구분해야 한다.
`
fs.writeFileSync(`${base}/REPORT_DRAFT.md`,result)
if(suite)fs.writeFileSync('BUG_AUDIT.md',result)
console.log(JSON.stringify({draft:`${base}/REPORT_DRAFT.md`,finalWritten:!!suite,productFindings:5,testFailures:failures.length}))
