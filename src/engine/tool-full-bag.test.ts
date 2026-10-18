// 가방이 가득 차면 새 도구는 살 수 없다 — 돈만 나가고 도구가 사라지지 않게 (2026-10-18 감사, Codex E-08)
import { CONTENT } from '../content/catalog'
import { ITEM_TEXT } from '../content/text'
import { newGame, trade, TRADES } from './game'
import { BAG_SLOTS, slotsUsed, TOOLS } from './items'
import type { ItemId } from './types'

it('빈칸 없는 가방으로 집 열쇠를 사려 하면 거래가 막히고 닢이 그대로', () => {
  const fresh = newGame(CONTENT)
  const inv = Object.fromEntries(Object.keys(ITEM_TEXT).filter((id) => !TOOLS.includes(id as ItemId)).slice(0, BAG_SLOTS).map((id) => [id, 1]))
  expect(slotsUsed(inv)).toBe(BAG_SLOTS)
  const before = { ...fresh, coins: 10000, inv, clock: { day: 7, minute: 600 } }
  expect(trade(before, TRADES.find((t) => t.id === 'homeKey')!)).toBeNull()
  // 한 칸을 비우면 산다
  const one = Object.keys(inv)[0]
  const room = { ...before, inv: Object.fromEntries(Object.entries(inv).filter(([id]) => id !== one)) }
  const after = trade(room, TRADES.find((t) => t.id === 'homeKey')!)!
  expect(after.inv.homeKey).toBe(1)
})
