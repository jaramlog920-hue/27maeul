import { householdCradleFrame } from './village-followup-art'
import { NEWBORN_PALETTE,NEWBORN_ROWS } from './sprites'
import { genAvatar } from '../engine/gen-looks'
import type { GenPerson } from '../engine/gen'
import { writerPalette } from './sprites'

const baby = { look: 'f' as const, name: '', avatar: { skin: 4 } }

describe('요람 안에 누운 포대기 아기', () => {
  it('uses inherited hair colors on the existing hair pixels without changing the cradle art', () => {
    const original = householdCradleFrame(baby, 0, false)
    const colors: [number, number, number][] = [[10, 70, 40], [210, 65, 60]]
    const palettes = colors.map(hair => {
      const person: GenPerson = { ...baby, hair, id: 'test-baby', origin: 'born', born: 1, stage: 'baby', parents: [], spouse: null, household: null }
      const art = householdCradleFrame(person, 0, false)
      expect(art.actor).toEqual(original.actor)
      expect(art.back).toEqual(original.back)
      expect(art.front).toEqual(original.front)
      expect(art.actorPalette.s).toBe(original.actorPalette.s)
      expect(art.actorPalette.h).toBe(writerPalette('spring', genAvatar(person)).h)
      return art.actorPalette.h
    })
    expect(palettes[0]).not.toBe(palettes[1])
  })
  it('얼굴과 담요가 가로로 이어지고 앞 난간·기둥에 가리지 않는다', () => {
    const art = householdCradleFrame(baby, 0, false)
    expect(art.actorPalette.w).toBe(NEWBORN_PALETTE.w)
    expect(art.actorPalette.W).toBe(NEWBORN_PALETTE.W)
    const occupied = art.actor.flatMap((row, y) => [...row].flatMap((c, x) => c === '.' ? [] : [{ x, y, c }]))
    expect(Math.max(...occupied.map(p => p.x)) - Math.min(...occupied.map(p => p.x))).toBeGreaterThan(Math.max(...occupied.map(p => p.y)) - Math.min(...occupied.map(p => p.y)))
    for (const { x, y, c } of occupied) {
      expect(x).toBeGreaterThanOrEqual(4); expect(x).toBeLessThanOrEqual(12)
      expect(y).toBeGreaterThanOrEqual(4); expect(y).toBeLessThan(10)
      expect(art.front[y][x]).toBe('.'); expect(art.actorPalette[c]).toBeDefined()
    }
    expect(occupied.some(p => p.c === 's')).toBe(true)
    expect(occupied.some(p => p.c === '+')).toBe(true)
    expect(occupied.filter(p => p.c === 'w' || p.c === 'W').every(p => p.x >= 7)).toBe(true)
    expect(art.actorPalette.s).not.toBe(householdCradleFrame({ ...baby, avatar: { skin: 1 } }, 0, false).actorPalette.s)
  })
  it('잠들거나 눈을 깜빡여도 몸은 제자리이고 빈 요람에는 아기가 없다', () => {
    const awake = householdCradleFrame(baby, 0, false)
    const asleep = householdCradleFrame(baby, 0, true)
    expect(awake.actor.join('')).toContain('o')
    expect(asleep.actor.join('')).not.toContain('o')
    expect(asleep.actor.map(r => r.replaceAll('e', 'o'))).toEqual(awake.actor)
    expect(householdCradleFrame(baby, 2, false).actor).toEqual(asleep.actor)
    expect(asleep.front).toEqual(awake.front)
    const empty = householdCradleFrame(null, 0, false)
    expect(empty.actor.every(r => /^\.{16}$/.test(r))).toBe(true)
    expect(empty.back).toEqual(awake.back)
  })
})

it('모든 요람의 아기는 유저 돌보기 원본 몸 도트를 그대로 사용한다',()=>{
 const art=householdCradleFrame(baby,0,false)
 expect(art.actor.slice(4,10).map(r=>r.slice(4,13))).toEqual(NEWBORN_ROWS)
})
