// 스물일곱 번째 책을 꽂은 날 (계획 14 작업 4): 처음의 빈 서고 그림과 지금을 잠깐 나란히, 하나님 기록 수·말씀 조각 수·
// 함께 사는 가족을 조용히 — 그리고 평소 마을로 (게임은 끝나지 않는다. 스물일곱 권 잔치는 예전처럼 잠든 다음 날 아침)
import { neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { useGame } from '../../store/game-store'
import { ShelfPicture } from './BookArt'

const S = T.shelfDone

export function ShelfDone() {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const r = game.romance
  const spouse = r?.stage === 'married' && r.partner ? neighborById(r.partner)?.role : undefined
  const family = [spouse, game.child?.name, game.companion?.name].filter((x): x is string => !!x)
  return (
    <div className="dialog shelf-done" role="dialog" aria-label={S.title}>
      <h2>{S.title}</h2>
      <p>{S.lead}</p>
      <div className="shelf-done-pair">
        <ShelfPicture shelved={{}} bound={{}} caption={S.then} />
        <ShelfPicture shelved={game.shelved} bound={game.bound} caption={S.now} />
      </div>
      <ul className="shelf-done-counts">
        <li>{fill(S.god, { n: game.godRecords.length })}</li>
        <li>{fill(S.pieces, { n: game.collected.length })}</li>
        {family.length > 0 && <li>{fill(S.family, { names: family.join(' · ') })}</li>}
      </ul>
      <div className="actions">
        <button className="primary" onClick={closeModal}>
          {S.back}
        </button>
      </div>
    </div>
  )
}
