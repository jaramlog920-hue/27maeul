// 왕래 표식을 눌렀을 때 (계획 20 작업 3): 첫 마을 ↔ 새 터. 시간 설명 한 줄 외 안내는 없다
import { T } from '../../content/text'
import type { MapId } from '../../engine/maps'
import { useGame } from '../../store/game-store'

export function TravelMenu({ to }: { to: MapId }) {
  const { travelTo, closeModal } = useGame.getState()
  const toNewland = to === 'newland'
  const title = toNewland ? T.travel.titleNewland : T.travel.titleVillage
  return (
    <div className="dialog" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <p>{T.travel.time}</p>
      <div className="actions menu column">
        <button className="primary" onClick={() => travelTo(to)}>
          {toNewland ? T.travel.toNewland : T.travel.toVillage}
        </button>
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
