import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGenState } from '../engine/gen'
import { withLookDefaults } from '../engine/avatar'
import { PALETTE, spriteRows, writerPalette, mirror, type Who } from './sprites'
import { residentIsElder } from './elder-details'
import { furnitureUseFrame } from './furniture-use-motion'
import { generationRows, familyFrame } from './generation-art'

describe('기존 주민의 노년 도트', () => {
  it('23명 모두 외형·발 위치를 보존하고 4방향의 노년 도트가 유효하다', () => {
    for (const def of CONTENT.neighbors) {
      const avatar = def.avatar && def.look ? withLookDefaults({ look: def.look, name: def.role, ...def.avatar }) : undefined
      const who = avatar ? 'writer' : def.sprite as Who, pal = avatar ? writerPalette('winter', avatar) : PALETTE
      const opts = { frame: 0 as const, blink: false, avatar, season: 'winter' as const, growth: 3 }
      const before = structuredClone(opts)
      for (const facing of ['down', 'up', 'left', 'right'] as const) {
        const adult = spriteRows(who, facing, opts)
        for (const frame of [0, 1, 2] as const) {
          const old = spriteRows(who, facing, { ...opts, frame, elder: true })
          expect(old.length).toBe(adult.length)
          expect(old.every(r => r.length === 10 && [...r].every(c => c === '.' || pal[c]))).toBe(true)
          expect(old.at(-1)).toEqual(spriteRows(who, facing, { ...opts, frame }).at(-1))
          // 작업복·앞치마·가방·신발은 원래 주민 것으로 유지한다.
          expect(old.slice(8).map(r => r.slice(2, 8))).toEqual(spriteRows(who, facing, { ...opts, frame }).slice(8).map(r => r.slice(2, 8)))
        }
        expect(spriteRows(who, facing, { ...opts, elder: true })).not.toEqual(adult)
      }
      expect(spriteRows(who, 'left', { ...opts, elder: true })).toEqual(mirror(spriteRows(who, 'right', { ...opts, elder: true })))
      expect(opts).toEqual(before)
    }
  })
  it('모자색은 유지하고 피부색·액세서리는 바꾸지 않는다', () => {
    const opts = { frame: 0 as const, blink: false }
    for (const who of ['merchant', 'beekeeper', 'fisher'] as const) {
      const adult = spriteRows(who, 'down', opts), old = spriteRows(who, 'down', { ...opts, elder: true })
      expect(old[2]).toBe(adult[1]) // 모자 챙이 자세에 따라 한 줄 내려갈 뿐이다.
    }
    const avatar = withLookDefaults({ look: 'f', name: '바다', skin: 5, acc: 13, accColor: [120, 50, 65] })
    const original = structuredClone(avatar)
    spriteRows('writer', 'down', { ...opts, avatar, elder: true })
    expect(avatar).toEqual(original)
    expect(writerPalette('spring', avatar).s).toBe('#98684a')
  })
  it('노년 성장 도트와 앉기·독서·가족 모션에도 회색 머리가 연결된다', () => {
    const avatar = withLookDefaults({ look: 'm', name: '바다' }), opts = { frame: 0 as const, blink: false, avatar }
    expect(generationRows('elder', 'down', 0, opts).join('')).toMatch(/[~^%]/)
    for (const action of ['sit', 'read'] as const) for (let f = 0; f < 4; f++) {
      expect(furnitureUseFrame('writer', 'down', action, f, { ...opts, elder: true }).actor.join('')).toMatch(/[~^%]/)
    }
    expect(familyFrame('writer', 'down', 'readTogether', 0, 'elder', opts).actor.join('')).toMatch(/[~^%]/)
  })
  it('노년·은퇴 기록만 적용하고 나이와 은퇴 시기를 새로 계산하지 않는다', () => {
    expect(residentIsElder(undefined, 'carpenter')).toBe(false)
    const g = newGenState(CONTENT, 1, 1)
    expect(residentIsElder(g, 'carpenter')).toBe(false)
    expect(residentIsElder(g, 'grandpa')).toBe(true)
    g.retired = { carpenter: { heir: 'g-0001', day: 50 } }
    expect(residentIsElder(g, 'carpenter')).toBe(true)
    expect(residentIsElder(g, 'g-0001')).toBe(false)
  })
})
