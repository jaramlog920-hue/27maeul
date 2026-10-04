// 성경 이야기를 더 모으는 길 (2026-09-30 사용자): 밤 필사·서고 열람석·옛 두루마리·이웃 선물·어른이 된 아이의 편지
import { CONTENT } from '../content/catalog'
import { dayOf } from './calendar'
import {
  buyScroll,
  canBuyScroll,
  canLibraryRead,
  canNightCopy,
  chooseBook,
  giveGift,
  GIFT_STORY_HEARTS,
  LIBRARY_READ_PRICE,
  libraryRead,
  newGame,
  nightCopy,
  SCROLL_PRICE,
  type GameState,
} from './game'
import type { NeighborDef } from './types'

const at = (s: GameState, day: number, minute: number): GameState => ({ ...s, clock: { ...s.clock, day, minute } })
const base = () => ({ ...chooseBook(newGame(CONTENT), 'lk', CONTENT), coins: 100 })

describe('성경 이야기를 더 모으기', () => {
  it('밤 필사: 밤에만, 기름 한 병으로 다음 조각 하나 — 기름이 있는 만큼 여러 번', () => {
    const s = { ...at(base(), 3, 21 * 60), inv: { oil: 2 } }
    expect(canNightCopy(at(s, 3, 10 * 60), CONTENT)).toBe('notNight')
    expect(canNightCopy({ ...s, inv: {} }, CONTENT)).toBe('noOil')
    const a = nightCopy(s, CONTENT)!
    expect(a.state.collected).toContain(a.pieceId)
    expect(a.state.inv.oil ?? 0).toBe(1)
    const b = nightCopy(a.state, CONTENT)!
    expect(b.pieceId).not.toBe(a.pieceId)
    expect(canNightCopy(b.state, CONTENT)).toBe('noOil')
  })

  it('서고 열람석: 닢 셋, 하루 두 번까지', () => {
    let s: GameState = at(base(), 3, 10 * 60)
    for (let i = 0; i < 2; i++) {
      const r = libraryRead(s, CONTENT)!
      expect(r.state.coins).toBe(s.coins - LIBRARY_READ_PRICE)
      s = r.state
    }
    expect(canLibraryRead(s, CONTENT)).toBe('done')
    expect(canLibraryRead(at(s, 4, 10 * 60), CONTENT)).toBeNull()
  })

  it('옛 두루마리: 장날에만, 두 개까지', () => {
    const market = at(base(), 7, 10 * 60)
    expect(canBuyScroll(at(base(), 6, 600), CONTENT)).toBe('notMarket')
    const a = buyScroll(market, CONTENT)!
    expect(a.state.coins).toBe(market.coins - SCROLL_PRICE)
    const b = buyScroll(a.state, CONTENT)!
    expect(canBuyScroll(b.state, CONTENT)).toBe('done')
  })

  it('선물은 생활 루프 — 친구 이상인 이웃에게 선물해도 말씀 조각을 주지 않는다 (계획 14 작업 5)', () => {
    const def = CONTENT.neighbors.find((n) => n.id === 'baker') as NeighborDef
    const s = { ...base(), inv: { grapes: 2 } }
    expect(giveGift({ ...s, hearts: { baker: 0 } }, def, 'grapes', CONTENT)!.pieceId).toBeUndefined()
    const r = giveGift({ ...s, hearts: { baker: GIFT_STORY_HEARTS } }, def, 'grapes', CONTENT)!
    expect(r.pieceId).toBeUndefined()
    expect(r.state.collected).toEqual(s.collected)
  })

  it('편지 책과 요한계시록도 밤 필사·열람석으로 다음 장 하나 (편지 나르는 이웃이 오늘 들고 온 장은 빼고)', () => {
    const open = { ...newGame(CONTENT), flags: { ...newGame(CONTENT).flags, 'room:rev': 1, 'room:romPhm': 1 } }
    const rev = { ...at(chooseBook(open, 'rev', CONTENT), 3, 21 * 60), inv: { oil: 1 }, coins: 20 }
    const r = nightCopy(rev, CONTENT)!
    expect(r.pieceId.startsWith('rev-001')).toBe(true)
    expect(r.state.collected).toContain(r.pieceId)
    const rom = at(chooseBook(open, 'rom', CONTENT), 3, 10 * 60)
    const first = CONTENT.pieces.filter((p) => p.book === 'rom').sort((a, b) => a.chapter - b.chapter)[0].id
    const lib = libraryRead({ ...rom, coins: 20, post: [first] }, CONTENT)!
    expect(lib.pieceId).not.toBe(first)
  })

  it('계절 날짜 도우미', () => {
    expect(dayOf('spring', 1)).toBe(1)
    expect(dayOf('winter', 1)).toBe(121)
  })
})
