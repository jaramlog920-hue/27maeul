# 001 — 설치 수납 가구에서 마지막 물건 꺼내기

검사일: 2026-10-19, 약 19:18~19:27 KST. 범위는 마지막 물건 꺼내기의 가방 종류/묶음 한도와 실패 안내다.

## 소스와 격리 조건

- HEAD: `e49615fce4a0eaeeaf31ea553398b8073e6251db`. 작업 트리에 기존 게임 변경이 다수 있어 HEAD만으로 실행 소스를 대표하지 않는다. 현재 작업 트리의 `game.ts`, `game-store.ts`, `StorageView.tsx`, `easier.ts`, `parts.css`, `global.css`를 사용했다. 게임 코드는 수정하지 않았다.
- 기존 `easier.test.ts`는 98→99 부분 꺼내기와 재시도 거절을 엔진에서 검사한다. `StorageView.test.tsx`는 정상 넣기/꺼내기와 집 밖/도구 거절을 검사한다. 이번에는 마지막 1개와 50종 경계의 실제 상세창 갱신·재접속·실패 알림 노출을 연결했다.
- `../progress.md`, 1차 최종 보고서와 `qa/comprehensive-audit-20261019-round2/{REPORT_DRAFT.md,ui/REPORT.md,economy/REPORT.md,root/REPORT.md}`를 대조했다. 수납 관련 기존 보고는 텃밭 수확의 수납 판정 불일치 등이다. 이번 보관함 실패 알림 가림은 해당 보고의 동일 재현으로 확인되지 않았다. 전 저장소 모든 과거 보고를 전수 검색한 것은 아니다.
- jsdom 메모리 localStorage와 Playwright의 새 임시 Edge context만 사용했다. 실사용 저장 접근 없음. 브라우저는 모바일 390×844, 터치 사용, 로컬 개발 서버 4197이다.
- 브라우저 초기 상태는 개발용 store load로 주입했다. 가방 50종(갈대 없음), 궤짝 갈대 1개, 집 안, `linenCupboard` 설치. 별도 궤짝 해금 없이 이불장의 수납 기능을 사용했다. 설치 과정 자체는 이번 검증 범위가 아니다. 관련 없는 시작 장면/안내를 비웠다.

## 실행 명령과 결과

1. `npm test -- --configLoader native --pool threads --maxWorkers 1 src/audit/detail-r2-storage-take.test.tsx` — **5/5 통과**, 종료 0. jsdom의 canvas getContext 미구현 경고가 있었으므로 그림 검증으로 간주하지 않았다.
2. `node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 4197 --strictPort` — 로컬 서버 준비 성공.
3. `node artifacts/detail-r2-storage-take-check.cjs` — 기본 샌드박스에서 Edge spawn EPERM. 같은 명령을 실행 권한 도구로 허용받아 격리 프로필에서 실행, 종료 0. 초기 실행은 상태/저장 흐름 통과. 캡처에서 안내가 보이지 않아 DOM 겹침 증거를 추가한 뒤 1회 재실행, 동일 결과 확인. 이는 게임 오류가 아닌 검사 프로세스 권한 제약이었다.
4. 브라우저 스크립트의 PASS는 수량·진입·저장 불변조건 통과를 뜻한다. **알림이 사용자에게 보였다는 뜻이 아니다.** 캡처와 별도의 겹침 측정에서 아래 안내 부족을 확인했다.

## 확인한 조합

| 조건 | 기대 | 실제 |
|---|---|---|
| 50종, 갈대 없음, 궤짝 마지막 갈대 1 | 꺼내기 거절·수량 보존·실패 이유 노출 | 수량 보존, 실패 toast 상태 생성. 실제 화면 안내 가림(R2-001) |
| 거절 후 닫기/재열기 | 소모 없음 | 보존 확인 |
| 빈칸 1개 확보 후 마지막 1개 꺼내기 | 가방 1, 궤짝 0, 상세 제거 | DOM 및 모바일 실제 터치 확인 |
| 50종, 갈대 98, 궤짝 1 | 기존 묶음 99, 궤짝 0 | jsdom UI 통과, 오래된 버튼 참조 재클릭에도 중복 없음 |
| 50종, 갈대 98, 궤짝 2 | 1개만 이동, 상세 수량 1, 재시도 보존 | jsdom UI 통과 |
| 선택 후 닫기 | 이동 없음 | jsdom 통과 |
| 성공 후 저장/페이지 새로고침/이어하기/이불장 재열기 | 가방 갈대 1, 궤짝 0 유지 | 실제 저장 API와 새로고침으로 확인, 페이지 오류 0 |

## R2-001 — 재현된 사용성·안내 부족: 보관함의 꺼내기 실패 알림이 창 뒤에 가려짐

영향: 가방이 찬 사용자가 보관함에서 꺼내기를 누르면 실패 이유를 볼 수 없다. 버튼은 활성 상태이고 수량도 그대로여서 반응이 없는 것처럼 보인다. 데이터 손실이나 복제는 재현되지 않았다. 현재 모바일 크기에서 직접 확인한 문제이며 모든 창/기기에서 발생한다고 일반화하지 않는다.

### 재현 순서

1. 집 안에 이불장을 설치하고 보관함에 갈대 1개를 둔다.
2. 가방에는 갈대 없이 50종을 넣는다.
3. 실제 캔버스에서 이불장을 터치한다. `modal={kind:'storage', item:'linenCupboard'}` 진입 확인.
4. 보관함 갈대 1개를 선택하고 **꺼내기**를 누른다.
5. 가방/보관함 수량은 변하지 않지만 실패 문구는 창에 나타나지 않는다.

기대: 실패 이유가 현재 보관함 창 위나 안에 보여야 한다. 실제: store의 toast.text와 DOM에는 `가방에 더 들어가지 않는다.`가 있으나 불투명한 보관함 창 뒤에 가려진다.

### 코드 및 화면 근거

- `src/engine/easier.ts:126`의 `fromChest`는 빈칸이 없으면 null을 반환한다.
- `src/store/game-store.ts:2295`의 `takeChest`는 null을 `say(T.easy.chestFull)`로 안내한다.
- `src/features/bag/StorageView.tsx:35`는 집 안이면 버튼을 활성화하며 실패 이유를 창 내부에 별도 렌더링하지 않는다.
- `src/features/play/Play.tsx:59`의 Toast는 world-frame 내부이고 ModalLayer는 그 뒤 별도 요소다.
- `src/app/parts.css:2`의 `.toast` z-index는 2, `src/app/global.css:554`의 `.modal-backdrop`은 10이다.
- 실제 toast rect `(103.5,143,183,50)`, opacity 1. 중심점의 가장 앞 요소는 보관함의 `p.hint`, 이어 `.dialog.bag.storage`, `.modal-backdrop`이다. `.toast`는 pointer-events:none이므로 hit 목록의 부재 자체를 증거로 삼지 않았고, 앞 요소와 겹치는 불투명 창 및 캡처를 함께 확인했다.
- `artifacts/detail-audit/round-2-20261019/001-storage-take/blocked.png`를 직접 열어 실패 문구가 보이지 않는 것을 확인했다. `results.json`에 실제 수량·toast·rect·화면 전면 요소를 보존했다.

개선 방향(미적용): 실패 이유를 보관함 창 내부에 노출하거나, 해당 알림을 모달보다 위의 안전한 레이어에서 표시한다. 다른 알림의 순서 영향은 별도 확인이 필요하다.

## 증거 파일

- 검증 테스트: `src/audit/detail-r2-storage-take.test.tsx`
- 재현 스크립트: `artifacts/detail-r2-storage-take-check.cjs`
- 증거: `artifacts/detail-audit/round-2-20261019/001-storage-take/{results.json,blocked.png,received.png,reloaded.png}`

## 미확인 및 다음 대상

- 데스크톱/다른 모바일 크기의 안내 겹침, 화면 읽기 도구의 실패 알림, 넣기 실패 안내는 미확인이다. 알림 레이어 전수 검사는 수행하지 않았다.
- 실제 영구 저장 복원은 마지막 1개 성공 경로를 확인했다. 실패 상태/부분 수령의 복원은 serialize/deserialize 검사까지다.
- 큐 1은 이 경계의 증거 확보를 완료했다. 다음은 큐 2: 보관함 한 묶음 29개에서 가방의 같은 물건 2개를 **모두 넣기** 할 때 1개만 이동한 뒤 잔여 수량·재시도·저장 복원이 정확한지 검사한다. R2-001 공통 알림 가림을 같은 신규 문제로 반복 보고하지 않는다.
