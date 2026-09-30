# 스물일곱 권의 마을 — 계획 9: 요한계시록 방과 스물일곱 권 잔치

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서고의 마지막 잠긴 문(오른쪽 아래, "요한계시록 방")을 연다. 요한계시록 22장은 편지처럼 **장째로** 오되, **맑은 밤 언덕에서 별을 볼 때만** 한 밤에 1–2장씩 받는다(설계 §8 "별 보는 밤에 모으는 조각"). 기록은 편지와 같은 빈칸 옮겨 적기, 다 적은 책은 이 방 선반에 꽂고 편지식 서고 퀴즈(빈칸 · 어느 책? · 먼저 나오는 구절 — 첫머리 문제 없음). 방 안에는 사도행전 여정 판을 그대로 쓴 **일곱 교회 카드 판**(에베소 → 라오디게아, 본문 순서)을 둔다. 요한계시록을 꽂고 카드 판도 다 놓으면, 그다음 아침 **"스물일곱 권" 잔치** — 마을이 서고의 스물일곱 권을 함께 기뻐하고, 앨범에 한 장 남긴 뒤 삶은 그대로 이어진다(결말 없음).

**Architecture:** 방 표 `SHELF_ROOMS`의 `rev` 줄을 `mode: 'letters'`로 바꾸고 책 `'rev'`를 넣는다 — 장 조각·옮겨 적기(`copy.ts`)·책 고르기·편지 서고 퀴즈·방 열림(히브리서–유다서 방 여덟 권이 다 꽂힌 날 밤 → 다음 날 아침, `goToSleep`의 기존 반복문)이 그대로 돈다. 방 표에 두 칸을 더한다: `arrives?: 'stars'`(장이 오는 길 — 없으면 편지 나르는 이웃) · `noOpening?: true`(첫머리 문제·`letters.json` 줄 없음). `rev`는 편지(`Letter`, 스물한 권)에 넣지 않고 `Book`에 따로 더한다 — `LETTERS`를 도는 편지 테스트·첫머리 검증을 흔들지 않기 위해. 받는 길은 지금 쓰이지 않는 `stargaze`(언덕 "별 보기", 스토어의 `sitHill`)를 살려 언덕 메뉴에 붙인다. 일곱 교회 카드는 사도행전 여정 카드의 파일·파서·검증·판 계산(`journey.ts`)·화면(`JourneyBoard`)을 **판 id**(`acts` | `churches`)로 넓혀 그대로 쓴다. 잔치는 복음서 방 잔치(`gospelFeast` → `feastToday` · 광장 모닥불 · `feastFire` · `photoFor`)를 새 표식 `allFeast`로 한 번 더 쓴다. 방은 서고 오른쪽 아래 문(`LOCKED_DOORS[3]`) 뒤, 지도 아래 **16열·70줄**(11×8) — `HEIGHT`는 80 그대로.

**Tech Stack:** 기존과 같음.

## Global Constraints

- **사용자 결정(2026-09-30)** 그대로: 요한계시록은 조각으로 자르지 않고 장째로, **별 보는 밤에만** 한 밤 1–2장. 기록 = 같은 빈칸 옮겨 적기(`copy.ts` 그대로, 괄호·본문 없는 절 제외). 서고 퀴즈는 편지 모양(빈칸 · 어느 책? · 먼저 나오는 구절), **첫머리 문제 없음**. 방 놀이 = 일곱 교회 카드 판(여정 판 재사용, 카드는 2·3장을 옮겨 적으면 생김, 카드를 누르면 그 절). 방은 히브리서–유다서 방 여덟 권이 다 꽂힌 다음 날부터(기존 장치). 방이 다 차면 다음 날 아침 "스물일곱 권" 잔치(복음서 방 잔치 장치), 앨범, 그 뒤에도 계속 산다.
- **요한계시록: 본문 구조대로, 상징 해석 금지**(설계 §8, 새 exclusion §4-7 — 작업 3):
  - 카드·판·방·문구 어디에도 상징 풀이(일곱 별·촛대·짐승·수·색 등이 무엇을 뜻하는지), 시대·예언 해석(과거·미래·역사 대입), 교회의 성격 요약("칭찬받은 교회"·"미지근한 교회" 등)을 쓰지 않는다. 카드에는 **교회 이름(곳 이름)만** — 본문 절에 "{이름} 교회의 사자에게"로 글자 그대로 있는 것.
  - 방 그림에 요한계시록의 상(일곱 별·일곱 금 촛대·어린 양·짐승·나팔·대접·인·보좌 등)을 그리지 않는다. 등잔대(`lampStand`)도 이 방에는 두지 않는다(촛대와 헷갈리지 않게).
  - 장면·이웃 말에 요한계시록 문장·표현을 흉내 내지 않는다(exclusion §1-3·§2-1).
- **성경 콘텐츠 오류 0**: 본문은 `nt-krv.json`(개역한글)에서 장째로. 빈칸을 모두 맞게 채운 글 = 원문(22장 전부 테스트). 계획서를 쓰며 원문으로 센 값(작업 1에서 다시 세어 테스트에 박는다): **22장, 장 길이 20·29·22·11·14·17·17·13·21·11·19·17·18·20·8·21·18·24·21·15·27·21, `(없음)`류 절 0개, 괄호가 든 절 1개(계 20:5)**. 괄호 절은 본문으로 보이되 빈칸·퀴즈로 묻지 않는다(`quizzable`). 모든 퀴즈 문장은 출제 범위(서고 스물여섯 권 + 요한계시록)에서 유일(§4-1) — 일곱 번 되풀이되는 "귀 있는 자는 …" 같은 절은 이 규칙으로 저절로 빠진다.
- **잔치 문구**: 서고에 스물일곱 권이 **꽂혔다**는 마을 일로만 쓴다. 신약 27권이 역사 속에서 어떻게 모였는지(정경 형성)를 암시하지 않는다(exclusion §3-1) — "정경", "신약이 완성", "한 권으로 모였다" 같은 말을 쓰지 않는다. 성경 문장 없음, 해석 없음, 차분한 말투, 결말·끝맺음 화면 없음.
- 서고에 꽂힌 요한계시록은 `shelvedCount`에 세지 않는다(편지와 같음).
- 옛 저장이 그대로 열린다: 배포본은 계획 7이다(계획 8은 아직 배포 전) — 계획 7 배포본 모양 저장과 계획 8 모양 저장 모두 `progress.rev`·`churches: []`가 생기고, 방이 열리기 전에는 요한계시록이 책 고르기·도감에 보이지 않는다(작업 1·3 테스트).
- 문구는 모두 `life-text.json`(금지어 verify). 그림은 청소년 톤 차분한 파스텔, 2픽셀 이상 선, 창 좌우 대칭, 하트·리본·유아틱한 장식 금지.
- 커밋 전 네 가지 검사(`npm run verify`, `npx tsc -b`, `npx vitest run`, `npm run build`), 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, 브랜치 `plan-1-trial`. 배포는 작업 6에서만(https://27maeul.vercel.app, 사용자 사전 승인 — 계획 8도 함께 올라간다).
- 파일은 Read/Grep/Glob으로 읽고 Write/Edit로 쓴다(PowerShell `Get-Content`/`Set-Content`는 한글을 깨뜨린다). 커밋 메시지는 파일로 써서 `git commit -F`. 원문은 `node scripts/dump-ref.mjs "계 2:1-7"`로 읽는다(콘솔은 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` 먼저).

---

### Task 1: 요한계시록의 자리 — 방 표·장 조각·옮겨 적기·서고 퀴즈

**Files:** `src/engine/types.ts`(`Book = Gospel | 'ac' | Letter | 'rev'`, `BOOKS` 끝에 `'rev'` — `Letter`·`LETTERS`에는 넣지 않는다), `src/engine/shelf-rooms.ts`(`rev` 줄, `arrives`·`noOpening` 칸), `src/content/catalog.ts`(`REV_PIECES`, `PIECES`에 더함), `src/content/bible-subset.json`(`node scripts/build-bible-subset.mjs` — 목록은 방 표에서), `scripts/verify-letters.mjs`(첫머리 검사 대상에서 `noOpening` 방 빼기), `src/features/quiz/QuizView.tsx`(먼저 나오는 구절 묻는 말), `src/features/desk/Desk.tsx`(책 고르기 안내를 방마다), `src/content/life-text.json`(`quiz.books.rev`, `quiz.verseOrderBook`, `copy.pickHintStars`, `copy.notReceivedStars`), tsc가 가리키는 `Record<Book, …>` 표, 테스트 `src/engine/rev-book.test.ts`(새)·`shelf-rooms.test.ts`·`verify-letters.test.ts`

- [ ] 방 표:
  ```ts
  export interface ShelfRoom {
    id: ShelfRoomId
    books: readonly Book[]
    mode: 'pieces' | 'letters'
    door: number | null
    /** 장이 오는 길 (mode 'letters'만): 없으면 편지 나르는 이웃(낮), 'stars'면 맑은 밤 언덕에서 별 볼 때 (요한계시록, 작업 2) */
    arrives?: 'stars'
    /** 서고 퀴즈에 첫머리 문제를 내지 않는다 — letters.json에 줄이 없고 verify-letters도 이 방 책을 빼고 본다 (요한계시록) */
    noOpening?: true
  }
  // …
  { id: 'rev', books: ['rev'], mode: 'letters', door: 3, arrives: 'stars', noOpening: true },
  ```
  `arrivesOf(book)`(= `roomOf(book).arrives ?? 'post'`)를 함께 내보낸다. `rev`는 책 id이자 방 id이지만 쓰이는 표가 다르다(방 id `ShelfRoomId`, 책 id `Book`).
- [ ] `REV_PIECES`: `LETTER_PIECES`와 같은 규칙으로 장 하나에 조각 하나 — `{ id: 'rev-001', book: 'rev', ref: '계 1:1-20', chapter: 1, title: '요한계시록 1장', stamps: [] }`(끝 절 = 본문 배열 길이). 만드는 함수를 `chapterPieces(books)`로 떼어 `LETTER_PIECES = chapterPieces(LETTERS)`, `REV_PIECES = chapterPieces(['rev'])`. `PIECES = pieces.json + LETTER_PIECES + REV_PIECES`. 기존 테스트의 `PIECES.filter(isLetter) === LETTER_PIECES`는 그대로 선다.
- [ ] 약어 `계`: `versesOf('계 2:1')`이 요한계시록 2:1이고 다른 책 약어와 헷갈리지 않는지(테스트).
- [ ] verify-letters: `letterIds`를 `r.mode === 'letters' && !r.noOpening`인 방의 책으로. `opening.txt`에 `계` 줄이 있으면 오류(첫머리 문제를 내지 않는 책) — 역방향 픽스처 `scripts/fixtures/bad-letters-rev.txt` 하나.
- [ ] **첫머리 문제 없음 — 까닭**: 계 1:4에 "요한은 아시아에 있는 일곱 교회에 편지하노니"가 있지만, 사용자 결정대로 묻지 않는다(이 "요한"이 누구인지·복음서·요한일서와 같은 사람인지 말하지 않기 위해서도 — exclusion §4-6과 같은 태도). content-audit §6-11(작업 3)에 한 줄. `openingQuestion`은 줄이 없으면 이미 `null`이다 — 테스트로 고정(요한계시록 퀴즈에 `opening`·`openingNone`이 한 번도 나오지 않음).
- [ ] 퀴즈 화면: 먼저 나오는 구절의 묻는 말은 편지(`isLetter`)면 지금 문구, 아니면 `quiz.verseOrderBook` "이 책에서 먼저 나오는 구절은 어느 쪽인가요?"(요한계시록은 "편지"라 부르지 않는다). 옮겨 적기 화면 제목·버튼은 그대로("{책} {장}장 옮겨 적기").
- [ ] 책상: 책 고르기의 방 안내는 `arrivesOf`로 — 요한계시록 방은 `copy.pickHintStars` "요한계시록은 맑은 밤, 언덕 벤치 곁 편지함에서 한두 장씩 꺼내 와요.", 받지 않은 장은 `copy.notReceivedStars` "아직 이 장이 오지 않았어요. 맑은 밤에 언덕에 올라 별을 보세요."(작업 2의 편지함과 맞춤).
- [ ] 테스트 먼저(`rev-book.test.ts`): ① 조각 22개, 장 길이가 위 원문 값과 같고 조각 ref 끝 절 = 장 길이 ② `(없음)`류 0개 — `versesOf`로 본 절 수 = 원문 절 수(404) ③ `blanksFor('rev', c)` 22장 모두 빈칸 1개 이상(목표 3 — 모자라는 장이 있으면 원문으로 까닭을 확인해 장과 수를 박는다), 답으로 채운 절 = 원문, 계 20:5는 빈칸이 되지 않는다, 다른 보기로 채운 절이 요한계시록에 없다 ④ 여덟 권 중 하나라도 안 꽂혔으면 `roomOpen('rev')` 닫힘, 모두 꽂고 잔 다음 날 열림·장면 `roomOpen:rev`, 그 전에는 `pickableBooks`에 없고 `chooseBook('rev')` 그대로 ⑤ 계획 7·8 모양 옛 저장에 `progress.rev` ⑥ 서고 퀴즈(요한계시록만 / 스물일곱 권 전부) × 씨앗 여럿: 다섯 문제, 탐정·도장·`order`·`verse`·`opening`·`openingNone` 없음, 모든 문장 범위에서 유일, 빈칸 오답 문장이 범위·앱 본문 어디에도 없음, 어느 책? 보기 ≤ 5, 계 20:5 없음 ⑦ 요한계시록을 꽂아도 `shelvedCount` 그대로 ⑧ 편지 스물한 권 테스트(`LETTERS`)가 그대로 통과.
- [ ] 방 열림 장면 `roomOpen:rev`(`life-text.json`, 앞 두 방과 같은 짜임): 제목 "서고 오른쪽 아래 문" / "늘 잠겨 있던 서고 오른쪽 아래 문이 열렸다는 소식이 들려왔다." / "안에는 책 한 권을 꽂을 선반과 책장, 창 둘 사이 벽에 건 카드 판, 가운데 읽는 탁자가 있다." / 편지 나르는 이웃 "그 방 책은 해 질 녘에 언덕 벤치 곁 편지함에 넣어 둘게요. 맑은 밤에 별 보러 올라가서 꺼내 가세요. 비 오거나 흐린 날엔 젖을까 봐 넣지 않아요." 앨범 "서고 오른쪽 아래 방이 열린 날", 일지 " 서고 오른쪽 아래 방이 열렸다."
- [ ] 커밋 `feat: 요한계시록 자리 — 방 표에 넣고 장째로 옮겨 적기`.

### Task 2: 별 보는 밤에 받는 장 — 언덕 "별 보기"

**Files:** `src/engine/post.ts`(`starPostCountOf`, `starPostFor`), `src/engine/game.ts`(`stargaze`가 장을 건넴, `starsOut`, `todaysPost`는 `arrives === 'stars'`면 빈 값), `src/store/game-store.ts`(`sitHill` → 받은 장 알림, 편지 나르는 이웃 한 줄), `src/features/menus/PlaceMenu.tsx`(언덕 메뉴에 "별 보기"), `src/render/decor.ts`(언덕 벤치 곁 편지함), `src/content/life-text.json`(`ui.hillStars`, `ui.starsNotYet`, `ui.starsCloudy`, `post.starsBring`·`post.starsBringOne`·`post.revHint`), 테스트 `src/engine/star-post.test.ts`(새)·`game.test.ts`·`ModalLayer.test.tsx`

- [ ] **받는 길(결정)**: 요한계시록 장은 편지 나르는 이웃이 낮에 건네지 않는다. 이웃은 "해 질 녘에 언덕 벤치 곁 편지함에 넣어 둔다"(작업 1 장면) — 그래서 **밤에 누가 찾아와 소식을 전하는 장면이 없다**(exclusion §2-3 "밤에 양 치는 이에게 소식이 오는 장면"과 닮지 않게, 밤 언덕에는 이웃이 나오지 않는다). 플레이어가 맑은 밤 언덕 메뉴에서 **별 보기**를 누르면 편지함에서 오늘 밤 몫을 꺼낸다.
- [ ] 언덕 메뉴(`PlaceMenu` `place === 'hill'`)에 버튼 `ui.hillStars` "별 보기"(성경구절 읽기 위). 쓸 수 있을 때: `starsOut(minute)` = 20:00 이후(`STARS_FROM`, 시간이 멈추는 02:00까지)나 05:00 전. 그 밖에는 흐리게 두고 `ui.starsNotYet` "별은 저녁 여덟 시가 지나야 보여요." 비·눈·안개 날에는 눌러도 되지만(쉬기·20분) 편지는 없고 `ui.starsCloudy` "오늘 밤은 하늘이 흐려 별이 잘 보이지 않아요." 벤치(`place === 'bench'`)에는 두지 않는다.
- [ ] `stargaze(s, content)`: 지금 그대로(피로 풀기, 20분, 맑은 밤이면 그날 한 번 `stars` 장면) + **맑은 밤**(`!isWet && !== 'fog'`, 지금 `stargaze`의 판정 그대로)이고 지금 책이 요한계시록이고 그 방이 열렸고 오늘 밤 아직 꺼내지 않았으면(`flags[onceKey('starPost', day)]`) `starPostFor({ day, book, chapters, delivered: collected })` = 아직 받지 않은 장을 장 순서대로 **1장 또는 2장**(`starPostCountOf(day)` — 날 씨앗 `mulberry32`, `postCountOf`와 다른 곱수). 받은 장은 편지처럼 `collected`·`todayHeard`·`arrangement`에 넣는다(`receivePost`의 넣기를 함수로 떼어 함께 쓴다). 돌려줄 때 받은 id들을 알 수 있게 `{ state, pieceIds }`.
  - `stars` 장면은 전처럼 맑은 밤 하루 한 번(앨범 "별 보는 밤"은 한 번만 남는다). 편지를 받은 밤에는 장면을 먼저 보이고 알림(`post.starsBring` "벤치 곁 편지함에서 {n}통을 꺼냈어요. {book} {from}–{to}장이에요." / `starsBringOne`)을 띄운다.
  - 궂은 밤에는 그 밤 몫이 없다(다음 맑은 밤에 다음 장부터 — 밀린 몫을 한꺼번에 주지 않는다).
- [ ] 낮의 편지 나르는 이웃: 지금 책이 요한계시록이면 `todaysPost`가 빈 값(편지를 건네지 않음), 말을 걸면 평소 대화 위에 `post.revHint` "그 방 책은 언덕 편지함에 넣어 뒀어요. 맑은 밤에 꺼내 가세요." (남은 장이 있을 때만). 다른 이웃도 건네지 않는다(`todaysOffers`는 이미 `letters`면 빈 값).
- [ ] 언덕 편지함 그림(`decor.ts`): 요한계시록 방이 열린 뒤부터 언덕 벤치 곁 빈 풀 한 칸에 작은 나무 편지함(옅은 잿빛 나무·크림색 편지 끝, 2픽셀 선, 지붕 모양 뚜껑은 좌우 대칭). 그림만 얹고 막지 않는다. 자리는 `HILL_SPOTS`·언덕 자리(`PLACES.hill`)·길과 겹치지 않는 칸 — 테스트로 고정.
- [ ] 계획 10(모임 자리)이 호숫가 정자를 "별 보는 밤" 자리로 쓸 수 있다 — `stargaze`는 자리와 무관한 함수로 두고 메뉴만 언덕에 붙인다(주석).
- [ ] 테스트: ① 맑은 밤 22:00 별 보기 → 요한계시록 1장부터 1–2장, 같은 밤 두 번째는 없음, 다음 맑은 밤에 이어서 ② 낮 12:00·19:00에는 없음, 20:30에는 있음, 01:00(다음 날로 넘어가기 전)에도 그 날 몫이 한 번뿐 ③ 비·안개 날 밤에는 없음 ④ 지금 책이 다른 책이면 없음, 방이 닫혔으면 없음 ⑤ 낮의 편지 나르는 이웃은 요한계시록을 건네지 않음 ⑥ 저장/불러오기 뒤 받은 장 유지, 같은 밤 다시 받지 않음 ⑦ **시뮬레이션**: 방이 열린 날부터 매일 밤 22:00 별 보기 → 22장을 모두 받는 날 수를 재어 테스트 상한과 content-audit §6-11에 박는다(예: "맑은 밤 ○번, ○일") ⑧ 편지 스물한 권의 낮 편지 흐름 그대로(`post.test.ts`).
- [ ] 커밋 `feat: 별 보는 밤 — 언덕 편지함에서 요한계시록을 한두 장씩`.

### Task 3: 일곱 교회 카드 — 데이터·검증·판 계산 **(opus 검토)**

**Files:** `scripts/journey/rev.txt`(새), `scripts/journey-parse.mjs`·`scripts/build-journey.mjs`·`scripts/verify-journey.mjs`(판마다: `ac` → `journey.json`, `rev` → `churches.json`), `src/content/churches.json`(새), `src/content/catalog.ts`(`CHURCHES`, `CONTENT.churches`), `src/engine/types.ts`(`GameContent.churches?`), `src/engine/journey.ts`(판 id), `src/engine/game.ts`(`GameState.churches`, `syncBoard`·`moveBoardCard`, `recordLetter`가 요한계시록이면 카드 맞춤, 완성 표식 `churchesDone`), `src/engine/save.ts`, `scripts/fixtures/bad-churches-*.txt`, `docs/content-audit.md`(새 §6-11, §7 앞), `docs/exclusion-list.md`(새 §4-7), `src/content/forbidden.ts`, 테스트 `src/engine/churches.test.ts`(새)·`scripts/verify-pieces.test.ts`(또는 journey 검증 테스트)

- [ ] **원문을 읽고 정한 카드**(계획서를 쓰며 `dump-ref`로 확인 — 작업 때 다시 꺼내 한 줄씩 대조한다). 줄 형식은 여정 카드와 같다(`순서 | 곳 이름 | 구절`):
  ```
  # 요한계시록 일곱 교회 카드 — 한 줄 = "순서 | 교회 이름 | 구절"
  # 이름은 그 절에 "{이름} 교회의 사자에게"로 글자 그대로 있어야 한다 (verify). 카드에는 이름만 — 풀이·요약을 붙이지 않는다.
  # 계 2:1 "에베소 교회의 사자에게 편지하기를 …"
  1 | 에베소 | 계 2:1
  # 계 2:8 "서머나 교회의 사자에게 편지하기를 …"
  2 | 서머나 | 계 2:8
  # 계 2:12 "버가모 교회의 사자에게 편지하기를 …"
  3 | 버가모 | 계 2:12
  # 계 2:18 "두아디라 교회의 사자에게 편지하기를 …"
  4 | 두아디라 | 계 2:18
  # 계 3:1 "사데 교회의 사자에게 편지하기를 …"
  5 | 사데 | 계 3:1
  # 계 3:7 "빌라델비아 교회의 사자에게 편지하기를 …"
  6 | 빌라델비아 | 계 3:7
  # 계 3:14 "라오디게아 교회의 사자에게 편지하기를 …"
  7 | 라오디게아 | 계 3:14
  ```
- [ ] **판단과 까닭**(content-audit §6-11):
  - 일곱 이름은 계 1:11에도 한 줄로 모두 나온다("에베소, 서머나, … 라오디게아 일곱 교회에 보내라") — 카드 구절은 1:11이 아니라 각 교회에 보내는 말이 시작되는 절(2:1·2:8·2:12·2:18·3:1·3:7·3:14). 본문 순서 = 1:11의 순서 = 2–3장의 순서라 순서가 하나로 정해진다.
  - 두아디라(2:24)·사데(3:4)는 한 번 더 나오지만 첫 절이 아니므로 카드로 쓰지 않는다. 두아디라는 행 16:14, 라오디게아는 골 2:1·4:13·4:15·4:16, 에베소는 사도행전·에베소서에도 나온다 — 카드는 요한계시록 판에만 있고 구절로 가리키므로 헷갈리지 않는다(사도행전 여정 카드의 에베소와 판이 다르다).
  - 카드 이름은 곳 이름뿐("에베소"), 판 제목은 본문 낱말 그대로의 "일곱 교회"(계 1:4·1:11). "사자"가 누구인지, 교회마다 무슨 말을 들었는지 요약하지 않는다.
- [ ] **검증**(`verify-journey`를 판마다 돌게): `rev.txt` 구절은 `계 장:절` 한 절, 순서 1..7 빠짐없이, 앞 카드보다 뒤 구절, 본문이 없는 절 아님, 이름이 그 절에 글자 그대로 **그리고 `${이름} 교회의 사자에게`가 그 절에 있음**(요한계시록 판만의 규칙 — 1:11 같은 절을 막는다), 카드는 정확히 일곱, `churches.json` = `rev.txt`. 역방향 픽스처: ① 구절이 1:11 ② 이름 뒤에 풀이를 붙인 줄(`에베소 — …`) ③ 여섯 장뿐 — 각각 실제로 걸리는지 테스트. `ac.txt`·`journey.json` 검증은 그대로.
- [ ] **판 계산**(`journey.ts`는 이미 카드 배열을 받는 순수 함수라 그대로 — 이름만 주석으로 넓힌다): `cardsForChapters(CHURCHES, progress.rev.completed)` — 2장을 옮겨 적으면 카드 넷, 3장이면 셋. `placeNewCards`로 판 끝 가까이에 끼운다(계산해 보면 2장 뒤 `[2,3,1,4]`, 3장 뒤 `[2,3,5,1,6,4,7]` — 저절로 맞지 않는다; 테스트로 "옮겨 적기만으로는 순서가 맞지 않음"을 고정). `GameState.churches: number[]`(새 게임 `[]`). `syncBoard(s, 'churches', content)`·`moveBoardCard(s, 'churches', i, d, content)` — 사도행전 쪽 `syncJourney`·`moveJourneyCard`는 이것을 부르는 얇은 함수로 남겨 기존 테스트·화면을 흔들지 않는다. 완성(`journeyComplete`)이면 `flags.churchesDone = 1`(한 번, 배·아침 장면 없음 — 잔치 조건, 작업 5), 완성된 판은 움직이지 않는다.
- [ ] `recordLetter`: 요한계시록 장을 적으면 `syncBoard(…, 'churches')`. 불러오기(`sanitize`): 여정 판과 같게 — 옛 저장은 빈 판, 적은 장의 카드만 남기고 빠진 카드는 채움.
- [ ] `exclusion-list.md` 새 §4-7 "요한계시록 — 본문 구조대로, 상징 해석 금지": 위 Global Constraints의 세 줄(상징·시대 해석·교회 요약 금지, 카드엔 이름만, 방 그림에 상을 그리지 않음·등잔대 없음) + "첫머리 문제를 내지 않는다(계 1:4의 '요한'이 누구인지 말하지 않는다)". §3-1에 한 줄: "스물일곱 권 잔치는 서고 선반에 책이 다 꽂힌 마을 일이다 — 신약이 어떻게 모였는지를 말하지 않는다."
- [ ] 금지어(`src/content/forbidden.ts`): 먼저 `life-text.json`·`neighbors.json`에 없는지 Grep으로 확인한 뒤 `정경`, `휴거`, `천년왕국`, `적그리스도`, `666`, `짐승의 표`를 더한다(생활 문구에만 적용 — 성경 본문 파일은 검사 대상이 아니다). `bad-life-text.json` 픽스처에 하나 더해 걸리는지 확인.
- [ ] content-audit §6-11: 요한계시록 옮겨 적기(작업 1에서 센 값, 모자라는 장, 계 20:5), 받는 날 수(작업 2 ⑦), 일곱 카드 표와 까닭, 첫머리 문제를 내지 않는 까닭.
- [ ] 테스트: 2장 적기 전 카드 0, 2장 뒤 4, 3장 뒤 7, 판이 저절로 맞지 않음, ▲▼로 맞추면 `churchesDone`, 완성 뒤 움직이지 않음, 저장/불러오기 뒤 판 유지, 계획 7·8 모양 옛 저장 → `churches: []`, 사도행전 여정 판 동작 그대로(`journey.test.ts`·`acts-room.test.ts`).
- [ ] **opus 검토**: 다른 에이전트(opus)가 ① 일곱 카드를 원문과 한 줄씩 대조 ② 이 계획의 모든 새 문구(작업 1·2·4·5의 `life-text` 줄)를 exclusion §1-2·1-3·2-1·2-3·3-1·4-7로 읽어 상징 풀이·해석·성경 표현 흉내·27권 모인 역사 암시가 없는지 본다. 지적은 고치고 §6-11에 적는다. **사용자 검수 권함**으로 §6-11 끝에: ① 받는 길(언덕 편지함·맑은 밤만) ② 첫머리 문제를 내지 않음 ③ 잔치 조건(꽂기 + 카드 판).
- [ ] 커밋 `content: 일곱 교회 카드 — 본문 순서대로, 이름만`.

### Task 4: 요한계시록 방 — 서고 오른쪽 아래 문과 카드 판

**Files:** `src/engine/world.ts`(`REV_DOOR`, 방 `rev`, `REV_ROOM`, `PLACES.revShelf`·`churchBoard`·`revTable`, 새 붙박이 글자 `C` 범례), `src/engine/types.ts`(`PlaceId`), `src/store/game-store.ts`(선반·판·탁자 누르기, `announceRoom` 방 id 표에 `rev`, 카드 생김 알림), `src/features/ModalLayer.tsx`(판 창), `src/features/journey/JourneyBoard.tsx`(판 id prop), `src/features/library/RoomShelf.tsx`(`HEAD.rev`), `src/render/renderer.ts`(`C` 카드 판, `Q` 선반 테 색을 방마다, 요한계시록 책등, 카드 그리기), `src/content/life-text.json`(`revRoom` 묶음), 테스트 `src/engine/rev-room.test.ts`(새)·`world.test.ts`·`save.test.ts`·`src/features/journey/JourneyBoard.test.tsx`(있으면 넓히고, 없으면 새)

- [ ] **자리**: 11×8, **`x0 = 16, y0 = 70`**(16–26열 × 70–77줄). 겹침 확인: 내 집 안(넓힌 방 포함 16–27 × 60–65), 사도행전 방(2–12 × 60–67), 로마서–빌레몬서 방(30–40 × 60–67), 히브리서–유다서 방(30–40 × 70–77), 다락(40–47 × 41–46), 이웃집·서고 줄(41–58) — 모두 겹치지 않는다. `HEIGHT = 80` 그대로(78–79줄 빈 채). 테스트: 모든 방(`ROOMS`·다락·넓힌 집)이 서로 겹치지 않고 `HEIGHT` 안, 방 둘레 벽.
- [ ] **문**: 서고 오른쪽 아래 잠긴 문 = `LOCKED_DOORS[3]`(x 42, y 55). 방 표 `rev.door === 3`과 맞는지 테스트. 문을 밟으면 방 문깔개 위로, 문깔개를 밟으면 **그 문 왼쪽**(`x - 1`) 칸으로(오른쪽 벽 — 히브리서–유다서 방과 같음). 열린 문 `J` 그림은 `isRightWallDoor`가 이미 오른쪽 벽 두 문을 뒤집는다 — 확대 스크린샷으로 오른쪽 위·아래 문이 같은 모양인지 확인.
- [ ] **방 안**(문을 가운데 둔 좌우 대칭): 위 벽 가운데 **일곱 교회 카드 판**(새 글자 `C`, 세 칸에 걸친 한 장 — 여정 판 `M`과 같은 나무 테, 바탕은 옅은 잿빛 하늘색, 카드 자리 일곱 칸을 옅은 테로), 양옆 같은 창(`N`) 둘, 왼쪽 **한 권 선반**(`Q` — 사도행전 선반 그림, 위 테 색만 방마다: 사도행전 잿빛 파랑 그대로, 요한계시록 옅은 라벤더 `#b8b0cc`), 오른쪽 책장(`s`), 가운데 읽는 탁자(`n`, `readPick`), 탁자 아래 둥근 깔개(`roundRug`), 구석 화분(`p`) 둘. **등잔대·별·촛대 그림을 두지 않는다**(§4-7). 새 가구 그림은 없다.
- [ ] **카드 판 그리기**: 일곱 자리 가운데 판에 놓인 카드 수만큼 크림색 카드(4×4 이상, 2픽셀 테), 자리 순서 = 판 순서(맞는지는 그림으로 알려 주지 않는다), 다 놓으면(`churchesDone`) 카드 위를 잇는 실이 금빛 — 사도행전 판과 같은 짜임.
- [ ] **판 창**: `JourneyBoard`에 `board: 'acts' | 'churches'` prop — 카드 목록·문구 묶음·움직이기를 판에 따라. 요한계시록 문구(`revRoom`): 제목 "일곱 교회 카드", 안내 "요한계시록을 옮겨 적으며 얻은 교회 이름 카드를 본문에 나오는 순서대로 놓아 보세요. 카드를 누르면 그 이름이 나오는 구절이 보여요.", 개수 "카드 {got} / 7장", 빈 판 "아직 카드가 없어요. 요한계시록 2장과 3장을 옮겨 적으면 카드가 생겨요.", 맞음 "지금 놓인 카드는 본문 순서대로예요.", 틀림 "차례가 어긋난 카드가 있어요.", 완성 "일곱 교회 카드를 본문 순서대로 다 놓았어요.", 카드 창 제목 "{place} 카드", 카드 생김 알림 "일곱 교회 카드 {n}장이 생겼어요." 카드를 누르면 `Passage`로 그 한 절(개역한글) — 풀이 없음.
- [ ] **선반**: `RoomShelf room="rev"` — 한 권, 꽂기 → 편지식 서고 퀴즈(작업 1) → 이 선반으로 돌아옴, 꽂힌 뒤 등급·다시 도전. 방 이름 알림은 `roomTitle(shelfRoom('rev'))` "요한계시록 방". 선반 문구 `revRoom.shelfTitle` "요한계시록 선반", `shelfNotice` "다 옮겨 적은 요한계시록은 이 방 선반에 꽂습니다."
- [ ] 테스트: 닫히면 넷째 문 막힘·누르면 "잠겨 있어요", 열리면 걸어 들어가고 문깔개로 서고 안 문 왼쪽 칸, 선반·판·탁자 자리가 걸어서 닿음(길찾기), 판을 누르면 `churches` 판 창, 꽂기 → 퀴즈 → 선반, 저장/불러오기 뒤 문 상태 유지, 다른 세 방 동작 그대로, 계획 7·8 모양 저장(서고·각 방 안에 선 것)을 불러와도 자리 그대로.
- [ ] 미리보기(모바일 크기): 개발 도우미로 방 열기 → 서고 오른쪽 아래 문 → 방 안·카드 판·선반 확대 스크린샷, 판 창에서 카드 누르기(계 2:1 본문).
- [ ] 커밋 `feat: 요한계시록 방 — 서고 오른쪽 아래 문과 일곱 교회 카드 판`.

### Task 5: 스물일곱 권 잔치 **(opus 검토 — 문구)**

**Files:** `src/engine/library.ts`(`allShelved`, `feastToday`를 두 잔치로), `src/engine/game.ts`(`goToSleep`의 `allFeast`, `lessonTime`·`eveningBusy`가 `feastToday`를 보게), `src/engine/stories.ts`(`momentNow` — 잔치 날 저녁 광장 `allFeastFire`), `src/engine/events.ts`(일정 "스물일곱 권 잔치"), `src/content/life-text.json`(장면 `allFeast`·`allFeastFire`, 일지 줄), `src/content/catalog.test.ts`(앨범 id), 테스트 `src/engine/all-feast.test.ts`(새)

- [ ] **조건(결정)**: 요한계시록이 서고에 꽂혔고(`shelved.rev`) **그리고** 일곱 교회 카드 판을 다 놓았다(`churchesDone`). 둘의 순서는 상관없다 — 둘 다 된 날 밤에 자면 다음 날 아침 잔치. 요한계시록 방은 앞 방이 다 차야 열리므로 이때 스물일곱 권이 모두 꽂혀 있다 — 그래도 `allShelved(s)`(= `BOOKS.every(b => shelved[b] !== undefined)`)로 한 번 더 본다. 카드 판을 잔치 조건에 넣는 까닭: 방 놀이까지 마쳐야 "방이 다 찼다"가 되고, 사도행전 방(배)과도 짜임이 같다.
- [ ] `goToSleep`(복음서 방 잔치 바로 아래, 같은 짜임): `flags.allFeast === 1`이면 `2`(지난 잔치), 아니면 조건이 맞고 아기 잔치 날·마을 행사(`festivalOf`) 날이 아니면 `allFeast = 1`, 장면 `allFeast`, 그날 별 보는 밤 모임은 잡지 않는다. 겹치는 날은 하루 미룬다(다음 잠에서 다시 봄). 한 번뿐.
- [ ] **저녁 모닥불은 복음서 방 잔치 장치 그대로**: `feastToday(s)` = `gospelFeast === 1 || allFeast === 1` — 이웃이 광장 `FESTIVAL_SPOTS`로 모이고(`goalContext`), 모닥불 그림(`renderer`의 `festOn`), 아이 글자 공부 쉼(`lessonTime`), 저녁 초대 없음(`eveningBusy`)이 저절로 따라온다. `momentNow`: `allFeast === 1`이고 18:30–(`FESTIVAL_FROM + 30`) 광장 안이면 `allFeastFire`(그날 한 번). 비가 와도 연다. 일정표(`events.ts`): "스물일곱 권 잔치 · 장터 모닥불 · 특별 장면은 18:30부터".
- [ ] **장면 문구**(`life-text.json`, 성경 문장·해석 없음, 차분하게, "정경·완성·모였다" 없음 — opus 검토):
  - `allFeast` 제목 "서고가 다 찼다": narration "서고 다섯 방 선반에 스물일곱 권이 모두 꽂혔다는 소식이 아침부터 마을에 돌았다." / grandpa "마지막 방까지 다 채웠구먼. 오늘 저녁엔 광장에 다 같이 모이세." / carpenter "선반 칸마다 책이 들어차 있더군요. 짜 둔 보람이 있어요." / postman "언덕 편지함은 이제 비워 둘게요. 오늘은 저도 잔치 손님이에요." / narration "잔치는 저녁 여섯 시, 장터 광장 모닥불 곁에서 열린다. 비가 와도 연다고 한다." 앨범 "스물일곱 권이 다 꽂힌 날".
  - `allFeastFire` 제목 "광장 모닥불 잔치", `photoFor: "allFeast"`(잔치 아침 칸을 저녁 모닥불 그림으로): narration "광장에 모닥불이 피었다. 마을 사람들이 하나둘 불 곁에 모여 앉는다." / baker "빵을 넉넉히 구워 왔어요. 다들 하나씩 드세요." / child "서고 방을 하나하나 다 들어가 봤어요. 빈 칸이 하나도 없었어요!" / innkeeper "국은 한 솥 더 있어요. 천천히 드세요." / narration "불이 잦아들 무렵, 사람들은 내일 할 일을 이야기하며 하나둘 집으로 돌아갔다."
  - 일지: `allFeast` " 서고에 스물일곱 권이 다 꽂혔다.", `allFeastFire` " 광장 모닥불 잔치에 갔다."
  - 이웃 이름은 역할 id만(말하는 이 표는 기존 것) — 아직 이사 오지 않은 이웃이 말하는 줄이 없는지(목수·주막 주인은 서고 권수로 이사 오므로 이때는 늘 와 있다 — 테스트로 확인).
- [ ] **잔치 뒤**: 결말 화면·끝맺음 문구 없음. 다음 날부터 하루가 그대로 이어진다(책 고르기에서 모든 책이 "다 엮음", 다시 도전·옮겨 적기 다시 읽기·마을 삶 그대로).
- [ ] 테스트: ① 요한계시록만 꽂고 판 미완 → 잔치 없음, 판만 완성·안 꽂음 → 없음, 둘 다 → 다음 날 아침 `allFeast` 장면·`allFeast === 1`, 그다음 잠에서 `2`, 다시 나오지 않음 ② 아기 잔치 날·마을 행사 날과 겹치면 하루 미룸 ③ 잔치 날 저녁 이웃이 광장 자리로, 18:30 광장에서 `allFeastFire` 한 번, 비 오는 날에도 ④ 잔치 날 별 보는 밤 모임·저녁 초대·글자 공부 없음 ⑤ 앨범에 `allFeast` 한 장(`photoFor`) ⑥ 잔치 뒤 새 날 정상(`tick`·`goToSleep` 몇 번), 복음서 방 잔치 테스트 그대로 ⑦ `allFeast`·`allFeastFire` 문구에 금지어 없음(verify), 성경 본문의 한 절(띄어쓰기 뺀 14자 이상 조각)이 장면 문구에 들어 있지 않음 — `nt-krv.json`과 대조하는 테스트.
- [ ] **opus 검토**: 잔치 두 장면·`roomOpen:rev`·편지함 문구를 exclusion §1-2·1-3·2-1·2-3·3-1·4-7로 읽는다(작업 3 검토와 함께 해도 된다). 지적은 고치고 content-audit §6-11에 적는다.
- [ ] 커밋 `feat: 스물일곱 권 잔치 — 서고가 다 찬 다음 날 광장 모닥불`.

### Task 6: 한 바퀴 확인과 배포

- [ ] **계획 8 확인 항목**(계획 8 작업 6은 아직 하지 않았다 — 이 바퀴에 함께): 로마서–빌레몬서 열세 권 꽂기 → 잠 → 오른쪽 위 문 열림 → 요한이서 한 통 받아 옮겨 적기 → 꽂기(`openingNone` 문제) → 유다서 보낸 이 빈칸 오답에 야고보 없음.
- [ ] **계획 9**: 개발 도우미로 히브리서–유다서 여덟 권 꽂기 → 잠 → 아침 `roomOpen:rev` 장면 → 책 고르기에 "요한계시록 방"(모바일 폭 360px 가로 스크롤 없음, 안내 문구) → 요한계시록 고르기 → 낮에 편지 나르는 이웃(건네지 않음·안내 한 줄) → 비 오는 밤 언덕 별 보기(없음·흐림 안내) → 맑은 밤 22:00 언덕 별 보기(`stars` 장면, 1–2장 알림, 편지함 그림) → 책상에서 1장 옮겨 적기(틀린 보기 한 번) → 2·3장까지 적어 카드 생김 알림 → 방 카드 판 창에서 ▲▼로 맞춤·카드 눌러 계 2:1 보기 → 22장까지 적기(개발 도우미) → 방 선반에 꽂기(첫머리 문제 없음, "이 책에서 먼저 나오는 구절", 어느 책? 보기 다섯) → 잠 → `allFeast` 아침 → 18:30 광장 `allFeastFire` → 앨범 사진 → 다음 날 평소대로. 옛 저장(계획 7 배포본)을 불러와 이어지는지. 콘솔 오류 0.
- [ ] 스크린샷(모바일): 언덕 메뉴 "별 보기", 요한계시록 방 전체, 카드 판 창, 잔치 장면.
- [ ] 전체 검사 후 배포(https://27maeul.vercel.app 200 확인 — 사용자 사전 승인), 커밋 `chore: 계획 9 마무리`.

## 자기 점검

- 사용자 결정: 장째로·별 보는 밤에만·한 밤 1–2장(작업 2 — 언덕 "별 보기", 편지함, 맑은 밤만), 같은 빈칸 옮겨 적기·괄호/본문 없는 절 제외(작업 1 ③), 편지식 퀴즈·첫머리 없음(작업 1 ⑥), 일곱 교회 카드 판·2·3장에서 카드·누르면 절·상징 해석 없음(작업 3·4, exclusion §4-7), 여덟 권이 다 꽂힌 다음 날 열림(작업 1 ④ — 기존 장치), 방이 다 차면 다음 날 아침 잔치·앨범·계속 삶(작업 5), 오른쪽 아래 문·빈자리·`HEIGHT` 안(작업 4), 옛 저장·life-text·그림 규칙·금지어(작업 1·3·4·5), 한 바퀴 + 배포(작업 6).
- 정확성: 원문 값(장 길이·`(없음)` 0·괄호 1)을 테스트에 박음(작업 1), 카드 일곱은 원문을 꺼내 적고 verify가 "{이름} 교회의 사자에게"까지 확인하고 opus가 대조(작업 3), 퀴즈 문장 유일(작업 1 ⑥), 잔치 문구에 본문 조각이 없는지 대조(작업 5 ⑦).
- 기존 동작이 바뀌는 곳: 언덕 메뉴에 버튼 하나(`stargaze`가 처음으로 화면에 붙음 — 맑은 밤 `stars` 장면이 이제 실제로 보인다), `feastToday`가 두 잔치를 봄(복음서 방 잔치 테스트로 그대로 확인), 여정 판 함수가 판 id를 받음(사도행전 쪽은 얇은 함수로 그대로), 퀴즈 "먼저 나오는 구절" 묻는 말이 편지가 아니면 "이 책에서". 편지 스물한 권의 흐름·첫머리 검증은 그대로(`rev`는 `LETTERS`가 아니다).
- 계획서가 정한 것 중 사용자 결정 밖의 것: 언덕 편지함(밤에 소식을 전하는 사람이 없게), 궂은 밤 몫을 쌓지 않음, 잔치 조건에 카드 판 포함, 방 자리 16열·70줄, `rev`를 `Letter` 밖에 둠, 금지어 여섯 더함 — 작업 3의 "사용자 검수 권함"에 앞 셋을 남긴다.
