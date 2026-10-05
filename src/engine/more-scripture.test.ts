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
  it('사본 옮겨 적기는 낮과 밤 모두 기름 없이 가능하다', () => {
    const s = { ...at(base(), 3, 21 * 60), inv: { oil: 2 } }
    expect(canNightCopy(at(s, 3, 10 * 60), CONTENT)).toBeNull()
    expect(canNightCopy({ ...s, inv: {} }, CONTENT)).toBeNull()
    const a = nightCopy(s, CONTENT)!
    expect(a.state.collected).toContain(a.pieceId)
    expect(a.state.inv.oil ?? 0).toBe(2)
    const b = nightCopy(a.state, CONTENT)!
    expect(b.pieceId).not.toBe(a.pieceId)
    expect(b.state.inv.oil).toBe(2)
    expect(nightCopy({ ...b.state, inv: {} }, CONTENT)).not.toBeNull()
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

  it('어느 책을 골랐든(편지 책·요한계시록 포함) 밤 필사·열람석은 27권 중 아직 없는 조각 하나 — 오늘 편지·이웃 조각은 빼고', () => {
    const rev = { ...at(chooseBook(newGame(CONTENT), 'rev', CONTENT), 3, 21 * 60), inv: { oil: 1 }, coins: 20 }
    const r = nightCopy(rev, CONTENT)!
    expect(CONTENT.pieces.some((p) => p.id === r.pieceId)).toBe(true)
    expect(r.state.collected).toEqual([r.pieceId])
    // 같은 날 같은 길은 같은 조각 (씨앗), 두 번째는 다른 조각
    expect(nightCopy(rev, CONTENT)!.pieceId).toBe(r.pieceId)
    expect(nightCopy(r.state, CONTENT)!.pieceId).not.toBe(r.pieceId)
    const rom = at(chooseBook(newGame(CONTENT), 'rom', CONTENT), 3, 10 * 60)
    const first = libraryRead({ ...rom, coins: 20 }, CONTENT)!.pieceId
    const lib = libraryRead({ ...rom, coins: 20, post: [first], offers: { baker: first } }, CONTENT)!
    expect(lib.pieceId).not.toBe(first)
  })

  it('조각을 다 모았으면 아무것도 받지 않는다 (오류 없이 막힘)', () => {
    const full = { ...at(chooseBook(newGame(CONTENT), 'lk', CONTENT), 3, 10 * 60), coins: 100, collected: CONTENT.pieces.map((p) => p.id) }
    expect(canNightCopy(full, CONTENT)).toBe('noPiece')
    expect(nightCopy(full, CONTENT)).toBeNull()
    expect(canLibraryRead(full, CONTENT)).toBe('noPiece')
    expect(libraryRead(full, CONTENT)).toBeNull()
    expect(canBuyScroll({ ...full, clock: { ...full.clock, day: 7 } }, CONTENT)).toBe('noPiece')
  })
  it('계절 날짜 도우미', () => {
    expect(dayOf('spring', 1)).toBe(1)
    expect(dayOf('winter', 1)).toBe(121)
  })
})
