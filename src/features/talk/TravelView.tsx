// 나루의 배: 이웃 마을 여행 (계획 13 작업 6). 고르고 → 그 마을에서 사고 → 하룻밤 묵고 돌아온다 (한꺼번에 치른다)
import { useState } from 'react'
import { itemList, itemName, SCENES, T } from '../../content/text'
import { canTrip } from '../../engine/game'
import { DEST_IDS, DESTS, tripCost, type DestId } from '../../engine/travel'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { ItemIcon } from '../../shared/ItemIcon'

const WHY: Record<string, string> = {
  late: '여행은 아침에 떠나요. 정오가 지났어요.',
  tired: '너무 지쳐서 먼 길을 갈 수 없어요.',
  coins: '닢이 모자라요.',
  food: '길에서 먹을 것이 모자라요.',
  full: '가방이 가득 찼어요.',
}

export function TravelView() {
  const game = useGame((s) => s.game)
  const { goTrip, closeModal } = useGame.getState()
  const [dest, setDest] = useState<DestId | null>(null)
  const [buys, setBuys] = useState<ItemId[]>([])
  if (!dest)
    return (
      <div className="dialog travel" role="dialog" aria-label="이웃 마을 여행">
        <h2>이웃 마을 여행</h2>
        <p className="hint">아침에 떠나 하룻밤 묵고 다음 날 아침 돌아와요. · 가진 닢 {game.coins}</p>
        <ul className="trade-list">
          {DEST_IDS.map((id) => {
            const d = DESTS[id]
            const block = canTrip(game, id)
            const visits = game.flags[`trip:${id}`] ?? 0
            return (
              <li key={id}>
                <span className="trade-get">
                  <strong>{d.name}</strong> · {d.way}
                  {visits ? ` · ${visits}번 가 봄` : ''}
                </span>
                <span className="trade-pay">
                  {d.fare ? `배삯 ${d.fare}닢 · ` : ''}
                  {Object.keys(d.food).length ? `길양식 ${itemList(d.food)} · ` : ''}
                  숙박 {d.lodging}닢
                </span>
                <button disabled={block !== null} onClick={() => setDest(id)}>
                  떠나기
                </button>
              </li>
            )
          })}
        </ul>
        {DEST_IDS.every((id) => canTrip(game, id) !== null) && <p className="hint">{WHY[canTrip(game, DEST_IDS[0]) ?? ''] ?? ''}</p>}
        <div className="actions">
          <button onClick={closeModal}>{T.ui.close}</button>
        </div>
      </div>
    )
  const d = DESTS[dest]
  const first = !game.flags[`trip:${dest}`]
  const story = first ? SCENES[`trip:${dest}`] : null
  const block = canTrip(game, dest, buys)
  const toggle = (id: ItemId) => setBuys(buys.includes(id) ? buys.filter((b) => b !== id) : [...buys, id])
  return (
    <div className="dialog travel" role="dialog" aria-label={d.name}>
      <h2>{d.name}</h2>
      {story ? (
        story.lines.map((l, i) => <p key={i}>{l.text}</p>)
      ) : (
        <p>낯익은 골목과 가게가 반갑게 맞아 준다.</p>
      )}
      <h3>희귀품 가게</h3>
      <p className="hint">한 가지씩 하나만 살 수 있어요.</p>
      <ul className="trade-list">
        {(Object.entries(d.shop) as [ItemId, number][]).map(([id, price]) => (
          <li key={id} className="with-icon">
            <span className="trade-icon">
              <ItemIcon id={id} />
            </span>
            <span className="trade-get">{itemName(id)}</span>
            <span className="trade-pay">{price}닢</span>
            <button className={buys.includes(id) ? 'primary' : ''} aria-pressed={buys.includes(id)} onClick={() => toggle(id)}>
              {buys.includes(id) ? '담음' : '담기'}
            </button>
          </li>
        ))}
      </ul>
      <p>
        모두 {tripCost(d, buys)}닢 (배삯·숙박 포함) · 가진 닢 {game.coins}
      </p>
      {block && <p className="hint">{WHY[block]}</p>}
      <div className="actions">
        <button onClick={() => setDest(null)}>{T.ui.back}</button>
        <button className="primary" disabled={block !== null} onClick={() => goTrip(dest, buys)}>
          하룻밤 묵고 돌아가기
        </button>
      </div>
    </div>
  )
}
