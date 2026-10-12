import { featureAccess, featureHint } from '../../engine/feature-rules'
import { useState } from 'react'
import { FURNITURE_DEFS } from '../../engine/furniture-defs'
import { ICONS } from '../../render/sprites'
import { ItemIcon } from '../../shared/ItemIcon'
import type { Trade } from '../../engine/game'
import { fill, itemName, ITEM_TEXT, T } from '../../content/text'
import { ArtIcon, IconGrid, NeedList, type IconEntry } from '../../shared/IconGrid'
import { canBuyRare, canBuyScroll, SCROLL_PRICE, overflows, ownsTradeTool, RARE_PRICES, rareStall, tradeOnMarket, tradesFor } from '../../engine/game'
import { canSell, SELL_CAP, SELL_PRICES, sellPrice, soldToday } from '../../engine/merchant-selling'
import { isMarketDay } from '../../engine/calendar'
import { CONTENT } from '../../content/catalog'
import { has, take } from '../../engine/items'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'

/** 사기 목록을 넷으로 묶는다: 재료, 도구·살림, 가구·장식, 이번 장날의 생활 가구 */
type Group = 'stuff' | 'tools' | 'decor' | 'home'
const GROUP_LABEL: Record<Group, string> = { stuff: '재료', tools: '도구 · 살림', decor: '가구 · 장식', home: '이번 장날 생활 가구' }
function groupOf(t: Trade): Group {
  if (t.id.startsWith('add:')) return 'home'
  const got = Object.keys(t.get) as ItemId[]
  if (got.some((id) => FURNITURE_DEFS[id])) return 'decor'
  if (t.grants || t.coins !== undefined) return 'tools'
  return 'stuff'
}

/** 아이템 그림이 없는 설치물(빗물 항아리)의 칸 그림 — 마을 그림(decor.ts rainJar)과 같은 모양 */
const GRANT_ART: Record<string, readonly string[]> = {
  rainJar: [
    '................',
    '................',
    '................',
    '...bbwwwwwwbb...',
    '...bbwwwwwwbb...',
    '...bbbbbbbbbb...',
    '....aaaaaaaa....',
    '....ahhaaaaa....',
    '....ahhaaaaa....',
    '....ahhaaaaa....',
    '....aaaaaaaa....',
    '....abbbbbba....',
    '....abbbbbba....',
    '...ssssssssss...',
    '...ssssssssss...',
    '................',
  ],
}
const GRANT_PAL = { a: '#e79b77', b: '#d08263', h: '#f8ba9c', w: '#99d7c9', s: 'rgba(40,25,10,0.22)' }

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
  const buyScroll = useGame((s) => s.buyScroll)
  const names = T.trades as Record<string, string>
  const descOf = (id: ItemId | null) => (id ? ITEM_TEXT[id]?.desc : undefined)
  // 2026-10-12 사용자: 줄줄이 늘어놓지 않고 가방처럼 아이콘 칸 — 누르면 값·설명, 단추로 사고팔기
  const buyEntry = (t: Trade): IconEntry => {
    const owned = ownsTradeTool(inv, t, flags)
    const locked = !!t.grants && featureAccess(game, 'convenience') !== 'full'
    const paid = take(inv, t.pay)
    // 재료 궤짝이 있으면 궤짝까지 친다
    const full = !!paid && overflows({ ...game, inv: paid }, t.get)
    const icon = tradeIcon(t)
    const disabled = locked || owned || full || !has(inv, t.pay) || (t.coins !== undefined && coins < t.coins)
    return {
      key: t.id,
      icon: icon ? <ItemIcon id={icon} size={28} /> : t.grants && GRANT_ART[t.grants] ? <ArtIcon rows={GRANT_ART[t.grants]} palette={GRANT_PAL} /> : <span aria-hidden="true">·</span>,
      label: names[t.id],
      badge: t.coins !== undefined ? `${t.coins}` : undefined,
      dim: disabled,
      detail: (
        <>
          {descOf(icon) && <p>{descOf(icon)}</p>}
          {t.coins !== undefined ? <p>{fill(T.ui.coins, { n: t.coins })} · 가진 닢 {coins}</p> : <NeedList needs={t.pay as Record<string, number>} have={(id) => inv[id as ItemId] ?? 0} icon={(id) => <ItemIcon id={id as ItemId} size={16} />} />}
          {locked && <p>{featureHint('convenience')}</p>}
        </>
      ),
      action: { label: owned ? T.ui.tradeOwned : full ? T.ui.bagFullShort : t.coins !== undefined ? T.ui.tradeBuy : T.ui.talkTrade, disabled, onClick: () => doTrade(t) },
    }
  }
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
        <>
          <p className="hint">가진 닢 {coins}</p>
          {(['stuff', 'tools', 'decor', 'home'] as Group[]).map((g) => (
            <IconGrid key={g} title={GROUP_LABEL[g]} entries={tradesFor(flags).filter((t) => groupOf(t) === g && tradeOnMarket(t, game.clock.day)).map(buyEntry)} />
          ))}
        </>
      )}
      {tab === 'rare' && (
        <>
          <p className="hint">가진 닢 {coins}</p>
          <IconGrid
            entries={[
              ...scrollEntry(game, buyScroll),
              ...rareStall(game.clock.day).map((id): IconEntry => {
                const block = canBuyRare(game, id)
                return {
                  key: id,
                  icon: <ItemIcon id={id} size={28} />,
                  label: itemName(id),
                  badge: `${RARE_PRICES[id]}`,
                  dim: block !== null,
                  detail: <>{descOf(id) && <p>{descOf(id)}</p>}<p>{fill(T.ui.coins, { n: RARE_PRICES[id]! })}</p></>,
                  action: { label: block === 'bought' ? '샀어요' : block === 'full' ? T.ui.bagFullShort : T.ui.tradeBuy, disabled: block !== null, onClick: () => buyRareItem(id) },
                }
              }),
            ]}
          />
        </>
      )}
      {tab === 'sell' && (
        <>
          <p className="hint" role="status">
            {!isMarketDay(game.clock.day) ? '상인에게는 장날에 팔 수 있어요.' : soldToday(game) >= SELL_CAP ? `오늘은 ${SELL_CAP}개를 모두 팔았어요. 다음 장날에 다시 팔 수 있어요.` : `오늘 팔 수 있는 물건 ${SELL_CAP - soldToday(game)}개 · 가진 닢 ${coins}`}
          </p>
          <IconGrid
            emptyText={T.ui.sellNone}
            entries={(Object.keys(SELL_PRICES) as ItemId[]).filter((id) => (inv[id] ?? 0) > 0).map((id): IconEntry => {
              const block = canSell(game, id)
              return {
                key: id,
                icon: <ItemIcon id={id} size={28} />,
                label: itemName(id),
                badge: `${inv[id] ?? 0}`,
                dim: block !== null,
                detail: <>{descOf(id) && <p>{descOf(id)}</p>}<p>{fill(T.ui.sellPrice, { n: sellPrice(game, id)! })}</p></>,
                action: { label: T.ui.tradeSell, disabled: block !== null, onClick: () => sellItem(id) },
              }
            })}
          />
        </>
      )}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 떠돌이 상인의 옛 두루마리: 장날마다 두 개까지, 사면 지금 책의 다음 이야기 */
function scrollEntry(game: Parameters<typeof canBuyScroll>[0], buyScroll: () => void): IconEntry[] {
  const block = canBuyScroll(game, CONTENT)
  if (block === 'notMarket') return []
  return [{
    key: 'scroll',
    icon: <span className="scroll-icon" aria-hidden="true">📜</span>,
    label: '다른 마을에서 온 옛 사본 (다음 대목)',
    badge: `${SCROLL_PRICE}`,
    dim: block !== null,
    detail: <><p>지금 책의 다음 대목 하나.</p><p>{fill(T.ui.coins, { n: SCROLL_PRICE })}</p></>,
    action: { label: block === 'done' ? '다 샀어요' : block === 'noPiece' ? '없음' : T.ui.tradeBuy, disabled: block !== null, onClick: buyScroll },
  }]
}
