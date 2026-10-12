import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { HALL_SPOTS } from '../engine/places'
import type { Appt } from '../engine/plans'
import { socialEventMotion } from '../engine/social-scene'
import { gatheringActionFor, GATHERING_ACTIONS, gatheringMotionFrame } from './gathering-motion'
import { withLookDefaults } from '../engine/avatar'
import { writerPalette } from './sprites'
import { FURNI_PALETTE } from './furniture-art'
import { motionBodyRows } from './motion-body'

describe('모임별 구체적인 동작', () => {
  it('정면 인사·가리키기는 어깨부터 손끝까지 연결되고, 뒷모습은 손이 등을 덮지 않는다', () => {
    for (const short of [undefined, 1]) for (let frame = 0; frame < 4; frame++) {
      for (const action of ['point', 'greet'] as const) {
        const m = gatheringMotionFrame('writer', 'down', action, frame, { frame: 0, blink: false, short })
        const start = { x: m.handAnchor.x - 1, y: m.handAnchor.y }
        const seen = new Set<string>(), todo = [start]
        while (todo.length) {
          const p = todo.pop()!, key = `${p.x}:${p.y}`
          if (seen.has(key) || !m.actor[p.y]?.[p.x] || m.actor[p.y][p.x] === '.') continue
          seen.add(key)
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (p.x+dx >= 0 && p.x+dx < 24 && p.y+dy >= 0 && p.y+dy < 24) todo.push({ x: p.x+dx, y: p.y+dy })
        }
        expect(seen.has('14:11'), `${action} ${short} ${frame}`).toBe(true)
      }
      for (const action of GATHERING_ACTIONS) {
        const m = gatheringMotionFrame('writer', 'up', action, frame, { frame: 0, blink: false, short })
        const pose = action === 'plant' || action === 'stitch' ? 'crouch' : 'stand'
        const source = motionBodyRows('writer','up',{ frame:0, blink:frame===3, short, pose })
        const y0 = m.anchor.y-source.length
        source.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')expect(m.actor[y+y0][x+7]).toBe(c)}))
      }
    }
  })
  it('진행 중인 모임의 차·바느질·기록·씨앗·물주기 역할이 새 그림으로 연결된다', () => {
    const base = newGame(CONTENT)
    const appt: Appt = { id: 'motion:1', clubId: 'club:1', kind: 'club', day: 2, from: 600, to: 720, place: 'hallTable', members: ['baker', 'grandpa'], startedWith: ['baker', 'grandpa'], state: 'running', rewarded: false, remembered: false, attended: true, activity: 'tea' }
    const npcs = { ...base.npcs }
    appt.members.forEach((id, i) => { npcs[id] = { ...npcs[id], ...HALL_SPOTS[i], visible: true, path: [], goal: HALL_SPOTS[i] } })
    const state = { ...base, clock: { day: 2, minute: 604 }, plans: { appts: [appt], nextId: 2 }, npcs, scenes: [] }
    for (const [activity, minute, npc, expected] of [
      ['tea', 604, 'baker', 'pourTea'], ['tea', 613, 'baker', 'sipTea'],
      ['sew', 604, 'baker', 'stitch'], ['sew', 610, 'baker', 'showWork'],
      ['observe', 604, 'baker', 'takeNote'], ['garden', 604, 'baker', 'plant'], ['garden', 610, 'grandpa', 'waterPlants'],
    ] as const) {
      const s = { ...state, clock: { day: 2, minute }, plans: { ...state.plans, appts: [{ ...appt, activity }] } }
      expect(gatheringActionFor(socialEventMotion(s, npc, 1)!)).toBe(expected)
    }
    expect(gatheringActionFor({ set: 'social', action: 'read', prop: 'copy', frame: 0, facing: 'right', label: '내 말씀 필사본 함께 읽기' })).toBeNull()
    expect(gatheringActionFor({ set: 'wedding', action: 'wave', frame: 0, facing: 'right' })).toBeNull()
  })

  it('모든 동작이 현재 외형·네 방향·아이 크기를 유지하고 프레임마다 움직인다', () => {
    const avatar = withLookDefaults({ look: 'f', name: '', skin: 2, top: 13, bottom: 4 })
    for (const short of [undefined, 1]) for (const action of GATHERING_ACTIONS) {
      const frames = []
      for (const facing of ['up', 'down', 'left', 'right'] as const) for (let frame = 0; frame < 4; frame++) {
        const m = gatheringMotionFrame('writer', facing, action, frame, { frame: 0, blink: false, avatar, short })
        for (const [rows, palette] of [[m.actor, writerPalette('spring', avatar)], [m.propFront, FURNI_PALETTE], [m.propBack, FURNI_PALETTE]] as const) {
          expect(rows).toHaveLength(24)
          for (const row of rows) { expect(row).toHaveLength(24); for (const pixel of row) if (pixel !== '.') expect(palette[pixel]).toBeDefined() }
        }
        if (facing === 'right') frames.push(JSON.stringify([m.actor, m.propFront]))
        if (facing === 'left') {
          const right = gatheringMotionFrame('writer', 'right', action, frame, { frame: 0, blink: false, avatar, short })
          expect(m.actor).toEqual(right.actor.map((row) => [...row].reverse().join('')))
          expect(m.propFront).toEqual(right.propFront.map((row) => [...row].reverse().join('')))
        }
      }
      expect(new Set(frames).size, action).toBeGreaterThan(1)
    }
  })

  it('집들이 선물을 맡으면 유저는 받고 선택한 손님은 건네는 동작으로 연결된다', () => {
    const s = newGame(CONTENT)
    const members = ['baker', 'grandpa']
    members.forEach((id, i) => { s.npcs[id] = { ...s.npcs[id], ...HALL_SPOTS[i], visible: true, path: [], goal: HALL_SPOTS[i] } })
    s.clock = { day: 2, minute: 604 }
    s.player = { ...s.player, x: HALL_SPOTS[0].x, y: HALL_SPOTS[0].y + 1, path: [] }
    s.plans.appts = [{ id: 'gift:1', festId: 'gift:fest', kind: 'event', day: 2, from: 600, to: 720, place: 'hallTable', members, startedWith: members, state: 'running', rewarded: false, remembered: false, attended: true, activity: 'tea' }]
    s.fests = [{ id: 'gift:fest', apptId: 'gift:1', kind: 'housewarming', day: 2, place: 'hallTable', members, reserve: {}, step: 'activity', joined: true, consumed: false, closed: false, cancelled: false, task: { stage: 1, selection: '선물 받아 함께 살펴보기' } }]
    expect(gatheringActionFor(socialEventMotion(s, 'player', 1)!)).toBe('receiveGift')
    expect(gatheringActionFor(socialEventMotion(s, 'baker', 1)!)).toBe('offerGift')
    expect(socialEventMotion(s, 'grandpa', 1)?.action).toBe('nod')
    expect(s.fests[0].consumed).toBe(false)
  })
})
