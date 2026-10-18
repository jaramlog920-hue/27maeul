# 010 — 돕는 아이가 되는 첫 아침과 실제 수령

2026-10-18 한국 시각. 큐 4의 born+42 성장 아침 하나를 검사했다. 이전 home/follow 선택·새 메뉴·첫 도움·한도에 따른 실제 수령·저장 복원만 대조했다. 게임 동작·밸런스·대사·그림은 변경하지 않았다.

## 조건과 실행 증거

- `legacyGame(CONTENT)`, 집 2단계, 아이 루시 born 10. 51일 22:00은 toddler, 잠든 다음 52일 아침은 helper다.
- 아이는 배우자 쪽 근력 born 1, lean strength, inherited 30인 상태. 기존 물려받기 완료 상태로 시작해 첫 도움의 경험치와 분리했다.
- 기존 모드 없음/home/follow 3조건을 상태·화면 검사로 비교했다. 브라우저는 home 모드에서 실제 잠들기·새 혼자 다니기 선택·재접속을 수행했다.
- 52일은 근력 도움의 water 지급 날이다. 가방 물 98/99, 궤짝 없음/물 29/30을 대조했다. 궤짝은 기존 unlock:supplyChest 권한을 가진 상태와 없는 상태를 분리했다.
- 실사용 저장은 접근하지 않았다. jsdom 메모리 저장소와 임시 Edge 프로필의 IndexedDB를 사용했다.

명령:

- `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-child-helper-morning.test.tsx`: 최종 8건 통과.
- `node node_modules/typescript/bin/tsc --noEmit`: 최종 통과.
- `node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 4190 --strictPort`: 정상 시작, 검사 종료 후 해당 서버만 중지했다.
- `node artifacts/detail-child-helper-morning-check.cjs`: 모바일 390×844, 배율 2, 실제 터치·저장 복원 4경로 통과. pageerror 없음. 물리 휴대폰 검사는 아니다.

## 정상·취소·상태 변경 결과

- 모드가 없던 아이는 성장 후 기본 roam, 명시적으로 home/follow를 골랐던 아이는 각각 그 선택을 유지한다.
- 잠들기 취소와 그 후 지연 sleep 호출은 날짜·단계·수량·첫 도움을 바꾸지 않는다.
- 실제 잠든 아침부터 ‘혼자 다니게 두기’가 나타난다. 기존 home/follow 표시·비활성 단추가 실제 모드와 일치한다.
- 첫 도움은 물 1개, childHelps 장면 한 번, childHelpDay 52와 근력 도움 표식, 근력 경험치를 기록한다. born 1의 25% 경험치 보너스로 10이 아니라 12.5가 오른다.
- 새 혼자 다니기를 선택해 저장 후 재접속하면 roam을 유지한다. 같은 아침 재접속/모드 변경으로 물이나 경험치가 중복 지급되지는 않는다.

## D007 — 재현된 안내 부족: 실제로 못 받은 첫 도움에도 성공 알림·일기 기록

재현 순서:

1. born 10인 근력 아이가 51일 밤을 맞는다.
2. 가방에 물 99개, 궤짝이 없거나 궤짝 물도 30개로 가득 차게 한다.
3. 잠들기 버튼으로 52일 아침을 맞는다.
4. 물의 가방+궤짝 합계와 아침 알림·오늘 기록을 확인하고 저장 후 다시 접속한다.

| 대조 조건 | 잠들기 전 물 합계 | 아침 물 합계 | 실제 수령 | 아침 안내 |
| --- | ---: | ---: | ---: | --- |
| 가방 98, 궤짝 없음 | 98 | 99 | 1 | 루시: 물이나 갈대를 날라 왔어요 |
| 가방 99, 궤짝 없음 | 99 | 99 | 0 | 같은 성공 문구 |
| 가방 99, 궤짝 29 | 128 | 129 | 1 | 같은 성공 문구 |
| 가방 99, 궤짝 30 | 129 | 129 | 0 | 같은 성공 문구 |

실제: 수령 0개 조건에서도 `childHelpKind:3`, `childHelp:strength` 일기, 첫 도움 pending 표식이 정상 수령과 똑같이 생긴다. 가방/궤짝 한도로 받지 못했다는 안내나 재수령 대기 상태는 없다. 재접속 후에도 총수량은 그대로이며 성공 기록만 남는다. 기존 물이 감소한 것은 아니다.

기대하는 안내: 적어도 ‘보관 공간이 부족해 받지 못했다’는 설명이나 실제 받은 수량을 함께 보여야 한다. 자동 도움의 넘치는 물건을 버리는 정책 자체를 바꿔야 하는지는 별도 의도 확인이 필요하다. 이번 발견은 **수령 실패와 구분되지 않는 성공 안내·기록**으로 한정한다. 임의로 물건 지급이나 한도를 수정하지 않았다.

코드 근거:

- `src/engine/game.ts:4786` 부근: finds 분기는 putAway 결과를 넣고 실제 수령량과 무관하게 helped=true를 유지한다.
- 같은 파일 4799–4806행 부근: helped에 따라 일기·childHelpKind·childFirstHelpPending을 남긴다.
- `src/engine/game.ts:3624`의 putAway → `src/engine/easier.ts`의 stash: 가방/궤짝 여유만큼 넣고 나머지는 반환 결과에 보류하지 않는다.
- `src/store/game-store.ts:801`의 sayChildHelp: 실제 물건 수령량 대신 도움 종류 표식으로 성공 문구를 선택한다.
- `src/engine/family-scenes.ts`: 첫 도움 pending 표식으로 첫 도움 장면을 예약한다. 이 검사에서는 장면 전체 연출을 새 버그로 추가 분류하지 않았다.

## 자료

- 상태: `artifacts/detail-audit/010-child-helper-morning/result.json`. 각 조건의 before, canceled, morning, restored와 actualReceived를 기록했다.
- 화면: `bag-room-morning.png`, `bag-full-no-chest-morning.png`, `bag-full-chest-room-morning.png`, `both-full-morning.png`.
- 마지막 화면에서 ‘물이나 갈대를 날라 왔어요’ 알림, 성장 후 혼자 다니기 단추, 기존 home 설명을 함께 확인했다. 실제 수량은 같은 경로의 JSON 상태와 대조했다.

## 검사 도구 보정·미확인 범위

- 첫 경험치 기대값에 born 보너스를 빠뜨린 오류를 바로잡았다. 기존 게임의 12.5 지급을 밸런스 버그로 세지 않았다.
- 첫 검사 fixture의 chest:null은 현재 GameState 형식과 달라 빈 객체로 고쳤다. 수납 가구가 없으면 chestOf가 null을 반환하는 정상 경로로 재검증했다.
- 초기 브라우저 기록자 이름이 이름 길이 제한을 넘어서 시작 버튼이 비활성화됐다. 유효한 짧은 검사 이름으로 바꾼 뒤 4경로를 실행했다. 이를 새 게임 오류로 보고하지 않았다.
- 50가지 물건으로 가방 칸이 다 찬 경우·근력 외 도움·운의 건너뛰는 날·형제 선택·배움터 예약·새 터는 이번 범위 밖이다.
- 아이의 모든 성장 경계가 끝난 것은 아니다. 다음은 helper→adult(`born+84`) 아침의 미확정 진로·집/떠남·기존 함께하기 메뉴와 지연 행동·저장 복원을 검사한다. 이번 도움 한도 조합을 반복하지 않는다.
