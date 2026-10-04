// [집 꾸미기] (2026-10-04): 예전 선반 창 머리의 [방 꾸미기] 단추를 메뉴 옆으로 — 집 안에 있을 때만 보인다.
// PC는 위 줄 단추들 끝, 휴대폰은 아래 조작판의 메뉴 안. 놓을 가구가 없으면 무엇을 하면 되는지 한 줄로 알려 준다
import { T } from '../../content/text'
import { playerTile } from '../../engine/game'
import { FURNITURE } from '../../engine/room'
import { isHome } from '../../engine/world'
import { useGame } from '../../store/game-store'

export function DecorateButton({ className, role, onPick }: { className?: string; role?: string; onPick?: () => void }) {
  const atHome = useGame((s) => isHome(playerTile(s.game)))
  if (!atHome) return null
  const click = () => {
    const { game, startDecorate, say } = useGame.getState()
    onPick?.()
    const has = FURNITURE.some((f) => (game.inv[f] ?? 0) > 0) || game.room.length > 0
    if (has) startDecorate('pick')
    else say(T.ui.decorateNone, 3200)
  }
  return (
    <button className={className} role={role} onClick={click}>
      {T.ui.decorate}
    </button>
  )
}
