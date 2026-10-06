import './dish-icons'
import { ANIMAL, ANIMAL_PALETTE, animalRows, BABY, ICON_PALETTE, ICONS, NEIGHBOR_SCARF, PALETTE, SHEEP, SMALL_PALETTE, SPRITE_H, SPRITE_W, mirror, spriteRows, writerPalette, type Who } from './sprites'
import { ACCS, BOTTOMS, HAIR_BACKS, HAIR_FRONTS, SKINS, TOPS, withLookDefaults } from '../engine/avatar'
import { breathOffset, isBlinking, walkFrame, dozeNod, lookSide } from './anim'
import { ITEM_TEXT } from '../content/text'
import { NEIGHBORS } from '../content/catalog'
import type { Facing } from '../engine/types'

const FACINGS: Facing[] = ['up', 'down', 'left', 'right']
const PEOPLE: Who[] = ['writer', 'baker', 'child', 'grandpa', 'merchant', 'smith', 'shepherd', 'presser', 'weaver', 'beekeeper', 'postman', 'apothecary', 'fisher', 'carpenter']

function valid(rows: readonly string[], pal: Record<string, string>, w?: number) {
  const width = w ?? rows[0].length
  for (const r of rows) {
    expect(r).toHaveLength(width)
    for (const ch of r) if (ch !== '.') expect(pal[ch], `"${ch}" in ${r}`).toBeDefined()
  }
}

describe('사람 도트', () => {
  it('키가 작은 아이도 손이 사라지지 않는다', () => {
    for (const growth of [0, 1, 2, 3]) for (const facing of ['down', 'right', 'up'] as const) {
      const rows = spriteRows('child', facing, { frame: 0, blink: false, growth })
      expect(rows.slice(7).join('')).toContain('s')
      expect(rows.slice(7).join('')).toContain('!')
    }
  })
  it('흰 머리는 그늘 경계가 남고 배달부의 앞머리는 눈과 눈 깜빡임을 가리지 않는다', () => {
    for (const facing of FACINGS) {
      const grandpa = spriteRows('grandpa', facing, { frame: 0, blink: false })
      expect(grandpa.slice(0, 3).join('')).toContain('W')
      expect(grandpa.slice(0, 3).join('')).toContain('7')
    }
    for (const facing of ['down', 'right'] as const) {
      const open = spriteRows('postman', facing, { frame: 0, blink: false })
      const shut = spriteRows('postman', facing, { frame: 0, blink: true })
      for (const x of facing === 'down' ? [3, 6] : [6]) {
        expect(open[4][x]).toBe('k')
        expect(shut[4][x]).toBe('s')
      }
    }
  })
  it('앞·뒷머리와 장신구의 조합, 실제 NPC 23명의 선택이 모두 유효한 도트로 그려진다', () => {
    const base = withLookDefaults({ look: 'm', name: '' })
    for (let hairFront = 0; hairFront < HAIR_FRONTS.length; hairFront++)
      for (let hairBack = 0; hairBack < HAIR_BACKS.length; hairBack++)
        for (let acc = 0; acc < ACCS.length; acc++) for (const facing of FACINGS) {
          const avatar = { ...base, hairFront, hairBack, acc }
          const pal = writerPalette('spring', avatar)
          const rows = spriteRows('writer', facing, { frame: 0, blink: false, avatar })
          expect(rows).toHaveLength(SPRITE_H)
          expect(rows.every((row) => row.length === SPRITE_W && [...row].every((ch) => ch === '.' || pal[ch] !== undefined))).toBe(true)
          if (facing === 'down') {
            expect(rows[4][3]).toBe('o')
            expect(rows[4][6]).toBe('o')
          }
        }
    for (const n of NEIGHBORS) for (const facing of FACINGS) {
      const avatar = n.avatar && n.look ? withLookDefaults({ look: n.look, name: n.role, ...n.avatar }) : undefined
      const pal = avatar ? writerPalette('spring', avatar) : PALETTE
      const rows = spriteRows(n.sprite as Who, facing, { frame: 0, blink: false, avatar, growth: 3 })
      expect(rows.every((row) => row.length === SPRITE_W && [...row].every((ch) => ch === '.' || pal[ch] !== undefined))).toBe(true)
    }
  })
  it('모든 옷·하의의 방향과 자세가 기존 선택을 유지하며 유효하게 그려진다', () => {
    const base = withLookDefaults({ look: 'm', name: '바다' })
    for (let top = 0; top < TOPS.length; top++) for (let bottom = 0; bottom < BOTTOMS.length; bottom++) {
      const avatar = { ...base, top, bottom }
      const original = structuredClone(avatar)
      const pal = writerPalette('spring', avatar)
      for (const facing of FACINGS) for (const pose of ['stand', 'wave', 'handUp', 'crouch'] as const)
        for (const frame of [0, 1, 2] as const) {
          const rows = spriteRows('writer', facing, { frame, blink: false, avatar, pose })
          expect(rows.every((row) => row.length === SPRITE_W && [...row].every((ch) => ch === '.' || pal[ch] !== undefined))).toBe(true)
        }
      const front = spriteRows('writer', 'down', { frame: 0, blink: false, avatar })
      // 줄무늬·앞치마·조끼가 소매와 손을 덮지 않는다.
      for (const x of [1, 8]) {
        expect(front[8][x]).toBe('r')
        expect(front[9][x]).toBe('r')
        expect(front[10][x]).toBe('s')
        expect(front[10][x === 1 ? 0 : 9]).toBe('!')
        expect(front[11][x]).toBe('5')
      }
      expect(front[9].slice(1, 9)).not.toContain('.')
      expect(front[10].slice(1, 9)).not.toContain('.')
      expect(spriteRows('writer', 'left', { frame: 0, blink: false, avatar }))
        .toEqual(mirror(spriteRows('writer', 'right', { frame: 0, blink: false, avatar })))
      expect(avatar).toEqual(original)
    }
  })

  it('모든 사람·방향·자세가 10칸 폭이고 팔레트 밖의 색이 없다', () => {
    for (const who of PEOPLE)
      for (const f of FACINGS)
        for (const frame of [0, 1, 2] as const)
          for (const pose of ['stand', 'handUp', 'wave', 'crouch'] as const) {
            const rows = spriteRows(who, f, { frame, blink: frame === 1, pose, season: 'winter', inky: true, growth: 1 })
            valid(rows, PALETTE, SPRITE_W)
          }
  })
  it('앞·뒤 걸음은 몸이 뜨지 않고 한 발씩 번갈아 든다', () => {
    const avatar = withLookDefaults({ look: 'f', name: '바다' })
    for (const who of PEOPLE)
      for (const f of ['down', 'up'] as const)
        for (const extra of who === 'writer' ? [{}, { avatar }, { avatar: { ...avatar, bottom: 3 } }] : [{ growth: 1 }]) {
          const stand = spriteRows(who, f, { frame: 0, blink: false, ...extra })
          const feet = stand.length - 1
          const left = spriteRows(who, f, { frame: 1, blink: false, ...extra })
          const right = spriteRows(who, f, { frame: 2, blink: false, ...extra })
          for (const step of [left, right]) {
            expect(step, `${who}/${f}`).toHaveLength(stand.length)
            expect(step.slice(0, feet), `${who}/${f}`).toEqual(stand.slice(0, feet))
          }
          const last = (rows: readonly string[]) => rows[rows.length - 1]
          // 왼발을 들면 왼쪽 발끝이 비고, 오른발을 들면 오른쪽이 빈다
          expect(last(left).slice(0, 5).replace(/\./g, '')).toBe('')
          expect(last(left).slice(5).replace(/\./g, '')).not.toBe('')
          expect(last(right).slice(5).replace(/\./g, '')).toBe('')
          expect(last(right).slice(0, 5).replace(/\./g, '')).not.toBe('')
        }
  })
  it('옆모습 걸음은 지금처럼 앞뒤로 벌린다', () => {
    const stand = spriteRows('writer', 'right', { frame: 0, blink: false })
    const a = spriteRows('writer', 'right', { frame: 1, blink: false })
    const b = spriteRows('writer', 'right', { frame: 2, blink: false })
    expect(a).toHaveLength(SPRITE_H)
    expect(a[13]).not.toBe(stand[13])
    expect(b).toEqual(stand)
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
  it('겨울엔 이웃도 목에 목도리를 두른다 (다른 계절엔 없다)', () => {
    for (const who of PEOPLE.filter((w) => w !== 'writer'))
      for (const f of FACINGS) {
        const scarf = NEIGHBOR_SCARF[who]!
        expect(scarf, who).toBeDefined()
        expect(spriteRows(who, f, { frame: 0, blink: false, season: 'winter', growth: 1 })[7], `${who}/${f}`).toContain(scarf)
        expect(spriteRows(who, f, { frame: 0, blink: false, season: 'autumn', growth: 1 })[7], `${who}/${f}`).not.toContain(scarf)
      }
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
  it('걷는 쪽으로 머리(눈 e)가 간다 — 오른쪽으로 걸으면 눈이 오른쪽 끝에', () => {
    for (const k of ['cat', 'dog'] as const)
      for (const form of ['adult', 'baby'] as const) {
        const eyeCol = (rows: readonly string[]) => rows.find((r) => r.includes('e'))!.indexOf('e')
        const left = animalRows(k, form, 'left')
        const right = animalRows(k, form, 'right')
        const w = left[0].length
        expect(eyeCol(left), `${k} ${form} 왼쪽`).toBeLessThan(w / 2)
        expect(eyeCol(right), `${k} ${form} 오른쪽`).toBeGreaterThanOrEqual(w / 2)
      }
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
  it('음수 시간에도 정해진 값만 돌려준다', () => {
    for (const t of [-0.001, -1.7, -3]) {
      expect([1, 2]).toContain(walkFrame(t))
      expect([0, 1]).toContain(dozeNod(t))
      expect(['left', 'right']).toContain(lookSide(t))
      expect(typeof isBlinking(t)).toBe('boolean')
    }
  })
  it('걸음·끄덕임·두리번', () => {
    // 걸음은 왼발(1)·오른발(2) 두 박자 — 서 있는 그림(0)은 걷는 동안 나오지 않는다
    expect(walkFrame(0)).toBe(1)
    expect(walkFrame(1 / 6 + 0.01)).toBe(2)
    expect(dozeNod(0)).toBe(0)
    expect(dozeNod(1.5)).toBe(1)
    expect(lookSide(0)).toBe('right')
    expect(lookSide(0.9)).toBe('left')
  })
})
