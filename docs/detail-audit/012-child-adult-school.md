# 012 — 성인 성장 전후 배움터 표식과 지연 행동

2026-10-18 한국 시각. 전날 helper에게 배움터를 맡긴 상태를 저장한 뒤 adult 아침으로 넘어가는 연결부만 검사했다. D008 진로 초안 전환이나 앞 회차의 도움 한도 조합은 반복하지 않았다. 게임 동작·밸런스·대사는 수정하지 않았다.

## 조건과 실행

- `legacyGame(CONTENT)`, 집 2단계, born 10인 루시. 93일 10:00 helper → 전날 밤 22:00 → 94일 adult 아침.
- 기존 물려받기와 걷기·돕기 표식은 완료 상태. home 모드, hand born 1, 초기 100닢.
- 먼저 helper 상태에서 지능 배움을 실제 신청한다. 비용 15닢, schoolDay 93, 지능 경험치가 기록된다. 이 상태를 기준으로 성장 아침을 대조한다.
- 실사용 저장 대신 jsdom 메모리 저장소와 임시 Edge 프로필의 IndexedDB를 사용했다.
- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-child-adult-school.test.tsx`: 7건 통과.
- `node node_modules/typescript/bin/tsc --noEmit`: 통과.
- `node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 4192 --strictPort`: 정상 시작. 검사 후 해당 서버만 중지했다.
- `node artifacts/detail-child-adult-school-check.cjs`: 모바일 390×844, 배율 2, 실제 배움 탁자 캔버스 탭 → 맡기기 → 잠들기 → 성인 아침 → 다시 실제 배움 탁자 탭 → 맡기기 → 저장·이어하기 흐름 확인. pageerror 없음. 물리 휴대폰 검사는 아니다.

## 대조 결과

1. 전날 저장 복원 후 schoolDay 93은 그날 18시 전까지만 유효하다. 아이 위치는 SCHOOL_SEAT, 함께하기는 school로 막힌다. 18시부터 해제된다.
2. 94일 성인 아침에는 schoolDay의 예전 값 93이 저장에 남아 있어도 현재 날짜와 달라 childAtSchool은 false다. 아이가 교실 칸에 붙잡혀 있지 않고 중복 비용·경험치가 발생하지 않는다. 85닢이 유지된다.
3. 성인 아침에 늦게 도착한 책 읽기/read, 이야기/story, 만들기/make 호출은 grown으로 거절한다. 게임 객체·재료·시간·보상을 바꾸지 않는다.
4. 배움터 창 취소도 상태·돈을 바꾸지 않는다. 예전 작품 발표/watch 입력은 stage로 거절되며 새 경험치나 기록이 생기지 않는다.
5. 아래 기존 보고 동작에 따라 성인도 현재 배움터에 다시 맡길 수 있다. 실제 공개 배움 탁자 진입에서 맡기기 5개가 활성화되고, 누르면 85→70닢·schoolDay 94·새 지능 경험치·교실 위치가 된다. 같은 날 다시 열면 맡기기 5개가 모두 비활성화되고 ‘오늘은 이미 맡겼어요.’가 나온다.
6. 최종 재접속 후 현재 schoolDay 94, 70닢, 성인 단계·직업/미확정 상태·지능 경험치·교실 위치가 일치한다.

## 기존 발견과 구분

성인 자녀도 배움터에 맡길 수 있는 동작은 이미 `docs/audits/balance-2026-10-13/report.md`의 요약과 상세 항목에 기록돼 있다. 이번에는 성장 직전/직후·현재 UI·저장 상태를 추가 확인했을 뿐 새 D번호나 새 버그 알림을 붙이지 않는다. 해당 보고서의 의도 확인/개선 검토 상태를 유지하며, ‘함께하기는 성인 차단, 맡기기는 성인 허용’이라는 차이만 사실로 기록한다.

이번 경계에서 새로 재현한 버그·안내 부족·의도 확인 항목은 없다. 이미 알려진 성인 배움터의 이용 범위를 임의로 제한하지 않았다.

## 코드 근거

- `src/engine/game.ts`의 childAtSchool: schoolDay가 현재 날짜와 같고 18시 전일 때만 유효하다. 예전 표식이 남았다는 이유만으로 예약이 이어지지 않는다.
- 같은 파일 canSchool/sendToSchool: 현재 성인 단계는 차단 조건에 없으며 현재 날짜별 한 번만 비용을 낸다. stage 분기 차이는 기존 보고와 같다.
- `src/engine/family.ts`의 canKidAct: 성인은 grown으로 거절한다.
- `src/engine/family-memory.ts`의 canShow: helper만 허용하므로 성인 발표/구경 지연 호출은 거절한다.
- `src/features/child/SchoolView.tsx`: canSchool 결과로 실제 맡기기 단추와 재이용 안내를 표시한다.

## 검사 준비 보정과 자료

- 초기 실제 성인 배움터 진입은 성장 아침에 열린 안내 편지(tipLetter)에 가려졌다. 이를 배움터 무반응으로 보고하지 않았다. 최종 스크립트는 성장 장면·새 편지 표시만 분리하고 기록자를 배움 탁자 곁으로 옮긴 검사 상태에서 공개 캔버스 진입을 재현했다. 이후 실제 버튼·비용·저장은 그대로 검증했다.
- 전날 10시→22시 경과와 배움터까지 이동 경로는 검사 상태로 준비했다. 하루 종일 실제 대기하거나 길찾기 전체를 검사한 것은 아니다.
- `artifacts/detail-audit/012-child-adult-school/result.json`: before, helperEnrolled, grown, adultEnrolled, restored.
- `adult-school-offer-known-behavior.png`: 성인도 배움터 맡기기가 가능한 현재 UI. 새 발견으로 사용하는 화면은 아니다.
- 진단용 `entry-diagnostic.png`는 안내 편지로 가려졌던 검사 준비 기록이며 확정 오류 증거가 아니다.

## 범위와 다음 대상

아이 성장의 14일·42일·84일 메뉴/행동과 이번 전날 배움터 표식 경계까지 초기 큐의 1차 검사를 마쳤다. 모든 형제·지도·직업·예약 조합을 전수 검사한 뜻은 아니다. D008 진로 전환 버그와 D007 도움 수령 안내 부족은 미수정으로 유지한다.

사용자 추가 요청의 대장장이 가구에는 `src/engine/bonds.ts`의 smith:2 부탁 보상 양초가 별도로 남아 있다. 다음 회차는 부탁 보상 수령 → 양초 설치 → 실제 화면의 빛/장식 반응·클릭 → 이동/회수·재접속 후 재사용만 검사한다. 협탁·나무통 결과를 양초까지 일반화하지 않는다. 이 추가 큐가 남아 있어 자동화는 아직 종료하지 않는다.
