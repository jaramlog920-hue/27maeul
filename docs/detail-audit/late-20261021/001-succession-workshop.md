# 후반 콘텐츠 검사: 두 번째 세대교체와 손주의 새 터 일터

2026-10-21. 검사 요청에 따라 제품 수정·배포 없이 메모리 상태, 엔진 실행, jsdom 시설 UI, 직렬화 왕복으로 확인했다. 실제 사용자 저장은 사용하지 않았다.

## LATE-001 — 재현된 버그 / P2

손주가 부모의 이웃 자리를 이어받는 당일 손주의 새 터 일터 직업이 null이 된다. 건물과 주인 id는 그대로인데 일하는 인물 목록에서 빠진다. 건축 전이라면 같은 사람이 건축 후보에서 빠진다. 한 원인의 두 증상으로 센다.

### 재현 조건·순서

1. 신약 260장 진행 상태. rudy 자리는 주민 자녀 g-0001이 134일에 계승했다. g-0001과 g-0002의 자녀 g-0003은 160일에 태어났다. 두 부모 모두 생성 주민이고 손주는 성인이다. rudy 마음은 60점.
2. 244일에 손주가 성인이 되어 rudy 자리의 다음 견습으로 등록된다. 별도의 일터를 이미 지어 준 경우/아직 짓지 않은 경우를 각각 검사한다.
3. 283일까지 ownerJob(g-0003)=woodworker. 기존 일터가 있으면 kidWorkers에 손주가 포함되고, 없으면 kidWorkOwners에 후보가 나온다.
4. 284일 정산(견습 40일 완료). 실제 settleGen 경로가 retired.rudy.heir를 g-0001에서 g-0003으로 바꾼다.
5. ownerJob은 null, 기존 일터의 kidWorkers는 비어 있고, 미건축 후보도 사라진다. 건물 owner=g-0003와 성인 상태, 마음 60은 그대로다.
6. serialize → deserialize 후에도 동일하다. FacilityView를 실제 렌더하면 같은 손주 이름의 시설창은 열린다.

기대: 주민 자리 계승이 별도로 마련한 본인 일터의 직업·자격을 없애지 않아야 한다. 특히 본인이 바로 해당 직업 자리를 계승한 날 직업을 못 찾는 것은 모순이다.

### 코드 근거

- src/engine/kid-work.ts:47 fixedParentOf는 바로 위 부모가 고정 주민이거나 **현재** 은퇴 맵에서 자리 주인으로 조회되는 경우만 인정한다.
- 같은 파일:77–78 후보 생성과 :89 ownerJob이 이 조회를 공유한다. kidWorkers도 ownerJob이 없으면 해당 인물을 제외한다.
- src/engine/gen-growth.ts:119–130 다음 세대의 견습·은퇴는 retired[parent]를 새 후계자로 교체한다. 그 순간 이전 부모는 slotOfPerson에서 더 이상 원래 자리로 연결되지 않는다.
- src/render/renderer.ts:2113은 kidWorkers 목록으로 일터 인물을 그린다. 화면상 인물 누락은 이 입력과 코드로 확인했으며 실제 브라우저 화소 캡처는 하지 않았다.

### 검증·증거

새 테스트: src/audit/late-succession-20261021.test.tsx (4개). 발견 상태를 그대로 단언하는 **관찰용 재현 테스트**다. 통과는 버그 수정 완료를 의미하지 않는다.

```powershell
npm test -- --configLoader native --pool threads --maxWorkers 2 src/audit/late-succession-20261021.test.tsx src/engine/kid-work.test.ts src/engine/gen-growth.test.ts src/engine/gen-inheritance-save.test.ts
npx tsc --noEmit
```

- 관련 테스트 실행 결과: 5파일, 24/24 통과. Vitest 경로 필터에 일치하는 파일 포함. artifacts/late-audit-20261021/tests.log.
- 정산 하루 전/당일, 일터 유무, 저장 왕복, 시설 UI 이름, 243→284일 매일 정산 확인.
- 나이 들기 중지 / 은퇴 기능 미해금 상태에서는 계승이 일어나지 않고 같은 일터 직업이 유지되는 대조군 통과.
- 타입 검사 실패: 기존 작업 파일 src/engine/newland-homes-eight.test.ts:43,46의 TS2352 2개. 이번 재현 테스트에는 타입 오류 보고 없음. 해당 파일은 수정하지 않았다. artifacts/late-audit-20261021/typecheck.log (exit 1).
- 기존 종합 감사·유아 감사 및 docs/qa의 계승·일터 기록과 대조했다. 기존 다중 일터 주인 표시(M-05), 후계 배우자 외형(SOC-06), 손주 외형 유전과는 다른 경계다.

### 소스 상태

HEAD 3c5ffb06e634ba137432253d8453bd092b0a1b0f. 기존 변경·추가 파일이 많은 작업 트리이며 커밋만으로 현재 소스를 대표하지 않는다. 제품 파일을 변경하지 않았다.

SHA256:
- kid-work.ts: 3D14DDA36AA4FB4360C0BF3FDAF68698C298388702DEF4EAA26312778F916152
- gen-growth.ts: 7AA15C5852DF3CA8E8CCC7849C05A11096DB8958D796F4F85DE4C505A43D0332
- gen-settle.ts: B1A2204C92AE5886C841A184EA317C4EB86DC3CE41D8622D3083B8FB358AD20A

### 미확인 범위·다음 대상

기존 가족/완공 건물 상태는 합성 fixture로 준비했다. 연애·출산·건축 결제까지 수백 일을 실제 입력한 검사는 아니다. IndexedDB 프로세스 재시작, 실제 브라우저 지도 화소, 모든 직업·두 부모 모두 계승한 경우는 미검증. 제품 수정 및 배포 없음.

다음 독립 검사 대상: 240장 손주 출생 해금 전후의 출생 대기와 저장 재접속, 또는 250→260장 완결 보상/서고 개방의 중복 실행 경계. 이번에 해당 범위를 검사했다고 세지 않는다.
