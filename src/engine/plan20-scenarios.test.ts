// 계획 20 작업 8: 1부 마무리 점검 — 저장 상황마다 이어하기 → 왕래 → 구약·신약 필사 한 절 → 잠자기가
// 막힘·중복·소실 없이 이어지는지. (newland 문구에 성경 문장이 없는지는 newland-gift.test.ts가 newland·travel 절을 덮고, 여기서 build·ot 절을 더한다)
import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import gen from '../content/ot/gen.json'
import { ensureOtBook } from '../content/ot-catalog'
import { T } from '../content/text'
import { chaptersOf } from './books'
import { newChild } from './child'
import { copySpot } from './copying'
import { goToSleep, newGame, startCopy, syncHome, tick, travel, writeVerse, type GameState } from './game'
import { setActiveMap } from './maps'
import { setNewlandOpen, setNewlandRevealed } from './newland'
import { npcTile } from './neighbors'
import { orderBuild } from './newland-build'
import { NEWLAND_PORTAL_FRONT, VILLAGE_PORTAL_FRONT } from './newland-config'
import { NO_ROMANCE } from './romance'
import { deserialize, serialize } from './save'
import { BOOKS } from './types'

beforeAll(async () => {
  await ensureOtBook('gen')
})
afterEach(() => {
  setActiveMap('village')
  setNewlandOpen(false)
  setNewlandRevealed(true)
})

const ALL = Object.fromEntries(BOOKS.map((b) => [b, 1])) as GameState['shelved']

/** 낮 10시, 큰길 끝 표식 앞에 선 기본 저장 (새 터를 받았는지는 gift로) */
function base(gift: boolean, extra: Partial<GameState> = {}): GameState {
  const s = newGame(CONTENT)
  const g: GameState = {
    ...s,
    scenes: [],
    clock: { day: 20, minute: 10 * 60 },
    flags: { ...s.flags, ...(gift ? { newlandGift: 1, newlandRevealed: 1 } : {}) },
    player: { ...s.player, x: VILLAGE_PORTAL_FRONT.x, y: VILLAGE_PORTAL_FRONT.y, path: [] },
    ...extra,
  }
  syncHome(g)
  return g
}
const finished = (): GameState['progress'] => {
  const s = newGame(CONTENT)
  const p = { ...s.progress }
  for (const b of BOOKS) p[b] = { ...p[b], completed: chaptersOf(b, CONTENT) }
  return p
}
const MARRIED = { ...NO_ROMANCE, partner: 'wendell', stage: 'married' as const, marriedDay: 3 }
const sumNt = (s: GameState) => BOOKS.reduce((n, b) => n + s.progress[b].completed.length, 0)
const sumOt = (s: GameState) => Object.values(s.otProgress ?? {}).reduce((n, p) => n + p.completed.length, 0)
const visible = (s: GameState) => Object.values(s.npcs).filter((n) => n.visible)

interface Scenario {
  name: string
  make: () => GameState
  open: boolean
}

function withBuild(): GameState {
  const b = base(true)
  const s = {
    ...b,
    coins: 1000,
    inv: { olive: 9, papyrus: 9, reed: 9 },
    map: 'newland' as const,
    player: { ...b.player, x: NEWLAND_PORTAL_FRONT.x, y: NEWLAND_PORTAL_FRONT.y, path: [] },
  }
  syncHome(s)
  const built = orderBuild(s, 'path', 12, 12, 'down', 1)
  if (!built) throw new Error('길을 놓지 못했다')
  syncHome(built)
  return built
}

/** 옛 저장: 새 터 이후에 생긴 필드를 모두 뺀다 */
function oldSave(): GameState {
  const raw = JSON.parse(serialize(base(false))) as Record<string, unknown>
  for (const k of ['otProgress', 'otCopyStats', 'newland', 'mapAt', 'map']) delete raw[k]
  return deserialize(JSON.stringify(raw), CONTENT)!
}

const mtProgress = () => {
  const g = newGame(CONTENT)
  return { ...g.progress, mt: { ...g.progress.mt, completed: [1, 2] } }
}

const SCENARIOS: Scenario[] = [
  { name: '신약 진행 중 (새 터 받기 전)', open: false, make: () => base(false, { progress: mtProgress() }) },
  { name: '27권 완필 · 구약 개방 전', open: false, make: () => base(false, { progress: finished(), shelved: ALL }) },
  { name: '잔치 직후 (allFeast 2, 새 터 받음)', open: true, make: () => base(true, { progress: finished(), shelved: ALL, flags: { ...base(true).flags, allFeast: 2, churchesDone: 1 } }) },
  { name: '가족·아이 있음 (결혼, 아이)', open: true, make: () => base(true, { romance: MARRIED, child: newChild(10, newGame(CONTENT).stats, undefined) }) },
  { name: '아이 없음 (결혼만)', open: true, make: () => base(true, { romance: MARRIED, child: null }) },
  { name: '구약 개방 후 (신약 진행 중)', open: true, make: () => base(true, { progress: mtProgress() }) },
  { name: '새 터에서 저장', open: true, make: () => travel(base(true), 'newland', CONTENT) },
  { name: '건물 있는 저장 (새 터)', open: true, make: withBuild },
  { name: '옛 저장 (새 터 필드 없음)', open: false, make: oldSave },
]

describe.each(SCENARIOS)('시나리오: $name', ({ make, open }) => {
  it('이어하기 → 왕래 → 필사 한 절 → 잠자기가 막힘·중복·소실 없이 이어진다', () => {
    const start = make()
    // 이어하기
    const loaded = deserialize(serialize(start), CONTENT)
    expect(loaded).not.toBeNull()
    let s = loaded!
    expect(s.coins).toBe(start.coins)
    expect(s.romance).toEqual(start.romance)
    expect(s.child?.name).toBe(start.child?.name)
    expect(sumNt(s)).toBe(sumNt(start))
    expect(s.newland?.builds ?? []).toEqual(start.newland?.builds ?? [])
    expect(!!s.flags.newlandGift).toBe(open)

    // 왕래 — 열린 저장은 건너가고 돌아오고, 닫힌 저장은 건너갈 수 없다 (제자리)
    if (s.flags.newlandGift) {
      if (s.map !== 'newland') {
        const there = travel(s, 'newland', CONTENT)
        expect(there.map).toBe('newland')
        // 새 터에서는 첫 마을 이웃이 얼어 있다 (한 걸음도 안 움직임) — 같은 이웃이 두 곳에 있지 않다
        let t = there
        for (let i = 0; i < 60; i++) t = tick(t, 1, () => 0, CONTENT).state
        expect(t.npcs).toBe(there.npcs)
        s = t
      }
      const back = travel(s, 'village', CONTENT)
      expect(back.map).toBe('village')
      const tiles = visible(back).map((n) => `${npcTile(n).x},${npcTile(n).y}`)
      expect(new Set(tiles).size).toBe(tiles.length)
      s = back
    } else {
      expect(travel(s, 'newland', CONTENT)).toBe(s)
    }

    // 신약 필사 한 절 (책이 다 끝났으면 쓸 자리가 없는 것이 정상)
    const ntBook = BOOKS.find((b) => copySpot(s, b, CONTENT))
    const nt0 = s.copyStats.verses
    if (ntBook) {
      s = startCopy(s, ntBook, CONTENT)
      const spot = copySpot(s, ntBook, CONTENT)!
      const w = writeVerse(s, ntBook, spot.verse.text, CONTENT)
      expect(w.result.kind === 'verse' || w.result.kind === 'chapter').toBe(true)
      s = w.state
      expect(s.copyStats.verses).toBe(nt0 + 1)
    } else {
      expect(sumNt(s)).toBeGreaterThan(0)
    }

    // 구약 필사 한 절 — 새 터를 받은 저장만 (받기 전에는 막히는 것이 규칙)
    const ot0 = s.otCopyStats?.verses ?? 0
    if (s.flags.newlandGift) {
      s = startCopy(s, 'gen', CONTENT)
      const spot = copySpot(s, 'gen', CONTENT)!
      const w = writeVerse(s, 'gen', spot.verse.text, CONTENT)
      expect(w.result.kind).toBe('verse')
      expect(w.state.otCopyStats?.verses).toBe(ot0 + 1)
      s = w.state
    } else {
      expect(startCopy(s, 'gen', CONTENT)).toBe(s)
    }

    // 잠자기 — 하루가 가고 첫 마을 침대에서, 쓴 것·건물·돈·가족은 그대로
    const before = { nt: sumNt(s), ot: sumOt(s), builds: s.newland?.builds.length ?? 0, partner: s.romance.partner, child: !!s.child, day: s.clock.day, otVerses: s.otCopyStats?.verses ?? 0 }
    const woke = goToSleep({ ...s, clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
    expect(woke.clock.day).toBe(before.day + 1)
    expect(woke.map ?? 'village').toBe('village')
    expect(sumNt(woke)).toBeGreaterThanOrEqual(before.nt)
    expect(sumOt(woke)).toBe(before.ot)
    expect(woke.otCopyStats?.verses ?? 0).toBe(before.otVerses)
    expect(woke.romance.partner).toBe(before.partner)
    expect(!!woke.child).toBe(before.child)
    expect(woke.newland?.builds.length ?? 0).toBe(before.builds)
    // 잠든 뒤 저장해도 이어진다
    const again = deserialize(serialize(woke), CONTENT)
    expect(again).not.toBeNull()
    expect(again!.clock.day).toBe(woke.clock.day)
    expect(again!.newland?.builds.length ?? 0).toBe(before.builds)
    const ids = Object.keys(again!.npcs)
    expect(ids.sort()).toEqual(Object.keys(start.npcs).sort())
  })
})

describe('구약 필사는 막히지 않는다 (기름 0·재료 0·피로 최대·건물 0채)', () => {
  it('닢·재료·기름 없이 피로 최대에도 한 절이 써지고 닢·재료는 그대로다', () => {
    const s = startCopy(base(true, { coins: 0, inv: {}, chest: {}, needs: { hunger: 100, fatigue: 100, cold: 100, heat: 100 } }), 'gen', CONTENT)
    expect(s.newland?.builds ?? []).toHaveLength(0)
    const w = writeVerse(s, 'gen', copySpot(s, 'gen', CONTENT)!.verse.text, CONTENT)
    expect(w.result.kind).toBe('verse')
    expect(w.state.coins).toBe(0)
    expect(w.state.inv).toEqual({})
  })
})

describe('새 터 문구에 성경 문장이 없다', () => {
  const norm = (t: string) => t.replace(/[^가-힣]/g, '')
  const verses = (gen as string[][]).flat().map(norm)
  it('build·ot 절은 금지어를 통과하고 창세기 어느 절과도 8글자 이상 겹치지 않는다 (newland·travel 절은 newland-gift.test.ts)', () => {
    const texts = [...Object.values(T.build), ...Object.values(T.ot)].filter((x): x is string => typeof x === 'string')
    expect(texts.length).toBeGreaterThan(0)
    for (const text of texts) {
      expect(forbiddenIn(text), text).toBeNull()
      const n = norm(text)
      for (let i = 0; i + 8 <= n.length; i++) expect(verses.some((v) => v.includes(n.slice(i, i + 8))), `${text} / ${n.slice(i, i + 8)}`).toBe(false)
    }
  })
})
