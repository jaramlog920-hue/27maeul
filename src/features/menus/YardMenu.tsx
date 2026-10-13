// 집 둘레 살림을 눌렀을 때 (2026-10-13 사용자: 설치 해제도 — 해제하면 가방으로)
import { itemName, T } from '../../content/text'
import type { YardItem } from '../../engine/yard'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'

export function YardMenu({ item }: { item: YardItem }) {
  const { yardMove, yardStow, closeModal } = useGame.getState()
  return (
    <div className="dialog" role="dialog" aria-label={itemName(item)}>
      <h2>{itemName(item)}</h2>
      <div className="bag-detail">
        <ItemIcon id={item} size={32} />
        <p>{(T.easy.makes as Record<string, string>)[item]}</p>
      </div>
      <div className="actions menu column">
        <button onClick={() => yardMove(item)}>{T.yard.move}</button>
        <button onClick={() => yardStow(item)}>{T.yard.stow}</button>
      </div>
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
