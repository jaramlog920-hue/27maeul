import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { newGenState, type GenPerson } from '../engine/gen'
import { ROOMS, sameTile, villageTileAt } from '../engine/world'
import { householdBabies, libraryVisitor } from './village-followup-scene'
import { MEETING_EMOTES, MEETING_PALETTE, meetingEmoteRows, householdCradleFrame, VISITOR_KINDS, visitorFrame } from './village-followup-art'

describe('세대와 서고 그림 연결', () => {
  const room = ROOMS.find(r => r.owner === 'carpenter')!
  const baby: GenPerson = { id: 'g-0001', origin: 'born', born: 5, stage: 'baby', look: 'f', name: '루시', avatar: { skin: 4 }, parents: ['carpenter', 'smith'], spouse: null, household: 'h-0001' }
  function family() {
    const s = newGame(CONTENT), gen = newGenState(CONTENT, 5, 5)
    return { ...s, clock: { ...s.clock, day: 6, minute: 12 * 60 }, gen: { ...gen, persons: { ...gen.persons, [baby.id]: baby }, households: { 'h-0001': { id: 'h-0001', home: 'carpenter', members: ['carpenter', 'smith'], children: [baby.id], lastBirth: 5, since: 1 } } } }
  }
  it('출생한 아기만 부모 집의 빈 바닥에 표시하며 저장을 바꾸지 않는다', () => {
    const s = family(), before = structuredClone(s)
    const cribs = householdBabies(s, room)
    expect(cribs).toHaveLength(1)
    expect(villageTileAt(cribs[0].at.x, cribs[0].at.y)).toBe('f')
    expect(sameTile(cribs[0].at, room.sit)).toBe(false)
    expect(sameTile(cribs[0].at, room.entry)).toBe(false)
    expect(householdBabies(s, ROOMS.find(r => r.owner === 'baker')!)).toEqual([])
    expect(householdBabies(s, null)).toEqual([])
    expect(s).toEqual(before)
    s.gen.persons[baby.id] = { ...baby, born: 7 }
    expect(householdBabies(s, room)).toEqual([])
    s.gen.persons[baby.id] = { ...baby, stage: 'child' }
    expect(householdBabies(s, room)).toEqual([])
  })
  it('형제의 요람이 겹치지 않고 밤에는 눈을 감는다', () => {
    const s = family(), second = { ...baby, id: 'g-0002' }
    s.gen.persons[second.id] = second; s.gen.households['h-0001'].children.push(second.id)
    s.clock.minute = 20 * 60
    const cribs = householdBabies(s, room)
    expect(cribs).toHaveLength(2)
    expect(cribs.every(c => c.sleeping)).toBe(true)
    expect(sameTile(cribs[0].at, cribs[1].at)).toBe(false)
    expect(householdCradleFrame(baby, 0, true).actor).not.toEqual(householdCradleFrame(baby, 0, false).actor)
  })
  it('오늘 방명록의 방문객만 방문 시간에 나타나고 서고 바닥에 앉는다', () => {
    const s = newGame(CONTENT); s.clock.day = 9
    s.guestbook = [{ day: 8, kind: 'kid' }]; s.clock.minute = 12 * 60
    expect(libraryVisitor(s)).toBeNull()
    s.guestbook.push({ day: 9, kind: 'scribe' })
    // 드나드는 동선 (2026-10-07): 09:00 길에서 걸어오고 10:00 안에서 자리로, 16:00 자리→문, 16:40 길로
    for (const [m, action, moving] of [[539, null, false], [540, 'stand', true], [570, 'stand', false], [600, 'stand', true], [615, 'write', false], [630, 'read', false], [840, 'write', false], [960, 'stand', true], [985, 'stand', false], [1005, 'stand', true], [1020, null, false]] as const) {
      s.clock.minute = m
      const v = libraryVisitor(s)
      expect(v?.action ?? null).toBe(action)
      expect(!!v?.moving).toBe(moving)
      if (v && !v.moving) { expect(v.kind).toBe('scribe'); expect(villageTileAt(v.at.x, v.at.y)).toMatch(/^[f,.e]$/) }
    }
  })
  it('도트의 모든 레이어가 유효하고 방문객 네 종류와 감정 다섯 종류가 구별된다', () => {
    const valid = (rows: string[], palette: Record<string, string>, w: number) => expect(rows.every(r => r.length === w && [...r].every(c => c === '.' || palette[c]))).toBe(true)
    expect(new Set(MEETING_EMOTES.map(id => meetingEmoteRows(id).join('\n'))).size).toBe(5)
    for (const id of MEETING_EMOTES) valid(meetingEmoteRows(id), MEETING_PALETTE, 13)
    for (const kind of VISITOR_KINDS) for (const action of ['stand', 'read', 'write'] as const) for (let f = 0; f < 4; f++) {
      const a = visitorFrame(kind, action, f)
      valid(a.actor, a.actorPalette, 24); valid(a.propFront, a.propPalette, 24)
    }
    expect(new Set(VISITOR_KINDS.map(k => JSON.stringify(visitorFrame(k, 'stand', 0)))).size).toBe(4)
    const c = householdCradleFrame(baby, 0, false)
    valid(c.back, c.propPalette, 16); valid(c.actor, c.actorPalette, 16); valid(c.front, c.propPalette, 16)
  })
})
