// 계획 6b: 사람들 내용(people.json)이 게임 안에서 실제로 돌아가는지 — 자리·말하는 이·장면·기억 표식·이름 부르기
import { CONTENT, PEOPLE } from './catalog'
import { callName, SCENES } from './text'
import { route } from '../engine/neighbors'
import { findPath } from '../engine/movement'
import { isWalkable } from '../engine/world'
import { allSightings } from '../engine/people'
import type { Tile } from '../engine/types'

const doorOf = (id: string) => CONTENT.neighbors.find((n) => n.id === id)!.door
const reach = (from: Tile, to: Tile) => findPath(from, to) ?? route(from, to)
const speakers = new Set([...CONTENT.neighbors.map((n) => n.id), 'narration'])

describe('people.json', () => {
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
  })

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
    for (const p of Object.values(PEOPLE.people)) {
      const reqs = [...p.lines.map((l) => l.req), ...(p.events ?? []).map((e) => e.req)]
      for (const r of reqs) for (const m of [...(r?.memory ?? []), ...(r?.notMemory ?? [])]) expect(made.has(m), `${p.id}: ${m}`).toBe(true)
    }
  })

  it('말 id는 사람 안에서 겹치지 않는다 (되풀이 피하기가 id로 센다)', () => {
    for (const p of Object.values(PEOPLE.people)) {
      const ids = p.lines.map((l) => l.id)
      expect(new Set(ids).size, p.id).toBe(ids.length)
    }
  })

  it('사람마다 이벤트는 문턱(편한 사이·친구·특별한 사람·마음이 가는 사이)을 차례로 연다 (이벤트가 있는 사람만)', () => {
    for (const p of Object.values(PEOPLE.people)) {
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
