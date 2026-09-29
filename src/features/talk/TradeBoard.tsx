import { useState } from 'react'
import { fill, itemList, itemName, T } from '../../content/text'
import { canSell, SELL_PRICES, tradesFor, wouldOverflow } from '../../engine/game'
import { jobOf, SELL_FROM } from '../../engine/job'
import { has, take } from '../../engine/items'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'

export function TradeBoard() {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const game = useGame((s) => s.game)
  const inv = game.inv
  const flags = game.flags
  const coins = game.coins
  const { doTrade, sellItem, closeModal } = useGame.getState()
  const names = T.trades as Record<string, string>
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.tradeTitle}>
      <h2>{T.ui.tradeTitle}</h2>
      <div className="actions">
        <button disabled={tab === 'buy'} onClick={() => setTab('buy')}>
          {T.ui.tradeBuy}
        </button>
        <button disabled={tab === 'sell'} onClick={() => setTab('sell')}>
          {T.ui.tradeSell}
        </button>
      </div>
      {tab === 'buy' && (
        <ul className="trade-list">
          {tradesFor(flags).map((t) => {
            const owned = t.get.goodPen !== undefined && (inv.goodPen ?? 0) > 0
            const ownedLamp = t.get.brightLamp !== undefined && (inv.brightLamp ?? 0) > 0
            const paid = take(inv, t.pay)
            const full = !!paid && wouldOverflow(paid, t.get)
            return (
              <li key={t.id}>
                <span className="trade-get">{names[t.id]}</span>
                <span className="trade-pay">{t.coins !== undefined ? fill(T.ui.coins, { n: t.coins }) : itemList(t.pay)}</span>
                <button disabled={owned || ownedLamp || full || !has(inv, t.pay) || (t.coins !== undefined && coins < t.coins)} onClick={() => doTrade(t)}>
                  {owned || ownedLamp ? T.ui.tradeOwned : full ? T.ui.bagFullShort : T.ui.talkTrade}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {tab === 'sell' && (
        <>
          {(Object.keys(SELL_PRICES) as ItemId[]).every((id) => (game.inv[id] ?? 0) === 0) ? (
            <p className="hint">{T.ui.sellNone}</p>
          ) : (
            <ul className="trade-list">
              {(Object.keys(SELL_PRICES) as ItemId[]).map((id) => {
                const block = canSell(game, id)
                return (
                  <li key={id}>
                    <span className="trade-get">
                      {itemName(id)} ({game.inv[id] ?? 0})
                    </span>
                    <span className="trade-pay">{fill(T.ui.sellPrice, { n: SELL_PRICES[id]! })}</span>
                    <button disabled={block !== null} onClick={() => sellItem(id)}>
                      {T.ui.tradeSell}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {jobOf(game) < SELL_FROM && <p className="hint">{T.ui.sellJob}</p>}
          {(Object.keys(SELL_PRICES) as ItemId[]).some((id) => canSell(game, id) === 'cap') && <p className="hint">{T.ui.sellCap}</p>}
        </>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
