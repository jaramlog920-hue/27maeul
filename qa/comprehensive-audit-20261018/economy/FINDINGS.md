# Economy / progression independent audit — 2026-10-18

Scope: production engine modules listed in `coverage.csv`; desk, passage, library, cooking, garden, work, quiz, review, newland, village, stall, mini, skills, journey, word, meetings and fest UI. Existing production source, tests, configuration and data were not modified. Only this audit directory was created. No production data, outgoing service call, payment or deletion was tested.

## Reproduced findings (initial run: 3 / 3 passed)

### E-01 — Medium — Preview herb tea loses paid materials on reload

- Type: data loss / feature unlock and persistence conflict.
- Locations: `src/engine/cooking.ts:98` permits an untaught `herbTea` in preview; `:115`–`:120` consumes ingredients and starts a run; `:375` restores only `knownDish` runs. `src/engine/feature-rules.ts:16` defines preview at 15 chapters, full at 18. `src/features/cooking/CookingView.tsx:201` exposes the preview herb tea in the menu.
- Cause: the runtime eligibility exception is absent from the save sanitizer.
- Reproduction: create a normal current-version world with 15 completed NT chapters, herb 1 and water 1, no learned tea; start herb tea; serialize and deserialize before finishing.
- Observed: `canCook === null`; the started run is `herbTea`; both ingredients reach zero; loaded state has `cooking.run === undefined`, inventory `{}`, and no tea. The player cannot resume or reclaim materials.
- Verified: actual production start/save/load functions in `economy-audit.test.ts`; logged `COOKING_REPRO`.
- Affected: cooking preview, manual save, auto save, refresh and reconnect.
- Recommendation: retain a legitimately started preview run independently of whether the recipe is learned, or persist the preview authorization with the paid run. Align runtime and sanitizer invariants.

### E-02 — Medium — Multiple workshop owners are resolved as the primary player child

- Type: feature conflict / wrong owner, reward and daily state.
- Locations: `src/engine/kid-work.ts:44`–`:61` offers independent player siblings and resident children; `src/features/newland/BuildMenu.tsx:82`–`:99` selects owner; `src/engine/newland-life.ts:214`–`:223` accepts no building/owner and uses `s.child` plus the first completed workshop; `src/features/newland/FacilityView.tsx:140`–`:158` and `:373` name the primary child; `src/render/renderer.ts:2140`–`:2142` also draws only the first workshop's child.
- Cause: construction was widened to multiple owners, while visit, rendering and resource flags still implement a single primary child.
- Reproduction: primary player child is a cook; sibling born day 2 is a painter; the only completed `kidWork` has owner `me:2`; visit that workshop.
- Observed: `ownerJob(..., 'me:2') === 'painter'`, but `visitKidWork` returns `bread`, derived from primary child cook. With no primary child, visit returns null despite a completed owned workshop.
- Verified: actual production owner resolver and visit handler in `economy-audit.test.ts`; logged `WORKSHOP_REPRO`. End-to-end workshop render not browser tested.
- Affected: sibling and resident children's workshops, owner labels, gifts, daily visit state, milestones.
- Recommendation: carry building ID/owner through facility interaction, resolve the owner from player siblings or generation people, and scope daily visit/milestone state to that owner/building. Render every eligible workshop owner.

### E-03 — Low — Simulated other-village score decreases despite monotonic rule

- Type: calculation / rank consistency.
- Location: `src/engine/villages.ts:24`–`:28`.
- Cause: independently reseeded daily wobble can fall farther than the minimum daily rate rises.
- Reproduction: `villageScores(20261007, 7)[4]` and `villageScores(20261007, 8)[4]` (갈대울).
- Observed: 14 → 13. This contradicts the function's stated rule that scores never decrease; it can move comparison/rank results backward.
- Verified: deterministic production calculation in `economy-audit.test.ts`; logged `VILLAGE_SCORE_DECREASE`.
- Recommendation: calculate accumulated nonnegative increments, or use a deterministic monotonic formula. This is low impact; no player progress is deleted.

## Broadened run — 7 / 7 passed, 134.67 seconds

The initial three probes and the following four passed using the same command. The jsdom canvas warning only says canvas rendering is unavailable; the React events and production store assertions passed.

### E-04 — Medium — Identical word tiles reject a visually correct choice

- Type: functional / duplicate input ambiguity.
- Locations: `src/features/desk/CopyPuzzle.tsx:39`, `src/engine/copy-ways.ts:62`–`:79`.
- Cause: the UI checks `i === step`, the original token index, instead of text equality. Equal tokens have indistinguishable buttons, but only one is accepted.
- Reproduction: generate Matthew 1:2 tiles at level 3, seed 0. Remaining `pieces` include `낳고` at indices 2 and 7. Correctly advance through the first two words, then click the index-7 `낳고` button.
- Observed: the puzzle receives a smudge/wrong state even though `낳고` is the expected visible word. No completion callback is called.
- Verified: actual `tilesFor` plus mounted `CopyPuzzle` in jsdom; logged `DUPLICATE_TILE_REPRO`. No earlier report's corpus percentages are reused.
- Affected: tile transcription for passages with repeated words; hints let the player eventually proceed.
- Recommendation: accept equivalent remaining token text and consume the chosen index, or canonicalize equivalent token identity.

### E-05 — Medium — Next-verse click during IME composition leaks late text into next verse

- Type: asynchronous input ordering / mobile IME draft corruption.
- Locations: `src/features/desk/CopyDesk.tsx:693`–`:698` `finish`, `:787` button, `:853`–`:857` composition end. Keyboard Enter defers via `wantEnter`, while button bypasses that guard.
- Reproduction: open Matthew 1:1 in direct-write mode, fire composition start, enter the complete target while composition remains active, click “다음 절 ↵”, then deliver late composition end with `아`.
- Observed: verse 1 is recorded immediately; the UI advances to verse 2; late `아` becomes verse-2 saved draft. Actual test logs `COMPOSITION_RACE_REPRO {verse:2,draft:'아'}`.
- Verified: mounted `CopyDesk`, React events and actual Zustand store/engine in jsdom. Real mobile browsers may emit different composition-end values, so device frequency is unverified.
- Affected: direct transcription on Korean IME, next-verse button and auto saved drafts.
- Recommendation: defer button finish during composition, clear composition state on verse transitions, and bind callbacks to the originating verse key.

### E-06 — Medium — Reload discards travel board and cost, allowing outcome reroll

- Type: state persistence / random outcome and cost bypass.
- Locations: `src/store/game-store.ts:1466`–`:1474`; `src/features/trip/TripScene.tsx:77` initializes `NEW_BOARD`; `:187`–`:192` obtains fresh RNG; `src/engine/game.ts:3280`–`:3295` charges only on completed return.
- Reproduction: morning day 20 with 1,000 coins, take the normal unlocked travel action to harbor, roll; save/reload before return; reenter travel.
- Observed: departure has not changed persistent `game`; loaded state remains day 20 / 1,000 coins, store load clears `trip`, and a new board can use a different random roll (controlled RNG seeds produced 4 versus 6). The in-progress board and outcome are absent from serialized state.
- Verified: actual departure, serialize/deserialize, store load, reentry and production board rules. This test simulates reload through the same load API, not a live browser reload. New `Math.random` outcomes after a browser reload follow from the production RNG source.
- Affected: travel rewards, rare chest attempts, extra-turn payment, time and food costs.
- Recommendation: persist trip session and RNG/board state at departure, or deterministically seed trip outcomes by saved world/day/destination; commit departure cost or escrow before outcomes are exposed.

### E-07 — Medium — Trip-generated morning rank popup is never shown

- Type: feature integration / lost notification.
- Locations: `src/store/game-store.ts:1910`–`:1919` sets only passage/null; ordinary sleep at `:2595` opens rank/farewell; `src/engine/game.ts:3011`–`:3040` creates rank popup.
- Reproduction: current world with rank unlocked, day 20 morning, enough fare; finish harbor travel and return the next morning.
- Observed: state contains `rankPopup.day === 21`, but modal is `passage` for the travel fragment, so the rank update is not selected. Logged `TRIP_RANK_REPRO {popupDay:21,modal:'passage'}`. The next sleep clears pending morning popup fields; that clearing is code-checked, not separately asserted in this probe.
- Verified: actual `goTrip`, `takeTrip` and morning processing in production store/engine. Root checks modal fallback behavior.
- Affected: seasonal rank results after travel. Farewell uses the same missing branch, but was not independently runtime reproduced here; label that extension as code analysis.
- Recommendation: centralize morning modal routing for sleep, travel and ending paths; queue rank/farewell after travel fragment/scenes.

An additional full-bag tool-purchase probe is running; do not count it as verified until its output is recorded.

## Prior report issues not accepted as confirmed bugs

- Unlimited `nightCopy`: current production comment explicitly allows no time/material eligibility requirement (`game.ts:3324`), and `more-scripture.test.ts` expects repeated copies and no inventory requirement. Repeated operation is an intent-sensitive design question, not sufficient bug evidence.
- Crafted fruitBowl / dryFlowers resale: current `FURNITURE_PRICES` branch deliberately implements resale based on furniture retail; `economy-prices.test.ts` explicitly tests retail/2 and no purchase-resale arbitrage. Production values are reproducible, but profitability alone is not evidence of a defect. Do not count the prior report's pricing claim as a confirmed bug.
- Trip action callable without UI prechecks: regular TravelView disables departure using `canTrip`. Directly invoking exported store methods bypassing normal UI is not by itself a user-reachable bug; the reload/reroll path is separately tested.

## Test execution

Command: `node node_modules/vitest/vitest.mjs run --config qa/comprehensive-audit-20261018/economy/vitest.config.ts --reporter verbose`.

- Initial sandbox launch: infrastructure error `spawn EPERM` inside Vite Windows safe realpath helper; runner fallback: dependency `require is not defined`. Neither is a production failure.
- Approved escalation allowed isolated test runtime. A harness-only incorrect import-depth typo was fixed before the actual tests ran.
- Initial actual run: 1 file passed, 3 tests passed; 48.33 seconds. Cooking loss, workshop owner mismatch and score decrease reproduced.
- Broadened run: 1 file passed, 7 tests passed; 134.67 seconds. Root runs existing tests, type check, content checks and build, so these are not duplicated by this subagent.

## Coverage and limitations

- `coverage.csv` lists exact assigned engine files and review depth. All assigned engine modules were read, with sanitizers and UI caller checks where applicable; targeted runtime verification is limited to the described cases. Most assigned UI production components have been read; outstanding UI files are explicitly marked.
- Source inspection is not proof that a feature has no bugs. No claim is made that all bugs were found.
- Full browser tests and real mobile IME / speech recognition / audio / physical keyboard behavior were not performed by this subagent. UI probes use jsdom with actual React components and production store.
- General persistence, cross-tab concurrency, system time loop, render infrastructure and social/generation rules are audited by other agents. Related call sites were checked here for resource/reward reachability.

