# 스물일곱 권의 마을 — 계획 20: 구약 마을과 주민 세대 첫 제작 (실행 계획)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

작성: 2026-10-06
상태: 실행 계획 작성 완료 / 구현 시작 전 (체크박스는 실제 연결·검증 뒤에만 표시한다)

**사용자 요청 (2026-10-06):** 계획 18(구약 서고와 두 번째 마을)과 계획 19(주민의 자율 가족과 다음 세대)를 실제로 만들 수 있게 실행 계획으로 쓴다. "묻지 말고 직접 결정하라."

**대상 문서:**
- [계획 18](2026-10-05-plan-18-old-testament-village.md) (§16 순서, §17 결정 항목과 고신 가이드 기준), [계획 19](2026-10-06-plan-19-resident-generations.md) (§16 단계, §18 결정 항목)
- 자산: `docs/old-testament-generations-assets.md`, `assets/old-testament-generations/도트_목록과_연결안내.txt`·`manifest.json`
- 기준: `docs/exclusion-list.md`(최상위), 형식 기준: [계획 16](2026-10-05-plan-16-villagers-life.md)

**한 줄 목표:** (1부) 신약 27권을 마친 저장이 새 터와 작은 구약 서고를 받고, 첫 마을과 새 터를 오가며 구약 본문을 필사하고, 빈 땅에 길·마당·작은 집을 놓아 보는 경험까지. (2부) 대표 주민 한 가족이 게임 날짜만으로 관계 → 결혼 → 아이 출생까지 저절로 이어지고, 소식·수첩에 남고, 설정에서 멈출 수 있는 경험까지. **전체 완성(계획 18 작업 12, 계획 19 단계 11)이 아니다 — 이 계획의 완료를 전체 완료로 말하지 않는다.**

---

## 결정 (2026-10-06, 임의 결정 — 사용자에게 나중에 알림)

사용자가 "묻지 말고 직접 결정"이라 했으므로 계획 18 §17과 계획 19 §18의 미결 항목을 아래처럼 정한다. **보수적인 기본값**이며, 사용자가 나중에 바꾸라 하면 이 표의 상수·문장만 고친다(코드는 상수 한 곳 `gen-config.ts`·`newland-config.ts`에 모은다). 구현자는 이 표를 다시 묻지 않고 그대로 따른다.

### A. 계획 18 (구약 서고와 두 번째 마을)

| # | 항목 | 결정 |
|---|---|---|
| D1 | 정경·번역·순서·단위 | 개신교 구약 **39권**, **개역한글**(신약과 같은 본문 계열), 표준 순서(창세기 → 말라기), **929장**. 필사 단위는 신약과 같은 **장 안의 절**. 본문은 `jaramlog-v2/public/bible/krv/<1..39>/<장>.json` 형식 `{"v":[[절,본문],…]}`에서 가져온다. 책 id는 소문자 세 글자 `gen exo lev num deu jos jdg rut 1sa 2sa 1ki 2ki 1ch 2ch ezr neh est job psa pro ecc sng isa jer lam ezk dan hos jol amo oba jon mic nam hab zep hag zec mal`(신약 책 id와 겹치지 않음을 테스트로 확인). |
| D2 | 두 번째 마을 | 화면 이름 **"새 터"**(내부 id `newland`) — 실제 지명·성경 지명이 아니고 이름 없는 마을 원칙(§2-3)을 잇는다. 크기 **가로 40 × 세로 40줄**: 위 30줄은 바깥(보이는 땅), 아래 10줄은 보이지 않는 서고 안 방(첫 마을이 이웃집 안 방을 지도 아래 숨겨 두는 방식과 같다). 입구는 **첫 마을 동쪽 가장자리의 표지 한 칸**(좌표는 작업 3에서 지도를 읽고 정한다). 서고는 북쪽 가운데, 건축 가능 구역은 가운데 **28×18**(서고 자리·길 제외). 지형은 기존 타일 글자만 쓴다. |
| D3 | 건물 비용·시간·환불 | 닢 + **이미 있는 재료**(올리브·파피루스·갈대). 길 한 칸 1닢, 정원 한 칸 3닢, 공동 마당(열린 4×4) 40닢+갈대 4, **입주 주택(작은 집) 150닢+올리브 4+파피루스 3**(첫 마을 집 넓히기 120/200/300닢을 기준으로 그보다 낮게), 손님집·집 겸 일터 등 후속 건물도 같은 틀(집 계열 150–200닢). **공사 기간 1일**: 주문한 다음 날 아침 공사 시작, 그다음 날 아침 완공(집 넓히기와 같은 "아침에 지어진다" 방식). 취소: **공사 시작 전 100%, 공사 중 50%**(닢·재료 각각 소수 버림), 완공 뒤 철거는 닢 50%·재료 환급 없음·안의 가구는 전부 가방으로. 서고는 철거할 수 없다. **중복 환불 방지**: 건물 기록에 `refund` 표식을 두고 기록 삭제와 환불을 한 번에(저장·재접속·이중 눌림에도 한 번). |
| D4 | 첫 자식 직업·첫 꿈터 주민 | 첫 자식 직업 **`cook`(요리사의 집 겸 일터)** — 기존 `AdultJob` 16종 중 요리 엔진(`cooking.ts`)이 이미 있다. 첫 꿈터 주민 **베 짜는 이웃(`weaver`)** — 기존 설정의 바람 "남의 주문과 별개로 자기 방에 놓을 깔개를 만들기"(`docs/characters/08`), 건물은 자산의 `weaver` 일터 양식. 둘 다 계획 18 작업 7·8(후속)에서 만든다. **이 계획의 첫 제작에는 코드가 없다.** |
| D5 | 방문자·입주 | 손님집에 **한 번에 1명**, 첫 버전 새 이웃 후보 **3명**(인물·선물 문구는 계획 18 작업 9에서 쓴다 — 이 계획에서 이름·사연을 짓지 않는다), 체류 3일, **재방문은 떠난 지 7일 뒤부터**, 방문 추첨은 저장(재접속 재추첨 없음). 입주는 플레이어 선택, 고유 선물은 **첫 입주 때 한 번**. 입주하지 않은 인물의 대체 경로: 재방문 3회째부터 도감에 인물의 기억만 남는다(물건 없음). 수집 때문에 주민을 내보내게 하지 않는다. |
| D6 | 왕래·시간 | 이동은 **명시적 입구에서만**(강제 이동 없음). 한 번 건너가는 데 **게임 시간 30분**이 흐른다. 출발은 06:00–21:30 사이(그 밖의 시각에는 "날이 저물었다" 한 줄, 불이익 없음), **돌아가기는 언제든**. 필사창·장면·약속 진행 중에는 입구 상호작용이 없다. 새 터에는 침대가 없다 — 23:00 넘어 억지로 잠들면 첫 마을 침대에서 깬다. 동물·아이·배우자는 따라가지 않고 첫 마을에 남는다(첫 버전). |
| D7 | 개방 조건·보상 | 신약 27권이 모두 서고에 꽂혀 있고 **스물일곱 권 잔치가 지난 뒤(`flags.allFeast === 2`)**. 보상은 `flags.newlandGift`로 **저장당 한 번**. 옛 저장에서 이미 `allFeast === 2`이면 불러온 뒤 첫 기회에 받는다. 방문을 미뤄도 잃지 않는다. |
| D8 | 첫 방문 | 입구 → 서고 문 → **아침빛**(약 2.5초, 탭하면 건너뜀, 기존 밝기 효과) → 본문 카드 **창세기 1:3**(개역한글·출처 표시, `Passage`로만) → 책상. 땅 전체는 **첫 구약 절을 기록하거나, 표지에서 "땅 둘러보기"를 고르면** 드러난다(둘 중 먼저, 비용 없음 — 건축이 필사에, 필사가 건축에 묶이지 않는다). |
| D9 | 구약 필사 규칙 | 신약과 **같은 필사 엔진**을 쓴다. 시간·피로는 신약과 같고 **막지 않는다**. **능력치 경험치·닢·재료·기름·키워드(하나님 기록) 보상 없음**, 퀴즈·제본·서고 등급 없음(첫 제작). 기록은 신약과 섞이지 않게 별도 `otCopyStats`. 책상은 **집 책상과 새 터 서고 책상 둘 다**에서 열 수 있다(집 책상의 구약 탭은 `newlandGift` 이후). |
| D10 | 구약 안내(가이드) | **이 첫 제작에서 안내문을 쓰지 않는다.** `chapterGuide(구약, 장)`은 항상 `null`이라 안내 상자가 보이지 않는다(기존 `CopyDesk`가 이미 그렇게 동작). 고신 기준 가이드는 "AI 초안"과 "검토 완료"를 데이터에서 구분하고, 검토자가 지정되기 전에는 공개하지 않는다(계획 18 §17). 교단명·신앙고백서명·참고 자료 목록을 화면에 보이지 않는다. 이 계획은 안내문 데이터 형식도 만들지 않는다(후속 B18-11 앞단계). |
| D11 | 구약 책 고르기 | 방 이름은 **책 범위**: "창세기–신명기", "여호수아–에스더", "욥기–아가", "이사야–말라기". "율법서·역사서·시가서·예언서" 같은 분류 이름은 쓰지 않는다(신약 §3-2와 같은 까닭). 39권 모두 처음부터 고를 수 있다. |
| D12 | 작은 책장 | 책상 1 + 작은 책장 1. 책장은 **필사를 끝낸 구약 책의 책등**만 보여 주는 전시(등급·제본·퀴즈 없음, 용량·효과 없음). |

### B. 계획 19 (주민의 자율 가족과 다음 세대)

| # | 항목 | 결정 |
|---|---|---|
| D13 | 기간(게임 날, 한 계절 = 40일) | 이웃 → 친한 사이 **14일**(같은 자리에서 함께 있은 날 7일 이상) · 친한 → 서로 호감 확인 **28일**(함께한 날 10일 이상) · 호감 확인 → 연인 **7일** · 연인 → 결혼 준비 **28일** · 결혼 준비 → 결혼 **7일**(초대는 7일 앞) · 결혼 → 아이를 기다림 **28일** · 기다림 → 출생 **28일**. 가족 하나의 두 전환 사이는 **최소 1일 공백**. 대표 가족은 관계 시작부터 출생까지 약 **140일**(세 계절 반). |
| D14 | 자녀·인구 | 가족당 자녀 **최대 2명**, 출산 간격 **56일 이상**. 마을의 **생성 주민(자율 가족의 아이·새 이웃) 최대 8명**(고정 주민 23명과 플레이어 가족은 세지 않는다). 정원이 차면 새 출생은 대기하고 실패·벌점으로 표시하지 않는다. |
| D15 | 성장 단계 | 아기 0–13일, 어린이 14–41일, 청소년 42–83일, 성인 84일부터 — 플레이어 아이(`child.ts`의 `TODDLER_AT 14`·`HELPER_AT 42`·`ADULT_AT 84`)와 같은 길이. 이 계획에서는 **출생까지**만 만든다(성장은 후속 B19-6). |
| D16 | 대표 가족 | **목수(`carpenter`) + 대장장이(`smith`)**. 근거: 둘 다 연애 후보(`CANDIDATE_IDS`) 아님, `people.json`에 서로 `with` 일과(망치질, 양쪽 다)가 이미 있어 실제 공동 일과가 있다. 조건(하나라도 어기면 시작하지 않는다): ① 두 사람 모두 `neighbors.json`·`people.json`·`docs/characters/05,13`에 기존 배우자 설정이 없다(없으면 "미혼 부모"로 다루고 **사별·이혼 서사를 만들지 않는다**) ② 플레이어의 연인·약혼자·배우자가 두 사람의 기존 자녀(루디·틸리)가 **아니다** ③ 둘 다 성인. 성별은 보지 않는다. 기존 자녀 루디·틸리는 각 부모의 자녀로 계보에 넣고, 두 부모가 결혼하면 서로 **의붓 형제로 자율 연애 제외**한다(플레이어 후보 규칙은 건드리지 않는다). 조건이 깨지면 대체 = 계획 18 작업 9로 입주한 새 이웃 둘, 그때까지 이 목표는 **"기반·정산·화면만 완료"**로 표시한다. |
| D17 | 자율 진행 설정 | 기본 **켜짐**, 게임 저장 안에 둔다(`gen.on` — 시뮬레이션에 영향을 주므로 브라우저 취향 값 localStorage에 두지 않는다). 설정에서 끄고 켠다. 끄면 **새 전환만 멈춘다**(이미 잡힌 초대·아이·기억은 그대로). 다시 켜면 `settledDay`를 오늘로 맞춰 **지나간 기간을 한꺼번에 처리하지 않는다**. "주요 변화 알림"(초대·출생)은 기본 켜짐. 속도·정원 세부 조절은 노출하지 않는다. |
| D18 | 하루 정산 | `goToSleep`의 아침 단계(`advanceVillage` 바로 뒤)에서 **하루에 한 번**. `gen.settledDay` 가드. 밀린 날이 있으면 순서대로 **최대 7일**까지만 처리하고 나머지는 버린다(가족당 정산 한 번에 큰 전환은 1회). 같은 날 잠자기·불러오기·맵 이동으로 중복 진행하지 않는다. |
| D19 | 난수 | 저장된 `gen.seed`(새 저장은 시작할 때, 옛 저장은 첫 정산 때 한 번 정해 저장) + `(종류, 인물 id들, 횟수)` 해시로 `mulberry32`를 만든다 — 변하는 난수 상태가 없어 재접속·저장 되돌리기에도 같은 결과. 뽑힌 결과(아이 외형·이름·날짜)는 **사건 기록에 저장**한다. |
| D20 | 이름·ID | 안정적 내부 id `g-0001`부터 순번(배열 번호로 식별하지 않음). 아이 이름은 `child.ts`의 `CHILD_NAMES`를 재사용하고 금지어 검사를 거친다. 같은 이름 중복 허용. |
| D21 | 결혼·거주 | 신혼 거주는 **집이 이미 있는 쪽(목수)의 집에서 함께 산다**(계획 19 §6의 "기존 주택 공동 거주" 경로). 대장장이는 낮에 대장간(기존 일과), 저녁·밤 일과가 목수 집(`Routine.req`로 `gen:wed:<가구 id>` 이후). 새 집 요청·독립 대기·주택 희망 목록은 후속(B19-9). 결혼식은 기존 광장 결혼식(`WEDDING_SPOT`, `assets/events` 결혼식 그림·동작)을 쓰고, 날짜는 `plans.availability`로 장날·잔치·플레이어 결혼식과 겹치지 않는 가장 가까운 날, 비·눈이면 사랑방 대체. 초대는 7일 앞에 달력에 들어가고 참석은 플레이어의 명시 행동이며, 불참은 실제 사실만 기록(참석 기억·보상 없음). |
| D22 | 아기 표시 | 출생 기록·소식·수첩 항목은 필수. 부모 집 안 요람의 아기 그림(`generation-art.ts` 아기 행 재사용)은 작업 13의 마지막 단계 — 연결이 한 세션에 안 끝나면 기록만 남기고 체크박스를 비워 둔다. |
| D23 | 소식·수첩 | 하루 소식은 묶어서 하나의 줄(많아야 3건), 필사 중에는 모달을 띄우지 않고 쌓아 둔다. 수첩에 가족 칸(배우자·부모·자녀·사는 집), 달력에 초대. |
| D25 | 결혼 전 상담 (사용자 요청 2026-10-06 20:27) | "결혼 준비" 전환은 **플레이어와의 상담을 거쳐야** 일어난다. 연인 단계가 끝날 무렵 대표 주민 한 사람이 플레이어에게 여러 갈래의 고민 질문을 꺼낸다(예: "○○랑 같이 살면 어떨 것 같아?", "요즘 ○○ 어때 보여?", "내가 너무 서두르는 걸까?") — 겉으로는 허락을 구하는 느낌이 아니라 친구에게 털어놓는 상담. 질문은 여러 개 중 두세 개를 며칠에 걸쳐 묻고, 플레이어 답이 대체로 응원 쪽이면 결혼 준비로 넘어간다. 말리는 쪽이면 "조금 더 지켜보겠다"로 기간이 늘고 나중에 다시 묻는다(실패·관계 끝 없음). 플레이어가 상담에 답하지 않으면 진행하지 않는다(정산이 저절로 결혼시키지 않음). 문구는 `life-text.json` `gen` 절, 🔎. |
| D26 | 출생 전 아기 침대 부탁 (같은 요청) | "아이를 기다림" 전환 대신, 결혼 뒤 기간이 차면 부부 중 한 사람이 "아이를 갖고 싶은데 아기 침대가 없다"며 플레이어에게 **아기 침대를 만들어 줄 수 있는지** 부탁한다. 플레이어가 기존 가구 만들기 흐름으로 아기 침대(기존 요람 가구 재사용, 없으면 자산의 요람)를 만들어 건네면 그때부터 기다림 기간이 시작되고 출생한다. 건네지 않으면 출생하지 않는다(재촉·불이익 없음, 며칠 뒤 한 번 다시 말할 뿐). 둘째 아이도 같은 방식(침대가 이미 있으면 다른 아이 물건 부탁 대신 그냥 같은 침대 재사용 여부는 구현 시 결정해 기록). |
| D27 | 마을 가계도 (같은 날 요청) | 수첩에 **마을 가계도** 화면: 고정 주민의 기존 가족(`neighbors.json` `family`)과 자율 가족(결혼·자녀)을 한 그림으로. 작업 14의 수첩 가족 칸을 넓혀 만든다. 휴대폰에서는 가족 묶음별로 넘겨 보기. |
| D24 | 구약 필사 통로 (작업 1 조사, 2026-10-06) | 필사 호출을 넘겨 주는 `game-store.ts`(`commitVerse`·`copyBook`·`copySave` 계열)와 `Hud.tsx`(`copyNow`)는 작업 5에서 `book` 타입만 `CopyBook`으로 넓힌다(동작·보상 추가 없음). `daybook.ts`(`logChapter`)는 넓히지 않고 구약 가지가 호출을 건너뛴다. 근거 표: `docs/old-testament-scope.md` 갈래 3. 금지어: 구약 인물·지명을 `forbidden.ts`에 더하되 신약 길잡이(`verify-chapter-guides.mjs`의 `GUIDE_ALLOWED`)에는 허용 — 신약 설명이 구약 인물을 부르는 것은 기존 문구라 고치지 않는다. |

---

## 지금 코드에 이미 있는 것 (조사 결과 2026-10-06 — 다시 만들지 않는다)

| 필요한 것 | 이미 있는 것 (파일) | 이번에 할 일 |
|---|---|---|
| 신약 책 구조 | `types.ts` `Book`(신약 27권)·`BOOKS`·`GOSPELS`·`LETTERS`, `shelf-rooms.ts` 방 표(`SUBSET_BOOKS`로 `build-bible-subset.mjs`가 읽음), `books.ts` `Progress = Record<Book, …>`, `library.ts` `allShelved`·`allFeastReady`, `BOOKS`를 쓰는 곳 34파일 128곳 | **`Book`·`BOOKS`는 건드리지 않는다.** 구약은 별도 `OtBook`·`OT_BOOKS`, 필사 엔진만 `CopyBook = Book \| OtBook`으로 넓힌다. 그래서 `allShelved`·서고 퀴즈·하나님 기록·제본이 신약 전용으로 남는다 |
| 본문 | `catalog.ts`가 `bible-subset.json`(신약만)을 읽고 `versesOf`·`chapterText`·`copySourceFor`·`BOOK_ABBR`·`quizSourceFor`를 제공 | 구약은 `src/content/ot/<id>.json`(책별 파일, 필요할 때 불러옴)과 `ot-catalog.ts` — 기존 신약 경로는 그대로 |
| 필사 엔진 | `copying.ts`(`CopyState`·`copySpot`·`sanitizeCopy`가 `isBook`=`BOOKS` 검사), `game.ts` `startCopy`·`saveCopyDraft`·`writeVerse`(장 완료 때 피로 6·능력치 경험치·하나님 기록·판 동기화), `CopyDesk.tsx`(`chapterGuide`가 없으면 안내 상자 `null`) | 키 타입을 `CopyBook`으로 넓히고 구약 가지에서는 경험치·키워드·판·'bookBound' 장면을 건너뛴다 |
| 지도 | `world.ts`: `WIDTH 48`, `HEIGHT 120`(마을 `VILLAGE_H 40`줄 + 보이지 않는 실내 방들), **전역 단일 지도 `MAP`**, `tileAt`/`isWalkable`을 10파일 57곳이 부른다, 집 단계·열린 서고 문은 전역 setter(`setHomeLevel`·`setOpenDoors`)로 맞춘다 | 같은 방식으로 `setActiveMap`(전역 setter)을 더하고 마을 칸 내용은 한 글자도 바꾸지 않는다(스냅샷 테스트) |
| 저장 | `save.ts` `SAVE_VERSION 1`·`sanitize`, 새 상태는 모두 선택 필드(`stall?`·`village?`·`cooking?`) | 새 상태 `map?`·`mapAt?`·`newland?`·`otProgress?`·`otCopyStats?`·`gen?`도 선택 필드 + `sanitize` 기본값 |
| 시간 | `clock.ts` `advance(c, seconds)`·`LATE 23:00`·`MINUTE_CAP 26h`·`SEASON_DAYS 40`, 데이트 산책이 분을 쓰는 방식(`game.ts` `DATE_MINUTES`) | 이동 30분은 같은 방식으로 |
| 건물·가구 | `room.ts` `placement`·`removal`·`refitRoom`(**집 전역 `isHome`·`keepClear`·`HOME_ENTRY`에 묶여 있음**), `furniture-defs.ts`, `spaces.ts`(집 공간별 쓰임), `village-sites.ts`+`projects.ts`(마을 공동 시설 — 지도를 바꾸지 않는 그림), `home-space-art.ts` 등 | 실내는 `RoomCtx`를 더해 일반화(작업 7) |
| 자산 | `src/render/old-village-art.ts`: `OLD_PROPS`(24)·`OLD_TERRAIN`(10, 왕래 표식 포함)·`OLD_BUILDINGS`(25종×4방향)·`OLD_CONSTRUCTION`(공통 공사 골격)·`OLD_INTERIORS`·`BUILDING_LABELS`(`archive` 작은 구약 서고·`home` 입주 주택·`guest` 손님집·`family`·`gallery`·`courtyard`·`garden`·직업 16종), `generation-art.ts`(성장·가족 동작), `manifest.json`에 anchor/entry/footprint(제안 4×3, 그림 4×4) | 연결만 한다. 새로 그리기 전에 먼저 찾는다 |
| 주민·관계 | `neighbors.json`(23명, `family` 필드), `romance.ts` `CANDIDATE_IDS`(13명)·`Romance`(플레이어 한 명), `people.ts` `Routine{with,req,away}`·`Life.experiences`, `plans.ts` 약속 엔진(`scheduleAppt`·`availability`·`attendAppt`·`settleAppt`·`advancePlans`), `fest.ts`·`clubs.ts`, `events.ts` 달력, `news.ts` 하루 소식 2–3건, `notebook.ts` | 세대 상태는 새 `gen.ts` — 위 엔진을 부르기만 하고 같은 역할의 시스템을 따로 만들지 않는다 |
| 아이 | `child.ts` 단계(`TODDLER_AT 14`·`HELPER_AT 42`·`ADULT_AT 84`)·`AdultJob` 16종·`CHILD_NAMES`·`newChild`·`CRADLE_SPOT` | 이름·단계 길이를 재사용(작업 13), 성장 구현은 후속 |
| 본문 표시 | `features/passage/Passage.tsx` `Passage({refText})` | 구약 구절은 먼저 `ensureOtBook`으로 불러온 뒤 같은 컴포넌트로 |

**주의:** `src/engine/travel.ts`(여행 판)가 이미 있다 — 새 이동 코드는 `newland-travel`·`maps`라는 이름으로 겹치지 않게 한다. 계획 18·19 문서의 "HEIGHT 80" 같은 옛 숫자는 지금 코드와 다르다(HEIGHT 120).

## Global Constraints

- **그림은 `assets/`·`src/render/old-village-art.ts`·`generation-art.ts`의 도트를 쓴다.** 새로 그리기 전에 먼저 찾고, 연결 방법은 `assets/old-testament-generations/도트_목록과_연결안내.txt`를 따른다(16px 정수 도트, nearest-neighbor, 뒤 소품→인물→앞 소품, 건물 footprint·entry는 `manifest.json`에서 읽되 **엔진의 출입·충돌 좌표를 따로 확정**하고 테스트로 길을 확인한다, 공사 그림의 입구를 완성 입구로 쓰지 않는다). 자산이 있다는 것과 게임에 연결됐다는 것을 구분한다. 자산이 없을 때만 새로 그리고 보고서에 적는다.
- **콘텐츠 기준(exclusion-list):** 작업 1이 `docs/exclusion-list.md`에 **§7 구약**을 더한다(아래 작업 1). 성경 본문은 `Passage`·본문 창에만 있고 생활 문구·장면·메모에 성경 문장을 쓰지 않는다. 구약 사건·인물을 주민 이야기로 재연하지 않는다. 구약 해설·신약 연결 문장은 **검토 완료 표시가 있는 데이터가 생기기 전에는 쓰지 않는다**(D10). 신약과 구약의 하나님을 대비하는 문장 금지. 출산·결혼·풍요를 하나님의 보상이나 필사 성과로 말하지 않는다. 말씀 책·본문 판매 금지 유지.
- **필사는 절대 막지 않는다 (신약·구약 모두).** 돈·기름·재료·피로·시간·건물·새 터 방문·약속·세대 이벤트가 책상·필사창 열기와 쓰기를 막지 않는다. 필사 중에는 소식·초대 모달을 띄우지 않고 쌓아 두었다가 필사창을 닫은 뒤 보인다(테스트). 건축과 필사를 서로의 조건으로 묶지 않는다.
- **말씀은 보상이 아니다.** 구약 장 완료로 닢·재료·기름·능력치 경험치·키워드가 늘지 않는다(D9). 주민의 결혼·출산·성장이 필사 진도·키워드 수·서고 책 수에 따라 달라지지 않는다.
- **옛 저장:** 저장 키·`SAVE_VERSION 1` 유지. 새 상태는 모두 선택 필드로 두고 `sanitize`에서 안전한 기본값, 이미 본 사건·가족·가구·필사·서고·하나님 기록을 초기화하지 않는다. 날짜를 모르는 옛 기억은 **날짜 미상(null)** — 지어내지 않는다. 옛 저장에서 불러올 때 지나간 기간의 결혼·출산을 몰아 처리하지 않는다. 추첨·방문·선물은 저장해서 재접속으로 다시 뽑지 않는다.
- **같은 NPC가 두 곳에 있지 않다:** 새 터에 있는 동안 첫 마을 NPC는 움직이지도 보이지도 않고(동결), 돌아오면 `placeAllNpcs`로 한 번 다시 놓는다. 이동·방문·약속·출퇴근은 하나의 위치 상태로 본다.
- **휴대폰:** 375×812에서 모달·설정은 단계별, 한 화면에 몰아넣지 않는다(화면 작업은 미리보기 스크린샷). 안내 줄·막힌 단추 이유 설명을 대화칸에 넣지 않는다.
- **opus 검토 표시 🔎:** 장면·대사·소식·선택지·안내 문구를 쓰는 작업은 커밋 전에 opus가 exclusion-list(§7 포함) 기준으로 한 줄씩 본다. 결과는 `docs/content-audit.md`의 "계획 20" 절에 뺀 것·고친 것만 짧게.
- **화면에 보이는 말은 `src/content/life-text.json`의 새 절**(`newland`·`travel`·`build`·`gen`·`ot`)에, 내부 ID를 화면에 보이지 않는다, 사용자에게 보이는 글자는 한글(교단명·"AI 초안" 같은 말도 화면에 없음).
- **커밋 전 네 가지:** `npm run verify; npx tsc -b; npx vitest run; npm run build` 모두 통과(실패하면 커밋하지 않고 원인을 보고). 커밋 끝줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 다른 작업자가 동시에 고치므로 **자기 작업 파일만 `git add <경로>`**(`git add -A` 금지).
- **배포:** 마일스톤 ①(작업 8 끝)·②(작업 15 끝)에서 기존 승인 범위대로(27maeul.vercel.app, 사용자가 PC에서 `npx.cmd --yes vercel --prod`로 하던 방식 — 승인이 없으면 "배포 준비됨"만 알린다).
- **순서 주의:** 1부(작업 1–8)와 2부(작업 9–15)는 둘 다 `game.ts`·`save.ts`를 고친다. **한 번에 한 쪽만** 진행한다. 작업 9(조사표)는 코드가 없으므로 언제든 병행해도 된다.

---

# 1부 — 받은 땅과 작은 서고를 실제로 오가는 경험 (계획 18 작업 1–5 + 건축 기초)

## 작업 1: 성경 범위 구조와 구약 책 표, 제외 목록 구약 절
**파일:** 새 `src/engine/ot-books.ts`, 새 `src/engine/ot-books.test.ts`, `docs/exclusion-list.md`, `src/content/forbidden.ts`, `src/content/forbidden.test.ts`, 새 `docs/old-testament-scope.md`(조사 결과 한 장)
- [x] 조사: `Book`·`BOOKS`를 쓰는 34파일(128곳)을 "신약 전용으로 남김 / 필사 엔진에서 넓힘 / 해당 없음" 세 갈래 표로 `docs/old-testament-scope.md`에 적는다. 넓히는 곳은 `copying.ts`·`books.ts`(진행 읽기)·`game.ts` 필사 세 함수·`save.ts`·`catalog.ts`·`CopyDesk.tsx`뿐이어야 한다. 그 밖(`library.ts`·`quiz.ts`·`binding.ts`·`god-records.ts`·`achievements.ts`…)이 필요해 보이면 이유를 적고 멈춘다.
- [x] `ot-books.ts`(**런타임 import 없음, 타입만** — 노드 스크립트가 읽는다): `OT_BOOK_TABLE: {id, name, abbr, chapters}[]`(D1의 39권, 순서·한글 이름·개역한글 약칭: 창 출 레 민 신 수 삿 룻 삼상 삼하 왕상 왕하 대상 대하 스 느 에 욥 시 잠 전 아 사 렘 애 겔 단 호 욜 암 옵 욘 미 나 합 습 학 슥 말, 장 수 50·40·27·36·34·24·21·4·31·24·22·25·29·36·10·13·10·42·150·31·12·8·66·52·5·48·12·14·3·9·1·4·7·3·3·3·2·14·4), `OT_BOOKS`, `type OtBook`, `type CopyBook = Book | OtBook`, `isOtBook`, `testamentOf(b)`, `OT_ROOMS`(D11의 네 범위 방: `{id, label 범위, books}`), `otRoomOf`.
- [x] 테스트: 39권·id 중복 없음·신약 `BOOKS`·신약 본문 id(`books.json`)와 겹치지 않음·약칭이 66권 안에서 유일(`books.json` 약칭 포함)·장 합계 929·방 네 개가 39권을 빠짐없이 한 번씩 덮음·순서가 표준. **신약 회귀:** 기존 `BOOKS.length === 27`·`shelf-rooms.test`·`allShelved`·`library.test` 그대로 통과.
- [x] `docs/exclusion-list.md`에 **§7 구약**: 7-1 본문은 `Passage`에서만, 개역한글, 줄이거나 바꾸지 않음. 7-2 구약 사건·인물을 이웃 이야기로 재현하지 않음, 새 터도 이름 없는 땅(실제 지명 금지). 7-3 구약 필사는 어떤 보상도 아님(D9), 퀴즈·등급 없음. 7-4 해설·신약 연결은 검토 완료 표시가 있는 데이터만(없으면 안내 상자가 안 보임), 교단명·참고 목록 비노출. 7-5 구약/신약 대비·"구약의 하나님은…" 금지, 어려운 본문을 한 키워드로 요약하지 않음. 7-6 구약 방 이름은 책 범위만. 7-7 §3-3(말씀 판매 금지)·§3-1(정경 형성 서술 금지) 구약에도 적용. 7-8 §6 체크리스트에 한 줄씩 추가.
- [x] `forbidden.ts`에 구약 인물·지명 말 추가: `/아브라함/ /모세/ /다윗/ /솔로몬/ /야곱/ /이스라엘/ /가나안/ /애굽/ /바벨론/ /여호와/ /엘리야/`(낱말 일부 오탐 위험이 큰 `이삭`·`아담`·`노아` 등은 넣지 않는다 — "이삭"은 곡식, "아담하다"는 형용사). `forbidden.test`·`npm run verify`로 기존 문구와 부딪히면 **기존 문구를 고치지 않고** 어떤 문구가 어디서 걸렸는지 보고한다(성경 본문 파일은 검사 대상이 아님).
- 커밋: `feat: 구약 책 표와 성경 범위 구조 — 신약 전용 판정은 그대로, 제외 목록 구약 절`

## 작업 2: 구약 본문 데이터 만들기·검증
**파일:** 새 `scripts/build-ot.mjs`, 새 `scripts/verify-ot.mjs`, 새 `scripts/verify-ot.test.ts`, `package.json`(`build:ot`, `verify`에 `node scripts/verify-ot.mjs` 추가), 새 `src/content/ot/<id>.json` 39개, 새 `src/content/ot-catalog.ts`·`ot-catalog.test.ts`, `src/content/catalog.ts`, 새 `docs/old-testament-data.md`
- [x] `build-ot.mjs`: `OT_BOOK_TABLE`(작업 1)을 읽고 `KRV_DIR`(환경 변수, 기본 `../jaramlog-v2/public/bible/krv`)의 `<순번 1..39>/<장>.json`을 읽어 **책별 `string[][]`**(장 → 절 배열, 신약 `bible-subset.json`과 같은 모양)로 `src/content/ot/<id>.json`에 쓴다. 절 번호가 1부터 빠짐없이 이어지지 않거나 장 수가 표와 다르면 **쓰지 않고 실패**. 글자는 한 글자도 고치지 않는다.
- [x] `verify-ot.mjs`(`npm run verify` 체인에 추가): 39파일 존재, 장 수가 표와 같음, 한 절도 비어 있지 않음(신약의 `noText` 규칙 — `(없음)`·`(N절에 포함…)` 절은 허용하되 목록으로 보고), 가장 긴 절이 `DRAFT_MAX 600` 아래(`copying.ts`), 이상한 제어 문자·태그 없음, **`KRV_DIR`가 있으면 원본과 글자까지 같음**(없으면 이 비교만 건너뛰고 "원본 비교 생략"을 출력), 창 1:3이 원본 파일의 같은 절과 같음. 실제 절 수·바이트·gzip 크기를 `docs/old-testament-data.md`에 **측정값으로** 적는다(기억으로 쓰지 않는다).
- [x] 역방향 픽스처(`verify-ot.test.ts`): 장 하나를 지운 데이터·절 번호가 건너뛴 데이터·글자를 바꾼 데이터가 각각 실제로 걸리는지.
- [x] `ot-catalog.ts`: `import.meta.glob('./ot/*.json')`로 책별 **지연 불러오기** — `ensureOtBook(id): Promise<void>`, `otLoaded(id)`, `otChapterText`, `OT_ABBR`·`OT_NAME`. 안 불러온 책을 `versesOf`로 읽으면 **구별되는 오류**(`not loaded: gen`). 테스트에서는 `await ensureOtBook`.
- [x] `catalog.ts`: `versesOf`·`chapterText`·`copySourceFor`·`bookOfRef`가 구약 약칭(`창 1:3`)도 알아듣게 위임(`testamentOf`). **신약 경로의 결과는 그대로**(기존 `catalog` 관련 테스트 통과). `quizSourceFor`·`pieces`·`BOOKS_WITH_CONTENT`는 구약을 넣지 않는다.
- [x] 테스트: 창세기 31절(1장)·시편 150장·구약 약칭 `versesOf('창 1:3')`가 한 절·불러오기 전 읽기 오류·신약 `versesOf` 결과가 변경 전과 같음, **메인 번들에 구약 본문이 들어가지 않음**(`npm run build` 산출물에서 구약 청크가 별도, 메인 청크 증가 5KB 이하 — 측정값을 문서에 기록).
- 커밋: `feat: 구약 본문 — 개역한글 39권 929장 책별 파일, 만들기·검증 스크립트, 지연 불러오기`

## 작업 3: 두 맵 왕래와 저장
**파일:** 새 `src/engine/maps.ts`, 새 `src/engine/newland.ts`, 새 `src/engine/newland-config.ts`, `src/engine/world.ts`, `src/engine/game.ts`, `src/engine/save.ts`, `src/engine/movement.ts`, `src/render/renderer.ts`, `src/render/decor.ts`, `src/features/play/ModalLayer.tsx`(또는 지도 입구 모달), `src/content/life-text.json`(`travel` 절), 새 `src/engine/maps.test.ts`·`src/engine/newland-travel.test.ts`·`src/engine/save.test.ts`(추가), 마을 타일 스냅샷 테스트
- [x] **먼저(리팩터 전):** 지금 코드로 마을의 모든 칸 `tileAt(x, y)`(0 ≤ x < 48, 0 ≤ y < 120)와 `isWalkable`·`isIndoor`·`zoneAt`·`treeKind`의 결과를 스냅샷 테스트로 고정하고 통과시킨다. 이 테스트는 이후 한 줄도 바뀌지 않아야 한다. 집 단계 0–3·열린 서고 문 조합도 포함.
- [x] 조사: `WIDTH`·`HEIGHT`·`VILLAGE_H`·`MAP`·`tileAt`·`isWalkable`·`isHome`·`ROOMS`를 쓰는 곳을 목록으로(10파일 57곳 + 렌더러) — 지도 크기를 상수로 읽는 곳은 `mapWidth()`/`mapHeight()`/`mapVisibleHeight()`로 바꾼다. 마을에서의 값은 같다.
- [x] `maps.ts`: `type MapId = 'village' | 'newland'`, 전역 `setActiveMap/currentMapId`(집 단계·열린 문과 같은 방식 — `game.ts` `syncHome`에서 상태와 맞춘다), 지도 크기 함수. `world.ts`의 `tileAt`/`isWalkable`/`isIndoor`는 새 터일 때 `newland.ts`의 칸 함수로 위임, 마을일 때는 기존 그대로.
- [x] `newland.ts`/`newland-config.ts`(D2): 40×40 지도 문자열(코드로 짓는다 — 폭이 어긋나는 실수를 막는 첫 마을 방식), 가장자리 숲(기존 `T`), 서고 바깥(돌벽 `S`·문 `D`, 북쪽 가운데, **칸 구성은 `manifest.json`의 서고 `archive` footprint·entry를 읽어 엔진 좌표를 따로 정함**), 서고 안 방(아래 10줄, 책상 칸·책장 칸·문깔개 `E`), 건축 가능 구역 `BUILD_RECT`, 새 터 쪽 입구 칸과 첫 마을 쪽 입구 칸(둘 다 걸을 수 있고 서로 겹치지 않음), 개방 전에는 입구가 첫 마을에서 **보이지도 걸을 수도 없음**(`homeLevel`의 `HOME_OVERLAY`처럼 덮어쓰기 + `setNewlandOpen`).
- [x] 입구 위치(첫 마을): `MAP`을 읽어 동쪽 테두리(x=47) 근처 y 14–18에서 걸을 수 있는 칸을 후보 세 곳 이상 표로 적고 하나를 고른 이유 한 줄. 조건: `ZONES`·`lockedTiles`·`SITES`·집 문·`PLACES`와 겹치지 않고, 침대에서 길찾기로 닿는다(테스트). 그림은 `OLD_TERRAIN`의 왕래 표식·`OLD_PROPS.archiveSign`(자산 먼저).
- [x] `GameState.map?: MapId`·`mapAt?: Partial<Record<MapId, Tile>>`(선택 필드). `canTravel(s, to)`: 개방됨(`flags.newlandGift`), 필사창·장면·약속 진행 중 아님, 마을→새 터는 06:00–21:30(D6) — 막히면 이유 한 가지만. `travel(s, to)`: `advance`로 **30분**(같은 날 안에서, 데이트 산책이 분을 쓰는 방식 재사용), 맵 전환, 플레이어를 그 맵의 입구 칸 앞으로, `path`·`target`·`act`·`idle` 초기화, 마을을 떠날 때 `mapAt.village` 기억. 가까운 약속 진행에 영향 없음(약속은 마을 장소·참석 여부는 기존 규칙).
- [x] NPC·동물·아이: 새 터에 있는 동안 NPC 이동 갱신·말 걸기·이벤트 시작·수첩 목격(`noteSeen`)을 모두 건너뛴다(`game.ts`의 `tick`·`placeAllNpcs` 호출 지점을 조사해 `map === 'village'` 가드). 동물·아이·배우자는 마을에 남는다(D6). 돌아오면 한 번 `placeAllNpcs`.
- [x] 잠: 새 터에서 `goToSleep`이 불리면(23:00 넘김 등) 침대 위치·`map: 'village'`로 맞춘다(`setActiveMap('village')` 포함).
- [x] 저장: `sanitize`에서 `map`이 열리지 않은 새 터거나 모르는 값이면 마을로, `mapAt`의 칸이 그 맵에서 걸을 수 없거나 범위 밖이면 그 맵의 입구 칸으로(**삭제된 건물·잘못된 좌표에서 시작하지 않는다**). `serialize`/`deserialize` 왕복에서 위치·맵 유지.
- [x] 화면: 입구 표지를 누르면 모달 "새 터로 가기 · 30분" / 새 터의 입구에서 "첫 마을로 돌아가기 · 30분"(`life-text.json` `travel` 절, 시간 설명 한 줄 외 안내 없음). 렌더러가 새 터 칸을 기존 타일 팔레트·계절·밝기로 그린다. 휴대폰 375×812에서 모달 확인(스크린샷). (휴대폰 스크린샷은 작업 8 컨트롤러 확인 몫)
- [x] 테스트: ① 마을 스냅샷 불변 ② 개방 전 입구 없음·후엔 길찾기로 닿음 ③ 왕복 때 날짜·시간(+30분씩)·소지품·돈·관계·필사 진행·가구가 그대로, 같은 날 두 번 왔다 갔다 해도 날짜가 중복되지 않음 ④ 새 터에서 저장→불러오기→새 터 입구/서고 앞 유효 칸 ⑤ 옛 저장(`map` 없음)은 마을 ⑥ 새 터에서 NPC가 움직이지 않고 보이지 않음, 돌아오면 같은 시각의 자리에 한 번 놓임(같은 NPC 중복 없음) ⑦ 21:31 출발 거절·돌아가기는 허용·23:50 돌아가기가 자정을 안전하게 넘김 ⑧ 새 터에서 잠들면 첫 마을 침대 ⑨ 필사창이 열려 있을 때 입구 상호작용 없음.
- 커밋: `feat: 두 번째 마을 새 터 — 입구 왕래(30분), 맵별 위치 저장, 첫 마을 진행 보존`

## 작업 4: 완필 보상과 첫 방문
**파일:** `src/engine/newland.ts`, `src/engine/game.ts`(`goToSleep` 아침 단계 + 불러온 뒤 첫 기회), `src/engine/save.ts`, `src/content/life-text.json`(`newland` 절), `src/engine/text.ts`(장면 `newlandGift`), 새 `src/features/newland/FirstLight.tsx`, `src/render/renderer.ts`(밝기 덮어쓰기), 새 `src/engine/newland-gift.test.ts`
- [x] `newlandStatus(s)`: `'locked' | 'gift' | 'open'`. `gift` = 개방 조건(D7: 27권 모두 꽂힘 + `flags.allFeast === 2`)이 맞고 아직 `flags.newlandGift`가 없음. `grantNewland(s)`는 `flags.newlandGift = 1` 한 번 + 장면 `newlandGift` 한 번. `goToSleep`의 `allFeast` 블록 바로 뒤와 불러온 뒤 첫 기회(`settle` 경로를 읽고 한 곳)에서 같은 함수를 부른다(**중복 방지는 플래그 하나**).
- [x] 보상 장면(기록자·주민의 해석 대사 없음, 성경 문장 없음, 3줄 이내, 🔎): "받은 것은 땅과 작은 서고 하나. 가고 싶을 때 가면 된다" 뜻의 담담한 문구. 필수 비용·기한 없음. 방문을 미뤄도 입구는 계속 열려 있다.
- [x] 첫 방문 흐름(D8): 새 터에 처음 들어가면(`flags.newlandVisited`) 서고와 빈 땅 주변만 보이게 한다 — 드러나기 전에는 바깥 칸을 `T`로 돌려주는 `newlandBounds(revealed)`. 서고 문 `D`를 밟는 첫 순간 `FirstLight`: 어두운 안이 아침빛으로 밝아지는 연출(렌더러 밝기 덮어쓰기, 약 2.5초, **탭·Esc로 건너뛰기**), 이어 `ensureOtBook('gen')` 뒤 `Passage`로 **창 1:3**과 "개역한글 · 창세기 1:3" 출처, 단추 둘 "첫 장을 써 본다"(책상 열기)·"나중에". 이 본문을 `life-text.json`에 옮겨 적지 않는다.
- [x] 땅 드러내기: 첫 구약 절 기록(작업 5의 `writeVerse` 구약 가지가 `flags.newlandRevealed = 1`) **또는** 입구 표지·서고 문 앞의 "땅 둘러보기" 선택 중 먼저. 건너뛰기는 연출만 건너뛰고 드러나는 조건은 같다.
- [x] 테스트: 27권 + `allFeast 1` → 보상 없음, `allFeast 2` → 한 번, 저장·재접속·두 번째 잠에도 한 번, 옛 완필 저장(`allFeast 2`) 불러오면 받음, 미완필 저장은 받지 않음, 입구가 보상 전에 없음·후에 있음, 건너뛰기 뒤에도 서고 사용 가능, 땅 드러남 두 경로, **`newland` 절의 모든 문장이 `ot/gen.json`의 어느 절과도 8글자 이상 겹치지 않음**, 금지어 통과.
- 커밋: `feat: 신약 완필 보상 — 새 터와 작은 서고, 첫 방문 아침빛과 창 1:3`

## 작업 5: 작은 구약 서고와 필사 (기존 필사 엔진 재사용)
**파일:** `src/engine/copying.ts`, `src/engine/books.ts`, `src/engine/game.ts`(`startCopy`·`saveCopyDraft`·`writeVerse`), `src/engine/save.ts`, `src/content/catalog.ts`, `src/features/desk/CopyDesk.tsx`, 새 `src/features/newland/OtShelf.tsx`, `src/engine/newland.ts`(서고 실내 책상·책장 칸), `src/render/renderer.ts`(서고 안 그림), 새 `src/engine/ot-copying.test.ts`, `src/features/desk/CopyDesk.test.tsx`(추가)
- [x] 키 타입 넓히기: `CopyState`의 `book`·`at`·`legacy`·`days`·`copied`와 `copySpot`·`isCopiedChapter`·`sanitizeCopy`의 `isBook`을 `CopyBook`으로. 진행은 한 입구 `progressOf(s, book)`: 신약은 `s.progress[book]`, 구약은 새 선택 필드 `s.otProgress?.[book]`(없으면 빈 진행). `emptyProgress()`·신약 `Progress`는 그대로(신약 27키 불변). `legacy`는 구약에 없다(옛 저장 호환 없음, 빈 값).
- [x] `writeVerse(s, book: CopyBook, …)`: 구약 가지 — **본문 비교·붙여넣기 거절·초안 저장·장 완료 처리는 신약과 같은 코드**, 장 완료 때 `otProgress` 갱신, `needs.work`·시간은 신약과 같음, **경험치·하나님 기록(`chapterFinds`)·판 동기화·`bookBound`·`firstChapter` 장면은 건너뜀**(D9), 기록은 `otCopyStats`(신약 `copyStats`는 건드리지 않음), 첫 구약 절이면 `flags.newlandRevealed = 1`. 책을 다 마치면 `otProgress`로 판정(책장 전시용)만. `chaptersOf`·`copyVerses`는 불러온 구약 본문을 읽고 안 불러왔으면 빈 목록(→ `CopyDesk`가 먼저 `ensureOtBook`).
- [x] `CopyDesk`: 신약/구약 두 칸(구약은 `flags.newlandGift` 뒤에만, 집 책상과 새 터 책상 모두), 구약 책 고르기는 D11의 네 범위 방 → 책(진행한 장 수 표시), 불러오는 동안 "책을 펼치는 중" 한 줄, **안내 상자는 `chapterGuide`가 `null`이라 나오지 않는다**(테스트로 고정). 신약 화면·동작은 변경 없음.
- [x] 새 터 서고 안: 책상 1(`CopyDesk` 열기, `PLACES`처럼 서는 칸·열림 칸을 기존 방식으로), 작은 책장 1(`OtShelf`: 필사를 끝낸 구약 책의 책등만, 등급·제본·퀴즈 없음, 아무 효과 없음). 그림은 `OLD_PROPS`(`scrollCabinet`·`recordStand`·`archiveSign` 등 자산 먼저). 서고 입구에서 책상까지 길 검사.
- [x] 테스트: ① **신약 필사 회귀**: 기존 `copying.test`·`game` 필사 테스트가 수정 없이 통과 ② 구약 한 절 쓰기→다음 절, 틀린 입력·붙여넣기 거절, 초안 저장·복구, 장 완료→`otProgress` 반영·책 완료 표시 ③ **보상 없음**: 구약 장 완료 전후로 `coins`·`inv`·`chest`·`stats`·`godRecords`·`scenes`·`copyStats`(신약)가 변하지 않음, 피로·시간만 신약과 같은 크기 ④ **막힘 없음**: 닢 0·기름 0·재료 0·피로 최대·건물 0채에서도 쓸 수 있음, 새 터에 한 번도 가지 않아도 집 책상에서 쓸 수 있음 ⑤ 구약 개방 전(`newlandGift` 없음)은 구약 탭 없음 ⑥ 저장·불러오기·옛 저장(`otProgress` 없음) ⑦ 모든 구약 책의 장 수가 불러온 데이터와 같음(`ensureOtBook` 전수, 시편 119편 같은 긴 장 포함) ⑧ `chapterGuide(구약, n)`이 전부 `null` ⑨ 책상 앞 한글 입력·휴대폰 입력칸 기존 `CopyDesk.test`·모바일 동작과 같음.
- 커밋: `feat: 작은 구약 서고와 구약 필사 — 신약과 같은 엔진, 보상·막힘 없음, 책등 전시`

## 작업 6: 부지 배치와 건축 (바깥)
**파일:** 새 `src/engine/newland-build.ts`, 새 `src/engine/newland-sites.ts`(건물 종류 표), `src/engine/newland.ts`, `src/engine/game.ts`(`goToSleep` 아침 단계에 `advanceBuilds` 한 줄), `src/engine/save.ts`, `src/render/renderer.ts`(건물·공사·길·정원 그리기), 새 `src/features/newland/BuildMenu.tsx`·`SitePreview.tsx`, `src/content/life-text.json`(`build` 절), 새 `src/engine/newland-build.test.ts`
- [x] 건물 종류 표(`newland-sites.ts`) — 첫 제작은 **길·정원 칸·공동 마당·입주 주택** 네 가지: 이름(`BUILDING_LABELS`), 크기(주택 footprint 4×3·그림 4×4, 마당 열린 4×4, 정원·길 1×1/3×3), 방향별 `entry`·문 위치(**`manifest.json`에서 옮긴 값이며 `newland-sites.test`가 manifest와 같은지 비교**해 어긋남을 막는다), 비용(D3), 쓰임 한 줄. 그림: `OLD_BUILDINGS[id][방향]`·`OLD_CONSTRUCTION`(공사 중)·`OLD_TERRAIN`(길·정원 칸) — 공사 그림의 입구는 상호작용 입구로 쓰지 않는다.
- [x] 상태: `GameState.newland?: { revealed: boolean; builds: Build[]; tiles: Record<string, 'path'|'garden'>; nextId: number }`, `Build { id: 'b1'…, kind, x, y, facing, state: 'ordered'|'building'|'done', orderedDay, paid: {coins, items}, refunded: boolean }`.
- [x] 놓기 검사 `canPlace(s, kind, x, y, facing)`: 드러난 땅 안(`BUILD_RECT`), 다른 건물·서고·길 칸과 겹치지 않음(마당·길·정원은 열린 칸이라 걸을 수 있음), **놓은 뒤에도** 새 터 입구 칸에서 서고 문·모든 건물 `entry`·길 칸에 길찾기로 닿음(집 안에 갇히는 배치·서고를 막는 배치 거절). 막히면 이유 한 가지만(예: "문 앞이 막힌다").
- [x] 주문·진행(D3): `orderBuild`는 닢·재료를 내고 `ordered`; 다음 날 아침 `building`; 그다음 날 아침 `done`(`advanceBuilds`, 정산은 날짜 가드로 한 번 — 잠자기·불러오기·맵 이동에 중복 진행 없음). 취소 `cancelBuild`(공사 시작 전 100%, 중 50%), 철거 `demolishBuild`(완공 뒤 닢 50%, 서고 거부), **환불은 기록 삭제와 한 번에 `refunded` 표식**.
- [ ] 화면: 입구 가까운 "터 표지"에서 건물 목록 → 쓰임·드는 것 확인 → 부지 미리보기(놓을 수 있는 칸 초록/막히는 칸 빨강 없이 **놓을 수 없으면 그 자리에서 이유 한 줄**) → 놓기 확정 → 주문. 이동·철거 전에 확인 한 번. 한 번에 한 건물만 미리보기. 휴대폰 확인. (뺌: 건물 이동은 첫 제작에서 뺌 — 취소·철거 뒤 다시 놓기로 대신. 나머지 목록·미리보기·놓기·주문 화면은 되어 있음)
- [x] 완공된 주택은 **빈 집**이다(주민·꿈·방문자 연결은 후속). 이 작업은 바깥 모습과 놓기·취소·철거·저장까지.
- [x] 테스트: 겹침·구역 밖·길 막힘·갇힘 거절, 비용 부족 거절, 진행 날짜(주문 → 다음 날 공사 → 그다음 날 완공)와 날짜 중복 정산 없음, 환불 세 경우(100/50/철거 50%)·이중 눌림 환불 한 번·재접속 후 환불 한 번, 서고 철거 거부, 저장·불러오기·옛 저장(`newland` 없음), 필사가 건축 상태와 무관, 건물 0채로도 서고 사용 가능, `newland-sites` ↔ `manifest.json` 일치.
- 커밋: `feat: 새 터 건축 기초 — 길·정원·마당·입주 주택 놓기, 공사 하루, 취소·철거 환불`

## 작업 7: 건물 안 가구 (기존 가구 시스템 일반화)
**파일:** `src/engine/room.ts`, `src/engine/spaces.ts`(필요 시), `src/engine/newland.ts`(건물 안 방 칸), `src/engine/game.ts`(방 저장 칸), `src/engine/save.ts`, `src/render/renderer.ts`, 가구 놓기 화면(집 꾸미기 UI, 파일은 조사 뒤), 새 `src/engine/room-ctx.test.ts`, 기존 `room.test`
- [x] **먼저:** 지금 `placement`·`removal`·`rotation`·`refitRoom`의 결과를 고정하는 테스트(기존 `room.test`가 이미 덮는 것 외에, 집 단계 0–3의 대표 배치 20가지)를 통과시킨다.
- [x] `RoomCtx { isFloor(t); keepClear(): Tile[]; entry: Tile; reach: Tile[]; bedStand?: Tile }`를 도입해 `placement`·`rotation`·`removal`·`refitRoom`에 **선택 인자**(기본 `HOME_CTX`=지금 동작)로 넘긴다. 집 안 동작은 한 글자도 바뀌지 않는다(위 고정 테스트).
- [x] 새 터 입주 주택 안: 건물마다 숨은 안 방(아래 10줄 영역에서 한 칸 구획을 할당, 8×6 — `OLD_INTERIORS` 128×96px 크기), 문깔개 `E`, `RoomCtx`는 그 방 기준. 가구 상태는 `GameState.rooms?: Record<string, Furniture[]>`(키 `newland:<건물 id>`)로 **소유 공간별 저장**, 첫 마을 `room`과 섞이지 않음. 놓을 수 있는 가구·돌리기·치우기·가방 환수·길 검사는 기존 `FURNITURE_DEFS`·집 꾸미기 흐름 그대로, 그림도 기존 가구 그림(맞지 않는 크기로 늘리지 않음).
- [x] 문 앞에 서면 들어가고 문깔개로 나옴(기존 이웃집·서고 방식), 안에 갇히는 배치 금지(`placement`의 도달 검사가 새 방 기준으로 동작), 철거·취소 때 안의 가구는 모두 가방으로(가방이 가득하면 기존 궤짝 규칙).
- [x] 테스트: `HOME_CTX` 불변(위 20가지), 새 방에서 놓기·돌리기·치우기·길 막는 배치 거절·문 앞 배치 거절, 소유 공간별 저장(두 집이 서로의 가구를 모름), 첫 마을 집과 새 터 집이 같은 `room`을 쓰지 않음, 철거 시 가구 환수, 저장·불러오기·옛 저장(`rooms` 없음), 건물 수·가구 수가 늘어도 저장 크기가 관리 가능(건물 8채·가구 80개 JSON 길이 상한).
- 커밋: `feat: 건물 안 가구 — 방 기준 일반화(집 동작 불변), 소유 공간별 저장`

## 작업 8: 1부 마무리 점검과 마일스톤 배포 ①
**파일:** `docs/old-testament-data.md`(수치 갱신), `docs/content-audit.md`(계획 20 절), `docs/superpowers/plans/NEXT.md`(진행 한 줄) — 코드 변경은 점검에서 나온 수정뿐
- [x] 시나리오 점검(저장 파일로): 신약 진행 중 / 27권 완필 / 잔치 직후 / 가족·아이 있음 / 아이 없음 / 구약 개방 전·후 / 새 터에서 저장 / 건물 있는 저장 / 옛 저장. 각각 이어하기 → 왕복 → 필사 → 잠자기가 막힘·중복·소실 없이 이어짐.
- [x] 같은 NPC 이중 출현 없음, 약속·거주지 충돌 없음, 구약 필사에 기름·재료·피로·건축 조건이 걸리지 않음(막지 않음 확인), 성경 인용(창 1:3 카드)과 가상 연출·메모가 구분됨, `newland` 문구에 성경 문장 없음.
- [ ] PC·375×812에서 입구 모달·첫 방문·책상·건물 목록·미리보기 스크린샷. (컨트롤러가 찍는다 — 구현자 점검에서는 하지 않음)
- [ ] 네 가지 검사 통과. 사용자에게 "배포 준비됨"(승인이 있으면 배포). **이 시점을 계획 18 전체 완료로 표현하지 않는다**(작업 6–12 미완). (네 가지 검사는 작업 8 커밋 전에 통과; 배포 준비 알림은 컨트롤러 몫)
- 커밋: `docs: 계획 20 1부 점검 — 새 터와 구약 필사 첫 제작 확인`
- **마일스톤 배포 ①**

---

# 2부 — 대표 한 가족의 관계 → 결혼 → 출생 (계획 19 단계 1–5 + 소식·수첩·설정)

## 작업 9: 고정 주민 조사와 보호 규칙 표 (코드 없음) 🔎
**파일:** 새 `docs/characters/00_세대_보호_규칙표.txt`
- [ ] 23명 각각: 나이대(아이·성인·노년, 기존 문서·`neighbors.json`·`people.json`에서 확인되는 것만), `family` 관계·알려진 배우자·자녀, 연애 후보 여부(`CANDIDATE_IDS`), 진행 중 큰 이야기·사건 id, 자율 관계에서 **참여 가능 / 보호 / 제외** 중 하나와 이유를 한 줄 표로. 근거 없는 설정을 지어내지 않는다 — 확인되지 않으면 "모름"으로 적고 보수적으로 제외.
- [ ] 보호 규칙 확정: 플레이어의 연인·약혼자·배우자·구애 중인 상대는 자율 연애·결혼 후보에서 제외, 연애 후보(`CANDIDATE_IDS` 13명)는 **첫 제작에서 전원 제외**(D16), 아이(`child`)·노년(`grandpa`)·상인 장날 한정 주민 제외, 진행 중인 사건(`eventNow`가 걸리는 날)에는 전환 보류. 친족 판정은 계보 id로만(이름·외형 추측 금지), 의붓 관계도 친족.
- [ ] D16의 대표 가족(목수·대장장이) 조건 ①②③를 **실제 데이터로 확인**해 표 맨 위에 "통과/실패와 근거"를 적는다(`neighbors.json`·`people.json`의 `with` 일과 양방향, 두 사람 문서 05·13). 실패면 대체안(새 이웃 입주자 둘)으로 표시하고 이후 작업 11–13은 "데이터 기반만"으로 줄인다.
- [ ] opus 검토: 어떤 주민도 "결혼해야 하는 사람"으로 쓰지 않았는지, 혼자 사는 주민·아이 없는 부부가 정상 생활로 남는지.
- 커밋: `docs: 계획 20 작업 9 — 주민 세대 참여·보호 규칙 표와 대표 가족 확인`

## 작업 10: 세대 기반 데이터와 하루 정산
**파일:** 새 `src/engine/gen.ts`, 새 `src/engine/gen-config.ts`(D13·D14·D15 상수), 새 `src/engine/gen-kin.ts`(친족 판정·계보 복구), `src/engine/game.ts`(`GameState.gen?`, `goToSleep` 아침 단계), `src/engine/save.ts`, 새 `src/engine/gen.test.ts`·`gen-kin.test.ts`·`gen-settle.test.ts`
- [ ] 상태(선택 필드 `GameState.gen?`): `{ on: boolean; seed: number; settledDay: number; persons: Record<string, GenPerson>; relations: Record<string, Relation>; households: Record<string, Household>; events: GenEvent[]; log: GenLog[]; nextPerson: number; nextEvent: number }`.
  - `GenPerson { id, origin: 'fixed'|'born'|'arrived', npc?: string(고정 주민 id), born: number|null(날짜 미상=null), stage, look?, parents: string[], household: string|null }` — **고정 주민(`npc`)과 생성 인물(`g-0001`…)을 분리**하고 배열 번호로 식별하지 않는다.
  - `Relation { id(정렬된 두 id), a, b, stage: 'neighbor'|'friend'|'liked'|'lover'|'preparing'|'spouse', since, together: number(함께한 날 수), lastSeenTogether }`.
  - `Household { id, members, home: string(집 주인 npc), children: string[], lastBirth: number|null, wants: string[] }`, `GenEvent { id(유일), kind, day(예정), who, done, news, … }`.
- [ ] `gen-kin.ts`: `closeKin(a, b)`(부모·자녀·형제자매·조부모·손주·의붓·배우자의 가까운 친족, 계보 id만으로), 순환 부모·존재하지 않는 인물 참조·양쪽 불일치(부모↔자녀·배우자↔배우자)를 `sanitizeGen`에서 복구(깨진 항목만 버리고 나머지 보존). 고정 주민의 `family`·알려진 자녀를 처음 `gen` 만들 때 계보에 넣는다(작업 9 표 기준, **기존 플레이어 가족(`child`·배우자)을 주민 가족으로 중복 생성하지 않는다**).
- [ ] `settleGen(s, content)`: 아침 단계 한 곳에서 부른다. `on === false`면 `settledDay`만 오늘로 맞추고 끝. 가드 `settledDay`, 밀린 날 ≤ 7일을 순서대로(D18), 가족당 한 번에 큰 전환 하나·두 전환 사이 1일 공백(D13), 인구 정원(D14), 난수는 `genRng(seed, kind, ids, n)`(D19). 아무 가족도 없으면(대표 가족 조건 실패 등) 조용히 끝(오류·소식 없음).
- [ ] 저장: 옛 저장은 `gen` 없음 → 첫 정산에서 만들고 `settledDay`를 오늘로(**지난 기간 처리 없음**), `sanitizeGen`이 모양이 틀린 항목을 버림, `seed`는 한 번 정해 저장.
- [ ] 테스트: 같은 날 두 번 정산해도 한 번(저장·불러오기·맵 이동·잠자기 반복 포함), 시간 건너뛰기 12일 → 7일만 순서대로, `on=false` → 아무 전환 없음·`on=true`로 되돌려도 밀린 기간 폭주 없음, 같은 `seed`·같은 입력이면 같은 결과·`seed` 달라지면 달라짐, 계보 복구(순환·고아 참조·한쪽만 연결), 친족 판정(의붓·형제·조부모 포함, 이름 같은 남남은 친족 아님), 옛 저장에서 플레이어 가족 중복 없음, 배열 순서를 바꿔도 id로 같은 인물.
- 커밋: `feat: 주민 세대 기반 — 인물·관계·가구·계보, 하루 정산, 저장된 씨앗, 옛 저장 호환`

## 작업 11: 자율 관계 형성 (대표 두 사람)
**파일:** `src/engine/gen.ts`, 새 `src/engine/gen-relations.ts`, `src/content/people.json`(대표 두 사람의 같은 장소 일과 확인·보강은 최소), `src/content/life-text.json`(`gen` 절 — 관계 소식), 새 `src/engine/gen-relations.test.ts`
- [ ] 자격(`eligible(a, b)`): 둘 다 성인·참여 가능 표(작업 9), 기존 배우자 없음, 플레이어 연인·약혼자·배우자·구애 상대 아님, `closeKin` 아님, 진행 중 이야기로 전환이 깨지지 않음(`eventNow` 걸린 날은 보류), 연애 후보 아님. **모든 잠재 후보를 영구 동결하지 않는다**(보호는 현재 진행 중인 관계 동안만).
- [ ] 쌓이는 근거: `together` = 그날 실제로 같은 장소에서 만나는 일과(`Routine.with` 양방향이 그날 실제로 성립한 날)·함께 참석한 약속/행사. 날씨·장날·이사 전·이야기 중이라 일과가 건너뛰어진 날은 세지 않는다. D13의 기간·함께한 날 조건으로 단계 전환(이웃 → 친한 → 호감 확인 → 연인). 호감 확인에는 **양쪽 동의 판정**(성향·취향 `Person.tastes` 적합 — 거절은 무작위가 아니라 취향 불일치 때만, 불일치면 친한 사이로 머문다 = 실패 아님). 모든 관계가 연인으로 가지 않는다.
- [ ] 대표 두 사람(목수·대장장이)에 한해 시작(D16): 조건 통과 시 `gen` 관계가 `neighbor`로 시작, 이후 단계 전환은 하루 정산에서만. 친구 단계도 소식·일과·수첩에 남는다.
- [ ] 소식 문구는 템플릿 + `{player}`가 아닌 역할 이름(이웃은 역할 이름만, §2-3), 🔎 opus: 해석·성경 표현 없음, 두 사람 중 한쪽을 일방적으로 고르게 쓰지 않음.
- [ ] 테스트: 일과가 성립한 날만 `together` 증가·비 오는 날 대체 일과면 세지 않음, 기간 전에는 전환 없음·기간이 차면 정산 한 번에 한 단계만, 비성인·친족·배우자·플레이어 상대는 후보에서 제외, 취향 불일치 → 친한 사이로 유지·실패 표시 없음, 자율 진행 끔 → 증가·전환 없음, 플레이어가 루디·틸리와 연애 중이면 시작하지 않음(D16 ②), 저장·불러오기 뒤 같은 상태, 연애 후보 13명 누구도 자율 관계에 들어가지 않음.
- 커밋: `feat: 주민 자율 관계 — 함께한 날로 쌓이는 이웃·친구·연인 단계, 동의·보호 규칙`

## 작업 12: 결혼 준비·초대·결혼식·결혼 후 일과
**파일:** `src/engine/gen-marriage.ts`, `src/engine/plans.ts`(약속 종류 `event`로 NPC 주최 결혼식 — `host`·`members`·`title` 사용, 기존 `availability`·`attendAppt`·`settleAppt` 재사용), `src/engine/events.ts`(달력), `src/engine/game.ts`(광장 장면 연결 최소), `src/content/people.json`(결혼 후 저녁·밤 일과 `req`), `src/content/life-text.json`(`gen` 절), `src/render/wedding-art.ts`(연결만), 새 `src/engine/gen-marriage.test.ts`
- [ ] 연인 28일 + 거주 경로(D21의 기존 집 공동 거주) 충족 → `preparing`: 결혼 날짜를 `availability`로 정한다(장날·잔치·플레이어 결혼식·두 사람의 다른 약속과 겹치지 않는 가장 가까운 날, 7일 앞). 정해지면 달력에 초대(`Appt{kind:'event', host, members, title}`), 결혼 날짜가 지나기 전 **플레이어가 참석을 명시**하면(`attendAppt`) 공동 기억, 불참이면 실제 사실만(참석 기억·보상 없음).
- [ ] 결혼 당일: 기존 광장 결혼식 장면·그림(`WEDDING_SPOT`, `assets/events` 결혼식·`wedding-art.ts`)에 두 사람의 실제 외형으로. 비·눈이면 `venueFor`의 실내 대체, 대체가 없으면 미룸(다음 날짜와 이유). 다른 맵에 있어도 결혼은 진행되고 그날의 소식과 결혼 후 대화가 남는다. 참석 보상 없음.
- [ ] 결혼 후: `Relation.stage = 'spouse'`, `Household` 생성(집 = 목수 집, `children` 빈 목록), `flags['gen:wed:<가구 id>']`로 `people.json`의 저녁·밤 일과(`Routine.req`)와 대화(배우자 상태 구분)가 열린다. 두 사람 모두 낮에는 본인 일(대장간·작업)과 친구 만남을 유지(연애 때문에 일터가 사라지지 않음). 의붓 관계(루디–틸리)가 계보에 들어가고 자율 연애에서 제외.
- [ ] 집 부족 경로 둘(독립 대기·새 집 희망)은 데이터 칸만 두고(`Household.wants`), 화면·주택 희망 목록은 후속(B19-9). 압박 알림·기한·관계 하락 없음.
- [ ] 테스트: 날짜가 장날·잔치·플레이어 결혼식과 겹치지 않음·겹치면 다른 날, 초대는 7일 앞 달력에 한 번, 불참해도 결혼은 진행되고 참석 기억·보상 없음, 참석은 `attendAppt` 명시 행동일 때만, 비 → 실내 대체, 다른 맵에 있어도 진행·소식 남음, 결혼식을 두 번 처리하지 않음(저장·불러오기·두 번 정산), 결혼 후 일과가 `req` 뒤에만 나옴·결혼 전엔 기존 시간표 그대로, 같은 NPC 중복 없음(두 사람이 같은 시각 두 곳 없음), 자율 진행 끔 → 결혼 준비 시작 안 함·이미 잡힌 결혼식은 그대로(D17), 플레이어 결혼식·아기 잔치와 같은 날 아님.
- 커밋: `feat: 주민 결혼 — 달력 초대, 광장 결혼식, 기존 집 공동 거주와 결혼 후 일과`

## 작업 13: 출생과 가족 규모
**파일:** `src/engine/gen-birth.ts`, `src/engine/gen.ts`, `src/engine/child.ts`(`CHILD_NAMES` 읽기만), `src/render/generation-art.ts`·`old-village-art.ts`(아기 그림 연결, 마지막 단계), `src/content/life-text.json`(`gen` 절), 새 `src/engine/gen-birth.test.ts`
- [ ] 결혼 + 28일 → 기다림, + 28일 → 출생(D13). 출생 조건: 자녀 상한 2(D14), 출산 간격 56일, 마을 생성 주민 정원 8(D14), 자율 진행 켜짐. 못 맞추면 **대기** — 벌점·실패·"못 낳음" 표시 없음. 부부가 원하지 않거나 정원이 찬 상태도 정상 생활(소식 없음).
- [ ] 출생 전 작은 준비 대화 한 줄(`gen` 절, 🔎), 출생 때 `GenPerson`(id `g-NNNN`, 부모 둘·집·날짜) 생성 + 아기 외형(`genRng`로 부모의 **선택 가능한** 머리·피부·색 조합 — 한 부모의 복사 아님, 결과를 `GenPerson.look`에 저장)·이름(`CHILD_NAMES`·금지어 검사, 중복 허용, 내부 id 유일)·`Household.children`·`lastBirth`. 부모 양쪽 계보 연결, 집을 철거하거나 이사해도 삭제되지 않음(안전한 임시 거처 = 부모 집).
- [ ] 출생은 하루에 한 사건(그날 다른 전환 없음), 같은 날 재정산·재접속으로 두 번 생기지 않음, 과거 날짜로 되돌려 불러도(옛 저장 이전 시점) 같은 `seed`면 같은 아이.
- [ ] 아기 표시(D22): 부모 집 요람에 정지 아기 그림(`generation-art.ts` 아기 행, `propBack→actor→propFront` 규칙은 연결안내 txt 따름) — 이 단계가 이 세션 안에 안 끝나면 코드·표시 없이 두고 체크박스를 비워 둔다.
- [ ] 테스트: 출산 전 상한·간격·정원 각각 대기, 정원 8에서 대기 → 정원이 비면(후속에서 생길 일, 테스트는 수동으로 줄여서) 진행, 아이 id 유일·부모↔자녀 양방향, 외형·이름이 같은 `seed`에서 같음·저장에 남음, 두 번 정산해도 아이 한 명, 자율 진행 끔 → 출생 없음, 부부 없는 상태에서 출생 없음, 플레이어 아이와 별개(`s.child` 영향 없음), 금지어·이름 길이.
- 커밋: `feat: 주민 출생 — 상한·간격·정원 대기, 저장된 외형과 이름, 계보 연결`

## 작업 14: 소식·수첩·달력·자율 진행 설정
**파일:** `src/engine/gen.ts`(`log`·묶음), `src/engine/news.ts`(하루 소식에 끼우기), `src/engine/notebook.ts`·`src/features/journal/Journal.tsx`(가족 칸), `src/engine/events.ts`(달력), `src/features/play/Settings.tsx`·`src/store/game-store.ts`(설정 단계), `src/content/life-text.json`(`gen`·`settings` 절), 새 `src/engine/gen-news.test.ts`·`src/features/play/Settings.test.tsx`(추가)
- [ ] 소식: 하루 정산에서 생긴 변화(친해짐·연인·결혼 준비·결혼·출생)를 `gen.log`에 쌓고 **하루 최대 3건을 묶어 한 줄 모달/근황**으로(기존 `news.ts` 하루 2–3건과 합쳐 5건을 넘기지 않음). 필사창이 열려 있으면 쌓아 두었다가 닫은 뒤 보임(Global). 팝업이 반복되지 않음.
- [ ] 수첩(`Journal.tsx`): 주민 항목에 가족 칸(배우자·부모·자녀·사는 집·최근 가족 기억) — **본 사람만**(아직 만나지 않은 인물의 상세를 미리 보이지 않음, 아기는 태어난 뒤 마주쳤거나 소식을 들은 뒤). 날짜가 미상(null)이면 "날짜 미상". 달력: 초대받은 결혼식, 단순 정산은 일정으로 만들지 않음.
- [ ] 설정(D17): 설정 화면에 한 단계("주민 생활") — "주민 자율 생활" 켜기/끄기(기본 켬), "주요 변화 알림" 켜기/끄기. 값은 게임 저장 `gen.on`·`gen.notify`(localStorage 아님), 끄면 새 전환만 멈추고 현재 가족·아이·기억은 보존, 다시 켜면 밀린 기간을 처리하지 않음. 휴대폰 단계별 화면(한 화면에 몰아넣지 않음), 설명 문구는 설정 줄 한 줄.
- [ ] 테스트: 하루 소식 묶음 상한 3건·중복 없음, 필사 중 소식이 큐에 쌓이고 닫은 뒤 보임, 수첩에서 만나지 않은 인물 비노출·만난 뒤 노출·날짜 미상 표기, 달력에 초대만 표시, 설정 토글이 저장·재접속 뒤 유지·끄고 켜도 가족 보존·폭주 없음, `gen.on` 변경이 같은 날 정산을 중복시키지 않음, 옛 저장 설정 기본 켬.
- 커밋: `feat: 주민 소식·수첩 가족 칸·자율 진행 설정 — 소식 묶음, 필사 중 큐, 켜기·끄기`

## 작업 15: 2부 마무리 점검과 마일스톤 배포 ②
**파일:** `docs/content-audit.md`(계획 20 절), `docs/superpowers/plans/NEXT.md`, 필요한 수정만
- [ ] 장기 시뮬레이션 테스트: 대표 가족을 140일+ 돌려 관계 → 결혼 → 출생이 순서대로 한 번씩, 여러 번 저장·불러오기·맵 왕복·`on` 끄고 켜기를 섞어도 같은 결과(같은 `seed`), 인구가 정원을 넘지 않음, 저장 JSON 크기가 관리 가능.
- [ ] 시나리오: 플레이어 배우자/연인 보호, 미성년·친족 제외, 구약 개방 전·후 저장 모두 진행, 새 터에서 결혼식 날을 맞아도 진행, 자율 진행 끄기/켜기, 아이 없는 주민·혼자 사는 주민이 대화·일과를 계속 가짐, 플레이어 가족·기록·직업·관계 보존.
- [ ] PC·375×812 스크린샷(소식·수첩 가족 칸·설정·결혼식 장면), 🔎 opus 문구 검토 결과 기록, 네 가지 검사 통과. "배포 준비됨"(승인 시 배포). **이 시점을 계획 19 전체 완료로 말하지 않는다**(성장·독립·구약 주거 연결·전체 주민 확장 미완).
- 커밋: `docs: 계획 20 2부 점검 — 주민 대표 가족 관계·결혼·출생 확인`
- **마일스톤 배포 ②**

---

## 후속 작업 목록 (이 계획의 범위 밖 — 위 결정을 그대로 이어받는다)

### 계획 18 작업 6–12
- **B18-6 신약 키워드 계승과 생활 선택 대표 사례:** `godRecords`(`god-records.ts`) 원본 보존·돌아보기 화면·미발견 키워드 대안 경로, 사랑·소망·평안 중 대표 하나(마당 이야기), 결과는 대사·만남·공간 이용·기억에 남기고 우열 점수 없음. 선행: 작업 6.
- **B18-7 자식의 집 겸 일터 `cook`(D4):** 기존 자식 직업 추천·선택 보존, 독립은 사건으로(자동 이주 없음), 건물 `cook`, 요리 엔진 재사용, 자식 없는 저장도 다른 기능 사용. 선행: 작업 7, 필요 시 B19-7.
- **B18-8 주민의 꿈터 `weaver`(D4):** 첫 마을에서 바람을 듣는 장면 → 건물 목록 "○○의 꿈" → 개장 → 어려움 → 일과·소품 변화, 건물 `weaver`·`gallery` 양식. 선행: 작업 7.
- **B18-9 손님집과 새 이웃(D5):** 손님집 건물 `guest`, 후보 3명(인물·선물 문구 제작 + 고유 도트 추가), 저장된 추첨·체류 3일·재방문 7일·입주 선택·선물 중복 방지·도감. 선행: 작업 7.
- **B18-10 공동 마당·기억 정원:** `courtyard`·`garden` 건물의 이용(소모임·잔치 엔진 `clubs.ts`·`fest.ts` 재사용), 실제 참석자·완료 사건만 기억, 옛 날짜 보존, 기념물 배치/회수. 선행: 작업 6·15(2부) 일부.
- **B18-11 서고 전시 확장과 나머지 직업·주민 콘텐츠 + 구약 안내문:** 책별 기록대·주제별 진열·개인 메모 자리(본문과 구분)·함께 읽기 자리. **구약 안내문은 데이터 형식(본문 범위·근거 구절·교리 근거·참고 자료·검토 상태, AI 초안/검토 완료 구분)부터 만들고, 검토자 지정 전 공개하지 않는다**(D10). 빈 메뉴 제거.
- **B18-12 전체 검증과 사용자 검토:** 신약 진행 중/완필/기존 가족/자식 없음/모바일/사계절 저장 시나리오 전수.

### 계획 19 단계 6–11
- **B19-6 아기에서 성인까지 성장(D15):** 외형·취향·관심·실제 활동, 단계별 일과·대화, 성장마다 첫 심부름·처음 배운 작업·작은 발표, `generation-art.ts` 성장 행(20시퀀스)·가족 동작(136시퀀스) 연결. 선행: 작업 13.
- **B19-7 진로·견습·독립·필수 서비스 유지:** 기존 자식 직업 능력/관심 규칙 재사용(부모 직업 자동 상속 없음), 출퇴근·견습 먼저, 독립 예정자는 수첩·희망 목록에.
- **B19-8 계획 18 연결:** 새 터 주택·일터·손님집·마당·기억 정원이 주민 가족의 거주·기억과 이어짐, 두 맵 NPC 중복 없는 출퇴근, 독립 정원.
- **B19-9 수첩·계보·주택 희망·달력·가족 기억 화면 확장:** 계보 펼침(발견한 인물부터), 주택 희망 목록(신혼집·독립집·일터, 압박 없음), 가족별 기억.
- **B19-10 전체 주민 확장:** 작업 9 표의 참여 가능 주민 전체로, 연애 후보 13명을 어떻게 다룰지(플레이어 구애 종료 후 유예 기간 포함) 사용자 확인, 가족별 고유 사건.
- **B19-11 장기 시뮬레이션·저장 복구·모바일·인구/성능·콘텐츠 검증.**
- **계속 범위 밖:** 노화·사망·이혼·재혼·입양·무한 세대·사업 상속(계획 19 §18).

---

## 완료 기준 (1부·2부 각각 / 전체와 구분)

- **1부 완료:** 작업 1–8의 체크가 실제 연결·검증 뒤 표시, 네 가지 검사 통과, 신약 진행·가족·가구·필사·서고 보존, 구약 필사가 어떤 보상도 막힘도 없음, 새 터 왕복·건축·가구가 저장·재접속에서 안전. **계획 18 전체 완료가 아니다.**
- **2부 완료:** 작업 9–15 체크, 대표 가족이 게임 날짜만으로 관계 → 결혼 → 출생을 한 번씩 거침(같은 씨앗 같은 결과), 소식·수첩·설정이 동작, 보호 규칙 위반 없음. **계획 19 전체 완료가 아니며, 대표 한 가족의 성공을 전체 주민 완료로 처리하지 않는다.**

## 사용자에게 나중에 알릴 것 (임의 결정 요약)

1. 구약은 개신교 39권·개역한글, 새 터 40×40(보이는 곳 40×30), 입구는 첫 마을 동쪽 표지, 이동 30분·출발은 06:00–21:30.
2. 구약 필사는 신약과 같은 엔진에 **보상 없음**(경험치도 없음), 퀴즈·제본·등급 없음, 안내문은 이번에 쓰지 않음(검토 전 공개 금지).
3. 건물 비용·환불(공사 전 100%, 중 50%, 철거 닢 50%)과 공사 1일, 첫 직업 `cook`, 첫 꿈터 주민 베 짜는 이웃.
4. 주민 세대 기간(14/28/7/28/7/28/28일), 자녀 2명·생성 주민 8명, 대표 가족은 목수와 대장장이(조건이 깨지면 새 이웃으로 대체), 자율 진행 기본 켬은 저장 안에 둠.
5. 방문자는 한 번에 1명·후보 3명·재방문 7일, 입주 안 한 인물에겐 선물 없이 기억만.
