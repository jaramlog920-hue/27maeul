import {
  DEFAULT_VOLUME,
  MUSIC_CHOICES,
  NIGHT_SOFT,
  SFX_NAMES,
  TARGET_POWER,
  currentVolume,
  loopPower,
  musicLoop,
  setVolume,
  sfx,
  trackLevel,
  trackPower,
  volumeGain,
  type MusicChoice,
} from './sound'
import { T } from '../content/text'
import type { Season } from '../engine/types'

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
const db = (a: number, b: number) => 10 * Math.log10(a / b)

describe('네 곡', () => {
  it('저장 값은 예전 그대로, 이름은 들판·호숫가·등불·장날', () => {
    expect(MUSIC_CHOICES).toEqual(['default', 'D', 'E', 'F'])
    expect(MUSIC_CHOICES.map((c) => (T.controls.tracks as Record<MusicChoice, string>)[c])).toEqual(['들판', '호숫가', '등불', '장날'])
  })
  it('악보는 언제 만들어도 같고, 모든 음이 고리 안에 있다', () => {
    for (const c of MUSIC_CHOICES)
      for (const s of SEASONS)
        for (const night of [false, true]) {
          const loop = musicLoop(c, s, night)
          expect(JSON.stringify(loop)).toBe(JSON.stringify(musicLoop(c, s, night)))
          expect(loop.steps % 8).toBe(0)
          for (const ev of loop.events) {
            expect(ev.step).toBeGreaterThanOrEqual(0)
            expect(ev.step).toBeLessThan(loop.steps)
            expect(ev.vol).toBeGreaterThan(0)
            expect(ev.vol).toBeLessThan(0.15)
          }
        }
  })
  it('고리 길이: 들판·호숫가 32박, 등불·장날 64박. 낮 한 바퀴는 6~40초', () => {
    expect(musicLoop('default', 'spring', false).steps).toBe(32)
    expect(musicLoop('D', 'spring', false).steps).toBe(32)
    expect(musicLoop('E', 'spring', false).steps).toBe(64)
    expect(musicLoop('F', 'spring', false).steps).toBe(64)
    for (const c of MUSIC_CHOICES) {
      const l = musicLoop(c, 'summer', false)
      expect(l.steps * l.beat).toBeGreaterThan(6)
      expect(l.steps * l.beat).toBeLessThan(40)
    }
  })
  it('밤에는 더 느리고 여리다', () => {
    for (const c of MUSIC_CHOICES)
      for (const s of SEASONS) {
        const day = musicLoop(c, s, false)
        const night = musicLoop(c, s, true)
        expect(night.beat).toBeGreaterThan(day.beat)
        expect(loopPower(night)).toBeLessThan(loopPower(day))
        expect(night.events[0].vol).toBeCloseTo(day.events[0].vol * NIGHT_SOFT)
      }
  })
  it('같은 곡 안에서 계절마다 세기가 1.5dB 안쪽으로 비슷하다', () => {
    for (const c of MUSIC_CHOICES) {
      const p = SEASONS.map((s) => loopPower(musicLoop(c, s, false)))
      expect(db(Math.max(...p), Math.min(...p))).toBeLessThan(1.5)
    }
  })
})

describe('배경음 크기 맞추기', () => {
  it('맞춘 뒤 네 곡의 평균 세기가 같다 (±0.1dB)', () => {
    for (const c of MUSIC_CHOICES) expect(Math.abs(db(trackPower(c) * trackLevel(c) ** 2, TARGET_POWER))).toBeLessThan(0.1)
  })
  it('곡마다 곱하는 값이 크게 다르지 않다 — 악보 자체가 이미 2dB 안쪽으로 고르다', () => {
    const p = MUSIC_CHOICES.map(trackPower)
    expect(db(Math.max(...p), Math.min(...p))).toBeLessThan(2)
    for (const c of MUSIC_CHOICES) {
      expect(trackLevel(c)).toBeGreaterThan(0.5)
      expect(trackLevel(c)).toBeLessThan(2.5)
    }
  })
})

describe('효과음', () => {
  it('예전 이름과 새 이름 모두 AudioContext 없이 불러도 아무 일 없다', () => {
    for (const n of ['step', 'talk', 'scroll', 'tap', 'hit', 'miss', 'done', 'sleep', 'eat', 'gift', 'meow', 'bark', 'place', 'pen'] as const) expect(SFX_NAMES).toContain(n)
    for (const n of ['page', 'bind', 'shelve', 'door', 'coin', 'bell', 'splash', 'letter', 'harvest'] as const) expect(SFX_NAMES).toContain(n)
    for (const n of SFX_NAMES) expect(() => sfx(n)).not.toThrow()
  })
})

describe('소리 크기 조절', () => {
  it('기본값에서 원래 크기, 0이면 무음, 끝까지 올리면 두 배쯤', () => {
    expect(volumeGain('music', DEFAULT_VOLUME)).toBeCloseTo(0.35)
    expect(volumeGain('sfx', DEFAULT_VOLUME)).toBeCloseTo(1)
    expect(volumeGain('sfx', 0)).toBe(0)
    expect(volumeGain('sfx', 1)).toBeCloseTo(2.04, 1)
  })
  it('배경음과 효과음은 따로 저장된다', () => {
    setVolume('music', 0.2)
    setVolume('sfx', 1.5)
    expect(currentVolume('music')).toBe(0.2)
    expect(currentVolume('sfx')).toBe(1)
    expect(localStorage.getItem('twenty-seven/volume-music')).toBe('0.2')
  })
})
