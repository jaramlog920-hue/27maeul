// 왕래 표식을 눌렀을 때 (계획 20 작업 3): 첫 마을 ↔ 새 터. 시간 설명 한 줄 외 안내는 없다
import { T } from '../../content/text'
import type { MapId } from '../../engine/maps'
import { newlandRevealed } from '../../engine/newland'
import { useGame } from '../../store/game-store'

export function TravelMenu({ to }: { to: MapId }) {
  const { travelTo, closeModal, lookAround, openBuild } = useGame.getState()
  const toNewland = to === 'newland'
  // 새 터 입구 표지: 땅을 둘러본 뒤에는 터 가꾸기를 연다 (필사·건축은 서로의 조건이 아니다)
  const revealed = newlandRevealed(useGame.getState().game)
  const canLook = !toNewland && !revealed
  const canBuild = !toNewland && revealed
  const title = toNewland ? T.travel.titleNewland : T.travel.titleVillage
  return (
    <div className="dialog" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <div className="actions menu column">
        <button className="primary" onClick={() => travelTo(to)}>
          {toNewland ? T.travel.toNewland : T.travel.toVillage}
        </button>
        {canLook && <button onClick={lookAround}>{T.newland.look}</button>}
        {canBuild && <button onClick={openBuild}>{T.build.open}</button>}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
