// 계획 16 작업 24: 주민들의 작은 근황 — 하루 두세 건, 같은 날 같은 모습, 두 곳 동시 없음, 미해금·부재·완료 전 결과 없음, 놓쳐도 진행 유지
import { existsSync, readFileSync } from 'node:fs'
import { CONTENT, PEOPLE } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import { festivalOf, isMarketDay } from './calendar'
import { hearMutter, mutterWaiting, newGame, newsPropsNow, newsRecent, routineOf, settle, storyPropsNow, type GameState } from './game'
import { HABITS, NEWS, NEWS_PER_DAY, NEWS_RECENT_DAYS, newsCountOf, newsMutter, newsOfDay, newsSeenText } from './news'
import { findPath } from './movement'
import { route } from './neighbors'
import { allSightings, isOffDay, personOf, threadPhase } from './people'
import { deserialize, serialize } from './save'
import { sanitizeNotebook } from './notebook'
import { isWalkable, key, propSpotProblem } from './world'
import lifeText from '../content/life-text.json'

const ALL_MOVED = Object.fromEntries(CONTENT.neighbors.map((n) => [`movedIn:${n.id}`, 1]))
/** 모두 이사 와 있는 마을 */
const full = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, ...ALL_MOVED, villageLevel: 99 } }
}
const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { ...s.clock, day, minute } })
const newsOf = (s: GameState, npc: string) => routineOf(s, npc)?.news ?? null
/** 이 날 낮 동안 보이는 근황 id (모든 이웃, 모든 시각) */
const dayNews = (s: GameState, day: number): Set<string> => {
  const out = new Set<string>()
  for (let m = 480; m < 1080; m += 20) for (const n of CONTENT.neighbors) { const id = newsOf(at(s, day, m), n.id); if (id) out.add(id) }
  return out
}
const doorOf = (id: string) => CONTENT.neighbors.find((n) => n.id === id)!.door

describe('근황 목록', () => {
  it('자리는 걸을 수 있고 그 주민 집 문에서 닿는다 — 만나는 두 사람은 두 칸 안', () => {
    for (const d of NEWS) {
      for (const w of d.who) {
        expect(isWalkable(w.at), `${d.id} ${w.npc}`).toBe(true)
        expect(findPath(doorOf(w.npc), w.at) ?? route(doorOf(w.npc), w.at), `${d.id} ${w.npc} 길`).not.toBeNull()
      }
      if (d.who.length === 2) expect(Math.abs(d.who[0].at.x - d.who[1].at.x) + Math.abs(d.who[0].at.y - d.who[1].at.y), `${d.id} 두 칸 안`).toBeLessThanOrEqual(2)
    }
  })

  it('실제 있는 주민·모두 하루 낮 시간, 만나는 둘은 평소 함께하는 사이(일과 with가 이미 있다)', () => {
    for (const d of NEWS) {
      expect(d.from, d.id).toBeGreaterThanOrEqual(480)
      expect(d.to, d.id).toBeLessThanOrEqual(1080)
      for (const w of d.who) expect(personOf(w.npc), `${d.id} ${w.npc}`).toBeDefined()
      if (d.who.length === 2) {
        const [a, b] = d.who
        const links = (x: string, y: string) => personOf(x)!.routines.some((r) => r.with === y)
        expect(links(a.npc, b.npc) || links(b.npc, a.npc), `${d.id} 평소 사이`).toBe(true)
      }
    }
  })

  it('근황마다 사람별 첫마디와 수첩 한 줄이 있고, 금지어·"벌"·"필사가님"·내부 id가 없다', () => {
    const text = JSON.stringify(lifeText.news)
    expect(forbiddenIn(text)).toBeNull()
    expect(text).not.toMatch(/벌|필사가님/)
    for (const d of NEWS) for (const w of d.who) {
      expect(newsMutter(d.id, w.npc).length, `${d.id} ${w.npc} mutter`).toBeGreaterThan(0)
      expect(newsSeenText(d.id, w.npc), `${d.id} ${w.npc} seen`).toBeTruthy()
    }
    for (const h of HABITS) expect(lifeText.news.habits as Record<string, string>, h.id).toHaveProperty(h.id)
    // 근황 문구에 '성공/실패'·재촉·죄책감 말이 없다
    expect(text).not.toMatch(/놓쳤|못 봤|서운|미안|꼭 와|서둘러|실패|보상/)
  })

  it('소품은 길·문·집 곁이 아닌 한 칸이고, 사람이 서는 자리·이야기 뒤 소품·다른 근황 소품과 겹치지 않는다', () => {
    const MANIFEST = 'assets/furniture/expansion/manifest.json'
    const arts = existsSync(MANIFEST) ? new Set((JSON.parse(readFileSync(MANIFEST, 'utf-8')).items as { id: string }[]).map((x) => x.id)) : null
    const stands = new Set<string>()
    const taken = new Set<string>()
    for (const p of Object.values(PEOPLE.people)) {
      for (const r of [...p.routines, ...(p.offDays?.routines ?? [])]) stands.add(key(r.at))
      for (const e of p.events ?? []) stands.add(key(e.at))
      for (const pr of p.props ?? []) if (!pr.room) taken.add(key(pr.at))
    }
    for (const w of allSightings()) stands.add(key(w.at))
    for (const t of PEOPLE.threads) for (const ph of t.phases) for (const rs of Object.values(ph.routines ?? {})) for (const r of rs) stands.add(key(r.at))
    for (const n of CONTENT.neighbors) for (const e of n.schedule) for (const t of [e.tile, e.wet]) if (t) stands.add(key(t))
    for (const d of NEWS) for (const w of d.who) stands.add(key(w.at))
    for (const d of NEWS) {
      if (!d.prop) continue
      const t = d.prop.at
      expect(propSpotProblem([t]), `${d.id} 자리`).toBeNull()
      expect(stands.has(key(t)), `${d.id} 누군가 선다`).toBe(false)
      expect(taken.has(key(t)), `${d.id} 이야기 소품과 같은 칸`).toBe(false)
      taken.add(key(t))
      for (const art of d.prop.art) if (arts) expect(arts.has(art), `${d.id} ${art}`).toBe(true)
    }
  })
})

describe('하루 배정', () => {
  it('하루 2~3건 — 이사 온 마을에서 모든 날, 한 사람은 한 건·같은 칸 두 건 없음', () => {
    const s = full()
    let max = 0
    for (let day = 1; day <= 150; day++) {
      const picks = newsOfDay(day, () => true)
      expect(picks.length, `day ${day}`).toBeLessThanOrEqual(NEWS_PER_DAY.max)
      expect(picks.length, `day ${day}`).toBeGreaterThanOrEqual(NEWS_PER_DAY.min)
      expect([NEWS_PER_DAY.min, NEWS_PER_DAY.max]).toContain(newsCountOf(day))
      const npcs = picks.flatMap((p) => p.who.map((w) => w.npc))
      expect(new Set(npcs).size, `day ${day}`).toBe(npcs.length)
      const tiles = picks.flatMap((p) => p.who.map((w) => key(w.at)))
      expect(new Set(tiles).size, `day ${day}`).toBe(tiles.length)
      max = Math.max(max, dayNews(s, day).size)
    }
    expect(max).toBeLessThanOrEqual(NEWS_PER_DAY.max)
  })

  it('같은 날은 다시 접속해도 같은 근황 (저장 없이 날짜·상태로 다시 계산)', () => {
    const s = full()
    for (const day of [3, 17, 42, 63, 88]) {
      const a = [...dayNews(s, day)].sort()
      const back = deserialize(serialize(s), CONTENT)!
      const b = [...dayNews(at(back, day, 600), day)].sort()
      expect(b, `day ${day}`).toEqual(a)
      expect([...dayNews(at(s, day, 1000), day)].sort()).toEqual(a)
    }
  })

  it('날마다 다른 모습 — 열흘 동안 서너 가지 이상', () => {
    const s = full()
    const seen = new Set<string>()
    for (let day = 40; day < 80; day++) for (const id of dayNews(s, day)) seen.add(id)
    expect(seen.size).toBeGreaterThanOrEqual(6)
  })

  it('이사 오지 않은 주민의 근황은 없다 — 아무도 이사 오지 않은 마을은 한 건도 없다', () => {
    const none = { ...newGame(CONTENT) }
    const moved = (id: string) => !CONTENT.neighbors.find((n) => n.id === id)!.joinsAt && !CONTENT.neighbors.find((n) => n.id === id)!.joinsAtBooks
    for (let day = 1; day <= 60; day++) for (const id of dayNews(none, day)) {
      const d = NEWS.find((x) => x.id === id)!
      for (const w of d.who) expect(moved(w.npc) || (CONTENT.neighbors.find((n) => n.id === w.npc)!.joinsAt ?? 99) <= 0, `${id} ${w.npc}`).toBe(true)
    }
    // 목수·약방·어부·벌 치는 이웃은 서고 권수로 와야 나온다
    for (let day = 1; day <= 60; day++) {
      const ids = dayNews(none, day)
      expect(ids.has('carpenterOwn') || ids.has('carpenterSit') || ids.has('fisherBreak'), `day ${day}`).toBe(false)
    }
  })

  it('잔치 날은 쉬고, 벗어나는 날·장날 상인·마을 사건 일과가 있는 이웃은 근황이 없다', () => {
    const s = full()
    for (let day = 1; day <= 120; day++) {
      const today = dayNews(s, day)
      if (festivalOf(day)) expect(today.size, `잔치 ${day}`).toBe(0)
      for (const id of today) for (const w of NEWS.find((d) => d.id === id)!.who) {
        expect(isOffDay(personOf(w.npc)!, day), `${id} ${w.npc} 벗어나는 날 ${day}`).toBe(false)
        expect(PEOPLE.threads.some((t) => { const ph = threadPhase(t, day); return ph >= 0 && ph < t.phases.length && !!t.phases[ph].routines?.[w.npc]?.length }), `${id} ${w.npc} 사건 ${day}`).toBe(false)
        expect(!!CONTENT.neighbors.find((n) => n.id === w.npc)!.marketOnly && !isMarketDay(day), `${id} 장날 아님`).toBe(false)
      }
    }
  }, 60000)
})

describe('두 곳 동시 없음', () => {
  it('만나는 둘은 서로를 가리키고 두 칸 안 — 한 사람은 한 시각에 한 곳', () => {
    const s = full()
    let pairs = 0
    for (let day = 30; day < 130; day++) for (let m = 480; m < 1080; m += 10) {
      const g = at(s, day, m)
      for (const d of NEWS) {
        if (d.who.length !== 2) continue
        const [a, b] = d.who
        const ra = routineOf(g, a.npc)
        const rb = routineOf(g, b.npc)
        if (ra?.news === d.id) {
          pairs++
          expect(rb?.news, `${d.id} ${day}:${m}`).toBe(d.id)
          expect(ra.with).toBe(b.npc)
          expect(rb!.with).toBe(a.npc)
        }
        expect(ra?.news === d.id, `${d.id} ${day}:${m} 한쪽만`).toBe(rb?.news === d.id)
      }
    }
    expect(pairs).toBeGreaterThan(0)
  })
})

describe('아직 겪지 않은 일의 결과는 나오지 않는다', () => {
  const dayOf = (s: GameState, id: string, npc: string): number => {
    for (let day = 40; day < 400; day++) for (const d of NEWS.filter((x) => x.id === id)) for (let m = d.from; m < d.to; m += 20) if (newsOf(at(s, day, m), npc) === id) return day
    return -1
  }
  it('목수: 의자를 끝내기 전엔 자기 물건 손질, 끝낸 뒤에야 자기 의자에 앉는다', () => {
    const s = full()
    expect(dayOf(s, 'carpenterOwn', 'carpenter')).toBeGreaterThan(0)
    expect(dayOf(s, 'carpenterSit', 'carpenter')).toBe(-1)
    const done = { ...s, flags: { ...s.flags, 'story:carpenterChair': 1 } }
    expect(dayOf(done, 'carpenterSit', 'carpenter')).toBeGreaterThan(0)
    expect(dayOf(done, 'carpenterOwn', 'carpenter')).toBe(-1)
  })
  it('그늘막 쉬는 모습은 함께 지은 뒤에만 (표식과 함께한 경험 둘 다)', () => {
    const s = full()
    expect(dayOf(s, 'shadeRest', 'grandpa')).toBe(-1)
    expect(dayOf({ ...s, flags: { ...s.flags, 'story:village:shade': 1 } }, 'shadeRest', 'grandpa')).toBe(-1)
    const built = {
      ...s,
      flags: { ...s.flags, 'story:village:shade': 1 },
      life: { ...s.life, experiences: { ...s.life.experiences, 'project:shade': { id: 'project:shade', kind: 'project' as const, with: ['grandpa'], first: 5, last: 5, count: 1 } } },
    }
    expect(dayOf(built, 'shadeRest', 'grandpa')).toBeGreaterThan(0)
  })
  it('연인·배우자의 일과는 건드리지 않는다 (함께 가기·집안 일 판단이 그대로)', () => {
    const s = full()
    const day = dayOf(s, 'smithBreak', 'smith')
    expect(day).toBeGreaterThan(0)
    const dating = { ...s, romance: { ...s.romance, partner: 'smith', stage: 'dating' } } as GameState
    expect(newsOf(at(dating, day, 800), 'smith')).toBeNull()
  })
  it('이야기가 진행 중인 이웃(이어 갈 장면이 남은 이웃)은 쉬어 간다', () => {
    const s = full()
    const day = dayOf(s, 'smithBreak', 'smith')
    expect(day).toBeGreaterThan(0)
    const busy = { ...s, life: { ...s.life, storyWait: { npc: 'smith', event: 'x', choice: 0 } } } as GameState
    expect(newsOf(at(busy, day, 800), 'smith')).toBeNull()
  })
})

describe('발견과 놓침', () => {
  /** 근황이 있는 날·시각과 주인 */
  function find(s: GameState, id: string, npc: string): { g: GameState } {
    for (let day = 40; day < 400; day++) for (const d of NEWS.filter((x) => x.id === id)) {
      const g = at(s, day, d.from + 10)
      if (newsOf(g, npc) === id) return { g: { ...g, npcs: { ...g.npcs, [npc]: { ...g.npcs[npc], visible: true } } } }
    }
    throw new Error('근황 없음')
  }

  it('말을 걸면 첫마디로 들리고 수첩 "요즘"에 본 모습이 남는다 — 안 봐도 아무것도 줄지 않는다', () => {
    const { g } = find(full(), 'smithBreak', 'smith')
    const line = mutterWaiting(g, 'smith')
    expect(line).toBeTruthy()
    expect(newsMutter('smithBreak', 'smith')).toContain(line)
    expect(newsRecent(g, 'smith')).toEqual([])
    const heard = hearMutter(g, 'smith', line!)
    expect(newsRecent(heard, 'smith')[0]).toContain('오늘 본 모습')
    // 마음·표식·경험·가방·닢·진행은 그대로 (보상 없음)
    expect(heard.hearts).toEqual(g.hearts)
    expect(heard.flags).toEqual(g.flags)
    expect(heard.life.experiences).toEqual(g.life.experiences)
    expect(heard.inv).toEqual(g.inv)
    expect(heard.coins).toBe(g.coins)
    expect(heard.progress).toEqual(g.progress)
  })

  it('수첩 "요즘"은 열흘이 지나면 그 근황을 더는 보이지 않는다 (놓친 목록도 없다)', () => {
    const { g } = find(full(), 'smithBreak', 'smith')
    const heard = hearMutter(g, 'smith', 'x')
    const later = at(heard, g.clock.day + NEWS_RECENT_DAYS, 700)
    expect(newsRecent(later, 'smith')).toHaveLength(1)
    expect(newsRecent(at(heard, g.clock.day + NEWS_RECENT_DAYS + 1, 700), 'smith')).toEqual([])
    // 근황을 한 번도 못 본 이웃의 수첩에는 "요즘" 줄이 없다
    expect(newsRecent(g, 'baker')).toEqual([])
  })

  it('끝난 이야기·함께 지은 시설의 후속은 사실일 때만 "요즘"에 적힌다', () => {
    const s = full()
    expect(newsRecent(s, 'carpenter')).toEqual([])
    expect(newsRecent({ ...s, flags: { ...s.flags, 'story:carpenterChair': 1 } }, 'carpenter')).toEqual([lifeText.news.habits.carpenterChair])
    // 시설 표식만으로는 안 된다 — 함께한 경험이 있는 이웃만
    const built = { ...s, flags: { ...s.flags, 'story:village:longBench': 1 } }
    expect(newsRecent(built, 'smith')).toEqual([])
    const shared = { ...built, life: { ...built.life, experiences: { 'project:longBench': { id: 'project:longBench', kind: 'project' as const, with: ['smith'], first: 5, last: 5, count: 1 } } } }
    expect(newsRecent(shared, 'smith')).toEqual([lifeText.news.habits['facility.longBench']])
    expect(newsRecent(shared, 'carpenter')).toEqual([])
  })

  it('소품은 근황이 보이는 동안만 놓인다 — 이야기 뒤 소품은 그대로', () => {
    const s = full()
    let day = -1
    for (let d = 40; d < 400 && day < 0; d++) if (dayNews(s, d).has('bakerTray')) day = d
    expect(day).toBeGreaterThan(0)
    const on = at(s, day, 560)
    const off = at(s, day, 700)
    expect(newsPropsNow(on).map((p) => p.id)).toContain('bakerTray')
    expect(newsPropsNow(off).map((p) => p.id)).not.toContain('bakerTray')
    expect(storyPropsNow(on)).toEqual(storyPropsNow(off))
  })

  it('옛 저장(수첩에 근황 칸이 없다)·깨진 값은 그대로 열린다', () => {
    const s = full()
    const old = { ...s, notebook: { met: [], likes: {}, dislikes: {}, seen: {}, heard: {} } }
    const back = deserialize(serialize(old), CONTENT)!
    expect(back.notebook?.news).toBeUndefined()
    expect(newsRecent(back, 'smith')).toEqual([])
    expect(sanitizeNotebook({ met: [], likes: {}, dislikes: {}, seen: {}, heard: {}, news: { smith: { id: 'nope', day: 3 }, baker: { id: 'bakerTray', day: 4 }, tilly: { id: 'smithBreak', day: -1 } } }).news).toEqual({ baker: { id: 'bakerTray', day: 4 } })
  })

  it('필사·말씀 기록 접근은 근황과 무관 — 근황은 상태를 바꾸지 않는다', () => {
    const s = full()
    const before = JSON.stringify([s.progress, s.shelved, s.collected, s.flags])
    for (let day = 40; day < 60; day++) dayNews(s, day)
    settle(at(s, 45, 800), CONTENT)
    expect(JSON.stringify([s.progress, s.shelved, s.collected, s.flags])).toBe(before)
  })
})

