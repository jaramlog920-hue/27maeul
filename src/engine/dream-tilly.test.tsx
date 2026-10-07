// 주민의 꿈 둘째 (2026-10-08): 틸리의 그림방 — 페넬로피 꿈과 따로 진행, 예전 저장 열쇠는 그대로
import { CONTENT } from '../content/catalog'
import { newGame, type GameState } from './game'
import type { Build } from './newland-build'
import { canHearDream, DREAM_TROUBLE_AFTER, dreamHeard, dreamKey, facilityAt, hearDream, pickDream, visitDream } from './newland-life'
import { OLD_BUILDINGS } from '../render/old-village-art'
import { standSpotOf } from './newland-build'

const studio: Build = { id: 'b1', kind: 'gallery', x: 10, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 0, items: {} }, refunded: false }
function land(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  return { ...base, clock: { day: 30, minute: 600 }, flags: { ...base.flags, newlandGift: 1, newlandRevealed: 1 }, newland: { builds: [studio], tiles: {}, nextId: 2, settledDay: 30 }, ...extra }
}

describe('틸리의 그림방', () => {
  it('마음이 가까우면 꿈 이야기를 듣고, 페넬로피 꿈과 섞이지 않는다', () => {
    const s = land({ hearts: { tilly: 40 } })
    expect(canHearDream(s, 'tilly')).toBe(true)
    expect(canHearDream(s, 'baker')).toBe(false)
    const t = hearDream(s, 'tilly')
    expect(dreamHeard(t, 'tilly')).toBe(true)
    expect(dreamHeard(t)).toBe(false)
  })

  it('문 연 날 → 사흘 뒤 어려움 → 고른 뒤 그 말, 열쇠는 :tilly', () => {
    const open = visitDream(land(), {}, 'tilly')!
    expect(open.stage).toBe('open')
    expect(open.state.flags[dreamKey('dreamOpen', 'tilly')]).toBe(30)
    expect(open.state.flags.dreamOpen).toBeUndefined()
    const later = visitDream({ ...open.state, clock: { day: 30 + DREAM_TROUBLE_AFTER, minute: 600 } }, {}, 'tilly')!
    expect(later.stage).toBe('trouble')
    const picked = pickDream(later.state, 2, 'tilly')
    expect(picked.flags['dreamPick:tilly']).toBe(2)
    expect(visitDream(picked, {}, 'tilly')!.stage).toBe('after')
    // 페넬로피 꿈터가 없으면 페넬로피 쪽은 열리지 않는다
    expect(visitDream(land(), {})).toBeNull()
  })

  it('그림방 문 앞에 서면 창이 열리고, 건물 그림이 있다', () => {
    expect(facilityAt(land(), standSpotOf(studio)!)).toBe('gallery')
    expect(OLD_BUILDINGS.gallery.down.rows).toHaveLength(64)
  })
})
