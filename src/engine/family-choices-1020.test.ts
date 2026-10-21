// 2026-10-20 사용자 결정: 떠난 아이 셋 다 다니러 옴 · 사는 집 허물기 확인 · 성별 맞춘 외형 · 셋째 대 이어받기
import { CONTENT } from '../content/catalog'
import { newChild } from './child'
import { goToSleep, sceneSeen, type GameState } from './game'
import { establishedGame } from './growth-test-support'
import { canHaveBaby, generationOf, settleBirth, fitGenderLook } from './gen-birth'
import { settleGrowth, slotPerson, RETIRE_AFTER } from './gen-growth'
import { demolishBuild } from './newland-build'
import { GUEST_GAP, kidVisiting } from './newland-life'

const guestHouse = { id: 'b3', kind: 'guest', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false, slot: 0 }

describe('떠난 아이 셋 다 다니러 온다', () => {
  it('함께하는 아이가 집에 있어도, 멀리 떠난 둘째가 차례가 되면 손님집에 묵고 다녀간 뒤 원래 아이로 돌아온다', () => {
    const s0 = establishedGame(CONTENT, 200)
    const day = 400
    let s: GameState = {
      ...s0,
      clock: { day, minute: 22 * 60 },
      romance: { partner: 'cosmo', stage: 'married', since: 1, weddingDay: 10, marriedDay: 10 },
      child: { ...newChild(day - 200, s0.stats, undefined), born: day - 200, name: '하나' },
      siblings: [{ ...newChild(day - 150, s0.stats, undefined), born: day - 150, name: '둘', job: 'weaver', left: true, kidFlags: {} }],
      newland: { builds: [guestHouse], tiles: {}, nextId: 4, settledDay: 0 } as never,
      flags: { ...s0.flags, newlandRevealed: 1 },
      scenes: [],
    }
    s = goToSleep(s, CONTENT)
    expect(s.child?.name).toBe('둘')
    expect(kidVisiting(s)).toBe(true)
    for (let i = 0; i < 4 && kidVisiting(s); i++) { s = goToSleep({ ...s, scenes: [], clock: { ...s.clock, minute: 22 * 60 } }, CONTENT) }
    expect(kidVisiting(s)).toBe(false)
    expect(s.child?.name).toBe('하나')
    expect(s.flags.visitPickedKid).toBeUndefined()
  })
})

describe('다니러 온 동생이 떠난 뒤 (2026-10-21 점검)', () => {
  it('40일 동안: 떠난 날 바로 새 손님이 오지 않고, 다시 차례가 오면 또 다니러 오며, 그 밖엔 고른 아이 그대로', () => {
    const s0 = establishedGame(CONTENT, 200)
    const day = 400
    let s: GameState = {
      ...s0, clock: { day, minute: 22 * 60 },
      romance: { partner: 'cosmo', stage: 'married', since: 1, weddingDay: 10, marriedDay: 10 },
      child: { ...newChild(day - 200, s0.stats, undefined), born: day - 200, name: '하나' },
      siblings: [{ ...newChild(day - 150, s0.stats, undefined), born: day - 150, name: '둘', job: 'weaver', left: true, kidFlags: {} }],
      newland: { builds: [guestHouse], tiles: {}, nextId: 4, settledDay: 0 } as never,
      flags: { ...s0.flags, newlandRevealed: 1 }, scenes: [],
    }
    let visits = 0, lastLeft = -99, wasVisiting = false
    for (let i = 0; i < 40; i++) {
      s = goToSleep({ ...s, clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
      for (const id of [...s.scenes]) s = sceneSeen(s, id, [])
      const v = kidVisiting(s)
      if (v && !wasVisiting) visits++
      if (!v && wasVisiting) lastLeft = s.clock.day
      if (s.flags.guestNow && s.flags.guestSince === s.clock.day) expect(s.clock.day - lastLeft).toBeGreaterThanOrEqual(GUEST_GAP)
      if (!v) expect(s.child?.name).toBe('하나')
      else expect(s.child?.name).toBe('둘')
      wasVisiting = v
    }
    expect(visits).toBe(2)
  })
})

describe('사는 사람이 있는 새 터 집을 허물면', () => {
  it('가족은 떠나고 한 달 동안 새 집을 바라지 않는다', () => {
    const home = { ...guestHouse, id: 'b1', kind: 'home' }
    const s = { coins: 0, inv: {}, clock: { day: 50, minute: 600 }, newland: { builds: [home], tiles: {}, nextId: 2 }, flags: { 'familyHome:1': 1, 'familyHomeDay:1': 10 } } as never
    const next = demolishBuild(s, 'b1') as unknown as { flags: Record<string, number> }
    expect(next.flags['familyHome:1']).toBeUndefined()
    expect(next.flags['movedAway:1']).toBe(50)
  })
})

describe('이웃 아기 외형은 성별에 맞춘다', () => {
  it('아들은 엄마의 치마·긴 머리를 물려받지 않는다', () => {
    for (let seed = 1; seed < 40; seed++) {
      const g = {
        seed, persons: { mom: { id: 'mom', origin: 'born', look: 'f', stage: 'adult', avatar: { bottom: 0, hairBack: 1, top: 21, skin: 2 }, parents: [], spouse: 'dad', household: 'h-1' }, dad: { id: 'dad', origin: 'born', look: 'm', stage: 'adult', avatar: { bottom: 2, hairBack: 0, top: 3, skin: 1 }, parents: [], spouse: 'mom', household: 'h-1' } },
        households: { 'h-1': { id: 'h-1', members: ['mom', 'dad'], home: 'mom', children: [], birthDue: 10 } },
        affinity: {}, relations: {}, log: [], nextPerson: 1,
      } as never
      const next = settleBirth(g, 10, { busy: () => false } as never)
      const baby = Object.values((next as { persons: Record<string, { origin: string; look: string; avatar: Record<string, number> }> }).persons).find((p) => p.origin === 'born' && p.look && !['mom', 'dad'].includes((p as never as { id: string }).id))!
      if (baby.look === 'm') {
        expect([2, 3, 6, 7]).toContain(baby.avatar.bottom)
        expect([0, 11]).toContain(baby.avatar.hairBack)
        expect(baby.avatar.top).not.toBe(21)
      } else expect(baby.avatar.bottom).toBe(0)
    }
  })
  it('예전에 태어난 아들의 긴 치마는 그림에서 바지로', () => {
    expect(fitGenderLook('m', { bottom: 0, hairBack: 1 })).toMatchObject({ bottom: 2, hairBack: 0 })
    expect(fitGenderLook('f', { bottom: 2 })).toMatchObject({ bottom: 2 })
  })
})

describe('셋째 대도 일을 잇는다', () => {
  it('자리를 이어받은 자녀의 다 큰 아이가 견습하고, 한 계절 뒤 그 자리를 잇는다', () => {
    const g0 = {
      seed: 1, persons: {
        baker: { id: 'baker', origin: 'fixed', npc: 'baker', stage: 'elder', parents: [], spouse: null, household: null },
        x: { id: 'x', origin: 'born', born: 0, stage: 'adult', parents: ['baker'], spouse: 'y', household: 'h-1' },
        y: { id: 'y', origin: 'born', born: 0, stage: 'adult', parents: [], spouse: 'x', household: 'h-1' },
        c: { id: 'c', origin: 'born', born: 100, stage: 'adult', parents: ['x', 'y'], spouse: null, household: 'h-1' },
      },
      households: { 'h-1': { id: 'h-1', members: ['x', 'y'], home: 'baker', children: ['c'] } },
      heirs: { baker: { heir: 'x', since: 10 } }, retired: { baker: { heir: 'x', day: 50 } }, log: [],
    } as never
    const access = { generations: true, retirement: true }
    let g = settleGrowth(g0, 200, access)
    expect((g as { heirs: Record<string, { heir: string }> }).heirs.baker.heir).toBe('c')
    expect(slotPerson(g, 'baker')).toBe('x')
    g = settleGrowth(g, 200 + RETIRE_AFTER, access)
    expect(slotPerson(g, 'baker')).toBe('c')
    // 플레이어의 짝 자리는 넘기지 않는다
    const kept = settleGrowth(g0, 200, { ...access, keep: 'baker' })
    expect((kept as { heirs: Record<string, { heir: string }> }).heirs.baker.heir).toBe('x')
  })
})

describe('아이는 손주(3대)까지만 (2026-10-21 사용자)', () => {
  const persons = {
    baker: { id: 'baker', origin: 'fixed', parents: [] },
    x: { id: 'x', origin: 'born', parents: ['baker'] },
    y: { id: 'y', origin: 'born', parents: [] },
    c: { id: 'c', origin: 'born', parents: ['x', 'y'] },
    d: { id: 'd', origin: 'born', parents: [] },
  }
  it('세대를 센다: 처음 주민 1대, 자녀 2대, 손주 3대', () => {
    expect(generationOf({ persons } as never, 'baker')).toBe(1)
    expect(generationOf({ persons } as never, 'x')).toBe(2)
    expect(generationOf({ persons } as never, 'c')).toBe(3)
  })
  it('자녀 부부는 아이를 가질 수 있고, 손주가 낀 부부는 못 가진다', () => {
    expect(canHaveBaby({ persons } as never, { members: ['x', 'y'] })).toBe(true)
    expect(canHaveBaby({ persons } as never, { members: ['c', 'd'] })).toBe(false)
  })
  it('손주 부부의 남은 출생 예약은 지워지고 아기가 오지 않는다', () => {
    const g = { seed: 1, persons, households: { 'h-1': { id: 'h-1', members: ['c', 'd'], home: 'c', children: [], birthDue: 10 } }, affinity: {}, relations: {}, log: [], nextPerson: 1 } as never
    const next = settleBirth(g, 10, { busy: () => false } as never) as { households: Record<string, { children: string[]; birthDue?: number }> }
    expect(next.households['h-1'].children).toHaveLength(0)
    expect(next.households['h-1'].birthDue).toBeUndefined()
  })
})

describe('손주 이름도 소식에 나온다 (2026-10-21 점검)', () => {
  it('부모를 거슬러 아는 이웃이 있으면 이름으로', async () => {
    const { personName } = await import('../content/gen-text')
    const gen = { persons: { x: { id: 'x', origin: 'born', parents: ['baker'], name: '엑스' }, c: { id: 'c', origin: 'born', parents: ['x', 'y'], name: '씨' } } }
    expect(personName({ notebook: { met: ['baker'] }, gen } as never, 'c')).toBe('씨')
    expect(personName({ notebook: { met: [] }, gen } as never, 'c')).not.toBe('씨')
  })
})
