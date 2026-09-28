# 스물일곱 권의 마을 — 계획 2: 마을 생활 채우기

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시험판(계획 1) 위에 생활 시뮬 층을 더한다 — '평안', 더위·기분, 텃밭, 공방 판매와 직업 단계 보상, 새 이웃 넷(편지 나르는 이웃·주막 주인·어부·제본 골목의 목수).

**Architecture:** 엔진은 순수 TS(`src/engine/`), store가 화면과 잇는다(계획 1과 같음). 새 모듈: `mood.ts`(기분 계산 — 저장하지 않는 파생값), `garden.ts`(텃밭), `job.ts`(직업 단계 — `game.ts`와 `requests.ts`가 함께 쓰도록 순환 없는 자리). 새 이웃은 `neighbors.json`·`life-text.json`·`sprites.ts`·`world.ts` 데이터로 더하고, 서고 권수로 이사 온다(`joinsAtBooks`).

**Tech Stack:** Vite 8, React 19, TypeScript 7, Zustand 5, Vitest 5 (계획 1과 같음).

## Global Constraints

- 설계: `docs/superpowers/specs/2026-09-29-twenty-seven-design.md` (§2.5–2.7, 2026-09-29 결정 두 개 포함). 최상위 기준: `docs/exclusion-list.md`.
- 필요 수치: 배고픔 · 피로 · 기분 · 추위/더위. 외로움은 없다. 계절 칸은 겨울 "추위", 여름 "더위", 봄·가을엔 숨긴다.
- '평안': 자기 전에 구절을 읽고 잔 다음 날 하루, 피로가 천천히 쌓인다(분당 1/12 → 1/15).
- 기분 ≥ 70이면 편지 대필 40분 → 30분, 장 기록 60분 → 45분.
- 이웃 13명: 기존 9명 그대로 + 편지 나르는 이웃(처음부터) · 주막 주인(서고 1권) · 어부(2권) · 제본 골목의 목수(3권). 역할 이름만, 성경 직함 금지, 이벤트는 생활의 일로만(exclusion 2-3: 어부는 그물 손질·갈대 베기 등, "밤새 못 잡다가 가득" 같은 장면 금지).
- 엮은 말씀 책·조각은 팔지 않는다. 파는 것은 공방 제품(잉크·종이·표지)과 텃밭 작물뿐.
- 게임 문구는 `src/content/life-text.json`에만, `npm run verify` 금지어 통과. 화면에 "벌" 금지.
- 지도 그림은 사용자 취향(청소년 톤 차분한 파스텔, 유아틱·하트 금지)을 따른다. 새 집 모양은 기존 `roofed()`를 그대로 쓴다.
- 집 넓히기와 복음서 방 완성 잔치는 **이 계획에 없다**(집 안 화면·네 권 콘텐츠가 먼저 필요).
- 작업 폴더 `C:\Users\wn410\OneDrive\Desktop\cloooo\twenty-seven`, 브랜치 `plan-1-trial`에서 이어서. PowerShell은 `&&` 없음.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 각 작업 끝에 `npx tsc -b`, `npm test`, `npm run verify` 통과.
- **다른 세션이 같은 폴더에서 그림 작업을 하고 있을 수 있다.** 작업 시작 전에 `git status`가 깨끗한지 보고, 아니면 멈추고 알린다.

## 파일 지도

| 파일 | 책임 | 작업 |
|---|---|---|
| `src/store/game-store.ts` | 알림 순서, 평안, 물 마시기, 텃밭·팔기 동작 | 1–4 |
| `src/engine/needs.ts` | `heat` 칸, 평안 속도, 물 마시기 | 1, 2 |
| `src/engine/mood.ts` (새) | 기분 계산 | 2 |
| `src/engine/garden.ts` (새) | 심기·물 주기·자라기·거두기 | 3 |
| `src/engine/job.ts` (새) | 직업 단계 (requests.ts에서 옮김) | 4 |
| `src/engine/game.ts` | 평안 표식, 더위 문맥, 기분 효과, 텃밭 상태, 팔기, 표지 | 1–4 |
| `src/engine/requests.ts` | 직업별 수고비, 기분 효과 | 2, 4 |
| `src/engine/world.ts` | 텃밭 `l`, 새 집 넷, 보리밭 줄이기 | 3, 5 |
| `src/content/neighbors.json`, `life-text.json` | 새 이웃, 문구 | 2–5 |
| `src/render/sprites.ts`, `renderer.ts`, `decor.ts` | 새 이웃 옷, 텃밭 그림, 아이콘 | 3, 5 |
| `src/features/menus/CareMenu.tsx`, `PlaceMenu.tsx`, `talk/TradeBoard.tsx`, `garden/GardenMenu.tsx`(새) | 화면 | 2–4 |

---

### Task 1: 서고 알림 순서 확인 · '평안'

**Files:**
- Modify: `src/engine/needs.ts` (`NeedsContext.peace`, `tickNeeds`)
- Modify: `src/engine/game.ts` (`goToSleep` 인자, `tick`/`passTime`의 문맥)
- Modify: `src/store/game-store.ts` (`sleep`)
- Test: `src/engine/needs.test.ts`, `src/engine/game.test.ts`, `src/features/ModalLayer.test.tsx`

**Interfaces:**
- Produces:
```ts
// needs.ts
NeedsContext.peace?: boolean          // 평안인 날: 피로가 분당 1/15로 (평소 1/12)
// game.ts
export function goToSleep(s: GameState, content: GameContent, opts?: { read?: boolean }): GameState
// read가 true면 flags.peaceDay = 다음 날(잠에서 깬 날)
export function peaceful(s: Pick<GameState, 'flags' | 'clock'>): boolean   // flags.peaceDay === clock.day
```

- [ ] **Step 1: 실패하는 테스트**

`src/engine/needs.test.ts`에:
```ts
it('평안인 날은 피로가 천천히 쌓인다', () => {
  const ctx = { indoor: true, season: 'spring' as const, phase: 'day' as const, warm: false, hasBlanket: false }
  const plain = tickNeeds({ ...FRESH }, 60, ctx).fatigue
  const calm = tickNeeds({ ...FRESH }, 60, { ...ctx, peace: true }).fatigue
  expect(plain).toBeCloseTo(5)
  expect(calm).toBeCloseTo(4)
})
```
`src/engine/game.test.ts`에(파일 위의 `at` 도우미를 쓴다):
```ts
describe('평안', () => {
  it('자기 전에 읽고 자면 다음 날 하루 평안', () => {
    const s0 = at(newGame(CONTENT), 22 * 60, 3)
    const read = goToSleep(s0, CONTENT, { read: true })
    expect(read.clock.day).toBe(4)
    expect(peaceful(read)).toBe(true)
    expect(peaceful(goToSleep(read, CONTENT))).toBe(false)
    expect(peaceful(goToSleep(s0, CONTENT))).toBe(false)
  })
})
```
`src/features/ModalLayer.test.tsx`에:
```tsx
it('서고: 책등 알림이 먼저, 길 열림 알림은 뒤에', async () => {
  vi.useFakeTimers()
  const base = chooseBook(newGame(CONTENT), 'mk', CONTENT)
  useGame.setState({
    game: { ...base, collected: piecesOf('mk').map((p) => p.id), progress: { ...base.progress, mk: { completed: [1, 2, 3], arrangement: {} } } },
    modal: null,
    rng: mulberry32(5),
  })
  useGame.getState().startShelve('mk')
  for (let i = 0; i < 5; i++) {
    const m = useGame.getState().modal
    if (m?.kind !== 'quiz') throw new Error('quiz expected')
    useGame.getState().answerQuiz(m.questions[m.index].answer as string | string[])
    useGame.getState().nextQuiz()
  }
  expect(useGame.getState().toast?.text).toContain('책등')
  vi.advanceTimersByTime(4300)
  expect(useGame.getState().toast?.text).toContain('길이 열렸어요')
  vi.useRealTimers()
})
```
(필요한 import가 없으면 더한다: `vi`는 vitest 전역, `chooseBook`, `newGame`, `CONTENT`, `piecesOf`, `mulberry32`.)

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/engine/needs.test.ts src/engine/game.test.ts src/features/ModalLayer.test.tsx`
Expected: 평안 두 테스트 FAIL (`peace`/`peaceful` 없음). 알림 순서 테스트는 통과할 수도 있다 — 통과하면 알림 순서는 버그가 아니었던 것이고(계획 1 확인 때 JS로 빠르게 몰아서 생긴 착시), 테스트는 회귀 방지로 남긴다. 실패하면 `nextQuiz`의 서고 분기에서 `get().say(책등)`가 길 열림 알림보다 먼저 불리고, 길 열림은 `setTimeout(…, 4200)`으로만 뜨게 고친다.

- [ ] **Step 3: 구현**

`src/engine/needs.ts`:
- `NeedsContext`에 `/** 평안인 날 (자기 전 읽기) */ peace?: boolean`
- `tickNeeds`의 `const fatigue = n.fatigue + minutes / 12` → `const fatigue = n.fatigue + minutes / (ctx.peace ? 15 : 12)`

`src/engine/game.ts`:
- 추가:
```ts
/** 오늘이 평안인 날인가 (어젯밤 자기 전에 구절을 읽었다) */
export function peaceful(s: Pick<GameState, 'flags' | 'clock'>): boolean {
  return s.flags.peaceDay === s.clock.day
}
```
- `tick`과 `passTime`의 `tickNeeds(…, { … })` 문맥 두 곳에 `peace: peaceful(s),`
- `goToSleep(s, content)` → `goToSleep(s: GameState, content: GameContent, opts: { read?: boolean } = {})`, 본문에서 `flags`를 만든 뒤:
```ts
  if (opts.read) flags.peaceDay = day
  else delete flags.peaceDay
```

`src/store/game-store.ts` `sleep`:
```ts
    sleep: () => {
      sfx('sleep')
      const m = get().modal
      const read = m?.kind === 'review' && m.pieceId !== null
      set({ game: persist(goToSleep(get().game, CONTENT, { read })), modal: null })
    },
```
`life-text.json` `ui`에 `"peace": "평안"`을 두고, `src/features/play/Hud.tsx`의 날짜 줄 끝에 `{peace && <b className="hud-peace"> · {T.ui.peace}</b>}` (`const peace = useGame((s) => peaceful(s.game))`).

- [ ] **Step 4: 통과 확인과 커밋**

Run: `npx tsc -b; npm test; npm run verify` → 모두 PASS
```powershell
git add -A
git commit -m @'
feat: 자기 전에 읽고 자면 다음 날 평안 (피로가 천천히)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
'@
```

---

### Task 2: 더위와 기분

**Files:**
- Modify: `src/engine/needs.ts` (`heat`), `src/engine/game.ts` (문맥·물 마시기·장 기록 시간), `src/engine/requests.ts` (편지 시간), `src/engine/save.ts` (`needs.heat` 기본값)
- Create: `src/engine/mood.ts`, `src/engine/mood.test.ts`
- Modify: `src/features/menus/CareMenu.tsx` (`NeedsView`, 물 마시기), `src/store/game-store.ts`, `src/render/renderer.ts` (더위 표정), `src/content/life-text.json`
- Test: `src/engine/needs.test.ts`

**Interfaces:**
- Consumes: `peaceful` (작업 1), `weatherOf`, `seasonOf`
- Produces:
```ts
// needs.ts
Needs.heat: number                         // 0~100, 여름 한낮 바깥에서 오른다
NeedsContext.hot?: boolean                 // 오늘 날씨가 'hot'
export function coolDown(n: Needs): Needs  // heat 0
// mood.ts
export const GOOD_MOOD = 70
export function moodOf(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'>): number   // 0~100
export function inGoodMood(s: …): boolean
// game.ts
export function drinkWater(s: GameState): GameState | null   // 물 1을 써서 더위를 식힌다
export function seasonalNeed(s: Pick<GameState, 'clock'>): 'cold' | 'heat' | null
```

- [ ] **Step 1: 실패하는 테스트**

`src/engine/needs.test.ts`에:
```ts
describe('더위', () => {
  const summerNoon = { indoor: false, season: 'summer' as const, phase: 'day' as const, warm: false, hasBlanket: false }
  it('여름 한낮 바깥에서 오르고, 뜨거운 날은 두 배', () => {
    expect(tickNeeds({ ...FRESH }, 60, summerNoon).heat).toBeCloseTo(18)
    expect(tickNeeds({ ...FRESH }, 60, { ...summerNoon, hot: true }).heat).toBeCloseTo(36)
  })
  it('집 안이나 다른 계절에는 식는다', () => {
    expect(tickNeeds({ ...FRESH, heat: 50 }, 30, { ...summerNoon, indoor: true }).heat).toBeCloseTo(20)
    expect(tickNeeds({ ...FRESH, heat: 50 }, 60, { ...summerNoon, season: 'spring' }).heat).toBeCloseTo(20)
  })
  it('물을 마시면 식고, 자고 나면 0', () => {
    expect(coolDown({ ...FRESH, heat: 80 }).heat).toBe(0)
    expect(sleepNeeds({ ...FRESH, heat: 80 }, 22 * 60).heat).toBe(0)
  })
})
```
`src/engine/mood.test.ts`:
```ts
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { GOOD_MOOD, inGoodMood, moodOf } from './mood'

const base = (): GameState => newGame(CONTENT)

describe('기분', () => {
  it('맑은 날 기본은 60, 가구·도구로 오른다', () => {
    const s = base() // 1일째 맑음
    expect(moodOf(s)).toBe(60)
    const decorated = { ...s, room: Array.from({ length: 6 }, (_, i) => ({ item: 'rug' as const, x: 3 + i, y: 6 })), inv: { ...s.inv, goodPen: 1, brightLamp: 1 } }
    expect(moodOf(decorated)).toBe(85) // 60 + 가구 15(최대) + 도구 10
    expect(inGoodMood(decorated)).toBe(true)
  })
  it('배고프거나 지치거나 춥고 더우면 내려간다', () => {
    const s = base()
    expect(moodOf({ ...s, needs: { ...s.needs, hunger: 80, fatigue: 80, cold: 0, heat: 70 } })).toBe(20)
    expect(moodOf({ ...s, needs: { ...s.needs, hunger: 100, fatigue: 100, cold: 100, heat: 100 } })).toBeGreaterThanOrEqual(0)
  })
  it('좋은 기분 기준은 70', () => {
    expect(GOOD_MOOD).toBe(70)
  })
})
```
(1일째 날씨가 맑음이 아니면 `calendar.ts`의 `weatherOf(1)`을 확인하고, 맑은 날인 첫 날짜를 `clock.day`에 넣어 기대값을 맞춘다. `room` 항목 모양은 `room.ts`의 `Furniture`를 따른다.)

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/engine/needs.test.ts src/engine/mood.test.ts` → FAIL

- [ ] **Step 3: 구현**

`src/engine/needs.ts`:
- `Needs`에 `/** 여름 한낮의 더위 */ heat: number`, `FRESH`에 `heat: 0`
- `NeedsContext`에 `/** 오늘 날씨가 뜨겁다 */ hot?: boolean`
- `tickNeeds` 끝의 return 앞에:
```ts
  // 더위: 여름 한낮(낮 단계) 바깥에서만 오른다. 뜨거운 날은 두 배. 그 밖에는 식는다 (집 안이면 더 빨리)
  let heatRate: number
  if (ctx.season === 'summer' && ctx.phase === 'day' && !ctx.indoor) heatRate = ctx.hot ? 0.6 : 0.3
  else heatRate = ctx.indoor ? -1 : -0.5
```
  return을 `{ hunger: …, fatigue: …, cold: …, heat: clamp(n.heat + heatRate * minutes) }`로.
- `coolDown` 추가: `export function coolDown(n: Needs): Needs { return { ...n, heat: 0 } }`
- `sleepNeeds` 반환에 `heat: 0`

`src/engine/game.ts`:
- `tick`·`passTime`의 문맥에 `hot: weatherOf(clock.day) === 'hot',`
- `goToSleep`의 앓아누운 경우 `needs = { hunger: 20, fatigue: 0, cold: 0, heat: 0 }`
- 추가:
```ts
/** 이 계절에 보이는 몸 칸: 겨울 추위, 여름 더위, 봄·가을 없음 */
export function seasonalNeed(s: Pick<GameState, 'clock'>): 'cold' | 'heat' | null {
  const season = seasonOf(s.clock.day)
  return season === 'winter' ? 'cold' : season === 'summer' ? 'heat' : null
}

/** 물을 마셔 더위를 식힌다 (물 1) */
export function drinkWater(s: GameState): GameState | null {
  const left = take(s.inv, { water: 1 })
  if (!left) return null
  return passTime({ ...s, inv: left, needs: coolDown(s.needs) }, 5)
}
```
- `submitChapter`의 `passTime(…, 60)` → `passTime(…, inGoodMood(s) ? 45 : 60)` (`import { inGoodMood } from './mood'`)

`src/engine/mood.ts`:
```ts
// 기분: 따로 쌓지 않고 그때그때 계산한다 (설계 §2.6). 좋은 날씨·꾸민 방·좋은 도구로 오르고, 몸이 힘들면 내려간다.
import { weatherOf } from './calendar'
import type { GameState } from './game'
import { count } from './items'

export const GOOD_MOOD = 70

const WEATHER_MOOD: Record<string, number> = { sunny: 10, wind: 0, fog: 0, rain: -5, snow: -5, hot: -5 }

export function moodOf(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'>): number {
  let m = 50 + (WEATHER_MOOD[weatherOf(s.clock.day)] ?? 0)
  m += Math.min(15, s.room.length * 3)
  if (count(s.inv, 'goodPen') > 0) m += 5
  if (count(s.inv, 'brightLamp') > 0) m += 5
  if (s.needs.hunger >= 70) m -= 15
  if (s.needs.fatigue >= 75) m -= 15
  if (Math.max(s.needs.cold, s.needs.heat ?? 0) >= 60) m -= 10
  return Math.max(0, Math.min(100, m))
}

export function inGoodMood(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'>): boolean {
  return moodOf(s) >= GOOD_MOOD
}
```
(`mood.ts`는 `game.ts`에서 **타입만** 가져온다. `game.ts`가 `mood.ts`의 함수를 쓰므로 반대 방향 값 import는 없어야 한다.)

`src/engine/requests.ts`: `finishLetter`의 `passTime(paid, LETTER_MINUTES)` → `passTime(paid, inGoodMood(s) ? 30 : LETTER_MINUTES)`.

`src/engine/save.ts` `sanitize` 반환에 `needs: { ...s.needs, heat: s.needs?.heat ?? 0 },`.

`src/content/life-text.json` `ui.needs`에 `"heat": "더위"`, `"mood": "기분"`, `ui`에 `"careDrink": "물 마시기"`.

`src/features/menus/CareMenu.tsx`:
- `NeedsView`의 `rows`를:
```tsx
  const extra = seasonalNeed(game)
  const rows: [string, number, boolean][] = [
    ['hunger', n.hunger, false],
    ['fatigue', n.fatigue, false],
    ...(extra ? [[extra, n[extra], false] as [string, number, boolean]] : []),
    ['mood', moodOf(game), true],
  ]
```
  (`const game = useGame((s) => s.game)`로 바꾸고 `n = game.needs`. 세 번째 값은 "높을수록 좋은가" — 기분 막대만 `good` 클래스를 붙이고 70 이상일 때 `high` 대신 `happy`를 붙인다.)
- `CareMenu`에 `const canDrink = n.heat >= 30 && (game.inv.water ?? 0) > 0`와 버튼 `{canDrink && <button onClick={drink}>{T.ui.careDrink}</button>}`, "돌볼 것 없음" 조건에 `!canDrink` 추가.

`src/store/game-store.ts`: `drink: () => void` 추가(`const next = drinkWater(get().game); if (next) set({ game: persist(next), modal: null })`), 자기 자신을 눌렀을 때 돌봄 창을 여는 조건에 `(n.heat >= 30 && (game.inv.water ?? 0) > 0)` 추가.

`src/render/renderer.ts`: 주인공 표정의 더위 줄(`weather === 'hot' && minute …`)을 `game.needs.heat >= 60 && t % 8 < 1.4`로 바꾼다.

`src/app/global.css`에 `.need-bar.good > div { background: #7aa84f; }`와 `.need-bar.happy > div { background: #d9b44a; }`.

- [ ] **Step 4: 통과 확인과 커밋**

Run: `npx tsc -b; npm test; npm run verify` → PASS (Needs 모양이 바뀌어 깨지는 기존 테스트는 `heat: 0`을 더해 고친다)
```powershell
git add -A
git commit -m @'
feat: 여름 더위와 기분 — 계절 칸, 물 마시기, 기분 좋으면 일이 빨라짐

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
'@
```

---

### Task 3: 텃밭

**Files:**
- Create: `src/engine/garden.ts`, `src/engine/garden.test.ts`, `src/features/garden/GardenMenu.tsx`
- Modify: `src/engine/types.ts` (`ItemId` 넷, `PlaceId` `garden`), `src/engine/world.ts` (텃밭 `l` 여덟 칸), `src/engine/game.ts` (`garden` 상태, 잠들 때 자라기, 씨앗 거래), `src/engine/items.ts` (`FOODS`에 콩), `src/engine/save.ts`, `src/render/renderer.ts` (`l`), `src/render/decor.ts` (작물 그림), `src/render/sprites.ts` (아이콘), `src/store/game-store.ts`, `src/features/ModalLayer.tsx`, `src/content/life-text.json`

**Interfaces:**
- Produces:
```ts
export type CropId = 'herb' | 'bean'
export interface Plot { crop: CropId; grown: number; wateredDay: number | null }
export const CROPS: Record<CropId, { seed: ItemId; days: number; gives: Partial<Record<ItemId, number>> }>
// herb: seedHerb, 3일, herb 2 · bean: seedBean, 4일, bean 3
export const GARDEN_TILES: readonly Tile[]            // (1,8) (2,8) (3,8) (4,8) (1,9) (2,9) (3,9) (4,9)
export type PlantBlock = 'winter' | 'taken' | 'noSeed' | null
export function canPlant(s, at: Tile, crop: CropId): PlantBlock
export function plant(s, at: Tile, crop: CropId): GameState | null
export function water(s, at: Tile): GameState | null       // 오늘 한 번, 10분
export function isRipe(p: Plot): boolean
export function harvest(s, at: Tile): GameState | null      // 다 자란 것만, 가방이 넘치면 null
export function growGarden(garden: Record<string, Plot>, day: number): Record<string, Plot>  // 잠들 때: 오늘 물 준 칸만 하루 자람
// GameState.garden: Record<string, Plot>   ('x,y' → Plot)
// ItemId: 'seedHerb' | 'seedBean' | 'herb' | 'bean'
```

- [ ] **Step 1: 실패하는 테스트**

`src/engine/garden.test.ts`:
```ts
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import { canPlant, CROPS, GARDEN_TILES, growGarden, harvest, isRipe, plant, water } from './garden'

const spot = GARDEN_TILES[0]
const k = `${spot.x},${spot.y}`
const withSeeds = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, inv: { ...s.inv, seedHerb: 2, seedBean: 1 } }
}

describe('텃밭', () => {
  it('여덟 칸', () => {
    expect(GARDEN_TILES).toHaveLength(8)
  })
  it('씨앗이 있어야 심고, 한 칸에 하나, 겨울엔 못 심는다', () => {
    const s = withSeeds()
    expect(canPlant(newGame(CONTENT), spot, 'herb')).toBe('noSeed')
    const t = plant(s, spot, 'herb')!
    expect(t.inv.seedHerb).toBe(1)
    expect(t.garden[k]).toEqual({ crop: 'herb', grown: 0, wateredDay: null })
    expect(canPlant(t, spot, 'bean')).toBe('taken')
    const winter = { ...s, clock: { ...s.clock, day: 3 * 28 + 1 } }
    expect(canPlant(winter, spot, 'herb')).toBe('winter')
  })
  it('물 준 날만 자라고, 다 자라면 거둔다', () => {
    let s = plant(withSeeds(), spot, 'herb')!
    for (let d = 0; d < CROPS.herb.days; d++) {
      expect(isRipe(s.garden[k])).toBe(false)
      s = water(s, spot)!
      expect(water(s, spot)).toBeNull() // 하루 한 번
      s = { ...s, garden: growGarden(s.garden, s.clock.day), clock: { ...s.clock, day: s.clock.day + 1 } }
    }
    expect(isRipe(s.garden[k])).toBe(true)
    // 물 안 준 날은 그대로
    expect(growGarden({ a: { crop: 'bean', grown: 1, wateredDay: 2 } }, 5).a.grown).toBe(1)
    const h = harvest(s, spot)!
    expect(h.inv.herb).toBe(2)
    expect(h.garden[k]).toBeUndefined()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/engine/garden.test.ts` → FAIL (`./garden` 없음)

- [ ] **Step 3: 구현**

`src/engine/types.ts`: `ItemId`에 `| 'seedHerb' | 'seedBean' | 'herb' | 'bean'`, `PlaceId`에 `| 'garden'`.

`src/engine/garden.ts`:
```ts
// 집 앞 텃밭 여덟 칸 (설계 §2.5). 씨앗을 심고, 날마다 물을 주면 자라고, 다 자라면 거둔다. 겨울엔 쉰다.
import { seasonOf } from './clock'
import type { GameState } from './game'
import { add, has, MAX_STACK, count, take } from './items'
import type { ItemId, Tile } from './types'

export type CropId = 'herb' | 'bean'
export interface Plot {
  crop: CropId
  grown: number
  wateredDay: number | null
}

export const CROPS: Record<CropId, { seed: ItemId; days: number; gives: Partial<Record<ItemId, number>> }> = {
  herb: { seed: 'seedHerb', days: 3, gives: { herb: 2 } },
  bean: { seed: 'seedBean', days: 4, gives: { bean: 3 } },
}

export const GARDEN_TILES: readonly Tile[] = [1, 2, 3, 4].flatMap((x) => [8, 9].map((y) => ({ x, y }))).sort((a, b) => a.y - b.y || a.x - b.x)

const keyOf = (t: Tile) => `${t.x},${t.y}`
const isPlot = (t: Tile) => GARDEN_TILES.some((g) => g.x === t.x && g.y === t.y)

export type PlantBlock = 'winter' | 'taken' | 'noSeed' | null
export function canPlant(s: Pick<GameState, 'clock' | 'garden' | 'inv'>, at: Tile, crop: CropId): PlantBlock {
  if (!isPlot(at)) return 'taken'
  if (seasonOf(s.clock.day) === 'winter') return 'winter'
  if (s.garden[keyOf(at)]) return 'taken'
  if (!has(s.inv, { [CROPS[crop].seed]: 1 })) return 'noSeed'
  return null
}

export function plant(s: GameState, at: Tile, crop: CropId): GameState | null {
  if (canPlant(s, at, crop)) return null
  return { ...s, inv: take(s.inv, { [CROPS[crop].seed]: 1 })!, garden: { ...s.garden, [keyOf(at)]: { crop, grown: 0, wateredDay: null } } }
}

export function water(s: GameState, at: Tile): GameState | null {
  const p = s.garden[keyOf(at)]
  if (!p || p.wateredDay === s.clock.day || isRipe(p)) return null
  return { ...s, garden: { ...s.garden, [keyOf(at)]: { ...p, wateredDay: s.clock.day } } }
}

export function isRipe(p: Plot): boolean {
  return p.grown >= CROPS[p.crop].days
}

export function harvest(s: GameState, at: Tile): GameState | null {
  const p = s.garden[keyOf(at)]
  if (!p || !isRipe(p)) return null
  const gives = CROPS[p.crop].gives
  if ((Object.entries(gives) as [ItemId, number][]).some(([id, n]) => count(s.inv, id) + n > MAX_STACK)) return null
  const garden = { ...s.garden }
  delete garden[keyOf(at)]
  return { ...s, inv: add(s.inv, gives), garden }
}

/** 잠들 때: 오늘 물 준 칸만 하루 자란다 */
export function growGarden(garden: Record<string, Plot>, day: number): Record<string, Plot> {
  return Object.fromEntries(Object.entries(garden).map(([k, p]) => [k, p.wateredDay === day && !isRipe(p) ? { ...p, grown: p.grown + 1 } : p]))
}
```
(물 주기·심기에 걸리는 시간과 피로는 store에서 `passTime`/`work`로 더한다 — `garden.ts`가 `game.ts` 값을 import하지 않게.)

`src/engine/game.ts`:
- `GameState`에 `/** 텃밭 ('x,y' → 작물) */ garden: Record<string, Plot>`, `newGame`에 `garden: {},`
- `goToSleep`의 `next` 객체에 `garden: growGarden(s.garden, s.clock.day),`
- `TRADES`에 `{ id: 'seedHerb', pay: {}, coins: 5, get: { seedHerb: 2 } }, { id: 'seedBean', pay: {}, coins: 4, get: { seedBean: 2 } },`
- `GIFTABLE`에 `'herb', 'bean'`

`src/engine/items.ts` `FOODS` 끝에 `['bean', 15]`.

`src/engine/save.ts` `sanitize` 반환에 `garden: s.garden ?? {},`.

`src/engine/world.ts`:
- 범례 막힘 줄에 `· l 텃밭`
- `build()`의 `set(7, 8, 'q')` 아래에 `rect(1, 8, 4, 9, 'l') // 집 앞 텃밭 여덟 칸`
- `BLOCKED`에 `'l'`
- `PLACES`에 `garden: { tiles: tilesOf('l') },` (`world.test.ts`에 `expect(PLACES.garden.tiles).toHaveLength(8)`)

`src/render/renderer.ts` `drawObject`에:
```ts
    case 'l':
      // 텃밭 흙두둑
      r('#8a6a4a', 1, 3, 14, 12)
      r('#735538', 1, 6, 14, 1)
      r('#735538', 1, 10, 14, 1)
      break
```
`src/render/decor.ts` `drawDecor` 끝에(작물은 상태를 보므로 여기서):
```ts
  // 텃밭 작물: 자란 만큼 키가 크고, 다 자라면 열매 색
  for (const [k, p] of Object.entries(game.garden ?? {})) {
    const [x, y] = k.split(',').map(Number)
    const ripe = p.grown >= (p.crop === 'herb' ? 3 : 4)
    const hgt = 3 + Math.min(p.grown, 4) * 2
    px(g, x, y, 7, 13 - hgt, 2, hgt, '#6d8747')
    if (p.grown >= 1) px(g, x, y, 5, 13 - hgt + 2, 6, 2, '#7aa84f')
    if (ripe) px(g, x, y, 6, 13 - hgt - 1, 4, 3, p.crop === 'herb' ? '#b8d27a' : '#c9b477')
    if (p.wateredDay === game.clock.day) px(g, x, y, 2, 13, 12, 2, '#5f503a')
  }
```
(`px` 시그니처가 다르면 파일 안의 기존 사용처에 맞춘다. 색은 차분한 파스텔 범위에서.)

`src/render/sprites.ts` `ICONS`에:
```ts
  seedHerb: ['........', '..kkkk..', '.kaaaak.', '.kaEaak.', '.kaaEak.', '.kaaaak.', '..kkkk..', '........'],
  seedBean: ['........', '..kkkk..', '.kaaaak.', '.kayaak.', '.kaayak.', '.kaaaak.', '..kkkk..', '........'],
  herb: ['...E....', '..EEE...', '.EEEEE..', '..EEE.E.', '...k.EEE', '...k..E.', '...k....', '........'],
  bean: ['........', '.yy.....', 'yYyy.yy.', '.yyyyYy.', '...yyyy.', '........', '........', '........'],
```
(`ICON_PALETTE`에 없는 글자(`E`, `a`)가 있으면 그 팔레트에 `E: '#6d8747', a: '#f1e6cf'`를 더한다.)

`src/content/life-text.json`:
- `items`에 `"seedHerb": { "name": "향초 씨앗", "desc": "텃밭에 심으면 사흘 만에 향초가 자랍니다." }, "seedBean": { "name": "콩 씨앗", "desc": "텃밭에 심으면 나흘 만에 콩을 거둡니다." }, "herb": { "name": "향초", "desc": "좋은 향이 나는 풀. 장날에 팔거나 선물합니다." }, "bean": { "name": "콩", "desc": "배를 조금 채워 줍니다." }`
- `trades`에 `"seedHerb": "향초 씨앗 2", "seedBean": "콩 씨앗 2"`
- `places`에 `"garden": "텃밭"`
- `ui`에 `"gardenTitle": "텃밭", "gardenEmpty": "빈 두둑", "gardenPlantHerb": "향초 심기", "gardenPlantBean": "콩 심기", "gardenWater": "물 주기", "gardenWatered": "오늘은 물을 주었어요.", "gardenGrowing": "{crop} · {n}/{all}일", "gardenHarvest": "거두기", "gardenWinter": "겨울엔 텃밭이 쉬어요.", "gardenNoSeed": "씨앗은 장날 상인에게 닢으로 살 수 있어요."`

`src/store/game-store.ts`:
- `Modal`에 `| { kind: 'garden'; at: Tile }`, `Store`에 `plantAt(at: Tile, crop: CropId)`, `waterAt(at: Tile)`, `harvestAt(at: Tile)`
- `arrive`의 switch에 `case 'garden': return { game, modal: { kind: 'garden', at: target.tile } }`
- 동작:
```ts
    plantAt: (at, crop) => {
      const next = plant(get().game, at, crop)
      if (!next) return
      sfx('place')
      set({ game: persist(passTime({ ...next, needs: work(next.needs, 2) }, 10)), modal: null })
    },
    waterAt: (at) => {
      const next = water(get().game, at)
      if (!next) return
      sfx('tap')
      set({ game: persist(passTime({ ...next, needs: work(next.needs, 2) }, 10)), modal: null })
    },
    harvestAt: (at) => {
      const before = get().game.inv
      const next = harvest(get().game, at)
      if (!next) return get().say(T.ui.bagFull)
      sfx('gift')
      toastGain(before, next.inv)
      set({ game: persist(passTime(next, 10)), modal: null })
    },
```
  (`passTime`은 game.ts, `work`는 needs.ts에서 import.)

`src/features/garden/GardenMenu.tsx`:
```tsx
// 텃밭 한 칸: 비었으면 심기, 자라는 중이면 물 주기, 다 자랐으면 거두기
import { fill, itemName, T } from '../../content/text'
import { canPlant, CROPS, isRipe } from '../../engine/garden'
import type { Tile } from '../../engine/types'
import { useGame } from '../../store/game-store'

export function GardenMenu({ at }: { at: Tile }) {
  const game = useGame((s) => s.game)
  const { plantAt, waterAt, harvestAt, closeModal } = useGame.getState()
  const p = game.garden[`${at.x},${at.y}`]
  const winter = canPlant(game, at, 'herb') === 'winter'
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.gardenTitle}>
      <h2>{T.ui.gardenTitle}</h2>
      {!p ? (
        winter ? (
          <p>{T.ui.gardenWinter}</p>
        ) : (
          <div className="actions menu column">
            <button disabled={canPlant(game, at, 'herb') !== null} onClick={() => plantAt(at, 'herb')}>
              {T.ui.gardenPlantHerb} ({itemName('seedHerb')} {game.inv.seedHerb ?? 0})
            </button>
            <button disabled={canPlant(game, at, 'bean') !== null} onClick={() => plantAt(at, 'bean')}>
              {T.ui.gardenPlantBean} ({itemName('seedBean')} {game.inv.seedBean ?? 0})
            </button>
            {(game.inv.seedHerb ?? 0) + (game.inv.seedBean ?? 0) === 0 && <p className="hint">{T.ui.gardenNoSeed}</p>}
          </div>
        )
      ) : isRipe(p) ? (
        <div className="actions menu column">
          <button className="primary" onClick={() => harvestAt(at)}>
            {T.ui.gardenHarvest} · {itemName(p.crop)}
          </button>
        </div>
      ) : (
        <>
          <p>{fill(T.ui.gardenGrowing, { crop: itemName(p.crop), n: p.grown, all: CROPS[p.crop].days })}</p>
          <div className="actions menu column">
            {p.wateredDay === game.clock.day ? <p className="hint">{T.ui.gardenWatered}</p> : <button onClick={() => waterAt(at)}>{T.ui.gardenWater}</button>}
          </div>
        </>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
```
`ModalLayer.tsx`: `case 'garden': return <GardenMenu at={modal.at} />`.

Run: `npx vitest run src/engine/garden.test.ts src/engine/world.test.ts` → PASS

- [ ] **Step 4: 화면 확인**

미리보기(5181, 다른 세션이 이미 띄웠으면 그 주소로 `navigate`)에서 집 앞 텃밭 칸을 눌러 창이 뜨는지, 씨앗을 `__gd.store`로 넣고 심기·물 주기가 되는지, 두둑·작물이 보이는지 본다. 스크린샷 한 장.

- [ ] **Step 5: 통과 확인과 커밋**

Run: `npx tsc -b; npm test; npm run verify` → PASS
```powershell
git add -A
git commit -m @'
feat: 집 앞 텃밭 — 향초와 콩, 물 준 날만 자람, 장날 씨앗

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
'@
```

---

### Task 4: 공방 판매와 직업 단계 보상

**Files:**
- Create: `src/engine/job.ts`, `src/engine/job.test.ts`
- Modify: `src/engine/requests.ts` (`jobLevel`을 job.ts로 옮기고 다시 내보내기, 직업별 수고비), `src/engine/items.ts` (표지 만들기), `src/engine/types.ts` (`cover`), `src/engine/game.ts` (팔기, 표지 제한, 닢 도구), `src/features/talk/TradeBoard.tsx`, `src/features/menus/PlaceMenu.tsx`, `src/features/play/Hud.tsx`, `src/store/game-store.ts`, `src/render/sprites.ts` (아이콘), `src/content/life-text.json`

**Interfaces:**
- Produces:
```ts
// job.ts (game.ts를 import하지 않는다)
export type JobLevel = 0 | 1 | 2 | 3
export function jobLevel(lettersDone: number, shelvedCount: number): JobLevel     // requests.ts에서 옮김
export function jobOf(s: Pick<GameState, 'lettersDone' | 'shelved'>): JobLevel
export const LETTER_BASE: Record<JobLevel, number>   // { 0: 12, 1: 18, 2: 24, 3: 30 }
export const SELL_FROM: JobLevel = 1                 // 마을 필사가부터 공방 제품을 판다
export const COVER_FROM: JobLevel = 2                // 제본 장인부터 표지를 만든다
// game.ts
export const SELL_PRICES: Partial<Record<ItemId, number>>  // ink 8, papyrus 6, cover 25, herb 6, bean 3
export type SellBlock = 'notMarket' | 'job' | 'none' | null
export function canSell(s: GameState, item: ItemId): SellBlock
export function sell(s: GameState, item: ItemId): GameState | null
// items.ts: RecipeId에 'cover' (작업대, papyrus 2 + wool 1 → cover 1, 40분, timing)
// requests.ts: letterPay(misses: number, level: JobLevel = 0): number   // LETTER_BASE[level] × (1 + 최대 0.5)
```

- [ ] **Step 1: 실패하는 테스트**

`src/engine/job.test.ts`:
```ts
import { CONTENT } from '../content/catalog'
import { canCraft, canSell, newGame, sell, TRADES, trade } from './game'
import { COVER_FROM, jobLevel, jobOf, LETTER_BASE, SELL_FROM } from './job'
import { letterPay } from './requests'

const marketDay = (s: ReturnType<typeof newGame>) => {
  let t = s
  const probe = TRADES.find((x) => x.id === 'goldLeaf')!
  while (trade({ ...t, coins: 999 }, probe) === null && t.clock.day < 30) t = { ...t, clock: { ...t.clock, day: t.clock.day + 1 } }
  return t
}

describe('직업 단계 보상', () => {
  it('단계와 수고비', () => {
    expect(jobLevel(10, 1)).toBe(1)
    expect(jobOf({ lettersDone: 30, shelved: { mk: 0, lk: 1 } })).toBe(2)
    expect(LETTER_BASE).toEqual({ 0: 12, 1: 18, 2: 24, 3: 30 })
    expect(letterPay(0, 0)).toBe(18)
    expect(letterPay(0, 2)).toBe(36)
    expect(letterPay(9, 1)).toBe(18)
  })
  it('마을 필사가부터 장날에 공방 제품을 팔고, 말씀 책은 팔 수 없다', () => {
    const s = marketDay({ ...newGame(CONTENT), inv: { ink: 2 } })
    expect(canSell(s, 'ink')).toBe('job')
    const village = { ...s, lettersDone: 10, shelved: { mk: 1 as const } }
    expect(SELL_FROM).toBe(1)
    expect(canSell(village, 'ink')).toBeNull()
    const sold = sell(village, 'ink')!
    expect(sold.coins).toBe(village.coins + 8)
    expect(sold.inv.ink).toBe(1)
    expect(canSell(village, 'goldLeaf')).toBe('none')
    expect(canSell({ ...village, clock: { ...village.clock, day: village.clock.day + 1 } }, 'ink')).toBe('notMarket')
  })
  it('표지는 제본 장인부터', () => {
    const s = { ...newGame(CONTENT), inv: { papyrus: 2, wool: 1 } }
    expect(COVER_FROM).toBe(2)
    expect(canCraft(s, 'cover')).toBe('job')
    expect(canCraft({ ...s, lettersDone: 30, shelved: { mk: 1 as const, lk: 1 as const } }, 'cover')).toBeNull()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/engine/job.test.ts` → FAIL

- [ ] **Step 3: 구현**

`src/engine/types.ts`: `ItemId`에 `| 'cover'`.

`src/engine/job.ts`:
```ts
// 직업 단계: 견습 필사가 → 마을 필사가 → 제본 장인 → 서고지기 (설계 §2.5)
// game.ts와 requests.ts가 함께 쓰므로 game.ts를 값으로 import하지 않는다.
import type { GameState } from './game'

export type JobLevel = 0 | 1 | 2 | 3

export function jobLevel(lettersDone: number, shelvedCount: number): JobLevel {
  if (shelvedCount >= 4) return 3
  if (lettersDone >= 30 && shelvedCount >= 2) return 2
  if (lettersDone >= 10 && shelvedCount >= 1) return 1
  return 0
}

export function jobOf(s: Pick<GameState, 'lettersDone' | 'shelved'>): JobLevel {
  return jobLevel(s.lettersDone, Object.keys(s.shelved).length)
}

/** 편지 대필 기본 수고비 (반듯하면 최대 1.5배) */
export const LETTER_BASE: Record<JobLevel, number> = { 0: 12, 1: 18, 2: 24, 3: 30 }
/** 마을 필사가부터 장날에 공방 제품을 판다 */
export const SELL_FROM: JobLevel = 1
/** 제본 장인부터 표지를 만든다 */
export const COVER_FROM: JobLevel = 2
```

`src/engine/requests.ts`:
- `JobLevel`·`jobLevel`을 지우고 `export { jobLevel, type JobLevel } from './job'`
- `letterPay` 교체:
```ts
/** 빗나간 수가 0이면 1.5배, 넷 이상이면 기본 수고비. 기본은 직업 단계마다 오른다 */
export function letterPay(misses: number, level: JobLevel = 0): number {
  const bonus = Math.max(0, 1 - misses / 4) * 0.5
  return Math.round(LETTER_BASE[level] * (1 + bonus))
}
```
- `finishLetter`에서 `letterPay(misses)` → `letterPay(misses, jobOf(s))`
- `LETTER_PAY` 상수는 `LETTER_BASE[0]`과 같으므로 `export const LETTER_PAY = LETTER_BASE[0]`로 남긴다(편지 창 문구가 쓴다 → 편지 창은 `LETTER_BASE[jobOf(game)]`로 바꾼다).
- 기존 `requests.test.ts`의 `letterPay` 기대값은 그대로 통과해야 한다(level 0).

`src/engine/items.ts`:
- `RecipeId`에 `| 'cover'`, `Recipe.at`은 그대로, `RECIPES`에 `cover: { id: 'cover', at: 'workbench', needs: { papyrus: 2, wool: 1 }, gives: { cover: 1 }, minutes: 40, minigame: 'timing' },`

`src/engine/game.ts`:
- `import { COVER_FROM, jobOf, SELL_FROM } from './job'`
- `CraftBlock`에 `'job'`, `canCraft` 첫 줄에 `if (id === 'cover' && jobOf(s) < COVER_FROM) return 'job'`
- 팔기:
```ts
/** 장날에 파는 것: 공방 제품과 텃밭 작물뿐 — 엮은 말씀 책·조각은 팔지 않는다 (exclusion-list §3-3) */
export const SELL_PRICES: Partial<Record<ItemId, number>> = { ink: 8, papyrus: 6, cover: 25, herb: 6, bean: 3 }

export type SellBlock = 'notMarket' | 'job' | 'none' | null
export function canSell(s: GameState, item: ItemId): SellBlock {
  if (SELL_PRICES[item] === undefined || count(s.inv, item) === 0) return 'none'
  if (!isMarketDay(s.clock.day)) return 'notMarket'
  if (jobOf(s) < SELL_FROM) return 'job'
  return null
}

export function sell(s: GameState, item: ItemId): GameState | null {
  if (canSell(s, item)) return null
  return { ...s, inv: take(s.inv, { [item]: 1 })!, coins: s.coins + SELL_PRICES[item]! }
}
```
- `TRADES`에 닢 도구: `{ id: 'goodPenCoins', pay: {}, coins: 40, get: { goodPen: 1 } }, { id: 'brightLamp', pay: {}, coins: 60, get: { brightLamp: 1 } },` (`trade`는 이미 가진 좋은 펜을 막는다 — 밝은 등잔도 같은 줄에 `|| (t.get.brightLamp && count(s.inv, 'brightLamp') > 0)`를 더한다)

`src/content/life-text.json`:
- `items`에 `"cover": { "name": "제본 표지", "desc": "천을 씌운 단단한 표지. 장날에 좋은 값에 팔립니다." }`
- `trades`에 `"goodPenCoins": "좋은 펜", "brightLamp": "밝은 등잔"`
- `recipes`에 `"cover": "제본 표지 — 종이 2 · 양털 1"` (기존 recipes 문구 모양에 맞춘다)
- `ui`에 `"workCover": "표지 누르기 (제본 장인부터)", "tradeBuy": "사기", "tradeSell": "팔기", "sellPrice": "{n}닢", "sellJob": "마을 필사가가 되면 팔 수 있어요.", "sellNone": "팔 것이 없어요."`

`src/render/sprites.ts` `ICONS`에 `cover: ['........', '.kkkkkk.', '.kVVVVk.', '.kVyyVk.', '.kVVVVk.', '.kVVVVk.', '.kkkkkk.', '........'],` (`V`·`y`가 `ICON_PALETTE`에 없으면 `V: '#7a5d97'`을 더한다).

`src/features/menus/PlaceMenu.tsx` 작업대에 버튼:
```tsx
            <button disabled={canCraft(game, 'cover') !== null} onClick={() => startCraft('cover')}>
              {T.ui.workCover}
            </button>
```
`src/features/mini/MiniGame.tsx` `RECIPE_ICON`에 `cover: 'cover'`.

`src/store/game-store.ts`: `sellItem: (item: ItemId) => void` —
```ts
    sellItem: (item) => {
      const next = sell(get().game, item)
      if (!next) return
      sfx('gift')
      set({ game: persist(next) })
    },
```

`src/features/talk/TradeBoard.tsx`: 위에 "사기 / 팔기" 두 탭(`useState<'buy' | 'sell'>('buy')`)을 두고, 팔기 탭은:
```tsx
        <ul className="trade-list">
          {(Object.keys(SELL_PRICES) as ItemId[]).map((id) => {
            const block = canSell(game, id)
            return (
              <li key={id}>
                <span className="trade-get">{itemName(id)} ({game.inv[id] ?? 0})</span>
                <span className="trade-pay">{fill(T.ui.sellPrice, { n: SELL_PRICES[id]! })}</span>
                <button disabled={block !== null} onClick={() => sellItem(id)}>
                  {T.ui.tradeSell}
                </button>
              </li>
            )
          })}
        </ul>
        {jobOf(game) < SELL_FROM && <p className="hint">{T.ui.sellJob}</p>}
```
  사기 탭은 기존 목록 그대로.

`src/features/play/Hud.tsx`: `jobLevel(…)` 대신 `jobOf(s.game)`.

- [ ] **Step 4: 통과 확인과 커밋**

Run: `npx tsc -b; npm test; npm run verify` → PASS
```powershell
git add -A
git commit -m @'
feat: 공방 제품 팔기, 직업 단계별 수고비, 제본 표지, 닢으로 사는 도구

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
'@
```

---

### Task 5: 새 이웃 넷 (편지 나르는 이웃 · 주막 주인 · 어부 · 제본 골목의 목수)

**Files:**
- Modify: `src/engine/types.ts` (`NeighborDef.joinsAtBooks`), `src/engine/game.ts` (이웃 거르기 두 곳, 이사 장면), `src/engine/world.ts` (집 넷, 보리밭 줄이기, 나무 하나 빼기), `src/engine/bonds.ts` (`VISIT_GIFTS`), `src/render/sprites.ts` (`Who`, 옷), `src/content/neighbors.json`, `src/content/life-text.json`
- Test: `src/engine/neighbors.test.ts`, `src/engine/world.test.ts`, `src/render/sprites.test.ts`

**Interfaces:**
- Consumes: `shelvedCount(s)` (game.ts, 다른 세션이 만듦)
- Produces:
```ts
NeighborDef.joinsAtBooks?: number   // 서고에 꽂힌 책이 이만큼이면 이사 온다 (joinsAt(마음 단계)과 따로)
// 장면 id `movedIn:<이웃 id>` — 권수로 이사 온 날 아침
// Who에 'postman' | 'innkeeper' | 'fisher' | 'carpenter'
```

- [ ] **Step 1: 지도 — 집 넷**

`src/engine/world.ts` `build()`:
- 보리밭 `rect(12, 25, 19, 30, 'y')` → `rect(12, 25, 17, 27, 'y')` (어부 집·주막 자리를 비운다)
- 나무 목록에서 `[21, 26]`을 뺀다(주막 자리)
- 남쪽 줄 끝(벌 치는 집 다음)에:
```ts
  // ── 새 이웃 (계획 2) ──
  roofed('postman', 12, 17, 16, 20, 14) // 편지 나르는 이웃
  rect(14, 21, 14, 22, ',')
  roofed('carpenter', 6, 19, 10, 22, 8) // 제본 골목의 목수 (문이 큰길에 바로 닿는다)
  roofed('innkeeper', 18, 25, 23, 28, 20) // 주막
  rect(20, 29, 20, 31, ',')
  roofed('fisher', 12, 28, 17, 31, 14) // 어부 (호숫가 길 위)
```
  (`roofed`가 앞벽 두 줄·지붕 줄을 채우고 `HOUSES`에 넣는다. 집 안 방은 이번에 만들지 않는다 — 문을 밟아도 들어가지 않는다.)

`world.test.ts`에:
```ts
it('새 이웃 집 넷은 문 앞이 걸을 수 있는 길과 이어진다', () => {
  for (const [id, door] of [['postman', { x: 14, y: 20 }], ['carpenter', { x: 8, y: 22 }], ['innkeeper', { x: 20, y: 28 }], ['fisher', { x: 14, y: 31 }]] as const) {
    expect(HOUSES.some((h) => h.id === id), id).toBe(true)
    expect(isWalkable({ x: door.x, y: door.y + 1 }), id).toBe(true)
  }
  expect(PLACES.field.tiles.length).toBe(18)
})
```
Run: `npx vitest run src/engine/world.test.ts src/engine/map-spots.test.ts` → PASS (지도 칸이 바뀌어 `map-spots.test.ts`가 깨지면, 깨진 이웃 자리가 보리밭이나 새 집 위인지 보고 가장 가까운 걸을 수 있는 칸으로 옮긴다 — 옮긴 것을 보고서에 적는다)

- [ ] **Step 2: 이웃 데이터**

`src/engine/types.ts` `NeighborDef`에:
```ts
  /** 서고에 꽂힌 책이 이만큼이면 이사 온다 */
  joinsAtBooks?: number
```
`src/content/neighbors.json` 끝에 넷을 더한다:
```json
  {
    "id": "postman", "role": "편지 나르는 이웃", "sprite": "postman", "door": { "x": 14, "y": 20 },
    "schedule": [
      { "from": 390, "tile": { "x": 14, "y": 21 }, "wet": { "x": 14, "y": 21 } },
      { "from": 450, "tile": { "x": 8, "y": 9 } },
      { "from": 600, "tile": { "x": 23, "y": 19 }, "wet": { "x": 14, "y": 21 } },
      { "from": 900, "tile": { "x": 16, "y": 9 } },
      { "from": 1080 }
    ],
    "likes": ["bread", "honey"],
    "help": { "minigame": "pick", "gives": { "papyrus": 1 } }
  },
  {
    "id": "innkeeper", "role": "주막 주인", "sprite": "innkeeper", "door": { "x": 20, "y": 28 }, "joinsAtBooks": 1,
    "schedule": [
      { "from": 420, "tile": { "x": 21, "y": 29 }, "wet": { "x": 21, "y": 29 } },
      { "from": 660, "tile": { "x": 26, "y": 19 }, "wet": { "x": 21, "y": 29 } },
      { "from": 840, "tile": { "x": 21, "y": 29 }, "wet": { "x": 21, "y": 29 } },
      { "from": 1260 }
    ],
    "likes": ["herb", "grapes"],
    "help": { "minigame": "pick", "gives": { "bread": 2 } }
  },
  {
    "id": "fisher", "role": "어부", "sprite": "fisher", "door": { "x": 14, "y": 31 }, "joinsAtBooks": 2,
    "schedule": [
      { "from": 330, "tile": { "x": 24, "y": 34 } },
      { "from": 600, "tile": { "x": 15, "y": 32 }, "wet": { "x": 15, "y": 32 } },
      { "from": 840, "tile": { "x": 22, "y": 18 }, "wet": { "x": 15, "y": 32 } },
      { "from": 1020 }
    ],
    "likes": ["bread", "herb"],
    "help": { "minigame": "timing", "gives": { "reed": 2 } }
  },
  {
    "id": "carpenter", "role": "제본 골목의 목수", "sprite": "carpenter", "door": { "x": 8, "y": 22 }, "joinsAtBooks": 3,
    "schedule": [
      { "from": 420, "tile": { "x": 9, "y": 23 }, "wet": { "x": 9, "y": 23 } },
      { "from": 720, "tile": { "x": 11, "y": 11 }, "wet": { "x": 9, "y": 23 } },
      { "from": 960, "tile": { "x": 9, "y": 23 }, "wet": { "x": 9, "y": 23 } },
      { "from": 1140 }
    ],
    "likes": ["oil", "grapes"],
    "help": { "minigame": "mash", "gives": { "olive": 2 } }
  }
```
(좌표는 작업 1 지도 기준. 걸을 수 없는 칸이면 `map-spots.test.ts`가 알려 준다 — 가장 가까운 걸을 수 있는 칸으로 옮기고 보고서에 적는다. 어부의 새벽 나루(24,34)는 나루 구역이 열린 뒤에만 이사 오므로 괜찮다.)

`src/engine/bonds.ts` `VISIT_GIFTS`에 `postman: { bread: 1 }, innkeeper: { bread: 2 }, fisher: { reed: 2 }, carpenter: { bird: 1 },`.

- [ ] **Step 3: 이사 규칙 (실패하는 테스트부터)**

`src/engine/neighbors.test.ts`에:
```ts
describe('서고 권수로 이사 오는 이웃', () => {
  it('주막 주인은 1권, 어부는 2권, 목수는 3권부터 마을에 보인다', () => {
    const at7 = (shelved: Partial<Record<Book, Grade>>) => {
      const s = { ...newGame(CONTENT), shelved }
      return settle(goToSleep(s, CONTENT), CONTENT)
    }
    const visible = (s: GameState) => Object.values(s.npcs).filter((n) => n.visible || n.goal !== null).map((n) => n.id)
    const none = at7({})
    expect(Object.keys(none.npcs)).toContain('postman')
    expect(neighborsPresent(none, CONTENT)).not.toContain('innkeeper')
    expect(neighborsPresent(at7({ mk: 1 }), CONTENT)).toContain('innkeeper')
    expect(neighborsPresent(at7({ mk: 1 }), CONTENT)).not.toContain('fisher')
    expect(neighborsPresent(at7({ mk: 1, lk: 0 }), CONTENT)).toContain('fisher')
    void visible
  })
  it('이사 온 날 아침에 소개 장면', () => {
    const s = { ...newGame(CONTENT), shelved: { mk: 1 as const } }
    expect(goToSleep(s, CONTENT).scenes).toContain('movedIn:innkeeper')
    const again = goToSleep(goToSleep(s, CONTENT), CONTENT)
    expect(again.scenes.filter((x) => x === 'movedIn:innkeeper')).toHaveLength(1)
  })
})
```
(`neighborsPresent`는 이 작업에서 `neighborsOfDay`를 바깥으로 꺼내 만든다 — 아래 Step 4. `Book`, `Grade`, `GameState`, `settle`, `goToSleep`, `newGame`, `CONTENT` import. 테스트 안의 쓰지 않는 `visible`은 지운다.)

Run: `npx vitest run src/engine/neighbors.test.ts` → FAIL

- [ ] **Step 4: 구현**

`src/engine/game.ts`:
- 이웃이 "아직 이사 오지 않음"을 판단하는 곳 두 군데(`goalContext`의 `special[d.id] = null` 줄, `neighborsOfDay`의 `.filter((n) => !n.joinsAt || level >= n.joinsAt)`)에 권수 조건을 더한다:
```ts
const notYet = (d: NeighborDef, level: number, books: number) => (d.joinsAt !== undefined && level < d.joinsAt) || (d.joinsAtBooks !== undefined && books < d.joinsAtBooks)
```
  `goalContext`: `for (const d of content.neighbors) if (notYet(d, level, shelvedCount(s))) special[d.id] = null`
  `neighborsOfDay(day, content, level, books = 0)`: `.filter((n) => !notYet(n, level, books))`, 부르는 곳(`goToSleep`, `chooseBook`)에서 `shelvedCount(s)`를 넘긴다.
- 테스트용 공개 함수:
```ts
/** 오늘 마을에 나와 조각을 건넬 수 있는 이웃 */
export function neighborsPresent(s: GameState, content: GameContent): string[] {
  return neighborsOfDay(s.clock.day, content, s.flags.villageLevel ?? 0, shelvedCount(s))
}
```
- `goToSleep`의 마을 단계 장면 아래에:
```ts
  // 서고 권수로 이사 오는 이웃: 처음 보이는 날 아침에 소개
  for (const d of content.neighbors)
    if (d.joinsAtBooks !== undefined && shelvedCount(s) >= d.joinsAtBooks && !flags[`movedIn:${d.id}`]) {
      flags[`movedIn:${d.id}`] = 1
      scenes.push(`movedIn:${d.id}`)
    }
```

`src/content/life-text.json`:
- `scenes`에:
```json
    "movedIn:innkeeper": { "title": "새 이웃", "lines": [{ "speaker": "innkeeper", "text": "장터 아래에 주막을 열었어요. 지나가다 쉬어 가요." }] },
    "movedIn:fisher": { "title": "새 이웃", "lines": [{ "speaker": "fisher", "text": "나루가 열려서 호숫가에 자리를 잡았어요. 잘 부탁해요." }] },
    "movedIn:carpenter": { "title": "새 이웃", "lines": [{ "speaker": "carpenter", "text": "큰길가에 공방을 냈어요. 책 표지 판자는 제게 맡겨요." }] },
```
- `neighbors`에 넷(모양은 기존 이웃과 같다):
```json
    "postman": {
      "offer": [{ "speaker": "postman", "text": "편지 나르다 들은 이야기가 있어요. 들려 드릴까요?" }],
      "idle": [{ "speaker": "postman", "text": "오늘도 바구니에 편지 넣어 두었어요." }, { "speaker": "postman", "text": "이 길은 눈 감고도 다녀요." }],
      "warm": [{ "speaker": "postman", "text": "필사가님 글씨는 받는 사람들이 다 좋아해요." }],
      "close": [{ "speaker": "postman", "text": "편지 받는 얼굴 보는 게 제일 좋아요. 필사가님 덕분이에요." }],
      "wet": [{ "speaker": "postman", "text": "비 오는 날엔 편지를 품에 안고 뛰어요." }],
      "visit": [{ "speaker": "postman", "text": "지나가다 들렀어요. 빵 하나 두고 갈게요." }],
      "help": { "label": "편지 나누기 돕기", "thanks": "덕분에 일찍 끝났어요. 종이 한 장 가져가세요." },
      "giftLiked": "와, 제가 좋아하는 거예요!",
      "giftPlain": "고마워요, 잘 먹을게요."
    },
    "innkeeper": {
      "offer": [{ "speaker": "innkeeper", "text": "손님들한테 전해 들은 이야기가 있어요. 한번 들어 보실래요?" }],
      "idle": [{ "speaker": "innkeeper", "text": "오늘 국은 콩을 넣고 끓였어요." }, { "speaker": "innkeeper", "text": "장날엔 발 디딜 틈이 없어요." }],
      "warm": [{ "speaker": "innkeeper", "text": "지친 얼굴이네요. 앉아서 물 한 잔 하고 가요." }],
      "close": [{ "speaker": "innkeeper", "text": "필사가님 자리는 늘 창가로 비워 둬요." }],
      "wet": [{ "speaker": "innkeeper", "text": "비 오면 손님이 더 들어요. 다들 쉬어 가거든요." }],
      "visit": [{ "speaker": "innkeeper", "text": "국 끓이고 남은 빵이에요. 식기 전에 드세요." }],
      "help": { "label": "상 차리기 돕기", "thanks": "손이 빠르시네요! 빵 두 개 가져가요." },
      "giftLiked": "어머, 이거 좋아해요! 국에 넣어야겠어요.",
      "giftPlain": "고마워요."
    },
    "fisher": {
      "offer": [{ "speaker": "fisher", "text": "그물 손질하며 들은 이야기가 있어요. 들려 드릴게요." }],
      "idle": [{ "speaker": "fisher", "text": "아침 물빛이 제일 고와요." }, { "speaker": "fisher", "text": "그물은 날마다 기워야 해요." }],
      "warm": [{ "speaker": "fisher", "text": "오늘은 물이 잔잔해서 좋네요." }],
      "close": [{ "speaker": "fisher", "text": "필사가님이랑 얘기하면 바람이 잦아드는 것 같아요." }],
      "wet": [{ "speaker": "fisher", "text": "비 오는 날엔 배를 묶어 두고 그물을 기워요." }],
      "visit": [{ "speaker": "fisher", "text": "갈대 한 단 베어 왔어요. 종이 만드실 때 쓰세요." }],
      "help": { "label": "그물 기우기 돕기", "thanks": "매듭이 단단하네요. 갈대 좀 가져가세요." },
      "giftLiked": "이거 좋아해요. 배 위에서 먹어야겠어요.",
      "giftPlain": "고마워요."
    },
    "carpenter": {
      "offer": [{ "speaker": "carpenter", "text": "대패질하다 들은 이야기가 있어요. 들어 보실래요?" }],
      "idle": [{ "speaker": "carpenter", "text": "나무 냄새가 좋지요?" }, { "speaker": "carpenter", "text": "표지 판자는 결을 잘 봐야 해요." }],
      "warm": [{ "speaker": "carpenter", "text": "선반이 모자라면 말해요. 하나 짜 드릴게요." }],
      "close": [{ "speaker": "carpenter", "text": "필사가님 책이 꽂힐 선반이라 생각하면 더 정성이 들어가요." }],
      "wet": [{ "speaker": "carpenter", "text": "비 오는 날엔 나무가 뒤틀려서 쉬어요." }],
      "visit": [{ "speaker": "carpenter", "text": "자투리 나무로 작은 새를 깎았어요." }],
      "help": { "label": "나무 나르기 돕기", "thanks": "든든하네요. 올리브 좀 가져가요." },
      "giftLiked": "오, 이거 좋지요!",
      "giftPlain": "고마워요."
    },
```
- 이웃 이름이 쓰이는 다른 표(예: `T.ui.zones`, 일정 창 이웃 목록, `NEIGHBOR_LINES`를 도는 곳)가 있으면 넷을 더한다. `npm run verify`로 금지어를 확인한다.

`src/render/sprites.ts`:
- `Who`에 `| 'postman' | 'innkeeper' | 'fisher' | 'carpenter'`
- `PALETTE`에 `t: '#5b7fa3', T: '#46668a', // 편지 나르는 이웃` · `d: '#a3563f', D: '#84432f', // 주막 주인` · `o: '#4f8a8b', w: '#3d6e6f', // 어부` · `l: '#b08850', m: '#8d6a3a', // 목수` (이미 쓰는 글자와 겹치면 비어 있는 글자로 바꾼다)
- `dressNeighbor`에:
```ts
    case 'postman': {
      // 푸른 겉옷, 어깨에 멘 편지 가방 끈
      const out = recolor(rows, { r: 't', R: 'T', b: 'a' })
      for (let y = 7; y <= 10; y++) setPixel(out, 2 + (y - 7), y, 'L')
      return out
    }
    case 'innkeeper':
      // 붉은 겉옷, 흰 앞치마
      return recolor(rows, { r: 'd', R: 'D', b: 'a' })
    case 'fisher': {
      // 청록 겉옷, 밀짚 머릿수건
      const out = recolor(rows, { h: 'e', r: 'o', R: 'w', b: 'e' })
      return out
    }
    case 'carpenter':
      // 나무색 작업복, 가죽 띠
      return recolor(rows, { h: 'L', r: 'l', R: 'm', b: 'L' })
```
- `sprites.test.ts`의 `PEOPLE` 목록에 넷을 더한다(모든 이웃 스프라이트 모양 검사).

- [ ] **Step 5: 통과 확인, 화면 확인, 커밋**

Run: `npx tsc -b; npm test; npm run verify` → PASS
미리보기에서 `__gd.store`로 `shelved`를 `{mk:1, lk:1}`로 두고 하룻밤 재운 뒤, 새 집 넷과 이웃(편지 나르는 이웃·주막 주인·어부)이 보이는지 스크린샷. 목수는 3권이라 아직 안 보이는 게 맞다.
```powershell
git add -A
git commit -m @'
feat: 새 이웃 넷 — 편지 나르는 이웃, 주막 주인(1권), 어부(2권), 제본 골목의 목수(3권)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
'@
```

---

### Task 6: 생활 한 바퀴 확인과 사용자 보고

**Files:** 없음(고칠 것이 나오면 해당 파일)

- [ ] **Step 1: 전체 검사**

Run: `npx tsc -b; npm test; npm run verify; npm run build` → 모두 통과

- [ ] **Step 2: 화면에서 한 바퀴 (휴대폰 크기)**

1. 새 게임 → 텃밭에 향초 심기(씨앗은 장날에 닢으로) → 물 주기 → 사흘 뒤 거두기
2. 여름 날짜로 옮겨(`__gd.store`로 `clock.day`를 29~56 사이 맑은 날 정오) 바깥에서 더위가 오르고, 계절 칸 이름이 "더위"인지, 물 마시기로 식는지
3. 가구를 놓아 기분 막대가 70을 넘으면 편지 대필 시간이 30분으로 주는지
4. 자기 전 구절 읽고 잠 → 다음 날 상단에 "평안"
5. 편지 10통 + 서고 1권 → 마을 필사가, 장날 "팔기" 탭에서 잉크 팔기
6. 서고 1·2권 → 주막 주인·어부 이사 장면
7. 콘솔 오류 없음

- [ ] **Step 3: 사용자 보고**

스크린샷과 함께 한국어로: 만든 것, 수치(씨앗 값·작물 값·수고비·기분 기준)가 적당한지 해 보고 알려 달라는 부탁, 남은 것(집 넓히기와 집 안 화면, 새 이웃의 집 안 방, 복음서 방 완성 잔치는 마태·요한 콘텐츠 뒤).
