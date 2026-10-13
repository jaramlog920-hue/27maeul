// 구약 터에서 [가구 배치]를 누르면 (2026-10-14 사용자: 구약에서 메뉴를 누르면 가구 배치를 다 할 수 있게) — 꾸밀 곳을 고르면 그 방으로 들어간다
import { fill, T } from '../../content/text'
import { ROOM_SLOTS } from '../../engine/newland-config'
import { homeAtSlot } from '../../engine/newland-rooms'
import { useGame } from '../../store/game-store'

export function DecorPick() {
  const game = useGame((s) => s.game)
  const { decorateAt, closeModal } = useGame.getState()
  const homes = ROOM_SLOTS.map((_, i) => i).filter((i) => homeAtSlot(game, i))
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.decorPick}>
      <h2>{T.ui.decorPick}</h2>
      <div className="actions menu column">
        <button onClick={() => decorateAt('archive')}>{T.ui.decorArchive}</button>
        {homes.map((i, n) => (
          <button key={i} onClick={() => decorateAt(i)}>{fill(T.ui.decorHome, { n: n + 1 })}</button>
        ))}
      </div>
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
