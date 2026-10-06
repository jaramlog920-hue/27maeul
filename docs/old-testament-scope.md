# 구약 범위 조사 — `Book`·`BOOKS`를 쓰는 곳 (계획 20 작업 1)

조사일: 2026-10-06. 방법: `src/`·`scripts/`에서 `\b(BOOKS|Book)\b`를 찾아 파일별로 분류. 코드에서 읽은 것이며 기억으로 쓰지 않았다.
(`src/`·`scripts/` 합계 52파일 — 테스트 20파일을 빼면 구현 32파일, 한 줄에 하나로 센 곳은 251줄. 계획 문서의 "34파일 128곳"은 조사 당시의 어림값이라 실제 값으로 바로잡는다. 테스트 파일은 신약 동작을 고정하는 쪽이라 그대로 둔다.)

## 원칙

- **`Book`·`BOOKS`(types.ts)는 건드리지 않는다.** 신약 27키 불변. 구약은 따로 `OtBook`·`OT_BOOKS`(`src/engine/ot-books.ts`).
- 필사 엔진만 키를 `CopyBook = Book | OtBook`으로 넓힌다(작업 5). 서고·퀴즈·제본·하나님 기록·업적은 신약 전용으로 남는다.
- 구약이 신약 `Progress = Record<Book, …>`에 섞여 들어가면 `allShelved`(27권 판정)·서고 퀴즈 풀·잔치 판정이 깨진다 — 그래서 구약 진행은 별도 선택 필드 `otProgress?`.

## 갈래 1 — 신약 전용으로 남김 (바꾸지 않는다)

| 파일 | 쓰임 | 남기는 까닭 |
|---|---|---|
| `engine/types.ts` | `Book`·`BOOKS`·`isGospel`·`isLetter` 정의, `GameContent.copy/chapterText/godRecords`의 `book: Book` | 신약 정의 그 자체. 내용 계약(`GameContent`)의 필사 함수 시그니처만 작업 5에서 필요하면 넓힌다 |
| `engine/library.ts` | `allShelved`(`BOOKS.every`)·`canShelve`·`poolFor`·`sideShelfSpines` | 서고 등급·꽂기는 신약 전용 (D9 "서고 등급 없음") |
| `engine/quiz.ts` | 서고·장 퀴즈의 `Book` 풀, `bookOptions`, 책 맞히기 문제 | 퀴즈 없음 (D9). 구약이 풀에 들어가면 정답 중복 규칙(§4-1)이 깨진다 |
| `engine/binding.ts` | `Bindings`, `SPINE_DESIGN`, `finishedCopies`, `sanitizeBindings` | 제본 없음 (D9) |
| `engine/finished-books.ts` | `finishedBooks`·`readChapters`·`toggleHomeBook`·`sanitizeHomeShelf` | 집 책장·완성본은 신약 전용. 구약 책등은 새 터 작은 책장(`OtShelf`)이 따로 보인다 (D12) |
| `engine/god-records.ts` | `chapterFinds`·키워드 | 구약 장 완료로 키워드가 늘지 않는다 (D9) |
| `engine/achievements.ts` | `shelvedN(BOOKS)`, "스물일곱 권" 업적 | 업적은 서고 신약 기준 |
| `engine/connections.ts`, `engine/job.ts` | 구절·장 수 표(`BOOK_CHAPTERS`), 사람·곳 이어지기 | 신약 구절 데이터 |
| `engine/daybook.ts` | `logChapter`·`sanitizeDaybook`의 `BOOKS` 검사 | 오늘의 기록(일기)은 신약 장만. 구약 가지는 `logChapter`를 부르지 않는다(작업 5에서 건너뜀) |
| `engine/copy.ts` | `blanksFor(book, …)` — 빈칸 옮겨 적기(편지·계시록) | 장 통째 옮겨 적기는 신약 편지·계시록 전용. 구약 필사는 절 단위 `copying.ts` 경로 |
| `engine/shelf-rooms.ts` | 서고 방 표, `roomOf`·`modeOf`·`bibleIdOf` | 신약 방 표. 구약 방은 `ot-books.ts`의 `OT_ROOMS`(서고 방이 아니라 책 고르기 방) |
| `engine/spaces.ts` | 로컬 상수 `BOOKS`(가구 이름 `bookcase`·`homeShelf`) | 이름만 같다 — 해당 없음 |
| `features/bag/Bag.tsx` | 제본 대기 책 | 제본 신약 전용 |
| `features/library/BookArt.tsx`·`ShelfRow.tsx`·`SpineMarks.tsx` | 책등·표지·서고 줄 | 서고 신약 전용 |
| `features/quiz/QuizView.tsx` | 책 이름 맞히기 | 퀴즈 신약 전용 |
| `features/word/Word.tsx` | 도감·진행 요약(`BOOKS.reduce`)·서고 줄 | 신약 도감. 구약 진행은 구약 탭이 따로 |
| `features/desk/LetterCopy.tsx` | 편지 옮겨 적기 | 신약 편지 전용 |
| `features/play/GameCanvas.tsx` | `finishBook(book: Book)` | 제본·꽂기 흐름 |
| `render/renderer.ts` | `drawSpine(book: Book)` | 서고 책등 그림. 새 터 서고 안은 작업 5에서 별도 그림 |
| `scripts/audit-table.mjs` | 로컬 `BOOKS` 배열(복음서 4권) | 이름만 같다 — 해당 없음 |
| `game.ts`의 나머지 | `activeBook`·`shelved`·`homeShelf`·`chooseBook`·`sealBook`·`bindBook`·`submitChapter`·`letterReady`·`recordLetter`·`BOARD_DEFS`·`bookLineKey` | 조각 엮기·서고·제본·판 — 신약 전용 |
| `store/game-store.ts`의 나머지 | `QuizMode`·`Modal` 중 bind/bookView·`seal`·`pickBook`·`openBind` 등 | 서고·제본·퀴즈 모달 — 신약 전용 |

## 갈래 2 — 필사 엔진에서 `CopyBook`으로 넓힘 (작업 5가 고친다)

| 파일 | 넓히는 곳 | 방법 |
|---|---|---|
| `engine/copying.ts` | `CopyState`의 `book`·`at`·`legacy`·`days`·`copied`, `copySpot`·`isCopiedChapter`·`copyChapters`·`copyVerses`·`openChapter`·`nextOpenChapter`, `sanitizeCopy`의 `isBook`, `sanitizeBookDays` | 키 타입 `CopyBook`. 진행은 한 입구 `progressOf(s, book)`(신약 `s.progress[book]`, 구약 `s.otProgress?.[book]`). `legacy`는 구약에 없다(빈 값) |
| `engine/books.ts` | `chaptersOf`(장 수) — 진행 읽기 | 구약은 `OT_BOOK_TABLE` 장 수. `Progress`·`emptyProgress`·`totalChapters`는 신약 27키 그대로 |
| `engine/game.ts` | `startCopy`·`saveCopyDraft`·`writeVerse` 세 함수만 | 구약 가지는 경험치·`chapterFinds`·판 동기화·`bookBound`·`firstChapter`·`logChapter`를 건너뜀, `otCopyStats`·`otProgress` 갱신 (D9) |
| `engine/save.ts` | `sanitize`의 필사·진행 부분 | 새 선택 필드 `otProgress?`·`otCopyStats?`의 기본값, `copy`의 구약 키 허용. 신약 `BOOKS` 순회는 그대로 |
| `content/catalog.ts` | `versesOf`·`chapterText`·`copySourceFor`·`bookOfRef` | 구약 약칭도 알아듣게 위임(작업 2). `quizSourceFor`·`piecesOf`·`BOOKS_WITH_CONTENT`·`BOOK_ABBR`(신약 Record)는 구약을 넣지 않는다 |
| `features/desk/CopyDesk.tsx` | `groupByRoom(BOOKS)` 책 고르기, `CopyMenu`·`CopyWrite`·`CopyDone`·`CopyGuide`의 `book` 타입 | 신약/구약 두 칸, 구약은 `OT_ROOMS`. `chapterGuide(구약)`은 `null` |

## 갈래 3 — 계획이 열거하지 않았지만 필사 경로에 걸려 있는 곳 (작업 5에서 얇게 넓힘, 이유를 적는다)

계획 작업 1은 "넓히는 곳은 위 여섯 갈래뿐이어야 하고 그 밖이 필요해 보이면 이유를 적고 멈춘다"고 했다. 아래는 서고·퀴즈·제본·하나님 기록·업적이 **아니라** 필사 호출을 넘겨 주는 통로이며, 타입(`Book` → `CopyBook`)만 바꾸고 동작은 늘리지 않는다. 작업 5 시작 전에 이 표가 맞는지 다시 확인한다.

| 파일 | 곳 | 이유 | 바꾸는 것 |
|---|---|---|---|
| `store/game-store.ts` | `commitVerse(game, book, text)`·`copyBook: (book) => void`·`copySave`·`copyType`·`copyVoice` 시그니처 | `writeVerse`/`saveCopyDraft`/`startCopy`를 부르는 통로. 책 키 타입이 `Book`이면 구약 필사가 타입에서 막힌다 | 이 필사 함수들의 `book` 타입만 `CopyBook` |
| `features/play/Hud.tsx` | `copyNow(book, at, completed)`의 `book: Book`·`BOOK_NAME[book]` | 위 줄 "지금 필사 자리" 표시가 `copySpot`을 부른다 | `CopyBook` + 구약 이름(`OT_NAME`) 조회. 구약을 쓰는 동안 위 줄이 비지 않게 |
| `engine/daybook.ts` | `logChapter`의 `book: Book` | **넓히지 않는다** — 구약 가지가 호출을 건너뛴다 | (바꿀 것 없음) |

멈출 이유는 아니라고 판단했다(핵심 엔진 여섯 곳과 같은 필사 경로의 타입 통로뿐, 새 동작·새 보상 경로 없음). 판단은 `docs/superpowers/plans/2026-10-06-plan-20-ot-village-and-generations-build.md`의 결정 D24에 기록했다.

## 갈래 4 — 구약 id가 신약과 겹치지 않음

`ot-books.test.ts`가 구약 id 39개가 `BOOKS`(신약 `mt mk lk jn ac rom … rev`)와 `books.json`의 id(`mat mrk luk jhn act …`)와 겹치지 않음, 약칭 66개(신약 27 + 구약 39)가 모두 유일함, 한글 이름이 66개 모두 유일함을 확인한다. 장 합계 929, 방 네 개가 39권을 한 번씩 덮음도 같은 테스트.
