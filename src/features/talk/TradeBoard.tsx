import { itemList, T } from '../../content/text'
import { tradesFor, wouldOverflow } from '../../engine/game'
import { has, take } from '../../engine/items'
import { useGame } from '../../store/game-store'

export function TradeBoard() {
  const inv = useGame((s) => s.game.inv)
  const flags = useGame((s) => s.game.flags)
  const { doTrade, closeModal } = useGame.getState()
  const names = T.trades as Record<string, string>
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.tradeTitle}>
      <h2>{T.ui.tradeTitle}</h2>
      <ul className="trade-list">
        {tradesFor(flags).map((t) => {
          const owned = t.get.goodPen !== undefined && (inv.goodPen ?? 0) > 0
          const paid = take(inv, t.pay)
          const full = !!paid && wouldOverflow(paid, t.get)
          return (
            <li key={t.id}>
              <span className="trade-get">{names[t.id]}</span>
              <span className="trade-pay">{itemList(t.pay)}</span>
              <button disabled={owned || full || !has(inv, t.pay)} onClick={() => doTrade(t)}>
                {owned ? T.ui.tradeOwned : full ? T.ui.bagFullShort : T.ui.talkTrade}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
