// 나루의 배: 이웃 마을 여행 (계획 13 작업 6). 고르고 → 그 마을에서 사고 → 하룻밤 묵고 돌아온다 (한꺼번에 치른다)
import { IconGrid, type IconEntry } from '../../shared/IconGrid'
import { useState } from 'react'
import { itemList, itemName, SCENES, T, ITEM_TEXT, withAnd } from '../../content/text'
import { canTrip } from '../../engine/game'
import { featureAccess, featureHint } from '../../engine/feature-rules'
import { DEST_IDS, DESTS, revisitIndex, TRIP_LEAVE_BY, tripCoinDelta, tripCost, type DestId } from '../../engine/travel'
import { sayTime } from '../../engine/clock'
import type { ItemId } from '../../engine/types'
import { partnerName, useGame } from '../../store/game-store'
import { childStage } from '../../engine/child'
import type { TripReward } from '../../engine/trip-board'
import { ItemIcon } from '../../shared/ItemIcon'
import { AuthoredStoryScene } from '../scene/AuthoredStoryScene'

/** 떠나기가 막힌 까닭 (누르면 한 줄) */
const TRIP_WHY: Record<string, string> = {
  locked: featureHint('travel', true),
  late: `여행은 ${sayTime(TRIP_LEAVE_BY)} 전에 떠날 수 있어요.`,
  wedding: '오늘은 결혼 잔치 날이에요.',
  event: '오늘은 준비한 행사가 있어요.',
  tired: '너무 지쳤어요. 쉬고 떠나요.',
  coins: '닢이 모자라요.',
  food: '길양식이 모자라요.',
  full: '가방이 가득해요.',
}

export function TravelView({ dest: back, rewards: brought }: { dest?: DestId; rewards?: TripReward[] } = {}) {
  const game = useGame((s) => s.game)
  const { goTrip, closeModal } = useGame.getState()
  const dest = back ?? null
  const [buys, setBuys] = useState<ItemId[]>([])
  const [storyPages, setStoryPages] = useState<Partial<Record<DestId, number>>>({})
  // 아이와 함께 (아기는 집에), 여행 판에서 얻은 것 (판을 마치기 전엔 null)
  const canBring = !!game.child && childStage(game.child, game.clock.day) !== 'baby'
  const [withChild, setWithChild] = useState(canBring)
  // 연인·배우자와 함께 (2026-10-21 사용자) — 데이트 한 번으로 친다
  const partnerStage = game.romance?.stage
  const canBringPartner = !!game.romance?.partner && (partnerStage === 'dating' || partnerStage === 'engaged' || partnerStage === 'married')
  const [withPartner, setWithPartner] = useState(canBringPartner)
  const rewards = brought ?? null
  const startTripBoard = useGame((s) => s.startTripBoard)
  if (!dest)
    return (
      <div className="dialog travel" role="dialog" aria-label="이웃 마을 여행">
        <h2>이웃 마을 여행</h2>
        {featureAccess(game, 'travel') === 'locked' && <p role="status">{featureHint('travel')}</p>}
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
                {/* 막혔으면 흐린 채로 두고, 누르면 까닭 한 줄 (2026-10-21 사용자: 이유 없이 흐려졌다) */}
                <button aria-disabled={block !== null} onClick={() => (block ? useGame.getState().say(TRIP_WHY[block] ?? '', 2800) : startTripBoard(id, withChild && canBring, withPartner && canBringPartner))}>
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
        {canBringPartner && (
          <label className="trip-child">
            <input type="checkbox" checked={withPartner} onChange={(e) => setWithPartner(e.target.checked)} /> {withAnd(partnerName(game))} 함께 가기
          </label>
        )}
        <div className="actions">
          <button data-close onClick={closeModal}>{T.ui.close}</button>
        </div>
      </div>
    )
  const d = DESTS[dest]
  // 먼저 그 마을 둘레를 도는 주사위 판 (새 장면으로 넘어간다)
  if (!rewards) return null
  const visits = game.flags[`trip:${dest}`] ?? 0
  const again = revisitIndex(dest, visits)
  // 처음 간 날은 그 마을 이야기, 둘째–넷째는 다시 간 날의 이야기 (같은 장면 그림에 글만 다르다)
  const story = !visits ? SCENES[`trip:${dest}`] : again !== null ? { lines: (T.tripRevisit as Record<DestId, string[][]>)[dest][again].map((text) => ({ text })) } : null
  const page = storyPages[dest] ?? 0
  if (story && page < story.lines.length) return (
    <AuthoredStoryScene id={`trip:${dest}`} title={d.name} beat={page}>
      <div className="dialog scene cinematic-scene-dialog">
        <h2>{d.name}</h2>
        <p className="scene-line narration" aria-live="polite">{story.lines[page].text}</p>
        <div className="actions"><button className="primary" onClick={() => setStoryPages(pages => ({...pages, [dest]: (pages[dest] ?? 0) + 1}))}>
          {page < story.lines.length - 1 ? T.ui.next : '가게 보기'}
        </button></div>
      </div>
    </AuthoredStoryScene>
  )
  const block = canTrip(game, dest, buys, true, rewards)
  const toggle = (id: ItemId) => setBuys(buys.includes(id) ? buys.filter((b) => b !== id) : [...buys, id])
  return (
    <div className="dialog travel" role="dialog" aria-label={d.name}>
      <h2>{d.name}</h2>
      {story ? (
        story.lines.map((l, i) => <p key={i}>{l.text}</p>)
      ) : (
        <p>낯익은 골목과 가게가 반갑게 맞아 준다.</p>
      )}
      {/* 2026-10-12 사용자: 가방처럼 아이콘 칸 — 칸을 누르면 값·설명, 단추로 담기 */}
      <IconGrid title="희귀품 가게" entries={(Object.entries(d.shop) as [ItemId, number][]).map(([id, price]): IconEntry => ({
        key: id,
        icon: <ItemIcon id={id} size={28} />,
        label: itemName(id),
        badge: buys.includes(id) ? '담음' : `${price}`,
        detail: <>{ITEM_TEXT[id]?.desc && <p>{ITEM_TEXT[id].desc}</p>}<p>{price}닢</p></>,
        action: { label: buys.includes(id) ? '빼기' : '담기', onClick: () => toggle(id) },
      }))} />
      <p>
        모두 {tripCost(d, buys)}닢 (배삯·숙박 포함) · 사용 가능한 닢 {game.coins + tripCoinDelta(rewards)} (여행 수확·추가 주사위 반영)
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
