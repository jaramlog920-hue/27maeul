import { DEFAULT_VOLUME, setVolume, currentVolume, trackLevel, trackPower, volumeGain, type MusicChoice } from './sound'

describe('배경음 크기 맞추기', () => {
  const all: MusicChoice[] = ['default', 'D', 'E', 'F']
  it('네 곡의 평균 세기가 같아진다 (A 기준 ±0.1dB)', () => {
    const a = trackPower('default')
    for (const c of all) {
      const db = 10 * Math.log10((trackPower(c) * trackLevel(c) ** 2) / a)
      expect(Math.abs(db)).toBeLessThan(0.1)
    }
  })
  it('네모파 곡(B·C·D)은 낮추고 A는 그대로', () => {
    expect(trackLevel('default')).toBe(1)
    for (const c of ['D', 'E', 'F'] as const) expect(trackLevel(c)).toBeLessThan(0.7)
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
