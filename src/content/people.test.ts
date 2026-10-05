// 계획 6b: 사람들 내용(people.json)이 게임 안에서 실제로 돌아가는지 — 자리·말하는 이·장면·기억 표식·이름 부르기
import { CONTENT, PEOPLE } from './catalog'
import { callName, SCENES } from './text'
import { route } from '../engine/neighbors'
import { findPath } from '../engine/movement'
import { existsSync, readFileSync } from 'node:fs'
import { isWalkable, propFootprint, propSpotProblem, key } from '../engine/world'
import { FURNITURE_DEFS } from '../engine/room'
import { CANDIDATE_IDS } from '../engine/romance'
import { allSightings, type Routine, type When } from '../engine/people'
import type { Tile } from '../engine/types'
import { newGame, type GameState } from '../engine/game'
import { WORK_SHOPS } from '../engine/work-day'
import { deserialize, serialize } from '../engine/save'

const doorOf = (id: string) => CONTENT.neighbors.find((n) => n.id === id)!.door
const reach = (from: Tile, to: Tile) => findPath(from, to) ?? route(from, to)
/**
 * 완료 표식 story:<id>가 생기는 이야기 — 사건의 completes에서 센다 (계획 16 작업 4: 손으로 적은 목록 대신 실제 데이터).
 * 이야기 id → 그 갈래들(고를 말의 outcome)
 */
const STORIES = new Map<string, Set<number>>()
for (const p of Object.values(PEOPLE.people))
  for (const e of p.events ?? []) if (e.completes) STORIES.set(e.completes, new Set((e.choices ?? []).flatMap((c) => (c.outcome !== undefined ? [c.outcome] : []))))
const STORY_IDS: readonly string[] = [...STORIES.keys()]
const speakers = new Set([...CONTENT.neighbors.map((n) => n.id), 'narration'])
/** 방이 자기 이름이 아닌 이웃: 웬델은 빵 굽는 집에 같이 살고, 파피는 찻집에서 일한다 (계획 16 작업 10). 루디는 목수 집, 주니퍼는 벌 치는 집 (작업 11). 바질은 약방, 메리골드는 할아버지 집, 페넬로피는 베 짜는 집 (작업 12) */
const HOME_ROOM: Record<string, string> = { wendell: 'baker', poppy: 'teahouse', rudy: 'carpenter', juniper: 'beekeeper', basil: 'apothecary', marigold: 'grandpa', penelope: 'weaver' }

// ── 주민끼리 만나는 시간 (계획 16 작업 3) ──
const dist = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const withRoutines = (id: string): Routine[] => {
  const p = PEOPLE.people[id]
  return p ? [...p.routines, ...(p.offDays?.routines ?? [])].filter((r) => r.with) : []
}
const WET_KINDS = ['rain', 'snow', 'wet']
function weatherKinds(w: When['weather']): Set<'dry' | 'wet'> {
  if (!w) return new Set(['dry', 'wet'])
  return new Set(w.map((x) => (WET_KINDS.includes(x) ? 'wet' : 'dry')))
}
/** 두 때 조건이 함께 맞는 순간이 있는가 (시각·요일·날씨·계절) */
function overlaps(a: When | undefined, b: When | undefined): boolean {
  const lo = Math.max(a?.from ?? 0, b?.from ?? 0)
  const hi = Math.min(a?.to ?? 1500, b?.to ?? 1500)
  if (lo >= hi) return false
  if (a?.days && b?.days && !a.days.some((d) => b.days!.includes(d))) return false
  if (a?.season && b?.season && !a.season.some((x) => b.season!.includes(x))) return false
  const wa = weatherKinds(a?.weather)
  return [...weatherKinds(b?.weather)].some((x) => wa.has(x))
}

describe('people.json', () => {
  it('23명 생활 취향은 기존 선물 취향과 별개이며, 말에서 밝히는 키는 실제 선호에 있다', () => {
    expect(Object.keys(PEOPLE.people)).toHaveLength(23)
    for (const n of CONTENT.neighbors) {
      const p = PEOPLE.people[n.id]
      expect(p?.tastes, n.id).toBeDefined()
      for (const map of Object.values(p.tastes!)) for (const value of Object.values(map)) expect([-1, 0, 1]).toContain(value)
      for (const line of p.lines) if (line.reveals) {
        const [group, key] = line.reveals.split('.')
        expect((p.tastes as Record<string, Record<string, number>>)[group]?.[key], line.id).toBe(1)
      }
    }
  })
  it('사람은 모두 마을 이웃이다', () => {
    for (const id of Object.keys(PEOPLE.people)) expect(CONTENT.neighbors.some((n) => n.id === id), id).toBe(true)
  })

  it('일과·이벤트·목격 자리는 걸을 수 있고 그 사람 집 문에서 닿는다', () => {
    for (const p of Object.values(PEOPLE.people)) {
      const tiles: [string, Tile][] = [
        ...p.routines.map((r, i) => [`routine ${i}`, r.at] as [string, Tile]),
        ...(p.offDays?.routines ?? []).map((r, i) => [`off ${i}`, r.at] as [string, Tile]),
        ...(p.events ?? []).map((e) => [e.id, e.at] as [string, Tile]),
      ]
      for (const [label, t] of tiles) {
        expect(isWalkable(t), `${p.id} ${label} ${t.x},${t.y}`).toBe(true)
        expect(reach(doorOf(p.id), t), `${p.id} ${label} 길`).not.toBeNull()
      }
    }
    for (const t of PEOPLE.threads) for (const ph of t.phases) for (const [id, rs] of Object.entries(ph.routines ?? {})) for (const r of rs) {
      expect(isWalkable(r.at), `${t.id} ${id}`).toBe(true)
      expect(reach(doorOf(id), r.at), `${t.id} ${id} 길`).not.toBeNull()
    }
    for (const s of allSightings()) {
      expect(isWalkable(s.at), s.id).toBe(true)
      expect(reach(doorOf(s.npc), s.at), `${s.id} 길`).not.toBeNull()
    }
    // 모든 자리 길찾기라 전체 실행 중에는 5초를 넘기기도 한다 (HEAD에서도 같은 시간 초과)
  }, 30000)

  it('이벤트·목격은 장면으로 뜨고, 말하는 이는 이웃이나 해설뿐 (기록자는 말하지 않는다)', () => {
    for (const p of Object.values(PEOPLE.people))
      for (const e of p.events ?? []) {
        const sc = SCENES[`ev:${e.id}`]
        expect(sc, e.id).toBeDefined()
        for (const l of [...e.lines, ...(e.choices ?? []).flatMap((c) => c.reply)]) expect(speakers.has(l.speaker), `${e.id} ${l.speaker}`).toBe(true)
        expect(sc.choices?.length ?? 0).toBe(e.choices?.length ?? 0)
      }
    for (const s of allSightings()) {
      expect(SCENES[`saw:${s.id}`], s.id).toBeDefined()
      for (const l of s.lines) expect(speakers.has(l.speaker), `${s.id} ${l.speaker}`).toBe(true)
    }
  })

  it('말·이벤트가 기다리는 기억은 어딘가에서 생긴다 (목격·선택·약속·저절로)', () => {
    const made = new Set<string>(['rain', 'badGift'])
    for (const p of Object.values(PEOPLE.people)) {
      for (const e of p.events ?? []) for (const c of e.choices ?? []) {
        if (c.memory) made.add(c.memory)
        if (c.promise) {
          made.add(`kept:${c.promise.id}`)
          made.add(`forgot:${c.promise.id}`)
        }
      }
    }
    for (const s of allSightings()) made.add(s.memory)
    // 경험 기억 exp:<id> (계획 16 작업 2): 이벤트 선택·지킨 약속·좋아한 첫 선물·이야기 완료(사건 ID 표 §7 등록 목록)
    const exps = new Set<string>()
    for (const p of Object.values(PEOPLE.people))
      for (const e of p.events ?? []) {
        if (e.choices?.length) exps.add(`choice:${e.id}`)
        for (const c of e.choices ?? []) if (c.promise) exps.add(`promise:${c.promise.id}`)
      }
    for (const n of CONTENT.neighbors) exps.add(`gift:${n.id}`)
    for (const id of STORY_IDS) exps.add(`story:${id}`)
    // 함께 일한 기억 work:<이웃> (계획 16 작업 17)
    for (const n of Object.values(WORK_SHOPS).flatMap((sh) => sh.npcs)) exps.add(`work:${n}`)
    for (const x of exps) made.add(`exp:${x}`)
    for (const p of Object.values(PEOPLE.people)) {
      const reqs = [...p.lines.map((l) => l.req), ...(p.events ?? []).map((e) => e.req), ...(p.sightings ?? []).map((w) => w.req), ...p.routines.map((r) => r.req), ...(p.props ?? []).map((x) => x.req)]
      for (const r of reqs) {
        for (const m of [...(r?.memory ?? []), ...(r?.notMemory ?? [])]) expect(made.has(m), `${p.id}: ${m}`).toBe(true)
        for (const id of [...(r?.story ?? []).map((x) => x.id), ...(r?.notStory ?? [])]) expect(STORY_IDS.includes(id), `${p.id}: story:${id}`).toBe(true)
        // 갈래를 기다리는 조건은 그 이야기에 실제로 있는 갈래만
        for (const x of r?.story ?? []) if (x.outcome !== undefined) expect(STORIES.get(x.id)?.has(x.outcome), `${p.id}: story:${x.id} 갈래 ${x.outcome}`).toBe(true)
        for (const id of [...(r?.exp ?? []), ...(r?.notExp ?? []), ...(r?.recent ? [r.recent.exp] : []), ...(r?.expItem ? [r.expItem.exp] : [])]) expect(exps.has(id), `${p.id}: exp ${id}`).toBe(true)
      }
    }
  })

  it('함께하는 일과(with)는 상대에게도 겹치는 때·맞닿는 칸(거리 2 이내)의 일과가 있고, 두 칸 모두 걸을 수 있고 각자 집에서 닿는다', () => {
    for (const p of Object.values(PEOPLE.people))
      for (const r of withRoutines(p.id)) {
        const other = PEOPLE.people[r.with!]
        expect(other, `${p.id} → ${r.with}`).toBeDefined()
        const match = [...other.routines, ...(other.offDays?.routines ?? [])].find((o) => overlaps(r.when, o.when) && dist(o.at, r.at) <= 2)
        expect(match, `${p.id} ${r.when?.from}–${r.when?.to} → ${r.with}`).toBeDefined()
        for (const [who, t] of [[p.id, r.at], [other.id, match!.at]] as [string, Tile][]) {
          expect(isWalkable(t), `${who} ${t.x},${t.y}`).toBe(true)
          expect(reach(doorOf(who), t), `${who} ${t.x},${t.y} 길`).not.toBeNull()
        }
      }
  })

  it('맑은 날만 함께하는 일과는 같은 때 궂은 날 대체 일과가 양쪽에 있다 (서로 곁에서)', () => {
    for (const p of Object.values(PEOPLE.people))
      for (const r of withRoutines(p.id)) {
        if (!r.when?.weather || weatherKinds(r.when.weather).has('wet')) continue
        const wetWhen = { ...r.when, weather: ['wet' as const] }
        const mine = withRoutines(p.id).find((o) => o.with === r.with && overlaps(wetWhen, o.when) && weatherKinds(o.when?.weather).has('wet'))
        const theirs = withRoutines(r.with!).find((o) => o.with === p.id && overlaps(wetWhen, o.when) && weatherKinds(o.when?.weather).has('wet'))
        expect(mine, `${p.id} 궂은 날 ${r.when.from}`).toBeDefined()
        expect(theirs, `${r.with} 궂은 날 ${r.when.from}`).toBeDefined()
        expect(dist(mine!.at, theirs!.at), `${p.id}·${r.with} 궂은 날 자리`).toBeLessThanOrEqual(2)
      }
  })

  it('이야기 완료(completes)는 이야기마다 한 사건, 갈래는 모든 고를 말에 서로 다르게 — 남는 물건은 집에 놓는 가구', () => {
    const owners = new Map<string, string>()
    for (const p of Object.values(PEOPLE.people))
      for (const e of p.events ?? []) {
        for (const c of e.choices ?? []) if (c.outcome !== undefined) expect(e.completes, `${e.id}: 갈래는 completes 사건에만`).toBeDefined()
        if (!e.completes) continue
        // 같은 이야기를 끝내는 다른 길(이웃 없이 끝나는 길 — 계획 16 작업 11)은 서로를 notSeen으로 막을 때만
        const other = owners.get(e.completes)
        if (other) {
          const otherEvent = Object.values(PEOPLE.people).flatMap((q) => q.events ?? []).find((x) => x.id === other)!
          expect(!!e.req?.notSeen?.includes(other) && !!otherEvent.req?.notSeen?.includes(e.id), `${e.completes} 두 번 (${other}·${e.id})`).toBe(true)
        }
        owners.set(e.completes, e.id)
        const outs = (e.choices ?? []).map((c) => c.outcome)
        if (outs.some((o) => o !== undefined)) {
          expect(outs.every((o) => o !== undefined), `${e.id}: 갈래가 없는 고를 말`).toBe(true)
          expect(new Set(outs).size, `${e.id}: 같은 갈래`).toBe(outs.length)
        }
        if (e.keepsake) expect(FURNITURE_DEFS[e.keepsake], `${e.id} keepsake`).toBeDefined()
      }
  })

  it('이야기 뒤 소품은 그 이웃 집 방·작업장 앞의 지정 칸에만 — 길·문·누르는 곳·누군가 서는 자리가 아니다', () => {
    const MANIFEST = 'assets/furniture/expansion/manifest.json'
    const arts = existsSync(MANIFEST) ? new Set((JSON.parse(readFileSync(MANIFEST, 'utf-8')).items as { id: string }[]).map((x) => x.id)) : null
    // 사람이 서는 자리 (일과·벗어나는 날·이벤트·목격·마을 사건·시간표)
    const stands = new Set<string>()
    for (const p of Object.values(PEOPLE.people)) {
      for (const r of [...p.routines, ...(p.offDays?.routines ?? [])]) stands.add(key(r.at))
      for (const e of p.events ?? []) stands.add(key(e.at))
    }
    for (const w of allSightings()) stands.add(key(w.at))
    for (const t of PEOPLE.threads) for (const ph of t.phases) for (const rs of Object.values(ph.routines ?? {})) for (const r of rs) stands.add(key(r.at))
    for (const n of CONTENT.neighbors) for (const e of n.schedule) for (const t of [e.tile, e.wet]) if (t) stands.add(key(t))
    const ids = new Set<string>()
    for (const p of Object.values(PEOPLE.people))
      for (const pr of p.props ?? []) {
        expect(ids.has(pr.id), `${pr.id} 두 번`).toBe(false)
        ids.add(pr.id)
        expect(pr.item || pr.art, `${pr.id}: 그림`).toBeTruthy()
        if (pr.item) expect(FURNITURE_DEFS[pr.item], `${pr.id} item`).toBeDefined()
        if (pr.art && arts) expect(arts.has(pr.art), `${pr.id} art ${pr.art}`).toBe(true)
        if (pr.room) expect(pr.room, `${pr.id}: 그 이웃 집 방`).toBe(HOME_ROOM[p.id] ?? p.id)
        const tiles = propFootprint(pr.at, pr.item, pr.size)
        expect(propSpotProblem(tiles, pr.room), `${pr.id} 자리`).toBeNull()
        for (const t of tiles) expect(stands.has(key(t)), `${pr.id}: ${t.x},${t.y}에 누군가 선다`).toBe(false)
      }
  })

  it('말 id는 사람 안에서 겹치지 않는다 (되풀이 피하기가 id로 센다)', () => {
    for (const p of Object.values(PEOPLE.people)) {
      const ids = p.lines.map((l) => l.id)
      expect(new Set(ids).size, p.id).toBe(ids.length)
    }
  })

  it('연애 후보는 이벤트로 문턱(편한 사이·친구·특별한 사람·마음이 가는 사이)을 차례로 열고, 일반 주민 이야기는 문턱·고백을 만들지 않는다', () => {
    for (const p of Object.values(PEOPLE.people)) {
      if (!(CANDIDATE_IDS as readonly string[]).includes(p.id)) {
        for (const e of p.events ?? []) {
          expect(e.opens, `${e.id} opens`).toBeUndefined()
          expect(e.confess, `${e.id} confess`).toBeUndefined()
        }
        continue
      }
      if (!p.events?.length) continue
      const opens = new Set(p.events.map((e) => e.opens).filter((x) => x !== undefined))
      for (const st of [2, 3, 4, 5]) expect(opens.has(st as never), `${p.id} ${st}`).toBe(true)
      expect(p.events.filter((e) => e.confess)).toHaveLength(1)
    }
  })
})

describe('이웃이 부르는 이름', () => {
  it('문장 속 {player}는 주인공이 정한 이름으로, 정하지 않았으면 필사가', () => {
    expect(callName('{player}님 오셨어요?', '하늘')).toBe('하늘님 오셨어요?')
    expect(callName('{player}님', undefined)).toBe('필사가님')
    expect(callName('그냥 말', '하늘')).toBe('그냥 말')
  })
  it('이웃 말·장면에는 "필사가님"이 없다 — 모두 {player}로 부른다', () => {
    const all = JSON.stringify(PEOPLE) + JSON.stringify(SCENES)
    expect(all.includes('필사가님')).toBe(false)
  })
})

describe('양 이야기 (2026-10-05: 잃고 찾는 이야기에서 토끼풀 첫 입으로)', () => {
  const lamb = PEOPLE.threads.find((t) => t.id === 'lamb')!
  it('양이 없어지거나 찾는 말이 없다 — 날짜·사람·장면 모양은 그대로', () => {
    const people = Object.values(PEOPLE.people)
    const text =
      JSON.stringify(lamb) +
      JSON.stringify(people.flatMap((p) => p.lines.filter((l) => l.req?.thread?.id === 'lamb'))) +
      JSON.stringify(people.flatMap((p) => (p.events ?? []).filter((e) => e.id === 'juniper:lamb' || e.id === 'dexter:count')))
    for (const w of ['없어졌', '찾았', '찾아 줬', '찾던', '숨어 있었', '모자라요']) expect(text.includes(w), w).toBe(false)
    expect(lamb.phases.map((p) => p.day)).toEqual([30, 32, 33])
    expect(allSightings().filter((s) => s.thread === 'lamb').map((s) => [s.id, s.npc, s.memory])).toEqual([
      ['lamb:clover', 'juniper', 'saw:lambClover'],
      ['lamb:firstBite', 'basil', 'saw:lambFirstBite'],
    ])
    expect(SCENES['saw:lamb:clover'].title).toBe('벌통 들의 토끼풀')
  })
  it('옛 저장의 목격·기억·장면 표식은 새 id로 옮겨진다', () => {
    const s = newGame(CONTENT)
    const old: GameState = {
      ...s,
      life: { ...s.life, seen: ['lamb:found', 'lamb:splint', 'juniper:lamb'], memories: { juniper: [{ tag: 'saw:lambFound', day: 32, weather: 'sunny', season: 'spring' }], basil: [{ tag: 'saw:lambSplint', day: 33, weather: 'sunny', season: 'spring' }] } },
      scenes: [...s.scenes, 'saw:lamb:found', 'saw:lamb:splint'],
    } as GameState
    const back = deserialize(serialize(old), CONTENT)!
    expect(back.life.seen).toEqual(['lamb:clover', 'lamb:firstBite', 'juniper:lamb'])
    expect(back.life.memories.juniper.map((m) => m.tag)).toEqual(['saw:lambClover'])
    expect(back.life.memories.basil.map((m) => m.tag)).toEqual(['saw:lambFirstBite'])
    expect(back.scenes).toContain('saw:lamb:clover')
    expect(back.scenes).toContain('saw:lamb:firstBite')
    expect(back.scenes.some((x) => x.includes('found') || x.includes('splint'))).toBe(false)
  })
})
