// 나루의 배: 이웃 마을 여행 (계획 13 작업 6). 고르고 → 그 마을에서 사고 → 하룻밤 묵고 돌아온다 (한꺼번에 치른다)
import { useState } from 'react'
import { itemList, itemName, SCENES, T } from '../../content/text'
import { canTrip } from '../../engine/game'
import { DEST_IDS, DESTS, tripCost, type DestId } from '../../engine/travel'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { childStage } from '../../engine/child'
import type { TripReward } from '../../engine/trip-board'
import { ItemIcon } from '../../shared/ItemIcon'

export function TravelView({ dest: back, rewards: brought }: { dest?: DestId; rewards?: TripReward[] } = {}) {
  const game = useGame((s) => s.game)
  const { goTrip, closeModal } = useGame.getState()
  const dest = back ?? null
  const [buys, setBuys] = useState<ItemId[]>([])
  // 아이와 함께 (아기는 집에), 여행 판에서 얻은 것 (판을 마치기 전엔 null)
  const canBring = !!game.child && childStage(game.child, game.clock.day) !== 'baby'
  const [withChild, setWithChild] = useState(canBring)
  const rewards = brought ?? null
  const startTripBoard = useGame((s) => s.startTripBoard)
  if (!dest)
    return (
      <div className="dialog travel" role="dialog" aria-label="이웃 마을 여행">
        <h2>이웃 마을 여행</h2>
        <p className="hint">가진 닢 {game.coins}</p>
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
                <button disabled={block !== null} onClick={() => startTripBoard(id, withChild && canBring)}>
                  떠나기
                </button>
              </li>
            )
          })}
        </ul>
        {canBring && (
          <label className="trip-child">
            <input type="checkbox" checked={withChild} onChange={(e) => setWithChild(e.target.checked)} /> {game.child!.name} 데리고 가기
          </label>
        )}
        <div className="actions">
          <button onClick={closeModal}>{T.ui.close}</button>
        </div>
      </div>
    )
  const d = DESTS[dest]
  // 먼저 그 마을 둘레를 도는 주사위 판 (새 장면으로 넘어간다)
  if (!rewards) return null
  const first = !game.flags[`trip:${dest}`]
  const story = first ? SCENES[`trip:${dest}`] : null
  const block = canTrip(game, dest, buys, true)
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
      <div className="actions">
        <button className="primary" disabled={block !== null} onClick={() => goTrip(dest, buys, rewards)}>
          하룻밤 묵고 돌아가기
        </button>
        {/* 고른 물건 때문에 못 돌아가면, 아무것도 안 사고 돌아가는 길은 늘 열려 있다 */}
        {block !== null && buys.length > 0 && <button onClick={() => goTrip(dest, [], rewards)}>사지 않고 돌아가기</button>}
      </div>
    </div>
  )
}
