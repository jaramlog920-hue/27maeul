# 스물일곱 권의 마을 — 계획 3: 콘텐츠 (마가 나머지 · 마태 · 요한)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네 복음서를 모두 게임에 넣는다 — 마가 4–16장, 마태 1–28장, 요한 1–21장 조각과 도장(네 방향, 양방향 일치)을 만들고, 권마다 판단 근거를 `docs/content-audit.md`에 남기며, 서고 퀴즈가 네 권의 모든 조합에서 정답이 하나뿐이도록 검사한다.

**Architecture:** 코드는 거의 바꾸지 않는다. 조각 원본 `scripts/pieces/{mk,mt,jn}.txt`에 한 줄씩 쓰고 `npm run build:pieces`로 `pieces.json`을 만든 뒤, `npm run verify`(덮기·제목 낱말·양방향 도장·문장 끝)가 0 오류일 때만 커밋한다. 코드 변경은 작업 1(퀴즈 괄호 구절 제외, 15조합 검사)과 작업마다 `verify-pieces.mjs`의 `COVERAGE` 한 줄뿐이다.

**Tech Stack:** 기존과 같음 (Vite · React · TypeScript · Vitest, 노드 스크립트는 `.ts`를 타입 스트립으로 import).

## Global Constraints

- 최상위 기준: `docs/exclusion-list.md`. 설계: `docs/superpowers/specs/2026-09-29-twenty-seven-design.md` §3.
- **성경 콘텐츠는 오류 0이 최우선.** 본문은 기억으로 쓰지 않는다 — 범위를 정하기 전에 반드시 `node scripts/dump-ref.mjs "막 4:1-9"`로 `nt-krv.json`에서 꺼내 읽는다.
- 조각 한 줄: `책 범위 | 제목 | 도장들` (예: `막 4:1-9 | 씨를 뿌리는 자 | =마 13:1-9; =눅 8:4-8`). 도장은 `=`(같은 이야기) · `~`(비슷한 이야기)를 `; `로 잇는다.
- 각 책을 1장 1절부터 끝 절까지 **빠짐없이, 겹치지 않게** 덮는다. 조각은 문장 중간에서 끝나지 않는다(verify가 `이르시되/가로되/…하고` 등으로 끝나면 막는다).
- 제목은 **본문에 있는 낱말만**(verify 검사). 해석 라벨·교리 용어·"비유"처럼 본문에 없는 말 금지. 같은 책 안에서 제목이 겹치지 않는다. 동명이인(요한·야고보·마리아·시몬·유다)은 본문 낱말로 가른다(gospel-days §3-3, content-audit §4).
- 도장 분류(exclusion-list §4·§5, content-audit §2): **같은 이야기**는 때·곳·인물과 말씀이 분명히 겹칠 때만. 애매하면 **비슷한 이야기**. 비슷하지도 않으면 도장 없음(= "네 복음서 중 ○○에만").
- **양방향 일치**: A가 B 책 구절을 가리키면 그 구절을 담은 B 조각도 A 책을 같은 종류로 가리킨다(verify가 강제, 상대 책 조각이 아직 없으면 건너뜀).
- **누가 조각(`lk.txt`)의 도장은 검수된 기준점.** 새 책과 맞추려고 누가 쪽을 고쳐야 하면 고치되, 이유를 `content-audit.md`의 "사용자 검수 필요" 목록에 적는다.
- **`(없음)` 절**(마 17:21·18:11·23:14, 막 9:44·9:46·11:26·15:28, 눅 17:36·23:17)은 절 번호만 있고 본문이 없다. 조각 범위 표기는 보통 쓰는 대로(`눅 17:20-37`) 번호를 걸치되, **본문 상자·퀴즈·조각 찾기 어디에도 보이지 않는다**(작업 1, `versesOf`에서 거름). 없는 본문을 보여 주지 않는다(사용자, 2026-09-29).
- **대괄호 `[ ]` 구절**(막 16:9-20, 요 5:3-4, 요 7:53-8:11)은 개역한글 본문에 실제로 있는 글이므로 본문 그대로 보여 주되, 사본 차이 표시이므로 퀴즈 문제·정답으로는 쓰지 않는다(작업 1). 괄호에 대한 설명·해석 문구는 넣지 않는다.
- verify 경고(같은 이야기인데 낱말 겹침 < 0.2)는 오류가 아니지만, 하나하나 두 본문을 읽고 같은 사건인지 확인해 content-audit에 결과를 적는다. 확신이 없으면 `~`로 낮춘다.
- 커밋 전 늘 통과: `npx tsc -b; npm test; npm run verify; npm run build`.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 브랜치 `plan-1-trial`. **배포하지 않는다.**
- 작업 폴더 `C:\Users\wn410\OneDrive\Desktop\cloooo\twenty-seven`. 셸은 Git Bash.

## 파일 지도

| 파일 | 책임 | 작업 |
|---|---|---|
| `src/content/catalog.ts` | `versesOf`에서 `(없음)` 절을 거른다 | 1 |
| `src/engine/quiz.ts` | 대괄호 구절을 문제에서 뺀다 | 1 |
| `src/engine/quiz.test.ts` | 괄호 절 제외, 네 권 15조합 정답 유일 | 1 |
| `scripts/pieces/mk.txt` | 마가 조각 | 2, 3 |
| `scripts/pieces/mt.txt` (새) | 마태 조각 | 4, 5, 6 |
| `scripts/pieces/jn.txt` (새) | 요한 조각 | 7, 8 |
| `scripts/pieces/lk.txt` | 되돌아오는 도장만 고침 (검수 목록에 기록) | 3, 6, 8 |
| `scripts/verify-pieces.mjs` | `COVERAGE` 한 줄 | 3, 4, 6, 7, 8 |
| `src/content/pieces.json` | 생성물 (`npm run build:pieces`) | 2–8 |
| `docs/content-audit.md` | 권마다 판단 근거 §6-2(마가) §6-3(마태) §6-4(요한), 사용자 검수 목록 | 2–8 |
| `src/content/catalog.test.ts` | 네 권 조각 수·대표 조각 | 9 |

## 조각 만드는 절차 (작업 2–8 공통)

1. 그 장들의 본문을 꺼낸다: `node scripts/dump-ref.mjs "막 4:1-41"`.
2. 이야기·말씀 단락마다 끊는다. 누가 조각 크기(평균 4–9절)에 맞춘다. 끊는 자리는 문장이 끝나는 절.
3. 제목을 본문 낱말로 짓는다(2–4낱말).
4. 평행 본문 후보를 떠올리되 **반드시 꺼내 읽고** 판단한다: `node scripts/dump-ref.mjs "막 4:1-9" "마 13:1-9" "눅 8:4-8"`. 상대 책 조각이 이미 있으면 그 조각의 범위에 맞춘 ref를 쓴다(누가 조각 경계를 기준으로).
5. `npm run build:pieces && npm run verify` — 오류 0이 될 때까지 고친다.
6. 경고를 하나씩 확인해 content-audit에 결과를 적는다.
7. content-audit의 그 책 절에: 조각 수, 끊기 원칙, 판단이 필요했던 항목(도장 같음/비슷함 근거, 누가 도장을 고친 것, 괄호 구절 처리)을 적는다. `node scripts/audit-table.mjs`로 전체 표를 다시 만든다.

---

### Task 1: `(없음)` 절 감추기, 대괄호 구절은 퀴즈에서 빼기, 네 권 15조합 정답 유일 검사

**Files:**
- Modify: `src/content/catalog.ts` (`versesOf`), `src/engine/quiz.ts`
- Test: `src/content/catalog.test.ts`, `src/engine/quiz.test.ts`

**Interfaces:**
- Produces: `versesOf(ref)`는 본문이 `(없음)`인 절을 돌려주지 않는다(본문 상자·퀴즈·`pieceOfVerse` 모두 여기서 받는다).
- Produces: `export function quizzable(text: string): boolean` — `(없음)`이거나 `[`·`]`가 들어간 절은 `false`. 퍼즐·빈칸·어느 책? 문제가 문장을 고를 때 이 함수를 통과한 절만 쓴다.

- [ ] **Step 1: 실패하는 테스트**

```ts
// catalog.test.ts
it('(없음) 절은 본문에 보이지 않는다', () => {
  const vs = versesOf('눅 17:34-37')
  expect(vs.map((v) => v.verse)).toEqual([34, 35, 37])
  expect(vs.some((v) => v.text === '(없음)')).toBe(false)
})
```

```ts
// quiz.test.ts
import { quizzable } from './quiz'
it('괄호 절은 문제로 쓰지 않는다', () => {
  expect(quizzable('(없음)')).toBe(false)
  expect(quizzable('[예수께서 안식후 첫날 이른 아침에')).toBe(false)
  expect(quizzable('저희가 [그에게 경배하고] 큰 기쁨으로')).toBe(false)
  expect(quizzable('어느 여자가 열 드라크마가 있는데')).toBe(true)
})
```
그리고 네 권 모든 조합(1권 4, 2권 6, 3권 4, 4권 1 = 15)마다 `buildLibraryQuiz`를 시드 20개로 돌려, 나온 문제의 문장(퍼즐·빈칸·어느 책?)이 `quizSourceFor(범위).countVerse(문장) === 1`이고 `quizzable`인지 확인하는 테스트. 조각이 없는 책은 조합에서 빼고 돈다(콘텐츠가 들어올수록 검사가 넓어진다).

- [ ] **Step 2: 실패 확인** — `npx vitest run src/engine/quiz.test.ts`
- [ ] **Step 3: 구현** — `catalog.ts`의 `versesOf`가 `text === '(없음)'`인 절을 거른다. `quiz.ts`에서 절 후보를 모으는 모든 곳(퍼즐·빈칸·어느 책?)에 `quizzable(v.text)` 거르기를 더한다.
- [ ] **Step 4: 통과 확인** — `npm test`
- [ ] **Step 5: 커밋** — `feat: (없음) 절 감추기, 대괄호 구절은 퀴즈에서 빼기, 네 권 조합 정답 유일 검사`

### Task 2: 마가복음 4–8장

**Files:** Modify `scripts/pieces/mk.txt`, `src/content/pieces.json`, `docs/content-audit.md` (§6-2 새로)

- [ ] 절차 1–6으로 막 4:1–8:38을 덮는다. 마태 도장은 적되(마태 조각이 아직 없어 verify가 건너뜀) 작업 6에서 다시 맞춘다. 누가 도장은 지금 양방향이 강제된다.
- [ ] `COVERAGE.mk`는 `'prefix'` 그대로(1–8장이 빠짐없이).
- [ ] content-audit §6-2 "마가복음 4–8장" — 판단 항목(예: 씨 뿌리는 자, 겨자씨, 거라사 광인, 오병이어, 베드로의 고백 등 각 도장의 근거).
- [ ] 검사 통과 후 커밋 `content: 마가복음 4–8장 조각과 도장`.

### Task 3: 마가복음 9–16장, 마가 전체 덮기

**Files:** Modify `scripts/pieces/mk.txt`, `scripts/verify-pieces.mjs` (`COVERAGE = { lk: 'full', mk: 'full' }`), `pieces.json`, `content-audit.md`

- [ ] 막 9:1–16:20을 덮는다. `(없음)` 절(9:44, 9:46, 11:26, 15:28)은 번호만 조각 범위에 걸친다(보이지 않음). 막 16:9-20은 본문 그대로 조각으로 두고 제목은 본문 낱말로, 해석·설명을 붙이지 않는다(audit에 처리 기록).
- [ ] `COVERAGE.mk = 'full'` — 16장 끝까지 빠짐없이.
- [ ] content-audit §6-2에 9–16장 판단 항목과 "마가 검수 요약"(조각 수, 누가 도장을 고친 목록, 경고 확인 결과)을 적는다.
- [ ] 검사 통과 후 커밋 `content: 마가복음 9–16장 — 마가 전체`.
- [ ] **체크포인트(사용자 검수):** 마가 검수 요약을 사용자에게 보여 준다. 사용자가 없으면 기록만 하고 다음으로 간다.

### Task 4: 마태복음 1–10장

**Files:** Create `scripts/pieces/mt.txt`, Modify `verify-pieces.mjs` (`COVERAGE.mt = 'prefix'`), `pieces.json`, `content-audit.md` (§6-3 새로)

- [ ] 마 1:1–10:42. 이제 마가·누가 쪽 도장이 마태를 가리키면 되돌아오는 도장이 강제된다 — 마가/누가 조각 범위에 맞춰 ref를 쓰고, 마가·누가 쪽 도장이 틀렸으면 그쪽을 고친다(누가는 검수 목록에 기록).
- [ ] 산상수훈(5–7장)은 누가 6:20-49와 흩어진 평행이 많다 — 말씀이 글자까지 가깝고 자리도 같은 것(예: 복 있는 자)만 신중히, 대부분 `~`.
- [ ] 커밋 `content: 마태복음 1–10장 조각과 도장`.

### Task 5: 마태복음 11–20장

**Files:** Modify `mt.txt`, `pieces.json`, `content-audit.md`

- [ ] 마 11:1–20:34. `(없음)` 절 17:21, 18:11은 번호만 조각 범위에 걸친다(보이지 않음).
- [ ] 커밋 `content: 마태복음 11–20장 조각과 도장`.

### Task 6: 마태복음 21–28장, 마태 전체 덮기와 세 권 도장 맞추기

**Files:** Modify `mt.txt`, `mk.txt`/`lk.txt`(되돌아오는 도장), `verify-pieces.mjs` (`COVERAGE.mt = 'full'`), `pieces.json`, `content-audit.md`

- [ ] 마 21:1–28:20. `(없음)` 23:14는 번호만 조각 범위에 걸친다(보이지 않음). 24:15의 괄호는 본문 그대로.
- [ ] `COVERAGE.mt = 'full'` 뒤 verify가 마가·누가에서 마태로 향한 모든 도장의 되돌림을 검사한다 — 오류를 0으로 만든다(작업 2–3에서 적어 둔 마가→마태 도장 포함).
- [ ] content-audit §6-3 "마태 검수 요약".
- [ ] 커밋 `content: 마태복음 21–28장 — 마태 전체, 세 권 도장 양방향`.
- [ ] **체크포인트(사용자 검수)**.

### Task 7: 요한복음 1–11장

**Files:** Create `scripts/pieces/jn.txt`, Modify `verify-pieces.mjs` (`COVERAGE.jn = 'prefix'`), `pieces.json`, `content-audit.md` (§6-4 새로)

- [ ] 요 1:1–11:57. 요한은 공관복음과 겹침이 적다 — 같은 이야기는 성전 정화(때가 다름 → `~`), 오병이어(`=`), 물 위를 걸으심(`=`) 등 본문을 읽고 신중히. 5:3-4(대괄호), 7:53–8:11(대괄호)은 본문 그대로 덮는다.
- [ ] 커밋 `content: 요한복음 1–11장 조각과 도장`.

### Task 8: 요한복음 12–21장, 네 권 완성

**Files:** Modify `jn.txt`, `mt.txt`/`mk.txt`/`lk.txt`(되돌림), `verify-pieces.mjs` (`COVERAGE = { mt: 'full', mk: 'full', lk: 'full', jn: 'full' }`), `pieces.json`, `content-audit.md`

- [ ] 요 12:1–21:25. 수난·부활 기사는 네 권 도장이 얽힌다 — 누가 조각 경계를 기준으로 맞춘다.
- [ ] 네 권 `full`로 verify 0 오류.
- [ ] content-audit §6-4 "요한 검수 요약"과 §1 요약(전체 조각 수) 갱신, `node scripts/audit-table.mjs`.
- [ ] 커밋 `content: 요한복음 12–21장 — 네 복음서 완성`.
- [ ] **체크포인트(사용자 검수)**.

### Task 9: 네 권으로 게임 한 바퀴 확인

**Files:** Modify `src/content/catalog.test.ts`, 필요 시 `src/engine/*.test.ts`

- [ ] 테스트: 네 권 모두 `BOOKS_WITH_CONTENT`에 있고, 책마다 조각 수가 `pieces.json`과 같고, 대표 조각(예: `mt-005-001`, `jn-011-001`)의 제목·범위가 원본과 맞는다.
- [ ] 테스트: 네 권을 차례로 꽂으면 서고 퀴즈에 탐정 문제가 네 방향으로 나올 수 있고(같은 이야기 도장이 있는 조각), 4권째에 대장간 구역이 열린다.
- [ ] 화면 확인(미리보기, 모바일): 책상에서 마태·요한 고르기 → 이웃이 조각을 건넴 → 본문 상자와 도장 표시 → 도감에 네 권이 장별로 접혀 보임.
- [ ] 전체 검사 후 커밋 `test: 네 복음서로 한 바퀴`.

---

## 자기 점검

- 설계 §3.3(네 권 빠짐없이·겹치지 않게) → 작업 2–8, `COVERAGE full`. §3.4(양방향, 누가 기준점) → 절차 4, 작업 6·8. §3.5(15조합 정답 유일) → 작업 1. §6-4(콘텐츠, 권마다 검수) → 체크포인트 3번.
- 괄호 절 처리는 설계에 없던 판단 — `(없음)`은 본문이 없으므로 보이지 않게(사용자 확인), 대괄호는 본문이므로 보여 주되 묻지 않는다. content-audit에 기록한다.
