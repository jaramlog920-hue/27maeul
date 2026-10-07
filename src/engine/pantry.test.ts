// 서늘한 찬장 (2026-10-08): 목수에게 부탁 → 음식만 넣고 꺼내기(집 안) → 저녁상에 하나 꺼내 함께
import { CONTENT } from '../content/catalog'
import { CARPENTER_WORKS } from './easier'
import { newGame, pantryOf, PANTRY_STACK, putInPantry, servePantrySupper, syncHome, takeFromPantry, type GameState } from './game'
import { HOME_ENTRY } from './world'

function home(extra: Partial<GameState> = {}): GameState {
  const base = newGame(CONTENT)
  const g: GameState = { ...base, flags: { ...base.flags, 'unlock:homeCoolCupboard': 1 }, inv: { ...base.inv, bread: 3, reed: 2 }, player: { ...base.player, ...HOME_ENTRY, path: [] }, ...extra }
  syncHome(g)
  return g
}

describe('서늘한 찬장', () => {
  it('목수 부탁 목록에 있고, 가진 뒤에만 쓴다', () => {
    expect(CARPENTER_WORKS.find((w) => w.id === 'homeCoolCupboard')?.item).toBe('homeCoolCupboard')
    const none = { ...home(), flags: newGame(CONTENT).flags }
    expect(pantryOf(none)).toBeNull()
    expect(putInPantry(none, 'bread')).toBeNull()
  })

  it('음식만 넣고 꺼낸다, 집 밖에서는 안 된다', () => {
    const s = home()
    const put = putInPantry(s, 'bread')!
    expect(put.inv.bread).toBe(2)
    expect(put.pantry?.bread).toBe(1)
    expect(putInPantry(s, 'reed')).toBeNull()
    const back = takeFromPantry(put, 'bread')!
    expect(back.inv.bread).toBe(3)
    expect(back.pantry?.bread).toBeUndefined()
    const outside = { ...put, player: { ...put.player, x: 30, y: 30 } }
    expect(takeFromPantry(outside, 'bread')).toBeNull()
    expect(putInPantry({ ...s, pantry: { bread: PANTRY_STACK } }, 'bread')).toBeNull()
  })

  it('저녁상: 찬장 음식 하나를 꺼내 함께 (만든 음식 먼저), 비었으면 그대로', () => {
    const partner = CONTENT.neighbors.find((d) => d.avatar)!.id
    const s = home({ pantry: { bread: 1, beanDish: 1 }, romance: { partner, stage: 'married', since: 1, weddingDay: null, marriedDay: 2 } })
    const r = servePantrySupper(s)
    expect(r.dish).toBe('beanDish')
    expect(r.state.pantry?.beanDish).toBeUndefined()
    expect(r.state.hearts[partner]).toBe((s.hearts[partner] ?? 0) + 1)
    expect(servePantrySupper({ ...s, pantry: {} }).dish).toBeNull()
  })
})
