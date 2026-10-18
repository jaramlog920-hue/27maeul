// 이정표 선물은 이웃마다 한 번 — 헤어졌다 다시 사귀어 마음이 다시 넘어도 또 주지 않는다 (2026-10-18 감사 M-2)
import { legacyGame as newGame } from './growth-test-support'
import { CONTENT } from '../content/catalog'
import { breakUp, heartUp, type GameState } from './game'
import { personOf } from './people'
import { NO_ROMANCE } from './romance'

function datingMerchant(points: number, day: number): GameState {
  const g = newGame(CONTENT)
  const seen = (personOf('merchant')?.events ?? []).map((e) => e.id)
  return { ...g, life: { ...g.life, seen }, clock: { ...g.clock, day }, hearts: { ...g.hearts, merchant: points }, romance: { ...NO_ROMANCE, partner: 'merchant', stage: 'dating', since: day } }
}

describe('이정표 선물', () => {
  it('헤어진 뒤 다시 9하트를 넘어도 깔개는 한 번만', () => {
    let s = heartUp(datingMerchant(89, 30), 'merchant', 1, Infinity, 'story')
    const rug = s.inv.rug ?? 0
    expect(rug).toBeGreaterThan(0)
    expect(s.flags['milestone:merchant:9']).toBe(1)
    s = breakUp(s, 'merchant')
    s = { ...s, clock: { ...s.clock, day: 60 }, romance: { ...NO_ROMANCE, partner: 'merchant', stage: 'dating', since: 60 } }
    for (let i = 0; i < 41; i++) s = heartUp(s, 'merchant', 1, Infinity, 'story')
    expect(s.hearts.merchant).toBeGreaterThanOrEqual(90)
    expect(s.inv.rug ?? 0).toBe(rug)
    expect(s.scenes.filter((x) => x === 'gift:merchant:9')).toHaveLength(1)
  })

  it('표식이 없는 옛 저장이라도 앨범에 그 선물 장면이 있으면 다시 주지 않는다', () => {
    const base = datingMerchant(89, 30)
    const s = heartUp({ ...base, album: [...base.album, { id: 'gift:merchant:9', day: 20 }] }, 'merchant', 1, Infinity, 'story')
    expect(s.inv.rug ?? 0).toBe(base.inv.rug ?? 0)
  })
})
