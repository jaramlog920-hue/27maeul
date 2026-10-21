import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { newGenState, type GenState } from './gen'
import { fitGenderLook, settleBirth } from './gen-birth'
import { settleGrowth, stageByAge } from './gen-growth'
import { STAGE_AT } from './gen-config'
import { deserialize, serialize } from './save'
import { genAvatar } from './gen-looks'

const ctx = { partner: null, busy: () => false, cooling: () => false }
const fatherAvatar = { skin: 0, hairFront: 1, hairBack: 0, top: 1, bottom: 0 }
const motherAvatar = { skin: 1, hairFront: 0, hairBack: 1, top: 0, bottom: 1 }
const fatherHair: [number, number, number] = [28, 45, 30]
const motherHair: [number, number, number] = [210, 30, 40]

function parents(seed: number): GenState {
  const g = newGenState(CONTENT, seed, 100)
  return {
    ...g, nextPerson: 3,
    persons: {
      ...g.persons,
      'g-0001': { id: 'g-0001', origin: 'born', born: 1, stage: 'adult', look: 'm', name: '테디', avatar: fatherAvatar, hair: fatherHair, parents: ['rudy', 'poppy'], spouse: 'g-0002', household: 'h-2' },
      'g-0002': { id: 'g-0002', origin: 'born', born: 1, stage: 'adult', look: 'f', name: '루시', avatar: motherAvatar, hair: motherHair, parents: ['wendell', 'tilly'], spouse: 'g-0001', household: 'h-2' },
    },
    households: { 'h-2': { id: 'h-2', members: ['g-0001', 'g-0002'], children: [], home: 'rudy', since: 90, lastBirth: null, birthDue: 100 } },
  }
}

describe('생성 주민의 유전과 성장 저장 경계', () => {
  it.each([1, 7, 19, 33, 127, 7919])('씨앗 %i: 손주의 출생·성장·반복 복원이 부모 외형과 계보를 유지한다', (seed) => {
    const base = { ...newGame(CONTENT), scenes: [], clock: { day: 100, minute: 600 }, gen: parents(seed) }
    const restored = deserialize(serialize(base), CONTENT)!
    const direct = settleBirth(base.gen, 100, ctx)
    let g = settleBirth(restored.gen!, 100, ctx)
    const baby = g.persons['g-0003']
    expect(baby).toEqual(direct.persons['g-0003'])
    expect(baby.parents).toEqual(['g-0001', 'g-0002'])
    expect([fatherHair, motherHair]).toContainEqual(baby.hair)
    for (const k of Object.keys(fatherAvatar) as (keyof typeof fatherAvatar)[]) {
      // 옷·머리 모양은 아이 성별에 어울리는 부모 것, 둘 다 안 어울리면 그 성별의 기본값 (2026-10-20 사용자)
      const look = baby.look ?? 'f'
      const fit = [fatherAvatar[k], motherAvatar[k]].map((v) => fitGenderLook(look, { [k]: v })[k])
      expect(fit).toContain(baby.avatar?.[k])
    }
    expect(settleBirth(g, 100, ctx).households['h-2'].children).toEqual(['g-0003'])
    const rendered = genAvatar(baby)
    // 실제 게임 날짜를 하루씩 진행한다. 밀린 날 정산 제한/자율 진행 끄기와는 별도 범위다.
    const checkpoints = new Set([0, ...Object.values(STAGE_AT).flatMap(n => [n - 1, n]), STAGE_AT.elder + 30])
    for (let age = 0; age <= STAGE_AT.elder + 30; age++) {
      g = settleGrowth(g, 100 + age)
      if (!checkpoints.has(age)) continue
      const saved = { ...base, clock: { day: 100 + age, minute: 600 }, gen: { ...g, settledDay: 100 + age } }
      const back = deserialize(serialize(saved), CONTENT)!
      const child = back.gen!.persons['g-0003']
      expect(child).toMatchObject({ ...baby, stage: stageByAge(100, 100 + age) })
      expect(genAvatar(child)).toEqual(rendered)
      expect(back.gen!.households['h-2'].children).toEqual(['g-0003'])
      expect(back.gen!.persons['g-0001'].spouse).toBe('g-0002')
      expect(deserialize(serialize(back), CONTENT)!.gen).toEqual(back.gen)
      expect(settleGrowth(back.gen!, 100 + age).log).toEqual(back.gen!.log)
      g = back.gen!
    }
  })
})
