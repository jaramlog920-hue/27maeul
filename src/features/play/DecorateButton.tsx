// [집 꾸미기] (2026-10-04): 예전 선반 창 머리의 [방 꾸미기] 단추를 메뉴 옆으로 — 집 안(새 터에서는 입주 주택 안)에 있을 때만 보인다.
// PC는 위 줄 단추들 끝, 휴대폰은 아래 조작판의 메뉴 안. 놓을 가구가 없으면 무엇을 하면 되는지 한 줄로 알려 준다
import { T } from '../../content/text'
import { playerTile } from '../../engine/game'
import { FURNITURE } from '../../engine/room'
import { inBuildingRoom, roomOf } from '../../engine/newland-rooms'
import { isHome } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { isOutdoorEditing } from '../../engine/outdoor'

export function DecorateButton({ className, role, onPick }: { className?: string; role?: string; onPick?: () => void }) {
  // 구약 터에서는 어디서든 (2026-10-14 사용자) — 방 밖이면 꾸밀 곳을 고른다
  const onNewland = useGame((s) => s.game.map === 'newland')
  const outdoor=useGame(s=>isOutdoorEditing(s.game))
  const atHome = useGame((s) => isHome(playerTile(s.game)) || inBuildingRoom(s.game)) || onNewland
  if (!atHome&&!outdoor) return null
  const click = () => {
    const { game, startDecorate, say } = useGame.getState()
    onPick?.()
    if (game.map === 'newland' && !inBuildingRoom(game)) {
      useGame.setState({ modal: { kind: 'decorPick' } })
      return
    }
    const has = FURNITURE.some((f) => (game.inv[f] ?? 0) > 0) || roomOf(game).length > 0
    if (has||outdoor) startDecorate('pick')
    else say(T.ui.decorateNone, 3200)
  }
  return (
    <button className={className} role={role} onClick={click}>
      {outdoor?'마당 꾸미기':T.ui.decorate}
    </button>
  )
}
