import { Fragment, useState } from 'react'
import { FURNITURE_DEFS } from '../../engine/furniture-defs'
import { ICONS } from '../../render/sprites'
import { ItemIcon } from '../../shared/ItemIcon'
import type { Trade } from '../../engine/game'
import { fill, itemList, itemName, T } from '../../content/text'
import { canBuyRare, canSell, overflows, ownsTradeTool, RARE_PRICES, rareStall, SELL_PRICES, sellPrice, tradesFor } from '../../engine/game'
import { jobOf, SELL_FROM } from '../../engine/job'
import { has, take } from '../../engine/items'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'

/** 사기 목록을 셋으로 묶는다: 재료, 도구·살림, 가구·장식 */
type Group = 'stuff' | 'tools' | 'decor'
const GROUP_LABEL: Record<Group, string> = { stuff: '재료', tools: '도구 · 살림', decor: '가구 · 장식' }
function groupOf(t: Trade): Group {
  const got = Object.keys(t.get) as ItemId[]
  if (got.some((id) => FURNITURE_DEFS[id])) return 'decor'
  if (t.grants || t.coins !== undefined) return 'tools'
  return 'stuff'
}

/** 좌판 줄 왼쪽의 물건 아이콘 (받는 물건, 설치물이면 그 설치물) */
function tradeIcon(t: Trade): ItemId | null {
  const got = Object.keys(t.get)[0] as ItemId | undefined
  if (got) return got
  return t.grants && ICONS[t.grants] ? (t.grants as ItemId) : null
}

export function TradeBoard() {
  const [tab, setTab] = useState<'buy' | 'rare' | 'sell'>('buy')
  const game = useGame((s) => s.game)
  const inv = game.inv
  const flags = game.flags
  const coins = game.coins
  const { doTrade, sellItem, buyRareItem, closeModal } = useGame.getState()
  const names = T.trades as Record<string, string>
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.tradeTitle}>
      <h2>{T.ui.tradeTitle}</h2>
      <div className="actions">
        <button disabled={tab === 'buy'} onClick={() => setTab('buy')}>
          {T.ui.tradeBuy}
        </button>
        <button disabled={tab === 'rare'} onClick={() => setTab('rare')}>
          희귀 좌판
        </button>
        <button disabled={tab === 'sell'} onClick={() => setTab('sell')}>
          {T.ui.tradeSell}
        </button>
      </div>
      {tab === 'buy' && (
        <ul className="trade-list">
          {(['stuff', 'tools', 'decor'] as Group[]).map((g) => (
            <Fragment key={g}>
              <li className="trade-group">{GROUP_LABEL[g]}</li>
              {tradesFor(flags)
                .filter((t) => groupOf(t) === g)
                .map((t) => {
                  const owned = ownsTradeTool(inv, t, flags)
                  const paid = take(inv, t.pay)
                  // 재료 궤짝이 있으면 궤짝까지 친다
                  const full = !!paid && overflows({ ...game, inv: paid }, t.get)
                  return (
                    <li key={t.id} className="with-icon">
                      <span className="trade-icon">{tradeIcon(t) && <ItemIcon id={tradeIcon(t)!} />}</span>
                      <span className="trade-get">{names[t.id]}</span>
                      <span className="trade-pay">{t.coins !== undefined ? fill(T.ui.coins, { n: t.coins }) : itemList(t.pay)}</span>
                      <button disabled={owned || full || !has(inv, t.pay) || (t.coins !== undefined && coins < t.coins)} onClick={() => doTrade(t)}>
                        {owned ? T.ui.tradeOwned : full ? T.ui.bagFullShort : t.coins !== undefined ? T.ui.tradeBuy : T.ui.talkTrade}
                      </button>
                    </li>
                  )
                })}
            </Fragment>
          ))}
        </ul>
      )}
      {tab === 'rare' && (
        <>
          <p className="hint">장날마다 희귀품 셋이 돌아가며 나와요. 한 가지씩 하나만 살 수 있어요. · 가진 닢 {coins}</p>
          <ul className="trade-list">
            {rareStall(game.clock.day).map((id) => {
              const block = canBuyRare(game, id)
              return (
                <li key={id} className="with-icon">
                  <span className="trade-icon">
                    <ItemIcon id={id} />
                  </span>
                  <span className="trade-get">{itemName(id)}</span>
                  <span className="trade-pay">{fill(T.ui.coins, { n: RARE_PRICES[id]! })}</span>
                  <button disabled={block !== null} onClick={() => buyRareItem(id)}>
                    {block === 'bought' ? '샀어요' : block === 'full' ? T.ui.bagFullShort : T.ui.tradeBuy}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
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
                  <li key={id} className="with-icon">
                    <span className="trade-icon">
                      <ItemIcon id={id} />
                    </span>
                    <span className="trade-get">
                      {itemName(id)} ({game.inv[id] ?? 0})
                    </span>
                    <span className="trade-pay">{fill(T.ui.sellPrice, { n: sellPrice(game, id)! })}</span>
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
