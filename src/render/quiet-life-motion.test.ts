import { describe, expect, it } from 'vitest'
import { QUIET_ACTIONS, quietLifeRows, sheepLifeRows } from './quiet-life-motion'
import { PALETTE, SMALL_PALETTE, mirror, spriteRows, writerPalette } from './sprites'
import { TOPS, withLookDefaults } from '../engine/avatar'

describe('작은 생활 모션', () => {
  it('모든 옷과 작은 체형에서도 발 위치·폭·팔레트를 유지한다', () => {
    for (let top = 0; top < TOPS.length; top++) for (const short of [undefined, 0, 1, 3]) {
      const avatar = withLookDefaults({ look: 'f', name: '미리보기', top })
      const opts = { frame: 0 as const, blink: false, avatar, short, inky: true }
      const original = structuredClone(opts)
      const pal = writerPalette('spring', avatar)
      const standing = spriteRows('writer', 'down', opts)
      for (const action of QUIET_ACTIONS) {
        const frames = Array.from({ length: 4 }, (_, f) => quietLifeRows('writer', action, f, opts))
        for (const rows of frames) {
          expect(rows.length).toBe(standing.length)
          expect(rows.at(-1)).toBe(standing.at(-1))
          expect(rows.every(r => r.length === 10 && [...r].every(c => c === '.' || pal[c]))).toBe(true)
        }
        expect(new Set(frames.map(r => r.join('\n'))).size).toBeGreaterThan(1)
      }
      expect(opts).toEqual(original)
    }
  })
  it('겨울 이웃에도 사용 가능하고 프레임이 순환한다', () => {
    for (const action of QUIET_ACTIONS) {
      const opts = { frame: 0 as const, blink: false, season: 'winter' as const }
      expect(quietLifeRows('baker', action, -1, opts)).toEqual(quietLifeRows('baker', action, 3, opts))
      expect(quietLifeRows('baker', action, 4, opts)).toEqual(quietLifeRows('baker', action, 0, opts))
      expect(quietLifeRows('baker', action, 2, opts).every(r => [...r].every(c => c === '.' || PALETTE[c]))).toBe(true)
    }
  })
  it('양의 걸음과 풀 먹기가 다르고 좌우가 일치한다', () => {
    for (const action of ['walk', 'graze'] as const) {
      const frames = Array.from({ length: 4 }, (_, f) => sheepLifeRows('right', action, f))
      expect(new Set(frames.map(r => r.join('\n'))).size).toBeGreaterThan(1)
      frames.forEach((rows, f) => {
        expect(rows.every(r => r.length === 8 && [...r].every(c => c === '.' || SMALL_PALETTE[c]))).toBe(true)
        expect(sheepLifeRows('left', action, f)).toEqual(mirror(rows))
      })
    }
    expect(sheepLifeRows('right', 'walk', 1)).not.toEqual(sheepLifeRows('right', 'graze', 1))
  })
})
