// [터 가꾸기] (2026-10-14 사용자: 구약에서는 터 가꾸기도 메뉴에) — 새 터에서 땅을 둘러본 뒤, 건물 방 밖에 있을 때 보인다.
// 예전엔 왕래 표식을 눌러야만 열렸다 (그 길도 그대로 둔다)
import { T } from '../../content/text'
import { newlandRevealed } from '../../engine/newland'
import { inBuildingRoom } from '../../engine/newland-rooms'
import { useGame } from '../../store/game-store'

export function BuildButton({ className, role, onPick }: { className?: string; role?: string; onPick?: () => void }) {
  const show = useGame((s) => s.game.map === 'newland' && newlandRevealed(s.game) && !inBuildingRoom(s.game))
  if (!show) return null
  return (
    <button className={className} role={role} onClick={() => { onPick?.(); useGame.getState().openBuild() }}>
      {T.build.open}
    </button>
  )
}
