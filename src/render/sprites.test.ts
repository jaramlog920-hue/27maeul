import { ANIMAL, ANIMAL_PALETTE, BABY, ICON_PALETTE, ICONS, PALETTE, SHEEP, SMALL_PALETTE, SPRITE_H, SPRITE_W, mirror, spriteRows, writerPalette, type Who } from './sprites'
import { ACCS, BOTTOMS, HAIR_BACKS, HAIR_FRONTS, SKINS, withLookDefaults } from '../engine/avatar'
import { breathOffset, isBlinking, walkFrame, dozeNod, lookSide } from './anim'
import { ITEM_TEXT } from '../content/text'
import type { Facing } from '../engine/types'

const FACINGS: Facing[] = ['up', 'down', 'left', 'right']
const PEOPLE: Who[] = ['writer', 'baker', 'child', 'grandpa', 'merchant', 'smith', 'shepherd', 'presser', 'weaver', 'beekeeper', 'postman', 'innkeeper', 'fisher', 'carpenter']

function valid(rows: readonly string[], pal: Record<string, string>, w?: number) {
  const width = w ?? rows[0].length
  for (const r of rows) {
    expect(r).toHaveLength(width)
    for (const ch of r) if (ch !== '.') expect(pal[ch], `"${ch}" in ${r}`).toBeDefined()
  }
}

describe('사람 도트', () => {
  it('모든 사람·방향·자세가 10칸 폭이고 팔레트 밖의 색이 없다', () => {
    for (const who of PEOPLE)
      for (const f of FACINGS)
        for (const frame of [0, 1] as const)
          for (const pose of ['stand', 'handUp', 'wave', 'crouch'] as const) {
            const rows = spriteRows(who, f, { frame, blink: frame === 1, pose, season: 'winter', inky: true, growth: 1 })
            valid(rows, PALETTE, SPRITE_W)
          }
  })
  it('어른은 14줄, 아이는 계절마다 한 줄씩 자란다', () => {
    expect(spriteRows('baker', 'down', { frame: 0, blink: false })).toHaveLength(SPRITE_H)
    const h = (g: number) => spriteRows('child', 'down', { frame: 0, blink: false, growth: g }).length
    expect(h(0)).toBe(11)
    expect(h(1)).toBe(12)
    expect(h(3)).toBe(14)
  })
  it('눈을 감으면 눈 줄이 바뀐다', () => {
    const open = spriteRows('writer', 'down', { frame: 0, blink: false })
    const shut = spriteRows('writer', 'down', { frame: 0, blink: true })
    expect(shut[4]).not.toBe(open[4])
  })
  it('왼쪽은 오른쪽의 거울', () => {
    const right = spriteRows('writer', 'right', { frame: 0, blink: false })
    expect(spriteRows('writer', 'left', { frame: 0, blink: false })).toEqual(mirror(right))
  })
  it('이웃마다 모습이 다르다', () => {
    const seen = new Set(PEOPLE.map((w) => spriteRows(w, 'down', { frame: 0, blink: false }).join('|')))
    expect(seen.size).toBe(PEOPLE.length)
  })
  it('주인공 모습: 여자는 긴 머리가 보인다', () => {
    const m = spriteRows('writer', 'down', { frame: 0, blink: false, look: 'm' })
    const f = spriteRows('writer', 'down', { frame: 0, blink: false, look: 'f' })
    expect(f).not.toEqual(m)
    expect(f[5][0]).toBe('h')
  })
  it('주인공이 고른 머리·아래옷·장신구마다 도트가 다르고, 모든 칸에 색이 있다', () => {
    const base = withLookDefaults({ look: 'm', name: '바다' })
    const pal = writerPalette('spring', base)
    for (const key of ['hairFront', 'hairBack', 'bottom', 'acc'] as const) {
      const n = { hairFront: HAIR_FRONTS.length, hairBack: HAIR_BACKS.length, bottom: BOTTOMS.length, acc: ACCS.length }[key]
      const seen = new Set<string>()
      for (let i = 0; i < n; i++) {
        const a = { ...base, [key]: i }
        for (const facing of ['down', 'up', 'right'] as const) valid(spriteRows('writer', facing, { frame: 0, blink: false, avatar: a }), writerPalette('spring', a))
        seen.add(spriteRows('writer', 'down', { frame: 0, blink: false, avatar: a }).join('|'))
      }
      expect(seen.size).toBe(n)
    }
    expect(pal.s).toBe(SKINS[base.skin])
  })
  it('긴 머리는 머리 옆에서 어깨까지 끊기지 않는다 (양갈래처럼 보이지 않게)', () => {
    const a = { ...withLookDefaults({ look: 'f', name: '하늘' }), hairFront: 0, hairBack: 1 }
    const rows = spriteRows('writer', 'down', { frame: 0, blink: false, avatar: a })
    for (let y = 2; y <= 8; y++) expect(rows[y][0], `y=${y}`).toBe('h')
    for (let y = 3; y <= 7; y++) expect(rows[y][1], `y=${y}`).toBe('h')
  })
})

describe('동물·작은 것·아이콘', () => {
  it('고양이·강아지의 모든 모습', () => {
    for (const k of ['cat', 'dog'] as const) for (const form of ['adult', 'baby', 'curl'] as const) valid(ANIMAL[k][form], ANIMAL_PALETTE[k])
  })
  it('양·아기', () => {
    valid(SHEEP, SMALL_PALETTE)
    for (const st of ['baby', 'crawl', 'walk'] as const) valid(BABY[st], SMALL_PALETTE)
  })
  it('가방의 모든 물건에 8×8 아이콘이 있다', () => {
    for (const id of Object.keys(ITEM_TEXT)) {
      expect(ICONS[id], id).toBeDefined()
      expect(ICONS[id]).toHaveLength(8)
      valid(ICONS[id], ICON_PALETTE, 8)
    }
  })
})

describe('anim', () => {
  it('숨은 0과 1 사이를 오간다', () => {
    const seen = new Set<number>()
    for (let t = 0; t < 4; t += 0.1) seen.add(breathOffset(t))
    expect([...seen].sort()).toEqual([0, 1])
  })
  it('눈 깜빡임은 드물다', () => {
    let blinks = 0
    for (let t = 0; t < 43; t += 0.01) if (isBlinking(t)) blinks++
    expect(blinks / 4300).toBeLessThan(0.06)
    expect(blinks).toBeGreaterThan(0)
  })
  it('음수 시간에도 0/1만 돌려준다', () => {
    for (const t of [-0.001, -1.7, -3]) {
      expect([0, 1]).toContain(walkFrame(t))
      expect([0, 1]).toContain(dozeNod(t))
      expect(['left', 'right']).toContain(lookSide(t))
      expect(typeof isBlinking(t)).toBe('boolean')
    }
  })
  it('걸음·끄덕임·두리번', () => {
    expect(walkFrame(0)).toBe(0)
    expect(walkFrame(1 / 6 + 0.01)).toBe(1)
    expect(dozeNod(0)).toBe(0)
    expect(dozeNod(1.5)).toBe(1)
    expect(lookSide(0)).toBe('right')
    expect(lookSide(0.9)).toBe('left')
  })
})
