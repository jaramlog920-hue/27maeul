// 마을 매대 (2026-10-12 사용자): 가진 물건을 날마다 언제든 판다 — 장날 상인보다 값은 조금 낮다.
// 가방처럼 아이콘 칸: 칸을 누르면 값·설명과 팔기 단추
import { fill, itemName, ITEM_TEXT, T } from '../../content/text'
import { canStandSell, standGoods, standPrice, standSoldToday, STAND_CAP } from '../../engine/sell-stand'
import { IconGrid, type IconEntry } from '../../shared/IconGrid'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'

export function SellStandView() {
  const game = useGame((s) => s.game)
  const { closeModal, standSellItem } = useGame.getState()
  const left = STAND_CAP - standSoldToday(game)
  const entries = standGoods(game).map((id): IconEntry => ({
    key: id,
    icon: <ItemIcon id={id} size={28} />,
    label: itemName(id),
    badge: `${game.inv[id] ?? 0}`,
    dim: !!canStandSell(game, id),
    detail: (
      <>
        {ITEM_TEXT[id]?.desc && <p>{ITEM_TEXT[id].desc}</p>}
        <p>{fill(T.ui.coins, { n: standPrice(game, id)! })}</p>
      </>
    ),
    action: { label: '팔기', why: canStandSell(game, id) === 'cap' ? '오늘은 매대에 더 내놓을 수 없어요. 내일 다시 와요.' : canStandSell(game, id) ? '' : null, onClick: () => standSellItem(id) },
  }))
  return (
    <div className="dialog" role="dialog" aria-label="마을 매대">
      <h2>마을 매대</h2>
      <p className="hint">가진 닢 {game.coins} · 오늘 {left}개 더</p>
      <IconGrid entries={entries} emptyText="넘길 물건이 없어요." />
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
