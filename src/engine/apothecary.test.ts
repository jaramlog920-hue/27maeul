// 주막 자리에 약방 (2026-09-30): 들 약초를 캐서 약방에 판다 — 장날이 아니어도
import { CONTENT } from '../content/catalog'
import { NEIGHBOR_LINES, SCENES, T } from '../content/text'
import { seasonOf } from './clock'
import { APOTHECARY, finishGather, gatherInfo, HERB_PICKS_PER_DAY, HERB_SELL_CAP, herbsSellLeft, newGame, sellHerbs, type GameState } from './game'
import { deserialize, serialize } from './save'
import { SELL_PRICES } from './game'
import { freshStats } from './stats'
import { isWalkable, PLACES, tileAt, WILD_HERBS } from './world'

const spring = (): GameState => {
  const s = newGame(CONTENT)
  expect(seasonOf(s.clock.day)).not.toBe('winter')
  return s
}

describe('약방 이웃', () => {
  it('주막 주인 대신 약방 주인 — 같은 집, 서고 2권에 이사 온다', () => {
    const d = CONTENT.neighbors.find((n) => n.id === APOTHECARY)!
    expect(d.role).toBe('약방 주인')
    expect(d.joinsAtBooks).toBe(2)
    expect(CONTENT.neighbors.some((n) => n.id === 'innkeeper')).toBe(false)
    expect(NEIGHBOR_LINES[APOTHECARY].help.label).toBe('약초 말리기 돕기')
    expect(SCENES['movedIn:apothecary'].lines[0].text).toContain('약방')
  })

  it('옛 저장의 주막 주인 마음·표식은 약방 주인으로 옮겨진다', () => {
    const s = newGame(CONTENT)
    const raw = serialize({ ...s, hearts: { innkeeper: 42 }, flags: { ...s.flags, 'movedIn:innkeeper': 1 } } as GameState).replace(/apothecary/g, 'innkeeper')
    const back = deserialize(raw, CONTENT)!
    expect(back.hearts.apothecary).toBe(42)
    expect(back.flags['movedIn:apothecary']).toBe(1)
  })
})

describe('들 약초: 마을 가장자리 네 군데, 하루 네 줌까지', () => {
  it('약초 자리는 지도의 풀포기, 곁에 서서 캘 수 있다', () => {
    expect(WILD_HERBS).toHaveLength(HERB_PICKS_PER_DAY)
    for (const t of WILD_HERBS) {
      expect(tileAt(t.x, t.y)).toBe('j')
      expect([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isWalkable({ x: t.x + dx, y: t.y + dy })), `${t.x},${t.y}`).toBe(true)
    }
    expect(PLACES.wildHerb.tiles).toEqual(WILD_HERBS)
  })

  it('한 번에 한 줌, 근력이 오르고, 네 번 캐면 그날은 끝', () => {
    let s = spring()
    for (let i = 0; i < HERB_PICKS_PER_DAY; i++) {
      expect(gatherInfo(s, 'wildHerb')).toEqual({ gives: { herb: 1 }, minutes: 15 })
      s = finishGather(s, 'wildHerb')
    }
    expect(s.inv.herb).toBe(HERB_PICKS_PER_DAY)
    expect(s.stats.strength.xp).toBeGreaterThan(0)
    expect(gatherInfo(s, 'wildHerb')).toEqual({ blocked: 'picked' })
    // 다음 날은 다시
    expect(gatherInfo({ ...s, clock: { ...s.clock, day: s.clock.day + 1 } }, 'wildHerb')).not.toEqual({ blocked: 'picked' })
  })

  it('겨울엔 캘 것이 없다', () => {
    const s = newGame(CONTENT)
    const winterDay = [...Array(200).keys()].map((d) => d + 1).find((d) => seasonOf(d) === 'winter')!
    expect(gatherInfo({ ...s, clock: { ...s.clock, day: winterDay } }, 'wildHerb')).toEqual({ blocked: 'notRipe' })
  })
})

describe('약방에 약초 팔기 (장날이 아니어도)', () => {
  it('가진 약초를 한꺼번에 — 한 줌에 약초 값, 매력 3단계부터 +1닢', () => {
    const s = { ...spring(), inv: { herb: 5 }, coins: 0 }
    const r = sellHerbs(s)!
    expect(r.n).toBe(5)
    expect(r.coins).toBe(5 * SELL_PRICES.herb!)
    expect(r.state.inv.herb ?? 0).toBe(0)
    expect(r.state.coins).toBe(r.coins)
    const charming = { ...s, stats: { ...freshStats(), charm: { level: 3, xp: 0, born: 0 } } }
    expect(sellHerbs(charming)!.coins).toBe(5 * (SELL_PRICES.herb! + 1))
  })

  it('하루 12줌까지, 약초가 없으면 팔 것이 없다', () => {
    const s = { ...spring(), inv: { herb: 9 }, coins: 0 }
    const first = sellHerbs(s)!.state
    expect(herbsSellLeft(first)).toBe(HERB_SELL_CAP - 9)
    const second = sellHerbs({ ...first, inv: { herb: 9 } })!
    expect(second.n).toBe(HERB_SELL_CAP - 9)
    expect(sellHerbs({ ...second.state, inv: { herb: 9 } })).toBeNull()
    expect(sellHerbs({ ...spring(), inv: {} })).toBeNull()
  })

  it('문구', () => {
    expect(T.herbs.sell).toContain('{price}')
    expect(T.herbs.sold).toContain('{coins}')
  })
})
