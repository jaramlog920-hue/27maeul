// 자동 점검기 (2026-10-13): 사람이 걸어 다니며 찾던 버그를 규칙으로 바꿔 한꺼번에 찾는다.
// 평소 `npm test`에서는 건너뛴다. 돌리기: AUDIT=1 npx vitest run src/audit
// 결과는 docs/audits/invariants-latest.md 에 쓴다 (실패로 멈추지 않고 모두 모은다).
import { writeFileSync, mkdirSync } from 'node:fs'
import { CONTENT } from '../content/catalog'
import { peopleData, whenMatches, inWindow, type When, type Req, type Moment } from '../engine/people'
import { canGiveBouquet, canGiveCord, canTravel, nameChild, startCopy, writeVerse, chooseInEvent, eventNow, eventWaiting, finishStoryMini, GIFTABLE, giveBouquet, giveCord, giveGift, goToSleep, greetNeighbor, heartUp, newGame, openEvent, putAway, sightingWaiting, tick, travel, weddingToday, WEDDING_GATHER, type GameState } from '../engine/game'
import { establishedGame } from '../engine/growth-test-support'
import { canDate, goOnDate, sceneSeen } from '../engine/game'
import { DATE_COUNT_FLAG, FULL_HEART_DATING_DAYS, type DatePlace } from '../engine/romance'
import { FIRE } from '../engine/neighbors'
import { FESTIVAL_FROM, FESTIVAL_TO, festivalOf } from '../engine/calendar'
import { CHILD_AFTER_WEDDING } from '../engine/child'
import { count, take } from '../engine/items'
import { answerConsult, consultFor, helpPrep, PREP_GAIN, PREP_TASKS, preparingFor } from '../engine/gen-marriage'
import { cribAskOf, cribAsker, CRIB_NEEDS, giveCrib } from '../engine/gen-birth'
import { bakerCribWaiting, makeBakerCrib } from '../engine/baker-baby'
import { stageByAge } from '../engine/gen-age'
import { ADULT_AT } from '../engine/child'
import { askBaby, babyBlock, nameSibling } from '../engine/siblings'
import { canOrder, orderBuild } from '../engine/newland-build'
import { BUILD_RECT } from '../engine/newland-config'
import { copySpot } from '../engine/copying'
import { ensureOtBook } from '../content/ot-catalog'
import { npcTile } from '../engine/neighbors'
import { walkableOn, key } from '../engine/world'
import { deserialize, serialize } from '../engine/save'
import { seasonOf } from '../engine/clock'
import { weatherOf } from '../engine/calendar'
import type { Tile } from '../engine/types'
import { FACILITY_IDS } from '../engine/village-sites'

const DATE_PLACES = Object.keys(DATE_COUNT_FLAG) as DatePlace[]

const RUN = !!process.env.AUDIT
const DAYS = Number(process.env.AUDIT_DAYS ?? 28)
/** 후반 생활은 한 해(160일)를 통째로 — 아이가 어른이 되고(84일) 주민이 결혼·출생·은퇴하는 데까지 */
const LATE_DAYS = Number(process.env.AUDIT_LATE_DAYS ?? 160)
/** 후반 생활이 날마다 옮겨 적는 구약 책 (차례로) */
const OT_PLAN = ['rut', 'oba', 'jon'] as const

interface Finding { rule: string; level: '높음' | '중간' | '확인'; where: string; detail: string }
const found: Finding[] = []
const add = (f: Finding) => found.push(f)

// ── 자료 훑기: 때(when)·자리(at)·조건(req)이 달린 모든 것 ──
interface Item { kind: string; npc: string; id: string; when?: When; at?: Tile; req?: Req; with?: string[] }
function items(): Item[] {
  const d = peopleData()
  const out: Item[] = []
  for (const p of Object.values(d.people)) {
    p.routines.forEach((r, i) => out.push({ kind: '일과', npc: p.id, id: `${p.id}#${i}`, when: r.when, at: r.at, req: r.req, with: r.with ? [r.with] : undefined }))
    p.offDays?.routines.forEach((r, i) => out.push({ kind: '쉬는날 일과', npc: p.id, id: `${p.id}#off${i}`, when: r.when, at: r.at, req: r.req, with: r.with ? [r.with] : undefined }))
    for (const e of p.events ?? []) out.push({ kind: '이야기', npc: p.id, id: e.id, when: e.when, at: e.at, req: e.req, with: e.with })
    for (const w of p.sightings ?? []) out.push({ kind: '목격', npc: p.id, id: w.id, when: w.when, at: w.at, req: w.req })
    for (const l of p.lines) out.push({ kind: '말', npc: p.id, id: l.id, when: l.when, req: l.req })
  }
  for (const t of d.threads) t.phases.forEach((ph, pi) => {
    for (const [npc, rs] of Object.entries(ph.routines ?? {})) rs.forEach((r, i) => out.push({ kind: '사건 일과', npc, id: `${t.id}/${pi}/${npc}#${i}`, when: r.when, at: r.at, req: r.req }))
    for (const w of ph.sightings ?? []) out.push({ kind: '사건 목격', npc: w.npc, id: w.id, when: w.when, at: w.at, req: w.req })
  })
  return out
}

// 플레이어가 깨어 있을 수 있는 시각: 06:00 ~ 다음 날 02:00 (그 뒤엔 시간이 멈추고, 자면 06:00)
const PLAY_FROM = 6 * 60, PLAY_TO = 26 * 60

/** 실제 달력(두 해)에 나오는 요일·계절·날씨 조합 */
function calendarMoments(): Omit<Moment, 'minute'>[] {
  const seen = new Map<string, Omit<Moment, 'minute'>>()
  for (let day = 1; day <= 320; day++) {
    const m = { day: day % 7, season: seasonOf(day), weather: weatherOf(day) }
    seen.set(`${m.day}|${m.season}|${m.weather}`, m)
  }
  return [...seen.values()]
}

function canEverHappen(w: When | undefined, combos: Omit<Moment, 'minute'>[]): { time: boolean; calendar: boolean } {
  if (!w) return { time: true, calendar: true }
  let time = false
  for (let m = PLAY_FROM; m < PLAY_TO && !time; m += 5) if (inWindow(m, w.from, w.to)) time = true
  const noTime = { ...w, from: undefined, to: undefined }
  const calendar = combos.some((c) => whenMatches(noTime, { ...c, minute: 0 }))
  return { time, calendar }
}

const fmt = (m?: number) => (m === undefined ? '-' : `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)

function staticChecks() {
  const all = items()
  const combos = calendarMoments()
  const d = peopleData()
  const eventIds = new Set<string>(), sightIds = new Set<string>(), stories = new Set<string>()
  for (const p of Object.values(d.people)) {
    for (const e of p.events ?? []) { eventIds.add(e.id); if (e.completes) stories.add(e.completes) }
    for (const w of p.sightings ?? []) sightIds.add(w.id)
  }
  for (const t of d.threads) for (const ph of t.phases) for (const w of ph.sightings ?? []) sightIds.add(w.id)
  // 마을 공동 시설은 사건이 아니라 완공 표식(story:village:<id>)으로 끝난다
  for (const id of FACILITY_IDS) stories.add(`village:${id}`)
  const threads = new Set(d.threads.map((t) => t.id))
  const people = new Set(Object.keys(d.people))
  const known = (id: string) => eventIds.has(id) || sightIds.has(id)

  for (const it of all) {
    const where = `${it.kind} ${it.id} (${it.npc})`
    // 규칙 1: 플레이어가 볼 수 없는 시각·날
    const ever = canEverHappen(it.when, combos)
    if (!ever.time) add({ rule: '1 볼 수 없는 시각', level: '높음', where, detail: `${fmt(it.when?.from)}~${fmt(it.when?.to)} — 플레이어는 06:00~02:00에만 깨어 있음` })
    if (!ever.calendar) add({ rule: '1 볼 수 없는 날', level: '높음', where, detail: `요일·계절·날씨 조합이 달력에 없음: ${JSON.stringify({ ...it.when, from: undefined, to: undefined })}` })
    // 규칙 2: 서 있을 자리가 걸을 수 없는 칸
    if (it.at && !walkableOn('village', it.at)) add({ rule: '2 막힌 자리', level: '중간', where, detail: `(${it.at.x},${it.at.y})는 걸을 수 없는 칸` })
    // 규칙 3: 없는 사건·이야기·사람을 가리킴
    const r = it.req
    if (r) {
      for (const id of [...(r.seen ?? []), ...(r.notSeen ?? []), ...(r.seenAny ?? []), ...(r.after ? [r.after.event] : [])])
        if (!known(id)) add({ rule: '3 없는 것을 가리킴', level: '높음', where, detail: `조건의 사건 '${id}'가 없음` })
      for (const s of [...(r.story ?? []).map((x) => x.id), ...(r.notStory ?? [])])
        if (!stories.has(s)) add({ rule: '3 없는 것을 가리킴', level: '높음', where, detail: `조건의 이야기 '${s}'를 끝내는 사건이 없음` })
      if (r.thread && !threads.has(r.thread.id)) add({ rule: '3 없는 것을 가리킴', level: '높음', where, detail: `마을 사건 '${r.thread.id}'가 없음` })
      if (r.seen?.includes(it.id) || r.after?.event === it.id) add({ rule: '3 스스로를 조건으로', level: '높음', where, detail: '자기 자신을 먼저 봐야 열림' })
    }
    for (const w of it.with ?? []) if (!people.has(w)) add({ rule: '3 없는 것을 가리킴', level: '높음', where, detail: `함께할 사람 '${w}'가 없음` })
  }
}

// ── 시뮬레이션: 실제 엔진으로 며칠을 돌린다 ──
function unlocked(s: GameState, heart: number, late = false): GameState {
  const ids = CONTENT.neighbors.map((n) => n.id)
  if (late) return { ...s, scenes: [], notebook: { ...s.notebook, met: ids }, flags: { ...s.flags, villageLevel: 10, newlandGift: s.flags.newlandGift ?? 1, ...Object.fromEntries(ids.map((id) => [`movedIn:${id}`, 1])) } }
  return {
    ...s,
    scenes: [],
    notebook: { ...s.notebook, met: ids },
    flags: { ...s.flags, villageLevel: 10, ...Object.fromEntries(ids.map((id) => [`movedIn:${id}`, 1])) },
    hearts: heart ? Object.fromEntries(ids.map((id) => [id, heart])) : s.hearts,
    // 구역(포도원·나루·벌통 들·대장간)이 모두 열린 중반 마을
    shelved: { ...s.shelved, ...Object.fromEntries(['mat', 'mrk', 'luk', 'jhn', 'act', 'rom'].map((b) => [b, 1])) },
  }
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** 칸 순서와 상관없이 같은 값이면 같은 글 */
const canon = (v: any): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x))

/** 두 값의 다른 곳을 깊이까지 (경로: 앞 → 뒤) */
function deepDiff(a: any, b: any, path: string, out: string[]): string[] {
  if (out.length >= 6 || canon(a) === canon(b)) return out
  if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) deepDiff(a[k], b[k], `${path}.${k}`, out); return out }
  out.push(`${path}: ${JSON.stringify(a)?.slice(0, 100)} → ${JSON.stringify(b)?.slice(0, 100)}`)
  return out
}

const near = (a: Tile, b: Tile, d: number) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d

/** 후반 생활: 신약 27권을 다 마치고(서고 가득·모든 기능 열림) 아이방까지 넓힌 집에서 시작 */
function lateStart(): GameState {
  const s = establishedGame(CONTENT, 27)
  const books = Object.keys(s.progress)
  return unlocked({ ...s, homeLevel: 2, shelved: Object.fromEntries(books.map((b) => [b, 2])), hearts: Object.fromEntries(CONTENT.neighbors.map((n) => [n.id, 70])) }, 0, true)
}

const teleport = (s: GameState, t: Tile): GameState => ({ ...s, player: { ...s.player, x: t.x, y: t.y, path: [] }, target: null })

/** 후반 자동 플레이어의 분 단위 행동: 약속 자리·결혼 잔치·계절 잔치에 가 있고, 사흘에 한 번 구약 터에 다녀온다 */
function lateActions(s: GameState, day: number, label: string, t: string, report: (f: Finding) => void, trip: () => void): GameState {
  const m = Math.floor(s.clock.minute)
  const map = s.map ?? 'village'
  try {
    if (map === 'village') {
      const p = s.life?.promises.find((x) => x.day === day && m >= x.from && m < x.to)
      if (p) return near(s.player, p.at, 1) ? s : teleport(s, p.at)
      if ((weddingToday(s) && m >= FESTIVAL_FROM + WEDDING_GATHER && m < FESTIVAL_TO) || (festivalOf(day) && m >= FESTIVAL_FROM && m < FESTIVAL_TO)) return near(s.player, FIRE, 2) ? s : teleport(s, { x: FIRE.x, y: FIRE.y + 2 })
    }
    // 구약 터에 처음 간 날 집 한 채를 주문한다 (빈 땅을 차례로 찾아서)
    if (map === 'newland' && m === 14 * 60 && s.flags.newlandRevealed && !(s.newland?.builds ?? []).some((b) => b.kind === 'home')) {
      const rich = { ...s, coins: Math.max(s.coins, 5000), inv: putAway(s, { reed: 9, papyrus: 9, olive: 9 }).inv }
      for (let y = BUILD_RECT.y0; y <= BUILD_RECT.y1; y++) for (let x = BUILD_RECT.x0; x <= BUILD_RECT.x1; x++) {
        if (canOrder(rich, 'home', x, y, 'down') !== null) continue
        const next = orderBuild(rich, 'home', x, y, 'down')
        if (next) return next
      }
      report({ rule: '19 집 짓기', level: '확인', where: `${label} ${t}`, detail: `구약 터 어디에도 집을 놓을 수 없음 (닢 ${rich.coins})` })
    }
    // 규칙 17: 구약 터 왕복 — 갈 수 있다는데 못 가거나, 건너간 뒤 서 있는 칸이 그 지도에서 걸을 수 없는 칸
    const go = day % 3 === 1 && m === 13 * 60 && map === 'village' ? 'newland' : m === 15 * 60 && map === 'newland' ? 'village' : null
    if (go && canTravel(s, go) === null) {
      const next = travel(s, go, CONTENT)
      if ((next.map ?? 'village') !== go) report({ rule: '17 구약 터 왕복', level: '높음', where: `${label} ${t}`, detail: `${go}로 건너갈 수 있다는데 건너가지 않음` })
      else if (!walkableOn(go, { x: Math.round(next.player.x), y: Math.round(next.player.y) })) report({ rule: '17 구약 터 왕복', level: '높음', where: `${label} ${t}`, detail: `${go} 도착 칸 (${next.player.x},${next.player.y})을 걸을 수 없음` })
      if (go === 'newland') trip()
      return next
    }
  } catch (err) {
    report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${t} 후반 행동`, detail: String((err as Error)?.stack ?? err).split('\n').slice(0, 3).join(' / ') })
  }
  return s
}

/** 규칙 20: 가계도가 서로 맞는가 — 배우자는 서로 가리키고, 부모·가구·후계자는 있는 사람이고, 나이와 단계가 맞다 */
function genChecks(s: GameState, day: number, label: string, report: (f: Finding) => void) {
  const g = s.gen
  if (!g) return
  const bad: string[] = []
  const P = g.persons
  for (const p of Object.values(P)) {
    if (p.spouse && P[p.spouse]?.spouse !== p.id) bad.push(`${p.id}의 배우자 ${p.spouse}가 ${p.id}를 가리키지 않음`)
    for (const par of p.parents) if (!P[par]) bad.push(`${p.id}의 부모 ${par}가 없음`)
    // 아기·아이는 부모 가구의 자녀(children)로 들어 있다
    if (p.household && !g.households[p.household]?.members.includes(p.id) && !g.households[p.household]?.children.includes(p.id)) bad.push(`${p.id}의 가구 ${p.household}에 ${p.id}가 없음`)
    if (p.origin === 'born' && p.born != null && p.stage !== stageByAge(p.born, day)) bad.push(`${p.id}(${p.born}일생) 단계 ${p.stage}, 나이로는 ${stageByAge(p.born, day)}`)
  }
  for (const h of Object.values(g.households)) for (const m of [...h.members, ...h.children]) if (!P[m]) bad.push(`가구 ${h.id}의 ${m}이 없음`)
  for (const r of Object.values(g.relations)) {
    if (!P[r.a] || !P[r.b]) bad.push(`관계 ${r.id}의 사람이 없음`)
    else if (r.stage === 'spouse' && (P[r.a].spouse !== r.b || P[r.b].spouse !== r.a)) bad.push(`관계 ${r.id}는 부부인데 배우자 칸이 다름`)
  }
  for (const [npc, x] of Object.entries(g.retired ?? {})) if (!P[x.heir]) bad.push(`은퇴한 ${npc}의 후계자 ${x.heir}가 없음`)
  if (s.romance?.partner && s.gen?.persons[s.romance.partner]?.spouse) bad.push(`내 ${s.romance.stage} ${s.romance.partner}가 주민 배우자 ${s.gen.persons[s.romance.partner].spouse}와도 부부`)
  if (bad.length) report({ rule: '20 가계도 어긋남', level: '높음', where: `${label} ${day}일`, detail: bad.slice(0, 5).join(' / ') })
}

function simulate(label: string, heart: number, seed: number, play = false, late = false) {
  let s = late ? lateStart() : unlocked(newGame(CONTENT), heart)
  const timeline: string[] = []
  let gifts = 0, trips = 0, otChapters = 0
  const genActs = { consult: 0, prep: 0, crib: 0 }
  const r = rng(seed)
  const once = new Set<string>()
  const played: string[] = []
  const waitSince: Record<string, number> = {}
  const ready: Record<string, { npc: string; at: Tile; minutes: number; reached: number; days: Set<number>; seenAt: Record<string, number> }> = {}
  // 날마다 되풀이되는 규칙(저장·가계도·연애·아이·약속)은 시뮬레이션마다 처음 한 번만 적는다
  const report = (f: Finding) => { const k = /^(9|1[3-9]|2\d) /.test(f.rule) ? `${f.rule}|${f.level}` : `${f.rule}|${f.where}`; if (!once.has(k)) { once.add(k); add(f) } }
  const days = late ? LATE_DAYS : DAYS
  for (let day = 1; day <= days; day++) {
    const overlap: Record<string, number> = {}, stuck: Record<string, number> = {}
    while (s.clock.minute < PLAY_TO - 1) {
      let out
      try {
        out = tick(s, 1, r, CONTENT)
      } catch (e) {
        report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${day}일 ${fmt(s.clock.minute)}`, detail: String((e as Error)?.stack ?? e).split('\n').slice(0, 4).join(' / ') })
        break
      }
      // 플레이어는 집에서 기다린다 — 배고픔·피로로 쓰러지지 않게 채운다
      s = { ...out.state, scenes: [], needs: { hunger: 10, fatigue: 0, cold: 0, heat: 0 } }
      const t = `${day}일 ${fmt(s.clock.minute)}`
      const vis = Object.values(s.npcs).filter((n) => n.visible)
      // 자동 플레이어: 기다리는 이야기·목격을 바로 열고, 고를 말은 아무거나 고르고, 손일은 마친다
      if (play) for (const n of vis) {
        try {
          const e = eventWaiting(s, n.id)
          const w = e ? null : sightingWaiting(s, n.id)
          if (!e && !w) continue
          const opened = openEvent(s, n.id)
          if (!opened) { report({ rule: '10 이야기가 안 열림', level: '높음', where: `${label} ${t} ${e?.id ?? w?.id}`, detail: '기다리는 표시는 있는데 열기가 실패' }); continue }
          s = opened
          if (e?.choices?.length) s = chooseInEvent(s, e.id, Math.floor(r() * e.choices.length))
          if (s.life?.storyWait?.mini) s = finishStoryMini(s)
          s = { ...s, scenes: [] }
          played.push(`${day}일 ${e?.id ?? w?.id}`)
        } catch (err) {
          report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${t} ${n.id} 이야기`, detail: String((err as Error)?.stack ?? err).split('\n').slice(0, 4).join(' / ') })
        }
      }
      if (late) s = lateActions(s, day, label, t, report, () => { trips++ })
      // 규칙 4: 같은 칸에 두 사람 (멈춰 선 채로 10분 넘게)
      const byTile = new Map<string, string[]>()
      for (const n of vis) if (!n.path.length) byTile.set(key(npcTile(n)), [...(byTile.get(key(npcTile(n))) ?? []), n.id])
      for (const [k, ids] of byTile) if (ids.length > 1) {
        const id = `${ids.sort().join('+')}@${k}`
        overlap[id] = (overlap[id] ?? 0) + 1
        if (overlap[id] === 10) report({ rule: '4 같은 칸에 둘', level: '중간', where: `${label} ${t}`, detail: `${ids.join('·')} 가 (${k})에 겹쳐 섬` })
      }
      // 규칙 5: 가야 할 자리에 못 가고 멈춤 (30분)
      for (const n of vis) {
        const here = npcTile(n)
        if (n.goal && !n.path.length && !near(here, n.goal, 0)) {
          stuck[n.id] = (stuck[n.id] ?? 0) + 1
          if (stuck[n.id] === 30) report({ rule: '5 자리에 못 감', level: '확인', where: `${label} ${t} ${n.id}`, detail: `(${here.x},${here.y})에서 멈춤, 가려던 곳 (${n.goal.x},${n.goal.y})` })
        } else stuck[n.id] = 0
      }
      // 규칙 7: 이야기가 기다리는데 그 사람이 이야기 자리에 오지 않음 (며칠 전체를 모아 본다)
      if (heart) for (const n of vis) {
        const e = eventNow(s, n.id)
        if (!e) continue
        const st = (ready[e.id] ??= { npc: n.id, at: e.at, minutes: 0, reached: 0, days: new Set(), seenAt: {} })
        st.minutes++
        st.days.add(day)
        if (near(npcTile(n), e.at, 1)) st.reached++
        else { const k = key(npcTile(n)); st.seenAt[k] = (st.seenAt[k] ?? 0) + 1 }
      }
      // 규칙 8: 수치 범위
      const bad: string[] = []
      if (!Number.isFinite(s.coins) || s.coins < 0) bad.push(`닢 ${s.coins}`)
      for (const [id, v] of Object.entries(s.hearts)) if (!Number.isFinite(v) || v < 0 || v > 100) bad.push(`${id} 마음 ${v}`)
      if (bad.length) report({ rule: '8 수치 범위', level: '높음', where: `${label} ${t}`, detail: bad.join(', ') })
    }
    // 규칙 9: 저장 → 불러오기 → 저장이 같은가
    try {
      // 한 번 불러오면 빈 칸을 기본값으로 채운다(정상). 그 뒤로는 몇 번을 불러와도 같아야 하고, 값이 있던 칸은 사라지면 안 된다.
      // shelved는 점검기가 장을 다 읽지 않고 꽂아 둔 가짜 칸이라 불러올 때 빠지는 것이 맞다.
      const a = serialize(s)
      const once1 = deserialize(a, CONTENT)
      const b = once1 ? serialize(once1) : 'null'
      const once2 = once1 ? deserialize(b, CONTENT) : null
      const c = once2 ? serialize(once2) : 'null'
      const ja = JSON.parse(a), jb = once1 ? JSON.parse(b) : {}, jc = once2 ? JSON.parse(c) : {}
      // 비어 있던 목록·칸을 불러올 때 채우는 것은 정상 (점검기가 만든 시작 상태에 파생 칸이 비어 있다)
      // 지난 날의 하루 마음 기록(heartDay)은 불러올 때 버리는 것이 맞다
      if (ja.heartDay && ja.heartDay.day !== ja.clock?.day) delete ja.heartDay
      const empty = (v: unknown) => v === undefined || (Array.isArray(v) && !v.length) || (!!v && typeof v === 'object' && !Object.keys(v).length)
      const lost = Object.keys(ja).filter((k) => (late || k !== 'shelved') && !empty(ja[k]) && canon(ja[k]) !== canon(jb[k]))
      const unstable = Object.keys({ ...jb, ...jc }).filter((k) => canon(jb[k]) !== canon(jc[k]))
      const show = (ks: string[], x: any, y: any) => ks.slice(0, 4).flatMap((k) => deepDiff(x[k], y[k], k, [])).join(' | ')
      if (!once1) report({ rule: '9 저장 왕복', level: '높음', where: label, detail: '불러오기 실패(null)' })
      if (lost.length) report({ rule: '9 저장 왕복', level: '중간', where: `${label} ${day}일 밤`, detail: `불러오면 바뀌는 칸: ${show(lost, ja, jb)}` })
      if (unstable.length) report({ rule: '9 저장 왕복', level: '높음', where: `${label} ${day}일 밤`, detail: `불러올 때마다 바뀌는 칸: ${show(unstable, jb, jc)}` })
    } catch (e) {
      report({ rule: '9 저장 왕복', level: '높음', where: `${label} ${day}일 밤`, detail: `오류: ${String(e).slice(0, 200)}` })
    }
    if (late) {
      // 규칙 13: 결혼 잔치 날이 지났는데 아직 약혼 (자동 플레이어는 잔치 시각에 모닥불 곁에 서 있었다)
      const ro = s.romance
      if (ro?.stage === 'engaged' && ro.weddingDay != null && ro.weddingDay <= day) report({ rule: '13 결혼이 안 됨', level: '높음', where: `${label} ${day}일`, detail: `잔치 날(${ro.weddingDay}일) 밤까지 모닥불 곁에 있었는데 ${ro.partner}와 아직 약혼` })
      // 규칙 14: 결혼하고 아이방이 있는데 아이가 오지 않음
      if (ro?.stage === 'married' && ro.marriedDay != null && !s.child && day > ro.marriedDay + CHILD_AFTER_WEDDING + 1) report({ rule: '14 아이가 안 옴', level: '높음', where: `${label} ${day}일`, detail: `${ro.marriedDay}일에 결혼, 아이방(2단계) 있음, ${CHILD_AFTER_WEDDING}일 뒤에도 아이 없음` })
      // 규칙 15: 약속 자리에 갔는데 잊은 약속으로 남음
      const forgot = Object.entries(s.life?.memories ?? {}).flatMap(([npc, ms]) => ms.filter((m) => m.tag.startsWith('forgot:')).map((m) => `${npc} ${m.tag}`))
      if (forgot.length) report({ rule: '15 지킨 약속이 잊은 것으로', level: '높음', where: `${label} ${day}일`, detail: forgot.slice(0, 5).join(', ') })
      // 주민 가족: 결혼 상담은 응원, 결혼 준비는 거들고, 아기 침대 부탁은 들어준다 (화면 GenTalk.tsx와 같은 순서)
      s = putAway(s, { reed: 6, blanket: 2, ...Object.fromEntries(Object.values(PREP_TASKS).flatMap((x) => Object.entries(x)).map(([k, v]) => [k, (v as number) * 2])) } as never)
      for (const def of CONTENT.neighbors) {
        try {
          const g0 = s.gen
          if (!g0) break
          const c = consultFor(g0, def.id, s.hearts, day)
          if (c) { s = { ...s, gen: answerConsult(g0, c.id, 'cheer', day).g }; genActs.consult++ }
          const prep = preparingFor(s.gen, def.id)
          const todo = prep?.prep?.tasks.find((x) => !prep.prep!.done.includes(x))
          if (prep && todo) {
            const inv = take(s.inv, PREP_TASKS[todo]), ng = s.gen && helpPrep(s.gen, prep.id, todo)
            if (inv && ng) { s = heartUp(heartUp({ ...s, inv, gen: ng }, prep.a, PREP_GAIN), prep.b, PREP_GAIN); genActs.prep++ }
          }
          const crib = cribAskOf(s.gen, def.id)
          if (crib && cribAsker(crib) === def.id) {
            const inv = take(s.inv, CRIB_NEEDS), ng = s.gen && giveCrib(s.gen, crib.id, day)
            if (inv && ng) { s = heartUp(heartUp({ ...s, inv, gen: ng }, crib.members[0], PREP_GAIN), crib.members[1], PREP_GAIN); genActs.crib++ }
          }
          if (bakerCribWaiting(s, def.id)) { const next = makeBakerCrib(s); if (next) { s = next; genActs.crib++ } }
        } catch (err) { report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${day}일 ${def.id} 주민 가족`, detail: String((err as Error)?.stack ?? err).split('\n').slice(0, 3).join(' / ') }) }
      }
      // 우리 아이 이름 짓기
      if (s.flags.childNaming && s.child) s = nameChild(s, '테디')
      if (s.flags.siblingNaming) s = nameSibling(s, `동생${s.flags.siblingNaming}`)
      // 아이는 잠자리에서 얘기해야 온다 (2026-10-13) — 봇은 할 수 있으면 얘기하고 잔다 (셋까지)
      if (babyBlock(s) === null) s = askBaby(s)
      // 규칙 21: 어른이 된 아이에게 일이 정해지지 않음
      if (s.child?.born != null && day > s.child.born + ADULT_AT + 1 && !s.child.job) report({ rule: '21 아이 일', level: '높음', where: `${label} ${day}일`, detail: `${s.child.born}일생 아이가 어른이 됐는데 일이 없음` })
      if (s.child?.job && !timeline.some((x) => x.includes('아이 일'))) timeline.push(`${day}일 아이 일 '${s.child.job}'${s.child.left ? '(마을 밖으로)' : ''}`)
      // 날마다 구약 한 장을 옮겨 적는다 (책을 다 마치면 다음 책)
      try {
        const book = OT_PLAN.find((b) => !(s.otProgress?.[b]?.completed.length && copySpot(s, b, CONTENT) === null)) ?? null
        if (book) {
          if (s.copy.book !== book) s = startCopy(s, book, CONTENT)
          const first = copySpot(s, book, CONTENT)
          if (first) {
            let kind = 'none'
            for (let i = 0; i < 300; i++) {
              const spot = copySpot(s, book, CONTENT)
              if (!spot || spot.chapter !== first.chapter) break
              const w = writeVerse(s, book, spot.verse.text, CONTENT)
              s = w.state
              kind = w.result.kind
              if (kind === 'notYet') break
            }
            // 규칙 22: 한 장을 다 옮겨 적었는데 마친 장으로 남지 않음
            if (!(s.otProgress?.[book]?.completed ?? []).includes(first.chapter)) report({ rule: '22 구약 필사', level: '높음', where: `${label} ${day}일 ${book} ${first.chapter}장`, detail: `끝까지 썼는데(마지막 결과 ${kind}) 마친 장에 없음` })
            else otChapters++
          }
        }
      } catch (err) { report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${day}일 구약 필사`, detail: String((err as Error)?.stack ?? err).split('\n').slice(0, 3).join(' / ') }) }
      // 규칙 19: 주문한 집이 사흘이 지나도 완공되지 않음
      for (const b of s.newland?.builds ?? []) if (b.state !== 'done' && day - b.orderedDay > 3) report({ rule: '19 집 짓기', level: '높음', where: `${label} ${day}일 ${b.id}`, detail: `${b.orderedDay}일에 주문한 ${b.kind}가 아직 '${b.state}'` })
      if ((s.newland?.builds ?? []).some((b) => b.kind === 'home' && b.state === 'done') && !timeline.some((x) => x.includes('집 완공'))) timeline.push(`${day}일 구약 터 집 완공`)
      // 규칙 20: 가계도가 서로 어긋남
      genChecks(s, day, label, report)
      // 날마다 가방을 채우고(선물거리·다발·끈) 이웃 모두에게 선물 하나씩, 연애를 한 걸음씩
      s = putAway(s, { ...Object.fromEntries(GIFTABLE.filter((i) => count(s.inv, i) < 3).map((i) => [i, 3])), ...(count(s.inv, 'bouquet') ? {} : { bouquet: 1 }), ...(count(s.inv, 'promiseCord') ? {} : { promiseCord: 1 }) })
      for (const def of CONTENT.neighbors) {
        try {
          const item = GIFTABLE[Math.floor(r() * GIFTABLE.length)]
          const g = count(s.inv, item) ? giveGift(s, def, item) : null
          if (g) { s = g.state; gifts++ }
        } catch (err) { report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${day}일 ${def.id} 선물`, detail: String((err as Error)?.stack ?? err).split('\n').slice(0, 3).join(' / ') }) }
      }
      try {
        if (!s.romance?.partner) {
          const def = CONTENT.neighbors.find((d) => canGiveBouquet(s, d) === null)
          if (def) { s = giveBouquet(s, def); timeline.push(`${day}일 ${def.id}에게 들꽃 다발(연인)`) }
        } else if (s.romance.stage === 'dating') {
          const def = CONTENT.neighbors.find((d) => d.id === s.romance.partner)!
          // 10하트에는 데이트 세 번과 연인 이야기가 든다 — 일이 끝난 저녁(18시)에 갈 수 있는 곳으로 데이트하고, 연인 이야기는 끝까지 본다
          // (이 자리는 하루 끝이라 시각만 저녁 6시로 잠깐 돌린 사본으로 묻고, 다녀온 뒤 시각은 원래대로)
          const noon: GameState = { ...s, clock: { ...s.clock, minute: 18 * 60 } }
          const place = DATE_PLACES.find((p) => canDate(noon, p, CONTENT) === null)
          if (place) s = { ...goOnDate(noon, place, CONTENT), clock: s.clock }
          const trust = s.scenes.find((id) => id.startsWith('loverTrust:'))
          if (trust) s = { ...sceneSeen(s, trust, []), scenes: [] }
          const why = canGiveCord(s, def)
          if (why === null) { s = giveCord(s, def); timeline.push(`${day}일 약속의 끈(약혼), 잔치 ${s.romance.weddingDay}일`) }
          else if (s.romance.since != null && day - s.romance.since > FULL_HEART_DATING_DAYS + 7) report({ rule: '16 약혼을 못 함', level: '높음', where: `${label} ${day}일`, detail: `${def.id}와 사귄 지 ${day - s.romance.since}일, 끈을 못 건넴: ${why}` })
        }
      } catch (err) { report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${day}일 연애`, detail: String((err as Error)?.stack ?? err).split('\n').slice(0, 3).join(' / ') }) }
      if (s.romance?.stage === 'married' && !timeline.some((x) => x.includes('결혼함'))) timeline.push(`${s.romance.marriedDay}일 결혼함`)
      if (s.child && !timeline.some((x) => x.includes('아이'))) timeline.push(`${day}일 아침 아이 태어남`)
    }
    if (play) {
      // 규칙 11: 이어 갈 이야기(storyWait)가 사흘 넘게 풀리지 않음 — 다른 이야기들이 그 뒤로 다 막힌다
      const w = s.life?.storyWait
      if (w) {
        const k = `${w.event}|${w.npc}`
        waitSince[k] ??= day
        if (day - waitSince[k] === 3) report({ rule: '11 이어 갈 이야기가 멈춤', level: '높음', where: `${label} ${w.event}`, detail: `${waitSince[k]}일부터 ${w.npc}와의 이야기가 이어지지 않음 ${JSON.stringify(w)}` })
      }
      // 규칙 12: 같은 이야기를 두 번 봄
      const seen = s.life?.seen ?? []
      const dup = seen.filter((id, i) => seen.indexOf(id) !== i)
      if (dup.length) report({ rule: '12 같은 이야기 두 번', level: '중간', where: `${label} ${day}일`, detail: [...new Set(dup)].slice(0, 8).join(', ') })
      // 하루에 이웃마다 인사하고 마음을 조금씩 쌓는다 (선물·대화를 대신)
      for (const id of CONTENT.neighbors.map((n) => n.id)) {
        try { s = heartUp(greetNeighbor(s, id), id, 3) } catch (err) { report({ rule: '6 멈춤(오류)', level: '높음', where: `${label} ${day}일 ${id} 인사`, detail: String(err).slice(0, 200) }) }
      }
    }
    if ((s.map ?? 'village') !== 'village') s = travel(s, 'village', CONTENT)
    s = unlocked(goToSleep(s, CONTENT), 0, late)
  }
  if (late) {
    const g = s.gen
    const persons = g ? Object.values(g.persons) : []
    const logKinds = (g?.log ?? []).reduce<Record<string, number>>((a, l) => ({ ...a, [l.kind]: (a[l.kind] ?? 0) + 1 }), {})
    add({ rule: '0 진행 요약', level: '확인', where: label, detail: `선물 ${gifts}번, 구약 터 왕복 ${trips}번, 구약 ${otChapters}장, 상담 응원 ${genActs.consult}·결혼 준비 ${genActs.prep}·아기 침대 ${genActs.crib}. ${timeline.join(' → ') || '연애 진행 없음'}` })
    add({ rule: '0 진행 요약', level: '확인', where: `${label} 마을 사람`, detail: `주민 ${persons.length}명(태어난 사람 ${persons.filter((x) => x.origin === 'born').length}), 부부 ${Object.values(g?.households ?? {}).filter((h) => h.since != null).length}쌍, 은퇴 ${Object.keys(g?.retired ?? {}).length}명. 기록: ${Object.entries(logKinds).map(([k, v]) => `${k} ${v}`).join(', ')}` })
  }
  if (play) {
    const all = Object.values(peopleData().people).flatMap((p) => (p.events ?? []).map((e) => e.id))
    const seen = new Set(s.life?.seen ?? [])
    add({ rule: '0 진행 요약', level: '확인', where: label, detail: `${days}일 동안 이야기·목격 ${played.length}개를 봄, 이야기 ${all.length}개 중 ${all.filter((id) => seen.has(id)).length}개 봄. 마지막 사이: ${Object.entries(s.hearts).map(([k, v]) => `${k} ${v}`).join(', ')}` })
  }
  for (const [id, st] of Object.entries(ready)) {
    if (st.reached > 0) continue
    const top = Object.entries(st.seenAt).sort((a, b) => b[1] - a[1])[0]?.[0]
    add({ rule: '7 이야기 자리에 못 옴', level: '높음', where: `${label} ${id}`, detail: `${st.days.size}일 동안 ${st.minutes}분 기다렸는데 한 번도 (${st.at.x},${st.at.y}) 곁에 안 옴 — 주로 (${top})에 있었음` })
  }
}

describe.skipIf(!RUN)('자동 점검기', () => {
  beforeAll(async () => { await Promise.all(OT_PLAN.map((b) => ensureOtBook(b))) })
  it('자료 규칙', () => { staticChecks() })
  it('처음 사이로 며칠', () => { simulate('처음 사이', 0, 1) }, 600_000)
  it('가까운 사이로 며칠', () => { simulate('가까운 사이', 80, 2) }, 600_000)
  it('자동 플레이어로 며칠', () => { simulate('자동 플레이어', 0, 3, true) }, 1_800_000)
  it('후반 생활로 한 해', () => { simulate('후반 생활', 0, 4, true, true) }, 3_600_000)
  afterAll(() => {
    const byRule = new Map<string, Finding[]>()
    for (const f of found) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f])
    const lines = [`# 자동 점검 결과`, ``, `돌린 날: 시뮬레이션 ${DAYS}일씩(후반 생활은 ${LATE_DAYS}일) — 처음 사이(가만히)·가까운 사이(가만히)·자동 플레이어(이야기 열고 고르기, 매일 인사)·후반 생활(27권 뒤: 선물·약속·연애·결혼·아이·잔치·구약 터 왕복·집 짓기·구약 필사·주민 결혼 상담·아기 침대)`, `찾은 것: ${found.length}건`, ``]
    for (const [rule, fs] of [...byRule].sort()) {
      lines.push(`## 규칙 ${rule} — ${fs.length}건`, '')
      for (const f of fs) lines.push(`- [${f.level}] ${f.where}: ${f.detail}`)
      lines.push('')
    }
    mkdirSync('docs/audits', { recursive: true })
    writeFileSync('docs/audits/invariants-latest.md', lines.join('\n'))
    console.log(`자동 점검: ${found.length}건 → docs/audits/invariants-latest.md`)
  })
})
