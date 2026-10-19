import { describe, expect, it } from 'vitest'
import { HAIR_BACKS, HAIR_FRONTS, avatarKey, randomAvatar, withLookDefaults } from '../engine/avatar'
import { mirror, spriteRows, writerPalette, type SpriteOpts } from './sprites'

const FRONTS = Array.from({ length: 10 }, (_, i) => i + 12)
const BACKS = Array.from({ length: 10 }, (_, i) => i + 11)
const FACINGS = ['down', 'up', 'right', 'left'] as const
const POSES = ['stand', 'wave', 'handUp', 'crouch'] as const
const STAGES = [{}, { short: 0 }, { elder: true }] as const

describe('추가한 앞머리·뒷머리', () => {
  it('기존 번호를 유지하며 각각 열 가지를 더하고 무작위·캐시에도 마지막 선택이 전달된다', () => {
    expect(HAIR_FRONTS).toHaveLength(22)
    expect(HAIR_BACKS).toHaveLength(21)
    expect(HAIR_FRONTS.slice(0, 12)).toEqual(['넘긴 머리', '가벼운 앞머리', '옆 가르마', '짧게 깎음', '부스스', '물결 앞머리', '삐죽 머리', '가운데 가르마', '둥근 앞머리', '비껴 내린 앞머리', '짧은 곱슬 앞머리', '넓게 넘긴 머리'])
    expect(HAIR_BACKS.slice(0, 11)).toEqual(['짧은 머리', '긴 머리', '단발', '올린 머리', '낮게 묶은 머리', '양갈래', '낮게 땋은 머리', '어깨 물결 머리', '높게 묶은 머리', '쌍둥이 쪽머리', '양쪽 땋은 머리'])
    expect(new Set(HAIR_FRONTS).size).toBe(HAIR_FRONTS.length)
    expect(new Set(HAIR_BACKS).size).toBe(HAIR_BACKS.length)
    for (const look of ['f', 'm'] as const) {
      const a = randomAvatar(look, '새 머리', () => 0.999999)
      expect(a.hairFront).toBe(21)
      expect(a.hairBack).toBe(20)
      expect(avatarKey(a)).not.toBe(avatarKey({ ...a, hairFront: 20 }))
      expect(avatarKey(a)).not.toBe(avatarKey({ ...a, hairBack: 19 }))
      expect(withLookDefaults(JSON.parse(JSON.stringify(a)))).toEqual(a)
    }
  })

  it('새 앞·뒷머리의 100가지 조합을 네 방향에서 그린다', () => {
    for (const hairFront of FRONTS) for (const hairBack of BACKS) {
      const avatar = withLookDefaults({ look: 'f', name: '새 머리', hairFront, hairBack })
      const original = structuredClone(avatar)
      const pal = writerPalette('spring', avatar)
      const opts = { frame: 0 as const, blink: false, avatar }
      for (const facing of FACINGS) {
        const rows = spriteRows('writer', facing, opts)
        expect(rows.length).toBe(14)
        expect(rows.every(row => row.length === 10 && [...row].every(c => c === '.' || pal[c] !== undefined)), `${hairFront}/${hairBack}/${facing}`).toBe(true)
      }
      expect(spriteRows('writer', 'left', opts)).toEqual(mirror(spriteRows('writer', 'right', opts)))
      expect(avatar).toEqual(original)
    }
  })

  it('양쪽 모습과 아이·노년의 서기·걷기·손들기·앉기·눈깜빡임에서도 얼굴과 손을 보존한다', () => {
    for (let i = 0; i < 10; i++) for (const look of ['f', 'm'] as const) for (const stage of STAGES) {
      const avatar = withLookDefaults({ look, name: '새 머리', hairFront: FRONTS[i], hairBack: BACKS[i], bottom: 2, acc: 0 })
      const baseline = { ...avatar, hairFront: 0, hairBack: 0 }
      const pal = writerPalette('winter', avatar)
      for (const pose of POSES) for (const blink of [false, true]) for (const frame of [0, 1, 2] as const) {
        const opts: SpriteOpts = { ...stage, pose, blink, frame, avatar, season: 'winter' }
        for (const facing of FACINGS) {
          const rows = spriteRows('writer', facing, opts)
          const base = spriteRows('writer', facing, { ...opts, avatar: baseline })
          const context = `${i}/${look}/${JSON.stringify(stage)}/${pose}/${blink}/${frame}/${facing}`
          expect(rows.length, context).toBe(base.length)
          expect(rows.every(row => row.length === 10 && [...row].every(c => c === '.' || pal[c] !== undefined)), context).toBe(true)
          // 머리카락은 이마·귀 옆에서 모양이 바뀌지만 눈·볼·입 가운데는 유지한다.
          if (facing !== 'up') {
            const offset = 'elder' in stage ? 1 : 0
            const side = facing === 'left' || facing === 'right'
            const xs = side ? facing === 'left' ? [1, 2, 3, 4] : [5, 6, 7, 8] : [3, 4, 5, 6]
            const lastFaceRow = pose === 'crouch' ? 6 : 6 + offset
            for (let y = 4 + offset; y <= lastFaceRow; y++) {
              expect(xs.map(x => rows[y][x]).join(''), `${context}/face-${y}`).toBe(xs.map(x => base[y][x]).join(''))
            }
          }
          // 줄어든 아이 몸체와 앉은 자세의 손도 해당 몸체의 원래 자리를 따른다.
          expect(base.flatMap((row, y) => [...row].flatMap((c, x) => y >= 8 && 's5!K'.includes(c) ? [rows[y][x] === c] : [])).every(Boolean), `${context}/hands`).toBe(true)
        }
        expect(spriteRows('writer', 'left', opts), `${i}/${look}/${pose}/${frame}`).toEqual(mirror(spriteRows('writer', 'right', opts)))
      }
    }
  })

  it('각 새 스타일이 기존 스타일과도 다른 실제 도트를 갖고 걷는 동안 머리 모양이 유지된다', () => {
    const base = withLookDefaults({ look: 'm', name: '새 머리', hairBack: 0, hairFront: 0, acc: 0 })
    for (const [key, count] of [['hairFront', HAIR_FRONTS.length], ['hairBack', HAIR_BACKS.length]] as const) {
      const signatures = Array.from({ length: count }, (_, i) => {
        const avatar = { ...base, [key]: i }
        return ['down', 'up', 'right'].map(facing => spriteRows('writer', facing as 'down' | 'up' | 'right', { frame: 0, blink: false, avatar }).join('|')).join('/')
      })
      expect(new Set(signatures).size, key).toBe(count)
    }
    for (let i = 0; i < 10; i++) for (const stage of STAGES) for (const facing of FACINGS) {
      const avatar = { ...base, hairFront: FRONTS[i], hairBack: BACKS[i] }
      const stand = spriteRows('writer', facing, { ...stage, frame: 0, blink: false, avatar })
      for (const frame of [1, 2] as const) {
        const walk = spriteRows('writer', facing, { ...stage, frame, blink: false, avatar })
        expect(walk.slice(0, -1)).toEqual(stand.slice(0, -1))
      }
    }
  })
})
