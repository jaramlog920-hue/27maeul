# 기존 전체 테스트 실패 2건 독립 분류

기존 소스·테스트는 수정하지 않았다. 감사 전용 `.test.ts` 파일이 현재 원본 테스트를 import하고, 별도의 대조군에서 최신 정책에 맞는 입력을 검증했다. 설정의 include는 본 감사 폴더의 하네스만이다.

실행:

```text
node node_modules/vitest/vitest.mjs run --config qa/comprehensive-audit-20261019-round2/economy/vitest.config.ts qa/comprehensive-audit-20261019-round2/economy/triage-copy-again.test.ts qa/comprehensive-audit-20261019-round2/economy/triage-review-probes.test.ts qa/comprehensive-audit-20261019-round2/economy/triage-corrected-controls.test.ts --reporter verbose --reporter json --outputFile qa/comprehensive-audit-20261019-round2/economy/triage-results.json
```

결과: 3진입점, 10테스트, 8통과/2실패, 13.40초. 원본 8테스트 중 2실패, 정책에 맞춘 대조군 2개 모두 통과.

## 1. review-probes — 가족 여행 귀환

- 원본 실패: `src/engine/review-probes.test.ts:58`에서 `loaded.child.close`를 읽을 때 child가 null.
- 원본 전제: `:41`–`:44`는 새 게임(완료 장 0, growthVersion 1)에 가족과 돈만 넣는다. 여행은 `feature-rules.ts:19`의 40장 조건으로 잠겨 있다.
- 현재 `src/store/game-store.ts:1486`–`:1489`는 출발 시 `canTrip`을 재검사한다. 따라서 출발·완주·귀환이 실행되지 않는다. 이전 테스트는 출발 가드가 없어 잠긴 여행도 직접 스토어 호출로 시작할 수 있을 때의 전제다.
- 대조군: 같은 비용/날짜/가족에 `growthLegacy:1`로 실제 여행 가능 전제를 공급했다. 비싼 물건 선택 시 정산 거부, 정상 귀환 시 close 5·15닢·20일이 저장됨, 중복 귀환 보상 없음 모두 통과했다.
- 분류: **기존 테스트의 오래된 해금 전제**. 이번 재현에서는 가족 여행 기능 회귀를 확인하지 못했다.

## 2. CopyAgain — 메뉴→다시 쓰기 완료

- 원본 실패: `src/features/desk/CopyAgain.test.tsx:46`에서 modal view done 대신 write.
- 원본 전제: `:43`은 실제 한 절 전체를 `inputType:'insertText'` 한 번에 전송한다.
- 현재 `src/engine/copying.ts:90`·`:125`의 `COPY_BURST_MAX=12` 정책은 클립보드 제안 방지를 위해 이 입력을 거부한다. 필사 입력이 승인되지 않아 write 상태가 유지되는 것이 현재 정책이다.
- 대조군: 같은 빌레몬서 재필사를 시작하고 실제 키보드 크기로 한 글자씩 `hold:true`로 입력한 뒤 확정했다. done 및 `againDone['phm:1']===1`이 정상 확인됐다.
- 분류: **기존 테스트의 오래된 입력 전제**. 이번 재현에서는 재필사 완료 기능 회귀를 확인하지 못했다.

테스트 정리 권장: 첫 테스트는 여행 가능 상태를 명시하고, 두 번째는 입력 가드를 거치는 실제 크기 입력을 사용한다. 입력 가드 검증과 장 완료 검증을 구분하는 편이 낫다. 원본은 감사 규칙에 따라 수정하지 않았다.
